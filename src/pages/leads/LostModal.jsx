import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export default function LostModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    lostReason: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        lostReason: ''
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Lead Lost Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the reason why <strong>{leadName}</strong> is being marked as Lost.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lost Reason <span className="text-danger-600 ml-1">*</span>
          </label>
          <textarea
            required
            rows="4"
            className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.lostReason}
            onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })}
            placeholder="E.g., Price too high, chose competitor..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" variant="danger">Mark as Lost</Button>
        </div>
      </form>
    </Modal>
  );
}
