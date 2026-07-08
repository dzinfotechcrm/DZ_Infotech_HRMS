import { useState } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import { PlusIcon, FolderIcon, ChartBarIcon, ExclamationTriangleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProjectFormModal from './ProjectFormModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';

const STAGES = [
  'Requirements',
  'Design',
  'Development',
  'Testing',
  'Client Review',
  'Deployment',
  'Completed'
];

export default function ProjectsList() {
  const { items: projects, refetch: refetchProjects } = useSupabaseCollection('projects');
  const { items: clients } = useSupabaseCollection('clients');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleOpenModal = (project = null) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (payload) => {
    try {
      if (selectedProject) {
        await updateDocument('projects', selectedProject.id, payload);
        toast.success('Project updated successfully');
      } else {
        // Generate projectId
        let maxId = 0;
        projects.forEach(p => {
          if (p.projectId && p.projectId.startsWith('P-')) {
            const num = parseInt(p.projectId.replace('P-', ''), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });
        const nextId = `P-${String(maxId + 1).padStart(3, '0')}`;
        payload.projectId = nextId;

        await createDocument('projects', payload);

        // Auto-increment client project count in database
        const clientToUpdate = clients.find(c => c.id === payload.clientId);
        if (clientToUpdate) {
          const currentCount = Number(clientToUpdate.projects) || 0;
          await updateDocument('clients', payload.clientId, { projects: currentCount + 1 });
        }

        toast.success('Project created successfully');
      }
      refetchProjects();
    } catch (error) {
      toast.error('Failed to save project: ' + error.message);
      throw error;
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const projectToDelete = projects.find(p => p.id === id);
        await removeDocument('projects', id);

        // Auto-decrement client project count in database
        if (projectToDelete && projectToDelete.clientId) {
          const clientToUpdate = clients.find(c => c.id === projectToDelete.clientId);
          if (clientToUpdate) {
            const currentCount = Number(clientToUpdate.projects) || 0;
            await updateDocument('clients', projectToDelete.clientId, { projects: Math.max(0, currentCount - 1) });
          }
        }

        toast.success('Project deleted successfully');
        refetchProjects();
      } catch (error) {
        toast.error('Failed to delete project: ' + error.message);
      }
    }
  };

  // KPIs calculations
  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const activeCount = activeProjects.length;

  // Define "On Track" as not past deadline (simplified)
  const today = new Date().toISOString().split('T')[0];
  const onTrackCount = activeProjects.filter(p => !p.deadline || p.deadline >= today).length;
  const onTrackPercent = activeCount > 0 ? Math.round((onTrackCount / activeCount) * 100) : 0;

  const atRiskCount = activeProjects.filter(p => p.deadline && p.deadline < today).length;

  // Calculate Average Cycle Time based on Completed projects
  const completedProjects = projects.filter(p => p.status === 'Completed' && p.startDate && p.deadline);
  let totalDays = 0;
  completedProjects.forEach(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.deadline); // assuming deadline was when it ended, or we can use updated_at
    const diff = Math.max((end - start) / (1000 * 60 * 60 * 24), 0);
    totalDays += diff;
  });
  const avgCycleTime = completedProjects.length > 0 ? Math.round(totalDays / completedProjects.length) : 0;

  const getProgressPercent = (status) => {
    const index = STAGES.indexOf(status);
    if (index === -1) return 0;
    if (index === STAGES.length - 1) return 100;
    // Calculate percentage based on stages. e.g. 6 stages before completed = 16% per stage.
    return Math.round(((index + 1) / STAGES.length) * 100);
  };

  const getStageTheme = (index, isAtRisk) => {
    if (isAtRisk) {
      return { bg: 'bg-rose-600', text: 'text-rose-600', badgeBg: 'bg-rose-50', badgeBorder: 'border-rose-200', badgeText: 'text-rose-700' };
    }
    const themes = [
      { bg: 'bg-red-500', text: 'text-red-600', badgeBg: 'bg-red-50', badgeBorder: 'border-red-200', badgeText: 'text-red-700' }, // Requirements
      { bg: 'bg-orange-500', text: 'text-orange-600', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200', badgeText: 'text-orange-700' }, // Design
      { bg: 'bg-amber-500', text: 'text-amber-600', badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-200', badgeText: 'text-amber-700' }, // Development
      { bg: 'bg-yellow-400', text: 'text-yellow-600', badgeBg: 'bg-yellow-50', badgeBorder: 'border-yellow-200', badgeText: 'text-yellow-700' }, // Testing
      { bg: 'bg-lime-500', text: 'text-lime-600', badgeBg: 'bg-lime-50', badgeBorder: 'border-lime-200', badgeText: 'text-lime-700' }, // Client Review
      { bg: 'bg-emerald-500', text: 'text-emerald-600', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-700' }, // Deployment
      { bg: 'bg-green-600', text: 'text-green-700', badgeBg: 'bg-green-50', badgeBorder: 'border-green-200', badgeText: 'text-green-800' }, // Completed
    ];
    return themes[index] || themes[0];
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Projects</h1>
          <p className="text-sm text-neutral-500">Workflow · tasks · health · timelines</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Projects</div>
            <FolderIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{activeCount}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              Active
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">On Track</div>
            <ChartBarIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{onTrackCount}</div>
            <div className="text-xs text-neutral-500">{onTrackPercent}% of active</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">At Risk</div>
            <ExclamationTriangleIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{atRiskCount}</div>
            <div className="text-xs text-danger-500 font-medium">needs attention</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Avg Cycle Time</div>
            <ClockIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{avgCycleTime}d</div>
            <div className="text-xs text-neutral-500">kickoff → deploy</div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-900">All projects</h2>
        </div>
        <div className="overflow-x-auto flex-1 p-6 space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No projects found. Start by creating a new one!
            </div>
          ) : (
            projects.map((project) => {
              const client = clients.find(c => c.id === project.clientId);
              const clientName = client?.companyName || 'Unknown Client';
              const clientInitials = clientName.substring(0, 2).toUpperCase();
              const progress = getProgressPercent(project.status);
              const currentStageIndex = STAGES.indexOf(project.status);
              const isAtRisk = project.deadline && project.deadline < today && project.status !== 'Completed';
              const currentTheme = getStageTheme(currentStageIndex, isAtRisk);

              return (
                <div
                  key={project.id}
                  className={`bg-white border ${project.status === 'Completed' ? 'border-emerald-200 opacity-75 hover:opacity-100' : 'border-neutral-200'} rounded-xl p-5 hover:border-primary-300 transition-colors cursor-pointer relative group`}
                  onClick={() => handleOpenModal(project)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neutral-500">{project.projectId}</span>
                        {/* Health indicator logic (simplified) */}
                        {project.status !== 'Completed' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isAtRisk ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            Health {isAtRisk ? 'At Risk' : 'Good'}
                          </span>
                        )}
                        {project.status === 'Completed' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900">{project.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {clientName} · due {project.deadline ? formatDate(project.deadline, 'MMM dd') : 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 border border-primary-200" title={clientName}>
                        {clientInitials}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${currentTheme.badgeBg} ${currentTheme.badgeText} ${currentTheme.badgeBorder}`}>
                        {project.status}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-1 hover:bg-red-50 rounded"
                        title="Delete Project"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress visualization */}
                  <div className="mt-6">
                    {/* Top Continuous Bar & Percentage */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div className="relative flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${currentTheme.bg}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-neutral-700 ml-4 w-8 text-right">{progress}%</span>
                    </div>

                    {/* Bottom Segmented Bars */}
                    <div className="flex gap-1 h-1.5 mb-2">
                      {STAGES.map((stage, idx) => {
                        const isCompleted = idx <= currentStageIndex;
                        const segmentTheme = getStageTheme(idx, false);
                        return (
                          <div
                            key={stage}
                            className={`flex-1 rounded-full ${isCompleted ? segmentTheme.bg : 'bg-neutral-100'}`}
                          ></div>
                        );
                      })}
                    </div>

                    {/* Stage Labels */}
                    <div className="flex justify-between px-1">
                      {STAGES.map((stage, idx) => {
                        const isActive = idx === currentStageIndex;
                        const isPast = idx < currentStageIndex;
                        return (
                          <div
                            key={stage}
                            className={`text-[9px] font-semibold w-0 flex-1 text-center truncate px-1 ${isActive ? currentTheme.text : (isPast ? 'text-neutral-600' : 'text-neutral-400')}`}
                          >
                            {stage}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ProjectFormModal
        open={isModalOpen}
        project={selectedProject}
        clients={clients}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
      />
    </div>
  );
}
