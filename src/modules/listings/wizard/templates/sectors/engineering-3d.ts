import type { WizardQuestion } from "../types";

export const engineering3dQuestions: WizardQuestion[] = [
  {
    key: "cadInputStatus",
    type: "single",
    required: true,
    labelKey: "Mevcut Çizim ve Girdi Verisi",
    labelEn: "Input Drawings & Baseline Assets",
    clarityWeight: 10,
    helpTip: "Model için kullanılacak mevcut çizim durumunu belirtin.",
    helpTipEn: "Clarify input data readiness.",
    options: [
      {
        value: "cad_dwg_ready",
        label: "2D Mimari Çizimler (AutoCAD DWG / PDF) Eksiksiz Hazır",
        labelEn: "2D CAD Blueprints (DWG / PDF) Ready",
      },
      {
        value: "hand_sketches_photos",
        label: "Yalnızca El Çizimi veya Referans Fotoğraflar Mevcut",
        labelEn: "Hand Sketches or Reference Photos Only",
      },
      {
        value: "site_measurements_needed",
        label: "Saha Ölçüleri Alınmalı / Röleve Çıkarılmalı",
        labelEn: "Site Survey / Physical Measurements Needed",
      },
    ],
  },
  {
    key: "targetApplication",
    type: "single",
    required: true,
    labelKey: "3D Çıktının Kullanım Amacı",
    labelEn: "Target 3D Application",
    clarityWeight: 10,
    helpTip: "Modelin render mı yoksa imalat mı için olduğunu belirleyin.",
    helpTipEn: "Specify final application.",
    options: [
      {
        value: "photoreal_architectural_render",
        label: "Mimari / Ürün Görselleştirme (Fotogerçekçi Render)",
        labelEn: "Architectural / Product Photorealistic Rendering",
      },
      {
        value: "parametric_cad_mfg",
        label: "3D Baskı ve İmalat İçin Parametrik CAD (STEP / IGES / STL)",
        labelEn: "Parametric CAD for Manufacturing (STEP/IGES/STL)",
      },
      {
        value: "realtime_game_engine",
        label: "Oyun Motoru / AR-VR İçin Düşük Poligon (Low-Poly / GLTF)",
        labelEn: "Realtime Game Engine / AR-VR (Low-Poly / GLTF)",
      },
      {
        value: "mechanical_assembly_simulation",
        label: "Montaj Animasyonu ve Mukavemet (FEA) Simülasyonu",
        labelEn: "Mechanical Assembly Animation & FEA Simulation",
      },
    ],
  },
  {
    key: "softwarePreference",
    type: "single",
    required: true,
    labelKey: "Yazılım ve Motor Tercihi",
    labelEn: "Target Software / Engine",
    clarityWeight: 10,
    helpTip: "Hangi yazılım formatında teslim istediğinizi seçin.",
    helpTipEn: "Select preferred CAD/3D software.",
    options: [
      {
        value: "bim_revit_archicad",
        label: "BIM Standartları (Autodesk Revit / ArchiCAD)",
        labelEn: "BIM Platforms (Autodesk Revit / ArchiCAD)",
      },
      {
        value: "blender_3dsmax_vray",
        label: "Görselleştirme (Blender / 3ds Max / Corona / V-Ray)",
        labelEn: "Visualization (Blender / 3ds Max / Corona / V-Ray)",
      },
      {
        value: "solidworks_fusion_rhino",
        label: "Endüstriyel CAD (SolidWorks / Fusion 360 / Rhino)",
        labelEn: "Industrial CAD (SolidWorks / Fusion 360 / Rhino)",
      },
      {
        value: "unreal_engine_unity",
        label: "Gerçek Zamanlı Motor (Unreal Engine 5 / Unity)",
        labelEn: "Realtime Engine (Unreal Engine 5 / Unity)",
      },
    ],
  },
  {
    key: "reviewRounds3D",
    type: "single",
    required: true,
    labelKey: "Doku & Kamera Açısı Revizyon Sınırı",
    labelEn: "Texture & Camera Revision Rounds",
    clarityWeight: 10,
    helpTip: "Render ve modelleme revizyon hakkını belirleyin.",
    helpTipEn: "Set 3D rendering revision limits.",
    options: [
      {
        value: "two_rounds_lighting_texture",
        label: "2 Tur Malzeme, Doku ve Kamera Açısı Revizyonu Dahil",
        labelEn: "2 Rounds of Materials, Camera & Lighting Revisions",
      },
      {
        value: "three_rounds_detailed",
        label: "3 Tur Kapsamlı Detay Revizyonu Dahil",
        labelEn: "3 Comprehensive Revision Iterations Included",
      },
      {
        value: "clay_render_signoff_first",
        label: "Önce Kaba Model (Clay Render) Onayı, Ardından Final Doku Teslimi",
        labelEn: "Clay Model Approval Signoff First, Then Final Texturing",
      },
    ],
  },
];
