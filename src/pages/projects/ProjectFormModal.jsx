import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../../supabase/storage';

const SERVICE_TYPES = [
  'Static Website',
  'Dynamic Website',
  'Ecommerce',
  'CRM',
  'ERP',
  'AI Chatbot',
  'AI Automation',
  'Whatsapp API'
];

const STAGES = [
  'Requirements',
  'Design',
  'Development',
  'Testing',
  'Client Review',
  'Deployment',
  'Completed'
];

const WhatsappButton = ({ client, project }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleSend = (stage) => {
    let message = `Hello ${client.contactPerson || client.companyName},\n\n`;
    message += `This is an update regarding your project: *${project.name || 'Your Project'}*.\n`;
    message += `Current Stage Update: *${stage}*\n\n`;
    
    if (stage === 'Requirements') {
      message += `We are currently gathering and analyzing the requirements for your project. Please let us know if there are any additional details you'd like to share.`;
    } else if (stage === 'Design') {
      message += `We have started the design phase. We will share the initial mockups with you soon for your feedback.`;
    } else if (stage === 'Development') {
      message += `Development is currently underway! Our team is actively building the features as discussed.`;
    } else if (stage === 'Testing') {
      message += `The project has entered the testing phase. We are ensuring everything works smoothly before handing it over to you.`;
    } else if (stage === 'Client Review') {
      message += `The project is ready for your review. Kindly check and share your feedback so we can proceed further.`;
    } else if (stage === 'Deployment') {
      message += `Great news! We are preparing to deploy your project to the live environment.`;
    } else if (stage === 'Completed') {
      message += `Your project has been successfully completed and delivered! Thank you for choosing us.`;
    }
    
    message += `\n\nBest regards,\nDZ Infotech`;
    
    const url = `https://wa.me/91${client.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowDropdown(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="rounded-lg p-2 text-[#25D366] hover:bg-neutral-100 transition-colors flex items-center justify-center"
        title="Send WhatsApp Update"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] overflow-hidden">
          <div className="py-1">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => handleSend(stage)}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-[#128C7E]"
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProjectFormModal({ open, project, clients, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    serviceType: 'Static Website',
    status: 'Requirements',
    startDate: '',
    deadline: '',
    description: '',
    totalValue: '',
    advanceReceived: '',
    files: {} // Store URLs for Requirements, Quotations, Designs, Source Files
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        files: project.files || {}
      });
    } else {
      setFormData({
        name: '',
        clientId: '',
        serviceType: 'Static Website',
        status: 'Requirements',
        startDate: '',
        deadline: '',
        description: '',
        totalValue: '',
        advanceReceived: '',
        files: {}
      });
    }
    setErrors({});
  }, [project, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileUpload = async (e, category) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadFile(file, 'projects');
      setFormData(prev => ({
        ...prev,
        files: { ...prev.files, [category]: publicUrl }
      }));
      toast.success(`${category} uploaded successfully!`);
    } catch (err) {
      toast.error(`Failed to upload file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
      isValid = false;
    }
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
      isValid = false;
    }
    if (!formData.serviceType) {
      newErrors.serviceType = 'Service type is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        totalValue: parseFloat(formData.totalValue) || 0,
        advanceReceived: parseFloat(formData.advanceReceived) || 0,
      };

      // Strip virtual fields if editing
      delete payload.createdAt;
      delete payload.updatedAt;

      await onSave(payload);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const selectedClient = clients.find(c => c.id === formData.clientId);

  const headerActions = selectedClient && selectedClient.phone ? (
    <WhatsappButton client={selectedClient} project={formData} />
  ) : null;

  return (
    <Modal open={open} title={project ? "Edit Project" : "New Project"} onClose={onClose} size="max-w-4xl" headerActions={headerActions}>
      <form onSubmit={handleSubmit} className="space-y-8 h-[70vh] overflow-y-auto px-2 pb-4 text-slate-900">

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Project Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Select
              label="Client *"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              error={errors.clientId}
            >
              <option value="">Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </Select>
            <Select
              label="Service Type *"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              error={errors.serviceType}
            >
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select
              label="Current Stage *"
              name="status"
              value={formData.status}
              onChange={handleChange}
              error={errors.status}
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input
              label="Start Date"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
            <Input
              label="Deadline"
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Financial Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">Financials</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Total Value (₹)"
              type="number"
              name="totalValue"
              value={formData.totalValue}
              onChange={handleChange}
            />
            <Input
              label="Advance Received (₹)"
              type="number"
              name="advanceReceived"
              value={formData.advanceReceived}
              onChange={handleChange}
            />
            <Input
              label="Remaining Amount (₹)"
              type="number"
              disabled
              value={(parseFloat(formData.totalValue || 0) - parseFloat(formData.advanceReceived || 0))}
              className="bg-neutral-50"
            />
          </div>
        </div>

        {/* Files Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">Files & Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {['Requirements', 'Quotations', 'Designs', 'Source Files'].map((category) => (
              <div key={category} className="border border-neutral-200 rounded-xl p-4 flex flex-col gap-2 bg-neutral-50">
                <span className="text-sm font-medium text-neutral-700">{category}</span>
                {formData.files?.[category] ? (
                  <div className="flex items-center justify-between">
                    <a href={formData.files[category]} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline truncate max-w-[200px]">
                      View Uploaded File
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => {
                        const newFiles = { ...prev.files };
                        delete newFiles[category];
                        return { ...prev, files: newFiles };
                      })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id={`file-${category}`}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, category)}
                      disabled={uploading}
                    />
                    <label
                      htmlFor={`file-${category}`}
                      className={`cursor-pointer inline-flex items-center justify-center px-3 py-1.5 border border-neutral-300 shadow-sm text-xs font-medium rounded text-neutral-700 bg-white hover:bg-neutral-50 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Upload File
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-neutral-200 mt-8">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || uploading} isLoading={saving}>
            {saving ? 'Saving...' : (project ? 'Save Changes' : 'Create Project')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
