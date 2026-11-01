using System.Collections.Generic;
using UnityEngine;
using IBS.Core;
using IBS.Game;
using IBS.UI;
using IBS.Vehicles;
using IBS.World;

namespace IBS.Game
{
    public enum GameScreen { Menu, Career, FreeDrive, Garage, Customization, MapSelect, DailyRewards, Achievements, Settings, Playing, Paused, MissionResult }

    /// <summary>
    /// Central game manager: boots the save file, builds the menu showcase,
    /// starts driving sessions (career or free drive) and runs the main loop
    /// for physics, traffic, passengers, missions, economy and audio.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance;

        public GameScreen Screen = GameScreen.Menu;
        public GameScreen PreviousScreen = GameScreen.Menu;

        public SaveData Save;
        public MapDefinition SelectedMap;
        public BusSpec SelectedBus;
        public BusCustomization ActiveCustomization;

        public BusEntity PlayerBus;
        public RoadNetwork Network;
        public MapGenerator MapGenerator;
        public TrafficSystem Traffic;
        public PassengerSystem Passengers;
        public GpsNavigator Gps;
        public EnvironmentController Environment;
        public CameraRig Rig;
        public HudController Hud;
        public MenuController Menu;

        public MissionSession Mission;
        public bool FreeDrive = true;
        public float SessionTime;

        private Camera _camera;
        private GameObject _showcaseRoot;
        private BusModel _showcaseBus;
        private float _showcaseAngle;
        private AudioSource _audio;
        private float _fuelTimer;
        private float _speedLimitTimer;
        private float _hudUpdateTimer;
        private int _lastGear = 0;

        private void Awake()
        {
            Instance = this;
            SaveSystem.Load();
            Save = SaveSystem.Data;
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            _camera = Camera.main;
            if (_camera == null)
            {
                GameObject camGo = new GameObject("MainCamera");
                camGo.tag = "MainCamera";
                _camera = camGo.AddComponent<Camera>();
                camGo.AddComponent<AudioListener>();
            }
            _camera.backgroundColor = new Color(0.62f, 0.78f, 0.91f);

            GameObject uiRoot = new GameObject("UI");
            uiRoot.transform.SetParent(transform, false);
            Menu = uiRoot.AddComponent<MenuController>();
            Menu.Manager = this;
            Hud = uiRoot.AddComponent<HudController>();

            GameObject rigGo = new GameObject("CameraRig");
            rigGo.transform.SetParent(transform, false);
            Rig = rigGo.AddComponent<CameraRig>();
            Rig.Initialise(_camera);

            GameObject audioGo = new GameObject("EngineAudio");
            audioGo.transform.SetParent(transform, false);
            _audio = audioGo.AddComponent<AudioSource>();
            _audio.loop = true;
            _audio.playOnAwake = false;
            _audio.clip = AudioFactory.EngineLoop();

            SelectedMap = MapCatalog.Get(Save.SelectedMap);
            SelectedBus = BusCatalog.Get(Save.SelectedBus);
            BuildShowcase();
            Menu.Refresh();
        }

        // ------------------------------------------------------------------
        // Menu showcase
        // ------------------------------------------------------------------
        private void BuildShowcase()
        {
            if (_showcaseRoot != null) Object.Destroy(_showcaseRoot);
            _showcaseRoot = new GameObject("Showcase");
            BusCustomization custom = SaveSystem.GetCustomization(SelectedBus.Id);
            _showcaseBus = new BusModel(SelectedBus, custom);
            _showcaseBus.Root.transform.SetParent(_showcaseRoot.transform, false);
            _showcaseBus.Root.transform.position = new Vector3(0f, 0f, 0f);
            _showcaseBus.Root.transform.rotation = Quaternion.Euler(0f, MathfConst.PI * 0.5f, 0f);
            _showcaseBus.SetHeadlights(true);

            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "ShowcaseGround";
            ground.transform.SetParent(_showcaseRoot.transform, false);
            ground.transform.localScale = new Vector3(0.6f, 1f, 0.6f);
            Object.Destroy(ground.GetComponent<Collider>());
            ground.GetComponent<MeshRenderer>().sharedMaterial = ProceduralMeshMaterial(new Color(0.16f, 0.18f, 0.21f));

            GameObject key = new GameObject("KeyLight");
            key.transform.SetParent(_showcaseRoot.transform, false);
            Light light = key.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.4f;
            light.color = new Color(1f, 0.95f, 0.85f);
            key.transform.rotation = Quaternion.Euler(35f, 140f, 0f);
        }

        private static Material ProceduralMeshMaterial(Color color)
        {
            return IBS.Util.ProceduralMesh.Material(color);
        }

        public void RefreshShowcase()
        {
            BuildShowcase();
        }

        // ------------------------------------------------------------------
        // Session lifecycle
        // ------------------------------------------------------------------
        public void StartFreeDrive()
        {
            FreeDrive = true;
            Mission = null;
            StartSession(SelectedMap, SelectedBus);
        }

        public void StartMission(MissionDefinition mission)
        {
            FreeDrive = false;
            Mission = new MissionSession(mission);
            MapDefinition map = MapCatalog.Get(mission.Map);
            BusSpec bus = BusCatalog.Get(mission.Bus);
            StartSession(map, bus);
        }

        private void StartSession(MapDefinition map, BusSpec bus)
        {
            SelectedMap = map;
            SelectedBus = bus;
            Save.SelectedMap = map.Id;
            Save.SelectedBus = bus.Id;
            SaveSystem.Save();

            SessionTime = 0f;
            _fuelTimer = 0f;
            _speedLimitTimer = 0f;

            // Environment ----------------------------------------------------
            if (Environment == null)
            {
                GameObject envGo = new GameObject("Environment");
                envGo.transform.SetParent(transform, false);
                Environment = envGo.AddComponent<EnvironmentController>();
            }
            Environment.Initialise(map, map.DefaultWeather, map.DefaultTime);

            // Map --------------------------------------------------------------
            Network = new RoadNetwork();
            Network.Build(map, 20240 + map.Id.Length);
            if (MapGenerator == null)
            {
                GameObject mapGo = new GameObject("MapGenerator");
                mapGo.transform.SetParent(transform, false);
                MapGenerator = mapGo.AddComponent<MapGenerator>();
            }
            MapGenerator.Generate(Network, map, 20240 + map.Id.Length);

            // Bus --------------------------------------------------------------
            if (PlayerBus != null) Object.Destroy(PlayerBus.gameObject);
            GameObject busGo = new GameObject("PlayerBus");
            busGo.transform.SetParent(transform, false);
            PlayerBus = busGo.AddComponent<BusEntity>();
            BusCustomization custom = SaveSystem.GetCustomization(bus.Id);
            ActiveCustomization = custom;
            Vector2 spawn = Network.Nodes.Count > 0 ? Network.Nodes[0].Pos : Vector2.zero;
            PlayerBus.Initialise(bus, custom, spawn.x, spawn.y, 0f);
            PlayerBus.SetHeadlights(map.DefaultTime < 6.5f || map.DefaultTime > 17.5f);
            PlayerBus.transform.position = new Vector3(spawn.x, 0f, spawn.y);

            // Traffic ------------------------------------------------------------
            if (Traffic == null)
            {
                GameObject trafficGo = new GameObject("TrafficSystem");
                trafficGo.transform.SetParent(transform, false);
                Traffic = trafficGo.AddComponent<TrafficSystem>();
            }
            Traffic.Initialise(Network, map.TrafficDensity, PlayerBus);

            // Passengers + GPS ----------------------------------------------------
            GameObject paxGo = GameObject.Find("PassengerSystem");
            if (paxGo == null)
            {
                paxGo = new GameObject("PassengerSystem");
                paxGo.transform.SetParent(transform, false);
                Passengers = paxGo.AddComponent<PassengerSystem>();
            }
            else
            {
                Passengers = paxGo.GetComponent<PassengerSystem>();
            }
            Passengers.Initialise(MapGenerator, PlayerBus);

            if (Gps == null)
            {
                GameObject gpsGo = new GameObject("GpsNavigator");
                gpsGo.transform.SetParent(transform, false);
                Gps = gpsGo.AddComponent<GpsNavigator>();
            }
            Gps.Initialise(Network);
            if (MapGenerator.Stops.Count > 0)
            {
                Gps.SetDestination(MapGenerator.Stops[MapGenerator.Stops.Count - 1].Pos);
                Gps.RefreshRoute(spawn);
            }

            // HUD ------------------------------------------------------------------
            Hud.Configure(PlayerBus, Rig, Gps, Passengers, MapGenerator);
            Hud.ShowControls = true;
            Rig.SetMode(CameraMode.Chase);

            Screen = GameScreen.Playing;
            Menu.Refresh();
        }

        public void EndSession(string reason)
        {
            if (Screen == GameScreen.Playing) Save.Stats.Trips++;
            SaveSystem.Save();
            Screen = GameScreen.MissionResult;
            Menu.LastResult = reason;
            Menu.Refresh();
        }

        public void ReturnToMenu()
        {
            Screen = GameScreen.Menu;
            Menu.Refresh();
        }

        public void Navigate(GameScreen target)
        {
            PreviousScreen = Screen;
            Screen = target;
            Menu.Refresh();
        }

        // ------------------------------------------------------------------
        // Main loop
        // ------------------------------------------------------------------
        private void Update()
        {
            float dt = Mathf.Min(Time.deltaTime, 0.05f);

            if (Screen == GameScreen.Menu || Screen == GameScreen.Garage || Screen == GameScreen.Customization)
            {
                _showcaseAngle += dt * 12f;
                if (_showcaseBus != null)
                {
                    _showcaseBus.Root.transform.rotation = Quaternion.Euler(0f, MathfConst.PI * 0.5f + _showcaseAngle, 0f);
                }
            }

            if (Screen != GameScreen.Playing) return;

            SessionTime += dt;
            Save.Stats.PlayTimeSec += dt;

            Hud.UpdateTouches();
            Hud.GatherInput(dt);

            DriveInput input = Hud.Controls;
            PlayerBus.SetInputs(input);

            if (input.CameraSwitch) Rig.CycleMode();
            if (input.Doors) PlayerBus.DoorsOpen = !PlayerBus.DoorsOpen;
            if (input.Headlights) PlayerBus.SetHeadlights(!PlayerBus.HeadlightsOn);
            if (input.Indicator != 0) PlayerBus.Indicator = input.Indicator;

            DriveEnvironment env = new DriveEnvironment
            {
                Grip = Environment.GripMultiplier,
                WindFactor = Mathf.Clamp01(PlayerBus.Physics.Speed / 40f)
            };

            WorldCollider[] colliders = MapGenerator.Colliders.ToArray();
            VehicleTelemetry tele = PlayerBus.Step(dt, env, colliders);
            PlayerBus.TickVisuals(dt);

            if (tele.Shifting) PlayShiftSound();
            UpdateEngineAudio(tele);

            Traffic.Tick(dt);
            Passengers.Tick(dt);
            Environment.UpdateEnvironment(dt);
            Gps.Tick(new Vector2(PlayerBus.Physics.X, PlayerBus.Physics.Y));
            Rig.UpdateCamera(dt, PlayerBus);

            UpdateFuelAndFines(dt, tele);
            UpdateMission(dt, tele);

            _hudUpdateTimer += dt;
            if (_hudUpdateTimer > 0.15f)
            {
                _hudUpdateTimer = 0f;
                Hud.WeatherLabel = Environment.Weather.Name;
                Hud.TimeLabel = string.Format("{0:00}:{1:00}", Mathf.FloorToInt(Environment.Hour), Mathf.FloorToInt((Environment.Hour % 1f) * 60f));
            }
        }

        private void UpdateFuelAndFines(float dt, VehicleTelemetry tele)
        {
            _fuelTimer += dt;
            if (_fuelTimer > 2f)
            {
                _fuelTimer = 0f;
                if (PlayerBus.Physics.Fuel <= 0.05f)
                {
                    // Out of fuel: the bus rolls to a stop.
                    PlayerBus.Physics.Fuel = 0f;
                }
            }

            _speedLimitTimer += dt;
            if (_speedLimitTimer > 1.5f)
            {
                _speedLimitTimer = 0f;
                float limit = SpeedLimitHere();
                float speed = Mathf.Abs(PlayerBus.Physics.Speed * 3.6f);
                if (speed > limit + 5f)
                {
                    int fine = Economy.SpeedFine(limit, speed);
                    if (fine > 0)
                    {
                        SaveSystem.AddMoney(-fine);
                        if (Mission != null) Mission.OnSpeedViolation();
                    }
                }
            }
        }

        private float SpeedLimitHere()
        {
            if (Network == null || Network.Edges.Count == 0) return 60f;
            Vector2 pos = new Vector2(PlayerBus.Physics.X, PlayerBus.Physics.Y);
            int node = Network.NearestNode(pos);
            float limit = 40f;
            foreach (int edgeIndex in Network.Nodes[node].Edges)
            {
                limit = Mathf.Max(limit, Network.Edges[edgeIndex].SpeedLimit);
            }
            return limit;
        }

        private void UpdateMission(float dt, VehicleTelemetry tele)
        {
            if (Mission == null) return;
            float distance = Mathf.Abs(PlayerBus.Physics.Speed) * dt / 1000f;
            Mission.DistanceKm += distance;
            Mission.OnCollision(0f);

            // Passenger drop off hook-up.
            int delivered = Passengers.Delivered.Count;
            if (delivered > Mission.PassengersDelivered)
            {
                for (int i = Mission.PassengersDelivered; i < delivered; i++)
                {
                    Mission.OnPassengerDropped(Passengers.Delivered[i].Satisfaction);
                }
            }

            string status = Mission.Update(dt, PlayerBus.Physics.Damage);
            if (status == "complete")
            {
                SaveSystem.AddMoney(Mission.Reward);
                if (!Save.CompletedMissions.Contains(Mission.Mission.Id)) Save.CompletedMissions.Add(Mission.Mission.Id);
                Save.Stats.PassengersDelivered += Mission.PassengersDelivered;
                SaveSystem.Save();
                EndSession("Mission complete! +" + Mission.Reward);
            }
            else if (status == "failed")
            {
                EndSession("Mission failed: " + Mission.FailReason);
            }
        }

        private void UpdateEngineAudio(VehicleTelemetry tele)
        {
            if (_audio == null) return;
            if (!_audio.isPlaying) _audio.Play();
            _audio.pitch = Mathf.Clamp(0.6f + tele.Rpm / 2600f, 0.6f, 2.1f);
            _audio.volume = Mathf.Clamp01(0.12f + tele.Rpm / 4200f);
        }

        private void PlayShiftSound()
        {
            if (_audio == null) return;
        }

        // ------------------------------------------------------------------
        // Economy helpers used by the UI
        // ------------------------------------------------------------------
        public bool BuyBus(string busId)
        {
            BusSpec spec = BusCatalog.Get(busId);
            if (Save.IsBusUnlocked(busId)) return true;
            if (!SaveSystem.SpendMoney(spec.Price)) return false;
            SaveSystem.UnlockBus(busId);
            SaveSystem.Save();
            return true;
        }

        public bool BuyMap(string mapId)
        {
            MapDefinition map = MapCatalog.Get(mapId);
            if (Save.IsMapUnlocked(mapId)) return true;
            if (!SaveSystem.SpendMoney(map.Price)) return false;
            SaveSystem.UnlockMap(mapId);
            SaveSystem.Save();
            return true;
        }

        public bool ApplyCustomization(string busId, BusCustomization custom)
        {
            SaveSystem.SetCustomization(busId, custom);
            if (PlayerBus != null && SelectedBus != null && PlayerBus.Spec.Id == busId)
            {
                ActiveCustomization = custom;
                RefreshShowcase();
            }
            return true;
        }
    }
}
