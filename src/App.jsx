import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import { PERMISSIONS, ROLES } from './utils/rbac';
import { useAuth } from './hooks/useAuth';

const Login = lazy(() => import('./pages/auth/Login'));
const AccessDenied = lazy(() => import('./pages/auth/AccessDenied'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/employees/EmployeeForm'));
const EmployeeProfile = lazy(() => import('./pages/employees/EmployeeProfile'));
const DepartmentList = lazy(() => import('./pages/departments/DepartmentList'));
const DepartmentForm = lazy(() => import('./pages/departments/DepartmentForm'));
const AttendanceList = lazy(() => import('./pages/attendance/AttendanceList'));
const LeaveList = lazy(() => import('./pages/leave/LeaveList'));
const LeaveForm = lazy(() => import('./pages/leave/LeaveForm'));
const LeaveApproval = lazy(() => import('./pages/leave/LeaveApproval'));
const PayrollList = lazy(() => import('./pages/payroll/PayrollList'));
const Payslip = lazy(() => import('./pages/payroll/Payslip'));
const Profile = lazy(() => import('./pages/profile/Profile'));

const Activities = lazy(() => import('./pages/activities/Activities'));
const LeadsPipeline = lazy(() => import('./pages/leads/LeadsPipeline'));
const ClientsList = lazy(() => import('./pages/clients/ClientsList'));
const ProjectsList = lazy(() => import('./pages/projects/ProjectsList'));
const AmcList = lazy(() => import('./pages/amc/AmcList'));
const Finance = lazy(() => import('./pages/revenue/Finance'));
const BucketSettings = lazy(() => import('./pages/revenue/BucketSettings'));
const Expense = lazy(() => import('./pages/revenue/Expense'));

// SFMS Routes
const SfmsDashboard = lazy(() => import('./pages/sfms/Dashboard'));
const SfmsTeams = lazy(() => import('./pages/sfms/Teams'));
const SfmsAgents = lazy(() => import('./pages/sfms/Agents'));
const SfmsAgentProfile = lazy(() => import('./pages/sfms/AgentProfile'));
const SfmsLeads = lazy(() => import('./pages/sfms/Leads'));
const SfmsLeadProfile = lazy(() => import('./pages/sfms/LeadProfile'));
const SfmsMeetings = lazy(() => import('./pages/sfms/Meetings'));
const SfmsTargets = lazy(() => import('./pages/sfms/Targets'));
const SfmsCommissions = lazy(() => import('./pages/sfms/Commissions'));
const SfmsFinance = lazy(() => import('./pages/sfms/Finance'));
const SfmsReports = lazy(() => import('./pages/sfms/Reports'));

// Agent Portal Routes
const AgentMyDay = lazy(() => import('./pages/sfms/agent/MyDay'));
const AgentMyLeads = lazy(() => import('./pages/sfms/agent/MyLeads'));
const AgentMeetings = lazy(() => import('./pages/sfms/agent/Meetings'));
const AgentDailyReport = lazy(() => import('./pages/sfms/agent/DailyReport'));
const AgentMyCommissions = lazy(() => import('./pages/sfms/agent/MyCommissions'));

function RootRedirect() {
  const { user } = useAuth();
  if (user?.role === 'agent') return <Navigate to="/my-day" replace />;
  return <Navigate to="/dashboard" replace />;
}

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
          <Route index element={<RootRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<ProtectedRoute allowedRoles={PERMISSIONS.employees}><EmployeeList /></ProtectedRoute>} />
          <Route path="employees/new" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr]}><EmployeeForm mode="create" /></ProtectedRoute>} />
          <Route path="employees/:id/edit" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr]}><EmployeeForm mode="edit" /></ProtectedRoute>} />
          <Route path="employees/:id" element={<ProtectedRoute allowedRoles={PERMISSIONS.employees}><EmployeeProfile /></ProtectedRoute>} />
          <Route path="departments" element={<ProtectedRoute allowedRoles={PERMISSIONS.departments}><DepartmentList /></ProtectedRoute>} />
          <Route path="departments/new" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><DepartmentForm mode="create" /></ProtectedRoute>} />
          <Route path="departments/:id/edit" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><DepartmentForm mode="edit" /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute allowedRoles={PERMISSIONS.attendance}><AttendanceList /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute allowedRoles={PERMISSIONS.leave}><LeaveList /></ProtectedRoute>} />
          <Route path="leave/new" element={<ProtectedRoute allowedRoles={PERMISSIONS.leave}><LeaveForm mode="create" /></ProtectedRoute>} />
          <Route path="leave/:id/edit" element={<ProtectedRoute allowedRoles={PERMISSIONS.leave}><LeaveForm mode="edit" /></ProtectedRoute>} />
          <Route path="leave/approval" element={<ProtectedRoute allowedRoles={[ROLES.admin, ROLES.hr, ROLES.manager]}><LeaveApproval /></ProtectedRoute>} />
          <Route path="payroll" element={<ProtectedRoute allowedRoles={PERMISSIONS.payroll}><PayrollList /></ProtectedRoute>} />
          <Route path="payroll/payslip/:id" element={<ProtectedRoute allowedRoles={PERMISSIONS.payroll}><Payslip /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute allowedRoles={PERMISSIONS.profile}><Profile /></ProtectedRoute>} />

          <Route path="activities" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><Activities /></ProtectedRoute>} />
          <Route path="leads" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><LeadsPipeline /></ProtectedRoute>} />
          <Route path="clients" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><ClientsList /></ProtectedRoute>} />
          <Route path="projects" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><ProjectsList /></ProtectedRoute>} />
          <Route path="amc" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><AmcList /></ProtectedRoute>} />
          <Route path="finance" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><Finance /></ProtectedRoute>} />
          <Route path="expense" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><Expense /></ProtectedRoute>} />
          <Route path="bucket-settings" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><BucketSettings /></ProtectedRoute>} />

          <Route path="sfms/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsDashboard /></ProtectedRoute>} />
          <Route path="sfms/teams" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsTeams /></ProtectedRoute>} />
          <Route path="sfms/agents" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsAgents /></ProtectedRoute>} />
          <Route path="sfms/agents/:id" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsAgentProfile /></ProtectedRoute>} />
          <Route path="sfms/leads" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsLeads /></ProtectedRoute>} />
          <Route path="sfms/leads/:id" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsLeadProfile /></ProtectedRoute>} />
          <Route path="sfms/meetings" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsMeetings /></ProtectedRoute>} />
          <Route path="sfms/targets" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsTargets /></ProtectedRoute>} />
          <Route path="sfms/commissions" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsCommissions /></ProtectedRoute>} />
          <Route path="sfms/finance" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsFinance /></ProtectedRoute>} />
          <Route path="sfms/reports" element={<ProtectedRoute allowedRoles={[ROLES.admin]}><SfmsReports /></ProtectedRoute>} />

          {/* Agent Routes */}
          <Route path="my-day" element={<ProtectedRoute allowedRoles={PERMISSIONS.sfmsAgent}><AgentMyDay /></ProtectedRoute>} />
          <Route path="my-leads" element={<ProtectedRoute allowedRoles={PERMISSIONS.sfmsAgent}><AgentMyLeads /></ProtectedRoute>} />
          <Route path="my-leads/:id" element={<ProtectedRoute allowedRoles={PERMISSIONS.sfmsAgent}><SfmsLeadProfile isAgent={true} /></ProtectedRoute>} />
          <Route path="my-meetings" element={<ProtectedRoute allowedRoles={PERMISSIONS.sfmsAgent}><AgentMeetings /></ProtectedRoute>} />
          <Route path="daily-report" element={<ProtectedRoute allowedRoles={PERMISSIONS.sfmsAgent}><AgentDailyReport /></ProtectedRoute>} />
          <Route path="my-commissions" element={<ProtectedRoute allowedRoles={PERMISSIONS.sfmsAgent}><AgentMyCommissions /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}
