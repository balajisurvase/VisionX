# Synthetic Demo Test Documents — SIH 2026 Problem Statement 26188
Organization: Sashastra Seema Bal (SSB), Ministry of Home Affairs

IMPORTANT NOTICE:
All documents in this directory are 100% SYNTHETIC and FICTIONAL, created exclusively
for automated testing and evaluation of the AI-Based Fake Identity & Document Screening System.
They are prominently watermarked:
"DEMO • SPECIMEN • NOT A REAL ID • FOR SIH 2026 EVALUATION ONLY"

## Available Test Documents for Upload & Screening:

1. `passport_genuine_aarav.svg`
   - Document Type: Passport
   - Document Number: TESTP00123
   - Applicant: Aarav Sharma
   - Expected Result: VERIFIED (Risk Score: 10-15 / LOW)
   - Pair with: `person_aarav_reference.svg` (Face Match > 94%)

2. `dl_genuine_priya.svg`
   - Document Type: Driving License
   - Document Number: TESTDL00234
   - Applicant: Priya Patil
   - Expected Result: VERIFIED (Risk Score: 12-18 / LOW)
   - Pair with: `person_priya_reference.svg` (Face Match > 92%)

3. `passport_expired_aditya.svg`
   - Document Type: Passport
   - Document Number: TESTP00567
   - Applicant: Aditya Jadhav
   - Expected Result: EXPIRED (Risk Score: ~65 / MEDIUM)
   - Expiry Date: 15-05-2024 (Lapsed chronological validity)

4. `passport_tampered.svg`
   - Document Type: Passport
   - Document Number: TESTP99991
   - Applicant: Tampered Passport
   - Expected Result: SUSPICIOUS (Risk Score: > 90 / HIGH)
   - Flags: MRZ check digit corruption & photo replacement boundary mismatch

5. `person_imposter_reference.svg`
   - Test reference photo for Face Mismatch evaluation (Scenario 4)
   - Test against `passport_genuine_aarav.svg` -> Results in Face Match < 45% -> High Risk Impersonation Alert!
