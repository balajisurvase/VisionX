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
  ShieldCheck,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Expected: Verified</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            <span>Expected: Expired</span>
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expected: Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5" />
            <span>Expected: Forgery</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              IdentityGuard Benchmarks
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Standardized Test Dataset
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Benchmark Validation Scenarios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured identity documents and attack vectors for rapid verification testing.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Reload Benchmarks</span>
        </button>
      </div>

      {/* Overview Banner Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <h2 className="font-bold text-sm text-slate-900">
            Automated Benchmark Inspection Pipeline
          </h2>
          <p className="leading-relaxed">
            Select <strong className="text-blue-600 font-bold">"Run Scenario"</strong> to load synthetic or authentic document samples directly into the 5-layer screening engine: OCR field extraction, ICAO 9303 modulo-10 checksum validation, OpenCV Error Level Analysis (ELA), and 1:1 facial biometric matching.
          </p>
        </div>
      </div>

      {/* Grid of Scenarios */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
          <span className="text-xs font-semibold text-slate-500">Loading benchmark test cases...</span>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <Database className="w-8 h-8 text-slate-300" />
            <div className="font-bold text-sm text-slate-900">
              No benchmark scenarios loaded
            </div>
            <p className="text-xs text-slate-500">
              Verify database connection or reload the dataset.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs"
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
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500/50 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm"
            >
              {/* Card Header & Content */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Scenario #{scenario.demo_number}
                  </span>
                  {getExpectedBadge(scenario.expected_result)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {scenario.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-blue-600">{scenario.document_type}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">{scenario.document_number}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">
                    Target: {scenario.applicant_name} ({scenario.nationality || 'IND'})
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500">
                  Risk Level:{' '}
                  <strong className="text-slate-900 uppercase">
                    {scenario.expected_risk}
                  </strong>
                </div>
                <button
                  onClick={() => onSelectDemoScenario(scenario)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
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
