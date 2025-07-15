import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  minStock: number;
  barcode?: string;
  supplier?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'retail' | 'wholesale';
  creditLimit: number;
  balance: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface Sale {
  id: string;
  customerId?: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
  receiptNumber: string;
}

interface POSState {
  products: Product[];
  customers: Customer[];
  cart: CartItem[];
  sales: Sale[];
  selectedCustomer?: Customer;
}

type POSAction = 
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_CART_ITEM'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SELECTED_CUSTOMER'; payload: Customer | undefined }
  | { type: 'PROCESS_SALE'; payload: Sale }
  | { type: 'LOAD_DATA'; payload: POSState };

const initialState: POSState = {
  products: [
    {
      id: '1',
      name: 'Tomatoes',
      category: 'Vegetables',
      price: 67500,
      unit: 'kg',
      stock: 150,
      minStock: 20,
      barcode: '1234567890123',
      supplier: 'Fresh Farms Ltd'
    },
    {
      id: '2',
      name: 'Potatoes',
      category: 'Vegetables',
      price: 45000,
      unit: 'kg',
      stock: 200,
      minStock: 30,
      barcode: '2345678901234',
      supplier: 'Valley Produce'
    },
    {
      id: '3',
      name: 'Onions',
      category: 'Vegetables',
      price: 37500,
      unit: 'kg',
      stock: 180,
      minStock: 25,
      barcode: '3456789012345',
      supplier: 'Fresh Farms Ltd'
    },
    {
      id: '4',
      name: 'Carrots',
      category: 'Vegetables',
      price: 52500,
      unit: 'kg',
      stock: 120,
      minStock: 15,
      barcode: '4567890123456',
      supplier: 'Garden Fresh Co'
    },
    {
      id: '5',
      name: 'Cabbage',
      category: 'Vegetables',
      price: 30000,
      unit: 'piece',
      stock: 80,
      minStock: 10,
      barcode: '5678901234567',
      supplier: 'Valley Produce'
    }
  ],
  customers: [
    {
      id: '1',
      name: 'Green Grocers Ltd',
      phone: '+1234567890',
      email: 'orders@greengrocers.com',
      address: '123 Market Street, Downtown',
      type: 'wholesale',
      creditLimit: 50000,
      balance: 12500
    },
    {
      id: '2',
      name: 'Super Fresh Market',
      phone: '+1234567891',
      email: 'procurement@superfresh.com',
      address: '456 Commerce Ave, Uptown',
      type: 'wholesale',
      creditLimit: 75000,
      balance: 8200
    },
    {
      id: '3',
      name: 'John Smith',
      phone: '+1234567892',
      email: 'john.smith@email.com',
      address: '789 Residential St, Suburb',
      type: 'retail',
      creditLimit: 1000,
      balance: 0
    }
  ],
  cart: [],
  sales: []
};

const posReducer = (state: POSState, action: POSAction): POSState => {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload]
      };
    
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
    
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload)
      };
    
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.payload]
      };
    
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload)
      };
    
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => 
        item.product.id === action.payload.product.id
      );
      
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? {
                  ...item,
                  quantity: item.quantity + action.payload.quantity,
                  subtotal: (item.quantity + action.payload.quantity) * item.product.price
                }
              : item
          )
        };
      }
      
      return {
        ...state,
        cart: [...state.cart, {
          product: action.payload.product,
          quantity: action.payload.quantity,
          subtotal: action.payload.quantity * action.payload.product.price
        }]
      };
    
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? {
                ...item,
                quantity: action.payload.quantity,
                subtotal: action.payload.quantity * item.product.price
              }
            : item
        )
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload)
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
        selectedCustomer: undefined
      };
    
    case 'SET_SELECTED_CUSTOMER':
      return {
        ...state,
        selectedCustomer: action.payload
      };
    
    case 'PROCESS_SALE':
      const newSale = action.payload;
      const updatedProducts = state.products.map(product => {
        const cartItem = newSale.items.find(item => item.product.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: product.stock - cartItem.quantity
          };
        }
        return product;
      });
      
      return {
        ...state,
        sales: [newSale, ...state.sales],
        products: updatedProducts,
        cart: [],
        selectedCustomer: undefined
      };
    
    case 'LOAD_DATA':
      return action.payload;
    
    default:
      return state;
  }
};

const POSContext = createContext<{
  state: POSState;
  dispatch: React.Dispatch<POSAction>;
} | null>(null);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(posReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('pos-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pos-data', JSON.stringify(state));
  }, [state]);

  return (
    <POSContext.Provider value={{ state, dispatch }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

export type { Product, Customer, CartItem, Sale };