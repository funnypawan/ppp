// Minimal UnityEngine API surface used by the Indian Bus Simulator 3D
// scripts. These stubs exist ONLY so the project can be type checked with
// `dotnet build` on CI machines that do not have Unity installed. They are
// never shipped with the game: inside the Unity Editor the real
// UnityEngine assembly is used instead.
//
// Signatures were cross checked against the UnityCsReference sources.

using System;
using System.Collections;
using System.Collections.Generic;

namespace UnityEngine
{
    public class Object
    {
        public string name { get; set; }
        public HideFlags hideFlags { get; set; }
        public static void Destroy(Object obj) { }
        public static void Destroy(Object obj, float delay) { }
        public static void DestroyImmediate(Object obj) { }
        public static implicit operator bool(Object obj) { return !ReferenceEquals(obj, null); }
        public static bool operator ==(Object a, Object b) { return ReferenceEquals(a, b); }
        public static bool operator !=(Object a, Object b) { return !ReferenceEquals(a, b); }
        public override bool Equals(object other) { return ReferenceEquals(this, other); }
        public override int GetHashCode() { return base.GetHashCode(); }
    }

    public enum HideFlags { None = 0, HideAndDontSave = 61 }

    public class Component : Object
    {
        public Transform transform { get; set; }
        public GameObject gameObject { get; set; }
        public string tag { get; set; }
        public T GetComponent<T>() { return default(T); }
        public Component GetComponent(Type type) { return null; }
        public bool TryGetComponent<T>(out T component) { component = default(T); return false; }
    }

    public class Behaviour : Component
    {
        public bool enabled { get; set; }
        public bool isActiveAndEnabled { get { return enabled; } }
    }

    public class MonoBehaviour : Behaviour
    {
    }

    public class ScriptableObject : Object
    {
    }

    public class Transform : Component, IEnumerable
    {
        public Vector3 position { get; set; }
        public Vector3 localPosition { get; set; }
        public Vector3 localScale { get; set; }
        public Quaternion rotation { get; set; }
        public Quaternion localRotation { get; set; }
        public Vector3 eulerAngles { get; set; }
        public Vector3 forward { get; set; }
        public Vector3 right { get; set; }
        public Vector3 up { get; set; }
        public Transform parent { get; set; }
        public int childCount { get { return 0; } }
        public void SetParent(Transform newParent) { }
        public void SetParent(Transform newParent, bool worldPositionStays) { }
        public Transform GetChild(int index) { return null; }
        public Transform Find(string n) { return null; }
        public System.Collections.IEnumerator GetEnumerator() { yield break; }
    }

    public class GameObject : Object
    {
        public GameObject() { }
        public GameObject(string name) { }
        public GameObject(string name, params Type[] components) { }
        public Transform transform { get; set; }
        public bool activeSelf { get { return true; } }
        public bool activeInHierarchy { get { return true; } }
        public int layer { get; set; }
        public string tag { get; set; }
        public T AddComponent<T>() where T : Component, new() { return new T(); }
        public Component AddComponent(Type type) { return null; }
        public T GetComponent<T>() { return default(T); }
        public Component GetComponent(Type type) { return null; }
        public void SetActive(bool value) { }
        public static GameObject Find(string name) { return null; }
        public static GameObject CreatePrimitive(PrimitiveType type) { return new GameObject(); }
        public static GameObject[] FindGameObjectsWithTag(string tag) { return new GameObject[0]; }
    }

    public enum PrimitiveType { Sphere, Capsule, Cylinder, Cube, Plane, Quad }

    public class Collider : Component
    {
        public bool isTrigger { get; set; }
        public bool enabled { get; set; }
    }

    public class BoxCollider : Collider { public Vector3 size { get; set; } }
    public class SphereCollider : Collider { public float radius { get; set; } }
    public class CapsuleCollider : Collider { }
    public class MeshCollider : Collider { }

    public struct Vector2
    {
        public float x;
        public float y;
        public Vector2(float x, float y) { this.x = x; this.y = y; }
        public static Vector2 zero { get { return new Vector2(0, 0); } }
        public static Vector2 one { get { return new Vector2(1, 1); } }
        public static Vector2 up { get { return new Vector2(0, 1); } }
        public static Vector2 right { get { return new Vector2(1, 0); } }
        public float magnitude { get { return Mathf.Sqrt(x * x + y * y); } }
        public float sqrMagnitude { get { return x * x + y * y; } }
        public Vector2 normalized { get { return this; } }
        public static Vector2 operator +(Vector2 a, Vector2 b) { return new Vector2(a.x + b.x, a.y + b.y); }
        public static Vector2 operator -(Vector2 a, Vector2 b) { return new Vector2(a.x - b.x, a.y - b.y); }
        public static Vector2 operator -(Vector2 a) { return new Vector2(-a.x, -a.y); }
        public static Vector2 operator *(Vector2 a, float d) { return new Vector2(a.x * d, a.y * d); }
        public static Vector2 operator *(float d, Vector2 a) { return a * d; }
        public static Vector2 operator /(Vector2 a, float d) { return new Vector2(a.x / d, a.y / d); }
        public static float Dot(Vector2 a, Vector2 b) { return a.x * b.x + a.y * b.y; }
        public static float Distance(Vector2 a, Vector2 b) { return (a - b).magnitude; }
        public static Vector2 Lerp(Vector2 a, Vector2 b, float t) { return a + (b - a) * t; }
        public static Vector2 MoveTowards(Vector2 a, Vector2 b, float d) { return b; }
        public override string ToString() { return "(" + x + ", " + y + ")"; }
    }

    public struct Vector3
    {
        public float x;
        public float y;
        public float z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 zero { get { return new Vector3(0, 0, 0); } }
        public static Vector3 one { get { return new Vector3(1, 1, 1); } }
        public static Vector3 up { get { return new Vector3(0, 1, 0); } }
        public static Vector3 down { get { return new Vector3(0, -1, 0); } }
        public static Vector3 left { get { return new Vector3(-1, 0, 0); } }
        public static Vector3 right { get { return new Vector3(1, 0, 0); } }
        public static Vector3 forward { get { return new Vector3(0, 0, 1); } }
        public static Vector3 back { get { return new Vector3(0, 0, -1); } }
        public float magnitude { get { return Mathf.Sqrt(x * x + y * y + z * z); } }
        public float sqrMagnitude { get { return x * x + y * y + z * z; } }
        public Vector3 normalized { get { return this; } }
        public static Vector3 operator +(Vector3 a, Vector3 b) { return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z); }
        public static Vector3 operator -(Vector3 a, Vector3 b) { return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z); }
        public static Vector3 operator -(Vector3 a) { return new Vector3(-a.x, -a.y, -a.z); }
        public static Vector3 operator *(Vector3 a, float d) { return new Vector3(a.x * d, a.y * d, a.z * d); }
        public static Vector3 operator *(float d, Vector3 a) { return a * d; }
        public static Vector3 operator /(Vector3 a, float d) { return new Vector3(a.x / d, a.y / d, a.z / d); }
        public static float Dot(Vector3 a, Vector3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
        public static Vector3 Cross(Vector3 a, Vector3 b) { return new Vector3(0, 0, 0); }
        public static float Distance(Vector3 a, Vector3 b) { return (a - b).magnitude; }
        public static Vector3 Lerp(Vector3 a, Vector3 b, float t) { return a + (b - a) * t; }
        public static Vector3 MoveTowards(Vector3 a, Vector3 b, float d) { return b; }
        public static Vector3 Scale(Vector3 a, Vector3 b) { return a; }
        public override string ToString() { return "(" + x + ", " + y + ", " + z + ")"; }
    }

    public struct Quaternion
    {
        public float x, y, z, w;
        public Quaternion(float x, float y, float z, float w) { this.x = x; this.y = y; this.z = z; this.w = w; }
        public static Quaternion identity { get { return new Quaternion(0, 0, 0, 1); } }
        public static Quaternion Euler(float x, float y, float z) { return identity; }
        public static Quaternion Euler(Vector3 euler) { return identity; }
        public static Quaternion LookRotation(Vector3 forward) { return identity; }
        public static Quaternion LookRotation(Vector3 forward, Vector3 up) { return identity; }
        public static Quaternion Slerp(Quaternion a, Quaternion b, float t) { return a; }
        public static Quaternion Lerp(Quaternion a, Quaternion b, float t) { return a; }
        public static Quaternion AngleAxis(float angle, Vector3 axis) { return identity; }
        public Vector3 eulerAngles { get { return Vector3.zero; } set { } }
        public static Quaternion operator *(Quaternion a, Quaternion b) { return a; }
        public static Vector3 operator *(Quaternion q, Vector3 v) { return v; }
        public static bool operator ==(Quaternion a, Quaternion b) { return true; }
        public static bool operator !=(Quaternion a, Quaternion b) { return false; }
        public override bool Equals(object other) { return base.Equals(other); }
        public override int GetHashCode() { return base.GetHashCode(); }
    }

    public struct Color
    {
        public float r, g, b, a;
        public Color(float r, float g, float b) { this.r = r; this.g = g; this.b = b; this.a = 1f; }
        public Color(float r, float g, float b, float a) { this.r = r; this.g = g; this.b = b; this.a = a; }
        public static Color white { get { return new Color(1, 1, 1); } }
        public static Color black { get { return new Color(0, 0, 0); } }
        public static Color clear { get { return new Color(0, 0, 0, 0); } }
        public static Color grey { get { return new Color(0.5f, 0.5f, 0.5f); } }
        public static Color gray { get { return new Color(0.5f, 0.5f, 0.5f); } }
        public static Color red { get { return new Color(1, 0, 0); } }
        public static Color green { get { return new Color(0, 1, 0); } }
        public static Color blue { get { return new Color(0, 0, 1); } }
        public static Color yellow { get { return new Color(1, 0.92f, 0.016f); } }
        public static Color magenta { get { return new Color(1, 0, 1); } }
        public static Color cyan { get { return new Color(0, 1, 1); } }
        public static Color Lerp(Color a, Color b, float t) { return a; }
        public static Color operator *(Color c, float d) { return c; }
        public static Color operator *(Color a, Color b) { return a; }
        public static Color operator +(Color a, Color b) { return a; }
        public static Color operator -(Color a, Color b) { return a; }
        public override string ToString() { return "RGBA(" + r + ", " + g + ", " + b + ", " + a + ")"; }
    }

    public static class Mathf
    {
        public const float PI = 3.14159265358979f;
        public const float Infinity = float.PositiveInfinity;
        public const float Deg2Rad = PI / 180f;
        public const float Rad2Deg = 180f / PI;
        public const float Epsilon = 1.401298E-45f;

        public static float Abs(float f) { return Math.Abs(f); }
        public static int Abs(int f) { return Math.Abs(f); }
        public static float Sqrt(float f) { return (float)Math.Sqrt(f); }
        public static float Sin(float f) { return (float)Math.Sin(f); }
        public static float Cos(float f) { return (float)Math.Cos(f); }
        public static float Tan(float f) { return (float)Math.Tan(f); }
        public static float Atan(float f) { return (float)Math.Atan(f); }
        public static float Atan2(float y, float x) { return (float)Math.Atan2(y, x); }
        public static float Asin(float f) { return (float)Math.Asin(f); }
        public static float Acos(float f) { return (float)Math.Acos(f); }
        public static float Exp(float f) { return (float)Math.Exp(f); }
        public static float Pow(float f, float p) { return (float)Math.Pow(f, p); }
        public static float Log(float f) { return (float)Math.Log(f); }
        public static float Floor(float f) { return (float)Math.Floor(f); }
        public static float Ceil(float f) { return (float)Math.Ceiling(f); }
        public static float Round(float f) { return (float)Math.Round(f); }
        public static int FloorToInt(float f) { return (int)Math.Floor(f); }
        public static int CeilToInt(float f) { return (int)Math.Ceiling(f); }
        public static int RoundToInt(float f) { return (int)Math.Round(f); }
        public static float Clamp(float v, float min, float max) { return v < min ? min : (v > max ? max : v); }
        public static int Clamp(int v, int min, int max) { return v < min ? min : (v > max ? max : v); }
        public static float Clamp01(float v) { return Clamp(v, 0f, 1f); }
        public static float Lerp(float a, float b, float t) { return a + (b - a) * Clamp01(t); }
        public static float LerpUnclamped(float a, float b, float t) { return a + (b - a) * t; }
        public static float MoveTowards(float cur, float target, float maxDelta) { return cur; }
        public static float Min(float a, float b) { return Math.Min(a, b); }
        public static int Min(int a, int b) { return Math.Min(a, b); }
        public static float Max(float a, float b) { return Math.Max(a, b); }
        public static int Max(int a, int b) { return Math.Max(a, b); }
        public static float Sign(float f) { return f >= 0f ? 1f : -1f; }
        public static float Repeat(float t, float length) { return t - (float)Math.Floor(t / length) * length; }
        public static float DeltaAngle(float current, float target) { return 0f; }
        public static float SmoothStep(float from, float to, float t) { return Lerp(from, to, t); }
    }

    public static class Time
    {
        public static float deltaTime { get { return 0.016f; } }
        public static float unscaledDeltaTime { get { return 0.016f; } }
        public static float time { get { return 0f; } }
        public static float timeScale { get; set; }
        public static int frameCount { get { return 0; } }
    }

    public static class Debug
    {
        public static void Log(object message) { }
        public static void LogWarning(object message) { }
        public static void LogError(object message) { }
        public static void LogException(Exception e) { }
    }

    public static class Application
    {
        public static int targetFrameRate { get; set; }
        public static bool isPlaying { get { return true; } }
        public static string persistentDataPath { get { return string.Empty; } }
        public static void Quit() { }
        public static void OpenURL(string url) { }
    }

    public static class Screen
    {
        public static int width { get { return 1920; } }
        public static int height { get { return 1080; } }
        public static float dpi { get { return 160f; } }
        public static SleepTimeout sleepTimeout { get; set; }
    }

    public enum SleepTimeout { NeverSleep = 0, SystemSleep = 1 }

    public static class PlayerPrefs
    {
        public static int GetInt(string key, int def) { return def; }
        public static void SetInt(string key, int value) { }
        public static float GetFloat(string key, float def) { return def; }
        public static void SetFloat(string key, float value) { }
        public static string GetString(string key, string def) { return def; }
        public static void SetString(string key, string value) { }
        public static bool HasKey(string key) { return false; }
        public static void DeleteKey(string key) { }
        public static void Save() { }
        public static void DeleteAll() { }
    }

    public static class JsonUtility
    {
        public static string ToJson(object obj) { return "{}"; }
        public static string ToJson(object obj, bool prettyPrint) { return "{}"; }
        public static T FromJson<T>(string json) { return default(T); }
    }

    public static class Random
    {
        public static float value { get { return 0.5f; } }
        public static float Range(float min, float max) { return min; }
        public static int Range(int min, int max) { return min; }
        public static Vector3 insideUnitSphere { get { return Vector3.zero; } }
        public static void InitState(int seed) { }
    }

    public enum KeyCode
    {
        None = 0, Backspace = 8, Tab = 9, Return = 13, Escape = 27, Space = 32,
        A = 97, B = 98, C = 99, D = 100, E = 101, F = 102, G = 103, H = 104, I = 105,
        J = 106, K = 107, L = 108, M = 109, N = 110, O = 111, P = 112, Q = 113, R = 114,
        S = 115, T = 116, U = 117, V = 118, W = 119, X = 120, Y = 121, Z = 122,
        UpArrow = 273, DownArrow = 274, RightArrow = 275, LeftArrow = 276
    }

    public enum TouchPhase { Began, Moved, Stationary, Ended, Canceled }

    public struct Touch
    {
        public int fingerId { get { return 0; } }
        public Vector2 position { get { return Vector2.zero; } }
        public Vector2 deltaPosition { get { return Vector2.zero; } }
        public TouchPhase phase { get { return TouchPhase.Began; } }
    }

    public static class Input
    {
        public static bool GetKey(KeyCode key) { return false; }
        public static bool GetKeyDown(KeyCode key) { return false; }
        public static bool GetKeyUp(KeyCode key) { return false; }
        public static bool GetMouseButton(int button) { return false; }
        public static Vector3 mousePosition { get { return Vector3.zero; } }
        public static int touchCount { get { return 0; } }
        public static Touch GetTouch(int index) { return new Touch(); }
        public static Touch[] touches { get { return new Touch[0]; } }
        public static float GetAxis(string axis) { return 0f; }
    }

    // ---- Rendering ---------------------------------------------------------
    public class Texture : Object
    {
        public int width { get { return 1; } }
        public int height { get { return 1; } }
    }

    public class Texture2D : Texture
    {
        public Texture2D(int width, int height) { }
        public Texture2D(int width, int height, TextureFormat format, bool mipChain) { }
        public void SetPixel(int x, int y, Color color) { }
        public void SetPixels(Color[] colors) { }
        public void Apply() { }
        public Color GetPixel(int x, int y) { return Color.white; }
    }

    public enum TextureFormat { RGBA32 = 4, RGB24 = 3, ARGB32 = 5 }

    public class Shader : Object
    {
        public static Shader Find(string name) { return new Shader(); }
    }

    public class Material : Object
    {
        public Material(Shader shader) { }
        public Material(Material source) { }
        public Color color { get; set; }
        public Texture mainTexture { get; set; }
        public bool HasProperty(string name) { return false; }
        public void SetFloat(string name, float value) { }
        public void SetColor(string name, Color value) { }
        public void SetTexture(string name, Texture value) { }
        public void EnableKeyword(string keyword) { }
        public void DisableKeyword(string keyword) { }
    }

    public class Mesh : Object
    {
        public Vector3[] vertices { get; set; }
        public int[] triangles { get; set; }
        public Vector3[] normals { get; set; }
        public Vector2[] uv { get; set; }
        public Bounds bounds { get; set; }
        public void RecalculateNormals() { }
        public void RecalculateBounds() { }
        public void Clear() { }
    }

    public struct Bounds
    {
        public Vector3 center { get; set; }
        public Vector3 size { get; set; }
    }

    public class MeshFilter : Component
    {
        public Mesh sharedMesh { get; set; }
        public Mesh mesh { get; set; }
    }

    public class MeshRenderer : Renderer { }

    public class Renderer : Component
    {
        public Material sharedMaterial { get; set; }
        public Material material { get; set; }
        public bool enabled { get; set; }
    }

    public enum LightType { Spot, Directional, Point, Area }

    public enum LightShadows { None, Hard, Soft }

    public class Light : Behaviour
    {
        public LightType type { get; set; }
        public float intensity { get; set; }
        public Color color { get; set; }
        public float range { get; set; }
        public float spotAngle { get; set; }
        public LightShadows shadows { get; set; }
        public Vector3 transformForward { get { return Vector3.forward; } }
    }

    public class Camera : Behaviour
    {
        public static Camera main { get { return null; } }
        public Color backgroundColor { get; set; }
        public float fieldOfView { get; set; }
        public float nearClipPlane { get; set; }
        public float farClipPlane { get; set; }
        public bool orthographic { get; set; }
        public float depth { get; set; }
        public int cullingMask { get; set; }
    }

    public class AudioClip : Object
    {
        public AudioClip() { }
        public static AudioClip Create(string name, int lengthSamples, int channels, int frequency, bool stream) { return new AudioClip(); }
        public bool SetData(float[] data, int offsetSamples) { return true; }
        public int samples { get { return 0; } }
        public int channels { get { return 1; } }
        public int frequency { get { return 44100; } }
    }

    public class AudioSource : Behaviour
    {
        public AudioClip clip { get; set; }
        public bool loop { get; set; }
        public bool playOnAwake { get; set; }
        public bool isPlaying { get { return false; } }
        public float volume { get; set; }
        public float pitch { get; set; }
        public void Play() { }
        public void Stop() { }
    }

    public class AudioListener : Behaviour
    {
        public static float volume { get; set; }
    }

    public enum ParticleSystemRenderMode { Billboard, Stretch, HorizontalBillboard, VerticalBillboard, Mesh, None }

    public enum ParticleSystemShapeType { Sphere, Cone, Box, Mesh, Donut, Rectangle }

    public class ParticleSystem : Component
    {
        public bool isPlaying { get { return false; } }
        public void Play() { }
        public void Stop() { }
        public MainModule main { get { return new MainModule(); } }
        public EmissionModule emission { get { return new EmissionModule(); } }
        public ShapeModule shape { get { return new ShapeModule(); } }

        public struct MainModule
        {
            public float startSpeed { get; set; }
            public float startSize { get; set; }
            public float startLifetime { get; set; }
            public int maxParticles { get; set; }
            public Color startColor { get; set; }
        }

        public struct EmissionModule
        {
            public float rateOverTime { get; set; }
            public float rateOverDistance { get; set; }
        }

        public struct ShapeModule
        {
            public ParticleSystemShapeType shapeType { get; set; }
            public Vector3 scale { get; set; }
        }
    }

    public class ParticleSystemRenderer : Renderer
    {
        public ParticleSystemRenderMode renderMode { get; set; }
    }

    public enum FogMode { Linear, Exponential, ExponentialSquared }

    public static class RenderSettings
    {
        public static bool fog { get; set; }
        public static FogMode fogMode { get; set; }
        public static Color fogColor { get; set; }
        public static float fogDensity { get; set; }
        public static Color ambientLight { get; set; }
        public static Color ambientSkyColor { get; set; }
        public static Color ambientEquatorColor { get; set; }
        public static Color ambientGroundColor { get; set; }
    }

    public enum ShadowQuality { Disable = 0, Low = 1, Medium = 2, High = 3, All = 4 }

    public static class QualitySettings
    {
        public static string[] names { get { return new[] { "Low", "Medium", "High", "Ultra" }; } }
        public static int GetQualityLevel() { return 2; }
        public static void SetQualityLevel(int index, bool applyExpensiveChanges) { }
        public static ShadowQuality shadows { get; set; }
        public static int antiAliasing { get; set; }
        public static int masterTextureLimit { get; set; }
        public static int vSyncCount { get; set; }
        public static bool anisotropicFiltering { get; set; }
        public static bool realtimeReflectionProbes { get; set; }
    }

    // ---- GUI ---------------------------------------------------------------
    public struct Rect
    {
        public float x, y, width, height;
        public Rect(float x, float y, float width, float height) { this.x = x; this.y = y; this.width = width; this.height = height; }
        public float xMin { get { return x; } }
        public float yMin { get { return y; } }
        public float xMax { get { return x + width; } }
        public float yMax { get { return y + height; } }
        public Vector2 center { get { return new Vector2(x + width * 0.5f, y + height * 0.5f); } }
        public Vector2 size { get { return new Vector2(width, height); } }
        public bool Contains(Vector2 point) { return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height; }
        public static Rect MinMaxRect(float xmin, float ymin, float xmax, float ymax) { return new Rect(xmin, ymin, xmax - xmin, ymax - ymin); }
    }

    public class RectOffset
    {
        public RectOffset() { }
        public RectOffset(int left, int right, int top, int bottom) { }
        public int left { get; set; }
        public int right { get; set; }
        public int top { get; set; }
        public int bottom { get; set; }
        public int horizontal { get { return left + right; } }
        public int vertical { get { return top + bottom; } }
    }

    public enum TextAnchor
    {
        UpperLeft, UpperCenter, UpperRight,
        MiddleLeft, MiddleCenter, MiddleRight,
        LowerLeft, LowerCenter, LowerRight
    }

    public enum FontStyle { Normal, Bold, Italic, BoldAndItalic }

    public class GUIContent
    {
        public static readonly GUIContent none = new GUIContent();
        public string text { get; set; }
        public Texture image { get; set; }
    }

    public class GUIStyleState
    {
        public Color textColor { get; set; }
        public Texture2D background { get; set; }
        public Texture2D texture { get; set; }
        public Sprite sprite { get; set; }
    }

    public class Sprite : Object { }

    public class GUIStyle
    {
        public GUIStyle() { }
        public GUIStyle(GUIStyle other) { }
        public int fontSize { get; set; }
        public TextAnchor alignment { get; set; }
        public FontStyle fontStyle { get; set; }
        public RectOffset border { get; set; }
        public RectOffset padding { get; set; }
        public RectOffset margin { get; set; }
        public bool wordWrap { get; set; }
        public GUIStyleState normal { get; set; }
        public GUIStyleState hover { get; set; }
        public GUIStyleState active { get; set; }
        public GUIStyleState focused { get; set; }
        public GUIStyleState disabled { get; set; }
    }

    public class GUISkin : Object
    {
        public GUIStyle button { get; set; }
        public GUIStyle label { get; set; }
        public GUIStyle box { get; set; }
        public GUIStyle window { get; set; }
    }

    public static class GUI
    {
        public static Color color { get; set; }
        public static Color backgroundColor { get; set; }
        public static GUISkin skin { get; set; }
        public static bool Button(Rect position, string text) { return false; }
        public static bool Button(Rect position, string text, GUIStyle style) { return false; }
        public static bool Button(Rect position, GUIContent content, GUIStyle style) { return false; }
        public static void Label(Rect position, string text) { }
        public static void Label(Rect position, string text, GUIStyle style) { }
        public static void Box(Rect position, string text) { }
        public static void Box(Rect position, GUIContent content) { }
        public static void Box(Rect position, GUIContent content, GUIStyle style) { }
        public static void Box(Rect position, string text, GUIStyle style) { }
        public static void DrawTexture(Rect position, Texture image) { }
        public static void DrawTexture(Rect position, Texture image, ScaleMode scaleMode) { }
        public static bool DragTexture(Rect position, Texture image) { return false; }
    }

    public enum ScaleMode { StretchToFill, ScaleAndCrop, ScaleToFit }

    public static class GUILayout
    {
        public static void BeginHorizontal() { }
        public static void BeginHorizontal(GUIStyle style) { }
        public static void EndHorizontal() { }
        public static void BeginVertical() { }
        public static void EndVertical() { }
        public static void Label(string text, params GUILayoutOption[] options) { }
        public static bool Button(string text, params GUILayoutOption[] options) { return false; }
        public static void FlexibleSpace() { }
        public static void Space(float pixels) { }
        public static GUILayoutOption Width(float width) { return null; }
        public static GUILayoutOption Height(float height) { return null; }
        public static GUILayoutOption ExpandWidth(bool expand) { return null; }
    }

    public class GUILayoutOption { }
}
