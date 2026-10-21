package app.safeshield;

import android.content.*;
import android.security.keystore.*;
import android.util.Base64;
import org.json.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.security.*;
import java.util.concurrent.*;

/** App-private, Keystore AES-GCM encrypted preferences. No cloud backups. */
public final class SecureStore {
    private static SecureStore instance;
    private final SharedPreferences prefs;
    private final SecretKey key;
    private JSONObject data;
    private boolean dirty, flushScheduled;
    private final ScheduledExecutorService writer=Executors.newSingleThreadScheduledExecutor();
    public static synchronized SecureStore get(Context c) {
        if(instance==null)instance=new SecureStore(c.getApplicationContext());return instance;
    }
    private SecureStore(Context c) {
        try {
            prefs=c.getSharedPreferences("vault",Context.MODE_PRIVATE);
            KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);
            if(!ks.containsAlias("safeshield.v1")) {
                KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
                generator.init(new KeyGenParameterSpec.Builder("safeshield.v1",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());generator.generateKey();
            }
            key=(SecretKey)ks.getKey("safeshield.v1",null);
            String saved=prefs.getString("data",null);
            if(saved==null)data=new JSONObject();else {
                byte[] packed=Base64.decode(saved,Base64.NO_WRAP);if(packed.length<29)throw new GeneralSecurityException("Invalid vault");
                Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key,new GCMParameterSpec(128,packed,0,12));
                data=new JSONObject(new String(cipher.doFinal(packed,12,packed.length-12),java.nio.charset.StandardCharsets.UTF_8));
            }

        } catch(Exception e){throw new IllegalStateException("Secure storage unavailable. Protection settings were not reset. Restart your device; clearing app data removes your PIN and history.",e);}
    }
    private void save() {
        try {
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key);
            byte[] encrypted=cipher.doFinal(data.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] packed=new byte[12+encrypted.length];System.arraycopy(cipher.getIV(),0,packed,0,12);System.arraycopy(encrypted,0,packed,12,encrypted.length);
            if(!prefs.edit().putString("data",Base64.encodeToString(packed,Base64.NO_WRAP)).commit())throw new IllegalStateException("Storage full");dirty=false;FilterVpnService.storageWarning=false;
        }catch(Exception e){throw new IllegalStateException("Unable to save securely",e);}
    }
    private synchronized void scheduleFlush() {
        if(flushScheduled)return;
        flushScheduled=true;
        writer.schedule(()->{synchronized(this){try{if(dirty)save();}catch(Exception ignored){FilterVpnService.storageWarning=true;}finally{flushScheduled=false;}}},2,TimeUnit.SECONDS);
    }
    public synchronized boolean bool(String k){return data.optBoolean(k,false);}
    public synchronized long number(String k){return data.optLong(k,0);}
    public synchronized String text(String k){return data.optString(k,"");}
    public synchronized void set(String k,Object v){
        Object previous=data.opt(k);
        try{data.put(k,v);save();}catch(Exception e){try{if(previous==null)data.remove(k);else data.put(k,previous);}catch(JSONException ignored){}throw new IllegalStateException("Unable to save setting",e);}
    }
    public synchronized boolean hasPin(){return !text("pinHash").isEmpty();}
    public synchronized void setPin(String pin) throws Exception {
        JSONObject previous=new JSONObject(data.toString());
        byte[] salt=new byte[16];new SecureRandom().nextBytes(salt);
        try{data.put("pinSalt",Base64.encodeToString(salt,Base64.NO_WRAP));data.put("pinHash",Base64.encodeToString(derive(pin,salt),Base64.NO_WRAP));data.put("pinFailures",0);data.put("pinUntil",0);save();}catch(Exception e){data=previous;throw e;}
    }
    private byte[] derive(String pin,byte[] salt) throws Exception {
        PBEKeySpec spec=new PBEKeySpec(pin.toCharArray(),salt,210000,256);
        try{return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();}finally{spec.clearPassword();}
    }
    public synchronized boolean verify(String pin) throws Exception {
        long now=System.currentTimeMillis();if(number("pinUntil")>now)return false;
        boolean valid=MessageDigest.isEqual(Base64.decode(text("pinHash"),Base64.NO_WRAP),derive(pin,Base64.decode(text("pinSalt"),Base64.NO_WRAP)));
        int failures=valid?0:(int)number("pinFailures")+1;data.put("pinFailures",failures);
        data.put("pinUntil",valid?0:now+(failures>=5?Math.min(300000L,30000L*(failures-4)):0));save();return valid;
    }
    public synchronized void blocked(String domain,String reason) {
        try {
            JSONArray old=data.optJSONArray("history");if(old==null)old=new JSONArray();
            JSONArray next=new JSONArray();next.put(new JSONObject().put("domain",domain).put("time",System.currentTimeMillis()).put("reason",reason));
            for(int i=0;i<Math.min(old.length(),199);i++)next.put(old.get(i));
            data.put("history",next);data.put("blocked",number("blocked")+1);dirty=true;scheduleFlush();
        }catch(JSONException e){FilterVpnService.storageWarning=true;}
    }
    public synchronized JSONArray history(){try{return new JSONArray(data.optJSONArray("history")==null?"[]":data.getJSONArray("history").toString());}catch(JSONException e){return new JSONArray();}}
    public synchronized void clearHistory(){try{data.put("history",new JSONArray());data.put("blocked",0);save();}catch(JSONException e){throw new IllegalStateException(e);}}
}
