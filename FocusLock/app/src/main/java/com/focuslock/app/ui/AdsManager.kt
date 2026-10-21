package com.focuslock.app.ui

import android.app.Activity
import android.content.Context
import android.view.View
import android.widget.FrameLayout
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Google AdMob helper — consent (UMP) + SDK init + adaptive banner loading.
 *
 * ============================================================
 *  APNA REAL AD ID YAHAN LAGAYEIN (REAL EARNING KE LIYE)
 * ============================================================
 * Abhi [BANNER_AD_UNIT_ID] me Google ka official TEST ad id hai.
 * Test ads hamesha dikhte hain lekin inse PAISE NAHI MILTE.
 * Asli earning ke liye:
 *   1. https://admob.google.com par apna free AdMob account banayein
 *   2. Wahan app add karke ek "Banner" ad unit banayein
 *   3. Mile hue id (ca-app-pub-XXXX/ZZZZ) ko neeche [BANNER_AD_UNIT_ID]
 *      me daalein, aur App ID (ca-app-pub-XXXX~YYYY) ko
 *      app/build.gradle ke `admobAppId` placeholder me daalein
 *   4. App ko dobara build karke publish karein
 *
 * WARNING: Apne khud ke REAL ads par kabhi click mat karein aur na
 * doston se karwayein — AdMob account ban ho sakta hai. Test ads par
 * click karna safe hai.
 * ============================================================
 *
 * Design notes:
 *  - Ads sirf Dashboard + Statistics screens par dikhte hain. Blocking
 *    screen, permission setup aur emergency screens par ads nahi hain.
 *  - Har ads call try/catch me hai — ad fail ho ya internet na ho,
 *    app kabhi crash nahi hoga, sirf ad ki jagah khali (gone) rahegi.
 *  - Aapke limits/usage ka data ads se share nahi hota; wo hamesha
 *    phone ke andar hi rehta hai. AdMob apne ads ke liye device ki
 *    advertising ID istemal kar sakta hai (har free app aisa karta hai).
 */
object AdsManager {

    /**
     * Banner ad unit id.
     * abhi = Google TEST id (paise nahi milenge).
     * yahan apna REAL AdMob banner id daalein: "ca-app-pub-XXXX/ZZZZ"
     */
    const val BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111"

    private val initialized = AtomicBoolean(false)
    private val initializing = AtomicBoolean(false)

    /**
     * UMP consent mangta hai (jahan zaroori ho) aur Mobile Ads SDK ko
     * ek baar initialize karta hai. MainActivity se call hota hai.
     */
    fun initialize(activity: Activity, onReady: () -> Unit = {}) {
        if (initialized.get()) {
            onReady()
            return
        }
        if (!initializing.compareAndSet(false, true)) return // ek hi baar koshish
        try {
            val params = ConsentRequestParameters.Builder()
                .setTagForUnderAgeOfConsent(false)
                .build()
            val consentInformation = UserMessagingPlatform.getConsentInformation(activity)
            consentInformation.requestConsentInfoUpdate(
                activity,
                params,
                {
                    UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) {
                        startMobileAds(activity, onReady)
                    }
                },
                {
                    // Consent info fail ho jaye (jaise internet na ho) to bhi aage badho
                    startMobileAds(activity, onReady)
                }
            )
            // Pichhli baar consent mil chuka hai to wait kiye bina shuru karo
            if (consentInformation.canRequestAds()) {
                startMobileAds(activity, onReady)
            }
        } catch (e: Exception) {
            startMobileAds(activity, onReady)
        }
    }

    private fun startMobileAds(context: Context, onReady: () -> Unit) {
        if (!initialized.compareAndSet(false, true)) {
            onReady()
            return
        }
        try {
            MobileAds.initialize(context) { onReady() }
        } catch (e: Exception) {
            // Ads SDK fail ho jaye to bhi app aaram se chalta rahega
        }
    }

    /**
     * [container] (aak card/FrameLayout) me ek adaptive banner ad load karta hai.
     * Ad load hone par container dikhta hai, fail hone par gone ho jata hai.
     * Bana hua [AdView] [onAdViewReady] me milta hai taaki Fragment uske
     * pause/resume/destroy lifecycle ko sambhal sake.
     */
    fun loadAdaptiveBanner(
        activity: Activity,
        container: FrameLayout,
        onAdViewReady: (AdView) -> Unit = {}
    ) {
        initialize(activity) {
            activity.runOnUiThread {
                try {
                    if (container.childCount > 0) return@runOnUiThread
                    val adView = AdView(activity)
                    adView.adUnitId = BANNER_AD_UNIT_ID

                    val displayMetrics = activity.resources.displayMetrics
                    val screenWidthDp =
                        (displayMetrics.widthPixels / displayMetrics.density).toInt()
                    val adWidthDp = (screenWidthDp - 32).coerceAtLeast(280)
                    adView.setAdSize(
                        AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(
                            activity, adWidthDp
                        )
                    )

                    adView.adListener = object : AdListener() {
                        override fun onAdLoaded() {
                            container.visibility = View.VISIBLE
                        }

                        override fun onAdFailedToLoad(error: LoadAdError) {
                            container.visibility = View.GONE
                        }
                    }

                    container.addView(adView)
                    adView.loadAd(AdRequest.Builder().build())
                    onAdViewReady(adView)
                } catch (e: Exception) {
                    container.visibility = View.GONE
                }
            }
        }
    }
}
