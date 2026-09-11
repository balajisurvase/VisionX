import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VerifyDocument } from './pages/VerifyDocument';
import { Documents } from './pages/Documents';
import { History } from './pages/History';
import { DemoCenter } from './pages/DemoCenter';
import { Settings } from './pages/Settings';
import { getCurrentSession, logoutUser } from './services/authService';
import { OfficerUser } from './types/auth';
import { DemoScenario, VerificationRecord } from './types/verification';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [user, setUser] = useState<OfficerUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeDemoScenario, setActiveDemoScenario] = useState<DemoScenario | null>(null);
  const [inspectedRecord, setInspectedRecord] = useState<VerificationRecord | null>(null);

  // Check auth session on startup
  useEffect(() => {
    const session = getCurrentSession();
    if (session.isAuthenticated && session.user) {
      setUser(session.user);
      setIsAuthenticated(true);
      setCurrentPath('/dashboard');
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentPath('/login');
    }
  }, []);

  const handleLoginSuccess = (officer: OfficerUser) => {
    setUser(officer);
    setIsAuthenticated(true);
    setCurrentPath('/dashboard');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPath('/login');
  };

  const handleNavigate = (path: string) => {
    if (!isAuthenticated && path !== '/login') {
      setCurrentPath('/login');
      return;
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setActiveDemoScenario(scenario);
    setInspectedRecord(null);
    setCurrentPath('/verify');
  };

  const handleInspectRecord = (record: VerificationRecord) => {
    setInspectedRecord(record);
    setActiveDemoScenario(null);
    setCurrentPath('/verify');
  };

  const handleVerifySpecificDoc = (docNumber: string) => {
    setCurrentPath('/verify');
  };

  // If not authenticated, render the dedicated SSB Officer Login page
  if (!isAuthenticated || currentPath === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Get current page title for the header
  const getPageInfo = () => {
    switch (currentPath) {
      case '/dashboard':
      case '/':
        return {
          title: 'SSB Screening Dashboard',
          subtitle: 'Real-time AI-based identity & document screening analytics',
        };
      case '/verify':
        return {
          title: 'Document Verification',
          subtitle: 'Automated 8-stage computer vision & biometric screening pipeline',
        };
      case '/documents':
        return {
          title: 'Document Registry',
          subtitle: 'Sovereign document repository & travel credentials catalog',
        };
      case '/history':
        return {
          title: 'Verification History & Blockchain Ledger',
          subtitle: 'Cryptographic SHA-256 tamper-evident screening audit trail',
        };
      case '/demo':
        return {
          title: 'Demo Center (SIH 2026)',
          subtitle: 'Evaluation scenarios for Problem Statement 26188 evaluation',
        };
      case '/settings':
        return {
          title: 'Terminal & Officer Settings',
          subtitle: 'Security post profile, authentication & Supabase database integration',
        };
      default:
        return {
          title: 'SSB Document Screening',
          subtitle: 'Ministry of Home Affairs • Police II Division',
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {(currentPath === '/dashboard' || currentPath === '/') && (
            <Dashboard
              onNavigate={handleNavigate}
              onSelectRecordForInspection={handleInspectRecord}
            />
          )}

          {currentPath === '/verify' && (
            <VerifyDocument
              user={user}
              activeDemoScenario={activeDemoScenario}
              inspectedRecord={inspectedRecord}
              onClearDemo={() => {
                setActiveDemoScenario(null);
                setInspectedRecord(null);
              }}
              onNavigate={handleNavigate}
            />
          )}

          {currentPath === '/documents' && (
            <Documents onVerifyDocument={handleVerifySpecificDoc} />
          )}

          {currentPath === '/history' && <History />}

          {currentPath === '/demo' && (
            <DemoCenter onSelectDemoScenario={handleSelectDemoScenario} />
          )}

          {currentPath === '/settings' && (
            <Settings user={user} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
