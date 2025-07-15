import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: Date;
  reference?: string;
  supplierId?: string;
  receipt?: string;
}

interface DebtRecord {
  id: string;
  type: 'receivable' | 'payable';
  customerId?: string;
  supplierId?: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'overdue' | 'paid';
  description: string;
  createdAt: Date;
}

interface PaymentSchedule {
  id: string;
  debtId: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid';
  paidDate?: Date;
}

interface FinanceState {
  expenses: Expense[];
  debts: DebtRecord[];
  paymentSchedules: PaymentSchedule[];
  expenseCategories: string[];
}

type FinanceAction = 
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_DEBT'; payload: DebtRecord }
  | { type: 'UPDATE_DEBT'; payload: DebtRecord }
  | { type: 'ADD_PAYMENT_SCHEDULE'; payload: PaymentSchedule }
  | { type: 'UPDATE_PAYMENT_SCHEDULE'; payload: PaymentSchedule }
  | { type: 'ADD_EXPENSE_CATEGORY'; payload: string }
  | { type: 'LOAD_DATA'; payload: FinanceState };

const initialState: FinanceState = {
  expenses: [
    {
      id: '1',
      category: 'Utilities',
      description: 'Electricity bill',
      amount: 150000,
      paymentMethod: 'cash',
      date: new Date(),
      reference: 'ELEC-001'
    },
    {
      id: '2',
      category: 'Transportation',
      description: 'Delivery truck fuel',
      amount: 75000,
      paymentMethod: 'card',
      date: new Date(),
      reference: 'FUEL-001'
    }
  ],
  debts: [],
  paymentSchedules: [],
  expenseCategories: [
    'Utilities',
    'Transportation',
    'Rent',
    'Salaries',
    'Marketing',
    'Equipment',
    'Maintenance',
    'Insurance',
    'Supplies',
    'Other'
  ]
};

const financeReducer = (state: FinanceState, action: FinanceAction): FinanceState => {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload]
      };
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => 
          e.id === action.payload.id ? action.payload : e
        )
      };
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload)
      };
    
    case 'ADD_DEBT':
      return {
        ...state,
        debts: [...state.debts, action.payload]
      };
    
    case 'UPDATE_DEBT':
      return {
        ...state,
        debts: state.debts.map(d => 
          d.id === action.payload.id ? action.payload : d
        )
      };
    
    case 'ADD_PAYMENT_SCHEDULE':
      return {
        ...state,
        paymentSchedules: [...state.paymentSchedules, action.payload]
      };
    
    case 'UPDATE_PAYMENT_SCHEDULE':
      return {
        ...state,
        paymentSchedules: state.paymentSchedules.map(ps => 
          ps.id === action.payload.id ? action.payload : ps
        )
      };
    
    case 'ADD_EXPENSE_CATEGORY':
      return {
        ...state,
        expenseCategories: [...state.expenseCategories, action.payload]
      };
    
    case 'LOAD_DATA':
      return action.payload;
    
    default:
      return state;
  }
};

const FinanceContext = createContext<{
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
} | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('finance-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading finance data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finance-data', JSON.stringify(state));
  }, [state]);

  return (
    <FinanceContext.Provider value={{ state, dispatch }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export type { Expense, DebtRecord, PaymentSchedule };