import uuid
import math
import os
from pathlib import Path
from typing import Tuple, Dict, Any, List
import cv2
import numpy as np
from PIL import Image

from backend.app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, BLUR_THRESHOLD

def order_points(pts: np.ndarray) -> np.ndarray:
    """Order coordinates in order: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """Warp quadrilateral region to top-down rectangular view."""
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # Calculate width of new image
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    # Calculate height of new image
    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    # Construct destination points
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    transform_matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, transform_matrix, (max_width, max_height))
    return warped

class DocumentService:
    @staticmethod
    def validate_file(filename: str, file_size: int, content_type: str):
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        if file_size > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size ({file_size / (1024*1024):.2f}MB) exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES / (1024*1024):.1f}MB")

    @staticmethod
    def compute_blur_score(gray_image: np.ndarray) -> float:
        """Compute the variance of the Laplacian as the blur metric."""
        return float(cv2.Laplacian(gray_image, cv2.CV_64F).var())

    @staticmethod
    def compute_contrast_score(gray_image: np.ndarray) -> float:
        """Standard deviation of pixel intensities reflects contrast."""
        return float(gray_image.std())

    @staticmethod
    def enhance_contrast(bgr_image: np.ndarray) -> np.ndarray:
        """Apply CLAHE on the luminance channel in LAB color space."""
        lab = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        limg = cv2.merge((cl, a_channel, b_channel))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        return enhanced

    @classmethod
    def detect_and_crop_document(cls, bgr_image: np.ndarray) -> Tuple[np.ndarray, bool, bool, float]:
        """
        Locates document boundary using Canny edge detection + contour approximation.
        Returns: (warped_or_original_image, document_detected, perspective_corrected, rotation_angle)
        """
        orig_h, orig_w = bgr_image.shape[:2]
        image_area = orig_h * orig_w

        # Resize for faster edge detection while keeping aspect ratio
        ratio = orig_h / 800.0
        resized = cv2.resize(bgr_image, (int(orig_w / ratio), 800))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Canny edge detection
        edged = cv2.Canny(blurred, 50, 180)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

        doc_contour = None
        for c in contours:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                area = cv2.contourArea(approx) * (ratio ** 2)
                if area > (0.18 * image_area):
                    doc_contour = approx
                    break

        if doc_contour is not None:
            # Scale coordinates back to original image
            scaled_pts = (doc_contour.reshape(4, 2) * ratio).astype("float32")
            warped = four_point_transform(bgr_image, scaled_pts)
            
            # Ensure proper orientation: passport biodata page is typically wider than it is tall
            wh, ww = warped.shape[:2]
            rotation_angle = 0.0
            if wh > ww * 1.15:
                # Rotate 90 degrees clockwise to horizontal standard
                warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
                rotation_angle = 90.0

            return warped, True, True, rotation_angle

        # If no strict 4-point quadrilateral found, return original image
        return bgr_image, False, False, 0.0

    @classmethod
    def process_document(cls, file_bytes: bytes, original_filename: str) -> Dict[str, Any]:
        """Complete preprocessing pipeline for uploaded identity document."""
        doc_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix.lower()
        if ext == ".pdf":
            # PDF rendering fallback: take first page if practical or error
            ext = ".png"

        orig_filename = f"{doc_id}_orig{ext}"
        proc_filename = f"{doc_id}_proc.png"

        orig_path = UPLOAD_DIR / orig_filename
        proc_path = UPLOAD_DIR / proc_filename

        with open(orig_path, "wb") as f:
            f.write(file_bytes)

        # Decode image using OpenCV
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            # Try PIL fallback
            try:
                from io import BytesIO
                pil_img = Image.open(BytesIO(file_bytes)).convert("RGB")
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                raise ValueError(f"Could not decode image file: {str(e)}")

        orig_h, orig_w = img.shape[:2]

        # 1. Document detection, perspective correction & cropping
        cropped, doc_detected, persp_corrected, rot_angle = cls.detect_and_crop_document(img)

        # 2. Contrast and brightness enhancement
        enhanced = cls.enhance_contrast(cropped)

        # 3. Quality & Blur analysis on processed image
        proc_gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        blur_score = cls.compute_blur_score(proc_gray)
        contrast_score = cls.compute_contrast_score(proc_gray)

        indicators = []
        if doc_detected:
            indicators.append("Document boundary identified and perspective-corrected")
        else:
            indicators.append("No unambiguous 4-corner document boundary found; processed whole frame")

        if blur_score < 50.0:
            quality_status = "BLURRY"
            indicators.append(f"Severe blur detected (Laplacian score: {blur_score:.1f} < 50.0)")
        elif blur_score < BLUR_THRESHOLD:
            quality_status = "ACCEPTABLE"
            indicators.append(f"Moderate blur detected (Laplacian score: {blur_score:.1f})")
        else:
            quality_status = "GOOD"
            indicators.append(f"Sharp image quality (Laplacian score: {blur_score:.1f} >= {BLUR_THRESHOLD})")

        if contrast_score < 35.0:
            indicators.append(f"Low image contrast (std dev: {contrast_score:.1f} < 35.0)")
        else:
            indicators.append(f"Adequate lighting contrast (std dev: {contrast_score:.1f})")

        # Save processed output image
        cv2.imwrite(str(proc_path), enhanced)

        proc_h, proc_w = enhanced.shape[:2]

        return {
            "document_id": doc_id,
            "original_path": str(orig_path),
            "processed_path": str(proc_path),
            "original_url": f"/uploads/{orig_filename}",
            "processed_url": f"/uploads/{proc_filename}",
            "file_size_bytes": len(file_bytes),
            "preprocessing": {
                "original_url": f"/uploads/{orig_filename}",
                "processed_url": f"/uploads/{proc_filename}",
                "document_detected": doc_detected,
                "perspective_corrected": persp_corrected,
                "rotation_angle": rot_angle,
                "blur_score": round(blur_score, 2),
                "quality_status": quality_status,
                "contrast_score": round(contrast_score, 2),
                "dimensions": {
                    "original_width": orig_w,
                    "original_height": orig_h,
                    "processed_width": proc_w,
                    "processed_height": proc_h,
                },
                "indicators": indicators,
            }
        }
