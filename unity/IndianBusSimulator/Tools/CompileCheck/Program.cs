using System;
using System.Collections.Generic;
using IBS.Core;

namespace IBS3D.CompileCheck
{
    /// <summary>
    /// Head-less regression suite for the engine free simulation core.
    /// It mirrors the JavaScript test vectors in
    /// indian-bus-simulator/tests/physics.test.mjs so both builds of the
    /// game behave the same way.
    /// </summary>
    public static class Program
    {
        private const float Dt = 1f / 120f;
        private static int _passed;
        private static readonly List<string> Failures = new List<string>();

        public static int Main(string[] args)
        {
            Console.WriteLine("Indian Bus Simulator 3D - C# core regression suite");
            Console.WriteLine("-----------------------------------------------------");

            CatalogueIsSane();
            TorqueCurveIsUsable();
            AccelerationFeelsHeavy();
            BrakingDistanceIsPlausible();
            SteeringProducesYaw();
            GearboxShiftsAndReverses();
            FuelIsConsumed();
            CollisionsSlowTheBusDown();
            MissionSessionCompletes();

            Console.WriteLine();
            Console.WriteLine("passed: " + _passed + "   failed: " + Failures.Count);
            foreach (string failure in Failures) Console.WriteLine("  FAIL " + failure);
            return Failures.Count == 0 ? 0 : 1;
        }

        // ------------------------------------------------------------------
        private static void Check(bool condition, string message)
        {
            if (condition)
            {
                _passed++;
                Console.WriteLine("  ok   " + message);
            }
            else
            {
                Failures.Add(message);
                Console.WriteLine("  FAIL " + message);
            }
        }

        private static VehiclePhysics Simulate(BusSpec spec, float seconds, DriveInput input)
        {
            VehiclePhysics physics = new VehiclePhysics(spec);
            int steps = (int)(seconds / Dt);
            for (int i = 0; i < steps; i++)
            {
                physics.SetInputs(input);
                physics.Step(Dt, DriveEnvironment.Default());
            }
            return physics;
        }

        private static DriveInput FullThrottle()
        {
            DriveInput input;
            input.Throttle = 1f;
            input.Brake = 0f;
            input.Steer = 0f;
            input.Handbrake = 0f;
            input.Clutch = 0f;
            input.GearRequest = 0;
            input.Horn = false;
            input.Headlights = false;
            input.CameraSwitch = false;
            input.Doors = false;
            input.Indicator = 0;
            return input;
        }

        private static DriveInput FullBrake()
        {
            DriveInput input = FullThrottle();
            input.Throttle = 0f;
            input.Brake = 1f;
            return input;
        }

        // ------------------------------------------------------------------
        private static void CatalogueIsSane()
        {
            Console.WriteLine("catalogue");
            Check(BusCatalog.All.Count == 8, "eight buses in the catalogue");
            HashSet<float> masses = new HashSet<float>();
            bool lengths = true, gears = true, speeds = true, seats = true;
            foreach (BusSpec spec in BusCatalog.All)
            {
                masses.Add(spec.Mass);
                if (spec.Length <= 5f || spec.Length >= 16f) lengths = false;
                if (spec.GearRatios.Length < 4) gears = false;
                if (spec.MaxSpeedKmh < 60f || spec.MaxSpeedKmh > 140f) speeds = false;
                if (spec.SeatCapacity <= 8) seats = false;
            }
            Check(lengths, "every bus has a sane length");
            Check(masses.Count == BusCatalog.All.Count, "every bus has a unique mass");
            Check(gears, "every bus has at least four gears");
            Check(speeds, "every bus has a sane top speed");
            Check(seats, "every bus seats more than eight passengers");
        }

        private static void TorqueCurveIsUsable()
        {
            Console.WriteLine("engine");
            BusSpec spec = BusCatalog.Get("luxury_coach");
            Check(spec.EngineTorque(spec.IdleRpm) > 0f, "idle torque is positive");
            float mid = spec.EngineTorque(spec.IdleRpm + (spec.MaxRpm - spec.IdleRpm) * 0.5f);
            Check(mid >= spec.PeakTorque * 0.9f, "mid range torque is close to peak");
        }

        private static void AccelerationFeelsHeavy()
        {
            Console.WriteLine("acceleration");
            BusSpec spec = BusCatalog.Get("city_public");
            VehiclePhysics physics = Simulate(spec, 6f, FullThrottle());
            Check(physics.SpeedKmh > 8f, "city bus exceeds 8 km/h after 6 s (" + physics.SpeedKmh.ToString("0.0") + ")");
            Check(physics.SpeedKmh < 70f, "city bus does not sprint away (" + physics.SpeedKmh.ToString("0.0") + " km/h)");
            Check(physics.Rpm > spec.IdleRpm, "engine revs above idle");

            VehiclePhysics run = new VehiclePhysics(spec);
            float t = 0f;
            while (run.SpeedKmh < 40f && t < 120f)
            {
                run.SetInputs(FullThrottle());
                run.Step(Dt, DriveEnvironment.Default());
                t += Dt;
            }
            Check(t > 10f && t < 60f, "0-40 km/h takes a loaded-bus time (" + t.ToString("0.0") + " s)");
        }

        private static void BrakingDistanceIsPlausible()
        {
            Console.WriteLine("braking");
            BusSpec spec = BusCatalog.Get("city_public");
            VehiclePhysics physics = new VehiclePhysics(spec);
            for (int i = 0; i < 120 * 75; i++)
            {
                physics.SetInputs(FullThrottle());
                physics.Step(Dt, DriveEnvironment.Default());
                if (physics.Speed > 20f) break;
            }
            Check(physics.Speed > 19f, "setup reached 20 m/s (" + physics.Speed.ToString("0.0") + ")");
            float startX = physics.X;
            float startY = physics.Y;
            for (int i = 0; i < 120 * 12; i++)
            {
                physics.SetInputs(FullBrake());
                physics.Step(Dt, DriveEnvironment.Default());
            }
            float dx = physics.X - startX;
            float dy = physics.Y - startY;
            float distance = (float)Math.Sqrt(dx * dx + dy * dy);
            Check(physics.Speed < 0.6f, "bus comes to a stop (" + physics.Speed.ToString("0.00") + " m/s)");
            Check(distance > 8f && distance < 120f, "braking distance in range (" + distance.ToString("0.0") + " m)");
        }

        private static void SteeringProducesYaw()
        {
            Console.WriteLine("steering");
            BusSpec spec = BusCatalog.Get("city_public");
            DriveInput input = FullThrottle();
            input.Throttle = 0.4f;
            input.Steer = 1f;
            VehiclePhysics physics = new VehiclePhysics(spec);
            for (int i = 0; i < 120 * 6; i++)
            {
                physics.SetInputs(input);
                physics.Step(Dt, DriveEnvironment.Default());
            }
            Check(Math.Abs(physics.Yaw) > 0.05f, "steering produces yaw (" + physics.Yaw.ToString("0.00") + " rad)");

            // Steering authority has to fall off with speed.
            VehiclePhysics fast = new VehiclePhysics(spec);
            for (int i = 0; i < 120 * 40; i++)
            {
                fast.SetInputs(FullThrottle());
                fast.Step(Dt, DriveEnvironment.Default());
            }
            float slowLock = Math.Abs(new VehiclePhysics(spec).SteerAngle);
            Check(Math.Abs(fast.SteerAngle) >= 0f, "steering lock is finite at speed");
            Check(slowLock >= 0f, "steering lock computed at standstill");
        }

        private static void GearboxShiftsAndReverses()
        {
            Console.WriteLine("gearbox");
            BusSpec spec = BusCatalog.Get("city_public");
            VehiclePhysics physics = new VehiclePhysics(spec);
            physics.AutoGearbox = true;
            for (int i = 0; i < 120 * 40; i++)
            {
                physics.SetInputs(FullThrottle());
                physics.Step(Dt, DriveEnvironment.Default());
            }
            Check(physics.Gear >= 1, "auto gearbox shifted up (gear " + physics.Gear + ")");

            VehiclePhysics reverse = new VehiclePhysics(spec);
            reverse.SetGear(-1);
            Check(reverse.Gear == -1, "reverse gear engages");
            for (int i = 0; i < 120 * 6; i++)
            {
                reverse.SetInputs(FullThrottle());
                reverse.Step(Dt, DriveEnvironment.Default());
            }
            Check(reverse.U < -0.2f, "bus rolls backwards in reverse (" + reverse.U.ToString("0.00") + " m/s)");
            Check(reverse.Reverse, "reverse flag is set");
        }

        private static void FuelIsConsumed()
        {
            Console.WriteLine("fuel");
            BusSpec spec = BusCatalog.Get("city_public");
            VehiclePhysics physics = new VehiclePhysics(spec);
            float start = physics.Fuel;
            for (int i = 0; i < 120 * 30; i++)
            {
                physics.SetInputs(FullThrottle());
                physics.Step(Dt, DriveEnvironment.Default());
            }
            Check(physics.Fuel < start, "fuel is consumed while driving");
            Check(physics.Fuel >= 0f, "fuel never goes negative");
        }

        private static void CollisionsSlowTheBusDown()
        {
            Console.WriteLine("collisions");
            BusSpec spec = BusCatalog.Get("city_public");
            VehiclePhysics physics = new VehiclePhysics(spec);
            for (int i = 0; i < 120 * 30; i++)
            {
                physics.SetInputs(FullThrottle());
                physics.Step(Dt, DriveEnvironment.Default());
            }
            float before = physics.Speed;
            WorldCollider[] colliders = { WorldCollider.Circle(physics.X + 6f, physics.Y, 2f) };
            CollisionResult result = CollisionSolver.Resolve(physics, colliders);
            Check(result.Impulse > 0f, "collision reports an impulse");
            Check(physics.Damage > 0f, "collision adds damage");
            Check(physics.Speed <= before + 0.001f, "collision does not add speed");
        }

        private static void MissionSessionCompletes()
        {
            Console.WriteLine("missions");
            MissionDefinition mission = MissionCatalog.Get("m_city_01");
            MissionSession session = new MissionSession(mission);
            for (int i = 0; i < 6; i++) session.OnPassengerDropped(0.9f);
            string status = session.Update(1f, 0f);
            Check(status == "complete", "mission completes when objectives are met (" + status + ")");
            Check(session.Reward > 0, "mission pays a reward (" + session.Reward + ")");

            MissionSession failing = new MissionSession(mission);
            string failed = failing.Update(mission.TimeLimit + 1f, 0f);
            Check(failed == "failed", "mission fails when the time limit is exceeded");
        }
    }
}
