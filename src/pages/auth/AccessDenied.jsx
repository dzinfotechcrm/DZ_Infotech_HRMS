import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

export default function AccessDenied() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnToLogin = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-100 text-2xl font-black text-danger-600">
          !
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Access Denied</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Your Google account is authenticated, but your profile is either not registered with an approved role or has been marked as inactive. Contact an administrator to regain access.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={handleReturnToLogin}>Return to Login</Button>
        </div>
      </Card>
    </div>
  );
}
