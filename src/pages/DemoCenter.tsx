import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
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
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] text-[13px] font-bold bg-[#DCFCE7] text-[#15803D] border border-green-300 uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Expected: Verified</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] text-[13px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-red-300 uppercase">
            <Clock className="w-4 h-4" />
            <span>Expected: Expired</span>
          </span>
        );
      case 'SUSPICIOUS':
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] text-[13px] font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-300 uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>Expected: Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] text-[13px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-red-300 uppercase">
            <XCircle className="w-4 h-4" />
            <span>Expected: Forgery</span>
          </span>
        );
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 text-[#10233F]"
    >
      {/* Header Bar */}
      <div className="bg-white border border-[#C9DCF8] rounded-[8px] p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#10233F] uppercase tracking-tight">
            Benchmark Test Center
          </h1>
          <p className="text-[17px] text-[#64748B] mt-1 font-normal">
            Pre-configured identity documents and attack vectors for rapid verification testing
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-5 py-3 rounded-[6px] text-[15px] font-bold bg-white text-[#10233F] border border-[#C9DCF8] hover:bg-[#EAF2FF] cursor-pointer flex items-center gap-2 uppercase"
        >
          <RefreshCw className="w-4 h-4 text-[#2563EB]" />
          <span>Reload Benchmarks</span>
        </button>
      </div>

      {/* Grid of Scenarios */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#C9DCF8] rounded-[8px] text-[#64748B]">
          <span className="text-[16px] font-bold">Loading benchmark test cases...</span>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#C9DCF8] rounded-[8px] text-[#64748B]">
          <span className="text-[16px] font-bold">No benchmark scenarios loaded.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="p-6 bg-white border border-[#C9DCF8] rounded-[8px] flex flex-col justify-between space-y-4 hover:border-[#2563EB] transition-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#2563EB] bg-[#EAF2FF] px-2.5 py-0.5 rounded-[4px] border border-[#C9DCF8] uppercase">
                    {scenario.document_type}
                  </span>
                  {getExpectedBadge(scenario.expected_result)}
                </div>

                <h3 className="text-[20px] font-bold text-[#10233F]">
                  {scenario.title}
                </h3>

                <p className="text-[15px] text-[#64748B] font-normal leading-relaxed">
                  {scenario.description}
                </p>

                <div className="p-3 bg-[#F5F9FF] border border-[#C9DCF8] rounded-[6px] space-y-1 text-[14px]">
                  <div><strong className="font-bold">Applicant:</strong> {scenario.applicant_name}</div>
                  <div><strong className="font-bold">Doc Number:</strong> {scenario.document_number}</div>
                  <div><strong className="font-bold">Nationality:</strong> {scenario.nationality || 'IND'}</div>
                </div>
              </div>

              <button
                onClick={() => onSelectDemoScenario(scenario)}
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-[15px] uppercase rounded-[6px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Test Scenario</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
