using System;
using System.Collections.Generic;

namespace IBS.Core
{
    /// <summary>
    /// Pricing rules, daily rewards and achievements.
    /// Mirrors web/js/game/economy.js.
    /// </summary>
    public static class Economy
    {
        public const float FarePerKm = 12f;
        public const float FareBase = 5f;
        public const float MaintenancePerKm = 3.5f;
        public const float FuelPricePerLitre = 92f;

        public struct Reward
        {
            public int Day;
            public int Amount;
            public string Label;
        }

        public static readonly Reward[] DailyRewards =
        {
            new Reward { Day = 1, Amount = 500, Label = "Daily fuel voucher" },
            new Reward { Day = 2, Amount = 750, Label = "Daily fuel voucher" },
            new Reward { Day = 3, Amount = 1000, Label = "Daily fuel voucher" },
            new Reward { Day = 4, Amount = 1500, Label = "Daily fuel voucher" },
            new Reward { Day = 5, Amount = 2000, Label = "Daily fuel voucher" },
            new Reward { Day = 6, Amount = 3000, Label = "Daily fuel voucher" },
            new Reward { Day = 7, Amount = 5000, Label = "Weekly bonus payout" },
        };

        public static int PassengerFare(float distanceKm, float satisfaction)
        {
            float fare = FareBase + distanceKm * FarePerKm;
            float tip = 1f + (satisfaction - 0.5f) * 0.4f;
            return Math.Max(1, (int)Math.Round(fare * tip));
        }

        public static int TripRunningCost(float distanceKm, float litresUsed)
        {
            return (int)Math.Round(distanceKm * MaintenancePerKm + litresUsed * FuelPricePerLitre);
        }

        public static int SpeedFine(float limitKmh, float actualKmh)
        {
            float excess = actualKmh - limitKmh;
            if (excess <= 0f) return 0;
            if (excess <= 10f) return 100;
            if (excess <= 20f) return 250;
            if (excess <= 30f) return 500;
            return 1000;
        }

        public static int SignalFine()
        {
            return 500;
        }

        public static int CollisionFine(float damageAmount)
        {
            return (int)Math.Round(250f + damageAmount * 1500f);
        }

        /// <summary>State of the daily reward ladder for a given day number.</summary>
        public struct DailyRewardState
        {
            public bool Available;
            public int Day;
            public int Amount;
            public string Label;
            public int NextStreak;
        }

        public static DailyRewardState GetDailyRewardState(int lastClaimDay, int streak, int todayDays)
        {
            DailyRewardState state;
            if (lastClaimDay == todayDays)
            {
                state.Available = false;
                state.Day = (streak % 7) + 1;
                state.Amount = 0;
                state.Label = "Come back tomorrow";
                state.NextStreak = streak;
                return state;
            }
            bool continued = lastClaimDay == todayDays - 1;
            int nextStreak = continued ? streak + 1 : 1;
            Reward reward = DailyRewards[(nextStreak - 1) % DailyRewards.Length];
            state.Available = true;
            state.Day = nextStreak;
            state.Amount = reward.Amount;
            state.Label = reward.Label;
            state.NextStreak = nextStreak;
            return state;
        }
    }

    /// <summary>Career mode mission definitions and the live mission tracker.</summary>
    public class MissionDefinition
    {
        public string Id;
        public string Category;
        public string Title;
        public string Description;
        public string Map;
        public string Bus;
        public int Difficulty;
        public float TimeLimit;
        public int Reward;
        public string[] Objectives;
    }

    public static class MissionCatalog
    {
        public static readonly string[] Categories =
        {
            "city", "village", "highway", "long_distance", "mountain", "night", "rain", "passenger", "parking"
        };

        public static readonly string[] CategoryNames =
        {
            "City Driving", "Village Driving", "Highway Driving", "Long Distance Routes",
            "Mountain Driving", "Night Driving", "Rain Driving", "Passenger Transport", "Parking Challenges"
        };

        public static readonly List<MissionDefinition> All = new List<MissionDefinition>
        {
            new MissionDefinition { Id = "m_city_01", Category = "city", Title = "First Shift", Map = "indian_city", Bus = "city_public", Difficulty = 1, TimeLimit = 420f, Reward = 4000,
                Description = "Start your career on the Ring Road. Pick up waiting passengers and drop them at the depot.",
                Objectives = new[] { "Deliver 6 passengers", "Never exceed 60 km/h" } },
            new MissionDefinition { Id = "m_city_02", Category = "city", Title = "Bazaar Traffic", Map = "indian_city", Bus = "mini_bus", Difficulty = 2, TimeLimit = 360f, Reward = 7000,
                Description = "Thread the old bazaar lanes, stop at three halts and keep your passengers calm.",
                Objectives = new[] { "Deliver 10 passengers", "Never exceed 45 km/h" } },
            new MissionDefinition { Id = "m_village_01", Category = "village", Title = "Village Circuit", Map = "indian_village", Bus = "mini_bus", Difficulty = 1, TimeLimit = 420f, Reward = 6000,
                Description = "Collect villagers from the fields and carry them to the weekly market.",
                Objectives = new[] { "Deliver 8 passengers" } },
            new MissionDefinition { Id = "m_highway_01", Category = "highway", Title = "Express Run", Map = "national_highway", Bus = "volvo_inspired", Difficulty = 2, TimeLimit = 300f, Reward = 15000,
                Description = "Get the coach onto the expressway and cover 18 km without losing time.",
                Objectives = new[] { "Cover 18 km", "Never exceed 100 km/h" } },
            new MissionDefinition { Id = "m_long_01", Category = "long_distance", Title = "Overnight Haul", Map = "national_highway", Bus = "sleeper_buses", Difficulty = 3, TimeLimit = 600f, Reward = 28000,
                Description = "A sleeper bus run across three towns. Passenger comfort matters more than speed.",
                Objectives = new[] { "Deliver 18 passengers", "Keep passenger satisfaction above 60%" } },
            new MissionDefinition { Id = "m_mountain_01", Category = "mountain", Title = "Hill Station Climb", Map = "mountain_road", Bus = "tourist_bus", Difficulty = 2, TimeLimit = 480f, Reward = 18000,
                Description = "Take the tourist bus up to the hill station. Use the engine brake on the way down.",
                Objectives = new[] { "Deliver 12 passengers", "Never exceed 50 km/h" } },
            new MissionDefinition { Id = "m_night_01", Category = "night", Title = "Midnight Service", Map = "night_highway", Bus = "luxury_coach", Difficulty = 2, TimeLimit = 420f, Reward = 20000,
                Description = "A quiet highway run after midnight. The road is yours, the fatigue is real.",
                Objectives = new[] { "Cover 22 km", "Never exceed 90 km/h" } },
            new MissionDefinition { Id = "m_rain_01", Category = "rain", Title = "Monsoon Routes", Map = "rainy_city", Bus = "city_public", Difficulty = 3, TimeLimit = 480f, Reward = 24000,
                Description = "Heavy rain on the city ring road. Brake early, brake smoothly.",
                Objectives = new[] { "Deliver 12 passengers", "Finish without a single collision" } },
            new MissionDefinition { Id = "m_pax_01", Category = "passenger", Title = "Standing Room", Map = "indian_city", Bus = "double_decker", Difficulty = 3, TimeLimit = 420f, Reward = 26000,
                Description = "Double decker capacity test - fill the upper deck and keep everyone seated.",
                Objectives = new[] { "Deliver 24 passengers", "Keep satisfaction above 65%" } },
            new MissionDefinition { Id = "m_park_01", Category = "parking", Title = "Depot Bay", Map = "indian_city", Bus = "city_public", Difficulty = 2, TimeLimit = 120f, Reward = 15000,
                Description = "Reverse into the depot bay within 60 seconds without touching the wall.",
                Objectives = new[] { "Park in the marked bay" } },
        };

        public static MissionDefinition Get(string id)
        {
            foreach (var m in All)
            {
                if (m.Id == id) return m;
            }
            return All[0];
        }
    }

    /// <summary>Tracks the live progress of one mission attempt.</summary>
    public class MissionSession
    {
        public MissionDefinition Mission;
        public float Elapsed;
        public string Status = "running";
        public string FailReason = "";
        public int PassengersDelivered;
        public int PassengersPicked;
        public float DistanceKm;
        public int Collisions;
        public float MaxDamage;
        public int SpeedViolations;
        public float SatisfactionSum;
        public int SatisfactionCount;
        public bool Parked;
        public int Reward;

        public MissionSession(MissionDefinition mission)
        {
            Mission = mission;
        }

        public float TimeRemaining
        {
            get { return Math.Max(0f, Mission.TimeLimit - Elapsed); }
        }

        public float AverageSatisfaction
        {
            get { return SatisfactionCount == 0 ? 1f : SatisfactionSum / SatisfactionCount; }
        }

        public void OnPassengerPicked()
        {
            PassengersPicked++;
        }

        public void OnPassengerDropped(float satisfaction)
        {
            PassengersDelivered++;
            SatisfactionSum += satisfaction;
            SatisfactionCount++;
        }

        public void OnCollision(float damage)
        {
            Collisions++;
            MaxDamage = Math.Max(MaxDamage, damage);
        }

        public void OnSpeedViolation()
        {
            SpeedViolations++;
        }

        public void OnParked()
        {
            Parked = true;
        }

        /// <summary>Advances the mission; returns "running", "complete" or "failed".</summary>
        public string Update(float dt, float damage)
        {
            if (Status != "running") return Status;
            Elapsed += dt;
            MaxDamage = Math.Max(MaxDamage, damage);
            if (Mission.TimeLimit > 0f && Elapsed > Mission.TimeLimit)
            {
                Status = "failed";
                FailReason = "Time limit exceeded";
                return Status;
            }

            string[] objectives = Mission.Objectives;
            for (int i = 0; i < objectives.Length; i++)
            {
                string text = objectives[i];
                if (text.StartsWith("Deliver") && PassengersDelivered >= RequiredCount(text)) continue;
                if (text.StartsWith("Cover") && DistanceKm >= RequiredDistance(text)) continue;
                if (text.StartsWith("Never exceed") && SpeedViolations == 0) continue;
                if (text.StartsWith("Finish without") && Collisions == 0) continue;
                if (text.StartsWith("Keep body damage") && MaxDamage < 0.2f) continue;
                if (text.StartsWith("Keep satisfaction") && AverageSatisfaction >= 0.6f) continue;
                if (text.StartsWith("Keep passenger satisfaction") && AverageSatisfaction >= 0.6f) continue;
                if (text.StartsWith("Park") && Parked) continue;
                return "running";
            }

            Status = "complete";
            int baseReward = Mission.Reward;
            int timeBonus = (int)Math.Round(baseReward * 0.25f * Math.Max(0f, 1f - Elapsed / Mission.TimeLimit));
            int smoothBonus = Collisions == 0 ? (int)Math.Round(baseReward * 0.2f) : 0;
            Reward = baseReward + timeBonus + smoothBonus;
            return Status;
        }

        private static int RequiredCount(string text)
        {
            string[] parts = text.Split(' ');
            for (int i = 0; i < parts.Length; i++)
            {
                int value;
                if (int.TryParse(parts[i], out value)) return value;
            }
            return 0;
        }

        private static float RequiredDistance(string text)
        {
            string[] parts = text.Split(' ');
            for (int i = 0; i < parts.Length; i++)
            {
                float value;
                if (float.TryParse(parts[i], out value)) return value;
            }
            return 0f;
        }
    }
}
