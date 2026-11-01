using System.Collections.Generic;
using UnityEngine;
using IBS.Core;
using IBS.World;

namespace IBS.Game
{
    /// <summary>
    /// Computes a route on the road network and produces the next turn
    /// instruction plus the distance to the destination.
    /// </summary>
    public class GpsNavigator : MonoBehaviour
    {
        public RoadNetwork Network;
        public Vector2 Destination;
        public bool HasDestination;

        private List<int> _path = new List<int>();
        private int _pathIndex;
        private Rng _rng = new Rng(555);

        public void Initialise(RoadNetwork network)
        {
            Network = network;
        }

        public void SetDestination(Vector2 destination)
        {
            Destination = destination;
            HasDestination = true;
            _path.Clear();
            _pathIndex = 0;
        }

        public void ClearDestination()
        {
            HasDestination = false;
            _path.Clear();
        }

        /// <summary>Recomputes the route when the bus has moved far enough.</summary>
        public void RefreshRoute(Vector2 position)
        {
            if (!HasDestination || Network == null || Network.Nodes.Count == 0) return;
            int from = Network.NearestNode(position);
            int to = Network.NearestNode(Destination);
            List<int> path = Network.FindPath(from, to);
            if (path != null && path.Count > 0)
            {
                _path = path;
                _pathIndex = 0;
            }
        }

        /// <summary>Human readable instruction for the HUD.</summary>
        public string CurrentInstruction(Vector2 position, float distanceToTarget)
        {
            if (!HasDestination) return "No destination set";
            if (distanceToTarget < 25f) return "Arrive at destination";
            if (_path.Count == 0) return "Calculating route...";
            if (_pathIndex >= _path.Count - 1) return "Continue straight";

            int current = _path[_pathIndex];
            int next = _path[_pathIndex + 1];
            Vector2 a = Network.Nodes[current].Pos;
            Vector2 b = Network.Nodes[next].Pos;
            float bearing = Mathf.Atan2(b.x - a.x, b.y - a.y) * MathfConst.Rad2Deg;

            // Compare with the direction towards the next node.
            Vector2 dir = (b - a).normalized;
            Vector2 toNext = (b - position).normalized;
            float cross = dir.x * toNext.y - dir.y * toNext.x;
            if (cross > 0.35f) return "Turn right ahead";
            if (cross < -0.35f) return "Turn left ahead";
            return "Continue on " + Network.Edges.Count + " node route";
        }

        /// <summary>Advances the route pointer once the bus reaches a node.</summary>
        public void Tick(Vector2 position)
        {
            if (!HasDestination || _path.Count == 0) return;
            int current = _path[_pathIndex];
            if (Vector2.Distance(position, Network.Nodes[current].Pos) < 14f && _pathIndex < _path.Count - 1)
            {
                _pathIndex++;
            }
        }

        public float DistanceToDestination(Vector2 position)
        {
            if (!HasDestination) return 0f;
            return Vector2.Distance(position, Destination);
        }

        /// <summary>Nearest passenger stop to a position (used for quick travel).</summary>
        public BusStop NearestStop(MapGenerator map, Vector2 position)
        {
            if (map == null || map.Stops.Count == 0) return null;
            BusStop best = map.Stops[0];
            float bestDistance = float.MaxValue;
            for (int i = 0; i < map.Stops.Count; i++)
            {
                float d = Vector2.Distance(map.Stops[i].Pos, position);
                if (d < bestDistance)
                {
                    bestDistance = d;
                    best = map.Stops[i];
                }
            }
            return best;
        }
    }
}
