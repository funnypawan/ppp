package app.safeshield;
import android.app.job.*;
import android.content.*;
import java.util.concurrent.*;
public final class UpdateJob extends JobService {
    private final ExecutorService executor=Executors.newSingleThreadExecutor();
    private volatile Future<?> work;
    public static void schedule(Context c,boolean enabled) {
        JobScheduler jobs=c.getSystemService(JobScheduler.class);
        if(!enabled){jobs.cancel(44);return;}
        jobs.schedule(new JobInfo.Builder(44,new ComponentName(c,UpdateJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true).setPeriodic(24*60*60*1000L).setRequiresBatteryNotLow(true).build());
    }
    @Override public boolean onStartJob(JobParameters p){work=executor.submit(()->{boolean retry=false;try{Blocklists.update(this);}catch(Exception e){retry=true;try{SecureStore.get(this).set("updateError","Update failed; previous list retained. Check connectivity and try again.");}catch(Exception ignored){}}jobFinished(p,retry);});return true;}
    @Override public boolean onStopJob(JobParameters p){if(work!=null)work.cancel(true);return true;}
    @Override public void onDestroy(){executor.shutdownNow();super.onDestroy();}
}
