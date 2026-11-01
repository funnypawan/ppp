using UnityEngine;
using IBS.Core;

namespace IBS.Vehicles
{
    /// <summary>
    /// The player controlled bus: physics, 3D model, sliding doors, lights,
    /// indicators, horn and collision feedback.
    /// </summary>
    public class BusEntity : MonoBehaviour
    {
        public BusSpec Spec;
        public BusModel Model;
        public VehiclePhysics Physics;

        public bool DoorsOpen;
        public bool HeadlightsOn;
        public int Indicator;             // -1 left, 0 off, 1 right
        public float LastImpact;

        private float _doorAmount;
        private float _indicatorPhase;
        private bool _brakeLit;
        private Light _headLight;

        public void Initialise(BusSpec spec, BusCustomization custom, float x, float y, float yaw)
        {
            Spec = spec;
            Physics = new VehiclePhysics(spec);
            Physics.Reset(x, y, yaw);
            Model = new BusModel(spec, custom);
            Model.Root.transform.SetParent(transform, false);

            GameObject lightGo = new GameObject("HeadLight");
            lightGo.transform.SetParent(transform, false);
            lightGo.transform.localPosition = new Vector3(0f, 1.2f, -spec.Length * 0.5f + 0.4f);
            _headLight = lightGo.AddComponent<Light>();
            _headLight.type = LightType.Spot;
            _headLight.color = new Color(1f, 0.94f, 0.8f);
            _headLight.range = 40f;
            _headLight.spotAngle = 70f;
            _headLight.intensity = 0f;
        }

        public void SetInputs(DriveInput input)
        {
            Physics.SetInputs(input);
        }

        public VehicleTelemetry Step(float dt, DriveEnvironment env, WorldCollider[] colliders)
        {
            VehicleTelemetry tele = Physics.Step(dt, env);
            if (colliders != null && colliders.Length > 0)
            {
                CollisionResult result = CollisionSolver.Resolve(Physics, colliders);
                if (result.Impulse > 0.4f) LastImpact = result.Impulse;
            }
            ApplyTransform();
            return tele;
        }

        public void ApplyTransform()
        {
            transform.position = new Vector3(Physics.X, 0f, Physics.Y);
            transform.rotation = Quaternion.Euler(0f, MathfConst.PI * 0.5f - Physics.Yaw, 0f);
            if (Model != null)
            {
                Model.Root.transform.localRotation = Quaternion.Euler(
                    Physics.SuspensionPitch * MathfConst.Rad2Deg,
                    0f,
                    -Physics.SuspensionRoll * MathfConst.Rad2Deg);
                Model.Root.transform.localPosition = new Vector3(0f, Physics.SuspensionHeave, 0f);
            }
        }

        public void TickVisuals(float dt)
        {
            // Doors slide apart like an Indian bus plug door.
            _doorAmount = MathUtil.Damp(_doorAmount, DoorsOpen ? 1f : 0f, 6f, dt);
            for (int i = 0; i < Model.Doors.Count; i++)
            {
                Transform door = Model.Doors[i];
                for (int leaf = 0; leaf < door.childCount; leaf++)
                {
                    Transform panel = door.GetChild(leaf);
                    float baseZ = (leaf == 0 ? -0.5f : 0.5f) * 0.95f;
                    panel.localPosition = new Vector3(panel.localPosition.x, panel.localPosition.y,
                        baseZ + (leaf == 0 ? -1f : 1f) * _doorAmount * 0.85f);
                }
            }

            // Indicator blink.
            _indicatorPhase += dt * 4.2f;
            bool blink = Indicator != 0 && Mathf.Sin(_indicatorPhase) > 0f;
            Model.IndicatorLeftMaterial.color = Indicator == -1 && blink ? new Color(1f, 0.65f, 0.09f) : new Color(0.23f, 0.14f, 0.06f);
            Model.IndicatorRightMaterial.color = Indicator == 1 && blink ? new Color(1f, 0.65f, 0.09f) : new Color(0.23f, 0.14f, 0.06f);

            // Brake lights.
            bool braking = Physics.Brake > 0.05f || (Physics.Handbrake > 0.5f && Physics.Speed > 0.5f);
            if (braking != _brakeLit)
            {
                _brakeLit = braking;
                Model.BrakeLightMaterial.color = braking ? new Color(1f, 0.16f, 0.16f) : new Color(0.23f, 0.05f, 0.05f);
            }

            // Wheels + steering wheel.
            float spin = (Physics.U / Spec.TireRadius) * dt;
            for (int i = 0; i < Model.Wheels.Count; i++)
            {
                Transform wheel = Model.Wheels[i];
                wheel.localRotation = Quaternion.Euler(wheel.localRotation.eulerAngles.x - spin * MathfConst.Rad2Deg, 0f, 0f);
            }
            if (Model.SteeringWheel != null)
            {
                Model.SteeringWheel.localRotation = Quaternion.Euler(0f, 90f, 26f - Physics.SteerAngle * MathfConst.Rad2Deg * 3.4f);
            }
        }

        public void SetHeadlights(bool on)
        {
            HeadlightsOn = on;
            Model.HeadlightMaterial.color = on ? new Color(1f, 0.94f, 0.77f) : new Color(0.42f, 0.38f, 0.31f);
            if (_headLight != null) _headLight.intensity = on ? 2.4f : 0f;
        }

        public void Refuel(float amount)
        {
            Physics.Fuel = Mathf.Min(Spec.FuelTank, Physics.Fuel + amount);
        }
    }
}
