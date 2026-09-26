import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { SocietyDashboard } from './pages/SocietyDashboard';
import { ResidentsManagement } from './pages/ResidentsManagement';
import { BookingsAmenities } from './pages/BookingsAmenities';
import { MaintenanceBilling } from './pages/MaintenanceBilling';
import { ComplaintsDesk } from './pages/ComplaintsDesk';
import { VisitorsGate } from './pages/VisitorsGate';
import { FinanceLedger } from './pages/FinanceLedger';
import { NoticesBoard } from './pages/NoticesBoard';
import { CommunicationsDesk } from './pages/CommunicationsDesk';
import { SocietySettings } from './pages/SocietySettings';
import { AuthSessionUser, UserRole } from './types/society';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [user, setUser] = useState<AuthSessionUser | null>({
    id: 'ADM-001',
    name: 'Balaji Ravindra Survase',
    email: 'admin@visi0nx.gov.in',
    phone: 9876543210,
    role: 'ADMIN',
    society_id: 'SOC-PUNE-01',
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const handleLoginSuccess = (authenticatedUser: AuthSessionUser) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    setCurrentPath('/dashboard');
  };

  const handleLogout = () => {
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

  const handleSwitchRole = (newRole: UserRole) => {
    if (newRole === 'ADMIN') {
      setUser({
        id: 'ADM-001',
        name: 'Balaji Ravindra Survase',
        email: 'admin@visi0nx.gov.in',
        phone: 9876543210,
        role: 'ADMIN',
        society_id: 'SOC-PUNE-01',
      });
    } else if (newRole === 'RESIDENT') {
      setUser({
        id: 'RES-A101',
        name: 'Amitabh Sen',
        email: 'amitabh.sen@example.com',
        phone: '9820112233',
        role: 'RESIDENT',
        society_id: 'SOC-PUNE-01',
        tower: 'A',
        flat: '101',
      });
    } else {
      setUser({
        id: 'SEC-GATE-01',
        name: 'Vikram Singh',
        email: 'security@visi0nx.gov.in',
        phone: '9876543211',
        role: 'SECURITY',
        society_id: 'SOC-PUNE-01',
        shift: 'Morning (06:00 - 14:00)',
      });
    }
    setCurrentPath('/dashboard');
  };

  if (!isAuthenticated || currentPath === '/login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard':
      case '/':
        return <SocietyDashboard currentUser={user} onNavigate={handleNavigate} />;
      case '/residents':
        return <ResidentsManagement currentUser={user} />;
      case '/bookings':
        return <BookingsAmenities currentUser={user} />;
      case '/maintenance':
        return <MaintenanceBilling currentUser={user} />;
      case '/complaints':
        return <ComplaintsDesk currentUser={user} />;
      case '/visitors':
        return <VisitorsGate currentUser={user} />;
      case '/finance':
        return <FinanceLedger currentUser={user} />;
      case '/notices':
        return <NoticesBoard currentUser={user} />;
      case '/communications':
        return <CommunicationsDesk currentUser={user} />;
      case '/settings':
        return <SocietySettings />;
      default:
        return <SocietyDashboard currentUser={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="flex h-screen bg-[#FAF8FC] text-[#212121] overflow-hidden"
    >
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
        />

        <main className="flex-1 overflow-y-auto bg-[#FAF8FC]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
export default App;
