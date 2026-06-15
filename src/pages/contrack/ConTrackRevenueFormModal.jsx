import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const PLANS = ['Basic', 'Professional', 'Enterprise', 'Custom'];
const STATUSES = ['Active', 'Expired', 'Churned'];

export default function ConTrackRevenueFormModal({ open, customer, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    plan: 'Basic',
    startDate: '',
    renewalDate: '',
    status: 'Active',
    monthlyRevenue: '',
    annualRevenue: '',
    lifetimeRevenue: '',
    healthScore: 100
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer
      });
    } else {
      setFormData({
        customerName: '',
        plan: 'Basic',
        startDate: '',
        renewalDate: '',
        status: 'Active',
        monthlyRevenue: '',
        annualRevenue: '',
        lifetimeRevenue: '',
        healthScore: 100
      });
    }
    setErrors({});
  }, [customer, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      // Auto-calculate annual from monthly if annual is empty or user is typing monthly
      if (name === 'monthlyRevenue') {
        const m = parseFloat(value) || 0;
        next.annualRevenue = (m * 12).toString();
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

    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer Name is required';
      isValid = false;
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start Date is required';
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
        monthlyRevenue: parseFloat(formData.monthlyRevenue) || 0,
        annualRevenue: parseFloat(formData.annualRevenue) || 0,
        lifetimeRevenue: parseFloat(formData.lifetimeRevenue) || 0,
        healthScore: parseInt(formData.healthScore) || 100,
      };

      // Strip virtual fields if editing
      delete payload.createdAt;
      delete payload.updatedAt;

      await onSave(payload);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title={customer ? "Edit SaaS Customer" : "New SaaS Customer"} onClose={onClose} size="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 text-slate-900 px-2 pb-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer Name *"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            error={errors.customerName}
          />
          <Select
            label="Plan *"
            name="plan"
            value={formData.plan}
            onChange={handleChange}
            options={PLANS.map(p => ({ value: p, label: p }))}
          />
          <Input
            label="Start Date *"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
          />
          <Input
            label="Renewal Date *"
            type="date"
            name="renewalDate"
            value={formData.renewalDate}
            onChange={handleChange}
            error={errors.renewalDate}
          />
          <Input
            label="Monthly Revenue (₹)"
            type="number"
            name="monthlyRevenue"
            value={formData.monthlyRevenue}
            onChange={handleChange}
          />
          <Input
            label="Annual Revenue (₹)"
            type="number"
            name="annualRevenue"
            value={formData.annualRevenue}
            onChange={handleChange}
          />
          <Input
            label="Lifetime Revenue (₹)"
            type="number"
            name="lifetimeRevenue"
            value={formData.lifetimeRevenue}
            onChange={handleChange}
          />
          <Select
            label="Status *"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={STATUSES.map(s => ({ value: s, label: s }))}
          />
          <Input
            label="Health Score (0-100)"
            type="number"
            min="0"
            max="100"
            name="healthScore"
            value={formData.healthScore}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-200 mt-8">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} isLoading={saving}>
            {saving ? 'Saving...' : (customer ? 'Save Changes' : 'Create Customer')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
