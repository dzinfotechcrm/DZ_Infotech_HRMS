import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const STAGES = [
  'New Lead',
  'Contacted',
  'Demo Scheduled',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const INITIAL_STATE = {
  leadId: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  industry: '',
  serviceInterested: '',
  expectedValue: '',
  leadSource: 'Website',
  assignedTo: '',
  stage: 'New Lead',
  nextFollowUp: '',
  probability: '',
  notes: ''
};

export default function LeadFormModal({ lead, leads = [], employees, open, onClose, onSave }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    } else {
      let maxId = 0;
      leads.forEach(l => {
        if (l.leadId && l.leadId.startsWith('LD-')) {
          const num = parseInt(l.leadId.replace('LD-', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
      });
      const nextId = `LD-${String(maxId + 1).padStart(4, '0')}`;

      setFormData({
        ...INITIAL_STATE,
        leadId: nextId
      });
    }
    setErrors({});
  }, [lead, open, leads]);

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    const required = ['companyName', 'contactPerson', 'phone', 'stage'];
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
      await onSave({
        ...formData,
        expectedValue: parseFloat(formData.expectedValue) || 0,
        probability: parseInt(formData.probability) || 0,
      });
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title={lead ? "Edit Lead" : "Add New Lead"} onClose={onClose} size="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8 h-[65vh] overflow-y-auto px-2 pb-4 text-slate-900">
        
        {/* Basic Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Basic Information</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Lead ID" value={formData.leadId} disabled />
            <Input label="Company Name *" error={errors.companyName} value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
            <Input label="Contact Person *" error={errors.contactPerson} value={formData.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} />
            <Input label="Phone *" error={errors.phone} value={formData.phone} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <Input label="WhatsApp" value={formData.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Input label="Address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Business Details</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Industry" value={formData.industry} onChange={(e) => handleChange('industry', e.target.value)} />
            <Input label="Service Interested" value={formData.serviceInterested} onChange={(e) => handleChange('serviceInterested', e.target.value)} />
            <Input label="Expected Project Value (₹)" type="number" min="0" value={formData.expectedValue} onChange={(e) => handleChange('expectedValue', e.target.value)} />
            <Select label="Lead Source" value={formData.leadSource} onChange={(e) => handleChange('leadSource', e.target.value)}>
              {['Website', 'LinkedIn', 'Referral', 'Cold Outreach', 'Ads', 'Inbound', 'Outbound', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>

        {/* Sales Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Sales Pipeline Info</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="Current Stage *" error={errors.stage} value={formData.stage} onChange={(e) => handleChange('stage', e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Assigned To" value={formData.assignedTo} onChange={(e) => handleChange('assignedTo', e.target.value)}>
              <option value="">Unassigned</option>
              {employees?.map(emp => (
                <option key={emp.id} value={emp.uid || emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </Select>
            <Input 
              label="Next Follow-Up Date" 
              type="date" 
              min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]} 
              value={formData.nextFollowUp} 
              onChange={(e) => handleChange('nextFollowUp', e.target.value)} 
            />
            <Input label="Probability (%)" type="number" min="0" max="100" value={formData.probability} onChange={(e) => handleChange('probability', e.target.value)} />
            <div className="sm:col-span-2 lg:col-span-3 mt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                rows="3"
                className="block w-full rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-primary-500"
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
            {saving ? 'Saving...' : 'Save Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
