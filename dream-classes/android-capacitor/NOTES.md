# Android (Capacitor) notes
1. Copy capacitor.config.json to project root, set server.url to the deployed HTTPS API domain.
2. npx cap add android; npx cap sync; open in Android Studio.
3. Screenshot/recording block: in MainActivity.onCreate add:
   getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
4. Generate signed AAB: Build > Generate Signed Bundle/APK. Package: in.dreamclasses.app.
5. Offline downloads: use @capacitor/filesystem (app-private Directory.Data) + the signed stream URL; honour videos.downloadable.
