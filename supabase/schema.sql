-- ============================================================
-- SIH 2026
-- AI-BASED FAKE IDENTITY & DOCUMENT SCREENING SYSTEM
-- DATABASE SCHEMA DEFINITIONS (DDL)
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 2. OFFICERS / USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'OFFICER',
    email VARCHAR(150),
    user_id VARCHAR(80) UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- 6B. BLACKLIST (SOVEREIGN WATCHLIST & INTERPOL NOTICES)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_number VARCHAR(100) NOT NULL,

    full_name VARCHAR(150),

    nationality VARCHAR(100),

    reason TEXT NOT NULL,

    severity VARCHAR(20) DEFAULT 'CRITICAL'
        CHECK (severity IN ('CRITICAL', 'HIGH', 'WARNING')),

    issuing_agency VARCHAR(100) DEFAULT 'SSB / MHA / INTERPOL',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    added_by UUID REFERENCES public.officers(id),

    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_documents_document_number
ON public.documents(document_number);

CREATE INDEX IF NOT EXISTS idx_blacklist_document_number
ON public.blacklist(document_number);

CREATE INDEX IF NOT EXISTS idx_blacklist_full_name
ON public.blacklist(full_name);

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
    ('documents', 'documents', FALSE),
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
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;


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
DROP POLICY IF EXISTS "deny_direct_blacklist" ON public.blacklist;


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


CREATE POLICY "deny_direct_blacklist"
ON public.blacklist
FOR ALL
TO anon, authenticated
USING (FALSE)
WITH CHECK (FALSE);
