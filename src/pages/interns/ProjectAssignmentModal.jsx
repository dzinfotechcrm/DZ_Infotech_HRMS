import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/dateHelpers';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
];

const COMMON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'Mobile App Developer',
  'Python Developer',
  'QA / Tester',
];

export default function ProjectAssignmentModal({
  open,
  onClose,
  onSave,
  assignment = null,
  preselectedIntern = null,
  interns = [],
  employees = [],
  projects = [],
}) {
  const isEdit = Boolean(assignment?.id);
  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    intern_id: '',
    intern_name: '',
    intern_role: '',
    project_id: '',
    project_name: '',
    mentor_id: '',
    mentor_name: '',
    start_date: todayStr,
    end_date: '',
    status: 'In Progress',
    description: '',
  });

  const [customProject, setCustomProject] = useState(false);
  const [customMentor, setCustomMentor] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form
  useEffect(() => {
    if (!open) return;

    if (assignment) {
      const hasKnownProject = projects.some(
        (p) => String(p.id) === String(assignment.project_id || assignment.projectId)
      );
      const hasKnownMentor = employees.some(
        (e) => String(e.id) === String(assignment.mentor_id || assignment.mentorId)
      );

      const iId = assignment.intern_id || assignment.internId || '';
      const pId = assignment.project_id || assignment.projectId || '';
      const mId = assignment.mentor_id || assignment.mentorId || '';

      const isCustomP = !hasKnownProject && Boolean(assignment.project_name || assignment.projectName);
      const isCustomM = !hasKnownMentor && Boolean(assignment.mentor_name || assignment.mentorName);

      setCustomProject(isCustomP);
      setCustomMentor(isCustomM);

      setFormData({
        intern_id: iId,
        intern_name: assignment.intern_name || assignment.internName || '',
        intern_role: assignment.intern_role || assignment.internRole || '',
        project_id: pId,
        project_name: assignment.project_name || assignment.projectName || '',
        mentor_id: mId,
        mentor_name: assignment.mentor_name || assignment.mentorName || '',
        start_date: assignment.start_date || assignment.startDate || todayStr,
        end_date: assignment.end_date || assignment.endDate || '',
        status: assignment.status || 'In Progress',
        description: assignment.description || '',
      });
    } else if (preselectedIntern) {
      const pName =
        preselectedIntern.full_name ||
        `${preselectedIntern.first_name || ''} ${preselectedIntern.last_name || ''}`.trim() ||
        preselectedIntern.name;
      const pRole = preselectedIntern.position || preselectedIntern.designation || 'Intern';

      setFormData({
        intern_id: preselectedIntern.id || '',
        intern_name: pName,
        intern_role: pRole,
        project_id: '',
        project_name: '',
        mentor_id: '',
        mentor_name: '',
        start_date: todayStr,
        end_date: '',
        status: 'In Progress',
        description: '',
      });
      setCustomProject(false);
      setCustomMentor(false);
    } else {
      setFormData({
        intern_id: '',
        intern_name: '',
        intern_role: '',
        project_id: '',
        project_name: '',
        mentor_id: '',
        mentor_name: '',
        start_date: todayStr,
        end_date: '',
        status: 'In Progress',
        description: '',
      });
      setCustomProject(false);
      setCustomMentor(false);
    }
  }, [open, assignment, preselectedIntern, projects, employees, todayStr]);

  // Handle intern selection from SearchableSelect
  const handleInternChange = (e) => {
    const val = e.target.value;
    const found = interns.find((i) => String(i.id) === String(val));
    if (found) {
      const name =
        found.full_name ||
        `${found.first_name || ''} ${found.last_name || ''}`.trim() ||
        found.name ||
        '';
      const role = found.position || found.designation || formData.intern_role || '';
      setFormData((prev) => ({
        ...prev,
        intern_id: found.id,
        intern_name: name,
        intern_role: role || prev.intern_role,
      }));
    } else {
      setFormData((prev) => ({ ...prev, intern_id: '', intern_name: '' }));
    }
  };

  // Handle project selection
  const handleProjectChange = (e) => {
    const val = e.target.value;
    const found = projects.find((p) => String(p.id) === String(val));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        project_id: found.id,
        project_name: found.name || found.projectName || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, project_id: '', project_name: '' }));
    }
  };

  // Handle mentor selection
  const handleMentorChange = (e) => {
    const val = e.target.value;
    const found = employees.find((emp) => String(emp.id) === String(val));
    if (found) {
      const name =
        `${found.firstName || found.first_name || ''} ${found.lastName || found.last_name || ''}`.trim() ||
        found.name ||
        '';
      setFormData((prev) => ({
        ...prev,
        mentor_id: found.id,
        mentor_name: name,
      }));
    } else {
      setFormData((prev) => ({ ...prev, mentor_id: '', mentor_name: '' }));
    }
  };

  // Searchable intern options (clean list with only existing interns, NO "+ Other / New Intern")
  const internOptions = interns.map((i) => {
    const name =
      i.full_name || `${i.first_name || ''} ${i.last_name || ''}`.trim() || i.name;
    const role = i.position || i.designation || 'Intern';
    return {
      value: i.id,
      label: `${name} (${role})`,
    };
  });

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name || p.projectName,
  }));

  const mentorOptions = employees.map((emp) => {
    const name =
      `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() ||
      emp.name;
    return {
      value: emp.id,
      label: `${name} (${emp.designation || emp.role || 'Staff'})`,
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.intern_name?.trim()) {
      toast.error('Please select an Intern');
      return;
    }
    if (!formData.intern_role?.trim()) {
      toast.error('Please enter Intern Role');
      return;
    }
    if (!formData.project_name?.trim()) {
      toast.error('Please select or enter Project Name');
      return;
    }
    if (!formData.start_date) {
      toast.error('Please specify Start Date');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        intern_id: formData.intern_id || null,
        intern_name: formData.intern_name.trim(),
        intern_role: formData.intern_role.trim(),
        project_id: customProject ? null : formData.project_id || null,
        project_name: formData.project_name.trim(),
        mentor_id: customMentor ? null : formData.mentor_id || null,
        mentor_name: formData.mentor_name.trim() || 'Admin',
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: formData.status || 'In Progress',
        description: formData.description?.trim() || '',
      };

      await onSave(payload);
      toast.success(isEdit ? 'Project assignment updated!' : 'Project assigned successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving project assignment:', err);
      toast.error(err.message || 'Failed to save project assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Project Assignment' : 'Assign Project to Intern'}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 py-1">
        {/* Info Header */}
        <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-600 p-2.5 text-white shadow-sm">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-primary-950">
                {isEdit ? 'Update Project Assignment' : 'New Project Allocation'}
              </h4>
              <p className="text-xs text-primary-800">
                Assign projects, set roles, specify mentors, and track completion timelines.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Intern Details */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-4">
          <h5 className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
            <UserIcon className="h-4 w-4 text-primary-600" />
            Intern Details
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SearchableSelect
                label="Select Intern *"
                name="intern_id"
                value={formData.intern_id}
                onChange={handleInternChange}
                options={internOptions}
                placeholder="Search & choose intern..."
                required
              />
            </div>

            <div>
              <Input
                label="Intern Role *"
                placeholder="e.g. Frontend Developer"
                value={formData.intern_role}
                onChange={(e) => setFormData({ ...formData, intern_role: e.target.value })}
                required
              />
              {/* Quick role suggestions */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {COMMON_ROLES.slice(0, 4).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, intern_role: role })}
                    className="rounded bg-neutral-200/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 hover:bg-primary-100 hover:text-primary-800 transition"
                  >
                    {role.replace(' Developer', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Project & Mentor */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-4">
          <h5 className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
            <BriefcaseIcon className="h-4 w-4 text-primary-600" />
            Project & Mentor
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-700">Project *</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomProject(!customProject);
                    if (!customProject) {
                      setFormData((p) => ({ ...p, project_id: '', project_name: '' }));
                    }
                  }}
                  className="text-xs text-primary-600 hover:underline font-semibold"
                >
                  {customProject ? '← Select Existing' : '+ Type Custom Project'}
                </button>
              </div>

              {customProject ? (
                <Input
                  placeholder="e.g. DZ HRMS Portal"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  required
                />
              ) : (
                <SearchableSelect
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleProjectChange}
                  options={projectOptions}
                  placeholder="Search project..."
                  required
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-700">Mentor / Lead</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomMentor(!customMentor);
                    if (!customMentor) {
                      setFormData((p) => ({ ...p, mentor_id: '', mentor_name: '' }));
                    }
                  }}
                  className="text-xs text-primary-600 hover:underline font-semibold"
                >
                  {customMentor ? '← Select Existing' : '+ Type Custom Mentor'}
                </button>
              </div>

              {customMentor ? (
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={formData.mentor_name}
                  onChange={(e) => setFormData({ ...formData, mentor_name: e.target.value })}
                />
              ) : (
                <SearchableSelect
                  name="mentor_id"
                  value={formData.mentor_id}
                  onChange={handleMentorChange}
                  options={mentorOptions}
                  placeholder="Search mentor..."
                />
              )}
            </div>

            <Input
              type="date"
              label="Start Date *"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />

            <Input
              type="date"
              label="Expected End Date (Optional)"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <Select
            label="Assignment Status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={STATUS_OPTIONS}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Project Description & Key Deliverables (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Develop intern assignment tracking module, write documentation and unit tests..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save Changes' : 'Assign Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
