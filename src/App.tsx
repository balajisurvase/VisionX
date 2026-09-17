import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { VerifyDocument } from './pages/VerifyDocument';
import { Documents } from './pages/Documents';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { DemoCenter } from './pages/DemoCenter';
import { Settings } from './pages/Settings';
import { logoutUser } from './services/authService';
import { OfficerUser } from './types/auth';
import { DemoScenario, VerificationRecord } from './types/verification';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [user, setUser] = useState<OfficerUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeDemoScenario, setActiveDemoScenario] = useState<DemoScenario | null>(null);
  const [inspectedRecord, setInspectedRecord] = useState<VerificationRecord | null>(null);

  // Automatically logout on page reload / fresh startup per security requirements
  useEffect(() => {
    logoutUser();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPath('/login');
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
    if (!isAuthenticated && path !== '/login' && path !== '/landing') {
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

  const handleViewReport = (record: VerificationRecord) => {
    setInspectedRecord(record);
    setCurrentPath('/reports');
  };

  const handleVerifySpecificDoc = () => {
    setCurrentPath('/verify');
  };

  // If user requests landing page
  if (currentPath === '/landing') {
    return (
      <Landing
        onGetStarted={() => {
          if (isAuthenticated) {
            setCurrentPath('/dashboard');
          } else {
            setCurrentPath('/login');
          }
        }}
      />
    );
  }

  // If not authenticated, render the dedicated VisionX Login page
  if (!isAuthenticated || currentPath === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Get current page title for the header
  const getPageInfo = () => {
    switch (currentPath) {
      case '/dashboard':
      case '/':
        return {
          title: 'VisionX Verification Workstation',
          subtitle: 'Identity & document screening dashboard',
        };
      case '/verify':
        return {
          title: 'New Document Verification',
          subtitle: 'Automated document & identity screening pipeline',
        };
      case '/documents':
        return {
          title: 'Documents Registry',
          subtitle: 'Registered identity documents database',
        };
      case '/history':
        return {
          title: 'Verification History & Audit Ledger',
          subtitle: 'Complete record of past identity screening operations',
        };
      case '/reports':
        return {
          title: 'Forensic Reports Center',
          subtitle: 'Official identity & document verification dossiers',
        };
      case '/profile':
        return {
          title: 'Officer Credentials & Performance',
          subtitle: 'Terminal authorization and screening statistics',
        };
      case '/demo':
        return {
          title: 'Benchmark Test Center',
          subtitle: 'Standardized evaluation scenarios and attack vectors',
        };
      case '/settings':
        return {
          title: 'System Settings & Security',
          subtitle: 'Terminal configuration, AI vision models, and database credentials',
        };
      default:
        return {
          title: 'VisionX Workstation',
          subtitle: 'Identity & Document Verification System',
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="flex h-screen w-screen overflow-hidden bg-[#F5F9FF] text-[#10233F]"
    >
      {/* Left Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        onViewLanding={() => setCurrentPath('/landing')}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user}
        />

        <main className="flex-1 overflow-y-auto bg-[#F5F9FF]">
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

          {currentPath === '/history' && (
            <History
              onNavigate={handleNavigate}
              onInspectRecord={handleInspectRecord}
              onViewReport={handleViewReport}
            />
          )}

          {currentPath === '/reports' && (
            <Reports
              initialRecord={inspectedRecord}
              onNavigateToVerify={() => setCurrentPath('/verify')}
            />
          )}

          {currentPath === '/profile' && (
            <Profile user={user} onLogout={handleLogout} />
          )}

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
