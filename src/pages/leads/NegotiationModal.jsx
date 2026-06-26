import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function NegotiationModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    currentPrice: '',
    clientCounterOffer: '',
    latestOffer: '',
    discountReason: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        currentPrice: '',
        clientCounterOffer: '',
        latestOffer: '',
        discountReason: ''
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      currentPrice: formData.currentPrice ? Number(formData.currentPrice) : null,
      clientCounterOffer: formData.clientCounterOffer ? Number(formData.clientCounterOffer) : null,
      latestOffer: formData.latestOffer ? Number(formData.latestOffer) : null
    });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Negotiation Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before moving them to Negotiation.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <Input
          label="Current Price (₹) *"
          type="number"
          min="0"
          required
          value={formData.currentPrice}
          onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
          placeholder="e.g. 50000"
        />

        <Input
          label="Client Counter Offer (₹) *"
          type="number"
          min="0"
          required
          value={formData.clientCounterOffer}
          onChange={(e) => setFormData({ ...formData, clientCounterOffer: e.target.value })}
          placeholder="e.g. 40000"
        />

        <Input
          label="Latest Offer (₹) *"
          type="number"
          min="0"
          required
          value={formData.latestOffer}
          onChange={(e) => setFormData({ ...formData, latestOffer: e.target.value })}
          placeholder="e.g. 45000"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Discount</label>
          <textarea
            rows="3"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.discountReason}
            onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
            placeholder="Why is the discount being offered?"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit">Submit & Update</Button>
        </div>
      </form>
    </Modal>
  );
}
