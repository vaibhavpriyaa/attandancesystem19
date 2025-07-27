const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// @route   GET /api/reports/attendance
// @desc    Generate attendance report (Admin only)
// @access  Private (Admin)
router.get('/attendance', adminAuth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      department, 
      status,
      format = 'json'
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (userId) query.userId = userId;
    if (status) query.status = status;

    // If department is specified, get users from that department
    if (department) {
      const users = await User.find({ department }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department')
      .populate('approvedBy', 'name')
      .sort({ date: -1 });

    // Calculate summary statistics
    const summary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    const reportData = {
      summary: summary[0] || {
        totalRecords: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        totalHours: 0
      },
      attendance,
      filters: {
        startDate,
        endDate,
        userId,
        department,
        status
      }
    };

    if (format === 'csv') {
      return generateCSVReport(reportData, res);
    } else if (format === 'pdf') {
      return generatePDFReport(reportData, res);
    }

    res.json(reportData);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/user-summary
// @desc    Generate user attendance summary (Admin only)
// @access  Private (Admin)
router.get('/user-summary', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // If department is specified, get users from that department
    if (department) {
      const users = await User.find({ department }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }

    const userSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          employeeId: '$user.employeeId',
          department: '$user.department',
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          totalHours: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { attendanceRate: -1 } }
    ]);

    res.json({ userSummary });
  } catch (error) {
    console.error('Generate user summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/department-summary
// @desc    Generate department attendance summary (Admin only)
// @access  Private (Admin)
router.get('/department-summary', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const departmentSummary = await Attendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$user.department',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          department: '$_id',
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          totalHours: 1,
          userCount: { $size: '$uniqueUsers' },
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { attendanceRate: -1 } }
    ]);

    res.json({ departmentSummary });
  } catch (error) {
    console.error('Generate department summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate CSV report
const generateCSVReport = async (reportData, res) => {
  try {
    const csvWriter = createCsvWriter({
      path: 'attendance_report.csv',
      header: [
        { id: 'date', title: 'Date' },
        { id: 'employeeId', title: 'Employee ID' },
        { id: 'name', title: 'Name' },
        { id: 'department', title: 'Department' },
        { id: 'checkIn', title: 'Check In' },
        { id: 'checkOut', title: 'Check Out' },
        { id: 'totalHours', title: 'Total Hours' },
        { id: 'status', title: 'Status' },
        { id: 'notes', title: 'Notes' }
      ]
    });

    const records = reportData.attendance.map(record => ({
      date: moment(record.date).format('YYYY-MM-DD'),
      employeeId: record.userId.employeeId,
      name: record.userId.name,
      department: record.userId.department,
      checkIn: record.checkIn.time ? moment(record.checkIn.time).format('HH:mm:ss') : '',
      checkOut: record.checkOut.time ? moment(record.checkOut.time).format('HH:mm:ss') : '',
      totalHours: record.totalHours,
      status: record.status,
      notes: record.notes || ''
    }));

    await csvWriter.writeRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    
    const fileStream = fs.createReadStream('attendance_report.csv');
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on('end', () => {
      fs.unlinkSync('attendance_report.csv');
    });
  } catch (error) {
    console.error('CSV generation error:', error);
    res.status(500).json({ message: 'Error generating CSV report' });
  }
};

// Helper function to generate PDF report
const generatePDFReport = async (reportData, res) => {
  try {
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');
    
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    
    // Add date range
    doc.fontSize(12).text(`Period: ${moment(reportData.filters.startDate).format('MMM DD, YYYY')} - ${moment(reportData.filters.endDate).format('MMM DD, YYYY')}`);
    doc.moveDown();

    // Add summary
    doc.fontSize(14).text('Summary:');
    doc.fontSize(10).text(`Total Records: ${reportData.summary.totalRecords}`);
    doc.text(`Present Days: ${reportData.summary.presentDays}`);
    doc.text(`Absent Days: ${reportData.summary.absentDays}`);
    doc.text(`Late Days: ${reportData.summary.lateDays}`);
    doc.text(`Total Hours: ${reportData.summary.totalHours}`);
    doc.moveDown();

    // Add attendance details
    doc.fontSize(14).text('Attendance Details:');
    doc.moveDown();

    reportData.attendance.forEach((record, index) => {
      if (index > 0) doc.moveDown(0.5);
      
      doc.fontSize(10).text(`${record.userId.name} (${record.userId.employeeId})`);
      doc.fontSize(8).text(`Date: ${moment(record.date).format('MMM DD, YYYY')}`);
      doc.text(`Check In: ${record.checkIn.time ? moment(record.checkIn.time).format('HH:mm:ss') : 'N/A'}`);
      doc.text(`Check Out: ${record.checkOut.time ? moment(record.checkOut.time).format('HH:mm:ss') : 'N/A'}`);
      doc.text(`Hours: ${record.totalHours} | Status: ${record.status}`);
      
      if (record.notes) {
        doc.text(`Notes: ${record.notes}`);
      }
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};

module.exports = router; 