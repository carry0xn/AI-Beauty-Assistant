import math
from statistics import median

import cv2
import numpy as np
from mediapipe import Image as MpImage
from mediapipe import ImageFormat
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from pathlib import Path

from app.analysis.knowledge import build_face_recommendations
from app.config import FACE_LANDMARKER_MODEL, KNOWLEDGE_PDF_DIR

_landmarker = None


def _get_landmarker():
    global _landmarker
    if _landmarker is None:
        base = mp_python.BaseOptions(model_asset_path=FACE_LANDMARKER_MODEL)
        options = vision.FaceLandmarkerOptions(base_options=base, num_faces=1)
        _landmarker = vision.FaceLandmarker.create_from_options(options)
    return _landmarker


def _dist(a, b, width, height):
    return float(np.hypot((a.x - b.x) * width, (a.y - b.y) * height))


def _sample_patch(img, x, y, radius=6):
    h, w = img.shape[:2]
    x0, x1 = max(0, int(x) - radius), min(w, int(x) + radius)
    y0, y1 = max(0, int(y) - radius), min(h, int(y) + radius)
    patch = img[y0:y1, x0:x1]
    if patch.size == 0:
        return np.array([0, 0, 0], dtype=np.float64)
    return patch.mean(axis=(0, 1))


def _bgr_to_lab(bgr):
    px = np.uint8([[[int(bgr[0]), int(bgr[1]), int(bgr[2])]]])
    lab = cv2.cvtColor(px, cv2.COLOR_BGR2LAB)[0][0]
    return [
        round(float(lab[0]) * 100.0 / 255.0, 1),
        round(float(lab[1]) - 128.0, 1),
        round(float(lab[2]) - 128.0, 1),
    ]


def _classify_skin_tone(lab):
    l, a, b = lab
    if l > 70:
        tone = "light"
    elif l > 58:
        tone = "medium-light"
    elif l > 45:
        tone = "medium"
    elif l > 35:
        tone = "tan"
    else:
        tone = "deep"

    if b - a > 3:
        undertone = "warm"
    elif a - b > 3:
        undertone = "cool"
    else:
        undertone = "neutral"

    return tone, undertone


def _classify_eye_color(bgr, luminance):
    b, g, r = float(bgr[0]), float(bgr[1]), float(bgr[2])
    if luminance < 35:
        return "dark"
    if r / max(b, 1e-6) > 1.15:
        return "brown"
    if b / max(r, 1e-6) > 1.15:
        return "blue"
    if g >= r and g >= b:
        return "green"
    return "hazel"


def _classify_hair_color(bgr):
    b, g, r = float(bgr[0]), float(bgr[1]), float(bgr[2])
    hsv = cv2.cvtColor(
        np.uint8([[[int(b), int(g), int(r)]]]), cv2.COLOR_BGR2HSV
    )[0][0]
    h, s, v = float(hsv[0]), float(hsv[1]), float(hsv[2])
    if v < 40:
        return "black"
    if v > 185 and s < 60:
        return "blonde"
    if v > 200 and s < 30:
        return "gray"
    if h < 15 and s > 90:
        return "red"
    return "brown"


def _classify_face_shape(widths, height):
    forehead, cheek, jaw = widths
    ratio_hw = height / max(cheek, 1e-6)
    ratio_jaw_cheek = jaw / max(cheek, 1e-6)
    ratio_jaw_forehead = jaw / max(forehead, 1e-6)
    ratio_forehead_cheek = forehead / max(cheek, 1e-6)

    if ratio_jaw_cheek >= 0.88 and ratio_hw <= 1.45:
        shape = "square"
    elif ratio_jaw_cheek >= 0.85 and ratio_hw > 1.45:
        shape = "oblong"
    elif ratio_forehead_cheek >= 1.0 and ratio_jaw_cheek <= 0.8:
        shape = "heart"
    elif ratio_hw <= 1.32 and ratio_jaw_cheek >= 0.8:
        shape = "round"
    else:
        shape = "oval"

    return shape, {
        "height_width_ratio": round(ratio_hw, 3),
        "jaw_cheek_ratio": round(ratio_jaw_cheek, 3),
        "jaw_forehead_ratio": round(ratio_jaw_forehead, 3),
        "forehead_cheek_ratio": round(ratio_forehead_cheek, 3),
    }


def _compute_symmetry(landmarks, width, height):
    pairs = [
        (33, 263), (61, 291), (7, 249), (105, 334), (127, 356),
        (70, 300), (234, 454), (132, 361), (172, 397), (93, 323),
    ]
    points = [(p.x * width, p.y * height) for p in landmarks]

    eye_mid = ((points[33][0] + points[263][0]) / 2, (points[33][1] + points[263][1]) / 2)
    mouth_mid = ((points[61][0] + points[291][0]) / 2, (points[61][1] + points[291][1]) / 2)
    angle = math.atan2(eye_mid[0] - mouth_mid[0], eye_mid[1] - mouth_mid[1])
    cos_a, sin_a = math.cos(angle), math.sin(angle)

    def rotate(p):
        return (p[0] * cos_a - p[1] * sin_a, p[0] * sin_a + p[1] * cos_a)

    mids = []
    for left, right in pairs:
        rl = rotate(points[left])
        rr = rotate(points[right])
        mids.append((rl[0] + rr[0]) / 2)

    axis = median(mids)
    deviations = [abs(mid - axis) for mid in mids]
    face_width = abs(rotate(points[234])[0] - rotate(points[454])[0]) or 1e-6
    normalized = float(np.mean(deviations) / face_width)
    score = max(0.0, min(1.0, 1.0 - normalized * 5.0))
    return round(score, 3)


def analyze_face(image_bytes: bytes) -> dict:
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    height, width = img.shape[:2]
    mp_img = MpImage(
        image_format=ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    )
    result = _get_landmarker().detect(mp_img)

    if not result.face_landmarks:
        raise ValueError("No se detectó ningún rostro en la imagen")

    landmarks = result.face_landmarks[0]

    forehead = _dist(landmarks[70], landmarks[300], width, height)
    cheek = _dist(landmarks[234], landmarks[454], width, height)
    jaw = _dist(landmarks[132], landmarks[361], width, height)
    face_height = _dist(landmarks[10], landmarks[152], width, height)

    shape, shape_ratios = _classify_face_shape(
        (forehead, cheek, jaw), face_height
    )

    cheek_a = _sample_patch(img, landmarks[205].x * width, landmarks[205].y * height)
    cheek_b = _sample_patch(img, landmarks[425].x * width, landmarks[425].y * height)
    skin_bgr = (cheek_a + cheek_b) / 2.0
    skin_lab = _bgr_to_lab(skin_bgr)
    skin_tone, undertone = _classify_skin_tone(skin_lab)

    iris_a = _sample_patch(img, landmarks[468].x * width, landmarks[468].y * height, 3)
    iris_b = _sample_patch(img, landmarks[473].x * width, landmarks[473].y * height, 3)
    eye_bgr = (iris_a + iris_b) / 2.0
    eye_luminance = float(np.mean(eye_bgr))
    eye_color = _classify_eye_color(eye_bgr, eye_luminance)

    top_x = int(landmarks[10].x * width)
    top_y = max(0, int(landmarks[10].y * height) - int(height * 0.03))
    hair_bgr = _sample_patch(img, top_x, top_y, 8)
    hair_color = _classify_hair_color(hair_bgr)

    symmetry_score = _compute_symmetry(landmarks, width, height)

    interpupillary = _dist(landmarks[468], landmarks[473], width, height)
    mouth_width = _dist(landmarks[61], landmarks[291], width, height)
    lip_height = _dist(landmarks[0], landmarks[17], width, height)
    nose_width = _dist(landmarks[129], landmarks[358], width, height)
    eye_width_left = _dist(landmarks[33], landmarks[133], width, height)
    eye_width_right = _dist(landmarks[362], landmarks[263], width, height)

    return {
        "kind": "face",
        "model": "mediapipe-face-landmarker-v1",
        "face": {
            "shape": shape,
            "shape_ratios": shape_ratios,
            "symmetry_score": symmetry_score,
            "skin_tone": {
                "tone": skin_tone,
                "undertone": undertone,
                "lab": skin_lab,
            },
            "eye_color": eye_color,
            "hair_color": hair_color,
            "proportions": {
                "interpupillary_ratio": round(interpupillary / max(cheek, 1e-6), 3),
                "mouth_width_ratio": round(mouth_width / max(cheek, 1e-6), 3),
                "lip_height_ratio": round(lip_height / max(face_height, 1e-6), 3),
                "nose_width_ratio": round(nose_width / max(cheek, 1e-6), 3),
                "eye_width_ratio_left": round(eye_width_left / max(cheek, 1e-6), 3),
                "eye_width_ratio_right": round(eye_width_right / max(cheek, 1e-6), 3),
            },
        },
        **build_face_recommendations(
            shape=shape,
            undertone=undertone,
            knowledge_dir=Path(KNOWLEDGE_PDF_DIR),
        ),
    }
