import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const PROJECT_TYPES = [
  'Road',
  'Bridge',
  'canal',
  'PVT Building',
  'GOV Building'
];

const STAGES = [
  'New Lead',
  'Demo Scheduled',
  'Demo Completed',
  'Trial',
  'Negotiation',
  'Customer',
  'Lost'
];

export default function ConTrackLeadFormModal({ open, lead, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    contractorName: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    projectType: [],
    status: 'New Lead',
    expectedValue: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        projectType: typeof lead.projectType === 'string' && lead.projectType.length > 0
          ? lead.projectType.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(lead.projectType) ? lead.projectType : [])
      });
    } else {
      setFormData({
        contractorName: '',
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        city: '',
        state: '',
        projectType: [],
        status: 'New Lead',
        expectedValue: ''
      });
    }
    setErrors({});
  }, [lead, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const numericValue = value.replace(/[^\d]/g, '');
      if (numericValue.length > 10) return;
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.contractorName?.trim()) {
      newErrors.contractorName = 'Contractor Name is required';
      isValid = false;
    }
    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Company Name is required';
      isValid = false;
    }
    if (!formData.contactPerson?.trim()) {
      newErrors.contactPerson = 'Contact Person is required';
      isValid = false;
    }
    if (!formData.projectType || formData.projectType.length === 0) {
      newErrors.projectType = 'Project Type is required';
      isValid = false;
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      isValid = false;
    }
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
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
        expectedValue: parseFloat(formData.expectedValue) || 0,
        projectType: Array.isArray(formData.projectType) ? formData.projectType.join(', ') : formData.projectType
      };

      // Strip virtual fields if editing
      delete payload.createdAt;
      delete payload.updatedAt;

      await onSave(payload);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title={lead ? "Edit ConTrack Lead" : "New ConTrack Lead"} onClose={onClose} size="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6 text-slate-900 px-2 pb-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contractor Name *"
            name="contractorName"
            value={formData.contractorName}
            onChange={handleChange}
            error={errors.contractorName}
          />
          <Input
            label="Company Name *"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            error={errors.companyName}
          />
          <Input
            label="Contact Person *"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            error={errors.contactPerson}
          />
          <Input
            label="Phone *"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-neutral-700">Project Type *</label>
            <div className={`flex flex-wrap gap-4 bg-white p-3 rounded-xl border ${errors.projectType ? 'border-danger-600 ring-1 ring-danger-100' : 'border-neutral-200'}`}>
              {PROJECT_TYPES.map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={formData.projectType?.includes(type) || false}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...(formData.projectType || []), type]
                        : (formData.projectType || []).filter(t => t !== type);
                      setFormData(prev => ({ ...prev, projectType: newTypes }));
                      if (errors.projectType) {
                        setErrors(prev => ({ ...prev, projectType: null }));
                      }
                    }}
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">{type}</span>
                </label>
              ))}
            </div>
            {errors.projectType && <span className="text-xs font-medium text-danger-600">{errors.projectType}</span>}
          </div>
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
          <Input
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
          <Select
            label="Current Stage *"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            {STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input
            label="Expected Value (₹)"
            type="number"
            name="expectedValue"
            value={formData.expectedValue}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-200 mt-8">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} isLoading={saving}>
            {saving ? 'Saving...' : (lead ? 'Save Changes' : 'Create Lead')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
