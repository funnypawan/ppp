using System.Collections.Generic;
using UnityEngine;
using IBS.Vehicles;
using IBS.Core;
using IBS.World;

namespace IBS.Game
{
    public class Passenger
    {
        public Vector2 From;
        public Vector2 To;
        public float Satisfaction = 0.8f;
        public bool Seated;
        public float DistanceTravelled;
        public float TotalDistance;
        public float WaitTime;
        public string Destination = "";
    }

    /// <summary>
    /// Passenger spawning, boarding, seating, drop off and satisfaction.
    /// </summary>
    public class PassengerSystem : MonoBehaviour
    {
        public MapGenerator Map;
        public BusEntity Bus;
        public int MaxPassengers = 40;

        public readonly List<Passenger> Waiting = new List<Passenger>();
        public readonly List<Passenger> Onboard = new List<Passenger>();
        public readonly List<Passenger> Delivered = new List<Passenger>();

        private MathUtil.Rng _rng = new MathUtil.Rng(9182);
        private float _spawnTimer;

        public void Initialise(MapGenerator map, BusEntity bus)
        {
            Map = map;
            Bus = bus;
            _rng = new MathUtil.Rng(9182);
            for (int i = 0; i < 12; i++) SpawnWaiting();
        }

        public void SpawnWaiting()
        {
            if (Map == null || Map.Stops.Count == 0) return;
            BusStop stop = Map.Stops[_rng.Range(0, Map.Stops.Count - 1)];
            BusStop dest = Map.Stops[_rng.Range(0, Map.Stops.Count - 1)];
            while (dest == stop && Map.Stops.Count > 1) dest = Map.Stops[_rng.Range(0, Map.Stops.Count - 1)];

            Passenger passenger = new Passenger
            {
                From = stop.Pos,
                To = dest.Pos,
                Destination = dest.Name,
                TotalDistance = Vector2.Distance(stop.Pos, dest.Pos),
                Satisfaction = _rng.Range(0.75f, 1f)
            };
            Waiting.Add(passenger);
        }

        public void Tick(float dt)
        {
            _spawnTimer += dt;
            if (_spawnTimer > 6f)
            {
                _spawnTimer = 0f;
                if (Waiting.Count < 18) SpawnWaiting();
            }

            // Boarding: passengers board when the doors are open and the bus is
            // stopped close to their stop.
            if (Bus != null && Bus.DoorsOpen && Bus.Physics.Speed < 1.2f && Map != null)
            {
                for (int i = Waiting.Count - 1; i >= 0; i--)
                {
                    Passenger passenger = Waiting[i];
                    if (Vector2.Distance(passenger.From, new Vector2(Bus.Physics.X, Bus.Physics.Y)) > 7f) continue;
                    if (Onboard.Count >= Bus.Spec.Capacity) break;
                    Waiting.RemoveAt(i);
                    passenger.Seated = true;
                    Onboard.Add(passenger);
                }
            }

            // Satisfaction: drops off when reaching the destination.
            for (int i = Onboard.Count - 1; i >= 0; i--)
            {
                Passenger passenger = Onboard[i];
                passenger.DistanceTravelled += Bus.Physics.Speed * dt;
                if (Vector2.Distance(passenger.To, new Vector2(Bus.Physics.X, Bus.Physics.Y)) < 7f)
                {
                    Onboard.RemoveAt(i);
                    Delivered.Add(passenger);
                    if (Delivered.Count > 40) Delivered.RemoveAt(0);
                }
            }
        }

        /// <summary>Average satisfaction of the passengers currently on board.</summary>
        public float AverageSatisfaction
        {
            get
            {
                if (Onboard.Count == 0) return 1f;
                float sum = 0f;
                for (int i = 0; i < Onboard.Count; i++) sum += Onboard[i].Satisfaction;
                return sum / Onboard.Count;
            }
        }

        public int SeatedCount
        {
            get { return Onboard.Count; }
        }

        public int Occupancy
        {
            get
            {
                int seated = 0;
                for (int i = 0; i < Onboard.Count; i++) if (Onboard[i].Seated) seated++;
                return seated;
            }
        }

        public void Clear()
        {
            Waiting.Clear();
            Onboard.Clear();
            Delivered.Clear();
        }
    }
}
