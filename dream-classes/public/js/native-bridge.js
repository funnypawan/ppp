/* Dream Classes — native bridge. Runs ONLY inside the Capacitor Android app;
   in a normal browser every branch below is skipped. */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;
  var P = Cap.Plugins || {};
  // Status bar: brand indigo, light icons
  if (P.StatusBar) {
    P.StatusBar.setStyle({ style: 'LIGHT' }).catch(function () {});
    P.StatusBar.setBackgroundColor({ color: '#4f46e5' }).catch(function () {});
  }
  // Splash: hide once the web app has booted
  window.addEventListener('load', function () {
    setTimeout(function () { if (P.SplashScreen) P.SplashScreen.hide().catch(function () {}); }, 400);
  });
  // Android hardware back button: go back in-app, exit only from the root screen
  if (P.App) {
    P.App.addListener('backButton', function (info) {
      if (info && info.canGoBack) window.history.back();
      else if (typeof window.go === 'function' && window.VIEW && window.VIEW !== 'home') window.go('home');
      else P.App.exitApp();
    });
  }
  // Offline downloads: the PWA stores permitted files in IndexedDB, which in the
  // Android WebView lives in app-private storage (not the public gallery) and is
  // excluded from backup (allowBackup=false). FLAG_SECURE is set natively in
  // MainActivity. For very large files prefer @capacitor/filesystem (Directory.Data).
  window.DC_NATIVE = true;
})();
