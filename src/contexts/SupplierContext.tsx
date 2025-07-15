import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  creditLimit: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  orderNumber: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
}

interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  date: Date;
  notes?: string;
}

interface SupplierState {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  payments: SupplierPayment[];
}

type SupplierAction = 
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'UPDATE_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'ADD_PAYMENT'; payload: SupplierPayment }
  | { type: 'LOAD_DATA'; payload: SupplierState };

const initialState: SupplierState = {
  suppliers: [
    {
      id: '1',
      name: 'Fresh Farms Ltd',
      contactPerson: 'Ahmed Hassan',
      phone: '+961-1-234567',
      email: 'ahmed@freshfarms.lb',
      address: 'Bekaa Valley, Lebanon',
      paymentTerms: 'Net 30',
      creditLimit: 500000,
      balance: 125000,
      status: 'active',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Valley Produce',
      contactPerson: 'Fatima Al-Zahra',
      phone: '+961-1-345678',
      email: 'fatima@valleyproduce.lb',
      address: 'South Lebanon',
      paymentTerms: 'Net 15',
      creditLimit: 300000,
      balance: 82000,
      status: 'active',
      createdAt: new Date()
    }
  ],
  purchaseOrders: [],
  payments: []
};

const supplierReducer = (state: SupplierState, action: SupplierAction): SupplierState => {
  switch (action.type) {
    case 'ADD_SUPPLIER':
      return {
        ...state,
        suppliers: [...state.suppliers, action.payload]
      };
    
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(s => 
          s.id === action.payload.id ? action.payload : s
        )
      };
    
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(s => s.id !== action.payload)
      };
    
    case 'ADD_PURCHASE_ORDER':
      return {
        ...state,
        purchaseOrders: [...state.purchaseOrders, action.payload]
      };
    
    case 'UPDATE_PURCHASE_ORDER':
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.map(po => 
          po.id === action.payload.id ? action.payload : po
        )
      };
    
    case 'ADD_PAYMENT':
      return {
        ...state,
        payments: [...state.payments, action.payload],
        suppliers: state.suppliers.map(s => 
          s.id === action.payload.supplierId 
            ? { ...s, balance: s.balance - action.payload.amount }
            : s
        )
      };
    
    case 'LOAD_DATA':
      return action.payload;
    
    default:
      return state;
  }
};

const SupplierContext = createContext<{
  state: SupplierState;
  dispatch: React.Dispatch<SupplierAction>;
} | null>(null);

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(supplierReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('supplier-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading supplier data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('supplier-data', JSON.stringify(state));
  }, [state]);

  return (
    <SupplierContext.Provider value={{ state, dispatch }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};

export type { Supplier, PurchaseOrder, SupplierPayment };