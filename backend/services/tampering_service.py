import io
import json
import logging
from typing import Dict, Any, List, Optional
import cv2
import numpy as np
from PIL import Image, ImageChops
from google.genai import types

from backend.services.gemini_service import get_gemini_client

logger = logging.getLogger(__name__)

TAMPERING_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "tampering_detected": {"type": "BOOLEAN"},
        "tampering_score": {"type": "NUMBER"},
        "confidence": {"type": "NUMBER"},
        "findings": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "region": {"type": "STRING"},
                    "description": {"type": "STRING"},
                    "confidence": {"type": "NUMBER"}
                },
                "required": ["region", "description", "confidence"]
            }
        },
        "reasoning": {"type": "STRING"}
    },
    "required": [
        "tampering_detected",
        "tampering_score",
        "confidence",
        "findings",
        "reasoning"
    ]
}

def analyze_tampering(
    image_bytes: bytes,
    mime_type: str = "image/png",
    filename: str = ""
) -> Dict[str, Any]:
    """
    Module 3: Multi-Layer Digital Forensics & Tampering Detection.
    Combines deterministic OpenCV/Pillow pixel forensics with Gemini multimodal vision analysis.
    Zero filename sniffing — results are strictly derived from pixel and metadata examination.
    """
    # 1. Deterministic Local Forensics (OpenCV + Pillow)
    forensic_results = _run_deterministic_forensics(image_bytes)

    # 2. Multimodal Vision Second Opinion (Gemini 2.5 Flash)
    gemini_results = _run_gemini_forensic_examination(image_bytes, mime_type)

    # 3. Merge both independent signals (50% OpenCV Forensics + 50% Gemini Findings)
    opencv_score = forensic_results["score"]
    gemini_score = gemini_results.get("tampering_score", opencv_score)

    if gemini_results.get("tampering_detected") is not None:
        merged_score = round(0.50 * opencv_score + 0.50 * gemini_score, 1)
        tampering_detected = bool(merged_score >= 35.0 or forensic_results["tampering_detected"] or gemini_results.get("tampering_detected", False))
    else:
        merged_score = round(opencv_score, 1)
        tampering_detected = forensic_results["tampering_detected"]

    # Combine findings with method attribution
    combined_regions: List[str] = []
    findings_list: List[Dict[str, Any]] = []

    for f in forensic_results.get("findings", []):
        combined_regions.append(f"{f['region']} (OpenCV Forensics)")
        findings_list.append({
            "source": "OpenCV / Pillow Forensics",
            "region": f["region"],
            "description": f["description"],
            "confidence": f["confidence"]
        })

    for f in gemini_results.get("findings", []):
        combined_regions.append(f"{f.get('region', 'Document Surface')} (Gemini Vision)")
        findings_list.append({
            "source": "Gemini 2.5 Flash Forensic Vision",
            "region": f.get("region", "Visual Zone"),
            "description": f.get("description", "Visual anomaly detected"),
            "confidence": f.get("confidence", 90.0)
        })

    return {
        "tampering_detected": tampering_detected,
        "tampering_score": merged_score,
        "confidence": round((forensic_results.get("confidence", 90.0) + gemini_results.get("confidence", 90.0)) / 2.0, 1),
        "regions": combined_regions if combined_regions else (["Substrate Integrity Clean"] if not tampering_detected else ["Visual Discrepancy"]),
        "method": "Hybrid (OpenCV ELA + Metadata + ORB Clones + Gemini Multimodal Vision)",
        "details": {
            "opencv_score": opencv_score,
            "gemini_score": gemini_score,
            "ela_hotspot_pct": forensic_results.get("ela_hotspot_pct", 0.0),
            "laplacian_variance": forensic_results.get("laplacian_variance", 0.0),
            "metadata_flags": forensic_results.get("metadata_flags", []),
            "clone_clusters_detected": forensic_results.get("clone_clusters_detected", 0),
            "findings": findings_list,
            "gemini_reasoning": gemini_results.get("reasoning", "Analysis complete")
        }
    }


def _run_deterministic_forensics(image_bytes: bytes) -> Dict[str, Any]:
    """Runs deterministic OpenCV ELA, Laplacian sharpness, clone detection, and Pillow EXIF checks."""
    findings: List[Dict[str, Any]] = []
    tampering_detected = False
    score = 4.0  # clean baseline

    try:
        # Load Pillow Image
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = pil_img.size

        # 1. Error Level Analysis (ELA)
        ela_buf = io.BytesIO()
        pil_img.save(ela_buf, "JPEG", quality=90)
        ela_buf.seek(0)
        resaved_img = Image.open(ela_buf).convert("RGB")
        ela_diff = ImageChops.difference(pil_img, resaved_img)

        # Enhance diff
        diff_arr = np.array(ela_diff, dtype=np.float32)
        diff_mag = np.max(diff_arr, axis=2)
        
        # High compression variance threshold
        hotspot_mask = diff_mag > 40.0
        hotspot_count = np.count_nonzero(hotspot_mask)
        hotspot_pct = round((hotspot_count / (w * h)) * 100.0, 2)

        # Detect hotspot bounding boxes if significant
        if hotspot_pct > 3.0:
            score += min(50.0, hotspot_pct * 8.0)
            tampering_detected = True
            findings.append({
                "region": "Compression Artifacts (ELA Discrepancy)",
                "description": f"JPEG compression error level variance is {hotspot_pct}% across image surface, indicating local re-saving or spliced layers",
                "confidence": 88.0
            })

        # 2. Metadata / EXIF Inspection
        metadata_flags = []
        try:
            exif_data = pil_img.getexif()
            if exif_data:
                for tag_id, value in exif_data.items():
                    val_str = str(value).lower()
                    if any(editor in val_str for editor in ["photoshop", "gimp", "canva", "lightroom", "paint.net", "corel"]):
                        metadata_flags.append(f"Editing software signature in EXIF: {value}")
                        score += 35.0
                        tampering_detected = True
                        findings.append({
                            "region": "File Header Metadata",
                            "description": f"Digital manipulation software signature ({value}) embedded in file metadata",
                            "confidence": 99.0
                        })
        except Exception:
            pass

        # 3. OpenCV Laplacian Edge Gradient Analysis
        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        lap_var = 0.0
        clone_clusters = 0

        if cv_img is not None:
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            lap_var = round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 2)

            # 4. Copy-Move / Clone Detection using ORB Keypoints
            try:
                orb = cv2.ORB_create(nfeatures=800)
                kps, descs = orb.detectAndCompute(gray, None)
                if descs is not None and len(descs) > 20:
                    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
                    matches = bf.knnMatch(descs, descs, k=3)
                    # Find self-matches with spatial separation
                    clone_pairs = []
                    for m_group in matches:
                        if len(m_group) >= 2:
                            m1 = m_group[1] # first non-self match
                            pt1 = kps[m1.queryIdx].pt
                            pt2 = kps[m1.trainIdx].pt
                            dist = np.hypot(pt1[0] - pt2[0], pt1[1] - pt2[1])
                            if m1.distance < 30 and dist > 40: # high visual match but different coordinates
                                clone_pairs.append((pt1, pt2))
                    
                    if len(clone_pairs) > 12:
                        clone_clusters = len(clone_pairs)
                        score += min(45.0, len(clone_pairs) * 2.0)
                        tampering_detected = True
                        findings.append({
                            "region": "Cloned Regions / Keypoint Repetition",
                            "description": f"Detected {clone_clusters} spatial duplicate feature matches (Copy-Move forgery signature)",
                            "confidence": 92.0
                        })
            except Exception:
                pass

        return {
            "score": min(100.0, score),
            "tampering_detected": tampering_detected,
            "confidence": 90.0,
            "findings": findings,
            "ela_hotspot_pct": hotspot_pct,
            "laplacian_variance": lap_var,
            "metadata_flags": metadata_flags,
            "clone_clusters_detected": clone_clusters
        }

    except Exception as e:
        logger.warning(f"Error during deterministic forensics: {e}")
        return {
            "score": 5.0,
            "tampering_detected": False,
            "confidence": 80.0,
            "findings": [],
            "ela_hotspot_pct": 0.0,
            "laplacian_variance": 0.0,
            "metadata_flags": [],
            "clone_clusters_detected": 0
        }


def _run_gemini_forensic_examination(image_bytes: bytes, mime_type: str = "image/png") -> Dict[str, Any]:
    """Runs forensic visual examination with Gemini 2.5 Flash."""
    client = get_gemini_client()
    if not client:
        return {"tampering_score": 5.0, "tampering_detected": False, "findings": [], "reasoning": "Gemini API key not configured"}

    try:
        system_instruction = (
            "You are an expert forensic document examiner for an international border security agency. "
            "Examine this identity/travel credential image for digital forgery, photo replacement, copy-paste artifacts, "
            "font mismatches, misaligned boundaries, edge blurring, stamp irregularities, or pixelation around numbers and names. "
            "Provide objective, evidence-based findings with location and confidence."
        )

        prompt = (
            "Examine this document image for digital tampering, photo manipulation, pasted portraits, or altered text. "
            "Report whether tampering is detected, calculate tampering_score (0-100 where <25 is clean and >70 is severe forgery), "
            "list all specific visual findings with region, description, and confidence, and summarize your reasoning in JSON."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=TAMPERING_RESPONSE_SCHEMA,
                temperature=0.1
            )
        )

        if response and response.text:
            return json.loads(response.text)

    except Exception as e:
        logger.warning(f"Gemini forensic examination error: {e}")

    return {"tampering_score": 5.0, "tampering_detected": False, "findings": [], "reasoning": "Offline baseline evaluation"}
