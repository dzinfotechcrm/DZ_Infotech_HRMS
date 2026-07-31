import { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument } from '../../supabase/db';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

export default function AnnouncementsAdmin() {
  const { items: announcements, loading } = useSupabaseCollection('announcements');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'info',
    target_roles: ['all'],
    status: 'active'
  });

  const activeAnnouncements = announcements.filter(a => a.status === 'active').length;
  const totalAnnouncements = announcements.length;

  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        priority: announcement.priority || 'info',
        target_roles: announcement.target_roles || ['all'],
        status: announcement.status || 'active'
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        priority: 'info',
        target_roles: ['all'],
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDocument('announcements', editingId, {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          target_roles: Array.isArray(formData.target_roles) ? formData.target_roles : [formData.target_roles],
          status: formData.status
        });
        toast.success('Announcement updated');
      } else {
        await createDocument('announcements', {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          target_roles: Array.isArray(formData.target_roles) ? formData.target_roles : [formData.target_roles],
          status: formData.status,
          acknowledged_by: []
        });
        toast.success('Announcement published');
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await removeDocument('announcements', id);
        toast.success('Announcement deleted');
      } catch (err) {
        toast.error('Failed to delete announcement');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notice Board & Announcements" 
        description="Publish company-wide announcements and track employee acknowledgments."
        actions={
          <Button onClick={() => handleOpenModal()}>
            + New Announcement
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-primary-50 border-primary-100">
          <div className="text-sm font-semibold text-primary-600 mb-1">Active Announcements</div>
          <div className="text-3xl font-black text-primary-900">{activeAnnouncements}</div>
        </Card>
        <Card className="p-6 bg-neutral-50 border-neutral-100">
          <div className="text-sm font-semibold text-neutral-600 mb-1">Total Announcements</div>
          <div className="text-3xl font-black text-neutral-900">{totalAnnouncements}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ack. Count</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {announcements.map(ann => (
                <tr key={ann.id} onClick={() => handleOpenModal(ann)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{ann.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[250px]">{ann.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge tone={ann.priority === 'urgent' ? 'danger' : ann.priority === 'warning' ? 'warning' : 'info'}>
                      {ann.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {Array.isArray(ann.target_roles) ? ann.target_roles.join(', ') : ann.target_roles}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(ann.created_at, 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                    {Array.isArray(ann.acknowledged_by) ? ann.acknowledged_by.length : 0} reads
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }}
                      className="text-rose-600 hover:text-rose-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {announcements.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    No announcements published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingId ? "Edit Announcement" : "New Announcement"} overflowVisible={true}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Announcement Title" 
            placeholder="e.g. Office closed for Diwali"
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            required 
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
            <span>Announcement Content</span>
            <textarea
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              rows={4}
              placeholder="Provide the full details here..."
              value={formData.content}
              onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Priority"
              value={formData.priority}
              onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
              required
            >
              <option value="info">Info (Blue)</option>
              <option value="warning">Warning (Orange)</option>
              <option value="urgent">Urgent (Red)</option>
            </Select>
            <Select 
              label="Target Roles"
              value={formData.target_roles[0]} 
              onChange={e => setFormData(p => ({ ...p, target_roles: [e.target.value] }))}
              required
            >
              <option value="all">All Employees & Interns</option>
              <option value="manager">Managers Only</option>
              <option value="employee">Employees Only</option>
              <option value="intern">Interns Only</option>
            </Select>
          </div>
          {editingId && (
            <Select 
              label="Status"
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
              required
            >
              <option value="active">Active (Visible on Dashboard)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </Select>
          )}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Publish Announcement')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
