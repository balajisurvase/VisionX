import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Tuple, List, Dict, Any
import cv2
import numpy as np
from PIL import Image, ImageOps
import io

from backend.app.config import UPLOAD_DIR
from backend.app.schemas.document import PreprocessingMetrics, DocumentUploadResponse


def load_image_with_exif(image_bytes: bytes) -> np.ndarray:
    """Reads image bytes, applies EXIF orientation if needed, and returns OpenCV BGR array."""
    pil_image = Image.open(io.BytesIO(image_bytes))
    try:
        pil_image = ImageOps.exif_transpose(pil_image)
    except Exception:
        pass

    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    rgb_array = np.array(pil_image)
    bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    return bgr_array


def calculate_blur_variance(gray: np.ndarray) -> float:
    """Calculates focus sharpness using variance of Laplacian."""
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return float(laplacian.var())


def calculate_glare_score(gray: np.ndarray) -> float:
    """Calculates percentage of pixels near saturation (intensity > 250)."""
    glare_mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY)[1]
    glare_pixels = np.count_nonzero(glare_mask)
    total_pixels = gray.shape[0] * gray.shape[1]
    return float((glare_pixels / total_pixels) * 100.0)


def detect_skew_angle(gray: np.ndarray) -> float:
    """Estimates document skew angle using Canny edges and Hough lines."""
    # Apply Otsu or Canny edge detection
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)

    if lines is None or len(lines) == 0:
        return 0.0

    angles = []
    for line in lines:
        coords = line[0] if hasattr(line, '__len__') and len(line.shape) > 1 else line
        try:
            x1, y1, x2, y2 = int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
        except Exception:
            continue
        if x2 == x1:
            continue
        angle = np.arctan2(y2 - y1, x2 - x1) * 180.0 / np.pi
        # Look for near-horizontal lines (-45 to 45 deg)
        if -45.0 < angle < 45.0:
            angles.append(angle)

    if len(angles) > 0:
        median_angle = float(np.median(angles))
        return median_angle
    return 0.0


def rotate_image(image: np.ndarray, angle: float) -> np.ndarray:
    """Rotates an image by specified angle degrees around center."""
    if abs(angle) < 0.2:
        return image
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        image,
        matrix,
        (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )
    return rotated


def enhance_illumination(bgr: np.ndarray) -> np.ndarray:
    """Normalizes illumination using CLAHE on the L-channel of LAB color space."""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return enhanced


def preprocess_document_image(image_bytes: bytes, filename: str) -> DocumentUploadResponse:
    """Full preprocessing pipeline for incoming identity document."""
    start_time = time.time()
    doc_id = str(uuid.uuid4())
    doc_dir = UPLOAD_DIR / doc_id
    doc_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load image and normalize EXIF orientation
    bgr = load_image_with_exif(image_bytes)
    h, w, c = bgr.shape
    aspect_ratio = round(w / float(h), 4)

    # Save original image
    orig_path = doc_dir / "original.jpg"
    cv2.imwrite(str(orig_path), bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # 2. Grayscale conversion for analysis
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # 3. Sharpness / Blur estimation
    blur_var = round(calculate_blur_variance(gray), 2)
    is_blurry = blur_var < 100.0

    # 4. Glare detection
    glare_score = round(calculate_glare_score(gray), 3)
    has_excessive_glare = glare_score > 3.5

    # 5. Skew estimation and deskewing
    skew_angle = round(detect_skew_angle(gray), 2)
    is_deskewed = False
    deskewed_bgr = bgr
    if abs(skew_angle) >= 0.5:
        deskewed_bgr = rotate_image(bgr, skew_angle)
        is_deskewed = True

    # 6. Lighting / Illumination analysis
    mean_brightness = float(np.mean(gray))
    std_contrast = float(np.std(gray))
    is_well_lit = (50.0 <= mean_brightness <= 220.0) and (std_contrast >= 25.0)

    # 7. Adaptive Illumination & Contrast Enhancement
    preprocessed_bgr = enhance_illumination(deskewed_bgr)
    prep_path = doc_dir / "preprocessed.jpg"
    cv2.imwrite(str(prep_path), preprocessed_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # 8. Generate Thumbnail for UI responsiveness
    thumb_h = 320
    thumb_w = int(w * (thumb_h / float(h)))
    thumb_bgr = cv2.resize(preprocessed_bgr, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
    thumb_path = doc_dir / "thumbnail.jpg"
    cv2.imwrite(str(thumb_path), thumb_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])

    duration_ms = round((time.time() - start_time) * 1000, 2)

    # Quality warnings and verdict
    warnings = []
    if is_blurry:
        warnings.append(f"Image blur detected (sharpness variance {blur_var} < 100.0). Text extraction may be compromised.")
    if has_excessive_glare:
        warnings.append(f"Excessive specular glare detected ({glare_score}% saturated pixels).")
    if not is_well_lit:
        warnings.append(f"Suboptimal illumination (mean brightness: {round(mean_brightness, 1)}, contrast std: {round(std_contrast, 1)}).")
    if w < 600 or h < 400:
        warnings.append(f"Low resolution ({w}x{h}). High-resolution scan (min 1000px wide) recommended for ICAO compliance.")

    if not warnings:
        quality_verdict = "EXCELLENT"
    elif len(warnings) == 1 and not is_blurry:
        quality_verdict = "ACCEPTABLE"
    else:
        quality_verdict = "POOR_QUALITY"

    metrics = PreprocessingMetrics(
        width=w,
        height=h,
        channels=c,
        aspect_ratio=aspect_ratio,
        blur_variance=blur_var,
        is_blurry=is_blurry,
        blur_threshold=100.0,
        glare_score=glare_score,
        has_excessive_glare=has_excessive_glare,
        skew_angle_deg=skew_angle,
        is_deskewed=is_deskewed,
        brightness_mean=round(mean_brightness, 2),
        contrast_std=round(std_contrast, 2),
        is_well_lit=is_well_lit,
        processing_time_ms=duration_ms
    )

    return DocumentUploadResponse(
        document_id=doc_id,
        original_filename=filename,
        original_url=f"/uploads/{doc_id}/original.jpg",
        preprocessed_url=f"/uploads/{doc_id}/preprocessed.jpg",
        thumbnail_url=f"/uploads/{doc_id}/thumbnail.jpg",
        metrics=metrics,
        quality_verdict=quality_verdict,
        quality_warnings=warnings,
        created_at=datetime.utcnow().isoformat()
    )
