using System;

namespace IBS.Core
{
    /// <summary>Environment conditions that affect the vehicle.</summary>
    public struct DriveEnvironment
    {
        public float Grip;              // tyre friction multiplier
        public float Slope;             // road grade in radians (positive = uphill)
        public float RollingResistance;
        public float WindSpeed;
        public float SurfaceRoughness;

        public static DriveEnvironment Default()
        {
            DriveEnvironment env;
            env.Grip = 1f;
            env.Slope = 0f;
            env.RollingResistance = 0.009f;
            env.WindSpeed = 0f;
            env.SurfaceRoughness = 0f;
            return env;
        }
    }

    public struct VehicleTelemetry
    {
        public float Speed;
        public float SpeedKmh;
        public float Rpm;
        public int Gear;
        public float Throttle;
        public float Brake;
        public float Steer;
        public float Handbrake;
        public float SlipFront;
        public float SlipRear;
        public float LateralG;
        public float LongitudinalG;
        public float Fuel;
        public float Damage;
        public bool EngineOn;
        public bool Shifting;
    }

    public struct DriveInput
    {
        public float Throttle;
        public float Brake;
        public float Steer;
        public float Handbrake;
        public float Clutch;
        public int GearRequest;        // -1 reverse, 0 none, 1 drive
        public bool Horn;
        public bool Headlights;
        public bool CameraSwitch;
        public bool Doors;
        public int Indicator;           // -1 left, 0 off, 1 right
    }

    /// <summary>
    /// Single track (bicycle) vehicle model for heavy buses with longitudinal
    /// load transfer, friction circle limited combined slip, a real gearbox,
    /// engine braking plus exhaust retarder and speed sensitive steering.
    ///
    /// Ported from web/js/vehicles/physics.js (validated by the shared test
    /// vectors in Tools/CoreTests).
    /// </summary>
    public class VehiclePhysics
    {
        public const float Gravity = 9.81f;
        public const float AirDensity = 1.225f;

        public BusSpec Spec { get; private set; }
        public bool AutoGearbox { get; set; }

        public float X;
        public float Y;
        public float Yaw;
        public float U;              // longitudinal velocity
        public float V;              // lateral velocity (left positive)
        public float R;              // yaw rate
        public float Rpm;
        public int Gear;
        public float Throttle;
        public float Brake;
        public float SteerInput;
        public float Handbrake;
        public float SteerAngle;
        public float Fuel;
        public float Damage;
        public float Odometer;
        public bool EngineOn = true;

        public float FrontLoad;
        public float RearLoad;
        public float LongitudinalG;
        public float LateralG;
        public float SlipFront;
        public float SlipRear;

        public float SuspensionPitch;
        public float SuspensionRoll;
        public float SuspensionHeave;

        private float _mass;
        private float _a;
        private float _b;
        private float _h;
        private float _inertia;
        private float _dragArea;
        private float _maxSteer;
        private float _wheelRadius;
        private float _shiftTimer;
        private float _shiftCooldown;
        private float _pitchVel;
        private float _rollVel;

        public VehiclePhysics(BusSpec spec)
        {
            Spec = spec;
            AutoGearbox = true;
            Configure();
            Reset(0f, 0f, 0f);
        }

        private void Configure()
        {
            _mass = Spec.Mass;
            _a = Spec.Wheelbase * 0.46f;
            _b = Spec.Wheelbase * 0.54f;
            _h = Spec.Height * 0.42f;
            _inertia = _mass * ((Spec.Length * Spec.Length + Spec.Width * Spec.Width) / 12f) * 1.35f;
            _dragArea = Spec.FrontalArea * Spec.DragCoefficient;
            _maxSteer = Spec.SteerMaxDeg * MathfConst.Deg2Rad;
            _wheelRadius = Spec.TireRadius;
        }

        public void Reset(float x, float y, float yaw)
        {
            X = x;
            Y = y;
            Yaw = yaw;
            U = 0f;
            V = 0f;
            R = 0f;
            Rpm = Spec.IdleRpm;
            Gear = 1;
            _shiftTimer = 0f;
            _shiftCooldown = 0f;
            Fuel = Spec.FuelTank * 0.65f;
            Damage = 0f;
            Odometer = 0f;
            Throttle = 0f;
            Brake = 0f;
            SteerInput = 0f;
            Handbrake = 0f;
            SteerAngle = 0f;
            FrontLoad = _mass * Gravity * _b / Spec.Wheelbase;
            RearLoad = _mass * Gravity * _a / Spec.Wheelbase;
        }

        public float Speed
        {
            get { return (float)Math.Sqrt(U * U + V * V); }
        }

        public float SpeedKmh
        {
            get { return Speed * 3.6f; }
        }

        /// <summary>True while the gearbox is in reverse.</summary>
        public bool Reverse
        {
            get { return Gear < 0; }
        }

        public float ForwardX { get { return (float)Math.Cos(Yaw); } }
        public float ForwardY { get { return (float)Math.Sin(Yaw); } }
        public float LeftX { get { return -(float)Math.Sin(Yaw); } }
        public float LeftY { get { return (float)Math.Cos(Yaw); } }

        public void SetInputs(DriveInput input)
        {
            Throttle = MathUtil.Clamp01(input.Throttle);
            Brake = MathUtil.Clamp01(input.Brake);
            SteerInput = MathUtil.Clamp(input.Steer, -1f, 1f);
            Handbrake = MathUtil.Clamp01(input.Handbrake);
        }

        public void SetGear(int gear)
        {
            int maxGear = Spec.GearRatios.Length;
            int g = MathUtil.Clamp(gear, -1, maxGear);
            if (g == Gear) return;
            if (g == -1 && U > 1.2f) return;
            if (g > 0 && U < -1.2f) return;
            Gear = g;
            _shiftTimer = 0.35f;
            _shiftCooldown = 1.6f;
        }

        public void ShiftUp()
        {
            if (Gear < Spec.GearRatios.Length) SetGear(Gear + 1);
        }

        public void ShiftDown()
        {
            if (Gear > -1) SetGear(Gear - 1);
        }

        public void ApplyCollisionImpulse(float forwardImpulse, float lateralImpulse, float damageAmount)
        {
            U += forwardImpulse;
            V += lateralImpulse;
            R += lateralImpulse * 0.012f;
            Damage = MathUtil.Clamp01(Damage + damageAmount);
        }

        public VehicleTelemetry Step(float dt, DriveEnvironment env)
        {
            float speed = Speed;
            float absU = Math.Abs(U);

            // ------------------------------------------------------------ steering
            float speedFactor = 1f / (1f + speed * 0.038f);
            float targetLock = _maxSteer * speedFactor;
            float steerRate = _maxSteer * 3.4f * dt;
            float requested = SteerInput * targetLock;
            SteerAngle = MathUtil.MoveTowards(SteerAngle, requested, steerRate);
            if (Math.Abs(SteerInput) < 0.02f)
            {
                SteerAngle = MathUtil.MoveTowards(SteerAngle, 0f, steerRate * 0.8f);
            }
            float delta = SteerAngle;

            // ---------------------------------------------------------- gear / rpm
            _shiftTimer = Math.Max(0f, _shiftTimer - dt);
            _shiftCooldown = Math.Max(0f, _shiftCooldown - dt);
            float ratio = Spec.GearRatio(Gear);
            float totalRatio = ratio * Spec.FinalDrive;
            float wheelOmega = U / _wheelRadius;
            float gearedRpm = Math.Abs(wheelOmega) * Math.Abs(totalRatio) * 60f / (MathfConst.PI * 2f);
            bool shifting = _shiftTimer > 0f;
            float clutchEngagement = Gear == 0 ? 0f
                : shifting ? 0.12f
                : 0.24f + 0.76f * MathUtil.Clamp01((absU - 0.2f) / 1.2f);
            float clutchLock = shifting ? 0f : MathUtil.Clamp01((absU - 0.2f) / 0.8f);
            float freeRev = Gear == 0
                ? MathUtil.Lerp(Spec.IdleRpm, Spec.IdleRpm + (Spec.MaxRpm - Spec.IdleRpm) * 0.45f, Throttle)
                : shifting
                    ? Spec.IdleRpm + (Spec.MaxRpm - Spec.IdleRpm) * 0.12f
                    : MathUtil.Lerp(Spec.IdleRpm, Spec.IdleRpm + (Spec.MaxRpm - Spec.IdleRpm) * 0.42f, Throttle);
            float targetRpm = MathUtil.Lerp(freeRev, MathUtil.Clamp(gearedRpm, Spec.IdleRpm, Spec.MaxRpm), clutchLock);
            if (!EngineOn) targetRpm = 0f;
            Rpm = MathUtil.Damp(Rpm, targetRpm, 9f, dt);

            if (AutoGearbox && EngineOn) AutoShift(absU);
            bool telemetryShifting = _shiftTimer > 0f;

            // ------------------------------------------------------------- forces
            float mu = 0.85f * env.Grip * (1f - Damage * 0.12f);
            float weight = _mass * Gravity;

            float transfer = _mass * LongitudinalG * _h / Spec.Wheelbase;
            float frontLoad = Math.Max(weight * 0.08f, (weight * _b) / Spec.Wheelbase - transfer);
            float rearLoad = Math.Max(weight * 0.08f, (weight * _a) / Spec.Wheelbase + transfer);
            FrontLoad = frontLoad;
            RearLoad = rearLoad;

            float torque = Spec.EngineTorque(Rpm) * (1f - Damage * 0.3f);
            float driveForce = 0f;
            if (EngineOn && Gear != 0)
            {
                float direction = Gear < 0 ? -1f : 1f;
                float wheelForce = (torque * Math.Abs(totalRatio) * 0.92f) / _wheelRadius;
                driveForce = wheelForce * direction * clutchEngagement * Throttle;
                float maxSpeed = Spec.MaxSpeedKmh / 3.6f;
                if (Math.Abs(U) > maxSpeed)
                {
                    driveForce *= MathUtil.Clamp(1f - (Math.Abs(U) - maxSpeed) / 2.5f, 0f, 1f);
                }
            }

            float retarder = 0f;
            if (EngineOn && Throttle < 0.05f && absU > 1f)
            {
                float engineBrake = (torque * 0.13f * MathUtil.Sign(U)) / _wheelRadius;
                float retarderForce = (Spec.RetarderTorque * 0.55f * MathUtil.Sign(U)) / _wheelRadius;
                retarder = engineBrake + retarderForce;
            }

            float brakeForce = (Spec.BrakeTorque / _wheelRadius) * Brake;
            float brakeFront = brakeForce * 0.62f;
            float brakeRear = brakeForce * 0.38f;

            float dragForce = 0.5f * AirDensity * _dragArea * U * Math.Abs(U);
            float rolling = env.RollingResistance * weight * MathUtil.Sign(U) * MathUtil.Clamp01(absU / 0.5f);
            float slopeForce = weight * (float)Math.Sin(env.Slope);
            float windForce = 0.5f * AirDensity * _dragArea * env.WindSpeed * Math.Abs(env.WindSpeed) * 0.35f;

            float ux = Math.Max(2.2f, absU);
            float slipF = (float)Math.Atan2(V + _a * R, ux) - delta;
            float slipR = (float)Math.Atan2(V - _b * R, ux);
            SlipFront = slipF;
            SlipRear = slipR;

            float fyFront = -mu * frontLoad * (float)Math.Tanh(6.4f * slipF);
            float fyRear = -mu * rearLoad * (float)Math.Tanh(6.8f * slipR);

            float fxFront = -brakeFront * MathUtil.Sign(U) * MathUtil.Clamp01(absU / 0.4f);
            float fxRear = driveForce + retarder
                - brakeRear * MathUtil.Sign(U) * MathUtil.Clamp01(absU / 0.4f)
                - (Math.Abs(Handbrake) > 0.5f ? mu * rearLoad * 1.02f * MathUtil.Sign(U) : 0f);

            float limitFront = mu * frontLoad;
            float limitRear = mu * rearLoad;
            float magFront = (float)Math.Sqrt(fxFront * fxFront + fyFront * fyFront);
            if (magFront > limitFront && magFront > 0f)
            {
                float s = limitFront / magFront;
                fxFront *= s;
                fyFront *= s;
            }
            float magRear = (float)Math.Sqrt(fxRear * fxRear + fyRear * fyRear);
            if (magRear > limitRear && magRear > 0f)
            {
                float s = limitRear / magRear;
                fxRear *= s;
                fyRear *= s;
            }

            float fxTotal = fxFront + fxRear - dragForce - rolling - slopeForce - windForce;
            float fyTotal = fyFront * (float)Math.Cos(delta) + fyRear;

            float uDot = fxTotal / _mass + R * V;
            float vDot = fyTotal / _mass - R * U;
            float rDot = (_a * fyFront * (float)Math.Cos(delta) - _b * fyRear) / _inertia;

            U += uDot * dt;
            V += vDot * dt;
            R += rDot * dt;
            R *= 1f - Math.Min(0.9f, 1.6f * dt);

            if (absU < 0.05f && Throttle < 0.02f && Brake < 0.02f)
            {
                U *= 0.85f;
                V *= 0.8f;
            }

            LongitudinalG = uDot / Gravity;
            LateralG = vDot / Gravity;

            Yaw = MathUtil.WrapAngle(Yaw + R * dt);
            float worldVX = U * (float)Math.Cos(Yaw) - V * (float)Math.Sin(Yaw);
            float worldVY = U * (float)Math.Sin(Yaw) + V * (float)Math.Cos(Yaw);
            X += worldVX * dt;
            Y += worldVY * dt;
            Odometer += (float)Math.Sqrt(worldVX * worldVX + worldVY * worldVY) * dt;

            UpdateSuspension(dt, uDot, vDot, env);

            if (EngineOn)
            {
                float powerKw = (torque * Rpm * MathfConst.PI * 2f) / 60f / 1000f;
                float litresPerHour = 0.9f + powerKw * 0.052f + Throttle * 0.6f;
                Fuel = Math.Max(0f, Fuel - (litresPerHour * dt) / 3600f);
            }

            VehicleTelemetry tele;
            tele.Speed = Speed;
            tele.SpeedKmh = SpeedKmh;
            tele.Rpm = Rpm;
            tele.Gear = Gear;
            tele.Throttle = Throttle;
            tele.Brake = Brake;
            tele.Steer = SteerAngle;
            tele.Handbrake = Handbrake;
            tele.SlipFront = SlipFront;
            tele.SlipRear = SlipRear;
            tele.LateralG = LateralG;
            tele.LongitudinalG = LongitudinalG;
            tele.Fuel = Fuel;
            tele.Damage = Damage;
            tele.EngineOn = EngineOn;
            tele.Shifting = telemetryShifting;
            return tele;
        }

        private void AutoShift(float absU)
        {
            if (_shiftTimer > 0f) return;
            if (_shiftCooldown > 0f) return;

            float upAt = Spec.MaxRpm * 0.88f;
            float downAt = Spec.MaxRpm * 0.5f;
            if (Gear == 0)
            {
                SetGear(1);
                return;
            }
            if (Gear > 0)
            {
                float rpmInNext = (absU / _wheelRadius) * Math.Abs(Spec.GearRatio(Gear + 1) * Spec.FinalDrive) * 60f / (MathfConst.PI * 2f);
                float rpmInLower = (absU / _wheelRadius) * Math.Abs(Spec.GearRatio(Gear - 1) * Spec.FinalDrive) * 60f / (MathfConst.PI * 2f);
                if (Rpm > upAt && Gear < Spec.GearRatios.Length && rpmInNext > Spec.IdleRpm * 1.2f)
                {
                    SetGear(Gear + 1);
                }
                else if (Gear > 1 && Rpm < downAt && rpmInLower < Spec.MaxRpm * 0.92f)
                {
                    SetGear(Gear - 1);
                }
            }
            else if (Gear == -1 && U > 0.6f && Throttle > 0.05f)
            {
                SetGear(1);
            }
        }

        private void UpdateSuspension(float dt, float uDot, float vDot, DriveEnvironment env)
        {
            const float k = 46f;
            const float c = 8.2f;
            float targetPitch = MathUtil.Clamp(-uDot * 0.0075f, -0.09f, 0.09f);
            float targetRoll = MathUtil.Clamp(vDot * 0.006f, -0.07f, 0.07f);
            float rough = env.SurfaceRoughness * (float)Math.Sin(Odometer * 9.3f) * 0.012f;
            _pitchVel += (targetPitch - SuspensionPitch) * k * dt - _pitchVel * c * dt;
            _rollVel += (targetRoll - SuspensionRoll) * k * dt - _rollVel * c * dt;
            SuspensionPitch += _pitchVel * dt;
            SuspensionRoll += _rollVel * dt;
            SuspensionHeave = MathUtil.Damp(SuspensionHeave, rough, 6f, dt);
        }
    }

    /// <summary>Static obstacle used for collision detection.</summary>
    public struct WorldCollider
    {
        public bool IsCircle;
        public float X;
        public float Y;
        public float Radius;
        public float Hx;
        public float Hy;
        public float Yaw;

        public static WorldCollider Circle(float x, float y, float radius)
        {
            WorldCollider c;
            c.IsCircle = true;
            c.X = x; c.Y = y; c.Radius = radius; c.Hx = 0f; c.Hy = 0f; c.Yaw = 0f;
            return c;
        }

        public static WorldCollider Box(float x, float y, float hx, float hy, float yaw)
        {
            WorldCollider c;
            c.IsCircle = false;
            c.X = x; c.Y = y; c.Radius = 0f; c.Hx = hx; c.Hy = hy; c.Yaw = yaw;
            return c;
        }
    }

    public struct CollisionResult
    {
        public float Impulse;
        public float Damage;
    }

    /// <summary>
    /// Resolves the bus against the static world (buildings, poles, trees) using
    /// oriented boxes and circles, applying a restitution impulse.
    /// </summary>
    public static class CollisionSolver
    {
        public static CollisionResult Resolve(VehiclePhysics physics, WorldCollider[] colliders)
        {
            CollisionResult result = new CollisionResult();
            if (colliders == null) return result;

            float halfL = physics.Spec.Length * 0.5f;
            float halfW = physics.Spec.Width * 0.5f;

            for (int i = 0; i < colliders.Length; i++)
            {
                WorldCollider col = colliders[i];
                float dx = physics.X - col.X;
                float dy = physics.Y - col.Y;
                float reach = halfL + (col.IsCircle ? col.Radius : col.Hx) + 0.2f;
                if (dx * dx + dy * dy > reach * reach) continue;

                float penetration;
                float nx, ny;

                if (col.IsCircle)
                {
                    float dist = (float)Math.Sqrt(dx * dx + dy * dy);
                    float minDist = halfL * 0.72f + col.Radius;
                    if (dist >= minDist) continue;
                    penetration = minDist - dist;
                    float inv = dist > 1e-4f ? 1f / dist : 0f;
                    nx = dx * inv;
                    ny = dy * inv;
                }
                else
                {
                    float c = (float)Math.Cos(-col.Yaw);
                    float s = (float)Math.Sin(-col.Yaw);
                    float bx = dx * c - dy * s;
                    float by = dx * s + dy * c;
                    float qx = MathUtil.Clamp(bx, -col.Hx, col.Hx);
                    float qy = MathUtil.Clamp(by, -col.Hy, col.Hy);
                    float dist = (float)Math.Sqrt((bx - qx) * (bx - qx) + (by - qy) * (by - qy));
                    if (dist >= halfW + 0.05f) continue;

                    float nlx, nly;
                    if (dist > 1e-4f)
                    {
                        nlx = (bx - qx) / dist;
                        nly = (by - qy) / dist;
                    }
                    else
                    {
                        float px = col.Hx - Math.Abs(bx);
                        float py = col.Hy - Math.Abs(by);
                        if (px < py) { nlx = MathUtil.Sign(bx); nly = 0f; }
                        else { nlx = 0f; nly = MathUtil.Sign(by); }
                    }
                    float cw = (float)Math.Cos(col.Yaw);
                    float sw = (float)Math.Sin(col.Yaw);
                    nx = nlx * cw - nly * sw;
                    ny = nlx * sw + nly * cw;
                    penetration = halfW + 0.05f - dist;
                }

                if (penetration <= 0f) continue;

                physics.X += nx * penetration;
                physics.Y += ny * penetration;

                float fx = physics.ForwardX;
                float fy = physics.ForwardY;
                float lx = physics.LeftX;
                float ly = physics.LeftY;
                float normalVel = physics.U * (fx * nx + fy * ny) + physics.V * (lx * nx + ly * ny);
                if (normalVel >= 0f) continue;

                const float restitution = 0.12f;
                float forwardComponent = normalVel * (fx * nx + fy * ny);
                float lateralComponent = normalVel * (lx * nx + ly * ny);
                float mass = physics.Spec.Mass;
                float jForward = (-(1f + restitution) * forwardComponent * mass) / 2f;
                float jLateral = (-(1f + restitution) * lateralComponent * mass) / 2f;
                physics.U += jForward / mass;
                physics.V += jLateral / mass;
                physics.R += (jLateral / mass) * 0.02f * MathUtil.Sign(nx * physics.LeftX + ny * physics.LeftY);

                float severity = Math.Min(1f, Math.Abs(normalVel) / 14f);
                result.Impulse += Math.Abs(normalVel);
                result.Damage += severity * 0.05f;
            }

            if (result.Impulse > 0f)
            {
                physics.ApplyCollisionImpulse(0f, 0f, result.Damage);
            }
            return result;
        }
    }
}
