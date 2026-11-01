using System;

namespace IBS.Core
{
    /// <summary>
    /// Engine independent math helpers used by the simulation.
    /// Mirrors web/js/util/math.js so both builds behave identically.
    /// </summary>
    public static class MathUtil
    {
        public const float Deg2Rad = MathfConst.Deg2Rad;
        public const float Rad2Deg = MathfConst.Rad2Deg;

        public static float Clamp(float v, float lo, float hi)
        {
            return v < lo ? lo : (v > hi ? hi : v);
        }

        public static float Clamp01(float v)
        {
            return Clamp(v, 0f, 1f);
        }

        public static float Lerp(float a, float b, float t)
        {
            return a + (b - a) * t;
        }

        public static float LerpUnclamped(float a, float b, float t)
        {
            return a + (b - a) * t;
        }

        public static float Sign(float v)
        {
            return v > 0f ? 1f : (v < 0f ? -1f : 0f);
        }

        /// <summary>Frame rate independent exponential smoothing.</summary>
        public static float Damp(float current, float target, float lambda, float dt)
        {
            return Lerp(current, target, 1f - (float)Math.Exp(-lambda * dt));
        }

        public static float MoveTowards(float current, float target, float maxDelta)
        {
            float d = target - current;
            if (Math.Abs(d) <= maxDelta) return target;
            return current + Sign(d) * maxDelta;
        }

        /// <summary>Wraps an angle into [-PI, PI].</summary>
        public static float WrapAngle(float a)
        {
            a = (a + MathfConst.PI) % (MathfConst.PI * 2f);
            if (a < 0f) a += MathfConst.PI * 2f;
            return a - MathfConst.PI;
        }

        public static float AngleDelta(float from, float to)
        {
            return WrapAngle(to - from);
        }

        public static float DampAngle(float current, float target, float lambda, float dt)
        {
            return current + AngleDelta(current, target) * (1f - (float)Math.Exp(-lambda * dt));
        }

        public static float Distance(float ax, float ay, float bx, float by)
        {
            return (float)Math.Sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
        }

        public static float DistanceSq(float ax, float ay, float bx, float by)
        {
            return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
        }

        /// <summary>Deterministic PRNG (mulberry32) so maps are reproducible.</summary>
        public sealed class Rng
        {
            private uint _state;

            public Rng(uint seed)
            {
                _state = seed;
            }

            public uint NextUInt()
            {
                _state += 0x6D2B79F5u;
                uint t = _state;
                t = (t ^ (t >> 15)) * (t | 1);
                t ^= t + (t * (t ^ (t >> 7)) * (t | 61));
                return (t ^ (t >> 14));
            }

            public float Value
            {
                get { return (NextUInt() & 0xFFFFFF) / (float)0x1000000; }
            }

            public float Range(float min, float max)
            {
                return min + (max - min) * Value;
            }

            public int Range(int minInclusive, int maxExclusive)
            {
                return minInclusive + (int)(Value * (maxExclusive - minInclusive));
            }

            public bool Chance(float p)
            {
                return Value < p;
            }

            public T Pick<T>(T[] items)
            {
                return items[Range(0, items.Length)];
            }
        }
    }

    /// <summary>Local copy of the Unity constants so the core stays engine free.</summary>
    public static class MathfConst
    {
        public const float PI = 3.14159265358979f;
        public const float Deg2Rad = PI / 180f;
        public const float Rad2Deg = 180f / PI;
    }
}
