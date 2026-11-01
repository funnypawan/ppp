using System.Collections.Generic;
using UnityEngine;
using IBS.Core;

namespace IBS.World
{
    public class RoadNode
    {
        public Vector2 Pos;
        public List<int> Edges = new List<int>();
        public int Signal;                 // 0 none, 1 green, 2 yellow, 3 red
        public float SignalTimer;
    }

    public class RoadEdge
    {
        public int A;
        public int B;
        public float Length;
        public int Lanes = 2;
        public string Name = "";
        public bool Bridge;
        public bool Toll;
        public float SpeedLimit = 60f;
    }

    /// <summary>
    /// A directed road graph for one map. It drives traffic AI, GPS guidance
    /// and the procedural road meshes.
    /// </summary>
    public class RoadNetwork
    {
        public List<RoadNode> Nodes = new List<RoadNode>();
        public List<RoadEdge> Edges = new List<RoadEdge>();
        public MapDefinition Map;

        public void Build(MapDefinition map, int seed)
        {
            Map = map;
            Nodes.Clear();
            Edges.Clear();
            MathUtil.Rng rng = new MathUtil.Rng((uint)seed);
            switch (map.Layout)
            {
                case "highway": BuildHighway(rng); break;
                case "mountain": BuildMountain(rng); break;
                case "desert": BuildDesert(rng); break;
                case "village": BuildVillage(rng); break;
                default: BuildCity(rng); break;
            }
        }

        private int AddNode(Vector2 pos)
        {
            RoadNode node = new RoadNode { Pos = pos };
            Nodes.Add(node);
            return Nodes.Count - 1;
        }

        private void AddEdge(int a, int b, int lanes, string name, float speedLimit, bool bridge = false, bool toll = false)
        {
            if (a == b) return;
            for (int i = 0; i < Edges.Count; i++)
            {
                if ((Edges[i].A == a && Edges[i].B == b) || (Edges[i].A == b && Edges[i].B == a)) return;
            }
            RoadEdge edge = new RoadEdge
            {
                A = a,
                B = b,
                Length = Vector2.Distance(Nodes[a].Pos, Nodes[b].Pos),
                Lanes = lanes,
                Name = name,
                SpeedLimit = speedLimit,
                Bridge = bridge,
                Toll = toll
            };
            Edges.Add(edge);
            Nodes[a].Edges.Add(Edges.Count - 1);
            Nodes[b].Edges.Add(Edges.Count - 1);
        }

        /// <summary>Circular ring road with radial spokes and a dense inner grid.</summary>
        private void BuildCity(MathUtil.Rng rng)
        {
            float size = Map.Size;
            int ringCount = 3;
            List<int>[] rings = new List<int>[ringCount];
            int spokes = 8;
            for (int r = 0; r < ringCount; r++)
            {
                float radius = size * (0.16f + r * 0.13f);
                int segments = 16 + r * 6;
                rings[r] = new List<int>();
                for (int i = 0; i < segments; i++)
                {
                    float a = (i / (float)segments) * Mathf.PI * 2f;
                    float jitter = 1f + rng.Range(-0.06f, 0.06f);
                    rings[r].Add(AddNode(new Vector2(Mathf.Cos(a) * radius * jitter, Mathf.Sin(a) * radius * jitter)));
                }
                for (int i = 0; i < segments; i++)
                {
                    int a = rings[r][i];
                    int b = rings[r][(i + 1) % segments];
                    AddEdge(a, b, 3, r == 0 ? "Ring Road" : "City Road", r == 0 ? 60f : 50f);
                }
            }
            for (int s = 0; s < spokes; s++)
            {
                float a = (s / (float)spokes) * Mathf.PI * 2f;
                int prev = -1;
                for (int r = 0; r < ringCount; r++)
                {
                    int idx = Mathf.RoundToInt((a / (Mathf.PI * 2f)) * rings[r].Count) % rings[r].Count;
                    int node = rings[r][idx];
                    if (prev >= 0) AddEdge(prev, node, 2, "Link Road", 45f);
                    prev = node;
                }
            }
            // Outer belt road.
            int outer = AddNode(new Vector2(0f, size * 0.5f));
            int outer2 = AddNode(new Vector2(size * 0.5f, 0f));
            AddEdge(outer, outer2, 3, "Belt Road", 70f);
            AddEdge(outer2, rings[ringCount - 1][0], 2, "Belt Road", 60f);
        }

        /// <summary>Straight national highway with service roads, bridges and a toll plaza.</summary>
        private void BuildHighway(MathUtil.Rng rng)
        {
            float length = Map.Size;
            int nodes = 26;
            int prev = -1;
            int bridgeIndex = 13;
            int tollIndex = 20;
            for (int i = 0; i < nodes; i++)
            {
                float t = i / (float)(nodes - 1);
                float x = -length * 0.5f + t * length;
                float y = Mathf.Sin(t * 7f) * 60f + rng.Range(-18f, 18f);
                int node = AddNode(new Vector2(x, y));
                if (prev >= 0)
                {
                    AddEdge(prev, node, 3, "NH-48", 90f, i == bridgeIndex, i == tollIndex);
                }
                prev = node;
            }
            // Service road with local junctions.
            int prevService = -1;
            for (int i = 2; i < nodes - 2; i += 3)
            {
                Vector2 p = Nodes[i].Pos + new Vector2(0f, 70f);
                int node = AddNode(p);
                if (prevService >= 0) AddEdge(prevService, node, 1, "Service Road", 40f);
                prevService = node;
                AddEdge(i, node, 1, "Service Road", 40f);
            }
            // Truck stop cluster.
            for (int i = 8; i < 12; i++)
            {
                int node = AddNode(Nodes[i].Pos + new Vector2(rng.Range(-40f, 40f), 140f));
                AddEdge(i, node, 1, "Truck Stop", 30f);
            }
        }

        /// <summary>Switchback hill road climbing to a plateau.</summary>
        private void BuildMountain(MathUtil.Rng rng)
        {
            float length = Map.Size;
            int legs = 9;
            int prev = -1;
            for (int l = 0; l < legs; l++)
            {
                float t = l / (float)(legs - 1);
                float y = -length * 0.45f + t * length * 0.9f;
                float x = (l % 2 == 0) ? -length * 0.3f : length * 0.3f;
                int a = AddNode(new Vector2(x, y));
                float midX = (l % 2 == 0) ? length * 0.3f : -length * 0.3f;
                int b = AddNode(new Vector2(midX, y + length * 0.05f));
                if (prev >= 0) AddEdge(prev, a, 2, "Hill Road", 45f);
                AddEdge(a, b, 2, "Hairpin", 25f);
                prev = b;
            }
            int top = AddNode(new Vector2(0f, length * 0.48f));
            AddEdge(prev, top, 2, "Hill Road", 35f);
            for (int i = 0; i < 6; i++)
            {
                int node = AddNode(new Vector2(rng.Range(-120f, 120f), length * 0.48f + rng.Range(-40f, 60f)));
                AddEdge(top, node, 1, "Hill Village", 25f);
            }
        }

        /// <summary>Long straight desert road with a couple of bends.</summary>
        private void BuildDesert(MathUtil.Rng rng)
        {
            float length = Map.Size;
            int nodes = 20;
            int prev = -1;
            for (int i = 0; i < nodes; i++)
            {
                float t = i / (float)(nodes - 1);
                float x = -length * 0.5f + t * length;
                float y = Mathf.Sin(t * 3.4f) * 120f + rng.Range(-10f, 10f);
                int node = AddNode(new Vector2(x, y));
                if (prev >= 0) AddEdge(prev, node, 3, "NH-12", 90f, false, i == 10);
                prev = node;
            }
            for (int i = 0; i < 5; i++)
            {
                int node = AddNode(Nodes[i * 4].Pos + new Vector2(rng.Range(-60f, 60f), rng.Range(-90f, -40f)));
                AddEdge(i * 4, node, 1, "Dune Track", 35f);
            }
        }

        /// <summary>Narrow lanes and a loop around the village centre.</summary>
        private void BuildVillage(MathUtil.Rng rng)
        {
            float size = Map.Size;
            int centre = AddNode(Vector2.zero);
            int loopNodes = 10;
            int prev = -1;
            for (int i = 0; i < loopNodes; i++)
            {
                float a = (i / (float)loopNodes) * Mathf.PI * 2f;
                float radius = size * (0.22f + rng.Range(-0.04f, 0.04f));
                int node = AddNode(new Vector2(Mathf.Cos(a) * radius, Mathf.Sin(a) * radius));
                if (prev >= 0) AddEdge(prev, node, 1, "Village Lane", 25f);
                prev = node;
            }
            AddEdge(prev, centre, 1, "Village Lane", 25f);
            for (int i = 0; i < 8; i++)
            {
                float a = rng.Range(0f, Mathf.PI * 2f);
                float r = rng.Range(size * 0.3f, size * 0.45f);
                int node = AddNode(new Vector2(Mathf.Cos(a) * r, Mathf.Sin(a) * r));
                AddEdge(centre, node, 1, "Field Track", 25f);
            }
        }

        /// <summary>Returns the node closest to a world position.</summary>
        public int NearestNode(Vector2 pos)
        {
            int best = 0;
            float bestDist = float.MaxValue;
            for (int i = 0; i < Nodes.Count; i++)
            {
                float d = (Nodes[i].Pos - pos).sqrMagnitude;
                if (d < bestDist)
                {
                    bestDist = d;
                    best = i;
                }
            }
            return best;
        }

        /// <summary>Breadth first search used by the GPS to build a route.</summary>
        public List<int> FindPath(int from, int to)
        {
            List<int> previous = new List<int>();
            for (int i = 0; i < Nodes.Count; i++) previous.Add(-1);
            Queue<int> queue = new Queue<int>();
            queue.Enqueue(from);
            previous[from] = from;
            while (queue.Count > 0)
            {
                int current = queue.Dequeue();
                if (current == to) break;
                foreach (int edgeIndex in Nodes[current].Edges)
                {
                    RoadEdge edge = Edges[edgeIndex];
                    int next = edge.A == current ? edge.B : edge.A;
                    if (previous[next] != -1) continue;
                    previous[next] = current;
                    queue.Enqueue(next);
                }
            }
            if (previous[to] == -1) return null;
            List<int> path = new List<int>();
            int node = to;
            while (node != from)
            {
                path.Add(node);
                node = previous[node];
                if (node < 0) return null;
            }
            path.Add(from);
            path.Reverse();
            return path;
        }

        /// <summary>Total length of a node path.</summary>
        public float PathLength(List<int> path)
        {
            float length = 0f;
            for (int i = 0; i < path.Count - 1; i++)
            {
                length += Vector2.Distance(Nodes[path[i]].Pos, Nodes[path[i + 1]].Pos);
            }
            return length;
        }

        /// <summary>Random free edge for spawning traffic.</summary>
        public RoadEdge RandomEdge(MathUtil.Rng rng)
        {
            if (Edges.Count == 0) return null;
            return Edges[rng.Range(0, Edges.Count - 1)];
        }
    }
}
