import { useState, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument } from '../../supabase/db';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StatusDropdown from '../../components/ui/StatusDropdown';
import ProjectAssignmentModal from './ProjectAssignmentModal';
import { formatDate } from '../../utils/dateHelpers';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  FolderIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_TONES = {
  'In Progress': 'primary',
  'Assigned': 'accent',
  'Completed': 'success',
  'On Hold': 'warning',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
];

export default function InternProjects() {
  // Collections
  const { items: rawAssignments, loading: assignmentsLoading } = useSupabaseCollection('intern_projects');
  const { items: rawInterns, loading: internsLoading } = useSupabaseCollection('interns');
  const { items: rawEmployees } = useSupabaseCollection('employees');
  const { items: rawProjects } = useSupabaseCollection('projects');

  // Combined interns list (from interns table + employees with intern role)
  const allInterns = useMemo(() => {
    const map = new Map();

    // From interns collection
    rawInterns.forEach((i) => {
      const name = i.full_name || `${i.first_name || ''} ${i.last_name || ''}`.trim() || i.name;
      if (name) {
        map.set(i.id || name, {
          id: i.id,
          name,
          position: i.position || i.designation || 'Intern',
          email: i.email || '',
          phone: i.phone || i.mobile || '',
          photo_url: i.photo_url || '',
          status: i.status || 'Active',
        });
      }
    });

    // From employees collection if role is intern
    rawEmployees.forEach((e) => {
      if (e.role?.toLowerCase() === 'intern' || e.designation?.toLowerCase().includes('intern')) {
        const name = `${e.firstName || e.first_name || ''} ${e.lastName || e.last_name || ''}`.trim() || e.name;
        const key = e.id || name;
        if (!map.has(key) && name) {
          map.set(key, {
            id: e.id,
            name,
            position: e.designation || e.role || 'Intern',
            email: e.email || '',
            phone: e.phone || '',
            photo_url: e.photoUrl || '',
            status: e.status || 'Active',
          });
        }
      }
    });

    // Also include any interns present in assignments that might not be in the interns table
    rawAssignments.forEach((a) => {
      const name = a.intern_name || a.internName;
      const key = a.intern_id || a.internId || name;
      if (name && !map.has(key)) {
        map.set(key, {
          id: key,
          name,
          position: a.intern_role || a.internRole || 'Intern',
          email: '',
          phone: '',
          photo_url: '',
          status: 'Active',
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawInterns, rawEmployees, rawAssignments]);

  // Filters state
  const [selectedInternId, setSelectedInternId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Selected intern object
  const currentIntern = useMemo(() => {
    if (selectedInternId === 'all') return null;
    return allInterns.find(
      (i) => String(i.id) === String(selectedInternId) || i.name === selectedInternId
    );
  }, [allInterns, selectedInternId]);

  // Project count per intern
  const projectCountByIntern = useMemo(() => {
    const counts = {};
    rawAssignments.forEach((a) => {
      const internKey = a.intern_id || a.internId || a.intern_name || a.internName;
      if (internKey) {
        counts[internKey] = (counts[internKey] || 0) + 1;
      }
      const name = a.intern_name || a.internName;
      if (name && name !== internKey) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return counts;
  }, [rawAssignments]);

  // Intern filter dropdown options for Select component
  const internFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: `All Interns (${allInterns.length})` },
      ...allInterns.map((i) => {
        const count = projectCountByIntern[i.id] || projectCountByIntern[i.name] || 0;
        return {
          value: i.id || i.name,
          label: `${i.name} • ${count} ${count === 1 ? 'project' : 'projects'}`,
        };
      }),
    ];
  }, [allInterns, projectCountByIntern]);

  // Filtered project assignments
  const filteredAssignments = useMemo(() => {
    return rawAssignments.filter((a) => {
      // Intern filter
      if (selectedInternId !== 'all') {
        const matchesId = String(a.intern_id || a.internId) === String(selectedInternId);
        const matchesName =
          (a.intern_name || a.internName) === selectedInternId ||
          (currentIntern && (a.intern_name || a.internName) === currentIntern.name);
        if (!matchesId && !matchesName) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && a.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (a.project_name || a.projectName || '').toLowerCase();
        const iName = (a.intern_name || a.internName || '').toLowerCase();
        const iRole = (a.intern_role || a.internRole || '').toLowerCase();
        const mName = (a.mentor_name || a.mentorName || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();

        if (
          !pName.includes(q) &&
          !iName.includes(q) &&
          !iRole.includes(q) &&
          !mName.includes(q) &&
          !desc.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rawAssignments, selectedInternId, currentIntern, statusFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalAssignments = rawAssignments.length;
    const uniqueInterns = new Set(
      rawAssignments.map((a) => a.intern_name || a.internName).filter(Boolean)
    ).size;
    const active = rawAssignments.filter(
      (a) => a.status === 'In Progress' || a.status === 'Assigned'
    ).length;
    const completed = rawAssignments.filter((a) => a.status === 'Completed').length;
    return { totalAssignments, uniqueInterns, active, completed };
  }, [rawAssignments]);

  // Current intern stats
  const currentInternStats = useMemo(() => {
    if (!currentIntern) return null;
    const internProjects = rawAssignments.filter(
      (a) =>
        String(a.intern_id || a.internId) === String(currentIntern.id) ||
        (a.intern_name || a.internName) === currentIntern.name
    );
    const active = internProjects.filter(
      (a) => a.status === 'In Progress' || a.status === 'Assigned'
    ).length;
    const completed = internProjects.filter((a) => a.status === 'Completed').length;
    return { total: internProjects.length, active, completed };
  }, [currentIntern, rawAssignments]);

  // Save Assignment
  const handleSaveAssignment = async (payload) => {
    if (editingAssignment?.id) {
      await updateDocument('intern_projects', editingAssignment.id, payload);
    } else {
      await createDocument('intern_projects', payload);
    }
    setEditingAssignment(null);
  };

  // Delete Assignment
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeDocument('intern_projects', deleteConfirmId);
      toast.success('Project assignment removed');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error('Failed to remove assignment: ' + err.message);
    }
  };

  // Quick Status Change directly on card/table
  const handleQuickStatusChange = async (assignmentId, newStatus) => {
    try {
      await updateDocument('intern_projects', assignmentId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="HRMS"
        title="Intern Projects Tracking"
        description="Track and monitor intern project allocations, deliverables, and progress."
        actions={
          <Button
            onClick={() => {
              setEditingAssignment(null);
              setModalOpen(true);
            }}
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Assign Project
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-100 p-2.5 text-primary-700">
              <AcademicCapIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Interns Assigned
              </p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                {stats.uniqueInterns}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent-100 p-2.5 text-accent-700">
              <FolderIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Active Projects
              </p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                {stats.active}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success-100 p-2.5 text-success-700">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Completed
              </p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                {stats.completed}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Total Assignments
              </p>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                {stats.totalAssignments}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Intern Select Dropdown (Searchable) */}
          <div className="lg:col-span-4">
            <SearchableSelect
              label="Filter by Intern"
              name="internFilter"
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value || 'all')}
              options={internFilterOptions}
              placeholder="Search & filter intern..."
            />
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-3">
            <Select
              label="Filter by Status"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Search Box */}
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Search Projects
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search project, role, mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 pl-9 pr-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="lg:col-span-1 flex flex-col justify-end">
            <span className="text-xs font-medium text-neutral-500 mb-1.5 hidden lg:block text-center">
              View
            </span>
            <div className="flex items-center justify-center gap-1 border border-neutral-200 rounded-xl p-1 bg-neutral-50">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Cards View"
                className={`p-1.5 rounded-lg text-neutral-600 transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-primary-700 shadow-sm font-bold'
                    : 'hover:text-neutral-900'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-neutral-600 transition ${
                  viewMode === 'table'
                    ? 'bg-white text-primary-700 shadow-sm font-bold'
                    : 'hover:text-neutral-900'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Intern Profile Card (when a specific intern is filtered) */}
      {currentIntern && (
        <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 p-5 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white font-bold text-lg ring-2 ring-white/20">
                {currentIntern.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{currentIntern.name}</h2>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white/90">
                    {currentIntern.position}
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-0.5">
                  {currentIntern.email || 'No email registered'}
                  {currentIntern.phone && ` • 📞 ${currentIntern.phone}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-1.5 text-xs">
                <div>
                  <span className="text-white/60">Active: </span>
                  <strong className="text-white font-bold">
                    {currentInternStats?.active || 0}
                  </strong>
                </div>
                <div className="border-l border-white/20 pl-3">
                  <span className="text-white/60">Completed: </span>
                  <strong className="text-white font-bold">
                    {currentInternStats?.completed || 0}
                  </strong>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setEditingAssignment(null);
                  setModalOpen(true);
                }}
                className="bg-accent-500 text-white hover:bg-accent-600 gap-1.5 text-xs font-bold"
              >
                <PlusIcon className="h-4 w-4" />
                Assign Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Display: Card View or Table View */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <FolderIcon className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
          <h3 className="text-base font-bold text-neutral-800">
            {currentIntern
              ? `No projects found for ${currentIntern.name}`
              : 'No project assignments found'}
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            {currentIntern
              ? 'Click below to assign a project to this intern and begin tracking their deliverables.'
              : 'Use the button below to assign a project to an intern.'}
          </p>
          <div className="mt-5">
            <Button
              onClick={() => {
                setEditingAssignment(null);
                setModalOpen(true);
              }}
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Assign Project Now
            </Button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => {
            const internName = assignment.intern_name || assignment.internName;
            const internRole = assignment.intern_role || assignment.internRole;
            const projectName = assignment.project_name || assignment.projectName;
            const mentorName = assignment.mentor_name || assignment.mentorName || 'Admin';
            const startDate = assignment.start_date || assignment.startDate;
            const endDate = assignment.end_date || assignment.endDate;
            const status = assignment.status || 'In Progress';
            const tone = STATUS_TONES[status] || 'neutral';

            return (
              <div
                key={assignment.id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Header: Status & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge tone={tone}>{status}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setModalOpen(true);
                        }}
                        title="Edit Assignment"
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(assignment.id)}
                        title="Delete Assignment"
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 transition"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Project Title */}
                  <div className="flex items-center gap-2 mb-2">
                    <BriefcaseIcon className="h-4 w-4 text-primary-600 shrink-0" />
                    <h3 className="text-base font-bold text-neutral-900 leading-snug truncate">
                      {projectName}
                    </h3>
                  </div>

                  {/* Intern Information Tag */}
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-[11px] font-bold text-primary-700">
                      {internName
                        ?.split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {internName}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {internRole}
                      </p>
                    </div>
                  </div>

                  {/* Mentor(s) & Dates */}
                  <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-start gap-2">
                      <UserIcon className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-neutral-500">
                          {mentorName.includes(',') ? 'Mentors:' : 'Mentor:'}
                        </span>
                        {mentorName.split(',').map((m, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-xs font-semibold text-neutral-800"
                          >
                            {m.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span>
                        Started:{' '}
                        <strong className="text-neutral-800">
                          {startDate ? formatDate(startDate, 'dd MMM yyyy') : 'N/A'}
                        </strong>
                        {endDate && (
                          <>
                            {' '}
                            • Due:{' '}
                            <strong className="text-neutral-800">
                              {formatDate(endDate, 'dd MMM yyyy')}
                            </strong>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Description snippet */}
                  {assignment.description && (
                    <div className="mt-3 rounded-lg bg-neutral-50/80 p-2.5 text-xs text-neutral-600 line-clamp-2 border border-neutral-100">
                      {assignment.description}
                    </div>
                  )}
                </div>

                {/* Card Footer: Quick Status Changer */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-500">Status:</span>
                  <StatusDropdown
                    value={status}
                    onChange={(newStatus) => handleQuickStatusChange(assignment.id, newStatus)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Intern</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Mentor</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAssignments.map((assignment) => {
                  const internName = assignment.intern_name || assignment.internName;
                  const internRole = assignment.intern_role || assignment.internRole;
                  const projectName = assignment.project_name || assignment.projectName;
                  const mentorName = assignment.mentor_name || assignment.mentorName || 'Admin';
                  const startDate = assignment.start_date || assignment.startDate;
                  const status = assignment.status || 'In Progress';
                  const tone = STATUS_TONES[status] || 'neutral';

                  return (
                    <tr key={assignment.id} className="hover:bg-neutral-50/70 transition">
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {internName}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {internRole}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-800">
                        {projectName}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        <div className="flex flex-wrap gap-1">
                          {mentorName.split(',').map((m, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-800"
                            >
                              {m.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {startDate ? formatDate(startDate, 'dd MMM yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusDropdown
                          value={status}
                          onChange={(newStatus) => handleQuickStatusChange(assignment.id, newStatus)}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssignment(assignment);
                              setModalOpen(true);
                            }}
                            title="Edit Assignment"
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(assignment.id)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <ProjectAssignmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
        assignment={editingAssignment}
        preselectedIntern={currentIntern}
        interns={allInterns}
        employees={rawEmployees}
        projects={rawProjects}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteConfirmId)}
        title="Remove Project Assignment"
        message="Are you sure you want to remove this project assignment? This will unlink the project from the intern."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
        confirmText="Remove"
        confirmVariant="danger"
      />
    </div>
  );
}
