export interface PreprocessResult {
  original_url: string;
  processed_url: string;
  document_detected: boolean;
  perspective_corrected: boolean;
  rotation_angle: number;
  blur_score: number;
  quality_status: 'GOOD' | 'ACCEPTABLE' | 'BLURRY' | 'POOR';
  contrast_score: number;
  dimensions: {
    original_width: number;
    original_height: number;
    processed_width: number;
    processed_height: number;
  };
  indicators: string[];
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  file_size_bytes: number;
  content_type: string;
  original_url: string;
  preprocessing: PreprocessResult;
}
