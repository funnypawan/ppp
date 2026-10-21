package app.safeshield;
import java.util.*;
public final class DnsCache {
    private static final class Entry { byte[] data;long until,created;Entry(byte[] d,long c,long u){data=d.clone();created=c;until=u;} }
    private final Map<String,Entry> cache=new LinkedHashMap<String,Entry>(256,.75f,true){protected boolean removeEldestEntry(Map.Entry<String,DnsCache.Entry> e){return size()>256;}};
    public synchronized byte[] get(byte[] query) {
        Entry e=cache.get(Dns.key(query));long now=System.nanoTime();
        if(e==null)return null;if(e.until<=now){cache.remove(Dns.key(query));return null;}
        byte[] r=e.data.clone();r[0]=query[0];r[1]=query[1];
        try {
            long age=(now-e.created)/1000000000L;int[] p={Dns.question(r).end};int count=Dns.u16(r,6)+Dns.u16(r,8)+Dns.u16(r,10);
            for(int i=0;i<count;i++) { Dns.readName(r,p);int s=p[0];int type=Dns.u16(r,s);long ttl=((long)Dns.u16(r,s+4)<<16)|Dns.u16(r,s+6);if(type!=41){ttl=Math.max(0,ttl-age);Dns.put16(r,s+4,(int)(ttl>>16));Dns.put16(r,s+6,(int)ttl);}p[0]=s+10+Dns.u16(r,s+8); }
        } catch(Exception ex){cache.remove(Dns.key(query));return null;}
        return r;
    }
    public synchronized void put(byte[] q,byte[] r){long ttl=Dns.ttl(r);long now=System.nanoTime();if(ttl>0)cache.put(Dns.key(q),new Entry(r,now,now+ttl*1000000000L));}
    public synchronized void clear(){cache.clear();}
}
