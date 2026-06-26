import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import ContactedDetailsModal from './ContactedDetailsModal';
import DemoPreparationModal from './DemoPreparationModal';
import MeetingScheduledModal from './MeetingScheduledModal';
import MeetingCompletedModal from './MeetingCompletedModal';
import ProposalSentModal from './ProposalSentModal';
import NegotiationModal from './NegotiationModal';
import WonModal from './WonModal';

const STAGES = [
  'New Lead',
  'Contacted',
  'Demo Preparation',
  'Meeting Scheduled',
  'Meeting Completed',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const SERVICES_LIST = [
  'Static Website', 'Dynamic Website', 'Ecommerce Website',
  'CRM', 'ERP', 'AI Chatbot', 'AI Automation'
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
  serviceInterested: [],
  expectedValue: '',
  leadSource: 'Website',
  assignedTo: '',
  stage: 'New Lead',
  nextFollowUp: '',
  interestLevel: '',
  notes: ''
};

export default function LeadFormModal({ lead, leads = [], employees, open, onClose, onSave }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmStageChange, setConfirmStageChange] = useState({ open: false, payload: null });
  const [contactedDetailsModal, setContactedDetailsModal] = useState({ open: false, payload: null });
  const [demoPrepModal, setDemoPrepModal] = useState({ open: false, payload: null });
  const [meetingSchedModal, setMeetingSchedModal] = useState({ open: false, payload: null });
  const [meetingCompletedModal, setMeetingCompletedModal] = useState({ open: false, payload: null });
  const [proposalSentModal, setProposalSentModal] = useState({ open: false, payload: null });
  const [negotiationModal, setNegotiationModal] = useState({ open: false, payload: null });
  const [wonModal, setWonModal] = useState({ open: false, payload: null });

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        serviceInterested: typeof lead.serviceInterested === 'string'
          ? (lead.serviceInterested ? lead.serviceInterested.split(',').map(s => s.trim()) : [])
          : (Array.isArray(lead.serviceInterested) ? lead.serviceInterested : [])
      });
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

  const handleToggleService = (service) => {
    const currentServices = Array.isArray(formData.serviceInterested) ? formData.serviceInterested : [];
    if (currentServices.includes(service)) {
      handleChange('serviceInterested', currentServices.filter(s => s !== service));
    } else {
      handleChange('serviceInterested', [...currentServices, service]);
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    const required = ['companyName', 'contactPerson', 'stage', 'assignedTo', 'nextFollowUp'];
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

    const payload = {
      ...formData,
      serviceInterested: Array.isArray(formData.serviceInterested) ? formData.serviceInterested.join(', ') : formData.serviceInterested,
      expectedValue: parseFloat(formData.expectedValue) || 0,
    };

    // Strip virtual fields added by the data mapper
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.employeeId;
    delete payload.departmentId;
    delete payload.firstName;
    delete payload.lastName;

    if (lead && lead.stage !== formData.stage) {
      setConfirmStageChange({ open: true, payload });
      return;
    }

    executeSave(payload);
  };

  const executeSave = async (payloadToSave, extraDetails = null) => {
    if (lead && lead.stage === 'New Lead' && payloadToSave.stage === 'Contacted' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setContactedDetailsModal({ open: true, payload: payloadToSave });
      return;
    }

    if (lead && lead.stage === 'Contacted' && payloadToSave.stage === 'Demo Preparation' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setDemoPrepModal({ open: true, payload: payloadToSave });
      return;
    }

    if (lead && lead.stage === 'Demo Preparation' && payloadToSave.stage === 'Meeting Scheduled' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setMeetingSchedModal({ open: true, payload: payloadToSave });
      return;
    }

    if (lead && lead.stage === 'Meeting Scheduled' && payloadToSave.stage === 'Meeting Completed' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setMeetingCompletedModal({ open: true, payload: payloadToSave });
      return;
    }

    if (lead && lead.stage === 'Meeting Completed' && payloadToSave.stage === 'Proposal Sent' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setProposalSentModal({ open: true, payload: payloadToSave });
      return;
    }

    if (lead && lead.stage === 'Proposal Sent' && payloadToSave.stage === 'Negotiation' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setNegotiationModal({ open: true, payload: payloadToSave });
      return;
    }

    if (lead && lead.stage === 'Negotiation' && payloadToSave.stage === 'Won' && !extraDetails) {
      setConfirmStageChange({ open: false, payload: null });
      setWonModal({ open: true, payload: payloadToSave });
      return;
    }

    setSaving(true);
    try {
      const finalPayload = extraDetails ? { ...payloadToSave, ...extraDetails } : payloadToSave;
      await onSave(finalPayload);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save lead');
    } finally {
      setSaving(false);
      setConfirmStageChange({ open: false, payload: null });
      setContactedDetailsModal({ open: false, payload: null });
      setDemoPrepModal({ open: false, payload: null });
      setMeetingSchedModal({ open: false, payload: null });
      setMeetingCompletedModal({ open: false, payload: null });
      setProposalSentModal({ open: false, payload: null });
      setNegotiationModal({ open: false, payload: null });
      setWonModal({ open: false, payload: null });
    }
  };

  if (!open) return null;

  return (
    <>
      <Modal open={open} title={lead ? "Edit Lead" : "Add New Lead"} onClose={onClose} size="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8 h-[65vh] overflow-y-auto px-2 pb-4 text-slate-900">

          {/* Basic Info */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Basic Information</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Lead ID" value={formData.leadId} disabled />
              <Input label="Company Name *" error={errors.companyName} value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
              <Input label="Contact Person *" error={errors.contactPerson} value={formData.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} />
              <Input label="Phone" error={errors.phone} value={formData.phone} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              <Input label="WhatsApp" value={formData.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              <Input label="Email" type="email" error={errors.email} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
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
              <Input label="Expected Project Value (₹)" type="number" min="0" value={formData.expectedValue} onChange={(e) => handleChange('expectedValue', e.target.value)} />
              <Select label="Lead Source" value={formData.leadSource} onChange={(e) => handleChange('leadSource', e.target.value)}>
                {['Website', 'LinkedIn', 'Referral', 'Cold Outreach', 'Ads', 'Inbound', 'Outbound', 'PA'].map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <div className="sm:col-span-2 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Services Interested</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES_LIST.map(service => {
                    const currentServices = Array.isArray(formData.serviceInterested) ? formData.serviceInterested : [];
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
            </div>
          </div>

          {/* Sales Info */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Sales Pipeline Info</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Current Stage *" error={errors.stage} value={formData.stage} onChange={(e) => handleChange('stage', e.target.value)}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select label="Assigned To *" error={errors.assignedTo} value={formData.assignedTo} onChange={(e) => handleChange('assignedTo', e.target.value)}>
                <option value="">Select Assignee</option>
                {employees?.map(emp => {
                  const isMe = user && (emp.uid === user.uid || emp.id === user.id);
                  return (
                    <option key={emp.id} value={emp.uid || emp.id}>
                      {emp.firstName} {emp.lastName} {isMe ? '(Me)' : ''}
                    </option>
                  );
                })}
              </Select>
              <Input
                label="Next Follow-Up Date *"
                error={errors.nextFollowUp}
                type="date"
                min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                value={formData.nextFollowUp}
                onChange={(e) => handleChange('nextFollowUp', e.target.value)}
              />
              <Select label="Interest Level" value={formData.interestLevel} onChange={(e) => handleChange('interestLevel', e.target.value)}>
                <option value="">Select Interest Level</option>
                <option value="Very Interested">Very Interested</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
              </Select>
              <div className="sm:col-span-2 lg:col-span-3 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows="3"
                  className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
      <ConfirmModal
        open={confirmStageChange.open}
        title="Confirm Status Change"
        message={<span>Are you sure you want to change the stage to <strong>{formData.stage}</strong>?</span>}
        onConfirm={() => executeSave(confirmStageChange.payload)}
        onCancel={() => setConfirmStageChange({ open: false, payload: null })}
        confirmText="Update Stage"
      />
      <ContactedDetailsModal
        open={contactedDetailsModal.open}
        onClose={() => setContactedDetailsModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(contactedDetailsModal.payload, details)}
        leadName={contactedDetailsModal.payload?.companyName || 'this lead'}
      />
      <DemoPreparationModal
        open={demoPrepModal.open}
        onClose={() => setDemoPrepModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(demoPrepModal.payload, details)}
        leadName={demoPrepModal.payload?.companyName || 'this lead'}
      />
      <MeetingScheduledModal
        open={meetingSchedModal.open}
        onClose={() => setMeetingSchedModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(meetingSchedModal.payload, details)}
        leadName={meetingSchedModal.payload?.companyName || 'this lead'}
      />
      <MeetingCompletedModal
        open={meetingCompletedModal.open}
        onClose={() => setMeetingCompletedModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(meetingCompletedModal.payload, details)}
        leadName={meetingCompletedModal.payload?.companyName || 'this lead'}
      />
      <ProposalSentModal
        open={proposalSentModal.open}
        onClose={() => setProposalSentModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(proposalSentModal.payload, details)}
        leadName={proposalSentModal.payload?.companyName || 'this lead'}
      />
      <NegotiationModal
        open={negotiationModal.open}
        onClose={() => setNegotiationModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(negotiationModal.payload, details)}
        leadName={negotiationModal.payload?.companyName || 'this lead'}
      />
      <WonModal
        open={wonModal.open}
        onClose={() => setWonModal({ open: false, payload: null })}
        onSubmit={(details) => executeSave(wonModal.payload, details)}
        leadName={wonModal.payload?.companyName || 'this lead'}
      />
    </>
  );
}
