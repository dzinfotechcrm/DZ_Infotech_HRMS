import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function WonModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    advancePaymentReceived: 'Yes'
  });

  useEffect(() => {
    if (open) {
      setFormData({
        advancePaymentReceived: 'Yes'
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Deal Won Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before marking them as Won.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <Select
          label="Has Advance Payment Been Received? *"
          required
          value={formData.advancePaymentReceived}
          onChange={(e) => setFormData({ ...formData, advancePaymentReceived: e.target.value })}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </Select>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit">Submit & Update</Button>
        </div>
      </form>
    </Modal>
  );
}
