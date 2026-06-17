# DZ Infotech OS

A modern, comprehensive organizational Operating System built for DZ Infotech. This platform centralizes and streamlines core business operations including Human Resources (employee management, attendance, leave, payroll) and Revenue Management (leads, clients, projects, AMC tracking).

## 🚀 Key Features

- **Admin Dashboard**: Real-time workforce snapshot, attendance trends, pending approvals, and interactive metric cards.
- **Role-Based Access Control (RBAC)**: Secure access tailored for Admins, HR managers, and Employees.
- **Employee Management**: Comprehensive onboarding, directory, and employee profile management.
- **Attendance Tracking**: Daily attendance logging with a live trend chart and absent tracking.
- **Leave Management**: Submit, track, and approve/reject leave requests seamlessly.
- **Payroll Processing**: Automated salary calculation, tax deductions, and downloadable PDF payslips.
- **Reporting**: Advanced analytics and exportable reports (CSV/PDF) for attendance and payroll data.
- **Revenue & Client Management**: Track leads, manage client portfolios, oversee active projects, and monitor AMC status.
- **ConTrack Integration**: Specialized tracking for ConTrack leads and Monthly Recurring Revenue (MRR).

## 🛠 Tech Stack

**Frontend Framework:** React 18, Vite
**Styling:** Tailwind CSS, Heroicons
**Backend & Database:** Supabase (Authentication, PostgreSQL Database)
**State Management:** React Hooks, Context API
**Charts & Visualization:** Recharts
**File Uploads:** Cloudinary
**Exports:** jsPDF (PDF generation)

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components (Buttons, Cards, Modals, Tables)
├── supabase/       # Supabase client initialization
├── hooks/          # Custom React hooks (useAuth, useSupabase)
├── pages/          # Application views (Dashboard, Employees, Payroll, etc.)
├── utils/          # Helper functions (Date formatting, RBAC, PDF generation)
└── App.jsx         # Main application routing and entry point
```

## ⚙️ Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase and Cloudinary credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## ☁️ Supabase Configuration

1. Create a Supabase project.
2. Configure **Authentication** (e.g., Email/Password or Google Provider).
3. Execute the `supabase_schema.sql` file in the SQL Editor to set up your PostgreSQL tables and schemas.
4. Manage roles within your database tables (e.g., assigning `admin`, `hr`, or `employee` roles to user records).

## ☁️ Cloudinary Configuration

1. Create a free Cloudinary account.
2. In your Cloudinary settings, create an **unsigned** upload preset.
3. Add the Cloud name and Preset name to your `.env` file to enable profile picture and document uploads.

## 📦 Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Lints the codebase.
- `vercel deploy`: Deploys the application to Vercel (or via Vercel GitHub integration).

## 🔒 Security & Access

- The application uses Supabase Authentication.
- Access to modules is strictly controlled based on the user's role retrieved from the Supabase database.
- Employees can only view and interact with their own data unless explicitly granted HR or Admin privileges.
