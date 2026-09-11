export interface PreprocessingMetrics {
  width: number;
  height: number;
  channels: number;
  aspect_ratio: number;
  blur_variance: number;
  is_blurry: boolean;
  blur_threshold: number;
  glare_score: number;
  has_excessive_glare: boolean;
  skew_angle_deg: number;
  is_deskewed: boolean;
  brightness_mean: number;
  contrast_std: number;
  is_well_lit: boolean;
  processing_time_ms: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  original_filename: string;
  original_url: string;
  preprocessed_url: string;
  thumbnail_url: string;
  metrics: PreprocessingMetrics;
  quality_verdict: 'EXCELLENT' | 'ACCEPTABLE' | 'POOR_QUALITY';
  quality_warnings: string[];
  created_at: string;
}

export interface HealthStatusResponse {
  status: string;
  service: string;
  version: string;
  modules_loaded: string[];
  tesseract_available: boolean;
  opencv_models_ready: boolean;
}
