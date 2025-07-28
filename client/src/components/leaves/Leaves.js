import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiCalendar, 
  HiClock, 
  HiCheckCircle,
  HiXCircle,
  HiPlus,
  HiCog,
  HiChartBar,
  HiDownload,
  HiRefresh
} from 'react-icons/hi';

const Leaves = () => {
  const { isAdmin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);


  const [selectedLeaves, setSelectedLeaves] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    leaveType: '',
    priority: '',
    department: ''
  });
  const [stats, setStats] = useState({});
  const [requestForm, setRequestForm] = useState({
    leaveType: 'annual',
    fromDate: '',
    toDate: '',
    reason: '',
    priority: 'medium',
    isHalfDay: false,
    halfDayType: 'morning',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', color: 'bg-blue-100 text-blue-800' },
    { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
    { value: 'casual', label: 'Casual Leave', color: 'bg-green-100 text-green-800' },
    { value: 'maternity', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-800' },
    { value: 'paternity', label: 'Paternity Leave', color: 'bg-purple-100 text-purple-800' },
    { value: 'bereavement', label: 'Bereavement Leave', color: 'bg-gray-100 text-gray-800' },
    { value: 'study', label: 'Study Leave', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'jury', label: 'Jury Duty', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'military', label: 'Military Leave', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/api/leaves/all' : '/api/leaves/my-leaves';
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${endpoint}?${params}`);
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filters]);

  const fetchLeaveBalance = useCallback(async () => {
    try {
      const response = await axios.get('/api/leaves/balance');
      setLeaveBalance(response.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get('/api/leaves/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalance();
    fetchStats();
  }, [fetchLeaves, fetchLeaveBalance, fetchStats]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...requestForm,
        fromDate: requestForm.fromDate,
        toDate: requestForm.toDate
      };
      
      await axios.post('/api/leaves', formData);
      toast.success('Leave request submitted successfully!');
      setShowRequestForm(false);
      setRequestForm({
        leaveType: 'annual',
        fromDate: '',
        toDate: '',
        reason: '',
        priority: 'medium',
        isHalfDay: false,
        halfDayType: 'morning',
        emergencyContact: { name: '', phone: '', relationship: '' }
      });
      fetchLeaves();
      fetchLeaveBalance();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit leave request';
      toast.error(message);
    }
  };

  const handleStatusUpdate = async (leaveId, status, rejectionReason = '') => {
    try {
      await axios.put(`/api/leaves/${leaveId}/approve`, { status, rejectionReason });
      toast.success(`Leave request ${status}!`);
      fetchLeaves();
      fetchLeaveBalance();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await axios.put(`/api/leaves/${leaveId}/cancel`);
      toast.success('Leave request cancelled successfully!');
      fetchLeaves();
      fetchLeaveBalance();
    } catch (error) {
      toast.error('Failed to cancel leave request');
    }
  };

  const handleBulkAction = async (action, rejectionReason = '') => {
    if (selectedLeaves.length === 0) {
      toast.error('Please select leave requests to process');
      return;
    }

    try {
      if (action === 'approve' || action === 'reject') {
        await axios.post('/api/leaves/bulk-approve', {
          leaveIds: selectedLeaves,
          status: action,
          rejectionReason
        });
        toast.success(`Bulk ${action} completed successfully!`);
      }
      
      setSelectedLeaves([]);
      setShowBulkModal(false);
      fetchLeaves();
      fetchLeaveBalance();
      fetchStats();
    } catch (error) {
      toast.error(`Failed to ${action} leave requests`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: HiClock },
      approved: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: HiXCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: HiXCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = leaveTypes.find(t => t.value === type) || leaveTypes[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
        {typeConfig.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = priorities.find(p => p.value === priority) || priorities[1];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig.color}`}>
        {priorityConfig.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDays = () => {
    if (!requestForm.fromDate || !requestForm.toDate) return 0;
    const from = new Date(requestForm.fromDate);
    const to = new Date(requestForm.toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return requestForm.isHalfDay ? 0.5 : diffDays + 1;
  };

  const LeaveBalanceCard = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <HiChartBar className="w-5 h-5 mr-2" />
        Leave Balance
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(leaveBalance).map(([type, data]) => (
          <div key={type} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 capitalize">{type}</span>
              <span className="text-xs text-gray-500">Days</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span className="font-medium">{data.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Used:</span>
                <span className="font-medium text-red-600">{data.used}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining:</span>
                <span className="font-medium text-green-600">{data.remaining}</span>
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(data.used / data.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StatsCard = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <HiChartBar className="w-5 h-5 mr-2" />
        Leave Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.summary?.totalRequests || 0}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.summary?.pendingRequests || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.summary?.approvedRequests || 0}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.summary?.rejectedRequests || 0}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage all leave requests from staff members.' : 'Request and track your leave applications.'}
          </p>
        </div>
        <div className="flex space-x-3">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowBalanceModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <HiCog className="w-4 h-4 mr-2" />
                Manage Balance
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                disabled={selectedLeaves.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <HiDownload className="w-4 h-4 mr-2" />
                Bulk Actions
              </button>
            </>
          )}
          {!isAdmin && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <HiPlus className="w-4 h-4 mr-2" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Leave Balance Card */}
      {!isAdmin && <LeaveBalanceCard />}

      {/* Stats Card */}
      {isAdmin && <StatsCard />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filters.leaveType}
            onChange={(e) => setFilters({...filters, leaveType: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {leaveTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          {isAdmin && (
            <>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>

              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Departments</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </>
          )}

          <button
            onClick={() => setFilters({status: '', leaveType: '', priority: '', department: ''})}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <HiRefresh className="w-4 h-4 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Leave Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Leave</h3>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                    <select
                      required
                      value={requestForm.leaveType}
                      onChange={(e) => setRequestForm({...requestForm, leaveType: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {leaveTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={requestForm.priority}
                      onChange={(e) => setRequestForm({...requestForm, priority: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Date</label>
                    <input
                      type="date"
                      required
                      value={requestForm.fromDate}
                      onChange={(e) => setRequestForm({...requestForm, fromDate: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To Date</label>
                    <input
                      type="date"
                      required
                      value={requestForm.toDate}
                      onChange={(e) => setRequestForm({...requestForm, toDate: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={requestForm.isHalfDay}
                      onChange={(e) => setRequestForm({...requestForm, isHalfDay: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Half Day</span>
                  </label>
                  
                  {requestForm.isHalfDay && (
                    <select
                      value={requestForm.halfDayType}
                      onChange={(e) => setRequestForm({...requestForm, halfDayType: e.target.value})}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                    </select>
                  )}
                </div>

                {calculateDays() > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      Total days: <span className="font-medium">{calculateDays()}</span>
                      {leaveBalance[requestForm.leaveType] && (
                        <span className="ml-2">
                          (Available: {leaveBalance[requestForm.leaveType]?.remaining || 0} days)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <textarea
                    required
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a detailed reason for your leave request..."
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={requestForm.emergencyContact.name}
                        onChange={(e) => setRequestForm({
                          ...requestForm, 
                          emergencyContact: {...requestForm.emergencyContact, name: e.target.value}
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={requestForm.emergencyContact.phone}
                        onChange={(e) => setRequestForm({
                          ...requestForm, 
                          emergencyContact: {...requestForm.emergencyContact, phone: e.target.value}
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Relationship</label>
                      <input
                        type="text"
                        value={requestForm.emergencyContact.relationship}
                        onChange={(e) => setRequestForm({
                          ...requestForm, 
                          emergencyContact: {...requestForm.emergencyContact, relationship: e.target.value}
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isAdmin ? 'All Leave Requests' : 'My Leave Requests'}
          </h3>
          <div className="text-sm text-gray-500">
            {leaves.length} request{leaves.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {loading ? (
          <div className="px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading leave requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <HiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin ? 'No leave requests match the current filters.' : 'You haven\'t submitted any leave requests yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeaves(leaves.map(l => l._id));
                          } else {
                            setSelectedLeaves([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeaves.includes(leave._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeaves([...selectedLeaves, leave._id]);
                            } else {
                              setSelectedLeaves(selectedLeaves.filter(id => id !== leave._id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {leave.userId?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{leave.userId?.name}</div>
                            <div className="text-sm text-gray-500">{leave.userId?.email}</div>
                            <div className="text-xs text-gray-400">{leave.userId?.department}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(leave.leaveType)}
                      {leave.isHalfDay && (
                        <span className="ml-1 text-xs text-gray-500">(Half Day)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(leave.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {isAdmin && leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(leave._id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {!isAdmin && leave.status === 'pending' && (
                          <button
                            onClick={() => handleCancelLeave(leave._id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaves; 