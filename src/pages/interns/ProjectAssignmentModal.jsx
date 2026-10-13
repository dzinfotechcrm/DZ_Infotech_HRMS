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
  PlusIcon,
  XMarkIcon,
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
}) {
  const isEdit = Boolean(assignment?.id);
  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    intern_id: '',
    intern_name: '',
    intern_role: '',
    project_name: '',
    start_date: todayStr,
    end_date: '',
    status: 'In Progress',
    description: '',
  });

  // Multiple mentors state: array of { id, name }
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [customMentorInput, setCustomMentorInput] = useState('');
  const [showCustomMentorInput, setShowCustomMentorInput] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form
  useEffect(() => {
    if (!open) return;

    if (assignment) {
      const iId = assignment.intern_id || assignment.internId || '';
      const rawMentorName = assignment.mentor_name || assignment.mentorName || '';
      const rawMentorIds = assignment.mentor_ids || assignment.mentorIds || (assignment.mentor_id ? [assignment.mentor_id] : []);

      // Parse mentors from comma-separated string if exists
      const names = rawMentorName.split(',').map((s) => s.trim()).filter(Boolean);
      const parsedMentors = names.map((name, idx) => {
        const matchingEmp = employees.find((e) => {
          const empName = `${e.firstName || e.first_name || ''} ${e.lastName || e.last_name || ''}`.trim() || e.name;
          return empName.toLowerCase() === name.toLowerCase();
        });
        return {
          id: matchingEmp?.id || rawMentorIds[idx] || null,
          name: matchingEmp ? (`${matchingEmp.firstName || matchingEmp.first_name || ''} ${matchingEmp.lastName || matchingEmp.last_name || ''}`.trim() || matchingEmp.name) : name,
        };
      });

      setSelectedMentors(parsedMentors);
      setShowCustomMentorInput(false);
      setCustomMentorInput('');

      setFormData({
        intern_id: iId,
        intern_name: assignment.intern_name || assignment.internName || '',
        intern_role: assignment.intern_role || assignment.internRole || '',
        project_name: assignment.project_name || assignment.projectName || '',
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

      setSelectedMentors([]);
      setShowCustomMentorInput(false);
      setCustomMentorInput('');

      setFormData({
        intern_id: preselectedIntern.id || '',
        intern_name: pName,
        intern_role: pRole,
        project_name: '',
        start_date: todayStr,
        end_date: '',
        status: 'In Progress',
        description: '',
      });
    } else {
      setSelectedMentors([]);
      setShowCustomMentorInput(false);
      setCustomMentorInput('');

      setFormData({
        intern_id: '',
        intern_name: '',
        intern_role: '',
        project_name: '',
        start_date: todayStr,
        end_date: '',
        status: 'In Progress',
        description: '',
      });
    }
  }, [open, assignment, preselectedIntern, employees, todayStr]);

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

  // Add mentor from employee dropdown
  const handleAddMentorFromSelect = (e) => {
    const empId = e.target.value;
    if (!empId) return;
    const emp = employees.find((e) => String(e.id) === String(empId));
    if (emp) {
      const name =
        `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() ||
        emp.name;
      if (!selectedMentors.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
        setSelectedMentors((prev) => [...prev, { id: emp.id, name }]);
      }
    }
  };

  // Add custom typed mentor
  const handleAddCustomMentor = () => {
    if (!customMentorInput.trim()) return;
    const name = customMentorInput.trim();
    if (!selectedMentors.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setSelectedMentors((prev) => [...prev, { id: null, name }]);
    }
    setCustomMentorInput('');
    setShowCustomMentorInput(false);
  };

  // Remove mentor
  const handleRemoveMentor = (indexToRemove) => {
    setSelectedMentors((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Searchable intern options (no Other / New Intern)
  const internOptions = interns.map((i) => {
    const name =
      i.full_name || `${i.first_name || ''} ${i.last_name || ''}`.trim() || i.name;
    const role = i.position || i.designation || 'Intern';
    return {
      value: i.id,
      label: `${name} (${role})`,
    };
  });

  // Available mentors in dropdown (excludes mentors already chosen)
  const availableMentorOptions = employees
    .filter((emp) => {
      const name =
        `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() ||
        emp.name;
      return (
        emp.status !== 'deleted' &&
        !selectedMentors.some((m) => m.name.toLowerCase() === name.toLowerCase())
      );
    })
    .map((emp) => {
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
      toast.error('Please enter Project Name');
      return;
    }
    if (!formData.start_date) {
      toast.error('Please specify Start Date');
      return;
    }

    try {
      setSaving(true);
      const mentorNames = selectedMentors.map((m) => m.name.trim()).filter(Boolean);
      const mentorNameStr = mentorNames.join(', ');
      const mentorIds = selectedMentors.map((m) => m.id).filter(Boolean);

      const payload = {
        intern_id: formData.intern_id || null,
        intern_name: formData.intern_name.trim(),
        intern_role: formData.intern_role.trim(),
        project_name: formData.project_name.trim(),
        mentor_id: mentorIds[0] || null,
        mentor_name: mentorNameStr || 'Admin',
        mentor_ids: mentorIds,
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
                Assign projects, set roles, specify single or multiple mentors, and track deliverables.
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

        {/* Section 2: Project & Mentors */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-4">
          <h5 className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
            <BriefcaseIcon className="h-4 w-4 text-primary-600" />
            Project & Mentors
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name (Manually typed) */}
            <div>
              <Input
                label="Project Name *"
                placeholder="e.g. DZ HRMS Portal"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
              />
            </div>

            {/* Multiple Mentors Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  Mentor / Team Lead(s)
                  {selectedMentors.length > 0 && (
                    <span className="ml-1.5 text-xs text-primary-600 font-bold">
                      ({selectedMentors.length})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomMentorInput(!showCustomMentorInput)}
                  className="text-xs text-primary-600 hover:underline font-semibold"
                >
                  {showCustomMentorInput ? '← Choose from List' : '+ Custom Mentor'}
                </button>
              </div>

              {/* Selected Mentor Chips */}
              {selectedMentors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 mb-2 bg-white border border-neutral-200 rounded-xl">
                  {selectedMentors.map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 border border-primary-200 px-2 py-1 text-xs font-semibold text-primary-900"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-200 text-[10px] font-bold text-primary-800">
                        {m.name?.[0]?.toUpperCase() || 'M'}
                      </span>
                      <span>{m.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMentor(idx)}
                        className="text-neutral-400 hover:text-danger-600 font-bold ml-0.5 text-sm leading-none"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Selector or Custom Input */}
              {showCustomMentorInput ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="Enter mentor name..."
                    value={customMentorInput}
                    onChange={(e) => setCustomMentorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomMentor();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomMentor}
                    disabled={!customMentorInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <SearchableSelect
                  name="mentor_id"
                  value=""
                  onChange={handleAddMentorFromSelect}
                  options={availableMentorOptions}
                  placeholder={
                    selectedMentors.length > 0
                      ? '+ Add another mentor...'
                      : 'Search & select mentor(s)...'
                  }
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
