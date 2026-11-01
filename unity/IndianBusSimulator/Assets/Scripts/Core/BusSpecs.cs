using System;
using System.Collections.Generic;

namespace IBS.Core
{
    /// <summary>
    /// Data for one bus in the catalogue. Mirrors web/js/vehicles/specs.js.
    /// </summary>
    [Serializable]
    public class BusSpec
    {
        public string Id;
        public string Name;
        public string Tagline;
        public string Description;

        public float Length;
        public float Width;
        public float Height;
        public float Mass;
        public float Wheelbase;
        public float FrontOverhang;
        public float RearOverhang;

        public float PowerKw;
        public float PeakTorque;
        public float MaxSpeedKmh;
        public float[] GearRatios;
        public float ReverseRatio;
        public float FinalDrive;
        public float IdleRpm;
        public float MaxRpm;
        public float BrakeTorque;
        public float RetarderTorque;
        public float SteerMaxDeg;

        public int SeatRows;
        public int SeatsPerRow;
        public int BerthRows;
        public int UpperDeckRows;
        public int UpperDeckSeatsPerRow;
        public int StandingCapacity;

        public float FuelTank;
        public float TireRadius;
        public float TireWidth;
        public float GroundClearance;
        public float DragCoefficient;
        public float FrontalArea;
        public int Price;
        public string DefaultPaint;
        public string BodyStyle;

        public int SeatCapacity
        {
            get
            {
                int baseSeats = SeatRows * SeatsPerRow;
                int upper = UpperDeckRows > 0 ? UpperDeckRows * UpperDeckSeatsPerRow : 0;
                int berths = BerthRows > 0 ? BerthRows * 2 : 0;
                return baseSeats + upper + berths;
            }
        }

        /// <summary>Peak torque curve: nearly full torque from idle, tapering at the red line.</summary>
        public float EngineTorque(float rpm)
        {
            float r = Math.Max(0.0001f, (rpm - IdleRpm) / (MaxRpm - IdleRpm));
            float shape;
            if (r < 0.1f) shape = 0.88f + (r / 0.1f) * 0.12f;
            else if (r <= 0.78f) shape = 1f;
            else shape = 1f - ((r - 0.78f) / 0.22f) * 0.32f;
            return PeakTorque * shape;
        }

        /// <summary>Gear ratio for the selected gear (0 = neutral, -1 = reverse).</summary>
        public float GearRatio(int gear)
        {
            if (gear == 0) return 0f;
            if (gear < 0) return -ReverseRatio;
            int idx = Math.Abs(gear) - 1;
            if (idx >= GearRatios.Length) idx = GearRatios.Length - 1;
            return GearRatios[idx];
        }
    }

    /// <summary>
    /// The eight original buses of the catalogue.
    /// </summary>
    public static class BusCatalog
    {
        public static readonly List<BusSpec> All = new List<BusSpec>
        {
            new BusSpec
            {
                Id = "city_public", Name = "Sarathi City Bus", Tagline = "Everyday public transport workhorse",
                Description = "The classic Indian municipal bus. Heavy, slow to accelerate and wide turning, but built to survive a decade of stop-and-go city traffic.",
                Length = 10.6f, Width = 2.5f, Height = 3.15f, Mass = 9200f, Wheelbase = 5.2f,
                FrontOverhang = 1.85f, RearOverhang = 1.75f,
                PowerKw = 74f, PeakTorque = 320f, MaxSpeedKmh = 78f,
                GearRatios = new[] { 3.6f, 2.0f, 1.32f, 0.92f, 0.72f, 0.56f },
                ReverseRatio = 3.9f, FinalDrive = 4.1f, IdleRpm = 700f, MaxRpm = 2400f,
                BrakeTorque = 17000f, RetarderTorque = 2600f, SteerMaxDeg = 42f,
                SeatRows = 11, SeatsPerRow = 3, StandingCapacity = 18,
                FuelTank = 180f, TireRadius = 0.52f, TireWidth = 0.24f, GroundClearance = 0.34f,
                DragCoefficient = 0.62f, FrontalArea = 7.4f, Price = 0,
                DefaultPaint = "#e04a2f", BodyStyle = "city"
            },
            new BusSpec
            {
                Id = "luxury_coach", Name = "Rajhans Luxury Coach", Tagline = "AC sleeper-class long distance coach",
                Description = "A premium air-conditioned coach with plush reclining seats, generous luggage bays and a powerful diesel tuned for 120 km/h on the highway.",
                Length = 12.2f, Width = 2.55f, Height = 3.7f, Mass = 12500f, Wheelbase = 6.1f,
                FrontOverhang = 2.1f, RearOverhang = 2.0f,
                PowerKw = 183f, PeakTorque = 980f, MaxSpeedKmh = 122f,
                GearRatios = new[] { 3.9f, 2.1f, 1.36f, 0.95f, 0.76f, 0.6f, 0.48f },
                ReverseRatio = 4.2f, FinalDrive = 3.7f, IdleRpm = 650f, MaxRpm = 2200f,
                BrakeTorque = 24000f, RetarderTorque = 5000f, SteerMaxDeg = 38f,
                SeatRows = 12, SeatsPerRow = 2,
                FuelTank = 300f, TireRadius = 0.55f, TireWidth = 0.26f, GroundClearance = 0.3f,
                DragCoefficient = 0.5f, FrontalArea = 8.1f, Price = 450000,
                DefaultPaint = "#1f3b73", BodyStyle = "coach"
            },
            new BusSpec
            {
                Id = "sleeper_buses", Name = "Ratna Sleeper", Tagline = "Night sleeper with two-level berths",
                Description = "Roomy sleeper bus built for overnight runs. Two-deck berths, a low centre of gravity and a soft suspension that keeps tired passengers happy.",
                Length = 11.4f, Width = 2.5f, Height = 3.55f, Mass = 11800f, Wheelbase = 5.8f,
                FrontOverhang = 2.0f, RearOverhang = 1.8f,
                PowerKw = 132f, PeakTorque = 720f, MaxSpeedKmh = 105f,
                GearRatios = new[] { 3.8f, 2.05f, 1.34f, 0.94f, 0.74f, 0.58f },
                ReverseRatio = 4.0f, FinalDrive = 3.9f, IdleRpm = 680f, MaxRpm = 2300f,
                BrakeTorque = 22000f, RetarderTorque = 4400f, SteerMaxDeg = 39f,
                SeatRows = 9, SeatsPerRow = 2, BerthRows = 9,
                FuelTank = 260f, TireRadius = 0.53f, TireWidth = 0.25f, GroundClearance = 0.3f,
                DragCoefficient = 0.54f, FrontalArea = 7.9f, Price = 320000,
                DefaultPaint = "#6b2fa0", BodyStyle = "sleeper"
            },
            new BusSpec
            {
                Id = "tourist_bus", Name = "Himalaya Tourist Bus", Tagline = "Colourful open-window tourer",
                Description = "A cheerful window-lifted tourist bus for hill stations. Light, nimbler than a coach and happy on winding roads.",
                Length = 9.9f, Width = 2.45f, Height = 3.3f, Mass = 8400f, Wheelbase = 4.9f,
                FrontOverhang = 1.7f, RearOverhang = 1.7f,
                PowerKw = 96f, PeakTorque = 430f, MaxSpeedKmh = 96f,
                GearRatios = new[] { 3.5f, 1.95f, 1.28f, 0.9f, 0.7f, 0.55f },
                ReverseRatio = 3.8f, FinalDrive = 4.2f, IdleRpm = 720f, MaxRpm = 2500f,
                BrakeTorque = 15000f, RetarderTorque = 2800f, SteerMaxDeg = 44f,
                SeatRows = 10, SeatsPerRow = 3, StandingCapacity = 12,
                FuelTank = 160f, TireRadius = 0.5f, TireWidth = 0.23f, GroundClearance = 0.36f,
                DragCoefficient = 0.64f, FrontalArea = 7.2f, Price = 180000,
                DefaultPaint = "#f2a33c", BodyStyle = "tourist"
            },
            new BusSpec
            {
                Id = "school_bus", Name = "Vidyalaya School Bus", Tagline = "Short, safe and easy to manoeuvre",
                Description = "A compact school bus with a stop arm and a top speed limiter. A very short wheelbase makes it a joy to park in tight city lanes.",
                Length = 7.4f, Width = 2.3f, Height = 2.95f, Mass = 6100f, Wheelbase = 3.9f,
                FrontOverhang = 1.3f, RearOverhang = 1.4f,
                PowerKw = 66f, PeakTorque = 240f, MaxSpeedKmh = 72f,
                GearRatios = new[] { 3.4f, 1.9f, 1.24f, 0.86f, 0.68f },
                ReverseRatio = 3.6f, FinalDrive = 4.4f, IdleRpm = 750f, MaxRpm = 2600f,
                BrakeTorque = 10000f, RetarderTorque = 1700f, SteerMaxDeg = 46f,
                SeatRows = 6, SeatsPerRow = 3,
                FuelTank = 90f, TireRadius = 0.45f, TireWidth = 0.21f, GroundClearance = 0.3f,
                DragCoefficient = 0.66f, FrontalArea = 6.2f, Price = 90000,
                DefaultPaint = "#f2c500", BodyStyle = "school"
            },
            new BusSpec
            {
                Id = "mini_bus", Name = "Chhota Mini Bus", Tagline = "Twist-and-shuttle through tight lanes",
                Description = "A short mini bus that threads through congested bazaars and old city lanes. Quick off the line, but nervous at high speed.",
                Length = 6.6f, Width = 2.05f, Height = 2.85f, Mass = 4200f, Wheelbase = 3.4f,
                FrontOverhang = 1.1f, RearOverhang = 1.2f,
                PowerKw = 58f, PeakTorque = 180f, MaxSpeedKmh = 88f,
                GearRatios = new[] { 3.3f, 1.85f, 1.2f, 0.85f, 0.66f },
                ReverseRatio = 3.4f, FinalDrive = 4.6f, IdleRpm = 780f, MaxRpm = 2700f,
                BrakeTorque = 6200f, RetarderTorque = 1100f, SteerMaxDeg = 48f,
                SeatRows = 7, SeatsPerRow = 2, StandingCapacity = 14,
                FuelTank = 65f, TireRadius = 0.4f, TireWidth = 0.19f, GroundClearance = 0.26f,
                DragCoefficient = 0.7f, FrontalArea = 5.4f, Price = 65000,
                DefaultPaint = "#2aa3a1", BodyStyle = "mini"
            },
            new BusSpec
            {
                Id = "double_decker", Name = "Doubles Deluxe", Tagline = "Two floors of city capacity",
                Description = "A double-decker city bus with an upper deck lounge. Tall, heavy and prone to sway, corner gently and watch the roof clearance.",
                Length = 11.6f, Width = 2.55f, Height = 4.35f, Mass = 15800f, Wheelbase = 6.0f,
                FrontOverhang = 2.0f, RearOverhang = 1.9f,
                PowerKw = 220f, PeakTorque = 1350f, MaxSpeedKmh = 92f,
                GearRatios = new[] { 3.95f, 2.1f, 1.38f, 0.96f, 0.76f, 0.6f },
                ReverseRatio = 4.3f, FinalDrive = 3.6f, IdleRpm = 620f, MaxRpm = 2100f,
                BrakeTorque = 32000f, RetarderTorque = 5800f, SteerMaxDeg = 36f,
                SeatRows = 9, SeatsPerRow = 3, UpperDeckRows = 8, UpperDeckSeatsPerRow = 3,
                StandingCapacity = 45,
                FuelTank = 320f, TireRadius = 0.55f, TireWidth = 0.27f, GroundClearance = 0.32f,
                DragCoefficient = 0.72f, FrontalArea = 9.4f, Price = 780000,
                DefaultPaint = "#c0392b", BodyStyle = "double"
            },
            new BusSpec
            {
                Id = "volvo_inspired", Name = "Bharat Coach 9000", Tagline = "Flagship long-distance highway coach",
                Description = "A flagship highway coach inspired by modern European intercity buses. Powerful, stable at speed and the favourite for premium routes.",
                Length = 13.4f, Width = 2.6f, Height = 3.85f, Mass = 13800f, Wheelbase = 6.6f,
                FrontOverhang = 2.3f, RearOverhang = 2.1f,
                PowerKw = 290f, PeakTorque = 1600f, MaxSpeedKmh = 132f,
                GearRatios = new[] { 4.05f, 2.2f, 1.42f, 0.98f, 0.78f, 0.62f, 0.5f },
                ReverseRatio = 4.4f, FinalDrive = 3.45f, IdleRpm = 600f, MaxRpm = 2000f,
                BrakeTorque = 28000f, RetarderTorque = 6400f, SteerMaxDeg = 37f,
                SeatRows = 11, SeatsPerRow = 2,
                FuelTank = 340f, TireRadius = 0.56f, TireWidth = 0.27f, GroundClearance = 0.28f,
                DragCoefficient = 0.46f, FrontalArea = 8.4f, Price = 1250000,
                DefaultPaint = "#0f2a4a", BodyStyle = "volvo"
            },
        };

        private static readonly Dictionary<string, BusSpec> _byId = BuildIndex();

        private static Dictionary<string, BusSpec> BuildIndex()
        {
            var map = new Dictionary<string, BusSpec>();
            foreach (var spec in All)
            {
                map[spec.Id] = spec;
            }
            return map;
        }

        public static BusSpec Get(string id)
        {
            BusSpec spec;
            if (id != null && _byId.TryGetValue(id, out spec)) return spec;
            return All[0];
        }
    }
}
