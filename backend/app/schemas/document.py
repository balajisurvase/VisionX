from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PreprocessingMetrics(BaseModel):
    width: int
    height: int
    channels: int
    aspect_ratio: float
    blur_variance: float
    is_blurry: bool
    blur_threshold: float = 100.0
    glare_score: float
    has_excessive_glare: bool
    skew_angle_deg: float
    is_deskewed: bool
    brightness_mean: float
    contrast_std: float
    is_well_lit: bool
    processing_time_ms: float

class DocumentUploadResponse(BaseModel):
    document_id: str
    original_filename: str
    original_url: str
    preprocessed_url: str
    thumbnail_url: str
    metrics: PreprocessingMetrics
    quality_verdict: str
    quality_warnings: List[str]
    created_at: str

class HealthStatusResponse(BaseModel):
    status: str
    service: str
    version: str
    modules_loaded: List[str]
    tesseract_available: bool
    opencv_models_ready: bool
