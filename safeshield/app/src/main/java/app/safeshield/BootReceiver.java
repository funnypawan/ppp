package app.safeshield;
import android.content.*;
import android.app.*;
public final class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c,Intent i) {
        if(!Intent.ACTION_BOOT_COMPLETED.equals(i.getAction()))return;
        try {
            SecureStore s=SecureStore.get(c);UpdateJob.schedule(c,s.bool("autoUpdate"));
            if(s.bool("everEnabled")) {
                FilterVpnService.channels(c);
                Notification n=new Notification.Builder(c,"status").setSmallIcon(R.drawable.ic_shield).setContentTitle("Check your SafeShield protection")
                    .setContentText("Open SafeShield to verify VPN status after restarting.").setContentIntent(FilterVpnService.openIntent(c)).setAutoCancel(true).build();
                c.getSystemService(NotificationManager.class).notify(3,n);
            }
        }catch(Exception ignored){ /* Locked/unavailable Keystore or notification permission: no background monitoring. */ }
    }
}
