using UnityEngine;

namespace IBS.Core
{
    /// <summary>
    /// Player graphics/audio settings. Persisted in PlayerPrefs and applied
    /// to the Unity quality system at runtime.
    /// </summary>
    public static class SettingsManager
    {
        private const string Prefix = "ibs3d.set.";

        private static bool _loaded;

        public static int QualityLevel
        {
            get { Load(); return PlayerPrefs.GetInt(Prefix + "quality", 2); }
            set { Load(); PlayerPrefs.SetInt(Prefix + "quality", value); PlayerPrefs.Save(); }
        }

        public static int TargetFrameRate
        {
            get { Load(); return PlayerPrefs.GetInt(Prefix + "fps", 60); }
            set { Load(); PlayerPrefs.SetInt(Prefix + "fps", value); PlayerPrefs.Save(); }
        }

        public static float CameraSensitivity
        {
            get { Load(); return PlayerPrefs.GetFloat(Prefix + "sens", 1f); }
            set { Load(); PlayerPrefs.SetFloat(Prefix + "sens", value); PlayerPrefs.Save(); }
        }

        public static float MasterVolume
        {
            get { Load(); return PlayerPrefs.GetFloat(Prefix + "volume", 0.8f); }
            set { Load(); PlayerPrefs.SetFloat(Prefix + "volume", value); PlayerPrefs.Save(); }
        }

        public static bool Shadows
        {
            get { Load(); return PlayerPrefs.GetInt(Prefix + "shadows", 1) == 1; }
            set { Load(); PlayerPrefs.SetInt(Prefix + "shadows", value ? 1 : 0); PlayerPrefs.Save(); }
        }

        public static int TextureQuality
        {
            get { Load(); return PlayerPrefs.GetInt(Prefix + "tex", 2); }
            set { Load(); PlayerPrefs.SetInt(Prefix + "tex", value); PlayerPrefs.Save(); }
        }

        public static int AntiAliasing
        {
            get { Load(); return PlayerPrefs.GetInt(Prefix + "aa", 2); }
            set { Load(); PlayerPrefs.SetInt(Prefix + "aa", value); PlayerPrefs.Save(); }
        }

        private static void Load()
        {
            if (_loaded) return;
            _loaded = true;
        }

        /// <summary>Applies the stored settings to the running game.</summary>
        public static void Apply()
        {
            int level = Mathf.Clamp(QualityLevel, 0, Mathf.Max(0, QualitySettings.names.Length - 1));
            QualitySettings.SetQualityLevel(level, true);
            QualitySettings.shadows = Shadows ? ShadowQuality.All : ShadowQuality.Disable;
            QualitySettings.antiAliasing = AntiAliasing;
            QualitySettings.masterTextureLimit = TextureQuality;
            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = TargetFrameRate;
            AudioListener.volume = MasterVolume;
        }
    }
}
