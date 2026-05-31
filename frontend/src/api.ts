import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Simple Stale-While-Revalidate Cache
const apiCache = new Map<string, any>();
const cacheTimestamps = new Map<string, number>();

const withCache = async (key: string, requestFn: () => Promise<any>, ttl = 5 * 60 * 1000) => {
  const cachedData = apiCache.get(key);
  const timestamp = cacheTimestamps.get(key);
  const isExpired = !timestamp || (Date.now() - timestamp > ttl);

  if (cachedData) {
    if (isExpired) {
      // Background revalidate
      requestFn().then(res => {
        apiCache.set(key, res);
        cacheTimestamps.set(key, Date.now());
      }).catch(err => console.error('Background cache refresh failed:', err));
    }
    return Promise.resolve(cachedData);
  }

  const res = await requestFn();
  apiCache.set(key, res);
  cacheTimestamps.set(key, Date.now());
  return res;
};

const clearCache = (prefix: string) => {
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
};

export const getExpenses = () => withCache('/expenses', () => api.get('/expenses'));
export const addExpense = (expenseData: any) => {
  clearCache('/expenses');
  return api.post('/expenses', expenseData);
};
export const deleteExpense = (id: string) => {
  clearCache('/expenses');
  return api.delete(`/expenses/${id}`);
};

// Receipt Scanner
export const scanReceipt = (file: File) => {
  const formData = new FormData();
  formData.append('receipt', file);
  return api.post('/expenses/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Category API
export interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
  budget: number;
}

export interface Wallet {
  _id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card';
  balance: number;
  color: string;
}

export interface Expense {
  _id: string;
  amount: number;
  categoryId?: Category | string;
  walletId?: Wallet | string;
  type: 'income' | 'expense';
  date: string;
  notes: string;
  isRecurring: boolean;
}

export const getCategories = () => withCache('/categories', () => api.get('/categories'));
export const addCategory = (categoryData: any) => {
  clearCache('/categories');
  return api.post('/categories', categoryData);
};
export const updateCategory = (id: string, categoryData: any) => {
  clearCache('/categories');
  return api.put(`/categories/${id}`, categoryData);
};
export const deleteCategory = (id: string) => {
  clearCache('/categories');
  return api.delete(`/categories/${id}`);
};

export const getWallets = () => withCache('/wallets', () => api.get('/wallets'));
export const createWallet = (data: Partial<Wallet>) => {
  clearCache('/wallets');
  return api.post('/wallets', data);
};
export const deleteWallet = (id: string) => {
  clearCache('/wallets');
  return api.delete(`/wallets/${id}`);
};

export const getBudgets = () => withCache('/budgets', () => api.get('/budgets'));
export const updateBudget = (budgetData: any) => {
  clearCache('/budgets');
  return api.post('/budgets', budgetData);
};
