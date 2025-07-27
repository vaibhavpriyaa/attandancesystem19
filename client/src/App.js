import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import Attendance from './components/attendance/Attendance';
import Reports from './components/reports/Reports';
import Users from './components/admin/Users';
import Leaves from './components/leaves/Leaves';
import Profile from './components/profile/Profile';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  console.log('🔒 ProtectedRoute: User:', user);
  console.log('🔒 ProtectedRoute: Loading:', loading);
  console.log('🔒 ProtectedRoute: Allowed roles:', allowedRoles);

  if (loading) {
    console.log('🔒 ProtectedRoute: Showing loading spinner');
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('🔒 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('🔒 ProtectedRoute: User role not allowed, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('🔒 ProtectedRoute: Access granted, rendering children');
  return children;
};

// Main App Component
const AppContent = () => {
  const { user, loading } = useAuth();

  console.log('🔄 AppContent: User state:', user);
  console.log('🔄 AppContent: Loading state:', loading);

  if (loading) {
    console.log('🔄 AppContent: Showing loading spinner');
    return <LoadingSpinner />;
  }

  console.log('🔄 AppContent: Rendering routes, user:', user ? user.email : 'null');

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Shared Routes (Admin & Staff) */}
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin Only Routes */}
        <Route path="admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// App Component with Auth Provider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 