using UnityEngine;
using IBS.Core;
using IBS.Util;

namespace IBS.World
{
    /// <summary>
    /// Day/night cycle and weather. Drives the sun light, ambient colour,
    /// fog, particle precipitation and the surface grip multiplier.
    /// </summary>
    public class EnvironmentController : MonoBehaviour
    {
        public float Hour = 12f;
        public string WeatherId = "clear";
        public bool TimeFlows = true;

        public Light Sun;
        public WeatherDefinition Weather;

        private ParticleSystem _precipitation;
        private ParticleSystemRenderer _precipRenderer;
        private Material _skyMaterial;
        private float _weatherBlend;

        public void Initialise(MapDefinition map, string weatherId, float hour)
        {
            WeatherId = weatherId;
            Weather = WeatherCatalog.Get(weatherId);
            Hour = hour;

            GameObject sunGo = new GameObject("Sun");
            sunGo.transform.SetParent(transform, false);
            Sun = sunGo.AddComponent<Light>();
            Sun.type = LightType.Directional;
            Sun.shadows = LightShadows.Soft;
            Sun.intensity = 1.1f;

            GameObject fillGo = new GameObject("AmbientFill");
            fillGo.transform.SetParent(transform, false);
            Light fill = fillGo.AddComponent<Light>();
            fill.type = LightType.Directional;
            fill.intensity = 0.25f;
            fill.color = new Color(0.7f, 0.78f, 0.9f);
            fillGo.transform.rotation = Quaternion.Euler(-35f, 150f, 0f);

            GameObject sky = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            sky.name = "SkyDome";
            sky.transform.SetParent(transform, false);
            sky.transform.localScale = Vector3.one * 1600f;
            sky.transform.localPosition = new Vector3(0f, -200f, 0f);
            Object.Destroy(sky.GetComponent<Collider>());
            _skyMaterial = ProceduralMesh.Material(Map.Sky);
            sky.GetComponent<MeshRenderer>().sharedMaterial = _skyMaterial;

            GameObject rain = new GameObject("Precipitation");
            rain.transform.SetParent(transform, false);
            rain.transform.localPosition = new Vector3(0f, 26f, 0f);
            _precipitation = rain.AddComponent<ParticleSystem>();
            _precipRenderer = rain.GetComponent<ParticleSystemRenderer>();
            _precipRenderer.renderMode = ParticleSystemRenderMode.Stretch;
            _precipRenderer.material = ProceduralMesh.Material(new Color(0.8f, 0.86f, 0.95f));
            _precipitation.Stop();
        }

        /// <summary>Sun elevation/azimuth and colour for a given hour.</summary>
        public static void EvaluateSun(float hour, out Vector3 direction, out Color color, out float intensity, out Color ambient)
        {
            float t = (hour - 6f) / 12f;                 // 0 at sunrise, 1 at sunset
            float elevation = Mathf.Sin(Mathf.Clamp01(t) * Mathf.PI) * 68f;
            if (hour < 6f || hour > 18f)
            {
                float nightT = hour > 18f ? (hour - 18f) / 12f : (hour + 6f) / 12f;
                elevation = 32f - nightT * 60f;
            }
            float azimuth = (hour / 24f) * 360f;
            direction = Quaternion.Euler(elevation, azimuth, 0f) * Vector3.forward;
            direction = -direction;

            float day = Mathf.Clamp01(Mathf.Sin(Mathf.Clamp01(t) * Mathf.PI));
            color = Color.Lerp(new Color(0.45f, 0.52f, 0.75f), new Color(1f, 0.96f, 0.86f), day);
            if (hour < 6f || hour > 18f) color = new Color(0.35f, 0.42f, 0.68f);
            intensity = Mathf.Lerp(0.16f, 1.25f, day);
            ambient = Color.Lerp(new Color(0.07f, 0.09f, 0.16f), new Color(0.58f, 0.62f, 0.68f), day);
        }

        public void UpdateEnvironment(float dt)
        {
            if (TimeFlows)
            {
                Hour += dt * 0.35f;
                if (Hour >= 24f) Hour -= 24f;
            }

            Weather = WeatherCatalog.Get(WeatherId);
            _weatherBlend = Mathf.MoveTowards(_weatherBlend, 1f, dt * 0.6f);

            Vector3 direction;
            Color color;
            float intensity;
            Color ambient;
            EvaluateSun(Hour, out direction, out color, out intensity, out ambient);
            if (Sun != null)
            {
                Sun.transform.rotation = Quaternion.LookRotation(direction, Vector3.up);
                Sun.color = color;
                Sun.intensity = intensity * Mathf.Lerp(0.55f, 1f, Weather.Cloud + 0.2f);
            }
            RenderSettings.ambientLight = ambient;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = Color.Lerp(ambient, Weather.Cloud > 0.6f ? new Color(0.55f, 0.57f, 0.6f) : ambient, 0.5f);
            RenderSettings.fogDensity = Weather.FogDensity * Mathf.Lerp(0.6f, 1.4f, Weather.Cloud);

            if (_skyMaterial != null)
            {
                Color skyColor = Color.Lerp(Map.Sky, new Color(0.08f, 0.1f, 0.18f), 1f - Mathf.Clamp01(intensity));
                _skyMaterial.color = skyColor;
            }

            UpdatePrecipitation();
        }

        private void UpdatePrecipitation()
        {
            if (_precipitation == null) return;
            float rain = Weather.Rain;
            float snow = Weather.Snow;
            if (rain > 0.01f || snow > 0.01f)
            {
                ParticleSystem.MainModule main = _precipitation.main;
                main.startSpeed = rain > 0.01f ? 26f : 4f;
                main.startSize = rain > 0.01f ? 0.12f : 0.28f;
                main.startLifetime = 1.6f;
                main.maxParticles = rain > 0.01f ? 3000 : 1400;
                ParticleSystem.EmissionModule emission = _precipitation.emission;
                emission.rateOverTime = (rain * 2600f) + (snow * 700f);
                ParticleSystem.ShapeModule shape = _precipitation.shape;
                shape.shapeType = ParticleSystemShapeType.Box;
                shape.scale = new Vector3(90f, 1f, 90f);
                if (_precipRenderer != null)
                {
                    _precipRenderer.material.color = snow > 0.01f ? Color.white : new Color(0.78f, 0.85f, 0.95f);
                }
                if (!_precipitation.isPlaying) _precipitation.Play();
            }
            else if (_precipitation.isPlaying)
            {
                _precipitation.Stop();
            }
        }

        public float GripMultiplier
        {
            get { return Weather.Grip; }
        }

        public bool IsNight
        {
            get { return Hour < 6f || Hour >= 18.5f; }
        }
    }
}
