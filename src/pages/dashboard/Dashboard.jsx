import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import AnnouncementsBanner from '../../components/dashboard/AnnouncementsBanner';

export default function Dashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    if (user?.role === 'admin' || user?.role === 'hr') {
      return <AdminDashboard />;
    }
    if (user?.role === 'manager') {
      return <ManagerDashboard />;
    }
    return <EmployeeDashboard />;
  };

  return (
    <>
      <AnnouncementsBanner />
      {renderDashboard()}
    </>
  );
}