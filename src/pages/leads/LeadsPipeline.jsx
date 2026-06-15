import { useState, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import { FunnelIcon, PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LeadFormModal from './LeadFormModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';

const STAGES = [
  'New Lead',
  'Contacted',
  'Demo Scheduled',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const STAGE_COLORS = {
  'New Lead': 'bg-blue-500',
  'Contacted': 'bg-indigo-500',
  'Demo Scheduled': 'bg-purple-500',
  'Meeting Scheduled': 'bg-fuchsia-500',
  'Proposal Sent': 'bg-pink-500',
  'Negotiation': 'bg-rose-500',
  'Won': 'bg-emerald-500',
  'Lost': 'bg-red-500'
};

const SOURCE_COLORS = {
  'Website': 'bg-emerald-500',
  'LinkedIn': 'bg-blue-600',
  'Referral': 'bg-purple-500',
  'Cold Outreach': 'bg-slate-600',
  'Inbound': 'bg-emerald-400',
  'Outbound': 'bg-indigo-500',
  'Ads': 'bg-emerald-500',
  'Other': 'bg-slate-500'
};

export default function LeadsPipeline() {
  const { items: leads, refetch } = useSupabaseCollection('leads');
  const { items: employees } = useSupabaseCollection('employees');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const handleOpenModal = (lead = null) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = async (formData) => {
    try {
      if (selectedLead) {
        await updateDocument('leads', selectedLead.id, formData);
      } else {
        await createDocument('leads', formData);
      }
      refetch();
    } catch (err) {
      console.error(err);
      throw new Error('Database operation failed');
    }
  };

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, stage) => {
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.stage !== stage) {
      try {
        await updateDocument('leads', lead.id, { stage });
        toast.success(`Moved to ${stage}`);
        refetch();
      } catch (err) {
        toast.error('Failed to move lead');
      }
    }
  };

  // KPIs
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const leadsThisMonth = leads.filter(l => l.created_at >= currentMonthStart).length;

  const pipelineValue = leads
    .filter(l => !['Won', 'Lost'].includes(l.stage))
    .reduce((sum, l) => sum + (Number(l.expectedValue) || 0), 0);

  const wonLeads = leads.filter(l => l.stage === 'Won');
  const conversionRate = leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : 0;

  const avgDealSize = wonLeads.length > 0
    ? wonLeads.reduce((sum, l) => sum + (Number(l.expectedValue) || 0), 0) / wonLeads.length
    : 0;

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 -m-6 p-6 min-h-[calc(100vh-64px)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Leads</h1>
          <p className="text-sm text-neutral-500">Pipeline · scoring · follow-ups · forecast</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 gap-2">
            <FunnelIcon className="h-4 w-4" /> Filter
          </Button>
          <Button className="gap-2" onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4" /> New lead
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Leads this month</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{leadsThisMonth}</div>
            <div className="text-sm font-medium text-emerald-600">Total</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Pipeline Value</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrency(pipelineValue)}</div>
            <div className="text-sm font-medium text-emerald-600">open opps</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Conversion Rate</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{conversionRate}%</div>
            <div className="text-sm font-medium text-emerald-600">lead → won</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Avg Deal Size</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{formatCurrency(avgDealSize)}</div>
            <div className="text-sm font-medium text-emerald-600">won</div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full items-start">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.stage === stage);
            const stageValue = stageLeads.reduce((sum, l) => sum + (Number(l.expectedValue) || 0), 0);

            return (
              <div
                key={stage}
                className="w-[300px] flex flex-col h-full bg-transparent"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage] || 'bg-slate-500'}`}></div>
                    <span className="font-semibold text-sm text-neutral-900">{stage}</span>
                    <span className="text-xs text-neutral-500 ml-1">{stageLeads.length}</span>
                  </div>
                  <div className="text-xs text-neutral-500 font-medium">
                    {formatCurrency(stageValue)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => handleOpenModal(lead)}
                      className="bg-white rounded-xl p-4 border border-neutral-200 cursor-pointer hover:border-primary-500/50 transition-colors shadow-sm hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-neutral-900 truncate pr-2">{lead.companyName}</div>
                        {lead.probability ? (
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {lead.probability}%
                          </div>
                        ) : null}
                      </div>
                      <div className="text-xs text-neutral-500 mb-1">{lead.contactPerson}</div>
                      {lead.nextFollowUp && (
                        <div className="text-[10px] text-amber-600 font-medium mb-3 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Follow-up: {formatDate(lead.nextFollowUp, 'dd MMM yyyy')}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(lead.expectedValue || 0)}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{lead.leadSource}</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${SOURCE_COLORS[lead.leadSource] || 'bg-slate-600'}`}>
                            {lead.companyName?.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty drop zone placeholder */}
                  {stageLeads.length === 0 && (
                    <div className="h-24 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 flex items-center justify-center text-xs text-neutral-400">
                      Drop lead here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LeadFormModal
        open={isModalOpen}
        lead={selectedLead}
        leads={leads}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
      />
    </div>
  );
}
