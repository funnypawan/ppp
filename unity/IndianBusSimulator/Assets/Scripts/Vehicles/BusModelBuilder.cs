using System.Collections.Generic;
using UnityEngine;
using IBS.Core;
using IBS.Util;

namespace IBS.Vehicles
{
    /// <summary>
    /// Builds the 3D representation of a bus from its spec: shell, glazing,
    /// sliding plug doors (left hand side, like a real Indian bus), lights,
    /// mirrors, wheels and the interior with seats, dashboard and steering
    /// wheel.
    /// </summary>
    public class BusModel
    {
        public GameObject Root;
        public List<Transform> Doors = new List<Transform>();
        public List<Transform> Wheels = new List<Transform>();
        public List<Transform> BrakeLights = new List<Transform>();
        public Transform IndicatorLeft;
        public Transform IndicatorRight;
        public Transform SteeringWheel;
        public Material PaintMaterial;
        public Material GlassMaterial;
        public Material IndicatorLeftMaterial;
        public Material IndicatorRightMaterial;
        public Material BrakeLightMaterial;
        public Material HeadlightMaterial;

        private readonly BusSpec _spec;

        public BusModel(BusSpec spec, BusCustomization custom)
        {
            _spec = spec;
            Build(custom);
        }

        private void Build(BusCustomization custom)
        {
            Root = new GameObject("Bus_" + _spec.Id);

            Color paint = ColorFromHex(custom.BodyColor != null && custom.BodyColor.Length > 0
                ? custom.BodyColor
                : _spec.DefaultPaint);
            Color interiorColor = new Color(0.85f, 0.79f, 0.66f);

            PaintMaterial = ProceduralMesh.Material(paint);
            Material paintDark = ProceduralMesh.Material(paint * 0.72f);
            Material trim = ProceduralMesh.Material(new Color(0.14f, 0.15f, 0.17f));
            Material chrome = ProceduralMesh.Material(new Color(0.72f, 0.75f, 0.78f));
            Material rubber = ProceduralMesh.Material(new Color(0.08f, 0.09f, 0.1f));
            Material seatMaterial = ProceduralMesh.Material(new Color(0.48f, 0.42f, 0.32f));
            Material interiorMaterial = ProceduralMesh.Material(interiorColor);
            GlassMaterial = ProceduralMesh.Material(new Color(0.11f, 0.16f, 0.2f));
            HeadlightMaterial = ProceduralMesh.EmissiveMaterial(new Color(1f, 0.94f, 0.77f));
            Material taillightMaterial = ProceduralMesh.EmissiveMaterial(new Color(0.45f, 0.08f, 0.08f));
            IndicatorLeftMaterial = ProceduralMesh.EmissiveMaterial(new Color(0.23f, 0.14f, 0.06f));
            IndicatorRightMaterial = ProceduralMesh.EmissiveMaterial(new Color(0.23f, 0.14f, 0.06f));
            BrakeLightMaterial = ProceduralMesh.EmissiveMaterial(new Color(0.23f, 0.05f, 0.05f));

            float L = _spec.Length;
            float W = _spec.Width;
            float H = _spec.Height;
            float floorY = 0.62f;

            // Shell ------------------------------------------------------------
            GameObject shell = ProceduralMesh.CreateMeshObject("Shell", ProceduralMesh.Box(W, H - floorY, L), PaintMaterial, Root.transform);
            shell.transform.localPosition = new Vector3(0f, floorY + (H - floorY) * 0.5f, 0f);

            GameObject skirt = ProceduralMesh.CreateMeshObject("Skirt", ProceduralMesh.Box(W + 0.06f, 0.62f, L - 0.3f), paintDark, Root.transform);
            skirt.transform.localPosition = new Vector3(0f, 0.42f, 0f);

            GameObject roof = ProceduralMesh.CreateMeshObject("Roof", ProceduralMesh.Box(W - 0.18f, 0.16f, L - 1.2f), paintDark, Root.transform);
            roof.transform.localPosition = new Vector3(0f, H - 0.02f, 0f);

            if (_spec.BodyStyle == "coach" || _spec.BodyStyle == "volvo" || _spec.BodyStyle == "sleeper")
            {
                GameObject ac = ProceduralMesh.CreateMeshObject("AcUnit", ProceduralMesh.Box(W - 0.6f, 0.34f, 2.2f), trim, Root.transform);
                ac.transform.localPosition = new Vector3(0f, H + 0.14f, 0.9f);
            }

            // Glazing ----------------------------------------------------------
            bool isDouble = _spec.BodyStyle == "double";
            float windowY = isDouble ? floorY + 0.95f : floorY + 0.85f;
            float windowH = isDouble ? 0.95f : (_spec.BodyStyle == "mini" ? 0.95f : 1.15f);
            float windowFront = -L * 0.5f + 1.35f;
            float windowLength = L - 2.85f;

            for (int side = -1; side <= 1; side += 2)
            {
                GameObject glass = ProceduralMesh.CreateMeshObject("Glass", ProceduralMesh.Box(0.06f, windowH, windowLength), GlassMaterial, Root.transform);
                glass.transform.localPosition = new Vector3(side * (W * 0.5f - 0.02f), windowY, (windowFront + windowLength * 0.5f) - L * 0.5f + 0.1f);
            }

            GameObject windscreen = ProceduralMesh.CreateMeshObject("Windscreen", ProceduralMesh.Box(W - 0.3f, windowH + 0.25f, 0.08f), GlassMaterial, Root.transform);
            windscreen.transform.localPosition = new Vector3(0f, windowY + 0.1f, -L * 0.5f + 0.32f);
            windscreen.transform.localRotation = Quaternion.Euler(-7f, 0f, 0f);

            GameObject rearGlass = ProceduralMesh.CreateMeshObject("RearGlass", ProceduralMesh.Box(W - 0.5f, windowH, 0.08f), GlassMaterial, Root.transform);
            rearGlass.transform.localPosition = new Vector3(0f, windowY, L * 0.5f - 0.1f);

            // Doors on the left side (-X) -------------------------------------
            int doorCount = (_spec.BodyStyle == "mini" || _spec.BodyStyle == "school") ? 1 : 2;
            for (int d = 0; d < doorCount; d++)
            {
                GameObject door = new GameObject("Door" + d);
                door.transform.SetParent(Root.transform, false);
                door.transform.localPosition = new Vector3(-(W * 0.5f + 0.02f), 0f, -L * 0.5f + 1.5f + d * 1.25f);
                for (int leaf = 0; leaf < 2; leaf++)
                {
                    GameObject panel = ProceduralMesh.CreateMeshObject("Leaf", ProceduralMesh.Box(0.1f, windowH + 0.55f, 0.95f), paintDark, door.transform);
                    panel.transform.localPosition = new Vector3(0f, windowY + (windowH + 0.55f) * 0.5f - 0.45f, (leaf - 0.5f) * 0.95f);
                }
                Doors.Add(door.transform);
            }

            // Lights -----------------------------------------------------------
            for (int side = -1; side <= 1; side += 2)
            {
                GameObject head = ProceduralMesh.CreateMeshObject("Headlight", ProceduralMesh.Box(0.42f, 0.22f, 0.12f), HeadlightMaterial, Root.transform);
                head.transform.localPosition = new Vector3(side * (W * 0.5f - 0.42f), floorY + 0.22f, -L * 0.5f + 0.06f);

                GameObject tail = ProceduralMesh.CreateMeshObject("Taillight", ProceduralMesh.Box(0.36f, 0.42f, 0.1f), taillightMaterial, Root.transform);
                tail.transform.localPosition = new Vector3(side * (W * 0.5f - 0.4f), floorY + 0.25f, L * 0.5f - 0.06f);

                GameObject brake = ProceduralMesh.CreateMeshObject("BrakeLight", ProceduralMesh.Box(0.3f, 0.14f, 0.08f), BrakeLightMaterial, Root.transform);
                brake.transform.localPosition = new Vector3(side * (W * 0.5f - 0.4f), floorY - 0.05f, L * 0.5f - 0.04f);
                BrakeLights.Add(brake.transform);
            }

            GameObject indLeft = ProceduralMesh.CreateMeshObject("IndicatorLeft", ProceduralMesh.Box(0.2f, 0.18f, 0.1f), IndicatorLeftMaterial, Root.transform);
            indLeft.transform.localPosition = new Vector3(W * 0.5f - 0.85f, floorY + 0.25f, -L * 0.5f + 0.06f);
            IndicatorLeft = indLeft.transform;

            GameObject indRight = ProceduralMesh.CreateMeshObject("IndicatorRight", ProceduralMesh.Box(0.2f, 0.18f, 0.1f), IndicatorRightMaterial, Root.transform);
            indRight.transform.localPosition = new Vector3(-(W * 0.5f - 0.85f), floorY + 0.25f, -L * 0.5f + 0.06f);
            IndicatorRight = indRight.transform;

            // Bumpers, grille, mirrors ------------------------------------------
            GameObject bumperFront = ProceduralMesh.CreateMeshObject("BumperF", ProceduralMesh.Box(W + 0.05f, 0.3f, 0.3f), trim, Root.transform);
            bumperFront.transform.localPosition = new Vector3(0f, floorY - 0.18f, -L * 0.5f + 0.01f);
            GameObject bumperRear = ProceduralMesh.CreateMeshObject("BumperR", ProceduralMesh.Box(W + 0.05f, 0.3f, 0.3f), trim, Root.transform);
            bumperRear.transform.localPosition = new Vector3(0f, floorY - 0.18f, L * 0.5f - 0.01f);
            GameObject grille = ProceduralMesh.CreateMeshObject("Grille", ProceduralMesh.Box(W * 0.55f, 0.4f, 0.1f), chrome, Root.transform);
            grille.transform.localPosition = new Vector3(0f, floorY + 0.18f, -L * 0.5f + 0.04f);

            for (int side = -1; side <= 1; side += 2)
            {
                GameObject arm = ProceduralMesh.CreateMeshObject("MirrorArm", ProceduralMesh.Box(0.5f, 0.06f, 0.06f), trim, Root.transform);
                arm.transform.localPosition = new Vector3(side * (W * 0.5f + 0.2f), floorY + 1.35f, -L * 0.5f + 0.4f);
                GameObject mirror = ProceduralMesh.CreateMeshObject("Mirror", ProceduralMesh.Box(0.1f, 0.62f, 0.22f), trim, Root.transform);
                mirror.transform.localPosition = new Vector3(side * (W * 0.5f + 0.46f), floorY + 1.3f, -L * 0.5f + 0.4f);
            }

            // Wheels --------------------------------------------------------------
            float axleF = -L * 0.5f + _spec.FrontOverhang + 0.1f;
            float axleR = axleF - _spec.Wheelbase;
            float halfTrack = W * 0.5f - 0.12f;
            Mesh tyreMesh = ProceduralMesh.Cylinder(_spec.TireRadius, _spec.TireWidth, 14);
            Mesh rimMesh = ProceduralMesh.Cylinder(_spec.TireRadius * 0.58f, _spec.TireWidth * 1.04f, 12);
            for (int i = 0; i < 4; i++)
            {
                float x = (i % 2 == 0) ? halfTrack : -halfTrack;
                float z = (i < 2) ? axleF : axleR;
                GameObject wheel = new GameObject("Wheel" + i);
                wheel.transform.SetParent(Root.transform, false);
                wheel.transform.localPosition = new Vector3(x, _spec.TireRadius, z);
                ProceduralMesh.CreateMeshObject("Tyre", tyreMesh, rubber, wheel.transform);
                ProceduralMesh.CreateMeshObject("Rim", rimMesh, chrome, wheel.transform);
                Wheels.Add(wheel.transform);
            }

            // Interior --------------------------------------------------------------
            GameObject interiorRoot = new GameObject("Interior");
            interiorRoot.transform.SetParent(Root.transform, false);

            GameObject floor = ProceduralMesh.CreateMeshObject("Floor", ProceduralMesh.Box(W - 0.2f, 0.08f, L - 0.5f), interiorMaterial, interiorRoot.transform);
            floor.transform.localPosition = new Vector3(0f, floorY, 0f);

            int seatRows = Mathf.Max(4, _spec.SeatRows);
            float seatSpacing = (L - 3.4f) / seatRows;
            for (int r = 0; r < seatRows; r++)
            {
                float z = -L * 0.5f + 2.4f + r * seatSpacing;
                if (z > L * 0.5f - 1.6f) break;
                for (int s = 0; s < _spec.SeatsPerRow; s++)
                {
                    float x = -W * 0.5f + 0.42f + s * ((W - 1.0f) / Mathf.Max(1, _spec.SeatsPerRow - 1));
                    GameObject seat = ProceduralMesh.CreateMeshObject("Seat", ProceduralMesh.Box(0.42f, 0.12f, 0.46f), seatMaterial, interiorRoot.transform);
                    seat.transform.localPosition = new Vector3(x, floorY + 0.42f, z);
                    GameObject back = ProceduralMesh.CreateMeshObject("SeatBack", ProceduralMesh.Box(0.42f, 0.52f, 0.1f), seatMaterial, interiorRoot.transform);
                    back.transform.localPosition = new Vector3(x, floorY + 0.7f, z + 0.2f);
                }
            }

            GameObject dash = ProceduralMesh.CreateMeshObject("Dashboard", ProceduralMesh.Box(W - 0.6f, 0.28f, 0.5f), trim, interiorRoot.transform);
            dash.transform.localPosition = new Vector3(0f, floorY + 0.72f, -L * 0.5f + 0.62f);
            GameObject steeringWheel = ProceduralMesh.CreateMeshObject("SteeringWheel", ProceduralMesh.Box(0.42f, 0.06f, 0.42f), trim, interiorRoot.transform);
            steeringWheel.transform.localPosition = new Vector3(W * 0.5f - 0.62f, floorY + 0.86f, -L * 0.5f + 0.78f);
            steeringWheel.transform.localRotation = Quaternion.Euler(0f, 90f, 26f);
            SteeringWheel = steeringWheel.transform;
            GameObject driverSeat = ProceduralMesh.CreateMeshObject("DriverSeat", ProceduralMesh.Box(0.5f, 0.12f, 0.5f), seatMaterial, interiorRoot.transform);
            driverSeat.transform.localPosition = new Vector3(W * 0.5f - 0.62f, floorY + 0.5f, -L * 0.5f + 1.35f);

            // License plate ---------------------------------------------------------
            GameObject plate = ProceduralMesh.CreateMeshObject("Plate", ProceduralMesh.Box(0.62f, 0.16f, 0.04f), ProceduralMesh.Material(Color.white), Root.transform);
            plate.transform.localPosition = new Vector3(0f, floorY - 0.16f, L * 0.5f - 0.04f);
        }

        /// <summary>Turns the head light emissive material on or off.</summary>
        public void SetHeadlights(bool on)
        {
            HeadlightMaterial.color = on ? new Color(1f, 0.94f, 0.77f) : new Color(0.42f, 0.38f, 0.31f);
        }

        public static Color ColorFromHex(string hex)
        {
            Color color;
            if (string.IsNullOrEmpty(hex)) return Color.magenta;
            if (hex[0] == '#') hex = hex.Substring(1);
            if (hex.Length != 6) return Color.magenta;
            int r = int.Parse(hex.Substring(0, 2), System.Globalization.NumberStyles.HexNumber);
            int g = int.Parse(hex.Substring(2, 2), System.Globalization.NumberStyles.HexNumber);
            int b = int.Parse(hex.Substring(4, 2), System.Globalization.NumberStyles.HexNumber);
            color = new Color(r / 255f, g / 255f, b / 255f);
            return color;
        }
    }
}
