# Business Card Scanner

An AI-powered business card scanner application that uses OCR (Optical Character Recognition) to extract contact information from business card images. This application now features a multi-tenant architecture with role-based access control, cloud storage for business cards, and an admin dashboard for global management.

## 🚀 Features

- **Multi-Tenant Architecture**: Supports multiple companies, each with their own users and business cards.
- **Role-Based Access Control**: SUPER_ADMIN, ORG_ADMIN, and MEMBER roles with different permissions.
- **AI-Powered OCR**: Uses Anthropic Claude API for accurate text extraction from business card images.
- **Image Compression**: Automatically compresses images to under 3MB before processing.
- **Multiple Upload Methods**: Upload from gallery or capture directly from camera.
- **Cloud Storage**: Business cards are stored in a PostgreSQL database.
- **Admin Dashboard**: Global view for SUPER_ADMIN to manage companies, users, and all business cards.
- **User Dashboard**: "My Cards" and "Company Cards" views for company members.
- **Search & Filter**: Quickly find cards by name, company, email, or title.
- **Edit & Delete**: Full CRUD operations for managing your business cards.
- **Modern UI**: Beautiful dark-themed interface with smooth animations.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL Database**: Running locally or accessible via URL.
- **Prisma CLI**: `npm install -g prisma` (if not already installed).
- **Anthropic API Key** (optional, for enhanced OCR) - [Get your API key](https://console.anthropic.com/)

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd business-card
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Set up backend environment variables**

   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/business_card_db"
   JWT_SECRET=your_super_secret_jwt_key_here
   # Optional: Initial Super Admin credentials for `npx prisma db seed`
   # SUPER_ADMIN_EMAIL=admin@platform.com
   # SUPER_ADMIN_PASSWORD=Admin123!
   # Optional: Anthropic API Key for OCR
   # ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   **Note**: For `DATABASE_URL`, replace with your PostgreSQL connection string. Ensure `JWT_SECRET` is strong.

4. **Install backend dependencies, set up database, and seed initial data**

   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npx prisma db seed
   cd ..
   ```
   This will:
   - Install backend Node.js dependencies.
   - Run Prisma migrations to create your database schema.
   - Seed the database, creating the "Platform" organization and a SUPER_ADMIN user (`admin@platform.com` / `Admin123!` by default, or from `.env`).

5. **Set up frontend environment variables**

   Create a `.env` file in the project root (same level as `package.json`):
   ```env
   VITE_API_URL=http://localhost:3000
   ```

## 🏃 Running Locally

1. **Start the backend server**

   From the project root:
   ```bash
   cd backend
   npm run start:dev
   # Backend will run on http://localhost:3000 (or PORT from backend/.env)
   ```

2. **Start the frontend development server**

   In a new terminal, from the project root:
   ```bash
   npm run dev
   # Frontend will run on http://localhost:5173 (default Vite port)
   ```

   Open your browser to `http://localhost:5173`.

## 🧪 Testing

### Frontend Build

```bash
npm run build
```

### Backend API Smoke Test

Ensure the backend server is running (`npm run start:dev` in `backend/`).

Then, run the API test script from the project root:
```bash
bash scripts/test-api.sh
```

This script performs basic login, organization creation/listing, and all business cards listing to verify the backend API endpoints.

## 📁 Project Structure

```
business-card/
├── backend/                    # NestJS backend application
│   ├── prisma/                 # Prisma schema and seed
│   ├── src/                    # Backend source code (modules, controllers, services, DTOs, guards)
│   └── ...
├── src/                        # React frontend application
│   ├── App.jsx                 # Main application router
│   ├── main.jsx                # React entry point with AuthProvider
│   ├── index.css               # Global styles
│   ├── api/                    # API client configuration
│   │   └── client.js
│   ├── components/             # Reusable React components
│   │   └── ProtectedRoute.jsx
│   ├── context/                # React context providers
│   │   └── AuthContext.jsx
│   └── pages/                  # Page-level React components
│       ├── AdminPage.jsx
│       ├── BusinessCardScanner.jsx # Core scanner UI, now API-driven
│       ├── Dashboard.jsx       # User dashboard with tabs for My Cards / Company Cards
│       │                       #   (wraps BusinessCardScanner)

│       ├── Login.jsx
│       └── Register.jsx
├── scripts/                    # Utility scripts
│   └── test-api.sh             # Backend API smoke test script
├── dist/                       # Production build output for frontend
├── public/                     # Static assets for frontend
├── package.json                # Root dependencies and scripts
├── vite.config.js              # Vite configuration for frontend
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── README.md                   # This file
```

## 🚢 Deployment

This project is designed for flexible deployment. The frontend can be deployed statically (e.g., Netlify, Vercel) pointing to a separately deployed backend (e.g., on a VPS, Render, or a serverless platform).

**Note**: The original `netlify/functions/scan-card.js` is no longer used for API-driven card management but remains for historical context or if you wish to re-integrate Netlify Functions for OCR specifically.

### Building for Production

1. **Build Frontend**
   ```bash
   npm run build
   ```
   This creates the `dist/` directory with static frontend assets.

2. **Build Backend**
   ```bash
   cd backend
   npm run build
   ```
   This creates the `backend/dist/` directory with compiled NestJS code.

### Deployment Steps (Example: Separate Frontend and Backend)

**Backend Deployment:**
- Deploy the contents of `backend/dist` to a Node.js server environment (e.g., a VPS, Docker container, or managed service).
- Ensure `DATABASE_URL`, `JWT_SECRET`, and `ANTHROPIC_API_KEY` (if used) are set as environment variables in your hosting environment.
- Run database migrations and seed on deployment (`npx prisma migrate deploy` and `npx prisma db seed`).

**Frontend Deployment:**
- Deploy the contents of the top-level `dist` directory (generated by `npm run build`) to a static hosting service (e.g., Netlify, Vercel, Cloudflare Pages).

- Set the `VITE_API_URL` environment variable in your frontend hosting environment to point to your deployed backend's API URL (e.g., `https://your-backend-api.com`).

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the [TODO.md](./TODO.md) for known issues and planned features

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR fallback
- [NestJS](https://nestjs.com/) for the backend framework
- [React](https://react.dev/) for the frontend library
- [Vite](https://vitejs.dev/) for the frontend build tool
- [Prisma](https://www.prisma.io/) for the ORM






