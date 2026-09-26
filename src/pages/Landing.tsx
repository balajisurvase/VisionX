import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scan,
  Sparkles,
  FileCheck2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Camera,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Server,
  Terminal,
} from 'lucide-react';
import { OfficerUser } from '../types/auth';
import { loginWithUserId } from '../services/authService';

interface LandingProps {
  onStartVerification: () => void;
  onViewDemo?: () => void;
  onQuickLogin?: (user: OfficerUser) => void;
}

export const Landing: React.FC<LandingProps> = ({
  onStartVerification,
}) => {
  const pipelineSteps = [
    { step: '01', title: 'Document Upload', desc: 'Secure upload of Passport, ID or Visa' },
    { step: '02', title: 'Image Processing', desc: 'Noise reduction, perspective alignment & DPI boost' },
    { step: '03', title: 'OCR Extraction', desc: 'Dual-engine text & optical character recognition' },
    { step: '04', title: 'MRZ Validation', desc: 'ICAO Doc 9303 modulo-10 7-3-1 weight check' },
    { step: '05', title: 'Authenticity Analysis', desc: 'Hologram, security fonts, microprint & layout' },
    { step: '06', title: 'Tampering Detection', desc: 'Error Level Analysis (ELA), photo splicing & font glyph audit' },
    { step: '07', title: 'Face Verification', desc: '1:1 facial biometric matching & liveness check' },
    { step: '08', title: 'Risk Engine', desc: 'Multi-factor threat score & final decision' },
  ];

  const techStack = [
    { name: 'Computer Vision', category: 'Forensics', desc: 'Error Level Analysis (ELA) and edge artifact detection for tampering identification.' },
    { name: 'OCR Engine', category: 'Text Extraction', desc: 'Neural vision and high-accuracy optical character recognition extracting structured VIZ metadata.' },
    { name: 'MRZ Standard', category: 'Standards Compliance', desc: 'Mathematical modulo 10 checksum validation on 2-line & 3-line travel documents.' },
    { name: 'Document Analysis', category: 'Forensics', desc: 'Layout geometry, font regularity, expiry timeline and cross-field consistency.' },
    { name: 'Face Verification', category: 'Biometrics', desc: 'Cosine similarity matching between document photo & live desk capture.' },
    { name: 'Risk Scoring Engine', category: 'Threat Modeling', desc: 'Weighted algorithm returning 0–100 threat score categorized into Low, Medium, High.' },
    { name: 'Cryptographic Ledger', category: 'Audit Trail', desc: 'Relational schemas, cryptographic hashes, and tamper-evident document storage.' },
    { name: 'Security Architecture', category: 'Backend Runtime', desc: 'High-throughput sovereign architecture powering real-time verification.' },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0B1220]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Visi0nx</span>
              </div>
              <p className="text-[11px] text-slate-400">Identity & Document Verification System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onStartVerification}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>Officer Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#0B1220] via-[#070B14] to-[#070B14]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH 2026 Problem Statement 26188 Prototype</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AI-Powered Identity & <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Document Screening
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Detect suspicious identity documents using automated document analysis, OCR, ICAO 9303 validation, and multi-factor threat risk scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartVerification}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Officer Terminal Access</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10 text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-white">8 Stages</div>
              <div className="text-xs text-slate-400 mt-0.5">Automated Pipeline</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-emerald-400">&lt; 2.5s</div>
              <div className="text-xs text-slate-400 mt-0.5">Inspection Latency</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-blue-400">0 - 100</div>
              <div className="text-xs text-slate-400 mt-0.5">Dynamic Risk Score</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black text-amber-400">SHA-256</div>
              <div className="text-xs text-slate-400 mt-0.5">Tamper-Proof Audit</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Operational Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How IdentityGuard AI Works</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From raw passenger travel document upload to conclusive forensic risk verdict in under three seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Scan className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-blue-400 font-bold">STEP 01</div>
            <h3 className="font-bold text-white text-base">Document Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop or snapshot any official passport, driving license, Aadhaar, or national ID in JPG, PNG, or PDF format.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-indigo-400 font-bold">STEP 02</div>
            <h3 className="font-bold text-white text-base">OCR & MRZ Extraction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-accuracy optical text recognition parses Visual Inspection Zone (VIZ) and Machine Readable Zone (MRZ).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-amber-400 font-bold">STEP 03</div>
            <h3 className="font-bold text-white text-base">Forensics & Checksums</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Error Level Analysis (ELA) detects photo splicing, while modulo-10 algorithm validates document authenticity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold">STEP 04</div>
            <h3 className="font-bold text-white text-base">Risk Score & Verdict</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The engine delivers a calibrated 0-100 risk index: VERIFIED, SUSPICIOUS (secondary review), or REJECTED.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Pipeline Visualization */}
      <section className="py-16 bg-[#0B1220]/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Architecture Flow</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">8-Stage Verification Pipeline</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Automated end-to-end computer vision and cryptographic pipeline.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {pipelineSteps.map((p) => (
              <div
                key={p.step}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left flex flex-col justify-between space-y-2 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-blue-400">{p.step}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-snug">{p.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> 0–30: LOW RISK (VERIFIED)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 31–70: MEDIUM RISK (SUSPICIOUS)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> 71–100: HIGH RISK (REJECTED)</span>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Stack & Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Underlying Technology Modules</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Engineered for high accuracy, standard compliance, and immediate border post deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  {tech.category}
                </span>
                <Cpu className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-bold text-white text-sm">{tech.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Reliability */}
      <section className="py-16 bg-[#0B1220]/60 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Defense-Grade Integrity</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Security & Audit Compliance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <Lock className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Protected Roles & Auth</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Role-based access control with token expiration, officer badge validation, and secured route boundaries.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Supabase Storage & DB</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated relational tables for verification requests, extracted data, audit logs, and encrypted file storage.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Tamper-Proof Audit Chain</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cryptographic SHA-256 block ledger linking each inspection event, timestamp, officer ID, and document hash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="py-16 px-4 text-center space-y-6 border-t border-slate-800/80">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold text-white">Ready to inspect document samples?</h2>
          <p className="text-xs text-slate-400">
            Launch the officer console with pre-loaded demo scenarios or upload your own sample credentials.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onStartVerification}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <span>Launch Officer Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-8 text-[11px] text-slate-400 font-mono">
          IdentityGuard AI • Smart India Hackathon (SIH) 2026 • Problem Statement 26188 Prototype
        </div>
      </footer>
    </div>
  );
};
