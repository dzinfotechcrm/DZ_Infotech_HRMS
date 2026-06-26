import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function DemoPreparationModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    demoWebsite: '',
    nextFollowUp: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        demoWebsite: '',
        nextFollowUp: ''
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Demo Preparation Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before moving them to Demo Preparation.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <Input 
          label="Demo Website URL *" 
          type="url"
          required 
          value={formData.demoWebsite}
          onChange={(e) => setFormData({ ...formData, demoWebsite: e.target.value })}
          placeholder="https://demo.example.com"
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
