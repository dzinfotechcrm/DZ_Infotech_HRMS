import { useState, useMemo } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, removeDocument, updateDocument, createNotification } from '../../supabase/db';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function SoftwareLicenses() {
  const { items: licenses, loading: licensesLoading } = useSupabaseCollection('software_licenses');
  const { items: employees, loading: employeesLoading } = useSupabaseCollection('employees');
  const { items: interns, loading: internsLoading } = useSupabaseCollection('interns');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    cost_per_month: '',
    assigned_to: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingLicenseId, setEditingLicenseId] = useState(null);

  const totalMonthlyCost = useMemo(() => {
    return licenses.reduce((sum, license) => sum + (Number(license.cost_per_month) || 0), 0);
  }, [licenses]);

  const activeLicenses = useMemo(() => {
    return licenses.filter(l => l.status === 'active').length;
  }, [licenses]);

  const assignableUsers = useMemo(() => {
    const allUsers = [...employees, ...interns.map(i => ({...i, role: 'intern'}))];
    return allUsers.filter(u => u.role !== 'admin');
  }, [employees, interns]);

  const handleOpenModal = () => {
    setEditingLicenseId(null);
    setFormData({ name: '', provider: '', cost_per_month: '', assigned_to: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleRowClick = (license) => {
    setEditingLicenseId(license.id);
    setFormData({
      name: license.name,
      provider: license.provider || '',
      cost_per_month: license.cost_per_month || '',
      assigned_to: license.assigned_to || '',
      notes: license.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.provider || !formData.assigned_to) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingLicenseId) {
        const existingLicense = licenses.find(l => l.id === editingLicenseId);
        if (existingLicense && existingLicense.assigned_to !== formData.assigned_to) {
          await createNotification(formData.assigned_to, 'License Assigned', `You have been assigned a software license: ${formData.name}`);
        }
        await updateDocument('software_licenses', editingLicenseId, {
          name: formData.name,
          provider: formData.provider,
          cost_per_month: Number(formData.cost_per_month) || 0,
          assigned_to: formData.assigned_to,
          notes: formData.notes
        });
        toast.success('Software license updated successfully');
      } else {
        await createNotification(formData.assigned_to, 'License Assigned', `You have been assigned a software license: ${formData.name}`);
        await createDocument('software_licenses', {
          name: formData.name,
          provider: formData.provider,
          cost_per_month: Number(formData.cost_per_month) || 0,
          assigned_to: formData.assigned_to,
          status: 'active',
          assigned_date: new Date().toISOString().split('T')[0],
          notes: formData.notes
        });
        toast.success('Software license assigned successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign license');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = (id) => {
    setConfirmAction({ type: 'revoke', id });
  };

  const handleDelete = (id) => {
    setConfirmAction({ type: 'delete', id });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'revoke') {
      try {
        const licenseToRevoke = licenses.find(l => l.id === confirmAction.id);
        if (licenseToRevoke && licenseToRevoke.assigned_to) {
          await createNotification(
            licenseToRevoke.assigned_to, 
            'License Revoked', 
            `Your software license has been revoked: ${licenseToRevoke.name}`
          );
        }
        await updateDocument('software_licenses', confirmAction.id, { status: 'revoked' });
        toast.success('License revoked successfully');
      } catch (error) {
        toast.error('Failed to revoke license');
      }
    } else if (confirmAction.type === 'delete') {
      try {
        await removeDocument('software_licenses', confirmAction.id);
        toast.success('License record deleted');
      } catch (error) {
        toast.error('Failed to delete license record');
      }
    }
    setConfirmAction(null);
  };

  if (licensesLoading || employeesLoading || internsLoading) {
    return <div className="p-8 text-center text-slate-500">Loading licenses...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Software Licenses" 
        description="Manage cloud assets, software subscriptions, and tracking costs per employee"
        actions={
          <Button onClick={handleOpenModal} className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Assign New License
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-primary-50 border-primary-100">
          <div className="text-sm font-semibold text-primary-600 mb-1">Total Monthly Cost</div>
          <div className="text-3xl font-black text-primary-900">₹{totalMonthlyCost.toLocaleString('en-IN')}</div>
        </Card>
        <Card className="p-6 bg-accent-50 border-accent-100">
          <div className="text-sm font-semibold text-accent-700 mb-1">Active Licenses</div>
          <div className="text-3xl font-black text-accent-900">{activeLicenses}</div>
        </Card>
        <Card className="p-6 bg-slate-50 border-slate-200">
          <div className="text-sm font-semibold text-slate-600 mb-1">Employees with Licenses</div>
          <div className="text-3xl font-black text-slate-900">
            {new Set(licenses.map(l => l.assigned_to).filter(Boolean)).size}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Software</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cost/Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {licenses.map(license => {
                const emp = employees.find(e => e.id === license.assigned_to) || interns.find(i => i.id === license.assigned_to);
                return (
                  <tr key={license.id} onClick={() => handleRowClick(license)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{license.name}</div>
                      <div className="text-xs text-slate-500">{license.provider}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emp ? (
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-slate-900">{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      ₹{(Number(license.cost_per_month) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(license.assigned_date, 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={license.status === 'active' ? 'success' : 'neutral'}>
                        {license.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {license.status === 'active' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRevoke(license.id); }}
                          className="text-amber-600 hover:text-amber-900 mr-4"
                        >
                          Revoke
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(license.id); }}
                        className="text-rose-600 hover:text-rose-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {licenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    No software licenses tracked yet. Click "Assign New License" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingLicenseId ? "Edit Software License" : "Assign Software License"} overflowVisible={true}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Software Name" 
            placeholder="e.g. Zoom Premium, GitHub Copilot"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            required 
          />
          <Input 
            label="Provider/Vendor" 
            placeholder="e.g. Zoom, Microsoft, AWS"
            value={formData.provider}
            onChange={e => setFormData(p => ({ ...p, provider: e.target.value }))}
            required 
          />
          <Input 
            label="Monthly Cost (₹)" 
            type="number"
            placeholder="0"
            value={formData.cost_per_month}
            onChange={e => setFormData(p => ({ ...p, cost_per_month: e.target.value }))}
          />
          <Select 
            label="Assign To Employee"
            value={formData.assigned_to}
            onChange={e => setFormData(p => ({ ...p, assigned_to: e.target.value }))}
            required
          >
            <option value="" disabled>Select Employee</option>
            {assignableUsers.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName || emp.first_name} {emp.lastName || emp.last_name} ({emp.department || emp.role || 'No Dept'})
              </option>
            ))}
          </Select>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            <span>Notes (Optional)</span>
            <textarea
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="License key, login details, etc."
            />
          </label>
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingLicenseId ? 'Save Changes' : 'Assign License')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'revoke' ? 'Revoke License' : 'Delete License Record'}
        message={
          confirmAction?.type === 'revoke' 
            ? 'Are you sure you want to revoke this license? The record will be kept but marked as revoked.'
            : 'Are you sure you want to delete this record permanently? This action cannot be undone.'
        }
        confirmText={confirmAction?.type === 'revoke' ? 'Revoke' : 'Delete'}
        confirmVariant={confirmAction?.type === 'revoke' ? 'warning' : 'danger'}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
