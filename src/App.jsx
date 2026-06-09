import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import { PERMISSIONS, ROLES } from './utils/rbac';

const Login = lazy(() => import('./pages/auth/Login'));
const AccessDenied = lazy(() => import('./pages/auth/AccessDenied'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/employees/EmployeeForm'));
const EmployeeProfile = lazy(() => import('./pages/employees/EmployeeProfile'));
const DepartmentList = lazy(() => import('./pages/departments/DepartmentList'));
const DepartmentForm = lazy(() => import('./pages/departments/DepartmentForm'));
const AttendanceList = lazy(() => import('./pages/attendance/AttendanceList'));
const AttendanceMark = lazy(() => import('./pages/attendance/AttendanceMark'));
const LeaveList = lazy(() => import('./pages/leave/LeaveList'));
const LeaveForm = lazy(() => import('./pages/leave/LeaveForm'));
const LeaveApproval = lazy(() => import('./pages/leave/LeaveApproval'));
const PayrollList = lazy(() => import('./pages/payroll/PayrollList'));
const Payslip = lazy(() => import('./pages/payroll/Payslip'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Settings = lazy(() => import('./pages/settings/Settings'));

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<ProtectedRoute allowedRoles={PERMISSIONS.employees}><EmployeeList /></ProtectedRoute>} />
          <Route path="employees/new" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr]}><EmployeeForm mode="create" /></ProtectedRoute>} />
          <Route path="employees/:id/edit" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr]}><EmployeeForm mode="edit" /></ProtectedRoute>} />
          <Route path="employees/:id" element={<ProtectedRoute allowedRoles={PERMISSIONS.employees}><EmployeeProfile /></ProtectedRoute>} />
          <Route path="departments" element={<ProtectedRoute allowedRoles={PERMISSIONS.departments}><DepartmentList /></ProtectedRoute>} />
          <Route path="departments/new" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><DepartmentForm mode="create" /></ProtectedRoute>} />
          <Route path="departments/:id/edit" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><DepartmentForm mode="edit" /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute allowedRoles={PERMISSIONS.attendance}><AttendanceList /></ProtectedRoute>} />
          <Route path="attendance/mark" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr]}><AttendanceMark /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute allowedRoles={PERMISSIONS.leave}><LeaveList /></ProtectedRoute>} />
          <Route path="leave/new" element={<ProtectedRoute allowedRoles={PERMISSIONS.leave}><LeaveForm mode="create" /></ProtectedRoute>} />
          <Route path="leave/:id/edit" element={<ProtectedRoute allowedRoles={PERMISSIONS.leave}><LeaveForm mode="edit" /></ProtectedRoute>} />
          <Route path="leave/approval" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr, ROLES.manager]}><LeaveApproval /></ProtectedRoute>} />
          <Route path="payroll" element={<ProtectedRoute allowedRoles={PERMISSIONS.payroll}><PayrollList /></ProtectedRoute>} />
          <Route path="payroll/payslip/:id" element={<ProtectedRoute allowedRoles={PERMISSIONS.payroll}><Payslip /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute allowedRoles={PERMISSIONS.profile}><Profile /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={PERMISSIONS.settings}><Settings /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
