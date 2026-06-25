import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './layouts/AppLayout';

// Pages import
import Login from './pages/Login';
import AutomationBuilder from './pages/AutomationBuilder';

// Protected Route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Read direct from storage for initial boot safety
  const hasToken = !!localStorage.getItem('token');

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public login portal */}
        <Route path="/login" element={<Login />} />

        {/* Protected visual builder workspace routes */}
        <Route path="/" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/automations" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/whatsapp-accounts" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/business-assistant" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/group-assistant" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/humanizer" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/delay-settings" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/ai-personality" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/knowledge-sources" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/playground" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
