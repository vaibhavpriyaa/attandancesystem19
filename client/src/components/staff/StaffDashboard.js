import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  HiClock, 
  HiCalendar, 
  HiUser, 
  HiDocumentText,
  HiCheckCircle,
  HiXCircle,
  HiArrowRight,
  HiRefresh
} from 'react-icons/hi';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
    checkInTime: null,
    checkOutTime: null,
    totalHours: 0,
    status: 'not_checked_in'
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [recentRecords, setRecentRecords] = useState([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    averageHours: 0
  });

  useEffect(() => {
    fetchTodayStatus();
    fetchRecentRecords();
    fetchStats();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const response = await axios.get('/api/attendance/today-status');
      setAttendanceStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching today status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRecords = async () => {
    try {
      const response = await axios.get('/api/attendance/my-records?limit=5');
      setRecentRecords(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching recent records:', error);
      // Mock data for development
      setRecentRecords([
        {
          _id: '1',
          date: new Date(Date.now() - 86400000),
          checkIn: { time: new Date(Date.now() - 86400000 + 32400000) },
          checkOut: { time: new Date(Date.now() - 86400000 + 61200000) },
          totalHours: 8,
          status: 'present'
        },
        {
          _id: '2',
          date: new Date(Date.now() - 172800000),
          checkIn: { time: new Date(Date.now() - 172800000 + 32400000) },
          checkOut: { time: new Date(Date.now() - 172800000 + 61200000) },
          totalHours: 8,
          status: 'present'
        }
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for development
      setStats({
        totalDays: 22,
        presentDays: 20,
        absentDays: 2,
        averageHours: 7.8
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post('/api/attendance/check-in');
      toast.success(response.data.message);
      fetchTodayStatus();
    } catch (error) {
      const message = error.response?.data?.message || 'Check-in failed';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post('/api/attendance/check-out');
      toast.success(response.data.message);
      fetchTodayStatus();
    } catch (error) {
      const message = error.response?.data?.message || 'Check-out failed';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'text-green-600 bg-green-100';
      case 'checked_out':
        return 'text-blue-600 bg-blue-100';
      case 'not_checked_in':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'checked_in':
        return <HiCheckCircle className="h-5 w-5 text-green-600" />;
      case 'checked_out':
        return <HiXCircle className="h-5 w-5 text-blue-600" />;
      case 'not_checked_in':
        return <HiClock className="h-5 w-5 text-gray-600" />;
      default:
        return <HiClock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}! Here's your attendance overview.</p>
      </div>

      {/* Today's Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Status</h2>
          <button
            onClick={fetchTodayStatus}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh status"
          >
            <HiRefresh className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendanceStatus.status)}`}>
              {getStatusIcon(attendanceStatus.status)}
              <span className="ml-2 capitalize">
                {attendanceStatus.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Check-in Time</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(attendanceStatus.checkInTime)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Check-out Time</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(attendanceStatus.checkOutTime)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!attendanceStatus.isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? (
                <div className="spinner h-4 w-4 mr-2"></div>
              ) : (
                <HiCheckCircle className="h-5 w-5 mr-2" />
              )}
              Check In
            </button>
          ) : !attendanceStatus.isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? (
                <div className="spinner h-4 w-4 mr-2"></div>
              ) : (
                <HiXCircle className="h-5 w-5 mr-2" />
              )}
              Check Out
            </button>
          ) : (
            <div className="flex-1 text-center py-2 text-gray-600">
              ✅ Day completed! Great work!
            </div>
          )}
          
          <Link
            to="/attendance"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
          >
            <HiDocumentText className="h-5 w-5 mr-2 inline" />
            View History
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <HiCalendar className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Days</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDays}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <HiCheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Present Days</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.presentDays}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <HiXCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Absent Days</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.absentDays}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <HiClock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Records */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
          <Link
            to="/attendance"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View All
            <HiArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentRecords.length > 0 ? (
            recentRecords.map((record) => (
              <div key={record._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <HiCalendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(record.date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(record.checkIn?.time)} - {formatTime(record.checkOut?.time)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {record.totalHours || 0}h
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HiDocumentText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No attendance records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/leaves"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HiCalendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Request Leave</h3>
              <p className="text-xs text-gray-500">Submit leave applications</p>
            </div>
          </Link>
          
          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <HiUser className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Update Profile</h3>
              <p className="text-xs text-gray-500">Manage your information</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard; 