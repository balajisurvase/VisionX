-- ============================================================
-- SIH 2026
-- AI-BASED FAKE IDENTITY & DOCUMENT SCREENING SYSTEM
-- COMPLETE DATABASE + DEMO DATA
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 2. OFFICERS / USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id VARCHAR(80) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'officer'
        CHECK (role IN ('admin', 'officer', 'supervisor')),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    is_demo BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_type VARCHAR(30) NOT NULL
        CHECK (
            document_type IN (
                'passport',
                'visa',
                'national_id',
                'driving_license',
                'permit'
            )
        ),

    document_number VARCHAR(100) NOT NULL,

    full_name VARCHAR(150),

    nationality VARCHAR(100),

    date_of_birth DATE,

    date_of_expiry DATE,

    gender VARCHAR(30),

    visa_type VARCHAR(100),

    visa_entry_type VARCHAR(50),

    visa_stay_duration_days INTEGER,

    issuing_country VARCHAR(100),

    issuing_authority VARCHAR(150),

    file_path TEXT,

    document_hash VARCHAR(128),

    ocr_text TEXT,

    ocr_data JSONB DEFAULT '{}'::jsonb,

    validation_data JSONB DEFAULT '{}'::jsonb,

    document_status VARCHAR(30) DEFAULT 'UNKNOWN'
        CHECK (
            document_status IN (
                'ACTIVE',
                'EXPIRED',
                'SUSPENDED',
                'UNKNOWN'
            )
        ),

    created_by UUID REFERENCES public.officers(id),

    is_demo BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. VERIFICATION RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    verification_id VARCHAR(40) UNIQUE NOT NULL
        DEFAULT (
            'VER-' ||
            UPPER(
                SUBSTRING(
                    REPLACE(gen_random_uuid()::TEXT, '-', ''),
                    1,
                    12
                )
            )
        ),

    document_id UUID NOT NULL
        REFERENCES public.documents(id)
        ON DELETE CASCADE,

    officer_id UUID
        REFERENCES public.officers(id),

    -- OCR
    ocr_status VARCHAR(30) DEFAULT 'NOT_RUN',

    ocr_confidence NUMERIC(5,2),

    -- Document validation
    validation_status VARCHAR(30) DEFAULT 'NOT_RUN',

    mrz_valid BOOLEAN,

    required_fields_complete BOOLEAN,

    -- Tampering
    tampering_status VARCHAR(30) DEFAULT 'NOT_RUN',

    tampering_score NUMERIC(5,2),

    tampering_confidence NUMERIC(5,2),

    tampering_regions JSONB DEFAULT '[]'::jsonb,

    -- Face verification
    face_verification_status VARCHAR(30) DEFAULT 'NOT_RUN',

    face_match_score NUMERIC(5,2),

    face_match BOOLEAN,

    -- Risk engine
    risk_score NUMERIC(5,2),

    risk_level VARCHAR(20)
        CHECK (
            risk_level IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'UNAVAILABLE'
            )
        ),

    -- Final result
    final_result VARCHAR(30)
        CHECK (
            final_result IN (
                'VERIFIED',
                'SUSPICIOUS',
                'FAILED',
                'EXPIRED',
                'NOT_VERIFIED'
            )
        ),

    reasons JSONB DEFAULT '[]'::jsonb,

    module_results JSONB DEFAULT '{}'::jsonb,

    model_versions JSONB DEFAULT '{}'::jsonb,

    processing_time_ms INTEGER,

    is_demo BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. AUDIT LOGS / HASH CHAIN
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    verification_id UUID
        REFERENCES public.verification_records(id)
        ON DELETE CASCADE,

    officer_id UUID
        REFERENCES public.officers(id),

    action VARCHAR(100) NOT NULL,

    document_hash VARCHAR(128),

    previous_hash VARCHAR(128),

    current_hash VARCHAR(128),

    metadata JSONB DEFAULT '{}'::jsonb,

    is_demo BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. DEMO SCENARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.demo_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    scenario_code VARCHAR(50) UNIQUE NOT NULL,

    scenario_name VARCHAR(150) NOT NULL,

    description TEXT,

    document_id UUID
        REFERENCES public.documents(id)
        ON DELETE SET NULL,

    document_file_path TEXT,

    person_photo_path TEXT,

    expected_result VARCHAR(30),

    expected_risk_level VARCHAR(20),

    notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    is_demo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_documents_document_number
ON public.documents(document_number);

CREATE INDEX IF NOT EXISTS idx_documents_full_name
ON public.documents(full_name);

CREATE INDEX IF NOT EXISTS idx_documents_type
ON public.documents(document_type);

CREATE INDEX IF NOT EXISTS idx_documents_status
ON public.documents(document_status);

CREATE INDEX IF NOT EXISTS idx_verification_document
ON public.verification_records(document_id);

CREATE INDEX IF NOT EXISTS idx_verification_officer
ON public.verification_records(officer_id);

CREATE INDEX IF NOT EXISTS idx_verification_result
ON public.verification_records(final_result);

CREATE INDEX IF NOT EXISTS idx_verification_created
ON public.verification_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_verification
ON public.audit_logs(verification_id);

CREATE INDEX IF NOT EXISTS idx_audit_created
ON public.audit_logs(created_at DESC);


-- ============================================================
-- 8. SUPABASE STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets
    (id, name, public)
VALUES
    ('identity-documents', 'identity-documents', FALSE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_scenarios ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 10. BLOCK DIRECT CLIENT ACCESS
--     Frontend should communicate through FastAPI.
--     FastAPI uses Supabase SERVICE ROLE key.
-- ============================================================

DROP POLICY IF EXISTS "deny_direct_officers" ON public.officers;
DROP POLICY IF EXISTS "deny_direct_documents" ON public.documents;
DROP POLICY IF EXISTS "deny_direct_verifications" ON public.verification_records;
DROP POLICY IF EXISTS "deny_direct_audit" ON public.audit_logs;
DROP POLICY IF EXISTS "deny_direct_demo" ON public.demo_scenarios;


CREATE POLICY "deny_direct_officers"
ON public.officers
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);


CREATE POLICY "deny_direct_documents"
ON public.documents
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);


CREATE POLICY "deny_direct_verifications"
ON public.verification_records
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);


CREATE POLICY "deny_direct_audit"
ON public.audit_logs
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);


CREATE POLICY "deny_direct_demo"
ON public.demo_scenarios
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);


-- ============================================================
-- ============================================================
-- DEMO DATA STARTS HERE
-- ============================================================
-- ============================================================

-- ============================================================
-- 10. SYSTEM USERS
-- ============================================================

INSERT INTO "public"."users" ("id", "username", "full_name", "role", "email", "created_at", "updated_at", "user_id", "password") VALUES 
('307f9396-8bf8-4540-abc2-0f7a8d8ba07b', 'A001', 'Demo Officer Two', 'OFFICER', 'officer002@demo.local', '2026-09-05 15:35:00.938655+00', '2026-09-05 15:35:00.938655+00', 'A001', 'admin123'), 
('360ef64a-ebd2-44fc-ba8e-7efa49bb8ee8', 'A002', 'Security Officer', 'OFFICER', 'officer@example.com', '2026-09-04 19:50:22.137807+00', '2026-09-04 19:50:22.137807+00', 'A002', 'admin123'), 
('94f0c26a-99b1-46cc-9927-7cd8304f924c', 'A003', 'Demo Officer One', 'OFFICER', 'officer001@demo.local', '2026-09-05 15:35:00.938655+00', '2026-09-05 15:35:00.938655+00', 'A003', 'admin123'), 
('a051e189-62a0-4f40-843b-0d9ecdd968e5', 'A004', 'System Administrator', 'ADMIN', 'admin@example.com', '2026-09-04 19:50:22.137807+00', '2026-09-04 19:50:22.137807+00', 'A004', 'admin123')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. DEMO OFFICER
--
-- User ID: demo_officer
-- Password: Demo@123
--
-- Password is stored as bcrypt hash.
-- ============================================================

INSERT INTO public.officers
(
    user_id,
    password_hash,
    full_name,
    role,
    status,
    is_demo
)
VALUES
(
    'demo_officer',
    crypt('Demo@123', gen_salt('bf', 12)),
    'Demo Security Officer',
    'officer',
    'active',
    TRUE
)
ON CONFLICT (user_id)
DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status,
    is_demo = TRUE;


-- ============================================================
-- 12. DEMO DOCUMENTS
-- ============================================================


-- ------------------------------------------------------------
-- DEMO 1: GENUINE PASSPORT
-- ------------------------------------------------------------

INSERT INTO public.documents
(
    document_type,
    document_number,
    full_name,
    nationality,
    date_of_birth,
    date_of_expiry,
    gender,
    issuing_country,
    issuing_authority,
    file_path,
    document_hash,
    ocr_text,
    ocr_data,
    validation_data,
    document_status,
    created_by,
    is_demo
)
VALUES
(
    'passport',
    'DEMO-PPT-001',
    'TEST PERSON ALPHA',
    'IND',
    '1998-03-14',
    '2031-08-20',
    'M',
    'India',
    'Demo Passport Authority',
    'demo_documents/DEMO-PPT-001.png',

    encode(
        digest('DEMO-PPT-001', 'sha256'),
        'hex'
    ),

    'TEST PERSON ALPHA | DEMO-PPT-001 | IND | 14 MAR 1998 | 20 AUG 2031',

    jsonb_build_object(
        'full_name', 'TEST PERSON ALPHA',
        'document_number', 'DEMO-PPT-001',
        'nationality', 'IND',
        'date_of_birth', '1998-03-14',
        'date_of_expiry', '2031-08-20',
        'gender', 'M',
        'confidence', 98.50
    ),

    jsonb_build_object(
        'required_fields', TRUE,
        'document_number_format', TRUE,
        'date_validation', TRUE,
        'expiry_validation', TRUE,
        'mrz_validation', TRUE,
        'internal_consistency', TRUE
    ),

    'ACTIVE',

    (
        SELECT id
        FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    TRUE
);


-- ------------------------------------------------------------
-- DEMO 2: GENUINE DRIVING LICENSE
-- ------------------------------------------------------------

INSERT INTO public.documents
(
    document_type,
    document_number,
    full_name,
    nationality,
    date_of_birth,
    date_of_expiry,
    gender,
    issuing_country,
    issuing_authority,
    file_path,
    document_hash,
    ocr_text,
    ocr_data,
    validation_data,
    document_status,
    created_by,
    is_demo
)
VALUES
(
    'driving_license',
    'DEMO-DL-002',
    'TEST PERSON BETA',
    'IND',
    '2000-07-22',
    '2030-07-21',
    'F',
    'India',
    'Demo Transport Authority',
    'demo_documents/DEMO-DL-002.png',

    encode(
        digest('DEMO-DL-002', 'sha256'),
        'hex'
    ),

    'TEST PERSON BETA | DEMO-DL-002 | DOB 22 JUL 2000 | EXP 21 JUL 2030',

    jsonb_build_object(
        'full_name', 'TEST PERSON BETA',
        'document_number', 'DEMO-DL-002',
        'nationality', 'IND',
        'date_of_birth', '2000-07-22',
        'date_of_expiry', '2030-07-21',
        'gender', 'F',
        'confidence', 97.20
    ),

    jsonb_build_object(
        'required_fields', TRUE,
        'document_number_format', TRUE,
        'date_validation', TRUE,
        'expiry_validation', TRUE,
        'internal_consistency', TRUE
    ),

    'ACTIVE',

    (
        SELECT id
        FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    TRUE
);


-- ------------------------------------------------------------
-- DEMO 3: EXPIRED PASSPORT
-- ------------------------------------------------------------

INSERT INTO public.documents
(
    document_type,
    document_number,
    full_name,
    nationality,
    date_of_birth,
    date_of_expiry,
    gender,
    issuing_country,
    issuing_authority,
    file_path,
    document_hash,
    ocr_text,
    ocr_data,
    validation_data,
    document_status,
    created_by,
    is_demo
)
VALUES
(
    'passport',
    'DEMO-PPT-003',
    'TEST PERSON GAMMA',
    'IND',
    '1995-11-02',
    '2024-05-10',
    'M',
    'India',
    'Demo Passport Authority',
    'demo_documents/DEMO-PPT-003.png',

    encode(
        digest('DEMO-PPT-003', 'sha256'),
        'hex'
    ),

    'TEST PERSON GAMMA | DEMO-PPT-003 | IND | 02 NOV 1995 | 10 MAY 2024',

    jsonb_build_object(
        'full_name', 'TEST PERSON GAMMA',
        'document_number', 'DEMO-PPT-003',
        'nationality', 'IND',
        'date_of_birth', '1995-11-02',
        'date_of_expiry', '2024-05-10',
        'gender', 'M',
        'confidence', 96.80
    ),

    jsonb_build_object(
        'required_fields', TRUE,
        'document_number_format', TRUE,
        'date_validation', TRUE,
        'expiry_validation', FALSE,
        'mrz_validation', TRUE,
        'internal_consistency', TRUE
    ),

    'EXPIRED',

    (
        SELECT id
        FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    TRUE
);


-- ------------------------------------------------------------
-- DEMO 4: TAMPERED PASSPORT
-- ------------------------------------------------------------

INSERT INTO public.documents
(
    document_type,
    document_number,
    full_name,
    nationality,
    date_of_birth,
    date_of_expiry,
    gender,
    issuing_country,
    issuing_authority,
    file_path,
    document_hash,
    ocr_text,
    ocr_data,
    validation_data,
    document_status,
    created_by,
    is_demo
)
VALUES
(
    'passport',
    'DEMO-PPT-004',
    'TEST PERSON DELTA',
    'IND',
    '1997-01-18',
    '2030-12-30',
    'M',
    'India',
    'Demo Passport Authority',
    'demo_documents/DEMO-PPT-004-TAMPERED.png',

    encode(
        digest('DEMO-PPT-004-TAMPERED', 'sha256'),
        'hex'
    ),

    'TEST PERSON DELTA | DEMO-PPT-004 | IND | 18 JAN 1997 | 30 DEC 2030',

    jsonb_build_object(
        'full_name', 'TEST PERSON DELTA',
        'document_number', 'DEMO-PPT-004',
        'nationality', 'IND',
        'date_of_birth', '1997-01-18',
        'date_of_expiry', '2030-12-30',
        'gender', 'M',
        'confidence', 95.40
    ),

    jsonb_build_object(
        'required_fields', TRUE,
        'document_number_format', TRUE,
        'date_validation', TRUE,
        'expiry_validation', TRUE,
        'mrz_validation', TRUE,
        'internal_consistency', FALSE
    ),

    'ACTIVE',

    (
        SELECT id
        FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    TRUE
);


-- ------------------------------------------------------------
-- DEMO 5: FACE MISMATCH
-- ------------------------------------------------------------

INSERT INTO public.documents
(
    document_type,
    document_number,
    full_name,
    nationality,
    date_of_birth,
    date_of_expiry,
    gender,
    issuing_country,
    issuing_authority,
    file_path,
    document_hash,
    ocr_text,
    ocr_data,
    validation_data,
    document_status,
    created_by,
    is_demo
)
VALUES
(
    'passport',
    'DEMO-PPT-005',
    'TEST PERSON EPSILON',
    'IND',
    '1999-09-09',
    '2032-09-08',
    'F',
    'India',
    'Demo Passport Authority',
    'demo_documents/DEMO-PPT-005.png',

    encode(
        digest('DEMO-PPT-005', 'sha256'),
        'hex'
    ),

    'TEST PERSON EPSILON | DEMO-PPT-005 | IND | 09 SEP 1999 | 08 SEP 2032',

    jsonb_build_object(
        'full_name', 'TEST PERSON EPSILON',
        'document_number', 'DEMO-PPT-005',
        'nationality', 'IND',
        'date_of_birth', '1999-09-09',
        'date_of_expiry', '2032-09-08',
        'gender', 'F',
        'confidence', 97.80
    ),

    jsonb_build_object(
        'required_fields', TRUE,
        'document_number_format', TRUE,
        'date_validation', TRUE,
        'expiry_validation', TRUE,
        'mrz_validation', TRUE,
        'internal_consistency', TRUE
    ),

    'ACTIVE',

    (
        SELECT id
        FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    TRUE
);


-- ------------------------------------------------------------
-- DEMO 6: VISA
-- ------------------------------------------------------------

INSERT INTO public.documents
(
    document_type,
    document_number,
    full_name,
    nationality,
    date_of_birth,
    date_of_expiry,
    gender,
    visa_type,
    visa_entry_type,
    visa_stay_duration_days,
    issuing_country,
    issuing_authority,
    file_path,
    document_hash,
    ocr_text,
    ocr_data,
    validation_data,
    document_status,
    created_by,
    is_demo
)
VALUES
(
    'visa',
    'DEMO-VISA-006',
    'TEST PERSON ZETA',
    'IND',
    '1996-04-25',
    '2027-04-24',
    'F',
    'Tourist',
    'Multiple',
    90,
    'Demo Country',
    'Demo Immigration Authority',
    'demo_documents/DEMO-VISA-006.png',

    encode(
        digest('DEMO-VISA-006', 'sha256'),
        'hex'
    ),

    'TEST PERSON ZETA | DEMO-VISA-006 | TOURIST | MULTIPLE | 90 DAYS',

    jsonb_build_object(
        'full_name', 'TEST PERSON ZETA',
        'document_number', 'DEMO-VISA-006',
        'nationality', 'IND',
        'visa_type', 'Tourist',
        'entry_type', 'Multiple',
        'stay_duration_days', 90,
        'confidence', 96.40
    ),

    jsonb_build_object(
        'required_fields', TRUE,
        'document_number_format', TRUE,
        'date_validation', TRUE,
        'expiry_validation', TRUE,
        'visa_type_validation', TRUE
    ),

    'ACTIVE',

    (
        SELECT id
        FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    TRUE
);


-- ============================================================
-- 13. DEMO VERIFICATION RECORDS
-- ============================================================


-- ------------------------------------------------------------
-- VERIFIED
-- ------------------------------------------------------------

INSERT INTO public.verification_records
(
    document_id,
    officer_id,
    ocr_status,
    ocr_confidence,
    validation_status,
    mrz_valid,
    required_fields_complete,
    tampering_status,
    tampering_score,
    tampering_confidence,
    tampering_regions,
    face_verification_status,
    face_match_score,
    face_match,
    risk_score,
    risk_level,
    final_result,
    reasons,
    module_results,
    model_versions,
    processing_time_ms,
    is_demo
)
VALUES
(
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-001'
    ),

    (
        SELECT id FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    'PASSED',
    98.50,

    'VALID',
    TRUE,
    TRUE,

    'NOT_DETECTED',
    4.20,
    96.50,

    '[]'::jsonb,

    'MATCH',
    96.80,
    TRUE,

    8.50,
    'LOW',
    'VERIFIED',

    jsonb_build_array(
        'All required fields detected',
        'Document is within validity period',
        'MRZ validation passed',
        'No significant tampering detected',
        'Face verification matched'
    ),

    jsonb_build_object(
        'ocr', 'PASSED',
        'validation', 'VALID',
        'tampering', 'NOT_DETECTED',
        'face_verification', 'MATCH',
        'risk', 'LOW'
    ),

    jsonb_build_object(
        'opencv', '4.x',
        'paddleocr', '3.x',
        'insightface', '0.x',
        'tensorflow', '2.x',
        'scikit_learn', '1.x'
    ),

    1240,
    TRUE
);


-- ------------------------------------------------------------
-- VERIFIED DRIVING LICENSE
-- ------------------------------------------------------------

INSERT INTO public.verification_records
(
    document_id,
    officer_id,
    ocr_status,
    ocr_confidence,
    validation_status,
    mrz_valid,
    required_fields_complete,
    tampering_status,
    tampering_score,
    tampering_confidence,
    tampering_regions,
    face_verification_status,
    face_match_score,
    face_match,
    risk_score,
    risk_level,
    final_result,
    reasons,
    module_results,
    processing_time_ms,
    is_demo
)
VALUES
(
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-DL-002'
    ),

    (
        SELECT id FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    'PASSED',
    97.20,

    'VALID',
    NULL,
    TRUE,

    'NOT_DETECTED',
    5.10,
    95.30,

    '[]'::jsonb,

    'MATCH',
    94.60,
    TRUE,

    11.20,
    'LOW',
    'VERIFIED',

    jsonb_build_array(
        'Required fields detected',
        'License is valid',
        'No major image anomalies',
        'Face matched reference image'
    ),

    jsonb_build_object(
        'ocr', 'PASSED',
        'validation', 'VALID',
        'tampering', 'NOT_DETECTED',
        'face_verification', 'MATCH',
        'risk', 'LOW'
    ),

    1380,
    TRUE
);


-- ------------------------------------------------------------
-- EXPIRED DOCUMENT
-- ------------------------------------------------------------

INSERT INTO public.verification_records
(
    document_id,
    officer_id,
    ocr_status,
    ocr_confidence,
    validation_status,
    mrz_valid,
    required_fields_complete,
    tampering_status,
    tampering_score,
    tampering_confidence,
    face_verification_status,
    face_match_score,
    face_match,
    risk_score,
    risk_level,
    final_result,
    reasons,
    module_results,
    processing_time_ms,
    is_demo
)
VALUES
(
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-003'
    ),

    (
        SELECT id FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    'PASSED',
    96.80,

    'EXPIRED',
    TRUE,
    TRUE,

    'NOT_DETECTED',
    3.80,
    97.10,

    'MATCH',
    95.10,
    TRUE,

    74.50,
    'HIGH',
    'EXPIRED',

    jsonb_build_array(
        'OCR extraction successful',
        'MRZ validation passed',
        'Document expiry date has passed',
        'Document requires renewal'
    ),

    jsonb_build_object(
        'ocr', 'PASSED',
        'validation', 'EXPIRED',
        'tampering', 'NOT_DETECTED',
        'face_verification', 'MATCH',
        'risk', 'HIGH'
    ),

    1180,
    TRUE
);


-- ------------------------------------------------------------
-- TAMPERED DOCUMENT
-- ------------------------------------------------------------

INSERT INTO public.verification_records
(
    document_id,
    officer_id,
    ocr_status,
    ocr_confidence,
    validation_status,
    mrz_valid,
    required_fields_complete,
    tampering_status,
    tampering_score,
    tampering_confidence,
    tampering_regions,
    face_verification_status,
    face_match_score,
    face_match,
    risk_score,
    risk_level,
    final_result,
    reasons,
    module_results,
    model_versions,
    processing_time_ms,
    is_demo
)
VALUES
(
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-004'
    ),

    (
        SELECT id FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    'PASSED',
    95.40,

    'SUSPICIOUS',
    TRUE,
    TRUE,

    'DETECTED',
    91.70,
    93.80,

    jsonb_build_array(
        jsonb_build_object(
            'region', 'photograph',
            'score', 0.94
        ),
        jsonb_build_object(
            'region', 'date_of_birth',
            'score', 0.88
        )
    ),

    'MATCH',
    92.40,
    TRUE,

    89.70,
    'HIGH',
    'SUSPICIOUS',

    jsonb_build_array(
        'Image manipulation indicators detected',
        'Photograph region shows abnormal compression',
        'Text region shows inconsistent edges',
        'Internal document consistency requires review'
    ),

    jsonb_build_object(
        'ocr', 'PASSED',
        'validation', 'SUSPICIOUS',
        'tampering', 'DETECTED',
        'face_verification', 'MATCH',
        'risk', 'HIGH'
    ),

    jsonb_build_object(
        'opencv', '4.x',
        'tensorflow', '2.x'
    ),

    2310,
    TRUE
);


-- ------------------------------------------------------------
-- FACE MISMATCH
-- ------------------------------------------------------------

INSERT INTO public.verification_records
(
    document_id,
    officer_id,
    ocr_status,
    ocr_confidence,
    validation_status,
    mrz_valid,
    required_fields_complete,
    tampering_status,
    tampering_score,
    tampering_confidence,
    face_verification_status,
    face_match_score,
    face_match,
    risk_score,
    risk_level,
    final_result,
    reasons,
    module_results,
    model_versions,
    processing_time_ms,
    is_demo
)
VALUES
(
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-005'
    ),

    (
        SELECT id FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    'PASSED',
    97.80,

    'VALID',
    TRUE,
    TRUE,

    'NOT_DETECTED',
    6.20,
    94.70,

    'MISMATCH',
    14.80,
    FALSE,

    94.20,
    'HIGH',
    'FAILED',

    jsonb_build_array(
        'Document fields are structurally valid',
        'Document image does not show major tampering',
        'Reference person face does not match document photograph',
        'Manual verification required'
    ),

    jsonb_build_object(
        'ocr', 'PASSED',
        'validation', 'VALID',
        'tampering', 'NOT_DETECTED',
        'face_verification', 'MISMATCH',
        'risk', 'HIGH'
    ),

    jsonb_build_object(
        'insightface', '0.x'
    ),

    2050,
    TRUE
);


-- ------------------------------------------------------------
-- VISA VERIFIED
-- ------------------------------------------------------------

INSERT INTO public.verification_records
(
    document_id,
    officer_id,
    ocr_status,
    ocr_confidence,
    validation_status,
    required_fields_complete,
    tampering_status,
    tampering_score,
    tampering_confidence,
    face_verification_status,
    face_match_score,
    face_match,
    risk_score,
    risk_level,
    final_result,
    reasons,
    module_results,
    processing_time_ms,
    is_demo
)
VALUES
(
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-VISA-006'
    ),

    (
        SELECT id FROM public.officers
        WHERE user_id = 'demo_officer'
    ),

    'PASSED',
    96.40,

    'VALID',
    TRUE,

    'NOT_DETECTED',
    4.60,
    96.20,

    'MATCH',
    93.70,
    TRUE,

    12.60,
    'LOW',
    'VERIFIED',

    jsonb_build_array(
        'Visa fields successfully extracted',
        'Visa expiry is valid',
        'Visa type validated',
        'No major tampering indicators detected',
        'Face verification passed'
    ),

    jsonb_build_object(
        'ocr', 'PASSED',
        'validation', 'VALID',
        'tampering', 'NOT_DETECTED',
        'face_verification', 'MATCH',
        'risk', 'LOW'
    ),

    1520,
    TRUE
);


-- ============================================================
-- 14. DEMO SCENARIOS
-- ============================================================

INSERT INTO public.demo_scenarios
(
    scenario_code,
    scenario_name,
    description,
    document_id,
    document_file_path,
    person_photo_path,
    expected_result,
    expected_risk_level,
    notes,
    is_active,
    is_demo
)
VALUES

(
    'SCN-001',
    'Genuine Passport',
    'Valid synthetic passport with consistent document fields.',
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-001'
    ),
    'demo_documents/DEMO-PPT-001.png',
    'demo_documents/person_alpha.png',
    'VERIFIED',
    'LOW',
    'Synthetic demonstration scenario only.',
    TRUE,
    TRUE
),

(
    'SCN-002',
    'Genuine Driving License',
    'Valid synthetic driving license.',
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-DL-002'
    ),
    'demo_documents/DEMO-DL-002.png',
    'demo_documents/person_beta.png',
    'VERIFIED',
    'LOW',
    'Synthetic demonstration scenario only.',
    TRUE,
    TRUE
),

(
    'SCN-003',
    'Expired Passport',
    'Passport with an expired validity date.',
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-003'
    ),
    'demo_documents/DEMO-PPT-003.png',
    'demo_documents/person_gamma.png',
    'EXPIRED',
    'HIGH',
    'Used to demonstrate expiry validation.',
    TRUE,
    TRUE
),

(
    'SCN-004',
    'Tampered Passport',
    'Synthetic document containing simulated image manipulation.',
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-004'
    ),
    'demo_documents/DEMO-PPT-004-TAMPERED.png',
    'demo_documents/person_delta.png',
    'SUSPICIOUS',
    'HIGH',
    'Used to demonstrate OpenCV/TensorFlow tampering detection.',
    TRUE,
    TRUE
),

(
    'SCN-005',
    'Face Mismatch',
    'Valid-looking synthetic document with a different reference person.',
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-PPT-005'
    ),
    'demo_documents/DEMO-PPT-005.png',
    'demo_documents/wrong_person.png',
    'FAILED',
    'HIGH',
    'Used to demonstrate InsightFace mismatch detection.',
    TRUE,
    TRUE
),

(
    'SCN-006',
    'Valid Visa',
    'Synthetic tourist visa with valid dates.',
    (
        SELECT id FROM public.documents
        WHERE document_number = 'DEMO-VISA-006'
    ),
    'demo_documents/DEMO-VISA-006.png',
    'demo_documents/person_zeta.png',
    'VERIFIED',
    'LOW',
    'Synthetic demonstration scenario only.',
    TRUE,
    TRUE
);


-- ============================================================
-- 15. AUDIT LOGS
-- ============================================================

INSERT INTO public.audit_logs
(
    verification_id,
    officer_id,
    action,
    document_hash,
    previous_hash,
    current_hash,
    metadata,
    is_demo
)

SELECT
    vr.id,
    vr.officer_id,
    'SCREENING_COMPLETED',
    d.document_hash,
    NULL,

    encode(
        digest(
            COALESCE(d.document_hash, '') ||
            vr.verification_id ||
            'SCREENING_COMPLETED',
            'sha256'
        ),
        'hex'
    ),

    jsonb_build_object(
        'final_result', vr.final_result,
        'risk_score', vr.risk_score,
        'risk_level', vr.risk_level,
        'demo_record', TRUE
    ),

    TRUE

FROM public.verification_records vr

JOIN public.documents d
    ON d.id = vr.document_id

WHERE vr.is_demo = TRUE;


-- ============================================================
-- 16. FINAL CHECK
-- ============================================================

SELECT
    'OFFICERS' AS table_name,
    COUNT(*) AS total_records
FROM public.officers

UNION ALL

SELECT
    'DOCUMENTS',
    COUNT(*)
FROM public.documents

UNION ALL

SELECT
    'VERIFICATION RECORDS',
    COUNT(*)
FROM public.verification_records

UNION ALL

SELECT
    'AUDIT LOGS',
    COUNT(*)
FROM public.audit_logs

UNION ALL

SELECT
    'DEMO SCENARIOS',
    COUNT(*)
FROM public.demo_scenarios;
