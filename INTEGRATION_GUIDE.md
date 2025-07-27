# Frontend-Backend Integration Guide

## 🎉 Current Status: SUCCESSFULLY INTEGRATED!

Your Attendance Management System is now running with both frontend and backend integrated.

## ✅ What's Working

### Backend (Node.js + Express)
- **Server**: Running on http://localhost:5001
- **API Endpoints**: All routes are functional
- **Authentication**: JWT-based auth system ready
- **Database**: Configured for MongoDB (can run without it for development)

### Frontend (React.js)
- **Application**: Running on http://localhost:3000
- **UI Components**: Modern, responsive design
- **Authentication**: Login/Register forms
- **Dashboard**: Role-based dashboards for Admin/Staff
- **Navigation**: Sidebar with role-based menu

## 🚀 Quick Start

### 1. Start the Application
```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run server  # Backend on port 5001
npm run client  # Frontend on port 3000
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Documentation**: Available at http://localhost:5001/api

## 🗄️ MongoDB Installation

### Option 1: Automated Installation
```bash
npm run install-mongodb
```

### Option 2: Manual Installation
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

### Option 3: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Update `server/.env` with your MongoDB URI

## 🔧 Configuration

### Environment Variables (`server/.env`)
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend Proxy (`client/package.json`)
```json
{
  "proxy": "http://localhost:5001"
}
```

## 📡 API Integration

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Attendance Endpoints
- `POST /api/attendance/check-in` - Mark check-in
- `POST /api/attendance/check-out` - Mark check-out
- `GET /api/attendance/my-records` - Get user records

### Admin Endpoints
- `GET /api/users` - Get all users
- `GET /api/reports/attendance` - Generate reports
- `GET /api/leaves/all` - Get all leave requests

## 🔄 Data Flow

1. **User Authentication**:
   - Frontend sends login/register request to `/api/auth/*`
   - Backend validates and returns JWT token
   - Frontend stores token in localStorage

2. **API Requests**:
   - Frontend includes JWT token in Authorization header
   - Backend validates token and processes request
   - Response sent back to frontend

3. **Real-time Updates**:
   - Frontend polls for updates or uses WebSocket (future enhancement)
   - Backend processes requests and updates database

## 🧪 Testing the Integration

### 1. Test Backend API
```bash
# Test server health
curl http://localhost:5001

# Test authentication endpoint
curl http://localhost:5001/api/auth/me
```

### 2. Test Frontend
- Open http://localhost:3000
- Try to register/login
- Navigate through different pages

### 3. Test Full Flow
1. Register a new user
2. Login with credentials
3. Access dashboard
4. Try attendance features

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :5001
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. MongoDB Connection Issues
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

#### 3. Frontend Not Loading
```bash
# Clear cache and restart
cd client
npm start
```

#### 4. Backend API Errors
```bash
# Check server logs
cd server
npm run dev
```

## 📊 Monitoring

### Backend Logs
- Server startup messages
- API request logs
- Database connection status
- Error messages

### Frontend Console
- Network requests
- JavaScript errors
- React component lifecycle

## 🔮 Future Enhancements

1. **Real-time Features**:
   - WebSocket integration
   - Live attendance updates
   - Push notifications

2. **Advanced Features**:
   - File upload for documents
   - Email notifications
   - Mobile app (React Native)

3. **Performance**:
   - Caching strategies
   - Database optimization
   - CDN integration

## 📞 Support

If you encounter any issues:

1. Check the logs in both frontend and backend
2. Verify all services are running
3. Check network connectivity
4. Review the configuration files

## 🎯 Success Indicators

✅ **Backend**: Server running on port 5001
✅ **Frontend**: React app running on port 3000
✅ **API**: Endpoints responding correctly
✅ **Database**: MongoDB connection (optional)
✅ **Authentication**: JWT tokens working
✅ **UI**: Components rendering properly

Your Attendance Management System is now fully integrated and ready for use! 🎉 