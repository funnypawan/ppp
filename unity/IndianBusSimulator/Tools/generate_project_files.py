#!/usr/bin/env python3
"""Generates the Unity project scaffolding for Indian Bus Simulator 3D.

Creates:
  * ``.meta`` files with stable, deterministic GUIDs for every asset and
    folder (so references survive a fresh clone),
  * the assembly definition files that keep the code modular,
  * the seven playable scenes,
  * the Unity project settings and the package manifest.

Run from the Unity project root::

    python3 Tools/generate_project_files.py

The script is idempotent: running it again does not change existing GUIDs.
"""

import hashlib
import json
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "Assets"

UNITY_VERSION = "2022.3.62f1"
PRODUCT_NAME = "Indian Bus Simulator 3D"
COMPANY_NAME = "Pawan Games"

# Folder -> assembly definition name
ASMDEFS = {
    "Assets/Scripts/Core": "IBS.Core",
    "Assets/Scripts/Util": "IBS.Util",
    "Assets/Scripts/World": "IBS.World",
    "Assets/Scripts/Vehicles": "IBS.Vehicles",
    "Assets/Scripts/Game": "IBS.Game",
    "Assets/Scripts/UI": "IBS.UI",
}

ASMDEF_REFERENCES = {
    "IBS.Core": [],
    "IBS.Util": [],
    "IBS.World": ["IBS.Core"],
    "IBS.Vehicles": ["IBS.Core", "IBS.World"],
    "IBS.Game": ["IBS.Core", "IBS.World", "IBS.Vehicles"],
    "IBS.UI": ["IBS.Core", "IBS.World", "IBS.Vehicles", "IBS.Game"],
}


def guid_for(relative_path: str) -> str:
    """Deterministic 32 character GUID for a project relative path."""
    digest = hashlib.md5(("ibs3d::" + relative_path.replace("\\", "/")).encode("utf-8")).hexdigest()
    return digest


def write_if_missing(path: pathlib.Path, content: str) -> bool:
    if path.exists():
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def meta_for(relative_path: str, is_folder: bool) -> str:
    guid = guid_for(relative_path)
    if is_folder:
        return (
            "fileFormatVersion: 2\n"
            f"guid: {guid}\n"
            "folderAsset: yes\n"
            "DefaultImporter:\n"
            "  externalObjects: {}\n"
            "  userData: \n"
            "  assetBundleName: \n"
            "  assetBundleVariant: \n"
        )
    suffix = pathlib.Path(relative_path).suffix.lower()
    if suffix == ".cs":
        importer = (
            "MonoImporter:\n"
            "  externalObjects: {}\n"
            "  serializedVersion: 2\n"
            "  defaultReferences: []\n"
            "  executionOrder: 0\n"
            "  icon: {instanceID: 0}\n"
            "  userData: \n"
            "  assetBundleName: \n"
            "  assetBundleVariant: \n"
        )
    elif suffix == ".asmdef":
        importer = (
            "AssemblyDefinitionImporter:\n"
            "  externalObjects: {}\n"
            "  userData: \n"
            "  assetBundleName: \n"
            "  assetBundleVariant: \n"
        )
    elif suffix in (".json", ".txt", ".md", ".csv"):
        importer = (
            "TextScriptImporter:\n"
            "  externalObjects: {}\n"
            "  userData: \n"
            "  assetBundleName: \n"
            "  assetBundleVariant: \n"
        )
    else:
        importer = (
            "DefaultImporter:\n"
            "  externalObjects: {}\n"
            "  userData: \n"
            "  assetBundleName: \n"
            "  assetBundleVariant: \n"
        )
    return (
        "fileFormatVersion: 2\n"
        f"guid: {guid}\n"
        + importer
    )


def generate_meta_files() -> int:
    created = 0
    for path in sorted(ASSETS.rglob("*")):
        relative = path.relative_to(ROOT).as_posix()
        meta_path = pathlib.Path(str(path) + ".meta")
        if path.is_dir():
            if write_if_missing(meta_path, meta_for(relative, True)):
                created += 1
        elif not path.name.endswith(".meta"):
            if write_if_missing(meta_path, meta_for(relative, False)):
                created += 1
    return created


def generate_asmdefs() -> int:
    created = 0
    for folder, name in ASMDEFS.items():
        references = ", ".join('"%s"' % ref for ref in ASMDEF_REFERENCES[name])
        content = (
            "{\n"
            f'    "name": "{name}",\n'
            '    "rootNamespace": "",\n'
            '    "references": [\n'
            + "".join(f"        {ref},\n" for ref in ASMDEF_REFERENCES[name])
            + "    ],\n"
            '    "includePlatforms": [],\n'
            '    "excludePlatforms": [],\n'
            '    "allowUnsafeCode": false,\n'
            '    "overrideReferences": false,\n'
            '    "precompiledReferences": [],\n'
            '    "autoReferenced": true,\n'
            '    "defineConstraints": [],\n'
            '    "versionDefines": [],\n'
            '    "noEngineReferences": false\n'
            "}\n"
        )
        if write_if_missing(ROOT / folder / (name + ".asmdef"), content):
            created += 1
    return created


SCENES = [
    ("Loading", "Loading.unity"),
    ("MainMenu", "MainMenu.unity"),
    ("BusGarage", "BusGarage.unity"),
    ("MapSelection", "MapSelection.unity"),
    ("CareerMode", "CareerMode.unity"),
    ("Gameplay", "Gameplay.unity"),
    ("Settings", "Settings.unity"),
]

# scene -> list of (GameObject name, script relative path or None, extra components)
SCENE_CONTENT = {
    "Loading": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", ["Camera", "AudioListener"]),
        ("Loading Panel", None, []),
    ],
    "MainMenu": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", ["Camera", "AudioListener"]),
        ("Directional Light", None, ["Light"]),
    ],
    "BusGarage": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", ["Camera", "AudioListener"]),
        ("Directional Light", None, ["Light"]),
    ],
    "MapSelection": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", ["Camera", "AudioListener"]),
        ("Directional Light", None, ["Light"]),
    ],
    "CareerMode": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", ["Camera", "AudioListener"]),
        ("Directional Light", None, ["Light"]),
    ],
    "Settings": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", ["Camera", "AudioListener"]),
        ("Directional Light", None, ["Light"]),
    ],
    "Gameplay": [
        ("GameManager", "Assets/Scripts/Game/GameManager.cs", []),
        ("MapGenerator", "Assets/Scripts/World/MapGenerator.cs", []),
        ("TrafficSystem", "Assets/Scripts/Vehicles/TrafficSystem.cs", []),
        ("PassengerSystem", "Assets/Scripts/Game/PassengerSystem.cs", []),
        ("GpsNavigator", "Assets/Scripts/Game/GpsNavigator.cs", []),
        ("Environment", "Assets/Scripts/World/EnvironmentController.cs", []),
        ("CameraRig", "Assets/Scripts/Game/CameraRig.cs", []),
        ("HudController", "Assets/Scripts/UI/HudController.cs", []),
        ("MenuController", "Assets/Scripts/UI/MenuController.cs", []),
        ("Main Camera", None, ["Camera", "AudioListener"]),
        ("Directional Light", None, ["Light"]),
    ],
}


def scene_yaml(name: str) -> str:
    lines = []
    lines.append("%YAML 1.1")
    lines.append("%TAG !u! tag:unity3d.com,2011:")
    lines.append("--- !u!29 &1")
    lines.append("OcclusionCullingSettings:")
    lines.append("  m_ObjectHideFlags: 0")
    lines.append("  serializedVersion: 2")
    lines.append("  m_OcclusionBakeSettings:")
    lines.append("    smallestOccluder: 5")
    lines.append("    smallestHole: 0.25")
    lines.append("    backfaceThreshold: 100")
    lines.append("  m_SceneGUID: 00000000000000000000000000000000")
    lines.append("  m_OcclusionCullingData: {fileID: 0}")
    lines.append("--- !u!104 &2")
    lines.append("RenderSettings:")
    lines.append("  m_ObjectHideFlags: 0")
    lines.append("  serializedVersion: 9")
    lines.append("  m_Fog: 1")
    lines.append("  m_FogColor: {r: 0.5, g: 0.6, b: 0.75, a: 1}")
    lines.append("  m_FogMode: 3")
    lines.append("  m_FogDensity: 0.01")
    lines.append("  m_LinearFogStart: 0")
    lines.append("  m_LinearFogEnd: 300")
    lines.append("  m_AmbientSkyColor: {r: 0.6, g: 0.72, b: 0.88, a: 1}")
    lines.append("  m_AmbientEquatorColor: {r: 0.45, g: 0.47, b: 0.5, a: 1}")
    lines.append("  m_AmbientGroundColor: {r: 0.25, g: 0.26, b: 0.28, a: 1}")
    lines.append("  m_AmbientIntensity: 1")
    lines.append("  m_AmbientMode: 3")
    lines.append("  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}")
    lines.append("  m_SkyboxMaterial: {fileID: 0}")
    lines.append("  m_HaloStrength: 0.5")
    lines.append("  m_FlareStrength: 1")
    lines.append("  m_FlareFadeSpeed: 3")
    lines.append("  m_HaloTexture: {fileID: 0}")
    lines.append("  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}")
    lines.append("  m_DefaultReflectionMode: 0")
    lines.append("  m_DefaultReflectionResolution: 128")
    lines.append("  m_ReflectionBounces: 1")
    lines.append("  m_ReflectionIntensity: 1")
    lines.append("  m_CustomReflection: {fileID: 0}")
    lines.append("  m_Sun: {fileID: 0}")
    lines.append("  m_UseRadianceAmbientProbe: 0")
    lines.append("--- !u!157 &3")
    lines.append("LightmapSettings:")
    lines.append("  m_ObjectHideFlags: 0")
    lines.append("  serializedVersion: 12")
    lines.append("  m_GIWorkflowMode: 1")
    lines.append("  m_GISettings:")
    lines.append("    serializedVersion: 2")
    lines.append("    m_BounceScale: 1")
    lines.append("    m_IndirectOutputScale: 1")
    lines.append("    m_AlbedoBoost: 1")
    lines.append("    m_EnvironmentLightingMode: 0")
    lines.append("    m_EnableBakedLightmaps: 1")
    lines.append("    m_EnableRealtimeLightmaps: 0")
    lines.append("  m_LightmapEditorSettings:")
    lines.append("    serializedVersion: 12")
    lines.append("    m_Resolution: 2")
    lines.append("    m_BakeResolution: 40")
    lines.append("    m_AtlasSize: 1024")
    lines.append("    m_TextureCompression: 1")
    lines.append("    m_FinalGather: 0")
    lines.append("    m_FinalGatherFiltering: 1")
    lines.append("    m_FinalGatherRayCount: 256")
    lines.append("    m_ReflectionCompression: 2")
    lines.append("    m_MixedBakeMode: 2")
    lines.append("    m_BakeBackend: 1")
    lines.append("    m_PVRSampling: 1")
    lines.append("    m_PVRDirectSampleCount: 32")
    lines.append("    m_PVRSampleCount: 512")
    lines.append("    m_PVRBounces: 2")
    lines.append("    m_PVREnvironmentSampleCount: 256")
    lines.append("    m_PVREnvironmentReferencePointCount: 2048")
    lines.append("    m_PVRFilteringMode: 1")
    lines.append("    m_PVRDenoiserTypeDirect: 1")
    lines.append("    m_PVRDenoiserTypeIndirect: 1")
    lines.append("    m_PVRDenoiserTypeAO: 1")
    lines.append("    m_PVRFilterTypeDirect: 0")
    lines.append("    m_PVRFilterTypeIndirect: 0")
    lines.append("    m_PVRFilterTypeAO: 0")
    lines.append("    m_PVREnvironmentMIS: 1")
    lines.append("    m_PVRCulling: 1")
    lines.append("    m_PVRFilteringGaussRadiusDirect: 1")
    lines.append("    m_PVRFilteringGaussRadiusIndirect: 5")
    lines.append("    m_PVRFilteringGaussRadiusAO: 2")
    lines.append("    m_PVRFilteringAtrousPositionSigmaDirect: 0.5")
    lines.append("    m_PVRFilteringAtrousPositionSigmaIndirect: 2")
    lines.append("    m_PVRFilteringAtrousPositionSigmaAO: 1")
    lines.append("    m_ExportTrainingData: 0")
    lines.append("    m_TrainingDataDestination: TrainingData")
    lines.append("    m_LightProbeSampleCountMultiplier: 4")
    lines.append("  m_LightingDataAsset: {fileID: 0}")
    lines.append("  m_LightingSettings: {fileID: 0}")
    lines.append("--- !u!196 &4")
    lines.append("NavMeshSettings:")
    lines.append("  serializedVersion: 2")
    lines.append("  m_ObjectHideFlags: 0")
    lines.append("  m_BuildSettings:")
    lines.append("    serializedVersion: 2")
    lines.append("    agentTypeID: 0")
    lines.append("    agentRadius: 0.5")
    lines.append("    agentHeight: 2")
    lines.append("    agentSlope: 45")
    lines.append("    agentClimb: 0.4")
    lines.append("    ledgeDropHeight: 0")
    lines.append("    maxJumpAcrossDistance: 0")
    lines.append("    minRegionArea: 2")
    lines.append("    manualCellSize: 0")
    lines.append("    cellSize: 0.16666667")
    lines.append("    manualTileSize: 0")
    lines.append("    tileSize: 256")
    lines.append("    accuratePlacement: 0")
    lines.append("    maxJobWorkers: 0")
    lines.append("    preserveTilesOutsideBounds: 0")
    lines.append("    debug:")
    lines.append("      m_Flags: 0")
    lines.append("  m_NavMeshData: {fileID: 0}")

    file_id = 100
    for game_object, script, extras in SCENE_CONTENT.get(name, []):
        transform_id = file_id
        file_id += 1
        game_object_id = file_id
        file_id += 1

        lines.append("--- !u!1 &%d" % game_object_id)
        lines.append("GameObject:")
        lines.append("  m_ObjectHideFlags: 0")
        lines.append("  m_CorrespondingSourceObject: {fileID: 0}")
        lines.append("  m_PrefabInstance: {fileID: 0}")
        lines.append("  m_PrefabAsset: {fileID: 0}")
        lines.append("  serializedVersion: 6")
        lines.append("  m_Component:")
        lines.append("  - component: {fileID: %d}" % transform_id)
        if script:
            lines.append("  - component: {fileID: %d}" % (file_id))
            file_id += 1
        lines.append("  m_Layer: 0")
        lines.append("  m_Name: %s" % game_object)
        lines.append("  m_TagString: Untagged")
        lines.append("  m_Icon: {fileID: 0}")
        lines.append("  m_NavMeshLayer: 0")
        lines.append("  m_StaticEditorFlags: 0")
        lines.append("  m_IsActive: 1")

        lines.append("--- !u!4 &%d" % transform_id)
        lines.append("Transform:")
        lines.append("  m_ObjectHideFlags: 0")
        lines.append("  m_CorrespondingSourceObject: {fileID: 0}")
        lines.append("  m_PrefabInstance: {fileID: 0}")
        lines.append("  m_PrefabAsset: {fileID: 0}")
        lines.append("  m_GameObject: {fileID: %d}" % game_object_id)
        lines.append("  serializedVersion: 2")
        lines.append("  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}")
        lines.append("  m_LocalPosition: {x: 0, y: 0, z: 0}")
        lines.append("  m_LocalScale: {x: 1, y: 1, z: 1}")
        lines.append("  m_ConstrainProportionsScale: 0")
        lines.append("  m_Children: []")
        lines.append("  m_Father: {fileID: 0}")
        lines.append("  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}")

        if script:
            script_guid = guid_for(script)
            lines.append("--- !u!114 &%d" % (file_id - 1))
            lines.append("MonoBehaviour:")
            lines.append("  m_ObjectHideFlags: 0")
            lines.append("  m_CorrespondingSourceObject: {fileID: 0}")
            lines.append("  m_PrefabInstance: {fileID: 0}")
            lines.append("  m_PrefabAsset: {fileID: 0}")
            lines.append("  m_GameObject: {fileID: %d}" % game_object_id)
            lines.append("  m_Enabled: 1")
            lines.append("  m_EditorHideFlags: 0")
            lines.append("  m_Script: {fileID: 11500000, guid: %s, type: 3}" % script_guid)
            lines.append("  m_Name: ")
            lines.append("  m_EditorClassIdentifier: ")

        for extra in extras:
            if extra == "Camera":
                lines.append("--- !u!20 &%d" % file_id)
                lines.append("Camera:")
                lines.append("  m_ObjectHideFlags: 0")
                lines.append("  m_CorrespondingSourceObject: {fileID: 0}")
                lines.append("  m_PrefabInstance: {fileID: 0}")
                lines.append("  m_PrefabAsset: {fileID: 0}")
                lines.append("  m_GameObject: {fileID: %d}" % game_object_id)
                lines.append("  m_Enabled: 1")
                lines.append("  serializedVersion: 2")
                lines.append("  m_ClearFlags: 2")
                lines.append("  m_BackGroundColor: {r: 0.38, g: 0.49, b: 0.63, a: 1}")
                lines.append("  m_projectionMatrixMode: 1")
                lines.append("  m_GateFitMode: 2")
                lines.append("  m_FOVAxisMode: 0")
                lines.append("  m_SensorSize: {x: 36, y: 24}")
                lines.append("  m_LensShift: {x: 0, y: 0}")
                lines.append("  m_FocalLength: 50")
                lines.append("  m_NormalizedViewPortRect:")
                lines.append("    serializedVersion: 2")
                lines.append("    x: 0")
                lines.append("    y: 0")
                lines.append("    width: 1")
                lines.append("    height: 1")
                lines.append("  near clip plane: 0.3")
                lines.append("  far clip plane: 2000")
                lines.append("  field of view: 62")
                lines.append("  orthographic: 0")
                lines.append("  orthographic size: 5")
                lines.append("  m_Depth: -1")
                lines.append("  m_CullingMask:")
                lines.append("    serializedVersion: 2")
                lines.append("    m_Bits: 4294967295")
                lines.append("  m_RenderingPath: -1")
                lines.append("  m_TargetTexture: {fileID: 0}")
                lines.append("  m_TargetDisplay: 0")
                lines.append("  m_TargetEye: 3")
                lines.append("  m_HDR: 1")
                lines.append("  m_AllowMSAA: 1")
                lines.append("  m_AllowDynamicResolution: 0")
                lines.append("  m_ForceIntoRT: 0")
                lines.append("  m_OcclusionCulling: 1")
                lines.append("  m_StereoConvergence: 10")
                lines.append("  m_StereoSeparation: 0.022")
                file_id += 1
            elif extra == "AudioListener":
                lines.append("--- !u!81 &%d" % file_id)
                lines.append("AudioListener:")
                lines.append("  m_ObjectHideFlags: 0")
                lines.append("  m_CorrespondingSourceObject: {fileID: 0}")
                lines.append("  m_PrefabInstance: {fileID: 0}")
                lines.append("  m_PrefabAsset: {fileID: 0}")
                lines.append("  m_GameObject: {fileID: %d}" % game_object_id)
                lines.append("  m_Enabled: 1")
                file_id += 1
            elif extra == "Light":
                lines.append("--- !u!108 &%d" % file_id)
                lines.append("Light:")
                lines.append("  m_ObjectHideFlags: 0")
                lines.append("  m_CorrespondingSourceObject: {fileID: 0}")
                lines.append("  m_PrefabInstance: {fileID: 0}")
                lines.append("  m_PrefabAsset: {fileID: 0}")
                lines.append("  m_GameObject: {fileID: %d}" % game_object_id)
                lines.append("  m_Enabled: 1")
                lines.append("  serializedVersion: 10")
                lines.append("  m_Type: 1")
                lines.append("  m_Shape: 0")
                lines.append("  m_Color: {r: 1, g: 0.96, b: 0.84, a: 1}")
                lines.append("  m_Intensity: 1.1")
                lines.append("  m_Range: 10")
                lines.append("  m_SpotAngle: 30")
                lines.append("  m_InnerSpotAngle: 21.80208")
                lines.append("  m_CookieSize: 10")
                lines.append("  m_Shadows:")
                lines.append("    m_Type: 2")
                lines.append("    m_Resolution: -1")
                lines.append("    m_CustomResolution: -1")
                lines.append("    m_Strength: 1")
                lines.append("    m_Bias: 0.05")
                lines.append("    m_NormalBias: 0.4")
                lines.append("    m_NearPlane: 0.2")
                lines.append("  m_Cookie: {fileID: 0}")
                lines.append("  m_DrawHalo: 0")
                lines.append("  m_Flare: {fileID: 0}")
                lines.append("  m_RenderMode: 0")
                lines.append("  m_CullingMask:")
                lines.append("    serializedVersion: 2")
                lines.append("    m_Bits: 4294967295")
                lines.append("  m_RenderingLayerMask: 1")
                lines.append("  m_Lightmapping: 4")
                lines.append("  m_LightShadowCasterMode: 0")
                lines.append("  m_AreaSize: {x: 1, y: 1}")
                lines.append("  m_BounceIntensity: 1")
                lines.append("  m_ColorTemperature: 6570")
                lines.append("  m_UseColorTemperature: 0")
                lines.append("  m_BoundingSphereOverride: {x: 0, y: 0, z: 0, w: 0}")
                lines.append("  m_UseBoundingSphereOverride: 0")
                lines.append("  m_UseViewFrustumForShadowCasterCull: 1")
                lines.append("  m_ShadowRadius: 0")
                lines.append("  m_ShadowAngle: 0")
                file_id += 1

    return "\n".join(lines) + "\n"


def generate_scenes() -> int:
    created = 0
    scenes_dir = ASSETS / "Scenes"
    scenes_dir.mkdir(parents=True, exist_ok=True)
    for name, file_name in SCENES:
        path = scenes_dir / file_name
        if not path.exists():
            path.write_text(scene_yaml(name), encoding="utf-8")
            created += 1
    return created


def generate_build_settings() -> int:
    entries = []
    for index, (name, file_name) in enumerate(SCENES):
        entries.append((index, file_name, name))
    lines = [
        "%YAML 1.1",
        "%TAG !u! tag:unity3d.com,2011:",
        "--- !u!1045 &1",
        "EditorBuildSettings:",
        "  m_ObjectHideFlags: 0",
        "  serializedVersion: 2",
        "  m_Scenes:",
    ]
    for index, file_name, name in entries:
        lines.append("  - enabled: 1")
        lines.append("    path: Assets/Scenes/%s" % file_name)
        lines.append("    guid: %s" % guid_for("Assets/Scenes/%s" % file_name))
    lines.append("  m_configObjects: {}")
    path = ROOT / "ProjectSettings" / "EditorBuildSettings.asset"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 1


def generate_project_settings() -> int:
    path = ROOT / "ProjectSettings" / "ProjectVersion.txt"
    write_if_missing(path, "m_EditorVersion: %s\nm_EditorVersionWithRevision: %s (%s)\n" % (
        UNITY_VERSION, UNITY_VERSION, "00000000000000000000000000000000"))

    settings = ROOT / "ProjectSettings" / "ProjectSettings.asset"
    content = """%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!129 &1
PlayerSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 26
  productGUID: {fileID: 0}
  AndroidProfiler: 0
  AndroidFilterTouchesWhenObscured: 0
  AndroidEnableSustainedPerformanceMode: 0
  defaultScreenOrientation: 1
  targetDevice: 2
  useOnDemandResources: 0
  accelerometerFrequency: 60
  companyName: {company}
  productName: {product}
  defaultCursor: {fileID: 0}
  cursorHotspot: {x: 0, y: 0}
  m_SplashScreenBackgroundColor: {r: 0.09, g: 0.13, b: 0.18, a: 1}
  m_ShowUnitySplashScreen: 0
  m_ShowUnitySplashLogo: 0
  m_SplashScreenOverlayOpacity: 1
  m_SplashScreenAnimation: 1
  m_SplashScreenLogoStyle: 1
  m_SplashScreenDrawMode: 0
  m_SplashScreenBackgroundAnimationZoom: 1
  m_SplashScreenLogoAnimationZoom: 1
  m_SplashScreenBackgroundLandscapeAspect: 1
  m_SplashScreenBackgroundPortraitAspect: 1
  m_SplashScreenBackgroundLandscapeUvs:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  m_SplashScreenBackgroundPortraitUvs:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  m_SplashScreenLogos: []
  m_VirtualRealitySplashScreen: {fileID: 0}
  m_HolographicTrackingLossScreen: {fileID: 0}
  defaultScreenWidth: 1920
  defaultScreenHeight: 1080
  defaultScreenWidthWeb: 1280
  defaultScreenHeightWeb: 720
  m_StereoRenderingPath: 0
  m_ActiveColorSpace: 1
  m_MTRendering: 1
  mipStripping: 0
  numberOfMipsStripped: 0
  m_StackTraceTypes: 010000000100000001000000010000000100000001000000
  iosShowActivityIndicatorOnLoading: -1
  androidShowActivityIndicatorOnLoading: -1
  iosUseCustomAppBackgroundBehavior: 0
  allowedAutorotateToPortrait: 0
  allowedAutorotateToPortraitUpsideDown: 0
  allowedAutorotateToLandscapeRight: 1
  allowedAutorotateToLandscapeLeft: 1
  useOSAutorotation: 1
  use32BitDisplayBuffer: 1
  preserveFramebufferAlpha: 0
  disableDepthAndStencilBuffers: 0
  androidStartInFullscreen: 1
  androidRenderOutsideSafeArea: 1
  androidUseSwappy: 1
  androidBlitType: 0
  androidResizeableActivity: 0
  androidDefaultWindowWidth: 1920
  androidDefaultWindowHeight: 1080
  androidMinimumWindowWidth: 400
  androidMinimumWindowHeight: 300
  androidFullscreenMode: 1
  defaultIsNativeResolution: 1
  macRetinaSupport: 1
  runInBackground: 1
  captureSingleScreen: 0
  muteOtherAudioSources: 0
  Prepare IOS For Recording: 0
  Force IOS Speakers When Recording: 0
  deferSystemGesturesMode: 0
  hideHomeButton: 0
  hideUnitySplashScreen: 0
  showUnitySplashLogo: 0
  androidSupportedAspectRatio: 1
  androidMaxAspectRatio: 2.1
  applicationIdentifier:
    Android: in.indianbus3d.game
    Standalone: in.indianbus3d.game
  buildNumber:
    Standalone: 0
    iPhone: 0
    tvOS: 0
  overrideDefaultApplicationIdentifier: 1
  AndroidBundleVersionCode: 1
  AndroidMinSdkVersion: 24
  AndroidTargetSdkVersion: 0
  AndroidPreferredInstallLocation: 1
  aotOptions:
  stripEngineCode: 1
  iPhoneStrippingLevel: 0
  iPhoneScriptCallOptimization: 0
  ForceInternetPermission: 0
  ForceSDCardPermission: 0
  CreateWallpaper: 0
  APKExpansionFiles: 0
  keepLoadedShadersAlive: 0
  StripUnusedMeshComponents: 1
  VertexChannelCompressionMask: 4054
  iPhoneSdkVersion: 988
  iOSTargetOSVersionString: 12.0
  tvOSSdkVersion: 0
  tvOSRequireExtendedGameController: 0
  tvOSTargetOSVersionString: 12.0
  uIPrerenderedIcon: 0
  uIRequiresPersistentWiFi: 0
  uIRequiresFullScreen: 1
  uIStatusBarStyle: 0
  uIExitOnSuspend: 0
  uIStatusBarVisible: 0
  uIFullScreen: 1
  stripUnityEngineSymbols: 1
  androidEnableArm64: 1
  androidUseCustomKeystore: 0
  m_AndroidBanners: [0, 0, 0, 0, 0, 0, 0, 0]
  m_AndroidBannersDark: [0, 0, 0, 0, 0, 0, 0, 0]
  androidGamepadSupportLevel: 0
  chromeosInputEmulation: 1
  AndroidMinifyRelease: 0
  AndroidMinifyDebug: 0
  AndroidValidateAppBundleSize: 1
  AndroidAppBundleSizeToValidate: 150
  m_BuildTargetIcons: []
  m_BuildTargetPlatformIcons: []
  m_BuildTargetBatching: []
  m_BuildTargetShaderSettings: []
  m_BuildTargetGraphicsJobs: []
  m_BuildTargetGraphicsJobMode: []
  m_BuildTargetGraphicsAPIs: []
  m_BuildTargetVRSettings: []
  openGLRequireES31: 0
  openGLRequireES31AEP: 0
  openGLRequireES32: 0
  m_TemplateCustomTags: {}
  mobileMTRendering:
    Android: 1
    iPhone: 1
    tvOS: 1
  m_BuildTargetGroupLightmapEncodingQuality: []
  m_BuildTargetGroupLightmapSettings: []
  m_BuildTargetNormalMapEncoding: []
  m_BuildTargetDefaultTextureCompressionFormat: []
  playModeTestRunnerEnabled: 0
  runPlayModeTestAsEditModeTest: 0
  actionOnDotNetUnhandledException: 1
  enableInternalProfiler: 0
  logObjCUncaughtExceptions: 1
  enableCrashReportAPI: 0
  cameraUsageDescription:
  locationUsageDescription:
  microphoneUsageDescription:
  bluetoothUsageDescription:
  switchNMETAOverride:
  switchNetLibKey:
  switchSocketMemoryPoolSize: 6144
  switchSocketAllocatorPoolSize: 128
  switchSocketConcurrencyLimit: 14
  switchScreenResolutionBehavior: 2
  switchUseCPUProfiler: 0
  switchEnableFileSystemTrace: 0
  switchUseGOLDLinker: 0
  switchLTOSetting: 0
  switchApplicationID: 0x00000000
  switchNSODependencies:
  switchCompilerFlags:
  switchTitleNames_0:
  switchTitleNames_1:
  switchTitleNames_2:
  switchTitleNames_3:
  switchTitleNames_4:
  switchTitleNames_5:
  switchTitleNames_6:
  switchTitleNames_7:
  switchTitleNames_8:
  switchTitleNames_9:
  switchTitleNames_10:
  switchTitleNames_11:
  switchTitleNames_12:
  switchTitleNames_13:
  switchTitleNames_14:
  switchTitleNames_15:
  switchPublisherNames_0:
  switchPublisherNames_1:
  switchPublisherNames_2:
  switchPublisherNames_3:
  switchPublisherNames_4:
  switchPublisherNames_5:
  switchPublisherNames_6:
  switchPublisherNames_7:
  switchPublisherNames_8:
  switchPublisherNames_9:
  switchPublisherNames_10:
  switchPublisherNames_11:
  switchPublisherNames_12:
  switchPublisherNames_13:
  switchPublisherNames_14:
  switchPublisherNames_15:
  switchIcons_0: {fileID: 0}
  switchIcons_1: {fileID: 0}
  switchIcons_2: {fileID: 0}
  switchIcons_3: {fileID: 0}
  switchIcons_4: {fileID: 0}
  switchIcons_5: {fileID: 0}
  switchIcons_6: {fileID: 0}
  switchIcons_7: {fileID: 0}
  switchIcons_8: {fileID: 0}
  switchIcons_9: {fileID: 0}
  switchIcons_10: {fileID: 0}
  switchIcons_11: {fileID: 0}
  switchIcons_12: {fileID: 0}
  switchIcons_13: {fileID: 0}
  switchIcons_14: {fileID: 0}
  switchIcons_15: {fileID: 0}
  switchSmallIcons_0: {fileID: 0}
  switchSmallIcons_1: {fileID: 0}
  switchSmallIcons_2: {fileID: 0}
  switchSmallIcons_3: {fileID: 0}
  switchSmallIcons_4: {fileID: 0}
  switchSmallIcons_5: {fileID: 0}
  switchSmallIcons_6: {fileID: 0}
  switchSmallIcons_7: {fileID: 0}
  switchSmallIcons_8: {fileID: 0}
  switchSmallIcons_9: {fileID: 0}
  switchSmallIcons_10: {fileID: 0}
  switchSmallIcons_11: {fileID: 0}
  switchSmallIcons_12: {fileID: 0}
  switchSmallIcons_13: {fileID: 0}
  switchSmallIcons_14: {fileID: 0}
  switchSmallIcons_15: {fileID: 0}
  switchManualHTML:
  switchAccessibleURLs:
  switchLegalInformation:
  switchMainThreadStackSize: 1048576
  switchPresenceGroupId:
  switchLogoHandling: 0
  switchReleaseVersion: 0
  switchDisplayVersion: 1.0.0
  switchStartupUserAccount: 0
  switchSupportedLanguagesMask: 0
  switchLogoType: 0
  switchApplicationErrorCodeCategory:
  switchUserAccountSaveDataSize: 0
  switchUserAccountSaveDataJournalSize: 0
  switchApplicationAttribute: 0
  switchCardSpecSize: -1
  switchCardSpecClock: -1
  switchRatingsMask: 0
  switchRatingsInt_0: 0
  switchRatingsInt_1: 0
  switchRatingsInt_2: 0
  switchRatingsInt_3: 0
  switchRatingsInt_4: 0
  switchRatingsInt_5: 0
  switchRatingsInt_6: 0
  switchRatingsInt_7: 0
  switchRatingsInt_8: 0
  switchRatingsInt_9: 0
  switchRatingsInt_10: 0
  switchRatingsInt_11: 0
  switchLocalCommunicationIds_0:
  switchLocalCommunicationIds_1:
  switchLocalCommunicationIds_2:
  switchLocalCommunicationIds_3:
  switchLocalCommunicationIds_4:
  switchLocalCommunicationIds_5:
  switchLocalCommunicationIds_6:
  switchLocalCommunicationIds_7:
  switchParentalControl: 0
  switchAllowsScreenshot: 1
  switchAllowsVideoCapturing: 1
  switchAllowsRuntimeAddOnContentInstall: 0
  switchDataLossConfirmation: 0
  switchUserAccountLockEnabled: 0
  switchSupportedNpadStyles: 3
  switchNativeFsCacheSize: 32
  switchIsHoldTypeHorizontal: 0
  switchSupportedNpadCount: 8
  switchSocketConfigEnabled: 0
  switchTcpInitialSendBufferSize: 32
  switchTcpInitialReceiveBufferSize: 64
  switchTcpAutoSendBufferSize: 0
  switchTcpAutoReceiveBufferSize: 0
  switchUdpSendBufferSize: 9
  switchUdpReceiveBufferSize: 42
  switchSocketBufferEfficiency: 4
  switchSocketInitializeEnabled: 1
  switchNetworkInterfaceManagerInitializeEnabled: 1
  switchPlayerConnectionEnabled: 1
  ps4NPAgeRating: 12
  ps4NPTitleSecret:
  ps4ParentalLevel: 11
  ps4ContentID:
  ps4Category: 0
  ps4MasterVersion: 01.00
  ps4AppVersion: 01.00
  ps4AppType: 0
  ps4ParamSfxPath:
  ps4VideoOutPixelFormat: 0
  ps4VideoOutInitialWidth: 1920
  ps4VideoOutBaseModeInitialWidth: 1920
  ps4VideoOutReprojectionRate: 60
  ps4PronunciationXMLPath:
  ps4PronunciationSIGPath:
  ps4BackgroundImagePath:
  ps4StartupImagePath:
  ps4SaveDataImagePath:
  ps4SdkOverride: 0
  ps4BGMPath:
  ps4ShareFilePath:
  ps4ShareOverlayImagePath:
  ps4PrivacyGuardImagePath:
  ps4ExtraSceSysFile:
  ps4NPtitleDatPath:
  ps4RemotePlayKeyAssignment: -1
  ps4RemotePlayKeyMappingDir:
  ps4PlayTogetherPlayerCount: 0
  ps4EnterButtonAssignment: 1
  ps4ApplicationParam1: 0
  ps4ApplicationParam2: 0
  ps4ApplicationParam3: 0
  ps4ApplicationParam4: 0
  ps4DownloadDataSize: 0
  ps4GarlicHeapSize: 2048
  ps4ProGarlicHeapSize: 2560
  playerPrefsMaxSize: 32768
  ps4Passcode:
  ps4pnSessions: 1
  ps4pnPresence: 1
  ps4pnFriends: 1
  ps4pnGameCustomData: 1
  playerPrefsSupport: 0
  enableApplicationExit: 0
  resetTempFolder: 1
  restrictedAudioUsageRights: 0
  ps4UseResolutionFallback: 0
  ps4ReprojectionSupport: 0
  ps4UseAudio3dBackend: 0
  ps4SocialScreenEnabled: 0
  ps4ScriptOptimizationLevel: 0
  ps4Audio3dBackend: 1
  ps4attribCpuUsage: 0
  ps4PatchPkgPath:
  ps4PatchLatestPkgPath:
  ps4PatchChangeinfoPath:
  ps4PatchDayOne: 0
  ps4attribUserManagement: 0
  ps4attribMoveSupport: 0
  ps4attrib3DSupport: 0
  ps4attribShareSupport: 0
  ps4attribExclusiveVR: 0
  ps4disableAutoHideSplash: 0
  ps4videoRecordingFeaturesUsed: 0
  ps4contentSearchFeaturesUsed: 0
  ps4attribEyeToEyeDistanceSettingVR: 0
  ps4IncludedModules: []
  ps4attribVROutputEnabled: 0
  monoEnv:
  splashScreenBackgroundSourceLandscape: {fileID: 0}
  splashScreenBackgroundSourcePortrait: {fileID: 0}
  blurSplashScreenBackground: 1
  spritePackerPolicy:
  webGLMemorySize: 16
  webGLExceptionSupport: 1
  webGLNameFilesAsHashes: 0
  webGLDataCaching: 1
  webGLDebugSymbols: 0
  webGLEmscriptenArgs:
  webGLModulesDirectory:
  webGLTemplate: APPLICATION:Default
  webGLAnalyzeBuildSize: 0
  webGLUseEmbeddedResources: 0
  webGLCompressionFormat: 1
  webGLLinkerTarget: 1
  webGLThreadsSupport: 0
  webGLDecompressionFallback: 0
  webGLInitialMemorySize: 32
  webGLMaximumMemorySize: 2048
  webGLMemoryGrowthMode: 2
  webGLMemoryLinearGrowthStep: 16
  webGLMemoryGeometricGrowthStep: 0.2
  webGLMemoryGeometricGrowthCap: 96
  webGLPowerPreference: 2
  scriptingDefineSymbols: {}
  platformArchitecture: {}
  scriptingBackend: {}
  il2cppCompilerConfiguration: {}
  il2cppCodeGeneration: {}
  managedStrippingLevel:
    EmbeddedLinux: 1
    GameCoreScarlett: 1
    GameCoreXboxOne: 1
    Lumin: 1
    Nintendo Switch: 1
    PS4: 1
    PS5: 1
    QNX: 1
    Stadia: 1
    VisionOS: 1
    WebGL: 1
    Windows Store Apps: 1
    XboxOne: 1
    iPhone: 1
    tvOS: 1
  activeInputHandler: 0
  windowsGamepadBackendHint: 0
  cloudProjectId:
  framebufferDepthMemorylessMode: 0
  qualitySettingsNames: []
  projectName:
  organizationId:
  cloudEnabled: 0
  legacyClampBlendShapeWeights: 0
  virtualTexturingSupportEnabled: 0
  insecureHttpOption: 0
""".replace("{company}", COMPANY_NAME).replace("{product}", PRODUCT_NAME)
    settings.parent.mkdir(parents=True, exist_ok=True)
    if not settings.exists():
        settings.write_text(content, encoding="utf-8")
        return 1
    return 0


def generate_manifest() -> int:
    manifest = {
        "dependencies": {
            "com.unity.ide.rider": "3.0.31",
            "com.unity.ide.visualstudio": "2.0.22",
            "com.unity.test-framework": "1.1.33",
            "com.unity.ugui": "1.0.0",
            "com.unity.modules.androidjni": "1.0.0",
            "com.unity.modules.animation": "1.0.0",
            "com.unity.modules.audio": "1.0.0",
            "com.unity.modules.imageconversion": "1.0.0",
            "com.unity.modules.imgui": "1.0.0",
            "com.unity.modules.jsonserialize": "1.0.0",
            "com.unity.modules.particlesystem": "1.0.0",
            "com.unity.modules.physics": "1.0.0",
            "com.unity.modules.screencapture": "1.0.0",
            "com.unity.modules.ui": "1.0.0",
            "com.unity.modules.uielements": "1.0.0",
            "com.unity.modules.umbra": "1.0.0",
            "com.unity.modules.unityanalytics": "1.0.0",
            "com.unity.modules.unitywebrequest": "1.0.0",
            "com.unity.modules.vehicles": "1.0.0",
            "com.unity.modules.video": "1.0.0",
            "com.unity.modules.terrain": "1.0.0",
            "com.unity.modules.terrainphysics": "1.0.0",
            "com.unity.modules.tilemap": "1.0.0",
            "com.unity.modules.ui": "1.0.0",
            "com.unity.modules.umbra": "1.0.0",
            "com.unity.modules.unitywebrequestwww": "1.0.0",
            "com.unity.modules.vehicles": "1.0.0",
            "com.unity.modules.xr": "1.0.0",
        }
    }
    path = ROOT / "Packages" / "manifest.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        return 1
    return 0


def generate_other_settings() -> int:
    created = 0
    settings_dir = ROOT / "ProjectSettings"
    settings_dir.mkdir(parents=True, exist_ok=True)

    simple = {
        "TagManager.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!78 &1\nTagManager:\n"
            "  serializedVersion: 2\n  tags: []\n  layers:\n"
            "  - Default\n  - TransparentFX\n  - Ignore Raycast\n  - \n  - Water\n  - UI\n"
            "  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n"
            "  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n  - \n"
            "  m_SortingLayers:\n  - name: Default\n    uniqueID: 0\n    locked: 0\n"
        ),
        "TimeManager.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!5 &1\nTimeManager:\n"
            "  m_ObjectHideFlags: 0\n  Fixed Timestep: 0.02\n  Maximum Allowed Timestep: 0.33333334\n"
            "  m_TimeScale: 1\n  Maximum Particle Timestep: 0.03\n"
        ),
        "Physics2DSettings.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!19 &1\nPhysics2DSettings:\n"
            "  m_ObjectHideFlags: 0\n  serializedVersion: 4\n  m_Gravity: {x: 0, y: -9.81}\n"
            "  m_DefaultMaterial: {fileID: 0}\n"
        ),
        "AudioManager.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!11 &1\nAudioManager:\n"
            "  m_ObjectHideFlags: 0\n  m_Volume: 1\n  Rolloff Scale: 1\n  Doppler Factor: 1\n"
            "  Default Speaker Mode: 2\n  m_SampleRate: 0\n  m_DSPBufferSize: 1024\n"
            "  m_VirtualVoiceCount: 512\n  m_RealVoiceCount: 32\n  m_SpatializerPlugin:\n"
        ),
        "GraphicsSettings.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!30 &1\nGraphicsSettings:\n"
            "  m_ObjectHideFlags: 0\n  serializedVersion: 13\n  m_Deferred: {fileID: 0}\n"
            "  m_DeferredReflections: {fileID: 0}\n  m_ScreenSpaceShadows: {fileID: 0}\n"
            "  m_LegacyDeferred: {fileID: 0}\n  m_DepthNormals: {fileID: 0}\n"
            "  m_MotionVectors: {fileID: 0}\n  m_LightHalo: {fileID: 0}\n"
            "  m_LensFlare: {fileID: 0}\n  m_AlwaysIncludedShaders: []\n"
            "  m_PreloadedShaders: []\n  m_PreloadShadersBatchTimeLimit: -1\n"
            "  m_SpritesDefaultMaterial: {fileID: 0}\n  m_CustomRenderPipeline: {fileID: 0}\n"
            "  m_TransparencySortMode: 0\n  m_TransparencySortAxis: {x: 0, y: 0, z: 1}\n"
            "  m_DefaultRenderingPath: 1\n  m_DefaultMobileRenderingPath: 1\n"
            "  m_TierSettings: []\n  m_LightmapStripping: 0\n  m_FogStripping: 0\n"
            "  m_InstancingStripping: 0\n  m_LightmapKeepPlain: 1\n  m_LightmapKeepDirCombined: 1\n"
            "  m_LightmapKeepDynamicPlain: 1\n  m_LightmapKeepDynamicDirCombined: 1\n"
            "  m_LightmapKeepShadowMask: 1\n  m_LightmapKeepSubtractive: 1\n"
            "  m_FogKeepLinear: 1\n  m_FogKeepExp: 1\n  m_FogKeepExp2: 1\n"
            "  m_AlbedoSwatchInfos: []\n  m_LightsUseLinearIntensity: 0\n"
            "  m_LightsUseColorTemperature: 0\n  m_DefaultRenderingLayerMask: 1\n"
            "  m_LogWhenShaderIsCompiled: 0\n  m_AllowEnlightenSupportForUpgradedProject: 0\n"
        ),
        "QualitySettings.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!47 &1\nQualitySettings:\n"
            "  m_ObjectHideFlags: 0\n  serializedVersion: 5\n  m_CurrentQuality: 2\n"
            "  m_QualitySettings:\n"
            "  - serializedVersion: 3\n    name: Low\n    pixelLightCount: 1\n"
            "    shadows: 0\n    shadowResolution: 0\n    shadowProjection: 1\n"
            "    shadowCascades: 1\n    shadowDistance: 40\n    shadowNearPlaneOffset: 2\n"
            "    shadowCascade2Split: 0.33333334\n    shadowCascade4Split: {x: 0.067, y: 0.2, z: 0.467}\n"
            "    shadowmaskMode: 0\n    skinWeights: 2\n    textureQuality: 2\n"
            "    anisotropicTextures: 0\n    antiAliasing: 0\n    softParticles: 0\n"
            "    softVegetation: 0\n    realtimeReflectionProbes: 0\n    billboardsFaceCameraPosition: 0\n"
            "    useLegacyDetailDistribution: 1\n    vSyncCount: 0\n    lodBias: 0.7\n"
            "    maximumLODLevel: 0\n    enableLODCrossFade: 1\n    streamingMipmapsActive: 0\n"
            "    streamingMipmapsAddAllCameras: 1\n    streamingMipmapsMemoryBudget: 512\n"
            "    streamingMipmapsRenderersPerFrame: 512\n    streamingMipmapsMaxLevelReduction: 2\n"
            "    streamingMipmapsMaxFileIORequests: 1024\n    particleRaycastBudget: 4096\n"
            "    asyncUploadTimeSlice: 2\n    asyncUploadBufferSize: 16\n"
            "    asyncUploadPersistentBuffer: 1\n    resolutionScalingFixedDPIFactor: 1\n"
            "    excludedTargetPlatforms: []\n"
            "  - serializedVersion: 3\n    name: Medium\n    pixelLightCount: 2\n"
            "    shadows: 1\n    shadowResolution: 1\n    shadowProjection: 1\n"
            "    shadowCascades: 2\n    shadowDistance: 70\n    shadowNearPlaneOffset: 2\n"
            "    shadowCascade2Split: 0.33333334\n    shadowCascade4Split: {x: 0.067, y: 0.2, z: 0.467}\n"
            "    shadowmaskMode: 0\n    skinWeights: 2\n    textureQuality: 2\n"
            "    anisotropicTextures: 0\n    antiAliasing: 2\n    softParticles: 0\n"
            "    softVegetation: 0\n    realtimeReflectionProbes: 0\n    billboardsFaceCameraPosition: 0\n"
            "    useLegacyDetailDistribution: 1\n    vSyncCount: 0\n    lodBias: 0.8\n"
            "    maximumLODLevel: 0\n    enableLODCrossFade: 1\n    streamingMipmapsActive: 0\n"
            "    streamingMipmapsAddAllCameras: 1\n    streamingMipmapsMemoryBudget: 512\n"
            "    streamingMipmapsRenderersPerFrame: 512\n    streamingMipmapsMaxLevelReduction: 2\n"
            "    streamingMipmapsMaxFileIORequests: 1024\n    particleRaycastBudget: 4096\n"
            "    asyncUploadTimeSlice: 2\n    asyncUploadBufferSize: 16\n"
            "    asyncUploadPersistentBuffer: 1\n    resolutionScalingFixedDPIFactor: 1\n"
            "    excludedTargetPlatforms: []\n"
            "  - serializedVersion: 3\n    name: High\n    pixelLightCount: 4\n"
            "    shadows: 2\n    shadowResolution: 2\n    shadowProjection: 1\n"
            "    shadowCascades: 4\n    shadowDistance: 120\n    shadowNearPlaneOffset: 2\n"
            "    shadowCascade2Split: 0.33333334\n    shadowCascade4Split: {x: 0.067, y: 0.2, z: 0.467}\n"
            "    shadowmaskMode: 1\n    skinWeights: 4\n    textureQuality: 0\n"
            "    anisotropicTextures: 1\n    antiAliasing: 2\n    softParticles: 1\n"
            "    softVegetation: 1\n    realtimeReflectionProbes: 0\n    billboardsFaceCameraPosition: 1\n"
            "    useLegacyDetailDistribution: 1\n    vSyncCount: 0\n    lodBias: 1\n"
            "    maximumLODLevel: 0\n    enableLODCrossFade: 1\n    streamingMipmapsActive: 0\n"
            "    streamingMipmapsAddAllCameras: 1\n    streamingMipmapsMemoryBudget: 512\n"
            "    streamingMipmapsRenderersPerFrame: 512\n    streamingMipmapsMaxLevelReduction: 2\n"
            "    streamingMipmapsMaxFileIORequests: 1024\n    particleRaycastBudget: 4096\n"
            "    asyncUploadTimeSlice: 2\n    asyncUploadBufferSize: 16\n"
            "    asyncUploadPersistentBuffer: 1\n    resolutionScalingFixedDPIFactor: 1\n"
            "    excludedTargetPlatforms: []\n"
            "  - serializedVersion: 3\n    name: Ultra\n    pixelLightCount: 4\n"
            "    shadows: 2\n    shadowResolution: 2\n    shadowProjection: 1\n"
            "    shadowCascades: 4\n    shadowDistance: 160\n    shadowNearPlaneOffset: 2\n"
            "    shadowCascade2Split: 0.33333334\n    shadowCascade4Split: {x: 0.067, y: 0.2, z: 0.467}\n"
            "    shadowmaskMode: 1\n    skinWeights: 4\n    textureQuality: 0\n"
            "    anisotropicTextures: 2\n    antiAliasing: 4\n    softParticles: 1\n"
            "    softVegetation: 1\n    realtimeReflectionProbes: 1\n    billboardsFaceCameraPosition: 1\n"
            "    useLegacyDetailDistribution: 1\n    vSyncCount: 0\n    lodBias: 1.2\n"
            "    maximumLODLevel: 0\n    enableLODCrossFade: 1\n    streamingMipmapsActive: 0\n"
            "    streamingMipmapsAddAllCameras: 1\n    streamingMipmapsMemoryBudget: 512\n"
            "    streamingMipmapsRenderersPerFrame: 512\n    streamingMipmapsMaxLevelReduction: 2\n"
            "    streamingMipmapsMaxFileIORequests: 1024\n    particleRaycastBudget: 4096\n"
            "    asyncUploadTimeSlice: 2\n    asyncUploadBufferSize: 16\n"
            "    asyncUploadPersistentBuffer: 1\n    resolutionScalingFixedDPIFactor: 1\n"
            "    excludedTargetPlatforms: []\n"
            "  m_PerPlatformDefaultQuality:\n    Android: 2\n    Lumin: 2\n    Nintendo Switch: 2\n"
            "    PS4: 2\n    Server: 0\n    Standalone: 2\n    WebGL: 2\n    Windows Store Apps: 2\n"
            "    iPhone: 2\n    tvOS: 2\n"
        ),
        "EditorSettings.asset": (
            "%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!159 &1\nEditorSettings:\n"
            "  m_ObjectHideFlags: 0\n  serializedVersion: 11\n"
            "  m_SerializationMode: 2\n  m_LineEndingsForNewScripts: 2\n"
            "  m_DefaultBehaviorMode: 0\n  m_PrefabRegularEnvironment: {fileID: 0}\n"
            "  m_PrefabUIEnvironment: {fileID: 0}\n  m_SpritePackerMode: 0\n"
            "  m_SpritePackerPaddingPower: 1\n  m_EtcTextureCompressorBehavior: 1\n"
            "  m_EtcTextureFastCompressor: 1\n  m_EtcTextureNormalCompressor: 2\n"
            "  m_EtcTextureBestCompressor: 4\n  m_ProjectGenerationIncludedExtensions: txt;xml;fnt;cd;asmdef;rsp\n"
            "  m_ProjectGenerationRootNamespace:\n  m_EnableTextureStreamingInPlayMode: 1\n"
            "  m_AsyncShaderCompilation: 1\n  m_CachingShaderPreprocessor: 1\n"
            "  m_PrefabModeAllowAutoSave: 1\n  m_EnterPlayModeOptionsEnabled: 0\n"
            "  m_EnterPlayModeOptions: 3\n  m_GameObjectNamingDigits: 1\n  m_GameObjectNamingScheme: 0\n"
            "  m_AssetNamingUsesSpace: 1\n  m_InspectorUseIMGUIDefaultInspector: 0\n"
            "  m_UseLegacyProbeSampleCount: 0\n  m_SerializeInlineMappingsOnOneLine: 1\n"
            "  m_DisableCookiesInLightmapper: 1\n  m_AssetPipelineMode: 1\n"
            "  m_CacheServerMode: 0\n  m_CacheServerEndpoint:\n  m_CacheServerNamespacePrefix: default\n"
            "  m_CacheServerEnableDownload: 1\n  m_CacheServerEnableUpload: 1\n"
            "  m_CacheServerEnableAuth: 0\n  m_CacheServerEnableTls: 0\n"
        ),
    }
    for name, content in simple.items():
        if write_if_missing(settings_dir / name, content):
            created += 1
    return created


def main() -> int:
    metas = generate_meta_files()
    asmdefs = generate_asmdefs()
    scenes = generate_scenes()
    generate_build_settings()
    generate_project_settings()
    generate_manifest()
    others = generate_other_settings()
    print("meta files created : %d" % metas)
    print("asmdefs created    : %d" % asmdefs)
    print("scenes created     : %d" % scenes)
    print("settings created   : %d" % (others + generate_project_settings()))
    print("package manifest   : %s" % (ROOT / "Packages" / "manifest.json"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
