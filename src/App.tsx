import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { POSInterface } from './components/POSInterface';
import { InventoryManager } from './components/InventoryManager';
import { CustomerManager } from './components/CustomerManager';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { POSProvider } from './contexts/POSContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POSInterface />;
      case 'inventory':
        return <InventoryManager />;
      case 'customers':
        return <CustomerManager />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <POSProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="ml-64 p-6">
          {renderContent()}
        </main>
      </div>
    </POSProvider>
  );
}

export default App;