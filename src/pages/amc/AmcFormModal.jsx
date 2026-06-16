import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const STATUSES = ['Active', 'Expired', 'Cancelled', 'Pending Renewal'];

export default function AmcFormModal({ open, amc, clients, projects, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    annualValue: '',
    startDate: '',
    renewalDate: '',
    status: 'Active',
    notes: '',
    reminders: [60, 30, 15, 7]
  });

  const [errors, setErrors] = useState({});

  // Filter projects by selected client
  const clientProjects = formData.clientId
    ? projects.filter(p => p.clientId === formData.clientId)
    : projects;

  useEffect(() => {
    if (amc) {
      setFormData({
        ...amc,
        reminders: amc.reminders || [60, 30, 15, 7]
      });
    } else {
      setFormData({
        clientId: '',
        projectId: '',
        annualValue: '',
        startDate: '',
        renewalDate: '',
        status: 'Active',
        notes: '',
        reminders: [60, 30, 15, 7]
      });
    }
    setErrors({});
  }, [amc, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // If client changes, reset project if it doesn't belong to new client
      if (name === 'clientId') {
        const p = projects.find(proj => proj.id === next.projectId);
        if (p && p.clientId !== value) {
          next.projectId = '';
        }
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
      isValid = false;
    }
    if (!formData.renewalDate) {
      newErrors.renewalDate = 'Renewal Date is required';
      isValid = false;
    }

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
        annualValue: parseFloat(formData.annualValue) || 0,
      };

      // Strip virtual fields if editing
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.reminders; // Avoid DB crash since column doesn't exist yet

      await onSave(payload);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save AMC');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title={amc ? "Edit AMC" : "New AMC"} onClose={onClose} size="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 text-slate-900 px-2 pb-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableSelect
            label="Client *"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            options={clients.map(c => ({ value: c.id, label: c.companyName }))}
            error={errors.clientId}
          />
          <Select
            label="Project"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {clientProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Input
            label="Annual Value (₹)"
            type="number"
            name="annualValue"
            value={formData.annualValue}
            onChange={handleChange}
          />
          <Select
            label="Status *"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
          />
          <Input
            label="Renewal Date *"
            type="date"
            name="renewalDate"
            value={formData.renewalDate}
            onChange={handleChange}
            error={errors.renewalDate}
          />
        </div>

        {/* Reminders */}
        <div className="flex flex-col gap-3 pt-2">
          <label className="text-sm font-medium text-slate-700">Reminders (Before renewal)</label>
          <div className="flex flex-wrap gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {[60, 30, 15, 7].map(days => (
              <label key={days} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  checked={formData.reminders?.includes(days) || false}
                  onChange={(e) => {
                    const newReminders = e.target.checked
                      ? [...(formData.reminders || []), days]
                      : (formData.reminders || []).filter(d => d !== days);
                    setFormData(prev => ({ ...prev, reminders: newReminders }));
                  }}
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{days} Days</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-200 mt-8">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} isLoading={saving}>
            {saving ? 'Saving...' : (amc ? 'Save Changes' : 'Create AMC')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
