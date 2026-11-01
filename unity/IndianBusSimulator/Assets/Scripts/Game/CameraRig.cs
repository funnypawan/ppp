using UnityEngine;
using IBS.Vehicles;
using IBS.Core;

namespace IBS.Game
{
    public enum CameraMode { Chase, Close, Interior, TopDown, Bonnet, Cinematic }

    /// <summary>
    /// Six camera modes with smooth transitions and sensitivity control.
    /// </summary>
    public class CameraRig : MonoBehaviour
    {
        public Camera Camera;
        public CameraMode Mode = CameraMode.Chase;
        public float Sensitivity = 1f;
        public float TransitionSpeed = 6f;

        private Vector3 _position;
        private Quaternion _rotation = Quaternion.identity;
        private bool _initialised;

        public void Initialise(Camera camera)
        {
            Camera = camera;
            _initialised = false;
        }

        public void CycleMode()
        {
            Mode = (CameraMode)(((int)Mode + 1) % 6);
        }

        public void SetMode(CameraMode mode)
        {
            Mode = mode;
        }

        /// <summary>Positions the camera for the given player state.</summary>
        public void UpdateCamera(float dt, BusEntity bus)
        {
            if (bus == null || Camera == null) return;
            BusSpec spec = bus.Spec;
            Vector3 busPos = bus.transform.position;
            float yaw = bus.Physics.Yaw;
            float speed = bus.Physics.Speed;
            Vector3 forward = new Vector3(Mathf.Cos(yaw), 0f, Mathf.Sin(yaw));
            Vector3 right = new Vector3(-forward.z, 0f, forward.x);

            Vector3 targetPos;
            Vector3 lookAt;
            float fov = 62f;

            switch (Mode)
            {
                case CameraMode.Chase:
                    targetPos = busPos - forward * (8.5f + speed * 0.12f) + Vector3.up * 4.4f + right * bus.Physics.SteerAngle * 1.6f;
                    lookAt = busPos + forward * 8f + Vector3.up * 1.8f;
                    fov = 62f + Mathf.Clamp(speed * 0.22f, 0f, 8f);
                    break;
                case CameraMode.Close:
                    targetPos = busPos - forward * 5.2f + Vector3.up * 2.2f;
                    lookAt = busPos + forward * 5f + Vector3.up * 1.4f;
                    fov = 58f;
                    break;
                case CameraMode.Interior:
                    targetPos = busPos + forward * (spec.Length * 0.5f - 1.35f) + right * (spec.Width * 0.5f - 0.62f) + Vector3.up * 1.62f;
                    lookAt = targetPos + forward * 12f + Vector3.up * 0.6f;
                    fov = 72f;
                    break;
                case CameraMode.TopDown:
                    targetPos = busPos + Vector3.up * 42f;
                    lookAt = busPos;
                    fov = 55f;
                    break;
                case CameraMode.Bonnet:
                    targetPos = busPos + forward * (spec.Length * 0.5f - 0.5f) + Vector3.up * 1.65f;
                    lookAt = targetPos + forward * 14f;
                    fov = 68f;
                    break;
                default:
                    float orbit = Time.time * 0.25f;
                    targetPos = busPos + new Vector3(Mathf.Cos(orbit) * 16f, 7f, Mathf.Sin(orbit) * 16f);
                    lookAt = busPos + Vector3.up * 1.6f;
                    fov = 45f;
                    break;
            }

            if (!_initialised)
            {
                _position = targetPos;
                _rotation = Quaternion.LookRotation(lookAt - targetPos, Vector3.up);
                _initialised = true;
            }
            else
            {
                float t = 1f - Mathf.Exp(-TransitionSpeed * dt);
                _position = Vector3.Lerp(_position, targetPos, t);
                Quaternion targetRotation = Quaternion.LookRotation(lookAt - targetPos, Vector3.up);
                _rotation = Quaternion.Slerp(_rotation, targetRotation, t);
            }

            Camera.transform.position = _position;
            Camera.transform.rotation = _rotation;
            Camera.fieldOfView = Mathf.Lerp(Camera.fieldOfView, fov, 1f - Mathf.Exp(-4f * dt));
        }
    }
}
