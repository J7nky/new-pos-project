import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SupplierProvider } from './contexts/SupplierContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { EnhancedPOSInterface } from './components/EnhancedPOSInterface';
import { InventoryManager } from './components/InventoryManager';
import { CustomerManager } from './components/CustomerManager';
import { SupplierManager } from './components/SupplierManager';
import { FinanceManager } from './components/FinanceManager';
import { EnhancedReports } from './components/EnhancedReports';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { POSProvider } from './contexts/POSContext';

const AppContent: React.FC = () => {
  const { state: authState } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!authState.isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <EnhancedPOSInterface />;
      case 'inventory':
        return <InventoryManager />;
      case 'customers':
        return <CustomerManager />;
      case 'suppliers':
        return <SupplierManager />;
      case 'finance':
        return <FinanceManager />;
      case 'reports':
        return <EnhancedReports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-64 p-6">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <POSProvider>
        <SupplierProvider>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </SupplierProvider>
      </POSProvider>
    </AuthProvider>
  );
}

export default App;