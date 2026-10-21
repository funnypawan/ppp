package app.safeshield;

import android.content.Context;
import android.util.AtomicFile;
import java.io.*;
import java.net.*;
import javax.net.ssl.HttpsURLConnection;
import java.nio.charset.StandardCharsets;

public final class Blocklists {
    // StevenBlack unified hosts + porn extension: also includes advertising/malware domains.
    public static final String SOURCE="https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn/hosts";
    private static volatile DomainRules rules;
    private static boolean updating;
    public static synchronized DomainRules get(Context c) throws IOException {
        if(rules!=null)return rules;
        AtomicFile file=new AtomicFile(new File(c.getFilesDir(),"domains.txt"));
        try(InputStream in=file.openRead()){rules=DomainRules.read(new InputStreamReader(in,StandardCharsets.UTF_8));}
        catch(FileNotFoundException e){try(InputStream in=c.getAssets().open("seed-domains.txt")){rules=DomainRules.read(new InputStreamReader(in,StandardCharsets.UTF_8));}}
        return rules;
    }
    public static int count(Context c){try{return get(c).size();}catch(IOException e){return 0;}}
    public static void update(Context c) throws Exception {
        synchronized(Blocklists.class){if(updating)throw new IOException("An update is already running");updating=true;}
        HttpsURLConnection connection=null;File temp=new File(c.getCacheDir(),"blocklist-download");
        try {
            connection=(HttpsURLConnection)new URL(SOURCE).openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(15000);connection.setReadTimeout(20000);connection.setRequestProperty("User-Agent","SafeShield/1.0");
            if(connection.getResponseCode()!=200)throw new IOException("Source returned HTTP "+connection.getResponseCode());
            try(InputStream in=connection.getInputStream();OutputStream out=new FileOutputStream(temp)) {
                byte[] buffer=new byte[16384];int n,total=0;long deadline=System.nanoTime()+secondsToNanos(90);
                while((n=in.read(buffer))!=-1){total+=n;if(total>32*1024*1024 || System.nanoTime()>deadline || Thread.currentThread().isInterrupted())throw new IOException("Download exceeds safety limits");out.write(buffer,0,n);}
            }
            DomainRules candidate;try(Reader r=new InputStreamReader(new FileInputStream(temp),StandardCharsets.UTF_8)){candidate=DomainRules.read(r);}
            if(candidate.size()<1000 || !candidate.blocks("pornhub.com") || !candidate.blocks("xvideos.com") || candidate.blocks("google.com"))throw new IOException("Blocklist validation failed; keeping previous list");
            AtomicFile file=new AtomicFile(new File(c.getFilesDir(),"domains.txt"));FileOutputStream out=null;
            try { out=file.startWrite();try(InputStream in=new FileInputStream(temp)){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}file.finishWrite(out); }
            catch(Exception e){if(out!=null)file.failWrite(out);throw e;}
            synchronized(Blocklists.class){rules=candidate;}
            FilterVpnService.clearCache();
            SecureStore.get(c).set("updated",System.currentTimeMillis());SecureStore.get(c).set("updateError","");
        }finally{if(connection!=null)connection.disconnect();temp.delete();synchronized(Blocklists.class){updating=false;}}
    }
    private static long secondsToNanos(long s){return s*1000000000L;}
}
