import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DolibarrAPIService, DolibarrConfig } from '../services/DolibarrAPI';

interface DolibarrState {
  isConnected: boolean;
  isConfigured: boolean;
  config: DolibarrConfig | null;
  lastSync: Date | null;
  syncStatus: {
    products: { lastSync: Date | null; status: 'idle' | 'syncing' | 'success' | 'error'; error?: string };
    customers: { lastSync: Date | null; status: 'idle' | 'syncing' | 'success' | 'error'; error?: string };
    sales: { lastSync: Date | null; status: 'idle' | 'syncing' | 'success' | 'error'; error?: string };
  };
  apiService: DolibarrAPIService | null;
}

type DolibarrAction = 
  | { type: 'SET_CONFIG'; payload: DolibarrConfig }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: { type: 'products' | 'customers' | 'sales'; status: any } }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'LOAD_DATA'; payload: Partial<DolibarrState> };

const initialState: DolibarrState = {
  isConnected: false,
  isConfigured: false,
  config: null,
  lastSync: null,
  syncStatus: {
    products: { lastSync: null, status: 'idle' },
    customers: { lastSync: null, status: 'idle' },
    sales: { lastSync: null, status: 'idle' }
  },
  apiService: null
};

const dolibarrReducer = (state: DolibarrState, action: DolibarrAction): DolibarrState => {
  switch (action.type) {
    case 'SET_CONFIG':
      const apiService = new DolibarrAPIService(action.payload);
      return {
        ...state,
        config: action.payload,
        isConfigured: true,
        apiService
      };
    
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload
      };
    
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          [action.payload.type]: action.payload.status
        }
      };
    
    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSync: action.payload
      };
    
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload
      };
    
    default:
      return state;
  }
};

const DolibarrContext = createContext<{
  state: DolibarrState;
  dispatch: React.Dispatch<DolibarrAction>;
  configureDolibarr: (config: DolibarrConfig) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  syncProducts: () => Promise<boolean>;
  syncCustomers: () => Promise<boolean>;
  syncSale: (sale: any) => Promise<boolean>;
  syncAll: () => Promise<void>;
} | null>(null);

export const DolibarrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dolibarrReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('dolibarr-config');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.config) {
          dispatch({ type: 'SET_CONFIG', payload: parsedData.config });
          dispatch({ type: 'LOAD_DATA', payload: parsedData });
        }
      } catch (error) {
        console.error('Error loading Dolibarr config:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (state.config) {
      localStorage.setItem('dolibarr-config', JSON.stringify({
        config: state.config,
        lastSync: state.lastSync,
        syncStatus: state.syncStatus
      }));
    }
  }, [state.config, state.lastSync, state.syncStatus]);

  const configureDolibarr = async (config: DolibarrConfig): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_CONFIG', payload: config });
      const apiService = new DolibarrAPIService(config);
      const connectionTest = await apiService.testConnection();
      
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionTest.success });
      return connectionTest.success;
    } catch (error) {
      console.error('Failed to configure Dolibarr:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      return false;
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!state.apiService) return false;
    
    try {
      const result = await state.apiService.testConnection();
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: result.success });
      return result.success;
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      return false;
    }
  };

  const syncProducts = async (): Promise<boolean> => {
    if (!state.apiService) return false;

    dispatch({ 
      type: 'SET_SYNC_STATUS', 
      payload: { type: 'products', status: { lastSync: null, status: 'syncing' } }
    });

    try {
      const result = await state.apiService.syncProducts();
      const now = new Date();
      
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          type: 'products', 
          status: { 
            lastSync: now, 
            status: result.success ? 'success' : 'error',
            error: result.success ? undefined : result.errors.join(', ')
          }
        }
      });

      if (result.success) {
        dispatch({ type: 'SET_LAST_SYNC', payload: now });
      }

      return result.success;
    } catch (error) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          type: 'products', 
          status: { 
            lastSync: null, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
      return false;
    }
  };

  const syncCustomers = async (): Promise<boolean> => {
    if (!state.apiService) return false;

    dispatch({ 
      type: 'SET_SYNC_STATUS', 
      payload: { type: 'customers', status: { lastSync: null, status: 'syncing' } }
    });

    try {
      const result = await state.apiService.syncCustomers();
      const now = new Date();
      
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          type: 'customers', 
          status: { 
            lastSync: now, 
            status: result.success ? 'success' : 'error',
            error: result.success ? undefined : result.errors.join(', ')
          }
        }
      });

      if (result.success) {
        dispatch({ type: 'SET_LAST_SYNC', payload: now });
      }

      return result.success;
    } catch (error) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          type: 'customers', 
          status: { 
            lastSync: null, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
      return false;
    }
  };

  const syncSale = async (sale: any): Promise<boolean> => {
    if (!state.apiService) return false;

    try {
      const result = await state.apiService.syncSale(sale);
      
      if (result.success) {
        const now = new Date();
        dispatch({ 
          type: 'SET_SYNC_STATUS', 
          payload: { 
            type: 'sales', 
            status: { lastSync: now, status: 'success' }
          }
        });
        dispatch({ type: 'SET_LAST_SYNC', payload: now });
      }

      return result.success;
    } catch (error) {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { 
          type: 'sales', 
          status: { 
            lastSync: null, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
      return false;
    }
  };

  const syncAll = async (): Promise<void> => {
    await Promise.all([
      syncProducts(),
      syncCustomers()
    ]);
  };

  return (
    <DolibarrContext.Provider value={{
      state,
      dispatch,
      configureDolibarr,
      testConnection,
      syncProducts,
      syncCustomers,
      syncSale,
      syncAll
    }}>
      {children}
    </DolibarrContext.Provider>
  );
};

export const useDolibarr = () => {
  const context = useContext(DolibarrContext);
  if (!context) {
    throw new Error('useDolibarr must be used within a DolibarrProvider');
  }
  return context;
};