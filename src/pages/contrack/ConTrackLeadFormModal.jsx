import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const PROJECT_TYPES = [
  'Road',
  'Bridge',
  'Road + Bridge'
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
    projectType: 'Road',
    status: 'New Lead',
    expectedValue: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead
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
        projectType: 'Road',
        status: 'New Lead',
        expectedValue: ''
      });
    }
    setErrors({});
  }, [lead, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    if (!formData.projectType) {
      newErrors.projectType = 'Project Type is required';
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
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Select
            label="Project Type *"
            name="projectType"
            value={formData.projectType}
            onChange={handleChange}
            options={PROJECT_TYPES.map(s => ({ value: s, label: s }))}
            error={errors.projectType}
          />
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
            options={STAGES.map(s => ({ value: s, label: s }))}
          />
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
