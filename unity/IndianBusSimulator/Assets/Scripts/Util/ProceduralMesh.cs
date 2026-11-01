using System.Collections.Generic;
using UnityEngine;

namespace IBS.Util
{
    /// <summary>
    /// Small procedural mesh toolkit used to build every object in the game at
    /// runtime: no imported FBX assets are needed, which keeps the build tiny
    /// and lets every bus and map be generated from data.
    /// </summary>
    public static class ProceduralMesh
    {
        /// <summary>Axis aligned box centred on the origin.</summary>
        public static Mesh Box(float width, float height, float depth)
        {
            Mesh mesh = new Mesh();
            mesh.name = "Box";
            Vector3 h = new Vector3(width * 0.5f, height * 0.5f, depth * 0.5f);
            Vector3[] v =
            {
                new Vector3(-h.x, -h.y, -h.z), new Vector3(h.x, -h.y, -h.z),
                new Vector3(h.x, h.y, -h.z), new Vector3(-h.x, h.y, -h.z),
                new Vector3(-h.x, -h.y, h.z), new Vector3(h.x, -h.y, h.z),
                new Vector3(h.x, h.y, h.z), new Vector3(-h.x, h.y, h.z),
            };
            int[] t =
            {
                0, 2, 1, 0, 3, 2, // back
                4, 5, 6, 4, 6, 7, // front
                0, 1, 5, 0, 5, 4, // bottom
                3, 7, 6, 3, 6, 2, // top
                0, 4, 7, 0, 7, 3, // left
                1, 2, 6, 1, 6, 5, // right
            };
            mesh.vertices = v;
            mesh.triangles = t;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>Cylinder along the X axis (used for wheels).</summary>
        public static Mesh Cylinder(float radius, float length, int segments)
        {
            List<Vector3> verts = new List<Vector3>();
            List<int> tris = new List<int>();
            for (int i = 0; i < segments; i++)
            {
                float a0 = (i / (float)segments) * Mathf.PI * 2f;
                float a1 = ((i + 1) / (float)segments) * Mathf.PI * 2f;
                float x0 = -length * 0.5f;
                float x1 = length * 0.5f;
                int baseIndex = verts.Count;
                verts.Add(new Vector3(x0, Mathf.Cos(a0) * radius, Mathf.Sin(a0) * radius));
                verts.Add(new Vector3(x1, Mathf.Cos(a0) * radius, Mathf.Sin(a0) * radius));
                verts.Add(new Vector3(x1, Mathf.Cos(a1) * radius, Mathf.Sin(a1) * radius));
                verts.Add(new Vector3(x0, Mathf.Cos(a1) * radius, Mathf.Sin(a1) * radius));
                tris.Add(baseIndex); tris.Add(baseIndex + 1); tris.Add(baseIndex + 2);
                tris.Add(baseIndex); tris.Add(baseIndex + 2); tris.Add(baseIndex + 3);
            }
            Mesh mesh = new Mesh();
            mesh.vertices = verts.ToArray();
            mesh.triangles = tris.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>Flat quad on the XZ plane.</summary>
        public static Mesh Quad(float width, float depth)
        {
            Mesh mesh = new Mesh();
            mesh.name = "Quad";
            float hw = width * 0.5f;
            float hd = depth * 0.5f;
            mesh.vertices = new[]
            {
                new Vector3(-hw, 0f, -hd), new Vector3(hw, 0f, -hd),
                new Vector3(hw, 0f, hd), new Vector3(-hw, 0f, hd),
            };
            mesh.triangles = new[] { 0, 2, 1, 0, 3, 2 };
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>Cone used for trees, mountains and markers.</summary>
        public static Mesh Cone(float radius, float height, int segments)
        {
            List<Vector3> verts = new List<Vector3>();
            List<int> tris = new List<int>();
            verts.Add(new Vector3(0f, height * 0.5f, 0f));
            for (int i = 0; i <= segments; i++)
            {
                float a = (i / (float)segments) * Mathf.PI * 2f;
                verts.Add(new Vector3(Mathf.Cos(a) * radius, -height * 0.5f, Mathf.Sin(a) * radius));
            }
            for (int i = 1; i <= segments; i++)
            {
                tris.Add(0); tris.Add(i); tris.Add(i + 1);
            }
            Mesh mesh = new Mesh();
            mesh.vertices = verts.ToArray();
            mesh.triangles = tris.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>
        /// Builds a ribbon mesh along a polyline (used for roads).
        /// </summary>
        public static Mesh Ribbon(IList<Vector3> points, float width, float yOffset)
        {
            List<Vector3> verts = new List<Vector3>();
            List<int> tris = new List<int>();
            for (int i = 0; i < points.Count; i++)
            {
                Vector3 p = points[i];
                Vector3 dir;
                if (i == 0) dir = (points[1] - points[0]).normalized;
                else if (i == points.Count - 1) dir = (points[i] - points[i - 1]).normalized;
                else dir = (points[i + 1] - points[i - 1]).normalized;
                Vector3 side = new Vector3(-dir.z, 0f, dir.x) * (width * 0.5f);
                verts.Add(p + side + Vector3.up * yOffset);
                verts.Add(p - side + Vector3.up * yOffset);
            }
            for (int i = 0; i < points.Count - 1; i++)
            {
                int b = i * 2;
                tris.Add(b); tris.Add(b + 1); tris.Add(b + 3);
                tris.Add(b); tris.Add(b + 3); tris.Add(b + 2);
            }
            Mesh mesh = new Mesh();
            mesh.vertices = verts.ToArray();
            mesh.triangles = tris.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        /// <summary>Creates a simple lit material (falls back to the standard shader).</summary>
        public static Material Material(Color color)
        {
            Shader shader = Shader.Find("Standard");
            if (shader == null) shader = Shader.Find("Legacy Shaders/Diffuse");
            if (shader == null) shader = Shader.Find("Sprites/Default");
            Material material = new Material(shader);
            material.color = color;
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", 0.15f);
            return material;
        }

        /// <summary>Emissive material used for lights, signals and windows at night.</summary>
        public static Material EmissiveMaterial(Color color)
        {
            Shader shader = Shader.Find("Standard");
            if (shader == null) shader = Shader.Find("Legacy Shaders/Diffuse");
            Material material = new Material(shader);
            material.color = color;
            if (material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color);
            }
            return material;
        }

        /// <summary>Adds a mesh renderer object to the scene.</summary>
        public static GameObject CreateMeshObject(string name, Mesh mesh, Material material, Transform parent)
        {
            GameObject go = new GameObject(name);
            if (parent != null) go.transform.SetParent(parent, false);
            MeshFilter filter = go.AddComponent<MeshFilter>();
            filter.sharedMesh = mesh;
            MeshRenderer renderer = go.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            return go;
        }
    }
}
