package app.safeshield;

import android.app.*;
import android.content.*;
import android.net.*;
import android.os.*;
import java.io.*;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public final class FilterVpnService extends VpnService {
    public static volatile String status="Protection is off";
    public static volatile boolean active=false, starting=false, storageWarning=false;
    private static volatile FilterVpnService instance;
    private final DnsCache cache=new DnsCache();
    private final Object outputLock=new Object();
    private final AtomicInteger failures=new AtomicInteger();
    private volatile boolean stopping=false;
    private volatile ParcelFileDescriptor tunnel;
    private FileOutputStream output;
    private Thread reader;
    private ThreadPoolExecutor workers;
    private ConnectivityManager connectivity;
    private ConnectivityManager.NetworkCallback callback;
    private long lastNotice;
    public static void clearCache(){FilterVpnService s=instance;if(s!=null)s.cache.clear();}
    public static PendingIntent openIntent(Context c){return PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
    public static void channels(Context c){NotificationManager m=c.getSystemService(NotificationManager.class);m.createNotificationChannel(new NotificationChannel("status","Protection status",NotificationManager.IMPORTANCE_LOW));m.createNotificationChannel(new NotificationChannel("blocks","Content blocked",NotificationManager.IMPORTANCE_LOW));}
    private Notification notification(String text){return new Notification.Builder(this,"status").setSmallIcon(R.drawable.ic_shield).setContentTitle("SafeShield · DNS protection").setContentText(text).setContentIntent(openIntent(this)).setOngoing(true).build();}
    @Override public void onCreate(){super.onCreate();instance=this;channels(this);}
    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        if(reader!=null)return START_NOT_STICKY;
        starting=true;status="Connecting securely…";
        if(Build.VERSION.SDK_INT>=34)startForeground(1,notification(status),android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(1,notification(status));
        workers=new ThreadPoolExecutor(2,2,0L,TimeUnit.SECONDS,new ArrayBlockingQueue<>(32),new ThreadPoolExecutor.AbortPolicy());
        reader=new Thread(this::runTunnel,"SafeShield-DNS");reader.start();return START_NOT_STICKY;
    }
    private void runTunnel() {
        try {
            SecureStore.get(this);Blocklists.get(this);
            Builder builder=new Builder().setSession("SafeShield DNS protection").setMtu(8192).addAddress("10.111.0.1",32).addDnsServer("10.111.0.2").addRoute("10.111.0.2",32).setBlocking(false).setConfigureIntent(openIntent(this));
            // Only DNS to the virtual resolver enters the tunnel. App's own DoH/update sockets
            // use the underlying network, avoiding DNS bootstrap recursion.
            builder.addDisallowedApplication(getPackageName());
            builder.allowFamily(android.system.OsConstants.AF_INET6); // Preserve non-tunneled IPv6 internet access.
            ParcelFileDescriptor established=builder.establish();
            if(established==null)throw new IOException("VPN permission was not granted");
            synchronized(outputLock) {
                if(stopping){established.close();return;}
                tunnel=established;output=new FileOutputStream(tunnel.getFileDescriptor());
                active=true;starting=false;status="VPN connected · DNS filtering";
                getSystemService(NotificationManager.class).notify(1,notification(status));
                connectivity=getSystemService(ConnectivityManager.class);
                callback=new ConnectivityManager.NetworkCallback(){@Override public void onAvailable(Network n){cache.clear();failures.set(0);}@Override public void onLost(Network n){cache.clear();}};
                connectivity.registerDefaultNetworkCallback(callback);
            }
            SecureStore.get(this).set("everEnabled",true);
            try(FileInputStream input=new FileInputStream(established.getFileDescriptor())) {
                byte[] buffer=new byte[8192];int n;
                while(!stopping) {
                    android.system.StructPollfd poll=new android.system.StructPollfd();
                    poll.fd=established.getFileDescriptor();poll.events=(short)android.system.OsConstants.POLLIN;
                    if(android.system.Os.poll(new android.system.StructPollfd[]{poll},1000)==0)continue;
                    if(stopping)break;
                    n=input.read(buffer);if(n<0)break;if(n==0)continue;
                    byte[] packet=Arrays.copyOf(buffer,n), query;
                    try{query=Dns.udpQuery(packet,n);Dns.question(query);if((query[2]&128)!=0)continue;}catch(IOException malformed){continue;}
                    try{workers.execute(()->resolve(packet,query));}
                    catch(RejectedExecutionException overloaded){send(packet,Dns.reply(query,2));}
                }
            }
            if(!stopping)fail("VPN connection ended. Tap to reconnect.");
        }catch(Exception e){if(!stopping)fail("DNS protection unavailable. VPN released; tap to retry.");}
    }
    private void resolve(byte[] packet,byte[] query) {
        if(stopping)return;
        try {
            Dns.Question q=Dns.question(query);SecureStore store=SecureStore.get(this);byte[] response;
            if(Blocklists.get(this).blocks(q.name)) {response=Dns.reply(query,3);record(q.name,"Local blocklist");}
            else if(store.bool("safeSearch") && (q.name.equals("google.com") || q.name.equals("www.google.com"))) response=Dns.safeSearch(query);
            else {
                response=cache.get(query);
                if(response==null){response=forward(query);cache.put(query,response);}
                failures.set(0);
                if(Dns.blockedAnswer(response))record(q.name,"Family DNS (zero-address response)");
            }
            send(packet,response);
        }catch(Exception e){
            if(stopping)return;
            try{send(packet,Dns.reply(query,2));}catch(Exception ignored){}
            if(failures.incrementAndGet()>=3)fail("Resolver failed repeatedly. VPN released to restore normal DNS. Protection is off.");
        }
    }
    private byte[] forward(byte[] query) throws IOException {
        HttpsURLConnection c=(HttpsURLConnection)new URL("https://family.cloudflare-dns.com/dns-query").openConnection();
        try {
            c.setConnectTimeout(5000);c.setReadTimeout(5000);c.setInstanceFollowRedirects(false);c.setRequestMethod("POST");c.setDoOutput(true);c.setFixedLengthStreamingMode(query.length);
            c.setRequestProperty("Content-Type","application/dns-message");c.setRequestProperty("Accept","application/dns-message");
            try(OutputStream out=c.getOutputStream()){out.write(query);}
            if(c.getResponseCode()!=200)throw new IOException("Resolver HTTP failure");
            String type=c.getContentType();if(type==null || !type.toLowerCase(Locale.ROOT).startsWith("application/dns-message"))throw new IOException("Wrong resolver content type");
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            try(InputStream in=c.getInputStream()){byte[] b=new byte[1024];int n;while((n=in.read(b))!=-1){if(out.size()+n>4096)throw new IOException("DNS response too large");out.write(b,0,n);}}
            byte[] response=out.toByteArray();if(!Dns.validResponse(query,response))throw new IOException("Invalid resolver response");
            int rcode=response[3]&15;if(rcode==2 || rcode==5)throw new IOException("Resolver could not answer");return response;
        }finally{c.disconnect();}
    }
    private void send(byte[] request,byte[] response) throws IOException {
        byte[] packet=Dns.udpReply(request,response);
        synchronized(outputLock){if(!stopping && output!=null)output.write(packet);}
    }
    private void record(String domain,String reason) {
        SecureStore store=SecureStore.get(this);store.blocked(domain,reason);
        // No domains on lock-screen notifications. Rate limited to avoid notification spam.
        synchronized(this){long now=android.os.SystemClock.elapsedRealtime();if(store.bool("blockNotices") && now-lastNotice>30000){lastNotice=now;
            Notification n=new Notification.Builder(this,"blocks").setSmallIcon(R.drawable.ic_shield).setContentTitle("SafeShield blocked a domain request").setContentText("Open local activity for details. No page content was inspected.").setContentIntent(openIntent(this)).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build();getSystemService(NotificationManager.class).notify(2,n);}}
    }
    private void fail(String reason){status=reason;active=false;starting=false;shutdown();new Handler(getMainLooper()).post(this::stopSelf);}
    private void shutdown(){stopping=true;synchronized(outputLock){active=false;starting=false;if(tunnel!=null){try{tunnel.close();}catch(IOException ignored){}tunnel=null;}output=null;}if(workers!=null)workers.shutdownNow();cache.clear();}
    @Override public void onRevoke(){status="VPN permission revoked or another VPN started. Protection is off.";active=false;starting=false;shutdown();stopSelf();}
    @Override public void onDestroy(){boolean wasRunning=active||starting;active=false;starting=false;shutdown();if(callback!=null&&connectivity!=null)try{connectivity.unregisterNetworkCallback(callback);}catch(Exception ignored){}if(instance==this)instance=null;if(wasRunning)status="Protection is off";stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy();}
}
