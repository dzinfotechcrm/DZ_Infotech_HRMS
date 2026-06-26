import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function MeetingScheduledModal({ open, onClose, onSubmit, leadName }) {
  const [formData, setFormData] = useState({
    meetingDate: '',
    meetingTime: '',
    meetingType: 'Online',
    meetingReminder: '',
    nextFollowUp: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        meetingDate: '',
        meetingTime: '',
        meetingType: 'Online',
        meetingReminder: '',
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
    <Modal open={open} onClose={onClose} title="Meeting Details">
      <div className="mb-4 text-sm text-slate-600">
        Please provide the following details for <strong>{leadName}</strong> before moving them to Meeting Scheduled.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Meeting Date *"
            type="date"
            required
            value={formData.meetingDate}
            onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="Meeting Time *"
            type="time"
            required
            value={formData.meetingTime}
            onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
          />
        </div>

        <Select
          label="Meeting Type *"
          required
          value={formData.meetingType}
          onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
        >
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </Select>

        <Input
          label="Meeting Reminder"
          type="text"
          value={formData.meetingReminder}
          onChange={(e) => setFormData({ ...formData, meetingReminder: e.target.value })}
          placeholder="e.g. Send Zoom link 10 mins before"
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
