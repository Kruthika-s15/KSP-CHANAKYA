import cv2
import numpy as np
import base64

class FingerprintService:
    @staticmethod
    def match_fingerprints(sample_bytes: bytes, target_bytes: bytes):
        # 1. Decode image bytes to OpenCV grayscale arrays
        nparr1 = np.frombuffer(sample_bytes, np.uint8)
        nparr2 = np.frombuffer(target_bytes, np.uint8)
        
        img1 = cv2.imdecode(nparr1, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imdecode(nparr2, cv2.IMREAD_GRAYSCALE)

        if img1 is None or img2 is None:
            return {"matched": False, "match_score": 0, "error": "Invalid image format"}

        # 2. Extract SIFT features
        sift = cv2.SIFT_create()
        kp1, des1 = sift.detectAndCompute(img1, None)
        kp2, des2 = sift.detectAndCompute(img2, None)

        if des1 is None or des2 is None:
            return {"matched": False, "match_score": 0, "keypoints_found": 0, "visualization": None}

        # 3. Flann / Brute Force Matching
        bf = cv2.BFMatcher()
        matches = bf.knnMatch(des1, des2, k=2)

        # 4. Apply Lowe's Ratio Test
        good_matches = []
        for m_n in matches:
            if len(m_n) == 2:
                m, n = m_n
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

        # Calculate Score
        total_kp = max(len(kp1), len(kp2))
        match_score = (len(good_matches) / total_kp * 100) if total_kp > 0 else 0
        is_match = match_score > 12.0  # Threshold

        # 5. Draw Keypoint Connection Lines Visual
        matched_img = cv2.drawMatches(img1, kp1, img2, kp2, good_matches[:30], None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
        
        # Convert visual result to Base64
        _, buffer = cv2.imencode('.png', matched_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "matched": is_match,
            "match_score": round(match_score, 2),
            "keypoints_found": len(good_matches),
            "visualization": f"data:image/png;base64,{img_base64}"
        }


def compare_fingerprints(sample_bytes: bytes, target_bytes: bytes):
    """Exposes compare_fingerprints for app/api/v1/biometrics.py"""
    return FingerprintService.match_fingerprints(sample_bytes, target_bytes)