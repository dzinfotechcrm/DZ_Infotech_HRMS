import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function MeetingCompletedModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    attendedBy: '',
    meetingNotes: '',
    servicesDiscussed: '',
    interestedServices: '',
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
        interestedServices: '',
        quotationEstimate: '',
        negotiatedAmount: '',
        nextFollowUp: '',
        interestLevel: 'Interested'
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Interested Services *</label>
          <textarea
            required
            rows="2"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.interestedServices}
            onChange={(e) => setFormData({ ...formData, interestedServices: e.target.value })}
            placeholder="What services are they most likely to buy?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input 
            label="Quotation Estimate (₹) *" 
            type="number"
            min="0"
            required 
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
