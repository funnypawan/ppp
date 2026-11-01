using System.Collections.Generic;
using UnityEngine;
using IBS.Core;
using IBS.Game;
using IBS.Vehicles;

namespace IBS.UI
{
    /// <summary>
    /// On screen HUD (speedometer, RPM, gear, fuel, minimap, GPS, mission
    /// progress, weather) plus the touch control layout (steering, pedals,
    /// indicators, horn, doors, camera, gear).
    /// </summary>
    public class HudController : MonoBehaviour
    {
        public BusEntity Bus;
        public CameraRig Rig;
        public GpsNavigator Gps;
        public PassengerSystem Passengers;
        public MapGenerator Map;
        public MissionSession Mission;
        public string WeatherLabel = "Sunny";
        public string TimeLabel = "12:00";
        public int SpeedLimit = 60;

        public bool ShowControls = true;
        public string ControlLayout = "default";

        public readonly DriveInput Controls = new DriveInput();
        private readonly Dictionary<string, bool> _buttonState = new Dictionary<string, bool>();
        private GUIStyle _panel;
        private GUIStyle _label;
        private GUIStyle _bigLabel;
        private GUIStyle _button;

        private Rect _accelRect, _brakeRect, _leftRect, _rightRect, _hornRect, _headRect, _indicatorRect, _doorRect, _cameraRect, _gearRect, _reverseRect, _handbrakeRect;

        public void Configure(BusEntity bus, CameraRig rig, GpsNavigator gps, PassengerSystem passengers, MapGenerator map)
        {
            Bus = bus;
            Rig = rig;
            Gps = gps;
            Passengers = passengers;
            Map = map;
        }

        private void BuildStyles()
        {
            if (_panel != null) return;
            _panel = new GUIStyle();
            _panel.normal.background = MakeTexture(new Color(0.05f, 0.07f, 0.1f, 0.72f));
            _panel.border = new RectOffset(6, 6, 6, 6);
            _panel.normal.texture = MakeTexture(new Color(0.05f, 0.07f, 0.1f, 0.72f));
            _panel.normal.background = MakeTexture(new Color(0.05f, 0.07f, 0.1f, 0.72f));

            _label = new GUIStyle();
            _label.fontSize = 22;
            _label.normal.textColor = Color.white;
            _label.alignment = TextAnchor.MiddleLeft;

            _bigLabel = new GUIStyle();
            _bigLabel.fontSize = 46;
            _bigLabel.normal.textColor = Color.white;
            _bigLabel.alignment = TextAnchor.MiddleCenter;

            _button = new GUIStyle();
            _button.fontSize = 24;
            _button.normal.textColor = Color.white;
            _button.normal.background = MakeTexture(new Color(0.12f, 0.16f, 0.22f, 0.65f));
            _button.hover.background = MakeTexture(new Color(0.2f, 0.28f, 0.38f, 0.75f));
            _button.active.background = MakeTexture(new Color(0.35f, 0.55f, 0.75f, 0.85f));
        }

        private static Texture2D MakeTexture(Color color)
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }

        /// <summary>Reads keyboard and touch input into a DriveInput structure.</summary>
        public void GatherInput(float dt)
        {
            Controls.Throttle = 0f;
            Controls.Brake = 0f;
            Controls.Steer = 0f;
            Controls.Handbrake = 0f;
            Controls.GearRequest = 0;
            Controls.Clutch = 0f;

            // Keyboard fallback (handy while testing in the Editor).
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) Controls.Throttle = 1f;
            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) Controls.Brake = 1f;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) Controls.Steer = -1f;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) Controls.Steer = 1f;
            if (Input.GetKey(KeyCode.Space)) Controls.Handbrake = 1f;
            if (Input.GetKey(KeyCode.E)) Controls.GearRequest = 1;
            if (Input.GetKey(KeyCode.Q)) Controls.GearRequest = -1;
            if (Input.GetKey(KeyCode.H)) Controls.Horn = true;
            if (Input.GetKey(KeyCode.L)) Controls.Headlights = true;
            if (Input.GetKey(KeyCode.C)) Controls.CameraSwitch = true;
            if (Input.GetKey(KeyCode.O)) Controls.Doors = true;
            if (Input.GetKey(KeyCode.Z)) Controls.Indicator = -1;
            if (Input.GetKey(KeyCode.X)) Controls.Indicator = 1;

            // Touch buttons
            if (TouchHeld("accel")) Controls.Throttle = 1f;
            if (TouchHeld("brake")) Controls.Brake = 1f;
            if (TouchHeld("left")) Controls.Steer = -1f;
            if (TouchHeld("right")) Controls.Steer = 1f;
            if (TouchHeld("handbrake")) Controls.Handbrake = 1f;
            if (TouchHeld("reverse")) Controls.GearRequest = -1;
            if (TouchHeld("gear")) Controls.GearRequest = 1;
            if (TouchHeld("horn")) Controls.Horn = true;
            if (TouchHeld("headlights")) Controls.Headlights = true;
            if (TouchHeld("camera")) Controls.CameraSwitch = true;
            if (TouchHeld("doors")) Controls.Doors = true;
            if (TouchHeld("indicator")) Controls.Indicator = Controls.Indicator == -1 ? 0 : -1;

            Controls.Throttle = Mathf.Clamp01(Controls.Throttle);
            Controls.Brake = Mathf.Clamp01(Controls.Brake);
            Controls.Steer = Mathf.Clamp(Controls.Steer, -1f, 1f);
        }

        private bool TouchHeld(string id)
        {
            return _buttonState.ContainsKey(id) && _buttonState[id];
        }

        /// <summary>Tracks touch presses against the on screen buttons.</summary>
        public void UpdateTouches()
        {
            _buttonState.Clear();
            int count = Input.touchCount;
            for (int i = 0; i < count; i++)
            {
                Touch touch = Input.GetTouch(i);
                Vector2 pos = touch.position;
                if (touch.phase == TouchPhase.Began || touch.phase == TouchPhase.Stationary || touch.phase == TouchPhase.Moved)
                {
                    if (_accelRect.Contains(pos)) _buttonState["accel"] = true;
                    if (_brakeRect.Contains(pos)) _buttonState["brake"] = true;
                    if (_leftRect.Contains(pos)) _buttonState["left"] = true;
                    if (_rightRect.Contains(pos)) _buttonState["right"] = true;
                    if (_hornRect.Contains(pos)) _buttonState["horn"] = true;
                    if (_headRect.Contains(pos)) _buttonState["headlights"] = true;
                    if (_indicatorRect.Contains(pos)) _buttonState["indicator"] = true;
                    if (_doorRect.Contains(pos)) _buttonState["doors"] = true;
                    if (_cameraRect.Contains(pos)) _buttonState["camera"] = true;
                    if (_gearRect.Contains(pos)) _buttonState["gear"] = true;
                    if (_reverseRect.Contains(pos)) _buttonState["reverse"] = true;
                    if (_handbrakeRect.Contains(pos)) _buttonState["handbrake"] = true;
                }
            }
        }

        private void OnGUI()
        {
            BuildStyles();
            float w = Screen.width;
            float h = Screen.height;

            if (Bus == null) return;

            // --- Dashboard --------------------------------------------------
            GUI.Box(new Rect(12, 12, 260, 132), GUIContent.none, _panel);
            GUI.Label(new Rect(24, 20, 240, 42), Mathf.Abs(Bus.Physics.Speed * 3.6f).ToString("0"), _bigLabel);
            GUI.Label(new Rect(24, 60, 240, 22), "km/h   gear " + GearLabel(), _label);
            GUI.Label(new Rect(24, 84, 240, 22), "RPM " + Mathf.RoundToInt(Bus.Physics.Rpm) + "   fuel " + Bus.Physics.Fuel.ToString("0") + "L", _label);
            GUI.Label(new Rect(24, 106, 240, 22), TimeLabel + "   " + WeatherLabel, _label);

            // --- Minimap ----------------------------------------------------
            Rect mapRect = new Rect(w - 210, 12, 198, 198);
            GUI.Box(mapRect, GUIContent.none, _panel);
            DrawMinimap(mapRect);

            // --- GPS / mission ---------------------------------------------
            GUI.Box(new Rect(w - 330, 220, 318, 74), GUIContent.none, _panel);
            string gpsText = Gps != null ? Gps.CurrentInstruction(new Vector2(Bus.Physics.X, Bus.Physics.Y), Gps.DistanceToDestination(new Vector2(Bus.Physics.X, Bus.Physics.Y))) : "No GPS";
            GUI.Label(new Rect(w - 318, 228, 300, 26), gpsText, _label);
            if (Gps != null && Gps.HasDestination)
            {
                GUI.Label(new Rect(w - 318, 254, 300, 26), "Destination " + Gps.DistanceToDestination(new Vector2(Bus.Physics.X, Bus.Physics.Y)).ToString("0") + " m", _label);
            }
            if (Passengers != null)
            {
                GUI.Label(new Rect(w - 318, 272, 300, 26), "Passengers " + Passengers.SeatedCount + "   wait " + Passengers.Waiting.Count, _label);
            }

            if (Mission != null)
            {
                GUI.Box(new Rect(12, 156, 300, 76), GUIContent.none, _panel);
                GUI.Label(new Rect(24, 162, 280, 26), Mission.Mission.Title, _label);
                GUI.Label(new Rect(24, 188, 280, 26), "Delivered " + Mission.PassengersDelivered + "   time " + Mission.TimeRemaining.ToString("0") + "s", _label);
            }

            // --- Touch controls ---------------------------------------------
            if (!ShowControls) return;
            float btn = 96f;
            float margin = 18f;
            _accelRect = new Rect(w - margin - btn, h - margin - btn, btn, btn);
            _brakeRect = new Rect(w - margin - btn * 2 - 12f, h - margin - btn, btn, btn);
            _leftRect = new Rect(margin, h - margin - btn, btn, btn);
            _rightRect = new Rect(margin + btn + 12f, h - margin - btn, btn, btn);

            _hornRect = new Rect(margin, h - margin - btn * 2 - 12f, btn * 0.8f, 54f);
            _headRect = new Rect(margin + btn * 0.8f + 8f, h - margin - btn * 2 - 12f, btn * 0.8f, 54f);
            _indicatorRect = new Rect(margin + btn * 1.6f + 16f, h - margin - btn * 2 - 12f, btn * 0.8f, 54f);
            _doorRect = new Rect(margin, h - margin - btn * 3 - 24f, btn * 0.8f, 54f);
            _cameraRect = new Rect(margin + btn * 0.8f + 8f, h - margin - btn * 3 - 24f, btn * 0.8f, 54f);
            _gearRect = new Rect(w - margin - btn * 0.8f, h - margin - btn * 2 - 12f, btn * 0.8f, 54f);
            _reverseRect = new Rect(w - margin - btn * 1.6f - 8f, h - margin - btn * 2 - 12f, btn * 0.8f, 54f);
            _handbrakeRect = new Rect(w - margin - btn * 2.4f - 16f, h - margin - btn * 2 - 12f, btn * 0.8f, 54f);

            DrawControl(_accelRect, "GAS");
            DrawControl(_brakeRect, "BRAKE");
            DrawControl(_leftRect, "<");
            DrawControl(_rightRect, ">");
            DrawControl(_hornRect, "HORN");
            DrawControl(_headRect, "LIGHT");
            DrawControl(_indicatorRect, "SIGNAL");
            DrawControl(_doorRect, "DOOR");
            DrawControl(_cameraRect, "CAM");
            DrawControl(_gearRect, "D/N");
            DrawControl(_reverseRect, "REV");
            DrawControl(_handbrakeRect, "H-BRK");
        }

        private void DrawControl(Rect rect, string caption)
        {
            bool active = _buttonState.ContainsValue(true);
            GUI.Box(rect, caption, _button);
        }

        private void DrawMinimap(Rect rect)
        {
            if (Map == null || Map.Network == null) return;
            RoadNetwork network = Map.Network;
            float scale = Mathf.Min(rect.width, rect.height) / (Map.Map.Size * 1.1f);
            Vector2 centre = new Vector2(rect.x + rect.width * 0.5f, rect.y + rect.height * 0.5f);

            for (int i = 0; i < network.Edges.Count; i++)
            {
                Vector2 a = network.Nodes[network.Edges[i].A].Pos;
                Vector2 b = network.Nodes[network.Edges[i].B].Pos;
                Vector2 pa = centre + new Vector2(a.x, a.y) * scale;
                Vector2 pb = centre + new Vector2(b.x, b.y) * scale;
                GUI.DrawTexture(new Rect(pa.x, pa.y, Mathf.Max(1f, pb.x - pa.x), Mathf.Max(1f, pb.y - pa.y)), MakeTexture(new Color(0.6f, 0.6f, 0.62f, 0.85f)));
            }

            if (Passengers != null)
            {
                for (int i = 0; i < Map.Stops.Count; i++)
                {
                    Vector2 p = centre + Map.Stops[i].Pos * scale;
                    GUI.DrawTexture(new Rect(p.x - 2f, p.y - 2f, 4f, 4f), MakeTexture(new Color(0.2f, 0.85f, 0.4f)));
                }
            }

            Vector2 busPos = centre + new Vector2(Bus.Physics.X, Bus.Physics.Y) * scale;
            GUI.DrawTexture(new Rect(busPos.x - 4f, busPos.y - 4f, 8f, 8f), MakeTexture(new Color(1f, 0.4f, 0.2f)));
        }

        private string GearLabel()
        {
            if (Bus.Physics.Reverse) return "R";
            if (Bus.Physics.Speed < 0.3f && Bus.Physics.Throttle < 0.05f) return "N";
            return "D";
        }
    }
}
