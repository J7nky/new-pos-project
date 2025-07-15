import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
  email: string;
  createdAt: Date;
  lastLogin?: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[];
}

type AuthAction = 
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'LOAD_DATA'; payload: AuthState };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  users: [
    {
      id: '1',
      username: 'admin',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@veggiemarket.com',
      createdAt: new Date(),
      lastLogin: new Date()
    },
    {
      id: '2',
      username: 'staff1',
      role: 'staff',
      name: 'John Doe',
      email: 'john@veggiemarket.com',
      createdAt: new Date(),
      lastLogin: new Date()
    }
  ]
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false
      };
    
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload]
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => 
          u.id === action.payload.id ? action.payload : u
        )
      };
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload)
      };
    
    case 'LOAD_DATA':
      return action.payload;
    
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('auth-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading auth data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('auth-data', JSON.stringify(state));
  }, [state]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simple authentication - in production, this would be server-side
    const user = state.users.find(u => u.username === username);
    
    if (user && (password === 'admin123' || password === 'staff123')) {
      const updatedUser = { ...user, lastLogin: new Date() };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      dispatch({ type: 'LOGIN', payload: updatedUser });
      return true;
    }
    
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User };