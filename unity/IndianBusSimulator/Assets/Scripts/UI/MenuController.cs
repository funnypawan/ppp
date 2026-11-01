using System.Collections.Generic;
using UnityEngine;
using IBS.Core;

namespace IBS.UI
{
    /// <summary>
    /// Main menu and all sub screens (career, free drive, garage, customisation,
    /// map selection, daily rewards, achievements, settings) drawn with IMGUI
    /// so the project needs no canvas prefabs.
    /// </summary>
    public class MenuController : MonoBehaviour
    {
        public GameManager Manager;
        public string LastResult = "";
        public string Notice = "";

        private GUIStyle _title;
        private GUIStyle _header;
        private GUIStyle _body;
        private GUIStyle _button;
        private GUIStyle _card;
        private GUIStyle _small;

        // Customisation editing state
        private readonly List<string> _paintOptions = new List<string> { "solid", "two_tone", "stripe", "gradient" };
        private readonly List<string> _bodyColors = new List<string> { "#e04a2f", "#1f3b73", "#f2a33c", "#f2c500", "#2aa3a1", "#6b2fa0", "#0f2a4a", "#c0392b" };
        private readonly List<string> _interiorOptions = new List<string> { "beige", "grey", "maroon", "blue" };
        private readonly List<string> _seatOptions = new List<string> { "standard", "premium", "sleeper_berth", "school_bench" };
        private readonly List<string> _wheelOptions = new List<string> { "standard", "wide", "alloy" };
        private readonly List<string> _rimOptions = new List<string> { "steel", "chrome", "black" };
        private readonly List<string> _headlightOptions = new List<string> { "halogen", "led", "projector" };
        private readonly List<string> _hornOptions = new List<string> { "air", "musical", "deep" };
        private readonly List<string> _stickerOptions = new List<string> { "none", "tiger", "trishul", "lotus", "mountain" };
        private int _categoryIndex;
        private int _page;
        private string _sticker = "none";

        private void BuildStyles()
        {
            if (_title != null) return;
            _title = new GUIStyle();
            _title.fontSize = 54;
            _title.normal.textColor = new Color(1f, 0.86f, 0.35f);
            _title.alignment = TextAnchor.MiddleCenter;
            _title.fontStyle = FontStyle.Bold;

            _header = new GUIStyle();
            _header.fontSize = 30;
            _header.normal.textColor = Color.white;
            _header.alignment = TextAnchor.MiddleLeft;
            _header.fontStyle = FontStyle.Bold;

            _body = new GUIStyle();
            _body.fontSize = 22;
            _body.normal.textColor = new Color(0.92f, 0.94f, 0.96f);

            _small = new GUIStyle();
            _small.fontSize = 18;
            _small.normal.textColor = new Color(0.78f, 0.82f, 0.86f);

            _button = new GUIStyle();
            _button.fontSize = 26;
            _button.normal.textColor = Color.white;
            _button.normal.background = Texture(new Color(0.11f, 0.19f, 0.29f, 0.92f));
            _button.hover.background = Texture(new Color(0.18f, 0.32f, 0.46f, 0.95f));
            _button.active.background = Texture(new Color(0.26f, 0.48f, 0.68f, 1f));

            _card = new GUIStyle();
            _card.normal.background = Texture(new Color(0.04f, 0.07f, 0.11f, 0.72f));
        }

        private static Texture2D Texture(Color color)
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }

        public void Refresh()
        {
            // Hook for future refresh logic (unlock notifications etc.).
        }

        private void OnGUI()
        {
            BuildStyles();
            if (Manager == null) return;

            float w = Screen.width;
            float h = Screen.height;

            switch (Manager.Screen)
            {
                case GameScreen.Menu: DrawMainMenu(w, h); break;
                case GameScreen.Career: DrawCareer(w, h); break;
                case GameScreen.FreeDrive: DrawFreeDrive(w, h); break;
                case GameScreen.Garage: DrawGarage(w, h); break;
                case GameScreen.Customization: DrawCustomization(w, h); break;
                case GameScreen.MapSelect: DrawMapSelect(w, h); break;
                case GameScreen.DailyRewards: DrawDailyRewards(w, h); break;
                case GameScreen.Achievements: DrawAchievements(w, h); break;
                case GameScreen.Settings: DrawSettings(w, h); break;
                case GameScreen.MissionResult: DrawResult(w, h); break;
                default: break;
            }
        }

        // ------------------------------------------------------------------
        private void DrawMainMenu(float w, float h)
        {
            GUI.Label(new Rect(0, 24, w, 70), "INDIAN BUS SIMULATOR 3D", _title);
            GUI.Label(new Rect(0, 92, w, 34), "Drive. Serve. Earn.", _small);

            float bw = 320f;
            float bh = 62f;
            float x = w * 0.5f - bw * 0.5f;
            float y = 150f;

            if (GUI.Button(new Rect(x, y, bw, bh), "PLAY", _button)) Manager.StartMission(MissionCatalog.All[0]);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "CAREER MODE", _button)) Manager.Navigate(GameScreen.Career);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "FREE DRIVE", _button)) Manager.Navigate(GameScreen.FreeDrive);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "BUS GARAGE", _button)) Manager.Navigate(GameScreen.Garage);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "CUSTOMISATION", _button)) Manager.Navigate(GameScreen.Customization);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "MAP SELECTION", _button)) Manager.Navigate(GameScreen.MapSelect);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "DAILY REWARDS", _button)) Manager.Navigate(GameScreen.DailyRewards);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "ACHIEVEMENTS", _button)) Manager.Navigate(GameScreen.Achievements);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "SETTINGS", _button)) Manager.Navigate(GameScreen.Settings);
            y += bh + 10f;
            if (GUI.Button(new Rect(x, y, bw, bh), "EXIT", _button)) Application.Quit();

            GUI.Label(new Rect(16, h - 40, 700, 30),
                "Money " + Manager.Save.Money + "   |   " + Manager.Save.SelectedBus + "   |   " + Manager.Save.SelectedMap, _small);
        }

        private void DrawBackButton(float w)
        {
            if (GUI.Button(new Rect(16, 16, 160, 46), "< BACK", _button)) Manager.ReturnToMenu();
        }

        private void DrawCareer(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "CAREER MODE", _header);
            float y = 90f;

            for (int i = 0; i < MissionCatalog.Categories.Length; i++)
            {
                if (GUI.Button(new Rect(200, y, 220, 40), MissionCatalog.CategoryNames[i], _button))
                {
                    _categoryIndex = i;
                    _page = 0;
                }
                y += 46f;
            }

            float listX = 460f;
            y = 90f;
            int shown = 0;
            foreach (MissionDefinition mission in MissionCatalog.All)
            {
                if (mission.Category != MissionCatalog.Categories[_categoryIndex]) continue;
                if (shown < _page * 6) { shown++; continue; }
                if (shown >= _page * 6 + 6) { shown++; continue; }
                GUI.Box(new Rect(listX, y, 520, 84), GUIContent.none, _card);
                GUI.Label(new Rect(listX + 12, y + 6, 500, 28), mission.Title + "  (reward " + mission.Reward + ")", _body);
                GUI.Label(new Rect(listX + 12, y + 32, 500, 46), mission.Description, _small);
                bool done = Manager.Save.CompletedMissions.Contains(mission.Id);
                if (GUI.Button(new Rect(listX + 400, y + 44, 108, 34), done ? "REPLAY" : "START", _button))
                {
                    Manager.StartMission(mission);
                    return;
                }
                y += 90f;
                shown++;
            }

            if (GUI.Button(new Rect(listX, h - 70, 120, 44), "PREV", _button)) _page = Mathf.Max(0, _page - 1);
            if (GUI.Button(new Rect(listX + 130, h - 70, 120, 44), "NEXT", _button)) _page++;
        }

        private void DrawFreeDrive(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "FREE DRIVE", _header);
            GUI.Label(new Rect(200, 80, 500, 30), "Bus: " + Manager.Save.SelectedBus + "    Map: " + Manager.Save.SelectedMap, _body);

            int busIndex = BusCatalog.All.FindIndex(b => b.Id == Manager.Save.SelectedBus);
            int mapIndex = MapCatalog.All.FindIndex(m => m.Id == Manager.Save.SelectedMap);
            if (busIndex < 0) busIndex = 0;
            if (mapIndex < 0) mapIndex = 0;

            GUI.Label(new Rect(200, 130, 300, 30), "Bus", _header);
            for (int i = 0; i < BusCatalog.All.Count && i < 4; i++)
            {
                BusSpec spec = BusCatalog.All[i];
                bool unlocked = Manager.Save.IsBusUnlocked(spec.Id);
                string caption = spec.Name + (unlocked ? "" : "  ₹" + spec.Price);
                if (GUI.Button(new Rect(200, 170 + i * 54, 330, 46), caption, _button))
                {
                    if (unlocked)
                    {
                        Manager.Save.SelectedBus = spec.Id;
                        SaveSystem.Save();
                        Manager.RefreshShowcase();
                    }
                    else if (Manager.BuyBus(spec.Id))
                    {
                        Manager.Save.SelectedBus = spec.Id;
                        SaveSystem.Save();
                        Manager.RefreshShowcase();
                    }
                    else Notice = "Not enough money for " + spec.Name;
                }
            }

            GUI.Label(new Rect(600, 130, 300, 30), "Map", _header);
            for (int i = 0; i < MapCatalog.All.Count && i < 4; i++)
            {
                MapDefinition map = MapCatalog.All[i];
                bool unlocked = Manager.Save.IsMapUnlocked(map.Id);
                string caption = map.Name + (unlocked ? "" : "  ₹" + map.Price);
                if (GUI.Button(new Rect(600, 170 + i * 54, 330, 46), caption, _button))
                {
                    if (unlocked)
                    {
                        Manager.Save.SelectedMap = map.Id;
                        SaveSystem.Save();
                    }
                    else if (Manager.BuyMap(map.Id))
                    {
                        Manager.Save.SelectedMap = map.Id;
                        SaveSystem.Save();
                    }
                    else Notice = "Not enough money for " + map.Name;
                }
            }

            if (GUI.Button(new Rect(200, h - 110, 320, 64), "START FREE DRIVE", _button)) Manager.StartFreeDrive();
            if (!string.IsNullOrEmpty(Notice)) GUI.Label(new Rect(600, h - 100, 600, 30), Notice, _body);
        }

        private void DrawGarage(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "BUS GARAGE", _header);
            float y = 90f;
            foreach (BusSpec spec in BusCatalog.All)
            {
                bool unlocked = Manager.Save.IsBusUnlocked(spec.Id);
                bool selected = Manager.Save.SelectedBus == spec.Id;
                GUI.Box(new Rect(200, y, 780, 76), GUIContent.none, _card);
                GUI.Label(new Rect(214, y + 6, 560, 28), spec.Name + (selected ? "   (selected)" : ""), _body);
                GUI.Label(new Rect(214, y + 34, 560, 34), spec.Tagline + "  |  " + spec.SeatCapacity + " seats  |  " + spec.Length.ToString("0") + " m", _small);
                string caption = unlocked ? "SELECT" : "BUY ₹" + spec.Price;
                if (GUI.Button(new Rect(830, y + 16, 130, 44), caption, _button))
                {
                    if (unlocked)
                    {
                        Manager.Save.SelectedBus = spec.Id;
                        SaveSystem.Save();
                        Manager.RefreshShowcase();
                    }
                    else if (Manager.BuyBus(spec.Id))
                    {
                        Manager.Save.SelectedBus = spec.Id;
                        SaveSystem.Save();
                        Manager.RefreshShowcase();
                    }
                    else Notice = "Not enough money";
                }
                y += 82f;
            }
        }

        private void DrawCustomization(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "BUS CUSTOMISATION", _header);

            BusCustomization custom = SaveSystem.GetCustomization(Manager.Save.SelectedBus);
            float x = 200f;
            float y = 90f;

            GUI.Label(new Rect(x, y, 320, 30), "Paint scheme", _header);
            y += 38f;
            for (int i = 0; i < _paintOptions.Count; i++)
            {
                if (GUI.Button(new Rect(x, y + i * 46, 200, 40), _paintOptions[i], _button))
                {
                    custom.Paint = _paintOptions[i];
                }
            }
            y += _paintOptions.Count * 46 + 16f;

            GUI.Label(new Rect(x, y, 320, 30), "Body colour", _header);
            y += 38f;
            for (int i = 0; i < _bodyColors.Count; i++)
            {
                if (GUI.Button(new Rect(x + (i % 4) * 92, y + (i / 4) * 46, 84, 40), "C" + (i + 1), _button))
                {
                    custom.BodyColor = _bodyColors[i];
                }
            }
            y += 2 * 46 + 20f;

            GUI.Label(new Rect(x, y, 320, 30), "Interior", _header);
            y += 38f;
            for (int i = 0; i < _interiorOptions.Count; i++)
            {
                if (GUI.Button(new Rect(x + (i % 4) * 92, y + (i / 4) * 46, 84, 40), _interiorOptions[i], _button))
                {
                    custom.InteriorColor = _interiorOptions[i];
                }
            }
            y += 46f + 20f;

            CycleRow(ref x, ref y, "Seats", _seatOptions, ref custom.SeatDesign);
            CycleRow(ref x, ref y, "Wheels", _wheelOptions, ref custom.Wheels);
            CycleRow(ref x, ref y, "Rims", _rimOptions, ref custom.Rims);
            CycleRow(ref x, ref y, "Headlights", _headlightOptions, ref custom.Headlights);
            CycleRow(ref x, ref y, "Horn", _hornOptions, ref custom.Horn);
            if (custom.Stickers.Count == 0) custom.Stickers.Add(_sticker);
            _sticker = custom.Stickers[0];
            CycleRow(ref x, ref y, "Sticker", _stickerOptions, ref _sticker);
            custom.Stickers[0] = _sticker;

            GUI.Label(new Rect(x, y, 320, 30), "Number plate", _header);
            y += 38f;
            if (GUI.Button(new Rect(x, y, 260, 40), "Change plate", _button))
            {
                custom.LicensePlate = "MH 12 AB " + Random.Range(1000, 9999);
            }
            GUI.Label(new Rect(x + 280, y, 320, 40), custom.LicensePlate, _body);
            y += 50f;

            GUI.Label(new Rect(x, y, 320, 30), "Window tint " + Mathf.RoundToInt(custom.WindowTint * 100f) + "%", _header);
            y += 38f;
            if (GUI.Button(new Rect(x, y, 120, 40), "Darker", _button)) custom.WindowTint = Mathf.Clamp01(custom.WindowTint + 0.1f);
            if (GUI.Button(new Rect(x + 130, y, 120, 40), "Clearer", _button)) custom.WindowTint = Mathf.Clamp01(custom.WindowTint - 0.1f);

            if (GUI.Button(new Rect(200, h - 90, 260, 56), "APPLY & SAVE", _button))
            {
                Manager.ApplyCustomization(Manager.Save.SelectedBus, custom);
                Notice = "Customisation saved";
            }
            if (!string.IsNullOrEmpty(Notice)) GUI.Label(new Rect(480, h - 80, 500, 30), Notice, _body);
        }

        private void CycleRow(ref float x, ref float y, string label, List<string> options, ref string value)
        {
            GUI.Label(new Rect(x, y, 160, 30), label, _header);
            int index = options.IndexOf(value);
            if (index < 0) index = 0;
            if (GUI.Button(new Rect(x + 170, y, 60, 34), "<", _button))
            {
                index = (index - 1 + options.Count) % options.Count;
                value = options[index];
            }
            if (GUI.Button(new Rect(x + 236, y, 60, 34), ">", _button))
            {
                index = (index + 1) % options.Count;
                value = options[index];
            }
            GUI.Label(new Rect(x + 304, y, 200, 34), value, _body);
            y += 44f;
        }

        private void DrawMapSelect(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "MAP SELECTION", _header);
            float y = 90f;
            foreach (MapDefinition map in MapCatalog.All)
            {
                bool unlocked = Manager.Save.IsMapUnlocked(map.Id);
                bool selected = Manager.Save.SelectedMap == map.Id;
                GUI.Box(new Rect(200, y, 780, 84), GUIContent.none, _card);
                GUI.Label(new Rect(214, y + 6, 560, 28), map.Name + (selected ? "   (selected)" : ""), _body);
                GUI.Label(new Rect(214, y + 34, 560, 46), map.Tagline + "  |  traffic " + Mathf.RoundToInt(map.TrafficDensity * 100f) + "%", _small);
                string caption = unlocked ? "SELECT" : "UNLOCK ₹" + map.Price;
                if (GUI.Button(new Rect(830, y + 20, 130, 44), caption, _button))
                {
                    if (unlocked)
                    {
                        Manager.Save.SelectedMap = map.Id;
                        SaveSystem.Save();
                    }
                    else if (Manager.BuyMap(map.Id))
                    {
                        Manager.Save.SelectedMap = map.Id;
                        SaveSystem.Save();
                    }
                    else Notice = "Not enough money";
                }
                y += 90f;
            }
            if (!string.IsNullOrEmpty(Notice)) GUI.Label(new Rect(200, h - 60, 600, 30), Notice, _body);
        }

        private void DrawDailyRewards(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "DAILY REWARDS", _header);
            Economy.DailyRewardState state = Economy.GetDailyRewardState(Manager.Save.DailyLastClaimDay, Manager.Save.DailyStreak, DayNumber());
            float y = 90f;
            for (int i = 0; i < Economy.DailyRewards.Length; i++)
            {
                Economy.Reward reward = Economy.DailyRewards[i];
                bool claimed = i < Manager.Save.DailyStreak % 7 || (Manager.Save.DailyStreak > 0 && Manager.Save.DailyLastClaimDay == DayNumber() && i < Manager.Save.DailyStreak % 7);
                GUI.Box(new Rect(200, y, 500, 70), GUIContent.none, _card);
                GUI.Label(new Rect(214, y + 8, 460, 26), "Day " + reward.Day + "  -  " + reward.Label, _body);
                GUI.Label(new Rect(214, y + 34, 460, 26), "₹" + reward.Amount, _small);
                y += 76f;
            }
            if (state.Available && GUI.Button(new Rect(200, y + 10, 300, 56), "CLAIM ₹" + state.Amount, _button))
            {
                SaveSystem.AddMoney(state.Amount);
                Manager.Save.DailyLastClaimDay = DayNumber();
                Manager.Save.DailyStreak = state.NextStreak;
                SaveSystem.Save();
                Notice = "Reward claimed!";
            }
            else
            {
                GUI.Label(new Rect(200, y + 24, 600, 30), state.Available ? "" : "Come back tomorrow", _body);
            }
            if (!string.IsNullOrEmpty(Notice)) GUI.Label(new Rect(560, y + 24, 500, 30), Notice, _body);
        }

        private static int DayNumber()
        {
            return System.DateTime.Now.Day;
        }

        private void DrawAchievements(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "ACHIEVEMENTS", _header);
            string[,] list =
            {
                { "First Route", "Complete your first career mission" },
                { "Road King", "Drive 100 km in total" },
                { "Lifesaver", "Deliver 50 passengers" },
                { "Spotless", "Finish a mission without a single collision" },
                { "Garage Collector", "Own every bus" },
                { "Explorer", "Unlock every map" },
                { "Night Rider", "Complete a night mission" },
                { "Rain Warrior", "Complete a mission in heavy rain" },
            };
            float y = 90f;
            for (int i = 0; i < list.GetLength(0); i++)
            {
                GUI.Box(new Rect(200, y, 620, 62), GUIContent.none, _card);
                GUI.Label(new Rect(214, y + 6, 560, 26), list[i, 0], _body);
                GUI.Label(new Rect(214, y + 30, 560, 26), list[i, 1], _small);
                y += 68f;
            }
        }

        private void DrawSettings(float w, float h)
        {
            DrawBackButton(w);
            GUI.Label(new Rect(200, 20, w - 220, 48), "SETTINGS", _header);

            string[] qualityNames = { "Low", "Medium", "High", "Ultra" };
            int quality = Mathf.Clamp(SettingsManager.QualityLevel, 0, 3);
            GUI.Label(new Rect(200, 90, 320, 30), "Graphics quality: " + qualityNames[quality], _body);
            for (int i = 0; i < qualityNames.Length; i++)
            {
                if (GUI.Button(new Rect(200 + i * 110, 130, 100, 44), qualityNames[i], _button))
                {
                    SettingsManager.QualityLevel = i;
                    SettingsManager.Apply();
                }
            }

            GUI.Label(new Rect(200, 200, 400, 30), "Frame rate limit: " + SettingsManager.TargetFrameRate, _body);
            if (GUI.Button(new Rect(200, 236, 120, 40), "30", _button)) { SettingsManager.TargetFrameRate = 30; SettingsManager.Apply(); }
            if (GUI.Button(new Rect(330, 236, 120, 40), "60", _button)) { SettingsManager.TargetFrameRate = 60; SettingsManager.Apply(); }
            if (GUI.Button(new Rect(460, 236, 120, 40), "Unlimited", _button)) { SettingsManager.TargetFrameRate = -1; SettingsManager.Apply(); }

            GUI.Label(new Rect(200, 300, 400, 30), "Camera sensitivity: " + SettingsManager.CameraSensitivity.ToString("0.0"), _body);
            if (GUI.Button(new Rect(200, 336, 120, 40), "-", _button)) SettingsManager.CameraSensitivity = Mathf.Clamp(SettingsManager.CameraSensitivity - 0.1f, 0.2f, 3f);
            if (GUI.Button(new Rect(330, 336, 120, 40), "+", _button)) SettingsManager.CameraSensitivity = Mathf.Clamp(SettingsManager.CameraSensitivity + 0.1f, 0.2f, 3f);

            GUI.Label(new Rect(200, 400, 400, 30), "Master volume: " + Mathf.RoundToInt(SettingsManager.MasterVolume * 100f) + "%", _body);
            if (GUI.Button(new Rect(200, 436, 120, 40), "-", _button)) SettingsManager.MasterVolume = Mathf.Clamp01(SettingsManager.MasterVolume - 0.1f);
            if (GUI.Button(new Rect(330, 436, 120, 40), "+", _button)) SettingsManager.MasterVolume = Mathf.Clamp01(SettingsManager.MasterVolume + 0.1f);

            GUI.Label(new Rect(200, 500, 600, 30),
                "Shadows: " + (SettingsManager.Shadows ? "on" : "off") + "   Textures: " + SettingsManager.TextureQuality +
                "   AA: " + SettingsManager.AntiAliasing, _body);
            if (GUI.Button(new Rect(200, 540, 220, 42), "Toggle shadows", _button)) { SettingsManager.Shadows = !SettingsManager.Shadows; SettingsManager.Apply(); }
            if (GUI.Button(new Rect(430, 540, 220, 42), "Cycle AA", _button)) { SettingsManager.AntiAliasing = SettingsManager.AntiAliasing == 0 ? 2 : SettingsManager.AntiAliasing == 2 ? 4 : 0; SettingsManager.Apply(); }
        }

        private void DrawResult(float w, float h)
        {
            GUI.Label(new Rect(0, h * 0.3f, w, 60), LastResult, _title);
            if (GUI.Button(new Rect(w * 0.5f - 160f, h * 0.5f, 320, 60), "CONTINUE", _button)) Manager.ReturnToMenu();
        }
    }
}
