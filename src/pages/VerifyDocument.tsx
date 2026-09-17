import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Camera,
  Layers,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Lock,
  MessageSquare,
  ArrowRight,
  Check,
  X,
  CreditCard,
  BookOpen,
  Car,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DocumentType,
  VerificationRecord,
  DemoScenario,
} from '../types/verification';
import { OfficerUser } from '../types/auth';
import { saveScreeningResult, DEMO_SCENARIOS } from '../services/verificationService';
import { screenDocument } from '../services/api';
import { CameraCapture } from '../components/CameraCapture';
import { VerificationProgressBar } from '../components/verification/VerificationProgressBar';
import { DocumentInspectionViewport } from '../components/verification/DocumentInspectionViewport';
import { MrzInspector } from '../components/verification/MrzInspector';
import { ForensicsElaViewer } from '../components/verification/ForensicsElaViewer';
import { BlockchainAuditBadge } from '../components/verification/BlockchainAuditBadge';
import { OfficerDecisionSection } from '../components/verification/OfficerDecisionSection';
import { RealTimeTimelineCard } from '../components/verification/RealTimeTimelineCard';
import { VisibleVsMrzTable } from '../components/verification/VisibleVsMrzTable';
import { DocumentPortraitCard } from '../components/verification/DocumentPortraitCard';
import { BiometricMatchView } from '../components/verification/BiometricMatchView';
import { ForensicReportModal } from '../components/verification/ForensicReportModal';
import { calculateThreatRiskScore } from '../utils/riskScoring';
import {
  formatVisualDate,
  generateTd3Mrz,
  evaluateRealTimeExpiry,
} from '../utils/mrzUtils';

interface VerifyDocumentProps {
  user: OfficerUser | null;
  activeDemoScenario: DemoScenario | null;
  inspectedRecord?: VerificationRecord | null;
  onClearDemo: () => void;
  onNavigate: (path: string) => void;
}

export const VerifyDocument: React.FC<VerifyDocumentProps> = ({
  user,
  activeDemoScenario,
  inspectedRecord,
  onClearDemo,
  onNavigate,
}) => {
  // Step State: 1 (Select Document), 2 (Upload Document), 3 (Review), 4 (Verification), 5 (Result)
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('Passport');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [personPhotoFile, setPersonPhotoFile] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null);
  const [selectedDemoScenario, setSelectedDemoScenario] = useState<DemoScenario | null>(null);

  // Live Camera Desk Capture Mode
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'face' | 'doc'>('face');

  const [isScreening, setIsScreening] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<VerificationRecord | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorStage, setErrorStage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Active Tab in Post-Screening Inspection Console
  const [activeTab, setActiveTab] = useState<'overview' | 'mrz' | 'forensics' | 'blockchain' | 'decision'>('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Synchronize when demo scenario is chosen
  useEffect(() => {
    if (activeDemoScenario) {
      loadScenario(activeDemoScenario);
      setTimeout(() => {
        executeScreening(activeDemoScenario);
      }, 300);
    }
  }, [activeDemoScenario]);

  // Synchronize when record is inspected from Dashboard or History
  useEffect(() => {
    if (inspectedRecord) {
      setSelectedDocType(inspectedRecord.document_type);
      setCurrentResult(inspectedRecord);
      setCurrentStep(5);
      setUploadedPreviewUrl(inspectedRecord.document_face_url || null);
    }
  }, [inspectedRecord]);

  const loadScenario = (scenario: DemoScenario) => {
    setSelectedDemoScenario(scenario);
    setSelectedDocType(scenario.document_type);
    setUploadedFile(null);
    setPersonPhotoFile(null);
    setUploadedPreviewUrl(null);
    setCurrentResult(null);
    setSaveSuccess(false);
    setErrorMessage(null);
    setErrorStage(null);
    setErrorDetails(null);
    setIsLiveCameraActive(false);
    setActiveTab('overview');
    setCurrentStep(3);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadedPreviewUrl(URL.createObjectURL(file));
      setSelectedDemoScenario(null);
      setCurrentResult(null);
      setSaveSuccess(false);
      setErrorMessage(null);
      setErrorStage(null);
      setErrorDetails(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadedPreviewUrl(URL.createObjectURL(file));
      setSelectedDemoScenario(null);
      setCurrentResult(null);
      setSaveSuccess(false);
      setErrorMessage(null);
      setErrorStage(null);
      setErrorDetails(null);
    }
  };

  const handlePersonPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPersonPhotoFile(file);
      setPersonPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleLiveCameraCaptured = (blob: Blob, dataUrl: string) => {
    if (cameraMode === 'face') {
      const file = new File([blob], 'traveler_desk_capture.jpg', { type: 'image/jpeg' });
      setPersonPhotoFile(file);
      setPersonPreviewUrl(dataUrl);
    } else {
      const file = new File([blob], 'scanned_doc_capture.jpg', { type: 'image/jpeg' });
      setUploadedFile(file);
      setUploadedPreviewUrl(dataUrl);
    }
    setIsLiveCameraActive(false);
  };

  const executeScreening = async (scenarioToRun?: DemoScenario) => {
    const scenario = scenarioToRun || selectedDemoScenario;
    setIsScreening(true);
    setCurrentStep(4);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      if (uploadedFile) {
        const record = await screenDocument(
          uploadedFile,
          personPhotoFile,
          selectedDocType,
          user?.user_id || 'officer001'
        );
        setCurrentResult(record);
        setCurrentStep(5);
      } else {
        const activeScenario = scenario || DEMO_SCENARIOS[0];
        const scenarioDocType = (activeScenario.document_type as DocumentType) || selectedDocType;
        const autoMrz = generateTd3Mrz({
          fullName: activeScenario.applicant_name,
          documentNumber: activeScenario.document_number,
          nationality: 'IND',
          dateOfBirth: activeScenario.date_of_birth,
          gender: 'F',
          dateOfExpiry: activeScenario.date_of_expiry,
        });

        const expEval = evaluateRealTimeExpiry(activeScenario.date_of_expiry);
        const isExp = activeScenario.expected_result === 'EXPIRED' || expEval.isExpired;
        const isTampered = activeScenario.expected_result === 'TAMPERED';
        const hasPerson = Boolean(personPhotoFile || activeScenario.face_match_score > 0);

        const scenarioRisk = calculateThreatRiskScore({
          ocrConfidence: activeScenario.expected_result === 'UNREADABLE' ? 45 : 98,
          mrzChecksumValid: activeScenario.expected_result !== 'MRZ_TAMPERED',
          mrzVizMatched: activeScenario.expected_result !== 'MRZ_TAMPERED',
          tamperingScore: isTampered ? 88 : 0,
          hasPersonPhoto: hasPerson,
          faceMatchScore: activeScenario.face_match_score,
          faceMatched: activeScenario.face_match_score > 70,
          isExpired: isExp,
          daysRemainingOrElapsed: expEval.diffDays,
          isExpiringSoon: expEval.isExpiringSoon,
        });

        const resultRecord: VerificationRecord = {
          id: Math.floor(1000 + Math.random() * 9000),
          verification_id: `VER-${Math.floor(100000 + Math.random() * 900000)}`,
          document_type: scenarioDocType,
          document_number: activeScenario.document_number,
          applicant_name: activeScenario.applicant_name,
          date_of_birth: activeScenario.date_of_birth,
          date_of_expiry: activeScenario.date_of_expiry,
          nationality: activeScenario.nationality || 'IND',
          verification_status: isExp ? 'EXPIRED' : (scenarioRisk.verdict as any),
          risk_score: scenarioRisk.totalRiskScore,
          risk_level: scenarioRisk.totalRiskScore > 70 ? 'HIGH' : scenarioRisk.totalRiskScore > 30 ? 'MEDIUM' : 'LOW',
          ocr_status: activeScenario.expected_result === 'UNREADABLE' ? 'FAILED' : 'PASSED',
          validation_status: activeScenario.expected_result === 'MRZ_TAMPERED' || isExp ? 'FAILED' : 'PASSED',
          tampering_status: isTampered ? 'FAILED' : 'PASSED',
          face_match_status: activeScenario.face_match_score > 70 ? 'PASSED' : 'FAILED',
          document_status: isExp ? 'EXPIRED' : isTampered ? 'TAMPERED' : 'VALID',
          verified_by: user?.user_id || 'officer001',
          created_at: new Date().toISOString(),
          document_hash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
          reasons: activeScenario.reasons || [],
          ocr_data: {
            full_name: activeScenario.applicant_name,
            document_number: activeScenario.document_number,
            date_of_birth: activeScenario.date_of_birth,
            date_of_expiry: activeScenario.date_of_expiry,
            nationality: activeScenario.nationality || 'IND',
            gender: 'U',
            confidence_score: activeScenario.expected_result === 'UNREADABLE' ? 45 : 98.4,
            mrz_line_1: autoMrz.line1,
            mrz_line_2: autoMrz.line2,
          },
          validation_details: {
            format_valid: true,
            required_fields_present: true,
            date_format_valid: true,
            mrz_checksum_valid: activeScenario.expected_result !== 'MRZ_TAMPERED',
            document_not_expired: !isExp,
            consistency_checked: activeScenario.expected_result !== 'MRZ_TAMPERED',
            verdict: isExp ? 'EXPIRED' : activeScenario.expected_result === 'MRZ_TAMPERED' ? 'INVALID' : 'VALID',
            failure_reasons: isExp ? ['Document expired'] : activeScenario.expected_result === 'MRZ_TAMPERED' ? ['MRZ Checksum invalid'] : [],
          },
          tampering_details: {
            photo_replacement_status: isTampered ? 'DETECTED' : 'NO_ISSUE',
            text_manipulation_status: isTampered ? 'DETECTED' : 'NO_ISSUE',
            stamp_analysis_status: 'NO_ISSUE',
            metadata_analysis_status: isTampered ? 'MODIFIED' : 'NO_ISSUE',
            tampering_probability: isTampered ? 88.5 : 4.2,
            verdict: isTampered ? 'TAMPERING DETECTED' : 'DOCUMENT APPEARS AUTHENTIC',
            detected_anomalies: isTampered ? ['Photo Bio-Frame Area', 'Expiry Numeric Layer'] : [],
          },
          face_details: {
            document_face_url: '',
            presented_face_url: '',
            match_score: activeScenario.face_match_score,
            face_detected: true,
            liveness_passed: activeScenario.face_match_score > 50,
            verdict: activeScenario.face_match_score > 70 ? 'FACE MATCH' : 'FACE MISMATCH',
            confidence_metric: `Biometric Cosine Match: ${(activeScenario.face_match_score / 100).toFixed(3)}`,
          },
        };

        setCurrentResult(resultRecord);
        setCurrentStep(5);
      }
    } catch (err: any) {
      console.error('Verification execution error:', err);
      const stage = err?.stage || (err?.message && err.message.includes('Verification failed at:') ? err.message.split('Verification failed at:')[1]?.split('-')[0]?.trim() : null);
      const details = err?.details || null;
      setErrorStage(stage || 'PIPELINE');
      setErrorDetails(details);
      setErrorMessage(err?.message || 'Verification could not be completed. Please check the document image and try again.');
      setCurrentStep(3);
    } finally {
      setIsScreening(false);
    }
  };

  const handleSaveScreening = async (customNotes?: string) => {
    if (!currentResult) return;
    setIsSaving(true);
    try {
      const recordToSave: VerificationRecord = {
        ...currentResult,
        notes: customNotes || currentResult.notes,
      };
      await saveScreeningResult(recordToSave);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Failed to commit screening record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsScreening(false);
    setCurrentResult(null);
    setUploadedFile(null);
    setPersonPhotoFile(null);
    setUploadedPreviewUrl(null);
    setPersonPreviewUrl(null);
    setSelectedDemoScenario(null);
    setSaveSuccess(false);
    setErrorMessage(null);
    setErrorStage(null);
    setErrorDetails(null);
    setIsLiveCameraActive(false);
    setActiveTab('overview');
    onClearDemo();
  };

  const docTypeOptions: { type: DocumentType; label: string; desc: string; icon: any }[] = [
    {
      type: 'Passport',
      label: 'PASSPORT',
      desc: 'International travel passports with ICAO 9303 MRZ zone',
      icon: BookOpen,
    },
    {
      type: 'National ID',
      label: 'NATIONAL ID',
      desc: 'Government-issued citizen identity smart cards & IDs',
      icon: CreditCard,
    },
    {
      type: 'Driving License',
      label: 'DRIVING LICENSE',
      desc: 'State and national motor vehicle driver licenses',
      icon: Car,
    },
    {
      type: 'Permit',
      label: 'VISA / PERMIT',
      desc: 'Visas, residence permits, and official border credentials',
      icon: FileSpreadsheet,
    },
  ];

  const stepsList = [
    { num: 1, label: '01 SELECT DOCUMENT' },
    { num: 2, label: '02 UPLOAD' },
    { num: 3, label: '03 REVIEW' },
    { num: 4, label: '04 VERIFICATION' },
    { num: 5, label: '05 RESULT' },
  ];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className={`p-3 sm:p-4 md:p-5 max-w-7xl mx-auto ${
        currentStep === 4 ? 'space-y-3 overflow-hidden' : 'space-y-5'
      } text-[#10233F]`}
    >
      {/* Header Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#C9DCF8] rounded-[8px] ${
          currentStep === 4 ? 'p-3 md:p-3.5' : 'p-4 md:p-5'
        }`}
      >
        <div>
          <h1
            className={`${
              currentStep === 4 ? 'text-[22px] md:text-[24px]' : 'text-[28px] md:text-[32px]'
            } font-bold text-[#10233F] uppercase tracking-tight leading-tight`}
          >
            New Verification Workstation
          </h1>
          <p
            className={`${
              currentStep === 4 ? 'text-[13px] md:text-[14px]' : 'text-[15px] md:text-[17px]'
            } text-[#64748B] mt-0.5 font-normal leading-tight`}
          >
            Automated computer vision & biometric identity screening pipeline
          </p>
        </div>

        {currentStep === 5 && (
          <button
            onClick={handleReset}
            id="btn-new-verification"
            className="px-6 py-2.5 rounded-[6px] text-[15px] font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer flex items-center gap-2 uppercase shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Verification</span>
          </button>
        )}
      </div>

      {/* 5-STEP PROCESS BAR */}
      <div
        className={`bg-white border border-[#C9DCF8] rounded-[8px] ${
          currentStep === 4 ? 'p-2' : 'p-3 md:p-4'
        }`}
      >
        <div className="grid grid-cols-5 gap-2 text-center">
          {stepsList.map((st) => {
            const isDone = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep && currentStep !== 4) {
                    setCurrentStep(st.num);
                  }
                }}
                className={`flex items-center justify-center gap-2 p-2 sm:p-2.5 rounded-[6px] transition-none ${
                  isCurrent
                    ? 'bg-[#102A56] text-white font-bold'
                    : isDone
                    ? 'bg-[#DCFCE7] text-[#15803D] font-bold border border-green-300 cursor-pointer'
                    : 'bg-[#F5F9FF] text-[#64748B] font-normal border border-[#C9DCF8]'
                }`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                    isDone
                      ? 'bg-[#15803D] text-white'
                      : isCurrent
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#EAF2FF] text-[#10233F]'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : st.num}
                </div>
                <span className="text-[12px] sm:text-[13px] uppercase truncate hidden md:inline">
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-[8px] bg-red-50 border border-red-200 text-[#B91C1C] text-[15px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#B91C1C]" />
            <div>
              <span className="font-bold uppercase block">Verification Error</span>
              <p className="font-normal">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-3 py-1 bg-white border border-red-200 rounded-[4px] text-[13px] font-bold uppercase cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: SELECT DOCUMENT TYPE */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6">
          <div className="border-b border-[#C9DCF8] pb-4">
            <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
              Step 01: Select Document Type
            </h2>
            <p className="text-[16px] text-[#64748B] mt-1 font-normal">
              Select the category of identification document for verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {docTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedDocType === opt.type;
              return (
                <div
                  key={opt.type}
                  onClick={() => setSelectedDocType(opt.type)}
                  className={`p-6 rounded-[8px] border transition-none cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#EAF2FF]'
                      : 'border-[#C9DCF8] bg-white hover:bg-[#F5F9FF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-[6px] flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'bg-[#EAF2FF] text-[#10233F]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#15803D] text-white flex items-center justify-center font-bold text-xs">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#10233F]">{opt.label}</h3>
                    <p className="text-[14px] text-[#64748B] mt-1 font-normal leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#C9DCF8]">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-[16px] uppercase rounded-[6px] flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Upload</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: UPLOAD DOCUMENT */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-4">
            <div>
              <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
                Step 02: Upload {selectedDocType}
              </h2>
              <p className="text-[16px] text-[#64748B] mt-1 font-normal">
                Upload a high-resolution image scan of the document bio-page.
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-[4px] text-[14px] font-bold bg-[#EAF2FF] text-[#2563EB] border border-[#C9DCF8] uppercase">
              {selectedDocType}
            </span>
          </div>

          {isLiveCameraActive ? (
            <div className="p-4 bg-[#F5F9FF] rounded-[8px] border border-[#C9DCF8]">
              <CameraCapture
                title={cameraMode === 'doc' ? 'Document Camera Scanner' : 'Traveler Face Capture'}
                subtitle="Align clearly in frame and click capture"
                onCapture={handleLiveCameraCaptured}
                onCancel={() => setIsLiveCameraActive(false)}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {!uploadedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-[#C9DCF8] hover:border-[#2563EB] rounded-[8px] p-12 text-center bg-[#F5F9FF] hover:bg-[#EAF2FF] relative flex flex-col items-center justify-center min-h-[220px]"
                >
                  <input
                    type="file"
                    id="doc-file-input"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 rounded-[8px] bg-[#EAF2FF] text-[#2563EB] border border-[#C9DCF8] flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#10233F]">
                    Click to browse or drag and drop document scan
                  </h3>
                  <p className="text-[15px] text-[#64748B] mt-1 max-w-sm font-normal">
                    High-resolution scan of {selectedDocType} (JPG, PNG, PDF up to 10MB)
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-[8px] bg-[#F5F9FF] border border-[#C9DCF8] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {uploadedPreviewUrl ? (
                      <img
                        src={uploadedPreviewUrl}
                        alt="Document Preview"
                        className="w-20 h-14 object-cover rounded-[4px] border border-[#C9DCF8]"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-[4px] bg-[#EAF2FF] border border-[#C9DCF8] text-[#2563EB] flex items-center justify-center font-bold">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-[18px] font-bold text-[#10233F]">{uploadedFile.name}</h4>
                      <p className="text-[14px] text-[#64748B] font-normal mt-0.5">
                        {formatFileSize(uploadedFile.size)} • {uploadedFile.type || 'Document Image'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#15803D] mt-1 uppercase">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready for screening</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedPreviewUrl(null);
                      }}
                      className="px-4 py-2 rounded-[4px] bg-white text-[#10233F] border border-[#C9DCF8] text-[14px] font-bold uppercase cursor-pointer"
                    >
                      Replace File
                    </button>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedPreviewUrl(null);
                      }}
                      className="p-2 text-[#B91C1C] hover:bg-red-50 rounded-[4px] cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#EAF2FF] rounded-[8px] border border-[#C9DCF8] gap-3">
                <div className="text-[15px] text-[#10233F]">
                  <strong className="font-bold">Live Camera Scan:</strong> Capture document directly using your desk camera.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('doc');
                    setIsLiveCameraActive(true);
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] text-white rounded-[6px] text-[14px] font-bold uppercase cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Camera Scanner</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#C9DCF8]">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 bg-white text-[#10233F] border border-[#C9DCF8] font-bold text-[15px] uppercase rounded-[6px] flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              disabled={!uploadedFile && !selectedDemoScenario}
              className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-40 text-white font-bold text-[16px] uppercase rounded-[6px] flex items-center gap-2 cursor-pointer"
            >
              <span>Review Details</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW DETAILS */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-8 space-y-6">
          <div className="border-b border-[#C9DCF8] pb-4">
            <h2 className="text-[24px] font-bold text-[#10233F] uppercase">
              Step 03: Review Document Details
            </h2>
            <p className="text-[16px] text-[#64748B] mt-1 font-normal">
              Confirm document settings and traveler photo before starting verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-[8px] bg-[#F5F9FF] border border-[#C9DCF8] space-y-4">
              <h3 className="text-[15px] font-bold text-[#10233F] uppercase">
                Document Summary
              </h3>

              <div className="space-y-3 text-[16px]">
                <div className="flex items-center justify-between py-2 border-b border-[#C9DCF8]">
                  <span className="text-[#64748B]">Document Type:</span>
                  <span className="font-bold text-[#10233F]">{selectedDocType}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#C9DCF8]">
                  <span className="text-[#64748B]">File Name:</span>
                  <span className="font-bold text-[#10233F] truncate max-w-[200px]">
                    {uploadedFile?.name || selectedDemoScenario?.title || 'Document file'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#C9DCF8]">
                  <span className="text-[#64748B]">File Size:</span>
                  <span className="font-normal text-[#10233F]">
                    {uploadedFile ? formatFileSize(uploadedFile.size) : 'Standard Scan'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[#64748B]">Assigned Officer:</span>
                  <span className="font-bold text-[#2563EB]">
                    {user?.user_id || 'A001'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-[8px] bg-[#F5F9FF] border border-[#C9DCF8] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#10233F] uppercase">
                  Traveler Photo (1:1 Match)
                </h3>
                <span className="text-[13px] font-bold text-[#2563EB] bg-[#EAF2FF] border border-[#C9DCF8] px-2.5 py-0.5 rounded-[4px]">
                  Optional
                </span>
              </div>

              {personPreviewUrl ? (
                <div className="flex items-center gap-4 p-4 bg-white rounded-[6px] border border-[#C9DCF8]">
                  <img
                    src={personPreviewUrl}
                    alt="Traveler face"
                    className="w-14 h-14 object-cover rounded-[4px] border border-[#C9DCF8]"
                  />
                  <div className="min-w-0 flex-1 text-[15px]">
                    <span className="font-bold text-[#10233F] block truncate">
                      {personPhotoFile?.name || 'Traveler photo attached'}
                    </span>
                    <span className="text-[#15803D] font-bold text-[13px] uppercase">
                      Biometric comparison active
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setPersonPhotoFile(null);
                      setPersonPreviewUrl(null);
                    }}
                    className="p-2 text-[#B91C1C] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[15px] text-[#64748B] font-normal leading-relaxed">
                    Attach a live traveler photo for 1:1 facial biometric matching against the document portrait.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="px-4 py-2.5 bg-[#2563EB] text-white rounded-[6px] text-[14px] font-bold uppercase cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        onChange={handlePersonPhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraMode('face');
                        setIsLiveCameraActive(true);
                      }}
                      className="px-4 py-2.5 bg-white text-[#10233F] border border-[#C9DCF8] rounded-[6px] text-[14px] font-bold uppercase cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-[8px] bg-[#EAF2FF] border border-[#C9DCF8] text-[15px] text-[#10233F] flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#2563EB] shrink-0" />
            <div>
              <strong className="font-bold">Automated Screening Ready:</strong> The pipeline will execute OCR text extraction, ICAO 9303 checksum validation, digital tampering detection, and threat risk scoring.
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#C9DCF8]">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-white text-[#10233F] border border-[#C9DCF8] font-bold text-[15px] uppercase rounded-[6px] flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => executeScreening()}
              id="btn-start-verification"
              className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-[16px] uppercase rounded-[6px] flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Start Verification</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: VERIFICATION PROGRESS */}
      {currentStep === 4 && isScreening && (
        <VerificationProgressBar documentType={selectedDocType} />
      )}

      {/* STEP 5: VERIFICATION RESULT */}
      {currentStep === 5 && currentResult && (() => {
        const status = currentResult.verification_status || 'FAILED';

        let bannerStyle = 'bg-[#FEE2E2] border-red-300 text-[#B91C1C]';
        let iconBgStyle = 'bg-[#B91C1C] text-white';
        let BannerIcon = XCircle;
        let bannerTitle = 'FAILED';
        let riskBadgeText = 'High Risk';
        let riskBadgeStyle = 'bg-[#FEE2E2] text-[#B91C1C] border border-red-300';
        let bannerMessage = currentResult.reasons?.[0] || currentResult.notes || 'Verification checks could not be completed successfully.';

        if (status === 'VERIFIED' || status === 'AUTHENTIC') {
          bannerStyle = 'bg-[#DCFCE7] border-green-300 text-[#15803D]';
          iconBgStyle = 'bg-[#15803D] text-white font-bold';
          BannerIcon = ShieldCheck;
          bannerTitle = 'VERIFIED / AUTHENTIC';
          riskBadgeText = 'Low Risk';
          riskBadgeStyle = 'bg-[#DCFCE7] text-[#15803D] border border-green-300';
          bannerMessage = currentResult.notes || currentResult.explanation || 'Document Cleared to Proceed: Document appears authentic and valid.';
        } else if (status === 'EXPIRED') {
          bannerStyle = 'bg-[#FEE2E2] border-red-300 text-[#B91C1C]';
          iconBgStyle = 'bg-[#B91C1C] text-white';
          BannerIcon = AlertTriangle;
          bannerTitle = 'EXPIRED DOCUMENT';
          riskBadgeText = 'High Risk';
          riskBadgeStyle = 'bg-[#FEE2E2] text-[#B91C1C] border border-red-300';
          bannerMessage = currentResult.reasons?.[0] || `Document validity lapsed on ${formatVisualDate(currentResult.date_of_expiry) || 'expiry date'}.`;
        } else if (status === 'REVIEW' || status === 'INCONCLUSIVE' || status === 'REVIEW_REQUIRED' || status === 'SUSPICIOUS') {
          bannerStyle = 'bg-[#FEF3C7] border-amber-300 text-[#B45309]';
          iconBgStyle = 'bg-[#B45309] text-white font-bold';
          BannerIcon = AlertTriangle;
          bannerTitle = 'REVIEW REQUIRED';
          riskBadgeText = 'Medium Risk';
          riskBadgeStyle = 'bg-[#FEF3C7] text-[#B45309] border border-amber-300';
          bannerMessage = currentResult.reasons?.[0] || currentResult.notes || 'Secondary manual inspection required by verifying officer.';
        }

        const docNum = currentResult.document_number;
        const hasValidDocNum = Boolean(docNum && docNum !== 'NOT DETECTED' && docNum !== 'N/A');
        const name = currentResult.applicant_name;
        const hasValidName = Boolean(name && name !== 'NOT DETECTED' && name !== 'N/A');
        const nat = currentResult.nationality;
        const hasValidNat = Boolean(nat && nat !== 'NOT DETECTED');
        const ocrConf = currentResult.ocr_data?.confidence_score ?? (hasValidDocNum ? 95 : 0);

        return (
          <div className="space-y-8">
            {/* TOP RESULT BANNER */}
            <div className={`p-8 rounded-[8px] border space-y-6 ${bannerStyle}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-[8px] flex items-center justify-center shrink-0 ${iconBgStyle}`}>
                    <BannerIcon className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[28px] font-bold uppercase tracking-tight">
                        {bannerTitle}
                      </h2>
                      <span className={`px-3 py-1 rounded-[4px] text-[13px] font-bold uppercase ${riskBadgeStyle}`}>
                        {riskBadgeText}
                      </span>
                    </div>
                    <p className="text-[17px] font-normal leading-relaxed">
                      {bannerMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    id="btn-generate-report"
                    className="px-5 py-3 rounded-[6px] bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[15px] font-bold uppercase cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Official Forensic Report</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-5 py-3 rounded-[6px] bg-white text-[#10233F] border border-[#C9DCF8] text-[15px] font-bold uppercase cursor-pointer"
                  >
                    New Verification
                  </button>
                </div>
              </div>

              {/* RISK BAR SPECTRUM */}
              <div className="bg-white p-6 rounded-[8px] border border-[#C9DCF8] space-y-3 text-[#10233F]">
                <div className="flex items-center justify-between text-[16px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Threat Risk Score:</span>
                    <span className="font-bold text-[#2563EB] bg-[#EAF2FF] px-3 py-0.5 rounded-[4px]">
                      {currentResult.risk_score ?? 0} / 100
                    </span>
                  </div>
                  <span className="font-bold text-[14px] uppercase text-[#15803D]">
                    CLEARANCE VERDICT: {status}
                  </span>
                </div>

                <div className="relative w-full py-2">
                  <div className="h-4 w-full rounded-[4px] bg-[#EAF2FF] overflow-hidden flex border border-[#C9DCF8]">
                    <div className="w-[30%] bg-[#DCFCE7] h-full flex items-center justify-center text-[11px] font-bold text-[#15803D]">
                      LOW
                    </div>
                    <div className="w-[35%] bg-[#FEF3C7] h-full flex items-center justify-center text-[11px] font-bold text-[#B45309]">
                      MEDIUM
                    </div>
                    <div className="w-[35%] bg-[#FEE2E2] h-full flex items-center justify-center text-[11px] font-bold text-[#B91C1C]">
                      HIGH
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT INFO & CHECKS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[8px] border border-[#C9DCF8] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-3">
                  <h3 className="text-[20px] font-bold text-[#10233F] uppercase">
                    Detected Document Fields
                  </h3>
                  <span className="text-[14px] font-bold text-[#2563EB]">
                    OCR Confidence: {ocrConf.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[16px]">
                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Full Name</span>
                    <span className="font-bold block truncate text-[#10233F]">
                      {hasValidName ? name : 'NOT DETECTED'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Document Number</span>
                    <span className="font-bold block truncate text-[#10233F]">
                      {hasValidDocNum ? docNum : 'NOT DETECTED'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Date of Birth</span>
                    <span className="font-bold block truncate text-[#10233F]">
                      {formatVisualDate(currentResult.date_of_birth) || 'NOT DETECTED'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Nationality</span>
                    <span className="font-bold block truncate text-[#10233F]">
                      {hasValidNat ? nat : 'NOT DETECTED'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Document Type</span>
                    <span className="font-bold block truncate text-[#10233F]">
                      {currentResult.document_type || selectedDocType}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="text-[13px] font-bold text-[#64748B] uppercase block">Date of Expiry</span>
                    <span className="font-bold block truncate text-[#10233F]">
                      {formatVisualDate(currentResult.date_of_expiry) || 'NOT DETECTED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[8px] border border-[#C9DCF8] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-3">
                  <h3 className="text-[20px] font-bold text-[#10233F] uppercase">
                    Verification Pipeline Status
                  </h3>
                  <span className="text-[14px] font-bold text-[#64748B]">
                    6 Security Dimensions
                  </span>
                </div>

                <div className="space-y-3 text-[15px]">
                  <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="font-bold text-[#10233F]">OCR Extraction</span>
                    <span className="font-bold text-[#15803D] uppercase">COMPLETED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="font-bold text-[#10233F]">MRZ Validation</span>
                    <span className="font-bold text-[#15803D] uppercase">COMPLETED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="font-bold text-[#10233F]">Document Validation</span>
                    <span className="font-bold text-[#15803D] uppercase">COMPLETED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="font-bold text-[#10233F]">Tampering Analysis</span>
                    <span className="font-bold text-[#15803D] uppercase">COMPLETED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="font-bold text-[#10233F]">Face Verification</span>
                    <span className="font-bold text-[#15803D] uppercase">COMPLETED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px]">
                    <span className="font-bold text-[#10233F]">Database Match</span>
                    <span className="font-bold text-[#15803D] uppercase">COMPLETED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT INSPECTION VIEWPORT */}
            <DocumentInspectionViewport
              record={currentResult}
              uploadedPreviewUrl={uploadedPreviewUrl || currentResult.document_face_url || undefined}
            />

            {/* 1:1 FACIAL BIOMETRIC MATCH */}
            <BiometricMatchView
              record={currentResult}
              personPreviewUrl={personPreviewUrl || currentResult.face_details?.presented_face_url || undefined}
            />

            {/* VISIBLE VS MRZ TABLE */}
            {currentResult.field_consistency && currentResult.field_consistency.length > 0 && (
              <VisibleVsMrzTable fields={currentResult.field_consistency} />
            )}

            {/* DOCUMENT PORTRAIT CARD */}
            <DocumentPortraitCard record={currentResult} />

            {/* TABBED DEEP FORENSICS SECTION */}
            <div className="bg-white rounded-[8px] border border-[#C9DCF8] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#C9DCF8] pb-3">
                <h3 className="text-[20px] font-bold text-[#10233F] uppercase">
                  Forensic Evidence & Inspection Console
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2.5 rounded-[4px] uppercase cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#102A56] text-white'
                      : 'bg-[#F5F9FF] text-[#10233F] border border-[#C9DCF8]'
                  }`}
                >
                  Timeline & Overview
                </button>

                <button
                  onClick={() => setActiveTab('mrz')}
                  className={`px-4 py-2.5 rounded-[4px] uppercase cursor-pointer ${
                    activeTab === 'mrz'
                      ? 'bg-[#102A56] text-white'
                      : 'bg-[#F5F9FF] text-[#10233F] border border-[#C9DCF8]'
                  }`}
                >
                  MRZ 9303
                </button>

                <button
                  onClick={() => setActiveTab('forensics')}
                  className={`px-4 py-2.5 rounded-[4px] uppercase cursor-pointer ${
                    activeTab === 'forensics'
                      ? 'bg-[#102A56] text-white'
                      : 'bg-[#F5F9FF] text-[#10233F] border border-[#C9DCF8]'
                  }`}
                >
                  Forensics (ELA)
                </button>

                <button
                  onClick={() => setActiveTab('blockchain')}
                  className={`px-4 py-2.5 rounded-[4px] uppercase cursor-pointer ${
                    activeTab === 'blockchain'
                      ? 'bg-[#102A56] text-white'
                      : 'bg-[#F5F9FF] text-[#10233F] border border-[#C9DCF8]'
                  }`}
                >
                  Audit Trail
                </button>

                <button
                  onClick={() => setActiveTab('decision')}
                  className={`px-4 py-2.5 rounded-[4px] uppercase cursor-pointer ${
                    activeTab === 'decision'
                      ? 'bg-[#102A56] text-white'
                      : 'bg-[#F5F9FF] text-[#10233F] border border-[#C9DCF8]'
                  }`}
                >
                  Officer Sign-off
                </button>
              </div>

              <div className="pt-3">
                {activeTab === 'overview' && (
                  <RealTimeTimelineCard
                    expiryDateStr={currentResult.date_of_expiry}
                    dobDateStr={currentResult.date_of_birth}
                    documentType={currentResult.document_type}
                  />
                )}
                {activeTab === 'mrz' && <MrzInspector record={currentResult} />}
                {activeTab === 'forensics' && <ForensicsElaViewer record={currentResult} />}
                {activeTab === 'blockchain' && <BlockchainAuditBadge record={currentResult} />}
                {activeTab === 'decision' && (
                  <OfficerDecisionSection
                    record={currentResult}
                    onSave={handleSaveScreening}
                    isSaving={isSaving}
                    saveSuccess={saveSuccess}
                  />
                )}
              </div>
            </div>

            {/* FORENSIC REPORT MODAL */}
            {isReportModalOpen && (
              <ForensicReportModal
                record={currentResult}
                onClose={() => setIsReportModalOpen(false)}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
};
