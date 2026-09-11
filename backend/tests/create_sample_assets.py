import os
from pathlib import Path
import cv2
import numpy as np

ASSETS_DIR = Path("backend/tests/assets")
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

def generate_synthetic_face(seed=42, name="Alice"):
    np.random.seed(seed)
    img = np.full((320, 240, 3), 235, dtype=np.uint8)
    
    # Draw simple synthetic facial features (head, hair, eyes, nose, mouth)
    center = (120, 160)
    # Head oval
    cv2.ellipse(img, center, (65, 85), 0, 0, 360, (190, 160, 140), -1)
    # Hair
    cv2.ellipse(img, (120, 110), (70, 45), 0, 180, 360, (50, 30, 20), -1)
    # Eyes
    cv2.circle(img, (95, 145), 9, (255, 255, 255), -1)
    cv2.circle(img, (145, 145), 9, (255, 255, 255), -1)
    cv2.circle(img, (95, 145), 4, (40, 70, 120), -1)
    cv2.circle(img, (145, 145), 4, (40, 70, 120), -1)
    # Nose
    cv2.line(img, (120, 150), (118, 175), (150, 120, 100), 2)
    cv2.line(img, (118, 175), (125, 175), (150, 120, 100), 2)
    # Mouth
    cv2.ellipse(img, (120, 195), (20, 8), 0, 0, 180, (80, 60, 170), 3)
    return img

def create_synthetic_passport():
    # Standard passport bio-data page aspect ratio ~ 1.42 (1000 x 700 px)
    h, w = 700, 1000
    doc = np.full((h, w, 3), 248, dtype=np.uint8)

    # Passport security background watermark pattern (fine guilloche-like wave lines)
    for y in range(40, h - 160, 16):
        cv2.line(doc, (20, y), (w - 20, y), (232, 238, 245), 1)

    # Top Header
    cv2.rectangle(doc, (0, 0), (w, 75), (30, 45, 75), -1)
    cv2.putText(doc, "REPUBLIC OF UTOPIA - PASSPORT", (200, 48), cv2.FONT_HERSHEY_DUPLEX, 0.95, (255, 255, 255), 2)

    # Embed Synthetic Face
    face = generate_synthetic_face(seed=42)
    fh, fw = face.shape[:2]
    doc[120:120+fh, 60:60+fw] = face
    cv2.rectangle(doc, (59, 119), (60+fw, 120+fh), (180, 180, 180), 2)

    # Visible Text Fields
    fields = [
        ("TYPE / TYPE", "P", 340, 130),
        ("COUNTRY CODE / CODE DU PAYS", "UTO", 520, 130),
        ("PASSPORT NO. / NO. DU PASSEPORT", "L898902C3", 750, 130),
        ("SURNAME / NOM", "ERIKSSON", 340, 200),
        ("GIVEN NAMES / PRENOMS", "ANNA MARIA", 340, 270),
        ("NATIONALITY / NATIONALITE", "UTOPIAN", 340, 340),
        ("DATE OF BIRTH / DATE DE NAISSANCE", "12 AUG / AOUT 1974", 340, 410),
        ("SEX / SEXE", "F", 750, 410),
        ("PLACE OF BIRTH / LIEU DE NAISSANCE", "UTOPIA CITY", 340, 480),
        ("DATE OF EXPIRY / DATE D EXPIRATION", "15 APR / AVR 2030", 650, 480),
    ]

    for label, val, x, y in fields:
        cv2.putText(doc, label, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 110, 130), 1)
        cv2.putText(doc, val, (x, y + 25), cv2.FONT_HERSHEY_DUPLEX, 0.65, (15, 20, 30), 2)

    # MRZ Zone (ICAO Doc 9303 TD3 standard 2 lines of 44 chars)
    # Line 1: P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
    # Line 2: L898902C36UTO7408122F1204159ZE184226B<<<<<10
    mrz_y = h - 110
    cv2.rectangle(doc, (0, mrz_y - 25), (w, h), (255, 255, 255), -1)
    cv2.line(doc, (0, mrz_y - 25), (w, mrz_y - 25), (190, 190, 190), 2)

    line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    line2 = "L898902C36UTO7408122F1204159ZE184226B<<<<<10"

    cv2.putText(doc, line1, (35, mrz_y + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 0, 0), 2)
    cv2.putText(doc, line2, (35, mrz_y + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 0, 0), 2)

    # Save valid passport
    valid_path = ASSETS_DIR / "synthetic_passport_valid.png"
    cv2.imwrite(str(valid_path), doc)
    print(f"Created: {valid_path}")

    # Create blurry version
    blurry = cv2.GaussianBlur(doc, (27, 27), 0)
    blurry_path = ASSETS_DIR / "synthetic_passport_blurry.png"
    cv2.imwrite(str(blurry_path), blurry)
    print(f"Created: {blurry_path}")

    # Create invalid MRZ version (altered check digit '6' to '9')
    invalid_mrz_doc = doc.copy()
    line2_bad = "L898902C39UTO7408122F1204159ZE184226B<<<<<10"
    cv2.rectangle(invalid_mrz_doc, (30, mrz_y + 45), (w - 30, h - 10), (255, 255, 255), -1)
    cv2.putText(invalid_mrz_doc, line2_bad, (35, mrz_y + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 0, 0), 2)
    invalid_path = ASSETS_DIR / "synthetic_passport_invalid_mrz.png"
    cv2.imwrite(str(invalid_path), invalid_mrz_doc)
    print(f"Created: {invalid_path}")

    # Save matching face and different face
    cv2.imwrite(str(ASSETS_DIR / "synthetic_face_match.png"), face)
    face_diff = generate_synthetic_face(seed=999, name="Bob")
    cv2.imwrite(str(ASSETS_DIR / "synthetic_face_different.png"), face_diff)
    print("Created synthetic faces for face matching verification.")

if __name__ == "__main__":
    create_synthetic_passport()
