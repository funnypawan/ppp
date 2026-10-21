package app.safeshield;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Bounded wire parser for single-question DNS and IPv4 UDP. Never examines web traffic. */
public final class Dns {
    public static int u16(byte[] b, int p) { return ((b[p]&255)<<8)|(b[p+1]&255); }
    static void put16(byte[] b, int p, int v) { b[p]=(byte)(v>>8); b[p+1]=(byte)v; }
    public static final class Question {
        public final String name; public final int type, end;
        Question(String n, int t, int e) { name=n; type=t; end=e; }
    }
    public static Question question(byte[] b) throws IOException {
        if (b.length<17 || u16(b,4)!=1 || (b[2]&0x78)!=0) throw new IOException("Unsupported DNS header");
        int[] p = {12};
        String name=readName(b,p);
        if (p[0]+4>b.length || u16(b,p[0]+2)!=1) throw new IOException("Invalid question");
        return new Question(name,u16(b,p[0]),p[0]+4);
    }
    static String readName(byte[] b,int[] cursor) throws IOException {
        StringBuilder name=new StringBuilder();
        int p=cursor[0], next=-1, steps=0;
        while (true) {
            if (p>=b.length || ++steps>128) throw new IOException("Invalid DNS name");
            int len=b[p++]&255;
            if ((len&192)==192) {
                if (p>=b.length) throw new IOException("Short pointer");
                if (next<0) next=p+1;
                p=((len&63)<<8)|(b[p]&255); continue;
            }
            if (len==0) break;
            if (len>63 || p+len>b.length) throw new IOException("Invalid label");
            if (name.length()>0) name.append('.');
            for (int i=0;i<len;i++) { int c=b[p++]&255; if(c<33 || c>126 || c=='.') throw new IOException("Invalid label byte"); name.append((char)c); }
            if(name.length()>253) throw new IOException("Name too long");
        }
        cursor[0]=next<0?p:next;
        return name.toString().toLowerCase(Locale.ROOT);
    }
    public static byte[] reply(byte[] query, int code) throws IOException {
        Question q=question(query);
        // Re-encode names, so compressed requests cannot leave dangling pointers.
        ByteArrayOutputStream out=new ByteArrayOutputStream();
        byte[] header=new byte[12]; header[0]=query[0];header[1]=query[1];header[2]=(byte)(0x80|(query[2]&1));header[3]=(byte)(0x80|code);header[5]=1;
        out.write(header);
        for(String s:q.name.split("\\.")) { byte[] label=s.getBytes(StandardCharsets.US_ASCII); out.write(label.length);out.write(label); }
        out.write(0);out.write(q.type>>8);out.write(q.type);out.write(0);out.write(1);
        return out.toByteArray();
    }
    public static byte[] safeSearch(byte[] query) throws IOException {
        Question q=question(query);
        byte[] base=reply(query,0);
        if(q.type!=1) return base; // NODATA for AAAA/HTTPS avoids alternate Google addresses.
        ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(base);
        out.write(new byte[]{(byte)0xc0,12,0,1,0,1,0,0,0,60,0,4,(byte)216,(byte)239,38,120});
        byte[] result=out.toByteArray();result[7]=1;return result;
    }
    public static boolean validResponse(byte[] query,byte[] response) {
        try {
            Question a=question(query), b=question(response);
            return response.length<=4096 && response[0]==query[0] && response[1]==query[1] && (response[2]&128)!=0 && (response[2]&2)==0 && a.name.equals(b.name) && a.type==b.type;
        } catch(Exception e) { return false; }
    }
    public static boolean blockedAnswer(byte[] response) {
        try {
            if((response[3]&15)==3) return false; // NXDOMAIN alone doesn't prove a provider block.
            Question q=question(response);int[] p={q.end};
            for(int i=0;i<u16(response,6);i++) {
                readName(response,p);int s=p[0];if(s+10>response.length)return false;
                int type=u16(response,s),len=u16(response,s+8);p[0]=s+10+len;
                if(p[0]>response.length)return false;
                if ((type==1 && len==4)||(type==28&&len==16)) {
                    boolean zero=true;for(int j=s+10;j<p[0];j++)if(response[j]!=0)zero=false;
                    if(zero)return true;
                }
            }
        } catch(Exception ignored) { }
        return false;
    }
    public static long ttl(byte[] response) {
        try {
            if((response[3]&15)!=0 || u16(response,6)==0)return 0;
            int[] p={question(response).end};long min=60;
            int count=u16(response,6)+u16(response,8)+u16(response,10);
            for(int i=0;i<count;i++) {
                readName(response,p);int s=p[0];if(s+10>response.length)return 0;
                int type=u16(response,s);long t=((long)u16(response,s+4)<<16)|u16(response,s+6);
                if(type!=41)min=Math.min(min,t);
                p[0]=s+10+u16(response,s+8);if(p[0]>response.length)return 0;
            }
            return min;
        } catch(Exception e){return 0;}
    }
    public static byte[] udpQuery(byte[] packet,int length) throws IOException {
        if(length<28 || (packet[0]&255)!=0x45 || packet[9]!=17 || (u16(packet,6)&0x3fff)!=0)throw new IOException("Not unfragmented IPv4 UDP");
        int total=u16(packet,2), udp=u16(packet,24);
        if(total>length || total<28 || udp<8 || udp!=total-20 || u16(packet,22)!=53)throw new IOException("Invalid UDP");
        if(packet[16]!=10 || packet[17]!=111 || packet[18]!=0 || packet[19]!=2)throw new IOException("Not our DNS address");
        return Arrays.copyOfRange(packet,28,total);
    }
    public static byte[] udpReply(byte[] request,byte[] dns) {
        byte[] result=new byte[28+dns.length];result[0]=0x45;put16(result,2,result.length);result[8]=64;result[9]=17;
        System.arraycopy(request,16,result,12,4);System.arraycopy(request,12,result,16,4);
        put16(result,20,53);put16(result,22,u16(request,20));put16(result,24,8+dns.length);
        System.arraycopy(dns,0,result,28,dns.length);
        int sum=0;for(int i=0;i<20;i+=2)sum+=u16(result,i);while((sum>>16)!=0)sum=(sum&65535)+(sum>>16);put16(result,10,~sum);
        // Zero UDP checksum is valid for IPv4.
        return result;
    }
    public static String key(byte[] query) { byte[] copy=query.clone();copy[0]=0;copy[1]=0;return Base64.getEncoder().encodeToString(copy); }
}
