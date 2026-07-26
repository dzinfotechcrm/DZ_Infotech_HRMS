import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const SERVICES_LIST = [
  'Static Website', 'Dynamic Website', 'Ecommerce Website',
  'CRM', 'ERP', 'AI Chatbot', 'AI Automation', 'Whatsapp API'
];

export default function MeetingCompletedModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    attendedBy: '',
    meetingNotes: '',
    servicesDiscussed: '',
    interestedServices: [],
    quotationEstimate: '',
    negotiatedAmount: '',
    nextFollowUp: '',
    interestLevel: 'Interested'
  });

  useEffect(() => {
    if (open) {
      setFormData({
        attendedBy: '',
        meetingNotes: '',
        servicesDiscussed: '',
        interestedServices: [],
        quotationEstimate: '',
        negotiatedAmount: '',
        nextFollowUp: '',
        interestLevel: 'Interested'
      });
    }
  }, [open]);

  const handleToggleInterestedService = (service) => {
    const currentServices = Array.isArray(formData.interestedServices) ? formData.interestedServices : [];
    if (currentServices.includes(service)) {
      setFormData({ ...formData, interestedServices: currentServices.filter(s => s !== service) });
    } else {
      setFormData({ ...formData, interestedServices: [...currentServices, service] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.interestedServices || formData.interestedServices.length === 0) {
      alert("Please select at least one interested service.");
      return;
    }
    onSubmit({
      ...formData,
      quotationEstimate: formData.quotationEstimate ? Number(formData.quotationEstimate) : null,
      negotiatedAmount: formData.negotiatedAmount ? Number(formData.negotiatedAmount) : null
    });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Meeting Completed Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before moving them to Meeting Completed.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 h-[65vh] overflow-y-auto px-1">
        <Input
          label="Who Attended? *"
          required
          value={formData.attendedBy}
          onChange={(e) => setFormData({ ...formData, attendedBy: e.target.value })}
          placeholder="e.g. John Doe, Jane Smith"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Notes *</label>
          <textarea
            required
            rows="3"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.meetingNotes}
            onChange={(e) => setFormData({ ...formData, meetingNotes: e.target.value })}
            placeholder="Summary of what was discussed..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Services Discussed *</label>
          <textarea
            required
            rows="2"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.servicesDiscussed}
            onChange={(e) => setFormData({ ...formData, servicesDiscussed: e.target.value })}
            placeholder="e.g. SEO, Web Development"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Interested Services *</label>
          <div className="flex flex-wrap gap-2">
            {SERVICES_LIST.map(service => {
              const currentServices = Array.isArray(formData.interestedServices) ? formData.interestedServices : [];
              const isSelected = currentServices.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => handleToggleInterestedService(service)}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Quotation Estimate (₹)"
            type="number"
            min="0"
            value={formData.quotationEstimate}
            onChange={(e) => setFormData({ ...formData, quotationEstimate: e.target.value })}
            placeholder="e.g. 50000"
          />
          <Input
            label="Negotiated Amount (₹)"
            type="number"
            min="0"
            value={formData.negotiatedAmount}
            onChange={(e) => setFormData({ ...formData, negotiatedAmount: e.target.value })}
            placeholder="e.g. 45000"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Next Follow-Up Date *"
            type="date"
            required
            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
            value={formData.nextFollowUp}
            onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
          />
          <Select
            label="Interest Level *"
            required
            value={formData.interestLevel}
            onChange={(e) => setFormData({ ...formData, interestLevel: e.target.value })}
          >
            <option value="Very Interested">Very Interested</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit">Submit & Update</Button>
        </div>
      </form>
    </Modal>
  );
}
