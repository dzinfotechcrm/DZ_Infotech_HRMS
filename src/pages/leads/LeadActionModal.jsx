import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export default function LeadActionModal({ open, lead, onClose, onEditLead, onViewDetails }) {
  if (!open || !lead) return null;

  return (
    <Modal open={open} onClose={onClose} title="Lead Actions" size="max-w-sm">
      <div className="mb-6 text-sm text-slate-600 text-center">
        Choose an action for <br /><strong className="text-lg text-slate-900">{lead.companyName}</strong>
      </div>
      <div className="flex flex-col gap-3 pb-2">
        <Button onClick={onEditLead} className="w-full justify-center py-2.5">
          Edit Basic Lead Info
        </Button>
        {lead.stage !== 'New Lead' && (
          <Button variant="secondary" onClick={onViewDetails} className="w-full justify-center py-2.5 border-primary-200 text-primary-700 hover:bg-primary-50">
            View Stage Details
          </Button>
        )}
      </div>
    </Modal>
  );
}
