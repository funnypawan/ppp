using UnityEngine;

namespace IBS.Core
{
    /// <summary>
    /// Generates the game's sound effects procedurally at runtime, so the
    /// project ships without any external audio assets. Every clip is
    /// synthesised from simple oscillators and noise.
    /// </summary>
    public static class AudioFactory
    {
        private static AudioClip _engine;

        /// <summary>Looping diesel engine note (idle-ish, pitched at runtime).</summary>
        public static AudioClip EngineLoop()
        {
            if (_engine != null) return _engine;
            const int rate = 22050;
            const float seconds = 1.0f;
            int samples = (int)(rate * seconds);
            float[] data = new float[samples];
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / rate;
                float fundamental = 42f;
                float value = 0f;
                value += Mathf.Sin(2f * Mathf.PI * fundamental * t) * 0.55f;
                value += Mathf.Sin(2f * Mathf.PI * fundamental * 2.02f * t) * 0.22f;
                value += Mathf.Sin(2f * Mathf.PI * fundamental * 3.1f * t) * 0.11f;
                value += (RandomValue(i) - 0.5f) * 0.18f;
                data[i] = value * 0.6f;
            }
            _engine = AudioClip.Create("engine_loop", samples, 1, rate, false);
            _engine.SetData(data, 0);
            return _engine;
        }

        /// <summary>Air horn: two detuned square waves with a slow attack.</summary>
        public static AudioClip Horn()
        {
            const int rate = 22050;
            const float seconds = 0.7f;
            int samples = (int)(rate * seconds);
            float[] data = new float[samples];
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / rate;
                float attack = Mathf.Clamp01(t / 0.05f);
                float release = Mathf.Clamp01((seconds - t) / 0.15f);
                float envelope = attack * release;
                float value = Mathf.Sin(2f * Mathf.PI * 415f * t) * 0.6f + Mathf.Sin(2f * Mathf.PI * 466f * t) * 0.5f;
                data[i] = value * envelope * 0.45f;
            }
            AudioClip clip = AudioClip.Create("horn", samples, 1, rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        /// <summary>Pneumatic air brake release.</summary>
        public static AudioClip AirBrake()
        {
            const int rate = 22050;
            const float seconds = 0.55f;
            int samples = (int)(rate * seconds);
            float[] data = new float[samples];
            float noise = 0f;
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / rate;
                noise = noise * 0.72f + (RandomValue(i) - 0.5f) * 0.28f;
                float envelope = Mathf.Exp(-t * 5.5f);
                data[i] = noise * envelope * 0.5f;
            }
            AudioClip clip = AudioClip.Create("air_brake", samples, 1, rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        /// <summary>Doors: pneumatic hiss plus a closing clunk.</summary>
        public static AudioClip Door()
        {
            const int rate = 22050;
            const float seconds = 0.9f;
            int samples = (int)(rate * seconds);
            float[] data = new float[samples];
            float noise = 0f;
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / rate;
                noise = noise * 0.8f + (RandomValue(i) - 0.5f) * 0.2f;
                float hiss = Mathf.Exp(-t * 3.4f) * 0.28f;
                float clunk = t > 0.62f ? Mathf.Exp(-(t - 0.62f) * 26f) * 0.55f : 0f;
                data[i] = (noise * hiss) + clunk * Mathf.Sin(2f * Mathf.PI * 120f * t);
            }
            AudioClip clip = AudioClip.Create("door", samples, 1, rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        /// <summary>Gear shift thunk.</summary>
        public static AudioClip Shift()
        {
            const int rate = 22050;
            const float seconds = 0.22f;
            int samples = (int)(rate * seconds);
            float[] data = new float[samples];
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / rate;
                float envelope = Mathf.Exp(-t * 22f);
                data[i] = Mathf.Sin(2f * Mathf.PI * 95f * t) * envelope * 0.4f;
            }
            AudioClip clip = AudioClip.Create("shift", samples, 1, rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        /// <summary>Rain loop (filtered noise).</summary>
        public static AudioClip RainLoop()
        {
            const int rate = 22050;
            const float seconds = 2f;
            int samples = (int)(rate * seconds);
            float[] data = new float[samples];
            float low = 0f;
            for (int i = 0; i < samples; i++)
            {
                float white = RandomValue(i) - 0.5f;
                low = low * 0.86f + white * 0.14f;
                data[i] = (white * 0.22f + low * 0.5f) * 0.55f;
            }
            AudioClip clip = AudioClip.Create("rain", samples, 1, rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        /// <summary>Deterministic pseudo random in [-1, 1].</summary>
        private static float RandomValue(int i)
        {
            uint x = (uint)(i * 1103515245 + 12345);
            x ^= x >> 16;
            x *= 0x7feb352d;
            x ^= x >> 15;
            return (x / (float)uint.MaxValue) * 2f - 1f;
        }
    }
}
