import { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { query, where } from '../../supabase/db';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/dateHelpers';

export default function ActiveLicenses() {
  const { user } = useAuth();
  
  // First, find the current employee ID based on user.uid
  const employeeQuery = useMemo(() => (base) => query(base, where('uid', '==', user?.uid)), [user?.uid]);
  const { items: employees } = useSupabaseCollection('employees', employeeQuery);
  const { items: interns } = useSupabaseCollection('interns');

  const employeeRecord = employees[0];
  const internRecord = interns.find(i => i.uid === user?.uid || i.email === user?.email || i.login_email === user?.email);
  const currentPerson = employeeRecord || internRecord;

  // Then fetch licenses for that employee ID
  const licensesQuery = useMemo(() => {
    if (!currentPerson?.id) return (base) => query(base, where('assigned_to', '==', 'INVALID'));
    return (base) => query(base, where('assigned_to', '==', currentPerson.id), where('status', '==', 'active'));
  }, [currentPerson?.id]);
  
  const { items: licenses, loading } = useSupabaseCollection('software_licenses', licensesQuery);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading licenses...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Active Licenses" 
        description="View the software licenses and cloud assets provided to you by the company."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Software Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Provider/Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes / Instructions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {licenses.map(license => (
                <tr key={license.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{license.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {license.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(license.assigned_date, 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs whitespace-pre-wrap">
                    {license.notes || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Badge tone="success">Active</Badge>
                  </td>
                </tr>
              ))}
              {licenses.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                    You currently have no active software licenses assigned to you.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
