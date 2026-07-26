import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const STATUSES = [
  'Active',
  'Onboarding',
  'Inactive',
  'Churned'
];

const INITIAL_STATE = {
  clientId: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  industry: '',
  projects: 0,
  ltv: 0,
  owner: '',
  status: 'Active',
  since: new Date().toISOString().split('T')[0],
  notes: ''
};

export default function ClientFormModal({ client, clients = [], employees, open, onClose, onSave }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      let maxId = 0;
      clients.forEach(c => {
        if (c.clientId && c.clientId.startsWith('CL-')) {
          const num = parseInt(c.clientId.replace('CL-', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
      });
      const nextId = `CL-${String(maxId + 1).padStart(4, '0')}`;

      setFormData({
        ...INITIAL_STATE,
        clientId: nextId,
        status: 'Active' // Default when manually adding
      });
    }
    setErrors({});
  }, [client, open, clients]);

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    const required = ['companyName', 'contactPerson', 'status'];
    required.forEach((k) => {
      if (!formData[k] || String(formData[k]).trim() === '') {
        newErrors[k] = 'This field is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        projects: parseInt(formData.projects) || 0,
        ltv: parseFloat(formData.ltv) || 0,
      };

      // Strip virtual fields added by the data mapper
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.employeeId;
      delete payload.departmentId;
      delete payload.firstName;
      delete payload.lastName;

      await onSave(payload);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title={client ? "Edit Client" : "Add New Client"} onClose={onClose} size="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8 h-[65vh] overflow-y-auto px-2 pb-4 text-slate-900">

        {/* Basic Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Client Information</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Client ID" value={formData.clientId} disabled />
            <Input label="Company Name *" error={errors.companyName} value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
            <Input label="Contact Person *" error={errors.contactPerson} value={formData.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} />
            <Input label="Phone" error={errors.phone} value={formData.phone} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <Input label="Email" type="email" error={errors.email} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
            <Input label="Industry" value={formData.industry} onChange={(e) => handleChange('industry', e.target.value)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Input label="Address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Account Details</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="Status *" error={errors.status} value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Account Owner" value={formData.owner} onChange={(e) => handleChange('owner', e.target.value)}>
              <option value="">Unassigned</option>
              {employees?.map(emp => (
                <option key={emp.id} value={emp.uid || emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </Select>
            <Input label="Client Since" type="date" value={formData.since} onChange={(e) => handleChange('since', e.target.value)} />
            <Input label="Projects" type="number" min="0" value={formData.projects} onChange={(e) => handleChange('projects', e.target.value)} />
            <Input label="Lifetime Value (LTV ₹)" type="number" min="0" value={formData.ltv} onChange={(e) => handleChange('ltv', e.target.value)} />
            <div className="sm:col-span-2 lg:col-span-3 mt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                rows="3"
                className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-4 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving} type="button">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
