import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../admin/AdminDashboard';
import StaffDashboard from '../staff/StaffDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  console.log('📊 Dashboard: User:', user);
  console.log('📊 Dashboard: User role:', user?.role);

  // Add a simple test to see if component is rendering
  console.log('📊 Dashboard: Component rendering...');

  // Render different dashboard based on user role
  if (user?.role === 'admin') {
    console.log('📊 Dashboard: Rendering AdminDashboard');
    return (
      <div>
        <div style={{ padding: '10px', background: '#e8f5e8', border: '1px solid #4caf50', margin: '10px 0' }}>
          ✅ Dashboard Component Loaded Successfully! User: {user.name} ({user.role})
        </div>
        <AdminDashboard />
      </div>
    );
  }

  console.log('📊 Dashboard: Rendering StaffDashboard');
  return (
    <div>
      <div style={{ padding: '10px', background: '#e8f5e8', border: '1px solid #4caf50', margin: '10px 0' }}>
        ✅ Dashboard Component Loaded Successfully! User: {user.name} ({user.role})
      </div>
      <StaffDashboard />
    </div>
  );
};

export default Dashboard; 