# 🏢 Attendance Management System

A comprehensive full-stack web application for managing employee attendance, built with React.js, Node.js, Express.js, and MongoDB.

## ✨ Features

### 🔐 Authentication & User Management
- **Role-based Access Control**: Admin and Staff roles
- **Secure Login/Registration**: JWT-based authentication
- **Password Management**: Forgot password and reset functionality
- **Profile Management**: Update personal information including email address

### 📊 Dashboard
- **Admin Dashboard**: Overview of all employees, attendance statistics, and quick actions
- **Staff Dashboard**: Personal attendance status, check-in/out functionality, and recent records

### ⏰ Attendance Management
- **Check-in/Check-out**: Real-time attendance tracking
- **Attendance Records**: Comprehensive history with filtering and pagination
- **Today's Status**: Current day attendance overview
- **Export Functionality**: CSV export for attendance reports

### 📋 Leave Management
- **Leave Requests**: Submit and manage leave applications
- **Leave Approval**: Admin approval workflow
- **Leave History**: Track all leave records

### 📈 Reports & Analytics
- **Attendance Reports**: Detailed attendance analytics
- **Employee Statistics**: Performance metrics and insights
- **Export Capabilities**: Generate reports in various formats

## 🛠️ Tech Stack

### Frontend
- **React.js**: Modern UI framework
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Hot Toast**: User notifications
- **React Context API**: State management

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation

### Development Tools
- **Nodemon**: Auto-restart server during development
- **Concurrently**: Run frontend and backend simultaneously
- **ESLint**: Code linting

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyavaibhavshukla/ATTANDENCE-MANGAEMENT-SYSTEM.git
   cd ATTANDENCE-MANGAEMENT-SYSTEM
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp server/.env.example server/.env
   
   # Update environment variables in server/.env
   ```

4. **Database Setup**
   ```bash
   # Option 1: Install MongoDB locally
   npm run setup-mongodb
   
   # Option 2: Use MongoDB Atlas
   npm run setup-mongodb-atlas
   ```

5. **Start Development Server**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run server  # Backend on port 5001
   npm run client  # Frontend on port 3000
   ```

## 🌐 Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel:

1. **Connect to Vercel**
   - Install Vercel CLI: `npm i -g vercel`
   - Login: `vercel login`

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   - Set up environment variables in Vercel dashboard
   - Configure MongoDB connection string
   - Set JWT secret

### Manual Deployment

1. **Build the application**
   ```bash
   # Build frontend
   cd client && npm run build
   
   # The backend will be deployed as-is
   ```

2. **Deploy to your preferred platform**
   - Frontend: Netlify, Vercel, or any static hosting
   - Backend: Heroku, Railway, or any Node.js hosting
   - Database: MongoDB Atlas

## 📱 Usage

### Development Mode
- **Login**: Use any email with password `123456`
- **Admin Role**: Email containing "admin" or `admin@test.com`
- **Staff Role**: Any other email

### Production Mode
- **Registration**: Create new accounts
- **Login**: Use registered credentials
- **Role Assignment**: Configured during registration

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

### MongoDB Setup

#### Local MongoDB
```bash
# macOS (using Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download and install from MongoDB website

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

#### MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

## 📁 Project Structure

```
attendance-management-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── index.js           # Server entry point
│   └── package.json
├── package.json           # Root package.json
├── vercel.json           # Vercel configuration
└── README.md
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Express-validator for data validation
- **CORS Configuration**: Cross-origin resource sharing setup
- **Environment Variables**: Secure configuration management

## 🧪 Testing

### API Testing
```bash
# Test login endpoint
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Frontend Testing
- Open browser to `http://localhost:3000`
- Test all features in development mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Priya Vaibhav Shukla**
- GitHub: [@priyavaibhavshukla](https://github.com/priyavaibhavshukla)
- Repository: [ATTANDENCE-MANGAEMENT-SYSTEM](https://github.com/priyavaibhavshukla/ATTANDENCE-MANGAEMENT-SYSTEM.git)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/priyavaibhavshukla/ATTANDENCE-MANGAEMENT-SYSTEM/issues) page
2. Create a new issue with detailed description
3. Contact the author for direct support

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Biometric integration
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Real-time notifications
- [ ] API documentation

---

**⭐ Star this repository if you find it helpful!** 