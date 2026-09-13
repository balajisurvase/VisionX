-- =============================================================================
-- IdentityGuard AI: Supabase PostgreSQL Schema & Security Policies
-- Problem Statement: AI-Based Fake Identity & Document Screening System (SIH 2026)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users / Officers Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Officer' CHECK (role IN ('Officer', 'Admin', 'Supervisor', 'Analyst')),
    email VARCHAR(255) UNIQUE,
    terminal_id VARCHAR(100) DEFAULT 'ICP-RAXAUL-01',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Verification Requests Table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN ('Passport', 'Driving License', 'Aadhaar', 'Voter ID', 'National ID', 'Visa')),
    file_url TEXT,
    document_hash VARCHAR(64), -- SHA-256 hash of original file
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Extracted Data (OCR & MRZ Results) Table
CREATE TABLE IF NOT EXISTS public.extracted_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE,
    document_number VARCHAR(100),
    full_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    gender VARCHAR(10),
    issue_date DATE,
    expiry_date DATE,
    mrz_line1 TEXT,
    mrz_line2 TEXT,
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verification Results (Scores, Risk & Verdict) Table
CREATE TABLE IF NOT EXISTS public.verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE,
    ocr_score NUMERIC(5, 2) DEFAULT 95.00,
    mrz_score NUMERIC(5, 2) DEFAULT 100.00,
    authenticity_score NUMERIC(5, 2) DEFAULT 90.00,
    tampering_score NUMERIC(5, 2) DEFAULT 0.00, -- 0-100 (higher = more tampering detected)
    face_match_score NUMERIC(5, 2) DEFAULT 94.00,
    risk_score NUMERIC(5, 2) NOT NULL, -- 0-30 LOW RISK, 31-70 MEDIUM RISK, 71-100 HIGH RISK
    confidence_score NUMERIC(5, 2) DEFAULT 92.50,
    final_status VARCHAR(50) NOT NULL CHECK (final_status IN ('VERIFIED', 'SUSPICIOUS', 'REJECTED')),
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Verification Logs (Step-by-step Audit Trail) Table
CREATE TABLE IF NOT EXISTS public.verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for High-Throughput Border Ingress Queries
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_extracted_data_docno ON public.extracted_data(document_number);
CREATE INDEX IF NOT EXISTS idx_verification_results_status ON public.verification_results(final_status);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verif ON public.verification_logs(verification_id);

-- 7. Supabase Storage Bucket Setup
-- Run this in Supabase SQL editor to create the secure document storage bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Initial Authorized Test Officers
INSERT INTO public.users (username, full_name, role, email, terminal_id)
VALUES 
    ('A001', 'Insp. Rajeshwar Singh', 'Officer', 'rajeshwar.ssb@mha.gov.in', 'ICP-RAXAUL-01'),
    ('A002', 'Sub-Insp. Priya Sharma', 'Officer', 'priya.sharma@mha.gov.in', 'ICP-JAYNAGAR-02'),
    ('A004', 'Admin Survase', 'Admin', 'admin.identityguard@mha.gov.in', 'HQ-NEWDELHI-00')
ON CONFLICT (username) DO NOTHING;
