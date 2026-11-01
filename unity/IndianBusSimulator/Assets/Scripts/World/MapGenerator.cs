using System.Collections.Generic;
using UnityEngine;
using IBS.Core;
using IBS.Util;

namespace IBS.World
{
    /// <summary>One passenger boarding point.</summary>
    public class BusStop
    {
        public Vector2 Pos;
        public string Name;
        public bool HasShelter = true;
        public float Angle;
    }

    /// <summary>
    /// Turns a road network into a visual map: terrain, road ribbons, lane
    /// markings, buildings, shops, fuel stations, bus stops, street lights,
    /// signals, bridges, flyovers, toll plazas, trees, mountains and a river.
    /// </summary>
    public class MapGenerator : MonoBehaviour
    {
        public RoadNetwork Network;
        public MapDefinition Map;
        public readonly List<BusStop> Stops = new List<BusStop>();
        public readonly List<WorldCollider> Colliders = new List<WorldCollider>();
        public readonly List<Vector2> FuelStations = new List<Vector2>();
        public GameObject Root;

        public void Generate(RoadNetwork network, MapDefinition map, int seed)
        {
            Network = network;
            Map = map;
            Stops.Clear();
            Colliders.Clear();
            FuelStations.Clear();
            if (Root != null) Object.Destroy(Root);
            Root = new GameObject("Map_" + map.Id);
            MathUtil.Rng rng = new MathUtil.Rng(seed);

            BuildGround();
            BuildRoads();
            BuildBuildings(rng);
            BuildStops(rng);
            BuildFuelStations(rng);
            BuildFurniture(rng);
            BuildScenery(rng);
            BuildSignals();
        }

        private Material _ground;
        private Material _road;
        private Material _edge;
        private Material _marking;
        private Material _building;
        private Material _foliage;
        private Material _metal;

        private void BuildGround()
        {
            _ground = ProceduralMesh.Material(Map.Ground);
            _road = ProceduralMesh.Material(Map.Road);
            _edge = ProceduralMesh.Material(Map.RoadEdge);
            _marking = ProceduralMesh.Material(Map.Marking);
            _building = ProceduralMesh.Material(Map.BuildingColors.Length > 0 ? Map.BuildingColors[0] : Color.gray);
            _foliage = ProceduralMesh.Material(Map.Foliage);
            _metal = ProceduralMesh.Material(new Color(0.42f, 0.44f, 0.46f));

            GameObject ground = ProceduralMesh.CreateMeshObject("Ground", ProceduralMesh.Quad(Map.Size * 1.6f, Map.Size * 1.6f), _ground, Root.transform);
            ground.transform.localPosition = new Vector3(0f, 0f, 0f);
        }

        private void BuildRoads()
        {
            GameObject roadRoot = new GameObject("Roads");
            roadRoot.transform.SetParent(Root.transform, false);
            GameObject markingRoot = new GameObject("Markings");
            markingRoot.transform.SetParent(Root.transform, false);

            for (int i = 0; i < Network.Edges.Count; i++)
            {
                RoadEdge edge = Network.Edges[i];
                Vector2 a = Network.Nodes[edge.A].Pos;
                Vector2 b = Network.Nodes[edge.B].Pos;
                float length = Vector2.Distance(a, b);
                if (length < 1f) continue;

                List<Vector3> points = new List<Vector3>
                {
                    new Vector3(a.x, 0f, a.y),
                    new Vector3(b.x, 0f, b.y),
                };
                float width = edge.Lanes * 3.6f;
                float height = edge.Bridge ? 6f : 0.02f;
                Mesh ribbon = ProceduralMesh.Ribbon(points, width, height);
                GameObject road = ProceduralMesh.CreateMeshObject("Road_" + i, ribbon, _road, roadRoot.transform);
                road.transform.position = new Vector3(0f, 0.02f, 0f);

                // Verge
                Mesh verge = ProceduralMesh.Ribbon(points, width + 2.4f, height * 0.5f);
                GameObject vergeGo = ProceduralMesh.CreateMeshObject("Verge_" + i, verge, _edge, roadRoot.transform);
                vergeGo.transform.position = new Vector3(0f, -0.01f, 0f);

                // Centre dashes
                Vector3 dir = (points[1] - points[0]).normalized;
                Vector3 side = new Vector3(-dir.z, 0f, dir.x);
                int dashes = Mathf.Max(1, (int)(length / 8f));
                for (int d = 0; d < dashes; d++)
                {
                    float t = (d + 0.5f) / dashes;
                    Vector3 p = Vector3.Lerp(points[0], points[1], t) + Vector3.up * (height + 0.03f);
                    GameObject dash = ProceduralMesh.CreateMeshObject("Dash", ProceduralMesh.Quad(0.22f, 3.2f), _marking, markingRoot.transform);
                    dash.transform.position = p;
                    dash.transform.rotation = Quaternion.LookRotation(dir, Vector3.up);
                }

                if (edge.Bridge)
                {
                    for (int s = 0; s < 6; s++)
                    {
                        float t = (s + 0.5f) / 6f;
                        Vector3 p = Vector3.Lerp(points[0], points[1], t);
                        GameObject pier = ProceduralMesh.CreateMeshObject("Pier", ProceduralMesh.Box(1.6f, height, 1.6f), _edge, roadRoot.transform);
                        pier.transform.position = new Vector3(p.x, height * 0.5f, p.z);
                    }
                }

                if (edge.Toll)
                {
                    Vector3 mid = Vector3.Lerp(points[0], points[1], 0.5f);
                    GameObject plaza = ProceduralMesh.CreateMeshObject("TollPlaza", ProceduralMesh.Box(26f, 7f, 5f), _building, roadRoot.transform);
                    plaza.transform.position = new Vector3(mid.x, 3.5f, mid.z);
                    plaza.transform.rotation = Quaternion.LookRotation(dir, Vector3.up);
                }
            }
        }

        private void BuildBuildings(MathUtil.Rng rng)
        {
            GameObject buildingRoot = new GameObject("Buildings");
            buildingRoot.transform.SetParent(Root.transform, false);

            for (int i = 0; i < Network.Edges.Count; i++)
            {
                RoadEdge edge = Network.Edges[i];
                Vector2 a = Network.Nodes[edge.A].Pos;
                Vector2 b = Network.Nodes[edge.B].Pos;
                Vector2 dir = (b - a).normalized;
                Vector2 side = new Vector2(-dir.y, dir.x);
                float length = Vector2.Distance(a, b);

                int count = Mathf.Max(1, (int)(length / 26f));
                for (int c = 0; c < count; c++)
                {
                    if (rng.Range(0f, 1f) > 0.75f) continue;
                    float t = rng.Range(0.15f, 0.85f);
                    float offset = rng.Range(16f, 30f);
                    Vector2 pos = Vector2.Lerp(a, b, t) + side * offset * (rng.Range(0f, 1f) > 0.5f ? 1f : -1f);
                    float w = rng.Range(8f, 18f);
                    float h = rng.Range(4f, 16f);
                    float d = rng.Range(8f, 18f);
                    Color color = Map.BuildingColors.Length > 0
                        ? Map.BuildingColors[rng.Range(0, Map.BuildingColors.Length - 1)]
                        : Color.gray;
                    GameObject building = ProceduralMesh.CreateMeshObject("Building", ProceduralMesh.Box(w, h, d),
                        ProceduralMesh.Material(color), buildingRoot.transform);
                    building.transform.position = new Vector3(pos.x, h * 0.5f, pos.y);
                    building.transform.rotation = Quaternion.Euler(0f, rng.Range(-8f, 8f), 0f);

                    // Rooftop details for taller city buildings.
                    if (h > 9f)
                    {
                        GameObject tank = ProceduralMesh.CreateMeshObject("WaterTank", ProceduralMesh.Box(1.6f, 1.6f, 1.6f), _metal, building.transform);
                        tank.transform.localPosition = new Vector3(0f, h * 0.5f + 0.8f, 0f);
                    }

                    // Shop front on street facing buildings.
                    if (Map.Layout == "city" && h < 9f)
                    {
                        GameObject shop = ProceduralMesh.CreateMeshObject("Shop", ProceduralMesh.Box(w * 0.6f, 2.4f, 0.4f),
                            ProceduralMesh.Material(Map.Accent), building.transform);
                        shop.transform.localPosition = new Vector3(0f, -h * 0.5f + 1.4f, -d * 0.5f - 0.2f);
                    }

                    Colliders.Add(WorldCollider.Circle(pos.x, pos.y, Mathf.Max(w, d) * 0.55f));
                }
            }
        }

        private void BuildStops(MathUtil.Rng rng)
        {
            GameObject stopRoot = new GameObject("Stops");
            stopRoot.transform.SetParent(Root.transform, false);
            int count = Map.StopCount;
            for (int i = 0; i < count; i++)
            {
                if (Network.Edges.Count == 0) break;
                RoadEdge edge = Network.Edges[(i * Mathf.Max(1, Network.Edges.Count / count)) % Network.Edges.Count];
                Vector2 a = Network.Nodes[edge.A].Pos;
                Vector2 b = Network.Nodes[edge.B].Pos;
                float t = rng.Range(0.25f, 0.75f);
                Vector2 pos = Vector2.Lerp(a, b, t);
                Vector2 dir = (b - a).normalized;
                Vector2 side = new Vector2(-dir.y, dir.x);
                pos += side * 6.5f;

                BusStop stop = new BusStop
                {
                    Pos = pos,
                    Name = StopName(i),
                    Angle = Mathf.Atan2(dir.y, dir.x),
                    HasShelter = true
                };
                Stops.Add(stop);

                GameObject shelter = ProceduralMesh.CreateMeshObject("Stop_" + i, ProceduralMesh.Box(4.2f, 0.25f, 2.2f), _metal, stopRoot.transform);
                shelter.transform.position = new Vector3(pos.x, 2.6f, pos.y);
                shelter.transform.rotation = Quaternion.Euler(0f, stop.Angle * MathfConst.Rad2Deg, 0f);
                for (int p = 0; p < 2; p++)
                {
                    GameObject pole = ProceduralMesh.CreateMeshObject("Pole", ProceduralMesh.Box(0.16f, 2.6f, 0.16f), _metal, stopRoot.transform);
                    pole.transform.position = new Vector3(pos.x + (p == 0 ? -1.8f : 1.8f), 1.3f, pos.y);
                }
                GameObject sign = ProceduralMesh.CreateMeshObject("Sign", ProceduralMesh.Box(1.2f, 0.8f, 0.08f),
                    ProceduralMesh.Material(Map.Accent), stopRoot.transform);
                sign.transform.position = new Vector3(pos.x, 3.3f, pos.y);
            }
        }

        private void BuildFuelStations(MathUtil.Rng rng)
        {
            GameObject root = new GameObject("FuelStations");
            root.transform.SetParent(Root.transform, false);
            int count = Map.Layout == "highway" ? 4 : 2;
            for (int i = 0; i < count; i++)
            {
                if (Network.Edges.Count == 0) break;
                RoadEdge edge = Network.Edges[(i * 5 + 2) % Network.Edges.Count];
                Vector2 a = Network.Nodes[edge.A].Pos;
                Vector2 b = Network.Nodes[edge.B].Pos;
                Vector2 pos = Vector2.Lerp(a, b, 0.5f) + new Vector2(18f, 12f);
                FuelStations.Add(pos);
                GameObject pump = ProceduralMesh.CreateMeshObject("FuelPump", ProceduralMesh.Box(1.6f, 2.4f, 1f),
                    ProceduralMesh.Material(new Color(0.9f, 0.85f, 0.3f)), root.transform);
                pump.transform.position = new Vector3(pos.x, 1.2f, pos.y);
                GameObject canopy = ProceduralMesh.CreateMeshObject("Canopy", ProceduralMesh.Box(12f, 0.4f, 8f),
                    ProceduralMesh.Material(Map.Accent), root.transform);
                canopy.transform.position = new Vector3(pos.x, 4.4f, pos.y);
            }
        }

        private void BuildFurniture(MathUtil.Rng rng)
        {
            GameObject root = new GameObject("Furniture");
            root.transform.SetParent(Root.transform, false);
            Material lampMaterial = ProceduralMesh.EmissiveMaterial(new Color(1f, 0.9f, 0.65f));

            for (int i = 0; i < Network.Edges.Count; i++)
            {
                RoadEdge edge = Network.Edges[i];
                Vector2 a = Network.Nodes[edge.A].Pos;
                Vector2 b = Network.Nodes[edge.B].Pos;
                float length = Vector2.Distance(a, b);
                int lamps = (int)(length / 55f);
                Vector2 dir = (b - a).normalized;
                Vector2 side = new Vector2(-dir.y, dir.x);
                for (int l = 0; l < lamps; l++)
                {
                    float t = (l + 0.5f) / Mathf.Max(1, lamps);
                    Vector2 pos = Vector2.Lerp(a, b, t) + side * (edge.Lanes * 2.2f);
                    GameObject post = ProceduralMesh.CreateMeshObject("LampPost", ProceduralMesh.Box(0.16f, 7f, 0.16f), _metal, root.transform);
                    post.transform.position = new Vector3(pos.x, 3.5f, pos.y);
                    GameObject head = ProceduralMesh.CreateMeshObject("LampHead", ProceduralMesh.Box(0.7f, 0.2f, 0.4f), lampMaterial, root.transform);
                    head.transform.position = new Vector3(pos.x, 6.9f, pos.y);
                }
            }
        }

        private void BuildScenery(MathUtil.Rng rng)
        {
            GameObject root = new GameObject("Scenery");
            root.transform.SetParent(Root.transform, false);
            Mesh trunkMesh = ProceduralMesh.Box(0.5f, 3f, 0.5f);
            Mesh canopyMesh = ProceduralMesh.Cone(2.4f, 5.5f, 8);
            Material trunkMaterial = ProceduralMesh.Material(new Color(0.35f, 0.26f, 0.18f));

            int trees = Map.Layout == "highway" ? 220 : 180;
            for (int i = 0; i < trees; i++)
            {
                Vector2 pos = new Vector2(rng.Range(-Map.Size * 0.55f, Map.Size * 0.55f), rng.Range(-Map.Size * 0.55f, Map.Size * 0.55f));
                if (IsNearRoad(pos, 9f)) continue;
                GameObject tree = new GameObject("Tree");
                tree.transform.SetParent(root.transform, false);
                tree.transform.position = new Vector3(pos.x, 0f, pos.y);
                ProceduralMesh.CreateMeshObject("Trunk", trunkMesh, trunkMaterial, tree.transform).transform.localPosition = new Vector3(0f, 1.5f, 0f);
                ProceduralMesh.CreateMeshObject("Canopy", canopyMesh, _foliage, tree.transform).transform.localPosition = new Vector3(0f, 4.4f, 0f);
            }

            if (Map.HasMountains)
            {
                Material mountain = ProceduralMesh.Material(new Color(0.44f, 0.42f, 0.38f));
                for (int i = 0; i < 26; i++)
                {
                    float angle = rng.Range(0f, Mathf.PI * 2f);
                    float dist = rng.Range(Map.Size * 0.55f, Map.Size * 0.95f);
                    Vector2 pos = new Vector2(Mathf.Cos(angle) * dist, Mathf.Sin(angle) * dist);
                    float h = rng.Range(60f, 170f);
                    GameObject m = ProceduralMesh.CreateMeshObject("Mountain", ProceduralMesh.Cone(rng.Range(40f, 95f), h, 7), mountain, root.transform);
                    m.transform.position = new Vector3(pos.x, h * 0.5f, pos.y);
                }
            }

            if (Map.HasRiver)
            {
                List<Vector3> river = new List<Vector3>();
                for (int i = 0; i <= 12; i++)
                {
                    float t = i / 12f;
                    river.Add(new Vector3(-Map.Size * 0.6f + t * Map.Size * 1.2f, 0.05f, -Map.Size * 0.35f + Mathf.Sin(t * 4f) * 90f));
                }
                Mesh riverMesh = ProceduralMesh.Ribbon(river, 26f, 0f);
                GameObject riverGo = ProceduralMesh.CreateMeshObject("River", riverMesh,
                    ProceduralMesh.Material(new Color(0.25f, 0.5f, 0.62f)), root.transform);
                riverGo.transform.position = new Vector3(0f, 0.06f, 0f);
            }
        }

        private void BuildSignals()
        {
            GameObject root = new GameObject("Signals");
            root.transform.SetParent(Root.transform, false);
            Material red = ProceduralMesh.EmissiveMaterial(new Color(0.9f, 0.15f, 0.12f));
            for (int i = 0; i < Network.Nodes.Count; i++)
            {
                RoadNode node = Network.Nodes[i];
                if (node.Edges.Count < 3) continue;
                GameObject signal = ProceduralMesh.CreateMeshObject("Signal", ProceduralMesh.Box(0.3f, 3.2f, 0.3f), _metal, root.transform);
                signal.transform.position = new Vector3(node.Pos.x, 1.6f, node.Pos.y);
                GameObject lamp = ProceduralMesh.CreateMeshObject("SignalLamp", ProceduralMesh.Box(0.22f, 0.22f, 0.22f), red, root.transform);
                lamp.transform.position = new Vector3(node.Pos.x, 2.9f, node.Pos.y);
            }
        }

        private bool IsNearRoad(Vector2 pos, float radius)
        {
            for (int i = 0; i < Network.Edges.Count; i++)
            {
                RoadEdge edge = Network.Edges[i];
                Vector2 a = Network.Nodes[edge.A].Pos;
                Vector2 b = Network.Nodes[edge.B].Pos;
                Vector2 ab = b - a;
                float t = Vector2.Dot(pos - a, ab) / Mathf.Max(0.001f, ab.sqrMagnitude);
                t = Mathf.Clamp01(t);
                if (Vector2.Distance(pos, a + ab * t) < radius) return true;
            }
            return false;
        }

        private static string StopName(int index)
        {
            string[] names =
            {
                "Bus Stand", "Chowk", "Market", "Temple", "Railway Station", "College Gate",
                "Municipal Office", "Hospital", "Nehru Nagar", "Water Works", "Sugar Mill", "Old Bazaar"
            };
            return names[index % names.Length];
        }
    }
}
