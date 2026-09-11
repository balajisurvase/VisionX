import unittest
from pathlib import Path
from backend.app.services.document_service import DocumentService

class TestPreprocessing(unittest.TestCase):
    def test_valid_image_preprocessing(self):
        sample_path = Path("backend/tests/assets/synthetic_passport_valid.png")
        self.assertTrue(sample_path.exists(), "Sample asset must exist")
        
        with open(sample_path, "rb") as f:
            content = f.read()

        result = DocumentService.process_document(content, "passport_valid.png")
        self.assertIn("document_id", result)
        self.assertIn("preprocessing", result)
        self.assertGreater(result["preprocessing"]["blur_score"], 50.0)
        self.assertIn(result["preprocessing"]["quality_status"], ["GOOD", "ACCEPTABLE"])
        self.assertTrue(Path(result["processed_path"]).exists())
        print(f"Valid passport blur score: {result['preprocessing']['blur_score']}, status: {result['preprocessing']['quality_status']}")

    def test_blurry_image_detection(self):
        sample_path = Path("backend/tests/assets/synthetic_passport_blurry.png")
        with open(sample_path, "rb") as f:
            content = f.read()

        result = DocumentService.process_document(content, "passport_blurry.png")
        self.assertIn("preprocessing", result)
        self.assertLess(result["preprocessing"]["blur_score"], 50.0)
        self.assertEqual(result["preprocessing"]["quality_status"], "BLURRY")
        print(f"Blurry passport blur score: {result['preprocessing']['blur_score']}, status: {result['preprocessing']['quality_status']}")

    def test_file_validation(self):
        with self.assertRaises(ValueError):
            DocumentService.validate_file("malicious.exe", 1024, "application/octet-stream")

        with self.assertRaises(ValueError):
            DocumentService.validate_file("huge.jpg", 15 * 1024 * 1024, "image/jpeg")

if __name__ == "__main__":
    unittest.main()
