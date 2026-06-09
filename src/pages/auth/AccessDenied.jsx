import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-100 text-2xl font-black text-danger-600">
          !
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Access Denied</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Your Google account is authenticated, but it is not registered with an approved HRMS role in Firestore. Contact an administrator to be added to the <span className="font-semibold">users</span> collection.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login">
            <Button>Return to Login</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
