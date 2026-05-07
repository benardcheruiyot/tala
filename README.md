# Tala Mkopo Extra - Full Stack Loan Application

A modern fullstack loan application built with React and Node.js/Express.

## 📋 Project Structure

```
talaextrake-fullstack/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── models/       # Data models (User, Loan)
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic (M-Pesa, Loan service)
│   │   ├── middleware/   # Auth, error handling
│   │   ├── utils/        # Helper functions
│   │   └── server.js     # Express app setup
│   ├── .env              # Environment variables
│   ├── .env.example      # Example env file
│   └── package.json      # Backend dependencies
│
└── frontend/             # React application
    ├── public/
    │   └── index.html    # HTML entry point
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── services/     # API client
    │   ├── context/      # React context (Auth)
    │   ├── hooks/        # Custom hooks
    │   ├── utils/        # Helper functions
    │   ├── styles/       # CSS files
    │   ├── App.js        # Main app component
    │   └── index.js      # React entry point
    ├── .env              # Environment variables
    ├── .gitignore        # Git ignore
    └── package.json      # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your M-Pesa credentials and settings
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   ```

4. **Start development server:**
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 🔑 Key Features

### Backend
- ✅ Express.js REST API
- ✅ JWT authentication
- ✅ M-Pesa payment integration (Daraja API)
- ✅ User and Loan management
- ✅ Error handling middleware
- ✅ CORS enabled
- ✅ Rate limiting
- ✅ Security headers (Helmet)

### Frontend
- ✅ React with React Router
- ✅ Context API for state management
- ✅ Responsive design
- ✅ Form validation
- ✅ Payment flow with SweetAlert2
- ✅ User authentication
- ✅ Loan dashboard
- ✅ Mobile-first design

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register/Login user
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)

### Loans
- `POST /api/loans/apply` - Create loan application (protected)
- `GET /api/loans` - Get user loans (protected)
- `GET /api/loans/:loanId` - Get loan details (protected)

### Payments (M-Pesa)
- `POST /api/stk_push` - Initiate STK push for payment
- `GET /api/check_status` - Check payment status
- `POST /api/mpesa/callback` - M-Pesa callback handler

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_production_key
MPESA_CONSUMER_SECRET=your_production_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PARTYB=your_buygoods_or_paybill_destination
MPESA_PASSKEY=your_production_passkey
MPESA_ENVIRONMENT=production
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline

# Loan Settings
LOAN_MIN_AMOUNT=1000
LOAN_MAX_AMOUNT=100000
LOAN_INTEREST_RATE=0.1
PROCESSING_FEE=300

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📚 Technologies Used

### Backend
- Express.js
- Node.js
- JWT (jsonwebtoken)
- Bcryptjs
- Axios
- Helmet
- Morgan
- Express Rate Limit

### Frontend
- React 18
- React Router DOM
- Axios
- SweetAlert2
- Lucide React

## 🔄 User Flow

1. **Home Page** - Landing page with feature overview
2. **Eligibility** - User enters phone number
3. **Loan Application** - Select loan amount
4. **Payment** - M-Pesa STK push initiated
5. **Dashboard** - View loan status and history

## 🛠️ Development Scripts

### Backend
```bash
npm run dev        # Start development server with nodemon
npm start          # Start production server
npm test           # Run tests
npm run lint       # Run linter
npm run format     # Format code
```

### Frontend
```bash
npm start          # Start development server
npm build          # Build for production
npm test           # Run tests
```

## 📝 Architecture Decisions

1. **Separation of Concerns** - Frontend and backend in separate folders for modularity
2. **In-Memory Storage** - Demo uses Map for user/loan storage (replace with MongoDB for production)
3. **Context API** - Used for auth state management (scalable to Redux if needed)
4. **RESTful API** - Standard REST endpoints for easy integration
5. **Environment-based Config** - Different settings for dev/prod environments

## 🚀 Deployment

### Backend
- Can be deployed to Heroku, AWS, DigitalOcean, etc.
- Uses environment variables for configuration
- Ensure M-Pesa callback URL is configured

### Frontend
- Can be deployed to InterServer, Netlify, AWS S3 + CloudFront, etc.
- Build with `npm run build`
- Update `REACT_APP_API_URL` for production API endpoint

### GitHub Actions (Push To Deploy)

A workflow is included at `.github/workflows/deploy-interserver.yml`.
On every push, it will:

1. Install backend and frontend dependencies
2. Build the frontend using the committed `frontend/.env`
3. Upload build artifacts
4. Deploy backend and frontend to InterServer over SSH
5. Deploy the committed `backend/.env` to the server
6. Install production dependencies on server
7. Auto-install PM2 if missing and restart backend
8. Auto-install and configure Nginx for `tala.mkopaji.com`
9. Auto-provision or renew Let's Encrypt SSL when DNS and `CERTBOT_EMAIL` are available

Set these repository secrets in GitHub:

- `INTERSERVER_HOST` - Server hostname or IP
- `INTERSERVER_SSH_PORT` - SSH port (use `22` if standard)
- `INTERSERVER_USER` - SSH user
- `INTERSERVER_SSH_KEY` - Private key for SSH auth
- `INTERSERVER_APP_DIR` - Server path for backend app files (example: `/home/username/apps/tala`)
- `INTERSERVER_WEB_ROOT` - Server web root for frontend static files (example: `/home/username/public_html`)
- `CERTBOT_EMAIL` - Optional email address for Let's Encrypt certificate registration

Notes:

- After secrets are set once, deployment is push-only from your side.
- The workflow now uses the tracked `.env` files in this repository for backend and frontend configuration.
- The Nginx automation assumes your SSH user has `sudo` access when not logging in as root.

## 🔒 Security Considerations

- ✅ JWT tokens for authentication
- ✅ Bcryptjs for password hashing
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Security headers (Helmet)
- ✅ Input validation
- ✅ Protected routes on frontend

## 📦 Production Checklist

- [ ] Replace in-memory storage with MongoDB/PostgreSQL
- [ ] Configure real M-Pesa credentials
- [ ] Update API URLs
- [ ] Set up SSL/TLS certificates
- [ ] Configure email notifications
- [ ] Set up logging system
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and alerting
- [ ] Configure backups
- [ ] Perform security audit

## 📞 Support

For issues or questions, refer to the individual README files in `backend/` and `frontend/` directories.

## 📄 License

This project is licensed under the ISC License.

## 👥 Contributors

- Your Name
