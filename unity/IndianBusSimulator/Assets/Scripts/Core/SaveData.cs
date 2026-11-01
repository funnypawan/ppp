using System;
using System.Collections.Generic;
using UnityEngine;

namespace IBS.Core
{
    /// <summary>Serialisable player progress.</summary>
    [Serializable]
    public class SaveData
    {
        public int Version = 1;
        public int Money = 5000;
        public int Level = 1;
        public List<string> UnlockedBuses = new List<string> { "city_public" };
        public string SelectedBus = "city_public";
        public List<string> UnlockedMaps = new List<string> { "indian_city" };
        public string SelectedMap = "indian_city";
        public List<string> CompletedMissions = new List<string>();
        public List<string> OwnedStickers = new List<string>();
        public Dictionary<string, BusCustomization> Customizations = new Dictionary<string, BusCustomization>();
        public PlayerStats Stats = new PlayerStats();
        public int DailyLastClaimDay;
        public int DailyStreak;
        public List<string> UnlockedAchievements = new List<string>();
    }

    [Serializable]
    public class PlayerStats
    {
        public float DistanceKm;
        public int PassengersDelivered;
        public int TotalFares;
        public int Trips;
        public int PerfectDrives;
        public int Crashes;
        public float PlayTimeSec;
    }

    /// <summary>Per bus look configuration.</summary>
    [Serializable]
    public class BusCustomization
    {
        public string Paint = "solid";
        public string BodyColor;
        public string InteriorColor = "beige";
        public string SeatDesign = "standard";
        public string Wheels = "standard";
        public string Rims = "steel";
        public string Headlights = "halogen";
        public string Horn = "air";
        public List<string> Stickers = new List<string>();
        public string LicensePlate = "MH 12 AB 1234";
        public float WindowTint = 0.3f;
    }

    /// <summary>
    /// Local save system backed by PlayerPrefs (JSON). Progress survives
    /// closing the game.
    /// </summary>
    public static class SaveSystem
    {
        private const string Key = "ibs3d.save.v1";
        private static SaveData _data;

        public static SaveData Data
        {
            get
            {
                if (_data == null) Load();
                return _data;
            }
        }

        public static void Load()
        {
            try
            {
                string json = PlayerPrefs.GetString(Key, string.Empty);
                if (string.IsNullOrEmpty(json))
                {
                    _data = new SaveData();
                    return;
                }
                _data = JsonUtility.FromJson<SaveData>(json) ?? new SaveData();
                if (_data.Customizations == null) _data.Customizations = new Dictionary<string, BusCustomization>();
                if (_data.Stats == null) _data.Stats = new PlayerStats();
            }
            catch (Exception e)
            {
                Debug.LogWarning("[save] could not read save, starting fresh: " + e.Message);
                _data = new SaveData();
            }
        }

        public static void Save()
        {
            try
            {
                PlayerPrefs.SetString(Key, JsonUtility.ToJson(Data));
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogWarning("[save] could not write save: " + e.Message);
            }
        }

        public static void AddMoney(int amount)
        {
            Data.Money = Math.Max(0, Data.Money + amount);
        }

        public static bool SpendMoney(int amount)
        {
            if (Data.Money < amount) return false;
            Data.Money -= amount;
            return true;
        }

        public static bool IsBusUnlocked(string id)
        {
            return Data.UnlockedBuses.Contains(id);
        }

        public static void UnlockBus(string id)
        {
            if (!Data.UnlockedBuses.Contains(id)) Data.UnlockedBuses.Add(id);
        }

        public static bool IsMapUnlocked(string id)
        {
            return Data.UnlockedMaps.Contains(id);
        }

        public static void UnlockMap(string id)
        {
            if (!Data.UnlockedMaps.Contains(id)) Data.UnlockedMaps.Add(id);
        }

        public static BusCustomization GetCustomization(string busId)
        {
            BusCustomization custom;
            if (!Data.Customizations.TryGetValue(busId, out custom))
            {
                custom = new BusCustomization();
                Data.Customizations[busId] = custom;
            }
            return custom;
        }

        public static void SetCustomization(string busId, BusCustomization custom)
        {
            Data.Customizations[busId] = custom;
            Save();
        }
    }
}
