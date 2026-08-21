import { useState } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { PlusIcon, ShieldCheckIcon, CurrencyRupeeIcon, ArrowPathIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import AmcFormModal from './AmcFormModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';
import { useAmcNotifier } from '../../hooks/useAmcNotifier';
import NotificationsDropdown from '../../components/layout/NotificationsDropdown';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function AmcList() {
  useAmcNotifier();
  const { items: amcs, refetch: refetchAmcs } = useSupabaseCollection('amcs');
  const { items: clients } = useSupabaseCollection('clients');
  const { items: projects } = useSupabaseCollection('projects');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const handleOpenModal = (amc = null) => {
    setSelectedAmc(amc);
    setIsModalOpen(true);
  };

  const handleSaveAmc = async (payload) => {
    try {
      if (selectedAmc) {
        await updateDocument('amcs', selectedAmc.id, payload);
        toast.success('AMC updated successfully');
      } else {
        await createDocument('amcs', payload);
        toast.success('AMC created successfully');
      }
      refetchAmcs();
    } catch (error) {
      toast.error('Failed to save AMC: ' + error.message);
      throw error;
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setConfirmDelete({ open: true, id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await removeDocument('amcs', confirmDelete.id);
      toast.success('AMC deleted successfully');
      refetchAmcs();
    } catch (error) {
      toast.error('Failed to delete AMC: ' + error.message);
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  // KPIs
  const activeAmcs = amcs.filter(a => a.status === 'Active' || a.status === 'At Risk');
  const activeCount = activeAmcs.length;

  const totalValue = activeAmcs.reduce((sum, a) => sum + (parseFloat(a.annualValue) || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next60Days = new Date(today);
  next60Days.setDate(next60Days.getDate() + 60);

  const renewalsNext60 = activeAmcs.filter(a => {
    if (!a.renewalDate) return false;
    const renewal = new Date(a.renewalDate);
    return renewal >= today && renewal <= next60Days;
  });
  const renewals60Count = renewalsNext60.length;
  const renewals60Value = renewalsNext60.reduce((sum, a) => sum + (parseFloat(a.annualValue) || 0), 0);

  const atRiskCount = amcs.filter(a => a.status === 'At Risk').length;

  const formatCurrencyShort = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${value}`;
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    const diffTime = d - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    return `${diffDays}d`;
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <PageHeader
        eyebrow="Revenue"
        title="AMC Management"
        description="Recurring maintenance contracts · renewals · reminders"
        className="mb-8"
        actions={
          <div className="flex items-center gap-3">
            <NotificationsDropdown showAmc={true} />
            <Button className="gap-2" onClick={() => handleOpenModal()}>
              <PlusIcon className="h-4 w-4" /> New AMC
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Contracts</div>
            <ShieldCheckIcon className="h-4 w-4 text-neutral-400" />
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
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Annual AMC Value</div>
            <CurrencyRupeeIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrencyShort(totalValue)}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              Annual Revenue
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Renewals Next 60D</div>
            <ArrowPathIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{renewals60Count}</div>
            <div className="text-xs text-neutral-500">{formatCurrencyShort(renewals60Value)} value</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">At Risk</div>
            <ExclamationTriangleIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{atRiskCount}</div>
            <div className="text-xs text-danger-500 font-medium">needs outreach</div>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-900">Contracts</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-white text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Project</th>
                <th className="px-6 py-4 font-semibold text-right">Annual Value</th>
                <th className="px-6 py-4 font-semibold">Renewal</th>
                <th className="px-6 py-4 font-semibold text-center">In</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {amcs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-neutral-500">
                    No AMCs found. Add your first contract to get started.
                  </td>
                </tr>
              ) : (
                amcs.map((amc) => {
                  const client = clients.find(c => c.id === amc.clientId);
                  const project = projects.find(p => p.id === amc.projectId);

                  return (
                    <tr
                      key={amc.id}
                      className="hover:bg-neutral-50 cursor-pointer transition-colors group"
                      onClick={() => handleOpenModal(amc)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900">{client?.companyName || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                        {project?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-neutral-900">
                        {formatCurrencyShort(amc.annualValue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                        {amc.renewalDate ? formatDate(amc.renewalDate, 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-neutral-900">
                        {getDaysRemaining(amc.renewalDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${amc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          amc.status === 'At Risk' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            amc.status === 'Renewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                          {amc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => handleDelete(e, amc.id)}
                          className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AmcFormModal
        open={isModalOpen}
        amc={selectedAmc}
        clients={clients}
        projects={projects}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAmc}
      />

      <ConfirmModal
        open={confirmDelete.open}
        title="Confirm Deletion"
        message="Are you sure you want to delete this AMC? This action cannot be undone."
        confirmText="Delete AMC"
        confirmVariant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  );
}
