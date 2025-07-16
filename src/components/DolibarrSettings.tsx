import React, { useState } from 'react';
import { useDolibarr } from '../contexts/DolibarrContext';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Sync,
  Clock
} from 'lucide-react';

export const DolibarrSettings: React.FC = () => {
  const { 
    state, 
    configureDolibarr, 
    testConnection, 
    syncProducts, 
    syncCustomers, 
    syncAll 
  } = useDolibarr();
  
  const [formData, setFormData] = useState({
    baseUrl: state.config?.baseUrl || 'https://your-dolibarr.com',
    apiKey: state.config?.apiKey || '',
    username: state.config?.username || '',
    password: state.config?.password || ''
  });
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSaveConfig = async () => {
    const success = await configureDolibarr(formData);
    if (success) {
      alert('Dolibarr configuration saved successfully!');
    } else {
      alert('Failed to connect to Dolibarr. Please check your configuration.');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const success = await testConnection();
    setTesting(false);
    
    if (success) {
      alert('Connection successful!');
    } else {
      alert('Connection failed. Please check your configuration.');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    await syncAll();
    setSyncing(false);
    alert('Synchronization completed!');
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dolibarr ERP Integration</h2>
          <p className="text-gray-600">Configure and manage your Dolibarr ERP connection</p>
        </div>
        <div className="flex items-center space-x-2">
          {state.isConnected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <Wifi className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <WifiOff className="w-5 h-5" />
              <span className="text-sm font-medium">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            state.isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">API Connection</p>
                <p className={`text-sm ${state.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {state.isConnected ? 'Active' : 'Inactive'}
                </p>
              </div>
              {state.isConnected ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            state.isConfigured ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Configuration</p>
                <p className={`text-sm ${state.isConfigured ? 'text-blue-600' : 'text-gray-600'}`}>
                  {state.isConfigured ? 'Configured' : 'Not Configured'}
                </p>
              </div>
              {state.isConfigured ? (
                <Settings className="w-8 h-8 text-blue-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Last Sync</p>
                <p className="text-sm text-purple-600">
                  {state.lastSync 
                    ? state.lastSync.toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dolibarr Base URL
            </label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
              placeholder="https://your-dolibarr.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              The base URL of your Dolibarr installation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
              placeholder="Your Dolibarr API key"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              Generate this in Dolibarr under Setup → Modules → API/Web services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username (Alternative)
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (Alternative)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Save Configuration
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing || !state.isConfigured}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              <span>Test Connection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synchronization */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Synchronization</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Products</h4>
                {getSyncStatusIcon(state.syncStatus.products.status)}
              </div>
              <p className="text-sm text-gray-600">
                {state.syncStatus.products.lastSync 
                  ? `Last: ${state.syncStatus.products.lastSync.toLocaleString()}`
                  : 'Never synced'
                }
              </p>
              {state.syncStatus.products.error && (
                <p className="text-sm text-red-600 mt-1">{state.syncStatus.products.error}</p>
              )}
              <button
                onClick={syncProducts}
                disabled={!state.isConnected || state.syncStatus.products.status === 'syncing'}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {state.syncStatus.products.status === 'syncing' ? 'Syncing...' : 'Sync Products'}
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Customers</h4>
                {getSyncStatusIcon(state.syncStatus.customers.status)}
              </div>
              <p className="text-sm text-gray-600">
                {state.syncStatus.customers.lastSync 
                  ? `Last: ${state.syncStatus.customers.lastSync.toLocaleString()}`
                  : 'Never synced'
                }
              </p>
              {state.syncStatus.customers.error && (
                <p className="text-sm text-red-600 mt-1">{state.syncStatus.customers.error}</p>
              )}
              <button
                onClick={syncCustomers}
                disabled={!state.isConnected || state.syncStatus.customers.status === 'syncing'}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {state.syncStatus.customers.status === 'syncing' ? 'Syncing...' : 'Sync Customers'}
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Sales</h4>
                {getSyncStatusIcon(state.syncStatus.sales.status)}
              </div>
              <p className="text-sm text-gray-600">
                {state.syncStatus.sales.lastSync 
                  ? `Last: ${state.syncStatus.sales.lastSync.toLocaleString()}`
                  : 'Auto-sync enabled'
                }
              </p>
              {state.syncStatus.sales.error && (
                <p className="text-sm text-red-600 mt-1">{state.syncStatus.sales.error}</p>
              )}
              <div className="mt-2 text-sm text-green-600">
                ✓ Auto-sync on sale
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSyncAll}
              disabled={!state.isConnected || syncing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sync className="w-4 h-4" />
              )}
              <span>{syncing ? 'Syncing All...' : 'Sync All Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Integration Guide</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>1. Enable API in Dolibarr:</strong>
            <p>Go to Setup → Modules → API/Web services and enable the API module.</p>
          </div>
          <div>
            <strong>2. Generate API Key:</strong>
            <p>In Dolibarr, go to your user profile and generate a new API key.</p>
          </div>
          <div>
            <strong>3. Configure Permissions:</strong>
            <p>Ensure your user has permissions for products, customers, invoices, and stock management.</p>
          </div>
          <div>
            <strong>4. Test Connection:</strong>
            <p>Use the "Test Connection" button to verify your configuration.</p>
          </div>
          <div>
            <strong>5. Initial Sync:</strong>
            <p>Run "Sync All Data" to import your existing products and customers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};