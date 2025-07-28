import React, { useState } from 'react';

const Reports = () => {
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState('');
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [userSummary, setUserSummary] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      // Attendance summary
      const attRes = await fetch(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}&department=${department}`);
      const attData = await attRes.json();
      setAttendanceSummary(attData.summary);

      // User summary
      const userRes = await fetch(`/api/reports/user-summary?startDate=${startDate}&endDate=${endDate}&department=${department}`);
      const userData = await userRes.json();
      setUserSummary(userData.userSummary || []);

      // Department summary
      const deptRes = await fetch(`/api/reports/department-summary?startDate=${startDate}&endDate=${endDate}`);
      const deptData = await deptRes.json();
      setDepartmentSummary(deptData.departmentSummary || []);
    } catch (err) {
      setError('Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    window.open(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}&department=${department}&format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and view attendance, user, and department analytics. Export as CSV or PDF.</p>
      </div>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md">
              <option value="">All</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
          <button onClick={fetchReports} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium">Generate</button>
          <button onClick={() => handleExport('csv')} className="px-4 py-2 bg-green-600 text-white rounded-md font-medium">Export CSV</button>
          <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium">Export PDF</button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {loading && <div>Loading...</div>}
      </div>
      {/* Attendance Summary */}
      {attendanceSummary && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{attendanceSummary.totalRecords}</div>
              <div className="text-gray-700">Total Records</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{attendanceSummary.presentDays}</div>
              <div className="text-gray-700">Present</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{attendanceSummary.absentDays}</div>
              <div className="text-gray-700">Absent</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{attendanceSummary.lateDays}</div>
              <div className="text-gray-700">Late</div>
            </div>
          </div>
          <div className="mt-4 text-gray-700">Total Hours: <span className="font-bold">{attendanceSummary.totalHours}</span></div>
        </div>
      )}
      {/* User Summary */}
      {userSummary.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userSummary.map(user => (
                  <tr key={user.userId}>
                    <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.employeeId}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.department}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.presentDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.absentDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.lateDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.totalDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.totalHours}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{user.attendanceRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Department Summary */}
      {departmentSummary.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Analytics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Count</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentSummary.map(dept => (
                  <tr key={dept.department}>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.department}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.userCount}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.presentDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.absentDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.lateDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.totalDays}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.totalHours}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dept.attendanceRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 