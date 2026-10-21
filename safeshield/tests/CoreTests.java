package app.safeshield;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** No Android, live adult page, network service, JUnit, or Gradle required. */
public final class CoreTests {
    private static int checks;
    private static void check(boolean value,String name){if(!value)throw new AssertionError(name);checks++;System.out.println("PASS  "+name);}
    private static byte[] query(String domain,int type)throws Exception{
        ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(new byte[]{0x12,0x34,1,0,0,1,0,0,0,0,0,0});
        for(String label:domain.split("\\.")){byte[] b=label.getBytes(StandardCharsets.US_ASCII);out.write(b.length);out.write(b);}out.write(0);out.write(type>>8);out.write(type);out.write(0);out.write(1);return out.toByteArray();
    }
    private static byte[] packet(byte[] query){byte[] b=new byte[28+query.length];b[0]=0x45;b[9]=17;b[8]=64;Dns.put16(b,2,b.length);Dns.put16(b,20,45678);Dns.put16(b,22,53);Dns.put16(b,24,query.length+8);b[12]=10;b[13]=111;b[15]=1;b[16]=10;b[17]=111;b[19]=2;System.arraycopy(query,0,b,28,query.length);return b;}
    private interface Attempt{void run()throws Exception;}
    private static void rejects(Attempt a,String name){try{a.run();throw new AssertionError(name);}catch(IOException expected){checks++;System.out.println("PASS  "+name);}catch(Exception e){throw new AssertionError(name,e);}}
    public static void main(String[] args)throws Exception{
        DomainRules rules=DomainRules.read(new StringReader("# hosts\n0.0.0.0 pornhub.com\n127.0.0.1 xvideos.com www.xvideos.com\nexample.org # comment\nlocalhost\n0.0.0.0\n"));
        check(rules.size()==4,"hosts parsing, comments and invalid names");
        check(rules.blocks("pornhub.com"),"known adult-domain seed match");
        check(rules.blocks("deep.www.pornhub.com"),"adult subdomain suffix match");
        check(rules.blocks("WWW.PORNHUB.COM."),"case and trailing-dot normalization");
        check(!rules.blocks("notpornhub.com"),"no substring false positive");
        check(!rules.blocks("pornhub.com.example.net"),"no suffix-spoof false positive");
        check(!rules.blocks("example.com"),"unlisted domain allowed locally");
        check(DomainRules.normalize("bücher.example").equals("xn--bcher-kva.example"),"IDN normalization");
        check(DomainRules.normalize("https://example.com/path").isEmpty(),"URLs rejected as domains");
        check(DomainRules.normalize("bad..example").isEmpty(),"empty label rejected");
        byte[] q=query("www.pornhub.com",1);
        Dns.Question parsed=Dns.question(q);check(parsed.name.equals("www.pornhub.com")&&parsed.type==1,"DNS question parse");
        byte[] denied=Dns.reply(q,3);check(Dns.validResponse(q,denied)&&(denied[3]&15)==3,"NXDOMAIN denial retains question and ID");
        check(!Dns.blockedAnswer(denied),"ordinary NXDOMAIN not attributed to family filter");
        byte[] safe=Dns.safeSearch(query("www.google.com",1));check(safe[safe.length-4]==(byte)216&&safe[safe.length-1]==120&&Dns.u16(safe,6)==1,"Google official SafeSearch A mapping");
        check(Dns.u16(Dns.safeSearch(query("www.google.com",28)),6)==0,"SafeSearch AAAA returns NODATA");
        check(Dns.ttl(safe)==60,"response TTL extraction");
        byte[] zero=safe.clone();Arrays.fill(zero,zero.length-4,zero.length,(byte)0);check(Dns.blockedAnswer(zero),"family zero-address filtering indicator");
        byte[] changed=denied.clone();changed[1]++;check(!Dns.validResponse(q,changed),"wrong response ID rejected");
        changed=denied.clone();changed[2]|=2;check(!Dns.validResponse(q,changed),"truncated response rejected");
        byte[] queryLoop=new byte[]{1,2,1,0,0,1,0,0,0,0,0,0,(byte)192,12,0,1,0,1};rejects(()->Dns.question(queryLoop),"compression pointer loop bounded");
        rejects(()->Dns.question(new byte[3]),"short DNS packet rejected");
        byte[] multiple=q.clone();multiple[5]=2;rejects(()->Dns.question(multiple),"multiple questions rejected");
        byte[] wire=packet(q);check(Arrays.equals(q,Dns.udpQuery(wire,wire.length)),"UDP DNS extraction");
        byte[] fragmented=wire.clone();fragmented[6]=0x20;rejects(()->Dns.udpQuery(fragmented,fragmented.length),"fragmented IPv4 rejected");
        byte[] wrongLength=wire.clone();wrongLength[25]++;rejects(()->Dns.udpQuery(wrongLength,wrongLength.length),"invalid UDP length rejected");
        byte[] notDns=wire.clone();notDns[23]=80;rejects(()->Dns.udpQuery(notDns,notDns.length),"non-DNS packets rejected");
        byte[] reply=Dns.udpReply(wire,denied);check(Dns.u16(reply,20)==53&&Dns.u16(reply,22)==45678&&reply[15]==2&&reply[19]==1,"reply reverses addresses and ports");
        int sum=0;for(int i=0;i<20;i+=2)sum+=Dns.u16(reply,i);while(sum>65535)sum=(sum&65535)+(sum>>16);check(sum==65535,"reply IPv4 checksum");
        DnsCache cache=new DnsCache();byte[] google=query("www.google.com",1);cache.put(google,safe);byte[] newId=google.clone();newId[0]=99;check(cache.get(newId)[0]==99,"cache keyed independently of transaction ID");
        byte[] returned=cache.get(google);returned[0]=0;check(cache.get(google)[0]==google[0],"cache returns defensive copy");
        cache.clear();check(cache.get(google)==null,"network/update cache invalidation");
        byte[] noCache=safe.clone();int ttlOffset=Dns.question(noCache).end+6;Arrays.fill(noCache,ttlOffset,ttlOffset+4,(byte)0);cache.put(google,noCache);check(cache.get(google)==null,"zero TTL is not cached");
        cache.put(q,denied);check(cache.get(q)==null,"negative answers not cached");
        for(int i=0;i<300;i++){byte[] k=query("n"+i+".google.com",1);cache.put(k,Dns.safeSearch(k));}check(cache.get(query("n0.google.com",1))==null,"cache bounded to 256 entries");
        Random random=new Random(12345);for(int i=0;i<10000;i++){byte[] fuzz=new byte[random.nextInt(256)];random.nextBytes(fuzz);try{Dns.question(fuzz);}catch(IOException expected){}Dns.validResponse(q,fuzz);Dns.ttl(fuzz);Dns.blockedAnswer(fuzz);}
        check(true,"10,000 deterministic malformed-input cases do not escape parser bounds");
        System.out.println("\n"+checks+" checks passed.");
    }
}
