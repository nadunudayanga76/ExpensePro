import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import Layout from './components/Layout';
// Import pages
import Dashboard from './pages/Dashboard.tsx';
import Expenses from './pages/Expenses.tsx';
import AddExpense from './pages/AddExpense.tsx';
import Categories from './pages/Categories.tsx';
import Budgets from './pages/Budgets.tsx';
import Insights from './pages/Insights.tsx';
import SavingPlans from './pages/SavingPlans.tsx';
import Settings from './pages/Settings.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';

function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="add-expense" element={<AddExpense />} />
          <Route path="categories" element={<Categories />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="insights" element={<Insights />} />
          <Route path="plans" element={<SavingPlans />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
