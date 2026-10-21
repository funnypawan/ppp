package app.safeshield;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.*;
import android.os.*;
import android.text.InputType;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.text.DateFormat;
import java.util.*;
import java.util.concurrent.*;

/** Native, accessible layouts; no web tracker, SDK, or browser engine. */
public final class MainActivity extends Activity {
    private static final int BG=0xfff4f7f5, INK=0xff183b34, MUTED=0xff63766e, GREEN=0xff157968, PALE=0xffe4f1ea;
    private SecureStore store;
    private LinearLayout root,content,nav;
    private String page="Home", lastState="";
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private boolean alive;
    private final Runnable ticker=new Runnable(){public void run(){if(!alive)return;if(page.equals("Home")){String s=FilterVpnService.status+FilterVpnService.active+FilterVpnService.starting+store.number("blocked")+FilterVpnService.storageWarning;if(!s.equals(lastState)){lastState=s;show("Home");}}handler.postDelayed(this,1500);}};
    @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);try{store=SecureStore.get(this);}catch(Exception e){new AlertDialog.Builder(this).setTitle("Secure storage unavailable").setMessage(e.getMessage()).setPositiveButton("Close",(d,w)->finish()).setCancelable(false).show();return;}show(state==null?"Home":state.getString("page","Home"));if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->{if(!page.equals("Home"))show("Home");else finish();});}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putString("page",page);}
    @Override public void onResume(){super.onResume();if(store!=null){alive=true;if(page.equals("Activity")&&store.hasPin())show("Activity");handler.post(ticker);}}
    @Override public void onPause(){alive=false;handler.removeCallbacks(ticker);super.onPause();}
    @Override public void onDestroy(){alive=false;io.shutdownNow();super.onDestroy();}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private GradientDrawable shape(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;}
    private LinearLayout column(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private TextView label(String text,int size,int color,boolean bold){TextView t=new TextView(this);t.setText(text);t.setTextSize(size);t.setTextColor(color);t.setLineSpacing(dp(3),1);if(bold)t.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));return t;}
    private void space(LinearLayout parent,int h){View v=new View(this);parent.addView(v,new LinearLayout.LayoutParams(1,dp(h)));}
    private TextView text(LinearLayout p,String s,int size,int color,boolean bold){TextView t=label(s,size,color,bold);p.addView(t);return t;}
    private LinearLayout card(LinearLayout parent,int color){LinearLayout l=column();l.setPadding(dp(20),dp(20),dp(20),dp(20));l.setBackground(shape(color,22));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.bottomMargin=dp(14);parent.addView(l,lp);return l;}
    private Button button(LinearLayout parent,String title,boolean primary,Runnable action){Button b=new Button(this);b.setText(title);b.setAllCaps(false);b.setTextSize(15);b.setTypeface(null,Typeface.BOLD);b.setTextColor(primary?Color.WHITE:GREEN);b.setBackground(shape(primary?GREEN:PALE,14));b.setMinHeight(dp(52));b.setPadding(dp(16),dp(10),dp(16),dp(10));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.topMargin=dp(12);parent.addView(b,lp);b.setOnClickListener(v->action.run());return b;}
    private void section(String eyebrow,String title,String sub){text(content,eyebrow.toUpperCase(Locale.ROOT),11,GREEN,true);space(content,8);TextView h=text(content,title,30,INK,true);if(Build.VERSION.SDK_INT>=28)h.setAccessibilityHeading(true);space(content,8);text(content,sub,15,MUTED,false);space(content,24);}
    private void show(String target){
        if(isFinishing()||isDestroyed())return;page=target;
        root=column();root.setBackgroundColor(BG);root.setFitsSystemWindows(true);
        root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
        LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);header.setPadding(dp(24),dp(14),dp(24),dp(14));
        TextView brand=label("◈  SafeShield",22,INK,true);header.addView(brand,new LinearLayout.LayoutParams(0,-2,1));TextView help=label("Help ↗",14,GREEN,true);help.setPadding(dp(12),dp(14),0,dp(14));help.setOnClickListener(v->show("Help"));help.setContentDescription("Open help and troubleshooting");header.addView(help);root.addView(header);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);content=column();content.setPadding(dp(24),dp(14),dp(24),dp(24));scroll.addView(content);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        switch(target){case "Home":home();break;case "Activity":history();break;case "Settings":settings();break;case "Blocklist":blocklist();break;case "Safe Search":safeSearch();break;case "PIN":pinPage();break;case "Privacy":privacy();break;default:help();}
        nav=new LinearLayout(this);nav.setPadding(dp(12),dp(8),dp(12),dp(8));nav.setBackgroundColor(Color.WHITE);
        for(String tab:new String[]{"Home","Activity","Settings"}){TextView t=label(tab,14,tab.equals(target)?GREEN:MUTED,tab.equals(target));t.setGravity(Gravity.CENTER);t.setPadding(dp(4),dp(16),dp(4),dp(16));if(tab.equals(target))t.setBackground(shape(PALE,14));nav.addView(t,new LinearLayout.LayoutParams(0,-2,1));t.setOnClickListener(v->show(tab));}root.addView(nav);setContentView(root);
    }
    private String date(long value){return value==0?"Not yet updated":DateFormat.getDateTimeInstance(DateFormat.MEDIUM,DateFormat.SHORT).format(new Date(value));}
    private void home(){
        section("Your digital wellbeing","A little more peace of mind.","Build healthier browsing habits, one choice at a time.");
        boolean on=FilterVpnService.active,connecting=FilterVpnService.starting;
        LinearLayout hero=card(content,on?GREEN:INK);
        ImageView shield=new ImageView(this);shield.setImageResource(R.drawable.ic_shield);shield.setColorFilter(0xffb8edcf);shield.setContentDescription("Protection shield");hero.addView(shield,new LinearLayout.LayoutParams(dp(68),dp(68)));space(hero,20);
        text(hero,connecting?"CONNECTING":on?"PROTECTION ON":"PROTECTION OFF",12,0xffb8edcf,true);space(hero,8);
        text(hero,connecting?"Setting up your shield…":on?"Your shield is active.":"Take a safer path.",28,Color.WHITE,true);space(hero,10);
        text(hero,FilterVpnService.status,14,0xffd7e8df,false);
        Button toggle=button(hero,connecting?"Connecting…":on?"Pause protection":"Enable protection",false,()->{if(FilterVpnService.active)authorize(()->new AlertDialog.Builder(this).setTitle("Pause DNS protection?").setMessage("Adult-domain filtering will stop. Android settings and other VPNs can also disable this protection.").setNegativeButton("Keep protecting",null).setPositiveButton("Pause",(d,w)->{stopService(new Intent(this,FilterVpnService.class));handler.postDelayed(()->show("Home"),200);}).show());else enable();});toggle.setEnabled(!connecting);
        LinearLayout metrics=card(content,Color.WHITE);
        text(metrics,String.format(Locale.getDefault(),"%,d",store.number("blocked")),34,INK,true);text(metrics,"Blocked domain requests",14,MUTED,false);space(metrics,12);
        text(metrics,"Includes repeated requests, not unique sites or people.",12,MUTED,false);
        space(metrics,14);text(metrics,store.bool("strict")?"●  Strict protection":"●  Standard protection",15,GREEN,true);
        LinearLayout list=card(content,Color.WHITE);text(list,"Your protection toolkit",18,INK,true);space(list,12);
        text(list,"Domain list  ·  "+String.format(Locale.getDefault(),"%,d entries",Blocklists.count(this)),14,INK,false);space(list,8);text(list,"Last update  ·  "+date(store.number("updated")),13,MUTED,false);button(list,"Manage blocklist  →",false,()->show("Blocklist"));
        text(content,"DNS protection blocks domains, not every image or video. Encrypted DNS and other VPNs may bypass it.",13,MUTED,false);
        if(FilterVpnService.storageWarning){space(content,12);text(content,"Local history could not be saved. Check device storage. Protection may still be active.",14,0xffa94d26,true);}
    }
    private void enable(){
        if(!store.bool("consent"))new AlertDialog.Builder(this).setTitle("How SafeShield protects you").setMessage("SafeShield creates a local VPN to filter device DNS requests against an on-device domain list. Allowed DNS queries (domain names, not page contents) are sent over HTTPS to Cloudflare's family DNS service, which also filters adult and malicious domains. Cloudflare can see these queries and your IP address.\n\nOnly DNS to SafeShield's virtual resolver enters the VPN. Web traffic is not decrypted or inspected. This is not an anonymity VPN. Private DNS, browsers using secure DNS, proxies and direct IP addresses can bypass filtering. Only one Android VPN can be active.\n\nYou control this device and can stop or uninstall SafeShield. Repeated DNS failures release the VPN, leaving browsing unfiltered. Read Privacy and Help for details.").setNegativeButton("Not now",null).setPositiveButton("Agree & continue",(d,w)->{store.set("consent",true);permission();}).show();else permission();
    }
    private void permission(){
        Intent vpn=VpnService.prepare(this);if(vpn!=null)startActivityForResult(vpn,10);else startVpn();
    }
    private void startVpn(){
        try{startForegroundService(new Intent(this,FilterVpnService.class));if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},11);handler.postDelayed(()->show("Home"),300);}catch(Exception e){message("Unable to start VPN", "Check Android VPN settings and try again. No protection was enabled.");}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==10){if(result==RESULT_OK)startVpn();else message("Permission not granted","Protection remains off. You can enable it when you're ready.");}}
    private void tile(String title,String detail,Runnable action){LinearLayout c=card(content,Color.WHITE);text(c,title+"  →",17,INK,true);space(c,6);text(c,detail,14,MUTED,false);c.setOnClickListener(v->action.run());c.setFocusable(true);c.setContentDescription(title+". "+detail);}
    private void toggle(String title,String detail,String key){LinearLayout c=card(content,Color.WHITE);Switch sw=new Switch(this);sw.setText(title);sw.setTextColor(INK);sw.setTextSize(16);sw.setMinHeight(dp(48));sw.setChecked(store.bool(key));c.addView(sw);space(c,6);text(c,detail,14,MUTED,false);sw.setOnClickListener(v->{boolean desired=sw.isChecked();sw.setChecked(!desired);authorize(()->{if(key.equals("strict")&&desired&&!store.hasPin()){newPin(()->{store.set(key,true);show(page);});return;}store.set(key,desired);if(key.equals("autoUpdate"))UpdateJob.schedule(this,desired);FilterVpnService.clearCache();show(page);});});}
    private void settings(){section("Make it yours","Protection settings","Simple controls. Clear boundaries.");
        toggle("Strict protection","PIN required for settings and pausing. Does not prevent uninstalling, force-stop, or changing Android settings.","strict");
        toggle("Blocked-request notices","Optional, discreet notifications. No domain names on your lock screen.","blockNotices");
        tile("Domain blocklist","Offline protection, source details and updates",()->show("Blocklist"));tile("Safe Search","Google SafeSearch & YouTube Restricted Mode",()->show("Safe Search"));tile("PIN protection",store.hasPin()?"PIN configured · settings require verification":"Set an app PIN for intentional changes",()->show("PIN"));tile("Privacy policy","Local history. No analytics. No advertising.",()->show("Privacy"));
        button(content,"Android VPN settings",false,()->openSettings(android.provider.Settings.ACTION_VPN_SETTINGS));
    }
    private void history(){section("On this device","Blocked activity","Only blocked domain requests are recorded. The latest 200 entries stay encrypted on this device.");
        if(store.hasPin()){LinearLayout lock=card(content,Color.WHITE);text(lock,"Your activity is private",20,INK,true);text(lock,"Enter your PIN to view or clear local history.",14,MUTED,false);button(lock,"Unlock activity",true,()->authorize(()->{content.removeAllViews();section("On this device","Blocked activity","Latest 200 requests. Counts include repeated requests.");historyItems();}));}else historyItems();
    }
    private void historyItems(){JSONArray history=store.history();if(history.length()==0){LinearLayout c=card(content,Color.WHITE);text(c,"Nothing blocked yet",22,INK,true);space(c,10);text(c,"Blocked requests will appear here. An empty history doesn't prove every website is safe.",15,MUTED,false);}else {button(content,"Clear local history & count",false,()->authorize(()->new AlertDialog.Builder(this).setTitle("Clear local history?").setMessage("This deletes all saved blocked requests and resets the counter. It cannot be undone.").setNegativeButton("Cancel",null).setPositiveButton("Clear",(d,w)->{store.clearHistory();show("Activity");}).show()));space(content,20);for(int i=0;i<history.length();i++){JSONObject o=history.optJSONObject(i);if(o==null)continue;LinearLayout c=card(content,Color.WHITE);text(c,o.optString("domain"),17,INK,true);space(c,6);text(c,date(o.optLong("time"))+"\n"+o.optString("reason"),12,MUTED,false);}}
        text(content,"A DNS request can come from a background app or embedded resource, not necessarily a page you opened. A zero-address family DNS answer is a filtering indicator, not independent content classification.",13,MUTED,false);
    }
    private void blocklist(){section("A stronger first layer","Domain blocklist","Blocks listed domains and their subdomains. Existing connections and cached browser DNS may take time to expire.");
        LinearLayout c=card(content,Color.WHITE);text(c,String.format(Locale.getDefault(),"%,d domains",Blocklists.count(this)),28,INK,true);space(c,8);text(c,"Last successful update\n"+date(store.number("updated")),14,MUTED,false);space(c,12);
        text(c,"Source: StevenBlack unified hosts + porn extension. This community-maintained source also blocks advertising, tracking and malicious domains. False positives are possible. It is not a complete adult-content classifier.",14,MUTED,false);
        if(store.number("updated")==0){space(c,12);text(c,"The bundled starter list has only 10 domains. Update now for broader local coverage. Family DNS also filters while online.",14,0xffa94d26,true);}
        if(!store.text("updateError").isEmpty()){space(c,8);text(c,store.text("updateError"),13,0xffa94d26,false);}
        button(c,"Update blocklist now",true,()->authorize(()->{Toast.makeText(this,"Downloading and validating…",Toast.LENGTH_LONG).show();io.execute(()->{String error=null;try{Blocklists.update(this);}catch(Exception e){error="Update failed. The previous blocklist is still in use. Check your connection and try again.";try{store.set("updateError",error);}catch(Exception ignored){}}String result=error;runOnUiThread(()->{if(isDestroyed())return;if(page.equals("Blocklist"))show("Blocklist");message(result==null?"Blocklist updated":"Update not installed",result==null?"The validated list is active. Old DNS cache entries were cleared.":result);});});}));
        toggle("Automatic daily updates","Best effort, when connected and battery is not low. Android may delay jobs. Downloads use up to 32 MB and may use mobile data.","autoUpdate");
        button(content,"View source & licenses ↗",false,()->external("https://github.com/StevenBlack/hosts"));
        text(content,"Updates use HTTPS, size limits, format and sentinel checks, and atomic replacement. They are not cryptographically signed by SafeShield. Trust in the source and its upstream maintainers is required. Failed updates retain the last valid list.",13,MUTED,false);
    }
    private void safeSearch(){section("Extra guardrails","Safer search","Search settings complement domain filtering. They do not filter everything on the internet.");
        toggle("Force Google SafeSearch","While the VPN is active, maps google.com and www.google.com to Google's official forcesafesearch address. Regional Google domains, browser secure DNS and cached connections are not covered. You can also enable Filter in Google's own settings.","safeSearch");
        button(content,"Open Google SafeSearch settings ↗",true,()->external("https://www.google.com/safesearch"));
        LinearLayout c=card(content,Color.WHITE);text(c,"YouTube Restricted Mode",20,INK,true);space(c,12);text(c,"In YouTube: open your profile → Settings → General → Restricted Mode. Menu names may vary. In a browser: profile → Restricted Mode → Activate. Repeat for each browser or profile.\n\nSafeShield does not toggle this setting for you or claim it is enabled. Restricted Mode can miss content and can over-filter.",15,MUTED,false);button(c,"YouTube's official instructions ↗",false,()->external("https://support.google.com/youtube/answer/174084"));
    }
    private void pinPage(){section("Intentional changes","PIN protection","An app PIN adds friction, not device-owner enforcement.");
        LinearLayout c=card(content,Color.WHITE);text(c,store.hasPin()?"PIN is configured":"Create your safety pause",22,INK,true);space(c,10);text(c,"Use 6–12 digits. SafeShield stores a salted, slow hash in encrypted storage, not your PIN. After five failed attempts, timed delays apply. There is no PIN recovery.\n\nAnyone who controls Android can uninstall or clear app data, bypass the PIN or turn off the VPN. Device clock changes can affect retry delays.",15,MUTED,false);
        button(c,store.hasPin()?"Change PIN":"Create PIN",true,()->authorize(()->newPin(()->show("PIN"))));
        text(content,"Once configured, your PIN is required to change app protection settings, pause protection, view history or clear it, even in Standard mode. Strict mode requires a PIN to be configured.",14,MUTED,false);
    }
    private EditText pinInput(String hint){EditText e=new EditText(this);e.setHint(hint);e.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);e.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(12)});e.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO);e.setMinHeight(dp(56));return e;}
    private void authorize(Runnable action){
        if(!store.hasPin()){action.run();return;}
        LinearLayout box=column();box.setPadding(dp(24),0,dp(24),0);EditText input=pinInput("Your PIN");box.addView(input);
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Confirm your PIN").setView(box).setNegativeButton("Cancel",null).setPositiveButton("Verify",null).create();dialog.setOnShowListener(x->{dialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);dialog.getButton(-1).setOnClickListener(v->{String pin=input.getText().toString();dialog.getButton(-1).setEnabled(false);io.execute(()->{boolean valid=false;try{valid=store.verify(pin);}catch(Exception ignored){}boolean ok=valid;runOnUiThread(()->{if(isDestroyed()||!dialog.isShowing())return;dialog.getButton(-1).setEnabled(true);input.setText("");if(ok){dialog.dismiss();action.run();}else input.setError(store.number("pinUntil")>System.currentTimeMillis()?"Too many attempts. Wait before trying again.":"PIN not accepted");});});});});dialog.show();
    }
    private void newPin(Runnable done){
        LinearLayout box=column();box.setPadding(dp(24),0,dp(24),0);EditText a=pinInput("New PIN (6–12 digits)"),b=pinInput("Repeat PIN");box.addView(a);box.addView(b);
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Set your PIN").setView(box).setNegativeButton("Cancel",null).setPositiveButton("Save PIN",null).create();dialog.setOnShowListener(x->{dialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);dialog.getButton(-1).setOnClickListener(v->{String pin=a.getText().toString();if(!pin.matches("[0-9]{6,12}")||!pin.equals(b.getText().toString())){b.setError("Enter matching PINs of 6–12 digits");return;}dialog.getButton(-1).setEnabled(false);io.execute(()->{boolean success;try{store.setPin(pin);success=true;}catch(Exception e){success=false;}boolean ok=success;runOnUiThread(()->{if(isDestroyed()||!dialog.isShowing())return;dialog.getButton(-1).setEnabled(true);if(ok){dialog.dismiss();done.run();}else b.setError("PIN could not be saved securely");});});});});dialog.show();
    }
    private void privacy(){section("Privacy, by design","Your device. Your data.","SafeShield privacy policy · version 1.0");
        paragraph("What stays here","Only blocked domain names, timestamps and block reasons are logged. The most recent 200 requests and a cumulative request count are stored locally using Android Keystore AES-GCM encryption. Settings and PIN hash are encrypted. Backups are disabled. History writes are batched; the last few seconds may be lost after a crash. You can clear history or uninstall the app.");
        paragraph("What leaves your device","Allowed DNS queries go over HTTPS to Cloudflare's family DNS service. Cloudflare receives queried domain names and your network IP, but SafeShield does not send page contents, passwords, messages or its history database. Read the provider's policy before enabling. The blocklist host receives your IP and normal download request metadata when you update. Your history is never included.");
        paragraph("No hidden collection","No analytics, advertisements, account, telemetry or history sales. No contact, SMS, microphone, camera or location access. SafeShield cannot see the contents of HTTPS traffic. DNS is a domain lookup, not a record of individual images watched or pages read.");
        paragraph("Your controls","VPN consent is requested by Android. Notification permission is optional. Auto-updates and blocked-request notifications are opt-in. Android VPN settings, app settings and uninstall remain under your control. This app is for your own device or an authorized parental/managed-device setup.");
        button(content,"Cloudflare public resolver policy ↗",false,()->external("https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/"));button(content,"Blocklist source & licensing ↗",false,()->external("https://github.com/StevenBlack/hosts"));
    }
    private void paragraph(String title,String body){LinearLayout c=card(content,Color.WHITE);text(c,title,19,INK,true);space(c,10);text(c,body,15,MUTED,false);}
    private void help(){section("Know your shield","Help & troubleshooting","Transparent protection starts with honest limits.");
        paragraph("Three different kinds of filtering","DNS filtering blocks entire domains before a connection is made, including domains used by HTTPS sites and links from other apps. It cannot classify individual pictures or videos on general-purpose sites. Browser filtering can inspect URLs or page content inside a supported browser; SafeShield does not implement it. Image-level recognition requires a tested classifier; SafeShield has none.");
        paragraph("A site is not blocked","Confirm Protection ON. Update the list, close/reopen your browser and allow DNS caches to expire. A listed site's subdomains are covered, but unlisted domains may not be. Android Private DNS, browser secure DNS/DoH, custom DNS, proxies, other VPNs, direct IPs, cached IPs and some apps can bypass this DNS-only VPN. IPv6 custom resolvers and DNS-over-TCP are not intercepted. No bypass-proof claim is made.");
        paragraph("Connection trouble","SafeShield forwards ordinary UDP DNS queries to a family-filtered DNS-over-HTTPS resolver. HTTPS web traffic stays on your normal connection. After three consecutive query/transport failures, SafeShield releases its VPN and protection turns off. DNS SERVFAIL replies can occur during failures. If Android's ‘Block connections without VPN’ is enabled, Android can still block connectivity; SafeShield cannot override that setting. Disable lockdown in Android settings to restore access if necessary.");
        paragraph("Restarts & battery","For system-managed restart, enable Always-on VPN in Android's VPN settings. Do not enable ‘Block connections without VPN’ for this split-DNS design: ordinary web traffic is not routed through the VPN and lockdown may block it. Without Always-on, reopen SafeShield after a reboot. A restart reminder requires notification permission. Some battery managers stop services; review this app's battery settings if needed. Wi-Fi/mobile switching clears the DNS cache; new resolver connections follow the underlying network.");
        paragraph("Stronger, authorized controls","For a child's device, consider Google Family Link and its supported Chrome/content controls. For an organization-owned device, an authorized administrator can provision Android Enterprise and enforce managed policies. SafeShield does not provision device-owner privileges or implement an enterprise DPC. Ordinary app PINs cannot prevent uninstalling or changes to Android settings.");
        paragraph("Why no blocked HTTPS page?","SafeShield returns a DNS denial. Browsers usually show a connection error, not a branded page. Optional local notifications and activity history explain blocks without intercepting TLS, installing certificates or secretly inspecting pages.");
        button(content,"Android VPN settings",false,()->openSettings(android.provider.Settings.ACTION_VPN_SETTINGS));button(content,"Android network / Private DNS settings",false,()->openSettings(android.provider.Settings.ACTION_WIRELESS_SETTINGS));button(content,"Family Link information ↗",false,()->external("https://families.google/familylink/"));button(content,"Privacy policy",false,()->show("Privacy"));
    }
    private void message(String title,String body){if(!isFinishing()&&!isDestroyed())new AlertDialog.Builder(this).setTitle(title).setMessage(body).setPositiveButton("Got it",null).show();}
    private void external(String url){try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(ActivityNotFoundException e){message("No browser available",url);}}
    private void openSettings(String action){try{startActivity(new Intent(action));}catch(ActivityNotFoundException e){message("Open Android settings","Open your device Settings app and find Network & internet → VPN.");}}
    @Override public void onBackPressed(){if(!page.equals("Home"))show("Home");else super.onBackPressed();}
}
