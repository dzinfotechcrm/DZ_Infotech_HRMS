import { useState } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import { PlusIcon, BriefcaseIcon, ShieldCheckIcon, DocumentTextIcon, ArrowTrendingUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import ClientFormModal from './ClientFormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../../components/ui/Badge';

const STATUS_COLORS = {
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Onboarding': 'bg-blue-50 text-blue-700 border-blue-200',
  'Inactive': 'bg-slate-50 text-slate-700 border-slate-200',
  'Churned': 'bg-red-50 text-red-700 border-red-200'
};

export default function ClientsList() {
  const { items: clients, refetch } = useSupabaseCollection('clients');
  const { items: employees } = useSupabaseCollection('employees');
  const { items: projects } = useSupabaseCollection('projects');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const handleOpenModal = (client = null) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (formData) => {
    try {
      if (selectedClient) {
        await updateDocument('clients', selectedClient.id, formData);
        toast.success('Client updated successfully');
      } else {
        await createDocument('clients', formData);
        toast.success('Client added successfully');
      }
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Database operation failed');
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await removeDocument('clients', clientToDelete.id);
      toast.success('Client deleted successfully');
      setClientToDelete(null);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete client');
    }
  };

  // KPIs
  const totalClients = clients.length;

  const lifetimeValue = clients.reduce((sum, c) => sum + (Number(c.ltv) || 0), 0);

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  // Mock data for AMC and Docs since it's not in schema
  const onAmcCount = Math.floor(totalClients * 0.52);
  const docsCount = totalClients * 7;

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 min-h-[calc(100vh-64px)]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Clients</h1>
          <p className="text-sm text-neutral-500">All accounts · projects · LTV · ownership</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4" /> New client
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Clients</div>
            <BriefcaseIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{totalClients}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <ArrowTrendingUpIcon className="h-3 w-3" /> +1
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lifetime Value</div>
            <span className="text-neutral-400 font-medium">₹</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrency(lifetimeValue)}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <ArrowTrendingUpIcon className="h-3 w-3" /> +12%
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">On AMC</div>
            <ShieldCheckIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{onAmcCount}</div>
            <div className="text-xs text-neutral-500">{totalClients > 0 ? Math.round((onAmcCount / totalClients) * 100) : 0}% of clients</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Docs on file</div>
            <DocumentTextIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{docsCount}</div>
            <div className="text-xs text-neutral-500">contracts + NDAs</div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h2 className="text-sm font-semibold text-neutral-900">All clients</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider bg-white">
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Industry</th>
                <th className="px-6 py-4 font-semibold text-center">Projects</th>
                <th className="px-6 py-4 font-semibold">LTV</th>
                <th className="px-6 py-4 font-semibold">Since</th>
                <th className="px-6 py-4 font-semibold text-center">Owner</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-neutral-500">
                    No clients found. Add your first client to get started.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const owner = employees.find(e => e.uid === client.owner || e.id === client.owner);
                  const ownerInitials = client.companyName ? client.companyName.substring(0, 2).toUpperCase() : 'DZ';

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => handleOpenModal(client)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900">{client.companyName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {client.industry || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-medium text-center">
                        {projects.filter(p => p.clientId === client.id).length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900">
                        {formatCurrency(client.ltv || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {client.since ? formatDate(client.since, 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 border border-primary-200">
                            {ownerInitials}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[client.status] || STATUS_COLORS['Active']}`}>
                          {client.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                          }}
                          className="p-1 text-neutral-400 hover:text-danger-600 transition-colors"
                          title="Delete Client"
                        >
                          <TrashIcon className="h-5 w-5" />
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

      <ClientFormModal
        open={isModalOpen}
        client={selectedClient}
        clients={clients}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
      />

      <ConfirmModal
        open={!!clientToDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${clientToDelete?.companyName || 'this client'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteClient}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
}
