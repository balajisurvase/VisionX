import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Database,
  ShieldAlert,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { DemoScenario } from '../types/verification';
import { fetchDemoScenarios } from '../services/verificationService';

interface DemoCenterProps {
  onSelectDemoScenario: (scenario: DemoScenario) => void;
}

export const DemoCenter: React.FC<DemoCenterProps> = ({
  onSelectDemoScenario,
}) => {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const data = await fetchDemoScenarios();
      setScenarios(data || []);
    } catch (err) {
      console.error('Failed to load demo scenarios:', err);
      setScenarios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadScenarios();
  };

  const getExpectedBadge = (result: string) => {
    switch (result) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Expected: Cleared
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            Expected: Expired
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5" />
            Expected: Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5" />
            Expected: Forgery
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#111827]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5]">
              SIH 2026 Evaluation Suite
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Problem Statement 26188 Benchmarks
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight mt-1">
            Evaluation Test Scenarios & Attack Vectors
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#4F46E5] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Reload Benchmarks</span>
        </button>
      </div>

      {/* Overview Banner Card */}
      <div className="p-5 rounded-[12px] bg-white border border-gray-100 shadow-2xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <h2 className="font-bold text-sm text-[#111827]">
            Standardized Border Screening Scenarios
          </h2>
          <p className="leading-relaxed">
            Clicking <strong className="text-[#4F46E5]">"Run Scenario"</strong> streams high-resolution document artifacts and traveler biometrics into the multi-layer pipeline: Gemini Vision OCR extraction, ICAO 9303 checksum validation, OpenCV Error Level Analysis (ELA), and 1:1 facial biometric matching.
          </p>
        </div>
      </div>

      {/* Grid of Scenarios */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-gray-100 rounded-[12px] shadow-2xs">
          <RefreshCw className="w-6 h-6 text-[#4F46E5] animate-spin mx-auto mb-3" />
          <span className="text-xs font-semibold text-gray-500">Loading benchmark test cases...</span>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="p-16 text-center bg-white border border-gray-100 rounded-[12px] shadow-2xs">
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <Database className="w-8 h-8 text-gray-300" />
            <div className="font-bold text-sm text-[#111827]">
              No benchmark scenarios loaded
            </div>
            <p className="text-xs text-gray-500">
              Verify database connection or reset the demo dataset.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer transition-colors"
            >
              Reload Dataset
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-[12px] border border-gray-100 hover:border-[#4F46E5]/40 transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs"
            >
              {/* Card Header & Content */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F6F8] text-gray-600 border border-gray-200">
                    Scenario #{scenario.demo_number}
                  </span>
                  {getExpectedBadge(scenario.expected_result)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#111827] leading-tight">
                    {scenario.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <span className="font-semibold text-[#4F46E5]">{scenario.document_type}</span>
                    <span>•</span>
                    <span className="font-mono text-gray-600">{scenario.document_number}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F6F8] border border-gray-200 text-xs space-y-1">
                  <div className="font-bold text-[#111827]">
                    Target: {scenario.applicant_name} ({scenario.nationality || 'IND'})
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-4 bg-[#F5F6F8]/60 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-gray-500">
                  Risk Level:{' '}
                  <strong className="text-[#111827] uppercase">
                    {scenario.expected_risk}
                  </strong>
                </div>
                <button
                  onClick={() => onSelectDemoScenario(scenario)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Scenario</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
