import React from 'react';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from './pages/loginPage';
import Sidebar from './components/sidebar';
import FarmersPage from './pages/farmersPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import VegetablesPage from './pages/vegetablesPage';
import GroupPage from './pages/groupPage';
import CustomersPage from './pages/customersPage';
import StockPage from './pages/stockPage';
import SalesPage from './pages/salesPage';
import CreditsPage from './pages/creditsPage';
import ReportsPage from './pages/reportsPage';
import Ledger from './pages/lendger';

const Layout = () => {
  const location = useLocation();

  const hideSidebarRoutes = ["/"];
  return(
    <>
      {!hideSidebarRoutes.includes(location.pathname) && <Sidebar />}
      <Routes>
        <Route path='/' element={<LoginPage/>}/>
        {/* protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"  element={<Dashboard/>}/>
          <Route path="/farmers" element={<FarmersPage/>}/>
          <Route path="/vegetables" element={<VegetablesPage/>}/>
          <Route path="/groups" element={<GroupPage/>}/>
          <Route path="/customers" element={<CustomersPage/>}/>
          <Route path="/inventory" element={<StockPage/>}/>
          <Route path="/sales" element={<SalesPage/>}/>
          <Route path="/jamalu" element={<CreditsPage/>}/>
          <Route path="/reports" element={<ReportsPage/>}/>
          <Route path="/ledger" element={<Ledger />} />
        </Route>
      </Routes>
    </>
  )
}
const App = () => {
  
  return (
    <AuthProvider>
      <ToastContainer autoClose={1000}/>
      <Router>
        <Layout/>
      </Router>
    </AuthProvider>
    
  )
}

export default App;