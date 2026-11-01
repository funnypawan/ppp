using System.Collections.Generic;
using UnityEngine;
using IBS.Core;
using IBS.Util;

namespace IBS.Vehicles
{
    public enum TrafficKind { Car, Truck, Bus, Motorcycle, AutoRickshaw, Police }

    public class TrafficVehicle
    {
        public TrafficKind Kind;
        public Transform Transform;
        public float X;
        public float Y;
        public float Yaw;
        public float Speed;
        public float TargetSpeed;
        public int Edge;
        public int NextEdge = -1;
        public float Progress;
        public bool IsPlayerAhead;
        public float LaneOffset;
        public GameObject Model;
        public Color Color;
    }

    /// <summary>
    /// Lightweight traffic AI: vehicles follow the road graph, keep to their
    /// lane, respect the speed limit, slow for the player bus and obey
    /// signals at junctions.
    /// </summary>
    public class TrafficSystem : MonoBehaviour
    {
        public RoadNetwork Network;
        public BusEntity Player;
        public float Density = 0.6f;
        public int MaxVehicles = 26;

        public readonly List<TrafficVehicle> Vehicles = new List<TrafficVehicle>();
        private MathUtil.Rng _rng = new MathUtil.Rng(1337);
        private GameObject _root;

        public void Initialise(RoadNetwork network, float density, BusEntity player)
        {
            Network = network;
            Density = density;
            Player = player;
            _rng = new MathUtil.Rng(4242);
            if (_root == null) _root = new GameObject("Traffic");
            _root.transform.SetParent(transform, false);
            Clear();
            int count = Mathf.Clamp(Mathf.RoundToInt(density * MaxVehicles), 4, MaxVehicles);
            for (int i = 0; i < count; i++) Spawn();
        }

        public void Clear()
        {
            for (int i = 0; i < Vehicles.Count; i++)
            {
                if (Vehicles[i].Model != null) Object.Destroy(Vehicles[i].Model);
            }
            Vehicles.Clear();
        }

        private void Spawn()
        {
            if (Network == null || Network.Edges.Count == 0) return;
            RoadEdge edge = Network.RandomEdge(_rng);
            if (edge == null) return;

            TrafficKind kind = PickKind();
            TrafficVehicle vehicle = new TrafficVehicle
            {
                Kind = kind,
                Edge = Network.Edges.IndexOf(edge),
                Progress = _rng.Range(0.05f, 0.9f),
                LaneOffset = kind == TrafficKind.Motorcycle ? 0.2f : _rng.Range(-0.4f, 0.4f),
                TargetSpeed = 0f
            };
            Vector2 pos = PointOnEdge(edge, vehicle.Progress, vehicle.LaneOffset);
            vehicle.X = pos.x;
            vehicle.Y = pos.y;
            vehicle.Yaw = Mathf.Atan2(edge.B, edge.A) == 0 ? 0f : 0f;
            Vector2 dir = (Network.Nodes[edge.B].Pos - Network.Nodes[edge.A].Pos).normalized;
            vehicle.Yaw = Mathf.Atan2(dir.x, dir.y);
            vehicle.Speed = _rng.Range(6f, 14f);
            vehicle.Color = RandomCarColor();
            vehicle.Model = BuildModel(kind, vehicle.Color);
            Vehicles.Add(vehicle);
        }

        private TrafficKind PickKind()
        {
            float roll = _rng.Range(0f, 1f);
            if (roll < 0.42f) return TrafficKind.Car;
            if (roll < 0.62f) return TrafficKind.Truck;
            if (roll < 0.75f) return TrafficKind.Bus;
            if (roll < 0.87f) return TrafficKind.Motorcycle;
            if (roll < 0.96f) return TrafficKind.AutoRickshaw;
            return TrafficKind.Police;
        }

        private Color RandomCarColor()
        {
            Color[] palette =
            {
                new Color(0.85f, 0.85f, 0.88f), new Color(0.15f, 0.16f, 0.18f), new Color(0.55f, 0.12f, 0.12f),
                new Color(0.16f, 0.3f, 0.55f), new Color(0.9f, 0.72f, 0.15f), new Color(0.2f, 0.45f, 0.3f),
                new Color(0.7f, 0.35f, 0.12f),
            };
            return palette[_rng.Range(0, palette.Length - 1)];
        }

        private GameObject BuildModel(TrafficKind kind, Color color)
        {
            GameObject go = new GameObject("Traffic_" + kind);
            go.transform.SetParent(_root.transform, false);
            Material body = ProceduralMesh.Material(color);
            Material glass = ProceduralMesh.Material(new Color(0.12f, 0.16f, 0.2f));
            Material tyre = ProceduralMesh.Material(new Color(0.08f, 0.08f, 0.09f));
            float length = 4.2f;
            float width = 1.8f;
            float height = 1.5f;
            switch (kind)
            {
                case TrafficKind.Truck: length = 8.5f; width = 2.4f; height = 3.2f; break;
                case TrafficKind.Bus: length = 10.5f; width = 2.5f; height = 3.2f; break;
                case TrafficKind.Motorcycle: length = 2.1f; width = 0.7f; height = 1.2f; break;
                case TrafficKind.AutoRickshaw: length = 2.9f; width = 1.4f; height = 1.8f; break;
                case TrafficKind.Police: length = 4.4f; width = 1.85f; height = 1.6f; break;
            }
            GameObject bodyGo = ProceduralMesh.CreateMeshObject("Body", ProceduralMesh.Box(width, height, length), body, go.transform);
            bodyGo.transform.localPosition = new Vector3(0f, height * 0.5f + 0.35f, 0f);
            GameObject cabin = ProceduralMesh.CreateMeshObject("Cabin", ProceduralMesh.Box(width * 0.86f, height * 0.42f, length * 0.45f), glass, go.transform);
            cabin.transform.localPosition = new Vector3(0f, height * 0.95f, -length * 0.08f);
            Mesh wheelMesh = ProceduralMesh.Cylinder(0.34f, 0.24f, 10);
            float axleF = length * 0.5f - 0.9f;
            float axleR = -length * 0.5f + (kind == TrafficKind.Truck ? 2.4f : 0.9f);
            for (int i = 0; i < 4; i++)
            {
                GameObject wheel = ProceduralMesh.CreateMeshObject("Wheel", wheelMesh, tyre, go.transform);
                wheel.transform.localPosition = new Vector3((i % 2 == 0 ? 1f : -1f) * (width * 0.5f - 0.12f), 0.34f, i < 2 ? axleF : axleR);
            }
            if (kind == TrafficKind.Police)
            {
                GameObject light = ProceduralMesh.CreateMeshObject("Siren", ProceduralMesh.Box(0.6f, 0.16f, 0.3f),
                    ProceduralMesh.EmissiveMaterial(new Color(0.2f, 0.3f, 1f)), go.transform);
                light.transform.localPosition = new Vector3(0f, height + 0.42f, -length * 0.05f);
            }
            return go;
        }

        private Vector2 PointOnEdge(RoadEdge edge, float t, float laneOffset)
        {
            Vector2 a = Network.Nodes[edge.A].Pos;
            Vector2 b = Network.Nodes[edge.B].Pos;
            Vector2 dir = (b - a).normalized;
            Vector2 side = new Vector2(-dir.y, dir.x);
            return Vector2.Lerp(a, b, t) + side * (edge.Lanes * 1.8f + laneOffset);
        }

        public void Tick(float dt)
        {
            for (int i = Vehicles.Count - 1; i >= 0; i--)
            {
                TrafficVehicle vehicle = Vehicles[i];
                RoadEdge edge = Network.Edges[vehicle.Edge];
                float edgeLength = Mathf.Max(1f, edge.Length);
                float speedLimit = edge.SpeedLimit;

                float desired = speedLimit * 0.75f;
                if (kind_isPolice(vehicle)) desired = speedLimit * 0.95f;

                // Keep distance to the player bus and to the vehicle ahead.
                float playerDistance = DistanceToPlayer(vehicle);
                if (playerDistance < 18f) desired = Mathf.Min(desired, Mathf.Max(0f, (playerDistance - 6f) * 1.6f));
                if (playerDistance < 8f) desired = 0f;
                float ahead = DistanceToVehicleAhead(vehicle);
                if (ahead < 14f) desired = Mathf.Min(desired, Mathf.Max(0f, (ahead - 5f) * 1.4f));

                // Signals: stop at a red light near the end of the current edge.
                if (edge.Progress > 0.9f)
                {
                    RoadNode next = Network.Nodes[edge.B];
                    if (next.Signal == 3) desired = 0f;
                }

                vehicle.TargetSpeed = desired;
                float accel = desired > vehicle.Speed ? 3.2f : 7.5f;
                vehicle.Speed = Mathf.MoveTowards(vehicle.Speed, desired, accel * dt);
                vehicle.Progress += (vehicle.Speed * dt) / edgeLength;

                if (vehicle.Progress >= 1f)
                {
                    AdvanceToNextEdge(vehicle);
                }

                Vector2 pos = PointOnEdge(Network.Edges[vehicle.Edge], Mathf.Clamp01(vehicle.Progress), vehicle.LaneOffset);
                float yaw = Mathf.Atan2(pos.x - vehicle.X, pos.y - vehicle.Y);
                if (Mathf.Abs(yaw) > 0.001f) vehicle.Yaw = yaw;
                vehicle.X = pos.x;
                vehicle.Y = pos.y;

                if (vehicle.Model != null)
                {
                    vehicle.Model.transform.position = new Vector3(vehicle.X, 0f, vehicle.Y);
                    vehicle.Model.transform.rotation = Quaternion.Euler(0f, MathfConst.PI * 0.5f - vehicle.Yaw, 0f);
                }
            }
        }

        private static bool kind_isPolice(TrafficVehicle vehicle)
        {
            return vehicle.Kind == TrafficKind.Police;
        }

        private void AdvanceToNextEdge(TrafficVehicle vehicle)
        {
            RoadEdge current = Network.Edges[vehicle.Edge];
            int node = current.B;
            List<int> options = Network.Nodes[node].Edges;
            if (options.Count == 0)
            {
                vehicle.Progress = 0.999f;
                vehicle.Speed = 0f;
                return;
            }
            int chosen = options[_rng.Range(0, options.Count - 1)];
            if (options.Count > 1 && chosen == vehicle.Edge) chosen = options[(options.IndexOf(chosen) + 1) % options.Count];
            vehicle.Edge = chosen;
            vehicle.Progress = 0f;
            vehicle.NextEdge = -1;
        }

        private float DistanceToPlayer(TrafficVehicle vehicle)
        {
            if (Player == null) return 999f;
            float dx = Player.Physics.X - vehicle.X;
            float dy = Player.Physics.Y - vehicle.Y;
            return Mathf.Sqrt(dx * dx + dy * dy);
        }

        private float DistanceToVehicleAhead(TrafficVehicle vehicle)
        {
            float best = 999f;
            for (int i = 0; i < Vehicles.Count; i++)
            {
                TrafficVehicle other = Vehicles[i];
                if (other == vehicle) continue;
                if (other.Edge != vehicle.Edge) continue;
                float delta = other.Progress - vehicle.Progress;
                if (delta > 0f && delta < best) best = delta * Network.Edges[vehicle.Edge].Length;
            }
            return best;
        }
    }
}
