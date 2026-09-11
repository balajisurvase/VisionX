import io
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from backend.app.services.preprocessing import preprocess_document_image, calculate_blur_variance, calculate_glare_score, detect_skew_angle


def generate_sample_passport_image() -> bytes:
    """Creates an in-memory sample identity card image for testing Module 1."""
    # Create 1200x800 white canvas
    img = Image.new("RGB", (1200, 800), color=(245, 247, 250))
    draw = ImageDraw.Draw(img)

    # Document outer border and header
    draw.rectangle([40, 40, 1160, 760], outline=(40, 50, 70), width=4)
    draw.rectangle([40, 40, 1160, 140], fill=(24, 43, 73))
    draw.text((80, 70), "REPUBLIC OF IDENTITY - PASSPORT", fill=(255, 255, 255))

    # Photo placeholder
    draw.rectangle([80, 180, 360, 540], fill=(210, 220, 230), outline=(100, 110, 130), width=2)
    draw.ellipse([170, 240, 270, 340], fill=(160, 175, 195))
    draw.ellipse([140, 350, 300, 510], fill=(140, 155, 180))

    # Field labels and values
    fields = [
        ("Surname / Nom:", "DOE"),
        ("Given Names / Prenoms:", "JOHN ALEXANDER"),
        ("Nationality / Nationalite:", "UTOPIAN"),
        ("Date of Birth / Date de naissance:", "14 AUG 1988"),
        ("Sex / Sexe:", "M"),
        ("Passport No / No de passeport:", "P12345678"),
        ("Date of Expiry / Date d'expiration:", "22 OCT 2030"),
    ]

    y = 180
    for label, val in fields:
        draw.text((400, y), label, fill=(100, 110, 125))
        draw.text((400, y + 22), val, fill=(15, 23, 42))
        y += 50

    # Machine Readable Zone (MRZ) background and lines
    draw.rectangle([60, 580, 1140, 740], fill=(235, 238, 242))
    line1 = "P<UTODOE<<JOHN<ALEXANDER<<<<<<<<<<<<<<<<<<<<"
    line2 = "P123456784UTO8808148M3010224<<<<<<<<<<<<<<04"
    draw.text((90, 610), line1, fill=(0, 0, 0))
    draw.text((90, 670), line2, fill=(0, 0, 0))

    # Slightly rotate by 2 degrees to test skew detection & deskewing
    rotated_img = img.rotate(-2.0, resample=Image.BICUBIC, fillcolor=(255, 255, 255))

    buf = io.BytesIO()
    rotated_img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def test_preprocessing_pipeline():
    sample_bytes = generate_sample_passport_image()
    assert len(sample_bytes) > 10000, "Generated image should be substantial in size"

    result = preprocess_document_image(sample_bytes, "test_passport_sample.jpg")

    print(f"[*] Document ID: {result.document_id}")
    print(f"[*] Dimensions: {result.metrics.width}x{result.metrics.height}")
    print(f"[*] Blur Variance: {result.metrics.blur_variance} (Blurry: {result.metrics.is_blurry})")
    print(f"[*] Glare Score: {result.metrics.glare_score}% (Excessive Glare: {result.metrics.has_excessive_glare})")
    print(f"[*] Detected Skew Angle: {result.metrics.skew_angle_deg} deg (Deskewed: {result.metrics.is_deskewed})")
    print(f"[*] Quality Verdict: {result.quality_verdict}")
    print(f"[*] Processing Time: {result.metrics.processing_time_ms} ms")

    assert result.document_id is not None
    assert result.metrics.width == 1200
    assert result.metrics.height == 800
    assert result.metrics.blur_variance > 50.0
    assert result.quality_verdict in ["EXCELLENT", "ACCEPTABLE"]
    print("[+] All Module 1 Preprocessing assertions PASSED!")


if __name__ == "__main__":
    test_preprocessing_pipeline()
