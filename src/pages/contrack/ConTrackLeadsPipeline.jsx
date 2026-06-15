import { useState, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import { PlusIcon, ViewColumnsIcon, ListBulletIcon, TruckIcon } from '@heroicons/react/24/outline';
import ConTrackLeadFormModal from './ConTrackLeadFormModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';

const STAGES = [
  'New Lead',
  'Demo Scheduled',
  'Demo Completed',
  'Trial',
  'Negotiation',
  'Customer',
  'Lost'
];

const STAGE_COLORS = {
  'New Lead': 'bg-blue-500',
  'Demo Scheduled': 'bg-purple-500',
  'Demo Completed': 'bg-indigo-500',
  'Trial': 'bg-fuchsia-500',
  'Negotiation': 'bg-orange-500',
  'Customer': 'bg-emerald-500',
  'Lost': 'bg-red-500'
};

const PROJECT_TYPE_COLORS = {
  'Road': 'bg-slate-600',
  'Bridge': 'bg-blue-600',
  'Road + Bridge': 'bg-indigo-600'
};

export default function ConTrackLeadsPipeline() {
  const [viewMode, setViewMode] = useState('kanban');
  const { items: leads, refetch } = useSupabaseCollection('contrack_leads');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const handleOpenModal = (lead = null) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = async (formData) => {
    try {
      if (selectedLead) {
        await updateDocument('contrack_leads', selectedLead.id, formData);
      } else {
        await createDocument('contrack_leads', formData);
      }
      refetch();
      toast.success(selectedLead ? 'Lead updated' : 'Lead created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save lead: ' + err.message);
    }
  };

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, status) => {
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== status) {
      try {
        await updateDocument('contrack_leads', lead.id, { status });
        toast.success(`Moved to ${status}`);
        refetch();
      } catch (err) {
        toast.error('Failed to move lead: ' + err.message);
      }
    }
  };

  // KPI Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const leadsThisMonth = leads.filter(l => {
    const d = new Date(l.created_at || new Date());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const openLeads = leads.filter(l => l.status !== 'Customer' && l.status !== 'Lost');
  const pipelineValue = openLeads.reduce((sum, l) => sum + (parseFloat(l.expectedValue) || 0), 0);

  const closedWon = leads.filter(l => l.status === 'Customer').length;
  const closedLost = leads.filter(l => l.status === 'Lost').length;
  const totalClosed = closedWon + closedLost;
  const conversionRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : '0.0';

  const wonLeads = leads.filter(l => l.status === 'Customer');
  const wonValue = wonLeads.reduce((sum, l) => sum + (parseFloat(l.expectedValue) || 0), 0);
  const avgDealSize = wonLeads.length > 0 ? (wonValue / wonLeads.length).toFixed(0) : '0';

  const formatCurrencyShort = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num}`;
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 -m-6 p-6 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">ConTrack Leads</h1>
          <p className="text-sm text-neutral-500">Pipeline · scoring · contractors</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-neutral-100 rounded-lg p-1 border border-neutral-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <ViewColumnsIcon className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <ListBulletIcon className="w-4 h-4" /> List
            </button>
          </div>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4" /> New lead
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Leads This Month</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{leadsThisMonth.length}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">Total</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pipeline Value</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrencyShort(pipelineValue)}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">open opps</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Conversion Rate</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{conversionRate}%</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">lead → customer</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Avg Deal Size</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrencyShort(avgDealSize)}</div>
            <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">won</div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 h-[600px] snap-x">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.status === stage);
            const stageValue = stageLeads.reduce((sum, l) => sum + (parseFloat(l.expectedValue) || 0), 0);

            return (
              <div 
                key={stage} 
                className="flex-shrink-0 w-80 bg-neutral-50/50 rounded-2xl border border-neutral-200 flex flex-col snap-start"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="p-4 border-b border-neutral-200 bg-white/50 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`}></div>
                    <h3 className="font-semibold text-neutral-900 text-sm">{stage} <span className="text-neutral-400 font-normal ml-1">{stageLeads.length}</span></h3>
                  </div>
                  <span className="text-xs font-medium text-neutral-500">{formatCurrencyShort(stageValue)}</span>
                </div>

                <div className="p-3 overflow-y-auto flex-1 space-y-3 min-h-[150px]">
                  {stageLeads.length === 0 ? (
                    <div className="h-24 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center text-xs text-neutral-400 font-medium bg-neutral-50/30">
                      Drop lead here
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div 
                        key={lead.id} 
                        className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => handleOpenModal(lead)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-neutral-900 text-sm leading-tight">{lead.companyName}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${PROJECT_TYPE_COLORS[lead.projectType] || 'bg-slate-500'}`}>
                            {lead.projectType}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mb-3 line-clamp-1">{lead.contractorName} • {lead.city}</p>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100">
                          <span className="text-sm font-semibold text-neutral-900">{formatCurrencyShort(lead.expectedValue)}</span>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700 border border-primary-200" title={lead.contactPerson}>
                            {lead.contactPerson.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-4 font-semibold">Company</th>
                  <th className="px-6 py-4 font-semibold">Contractor</th>
                  <th className="px-6 py-4 font-semibold">Project Type</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Value</th>
                  <th className="px-6 py-4 font-semibold text-right">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-neutral-500">
                      No leads found. Switch to board view or create a new lead.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => handleOpenModal(lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900">{lead.companyName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                        {lead.contractorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white ${PROJECT_TYPE_COLORS[lead.projectType] || 'bg-slate-500'}`}>
                          {lead.projectType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                        {lead.city}, {lead.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-neutral-900">
                        {formatCurrencyShort(lead.expectedValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[lead.status]}`}></div>
                          <span className="text-xs font-medium text-neutral-700">{lead.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConTrackLeadFormModal
        open={isModalOpen}
        lead={selectedLead}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
      />
    </div>
  );
}
