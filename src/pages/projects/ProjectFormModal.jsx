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

  return (
    <Modal open={open} title={project ? "Edit Project" : "New Project"} onClose={onClose} size="max-w-4xl">
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
