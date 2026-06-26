import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function ProposalSentModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    quotation: '',
    proposalTimeline: '',
    amcIncluded: 'No',
    amcAmount: '',
    quotationAmount: '',
    nextFollowUp: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        quotation: '',
        proposalTimeline: '',
        amcIncluded: 'No',
        amcAmount: '',
        quotationAmount: '',
        nextFollowUp: ''
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Convert numeric fields
    if (payload.amcIncluded === 'Yes' && payload.amcAmount) {
      payload.amcAmount = Number(payload.amcAmount);
    } else {
      payload.amcAmount = null; // Clear if No
    }
    
    if (payload.quotationAmount) {
      payload.quotationAmount = Number(payload.quotationAmount);
    } else {
      payload.quotationAmount = null;
    }

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Proposal Sent Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before moving them to Proposal Sent.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quotation (Details/Link) *</label>
          <textarea
            required
            rows="2"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.quotation}
            onChange={(e) => setFormData({ ...formData, quotation: e.target.value })}
            placeholder="Link to proposal or details..."
          />
        </div>

        <Input 
          label="Quotation Amount (₹) *" 
          type="number"
          min="0"
          required 
          value={formData.quotationAmount}
          onChange={(e) => setFormData({ ...formData, quotationAmount: e.target.value })}
          placeholder="e.g. 50000"
        />

        <Input 
          label="Timeline (in days) *" 
          type="number"
          min="1"
          required 
          value={formData.proposalTimeline}
          onChange={(e) => setFormData({ ...formData, proposalTimeline: e.target.value })}
          placeholder="e.g. 30"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select 
            label="AMC Included? *" 
            required 
            value={formData.amcIncluded}
            onChange={(e) => setFormData({ ...formData, amcIncluded: e.target.value })}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </Select>

          {formData.amcIncluded === 'Yes' && (
            <Input 
              label="AMC Amount (₹) *" 
              type="number"
              min="0"
              required 
              value={formData.amcAmount}
              onChange={(e) => setFormData({ ...formData, amcAmount: e.target.value })}
              placeholder="e.g. 10000"
            />
          )}
        </div>

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
