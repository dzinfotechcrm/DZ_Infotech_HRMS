import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const SERVICES_LIST = [
  'Static Website', 'Dynamic Website', 'Ecommerce Website', 
  'CRM', 'ERP', 'AI Chatbot', 'AI Automation', 'Whatsapp API'
];

export default function ContactedDetailsModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    basicRequirements: '',
    businessDetails: '',
    serviceRequired: [],
    budget: '',
    timeline: '',
    nextFollowUp: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        basicRequirements: '',
        businessDetails: '',
        serviceRequired: [],
        budget: '',
        timeline: '',
        nextFollowUp: ''
      });
    }
  }, [open]);

  const handleToggleService = (service) => {
    setFormData(prev => {
      const current = Array.isArray(prev.serviceRequired) ? prev.serviceRequired : [];
      if (current.includes(service)) {
        return { ...prev, serviceRequired: current.filter(s => s !== service) };
      }
      return { ...prev, serviceRequired: [...current, service] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      serviceRequired: Array.isArray(formData.serviceRequired) ? formData.serviceRequired.join(', ') : formData.serviceRequired,
      budget: formData.budget ? Number(formData.budget) : null
    });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Additional Details Required">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before moving them to Contacted.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Basic Requirements</label>
          <textarea
            rows="2"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.basicRequirements}
            onChange={(e) => setFormData({ ...formData, basicRequirements: e.target.value })}
            placeholder="What does the client need?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Business Details</label>
          <textarea
            rows="2"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.businessDetails}
            onChange={(e) => setFormData({ ...formData, businessDetails: e.target.value })}
            placeholder="Information about their business"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Service Required</label>
          <div className="flex flex-wrap gap-2">
            {SERVICES_LIST.map(service => {
              const currentServices = Array.isArray(formData.serviceRequired) ? formData.serviceRequired : [];
              const isSelected = currentServices.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => handleToggleService(service)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${isSelected
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </div>
        <Input
          label="Budget"
          type="number"
          min="0"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          placeholder="Expected budget"
        />
        <Input
          label="Timeline (in days)"
          type="number"
          min="1"
          value={formData.timeline}
          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
          placeholder="e.g. 30"
        />
        <Input
          label="Next Follow-Up Date *"
          type="date"
          required
          min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
          value={formData.nextFollowUp}
          onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit">Submit & Update</Button>
        </div>
      </form>
    </Modal>
  );
}
