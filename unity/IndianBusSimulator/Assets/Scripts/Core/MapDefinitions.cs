using System.Collections.Generic;
using UnityEngine;

namespace IBS.Core
{
    /// <summary>Static description of one playable map.</summary>
    public class MapDefinition
    {
        public string Id;
        public string Name;
        public string Tagline;
        public string Description;
        public string Layout;
        public int Price;
        public string DefaultWeather = "clear";
        public float DefaultTime = 12f;
        public float TrafficDensity = 0.6f;
        public int StopCount = 6;
        public float Size = 900f;
        public Color Ground = new Color(0.55f, 0.5f, 0.39f);
        public Color Road = new Color(0.23f, 0.23f, 0.24f);
        public Color RoadEdge = new Color(0.85f, 0.82f, 0.77f);
        public Color Marking = new Color(0.95f, 0.91f, 0.78f);
        public Color[] BuildingColors;
        public Color Foliage = new Color(0.3f, 0.48f, 0.21f);
        public Color Sky = new Color(0.62f, 0.78f, 0.91f);
        public Color Accent = new Color(0.95f, 0.64f, 0.24f);
        public bool HasMountains;
        public bool HasRiver;
        public bool HasToll;
        public int Flyovers;
    }

    public static class MapCatalog
    {
        public static readonly List<MapDefinition> All = new List<MapDefinition>
        {
            new MapDefinition {
                Id = "indian_city", Name = "Indian City", Tagline = "Ring road, bazaar lanes and a busy bus stand",
                Description = "A dense tier-two city with a ring road, market streets, flyovers, petrol pumps and a crowded central bus depot.",
                Layout = "city", Price = 0, DefaultWeather = "clear", DefaultTime = 9.5f, TrafficDensity = 0.7f, StopCount = 8, Size = 900f,
                Ground = new Color(0.55f, 0.5f, 0.39f), Road = new Color(0.23f, 0.23f, 0.24f), RoadEdge = new Color(0.85f, 0.82f, 0.77f),
                Marking = new Color(0.95f, 0.91f, 0.78f), Foliage = new Color(0.3f, 0.48f, 0.21f), Sky = new Color(0.62f, 0.78f, 0.91f),
                BuildingColors = new[] { new Color(0.85f,0.79f,0.65f), new Color(0.79f,0.66f,0.49f), new Color(0.73f,0.56f,0.42f), new Color(0.88f,0.83f,0.72f), new Color(0.66f,0.70f,0.75f) },
                HasRiver = true, Flyovers = 2 },
            new MapDefinition {
                Id = "indian_village", Name = "Indian Village", Tagline = "Fields, mud lanes and a weekly market",
                Description = "A farming village with paddy fields, mud-brick homes, a banyan tree and narrow lanes only a mini bus can handle.",
                Layout = "village", Price = 25000, DefaultWeather = "clear", DefaultTime = 7.5f, TrafficDensity = 0.3f, StopCount = 6, Size = 700f,
                Ground = new Color(0.49f, 0.6f, 0.31f), Road = new Color(0.55f, 0.45f, 0.32f), RoadEdge = new Color(0.66f, 0.56f, 0.44f),
                Marking = new Color(0.94f, 0.89f, 0.75f), Foliage = new Color(0.25f, 0.44f, 0.18f), Sky = new Color(0.75f, 0.88f, 0.94f),
                BuildingColors = new[] { new Color(0.85f,0.73f,0.55f), new Color(0.79f,0.63f,0.43f), new Color(0.89f,0.83f,0.68f) },
                HasRiver = true },
            new MapDefinition {
                Id = "national_highway", Name = "National Highway", Tagline = "Six lanes, toll plazas and long haul",
                Description = "The flagship national highway: wide carriageways, service roads, toll plazas, roadside dhaba stops and heavy fast traffic.",
                Layout = "highway", Price = 60000, DefaultWeather = "clear", DefaultTime = 12f, TrafficDensity = 0.85f, StopCount = 7, Size = 2200f,
                Ground = new Color(0.54f, 0.6f, 0.36f), Road = new Color(0.2f, 0.2f, 0.23f), RoadEdge = new Color(0.84f, 0.82f, 0.76f),
                Marking = new Color(0.96f, 0.93f, 0.8f), Foliage = new Color(0.29f, 0.46f, 0.2f), Sky = new Color(0.56f, 0.74f, 0.89f),
                BuildingColors = new[] { new Color(0.85f,0.8f,0.69f), new Color(0.76f,0.64f,0.49f), new Color(0.75f,0.68f,0.57f) },
                HasRiver = true, HasToll = true, Flyovers = 1 },
            new MapDefinition {
                Id = "mountain_road", Name = "Mountain Roads", Tagline = "Hairpins, valleys and a misty hill station",
                Description = "Climb into the hills on switchback roads with blind corners, rock faces, a river gorge and a hill station bazaar at the top.",
                Layout = "mountain", Price = 90000, DefaultWeather = "fog", DefaultTime = 8f, TrafficDensity = 0.25f, StopCount = 5, Size = 1600f,
                Ground = new Color(0.44f, 0.48f, 0.29f), Road = new Color(0.27f, 0.27f, 0.3f), RoadEdge = new Color(0.75f, 0.71f, 0.64f),
                Marking = new Color(0.94f, 0.9f, 0.78f), Foliage = new Color(0.22f, 0.39f, 0.17f), Sky = new Color(0.74f, 0.83f, 0.89f),
                BuildingColors = new[] { new Color(0.84f,0.78f,0.65f), new Color(0.75f,0.66f,0.53f), new Color(0.89f,0.84f,0.73f) },
                HasMountains = true, HasRiver = true },
            new MapDefinition {
                Id = "desert_road", Name = "Desert Roads", Tagline = "Sand, heat and a long empty highway",
                Description = "A road that runs through a sandy desert: dunes, a roadside chai dhaba and fuel shortages make every kilometre count.",
                Layout = "desert", Price = 120000, DefaultWeather = "clear", DefaultTime = 15f, TrafficDensity = 0.2f, StopCount = 4, Size = 2000f,
                Ground = new Color(0.85f, 0.74f, 0.52f), Road = new Color(0.29f, 0.28f, 0.25f), RoadEdge = new Color(0.79f, 0.73f, 0.58f),
                Marking = new Color(0.96f, 0.93f, 0.8f), Foliage = new Color(0.54f, 0.56f, 0.31f), Sky = new Color(0.91f, 0.79f, 0.55f),
                BuildingColors = new[] { new Color(0.85f,0.74f,0.56f), new Color(0.76f,0.63f,0.4f), new Color(0.88f,0.8f,0.65f) },
                HasToll = true },
            new MapDefinition {
                Id = "rainy_city", Name = "Rainy City", Tagline = "Monsoon traffic, wet paint and poor visibility",
                Description = "The same city under a monsoon downpour: standing water, spray from every bus, glowing signals and slippery lanes.",
                Layout = "city", Price = 150000, DefaultWeather = "heavy_rain", DefaultTime = 16f, TrafficDensity = 0.8f, StopCount = 8, Size = 900f,
                Ground = new Color(0.37f, 0.42f, 0.35f), Road = new Color(0.17f, 0.18f, 0.2f), RoadEdge = new Color(0.6f, 0.63f, 0.65f),
                Marking = new Color(0.91f, 0.89f, 0.78f), Foliage = new Color(0.24f, 0.37f, 0.17f), Sky = new Color(0.55f, 0.59f, 0.64f),
                BuildingColors = new[] { new Color(0.73f,0.7f,0.64f), new Color(0.66f,0.65f,0.59f), new Color(0.78f,0.75f,0.68f) },
                HasRiver = true, Flyovers = 2 },
            new MapDefinition {
                Id = "night_highway", Name = "Night Highway", Tagline = "Headlights, reflectors and diesel in the dark",
                Description = "A long deserted highway after midnight: sodium lamps, reflective studs, star fields and the glow of distant town lights.",
                Layout = "highway", Price = 200000, DefaultWeather = "clear", DefaultTime = 1.5f, TrafficDensity = 0.45f, StopCount = 5, Size = 2400f,
                Ground = new Color(0.18f, 0.23f, 0.2f), Road = new Color(0.14f, 0.15f, 0.16f), RoadEdge = new Color(0.33f, 0.35f, 0.38f),
                Marking = new Color(0.96f, 0.93f, 0.8f), Foliage = new Color(0.15f, 0.25f, 0.12f), Sky = new Color(0.04f, 0.07f, 0.15f),
                BuildingColors = new[] { new Color(0.43f,0.42f,0.39f), new Color(0.36f,0.35f,0.33f) },
                HasRiver = true, HasToll = true },
        };

        public static MapDefinition Get(string id)
        {
            foreach (var m in All)
            {
                if (m.Id == id) return m;
            }
            return All[0];
        }
    }

    /// <summary>Weather presets and their effect on grip and visibility.</summary>
    public class WeatherDefinition
    {
        public string Id;
        public string Name;
        public float Grip;
        public float FogDensity;
        public float Rain;
        public float Snow;
        public float Cloud;
    }

    public static class WeatherCatalog
    {
        public static readonly List<WeatherDefinition> All = new List<WeatherDefinition>
        {
            new WeatherDefinition { Id = "clear", Name = "Sunny", Grip = 1.0f, FogDensity = 0.0016f, Rain = 0f, Snow = 0f, Cloud = 0.15f },
            new WeatherDefinition { Id = "cloudy", Name = "Cloudy", Grip = 0.95f, FogDensity = 0.0026f, Rain = 0f, Snow = 0f, Cloud = 0.65f },
            new WeatherDefinition { Id = "light_rain", Name = "Light Rain", Grip = 0.78f, FogDensity = 0.0042f, Rain = 0.45f, Snow = 0f, Cloud = 0.85f },
            new WeatherDefinition { Id = "heavy_rain", Name = "Heavy Rain", Grip = 0.62f, FogDensity = 0.0062f, Rain = 1f, Snow = 0f, Cloud = 1f },
            new WeatherDefinition { Id = "fog", Name = "Fog", Grip = 0.9f, FogDensity = 0.016f, Rain = 0f, Snow = 0f, Cloud = 0.5f },
            new WeatherDefinition { Id = "snow", Name = "Snow", Grip = 0.55f, FogDensity = 0.0055f, Rain = 0f, Snow = 1f, Cloud = 0.9f },
        };

        public static WeatherDefinition Get(string id)
        {
            foreach (var w in All)
            {
                if (w.Id == id) return w;
            }
            return All[0];
        }
    }

    public struct TimePhase
    {
        public string Id;
        public string Name;
        public float Hour;
    }

    public static class TimePhases
    {
        public static readonly TimePhase[] All =
        {
            new TimePhase { Id = "sunrise", Name = "Sunrise", Hour = 6f },
            new TimePhase { Id = "day", Name = "Day", Hour = 12f },
            new TimePhase { Id = "sunset", Name = "Sunset", Hour = 18f },
            new TimePhase { Id = "night", Name = "Night", Hour = 1f },
        };
    }
}
