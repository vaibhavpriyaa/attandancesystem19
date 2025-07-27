# 📊 Attendance Management System

A comprehensive attendance management system built with React, Node.js, Express, and MongoDB. Features role-based access control, real-time attendance tracking, and detailed reporting capabilities.

## 🚀 Live Demo

[Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/priyavaibhavshukla/attandancesystem.git)

## ✨ Features

### 🔐 Authentication & Authorization
- **Public Registration**: Anyone can create an account with email and password
- **Role-based Access**: Admin and Staff roles with different permissions
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing for password protection

### 📝 Attendance Management
- **Check-in/Check-out**: Real-time attendance tracking
- **Location Tracking**: IP-based location detection
- **Time Stamps**: Automatic date and time recording
- **Status Tracking**: Present, Absent, Late status management

### 👥 User Management
- **User Profiles**: Complete user information management
- **Department Assignment**: Organize users by departments
- **Employee IDs**: Unique identification system
- **Account Status**: Active/Inactive user management

### 📊 Reports & Analytics
- **Attendance Reports**: Daily, weekly, monthly reports
- **Multiple Formats**: JSON, CSV, and PDF export options
- **Filtering**: Filter by date range, user, department, status
- **Summary Statistics**: Present, absent, late day counts

### 🏖️ Leave Management
- **Leave Requests**: Submit and track leave applications
- **Approval System**: Admin approval workflow
- **Leave Types**: Different categories of leave
- **Status Tracking**: Pending, approved, rejected status

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Tailwind CSS**: Modern styling framework
- **React Icons**: Beautiful icon library
- **Toast Notifications**: User-friendly feedback

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern UI framework
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Icons**: Icon library
- **Axios**: HTTP client
- **React Hot Toast**: Toast notifications

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Moment.js**: Date/time manipulation
- **Express Validator**: Input validation

### Development Tools
- **Nodemon**: Auto-restart server
- **Concurrently**: Run multiple commands
- **CORS**: Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyavaibhavshukla/attandancesystem.git
   cd attandancesystem
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   brew services start mongodb-community
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 🌐 Deployment

### Vercel Deployment

1. **Fork/Clone this repository**
2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_jwt_secret
   CORS_ORIGIN=https://your-vercel-domain.vercel.app
   ```

4. **Deploy**
   - Vercel will automatically detect the configuration
   - Build and deploy your application

### MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create free account

2. **Create Cluster**
   - Choose free tier
   - Select cloud provider and region

3. **Configure Database Access**
   - Create database user
   - Set username and password

4. **Configure Network Access**
   - Allow access from anywhere (0.0.0.0/0)
   - Or restrict to Vercel IPs

5. **Get Connection String**
   - Copy connection string
   - Replace `<password>` with your password
   - Add to Vercel environment variables

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register-public` - Public user registration
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Admin user registration (Admin only)

### Attendance
- `POST /api/attendance/check-in` - Mark check-in
- `POST /api/attendance/check-out` - Mark check-out
- `GET /api/attendance/records` - Get attendance records

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Reports
- `GET /api/reports/attendance` - Generate attendance reports
- `GET /api/reports/leaves` - Generate leave reports

### Leaves
- `POST /api/leaves/request` - Request leave
- `GET /api/leaves` - Get leave requests
- `PUT /api/leaves/:id/approve` - Approve leave (Admin only)

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/attendance-system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 👥 Usage

### For Staff/Employees
1. **Register**: Create account with email and password
2. **Login**: Access your dashboard
3. **Check-in/Check-out**: Mark daily attendance
4. **Request Leave**: Submit leave applications
5. **View Reports**: Check your attendance history

### For Administrators
1. **User Management**: Manage all user accounts
2. **Attendance Monitoring**: View all attendance records
3. **Leave Approval**: Approve/reject leave requests
4. **Reports Generation**: Generate comprehensive reports
5. **System Configuration**: Configure system settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Priya Vaibhav Shukla**
- GitHub: [@priyavaibhavshukla](https://github.com/priyavaibhavshukla)

## 🙏 Acknowledgments

- React team for the amazing framework
- Vercel for seamless deployment
- MongoDB for the database solution
- All contributors and supporters

## 📞 Support

If you have any questions or need support, please open an issue on GitHub or contact the author.

---

⭐ **Star this repository if you find it helpful!** 