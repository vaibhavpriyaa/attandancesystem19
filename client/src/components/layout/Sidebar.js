import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HiX,
  HiHome,
  HiClock,
  HiUsers,
  HiChartBar,
  HiUser,
  HiCalendar
} from 'react-icons/hi';

const Sidebar = ({ open, setOpen }) => {
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HiHome,
      roles: ['admin', 'staff']
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: HiClock,
      roles: ['admin', 'staff']
    },
    {
      name: 'Leave Management',
      href: '/leaves',
      icon: HiCalendar,
      roles: ['admin', 'staff']
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: HiUsers,
      roles: ['admin']
    },
    {
      name: 'Reports & Analytics',
      href: '/admin/reports',
      icon: HiChartBar,
      roles: ['admin']
    },
    {
      name: 'My Profile',
      href: '/profile',
      icon: HiUser,
      roles: ['admin', 'staff']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const NavItem = ({ item }) => {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 mb-1 ${
            isActive
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
        onClick={() => setOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance System
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-2">
            {filteredNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </nav>

        {/* User info at bottom - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 