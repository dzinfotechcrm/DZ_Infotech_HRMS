import { useState, useMemo } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument } from '../../supabase/db';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { FunnelIcon, PlusIcon, CalendarIcon, ListBulletIcon, ViewColumnsIcon, BarsArrowDownIcon } from '@heroicons/react/24/outline';
import LeadFormModal from './LeadFormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateHelpers';

const STAGES = [
  'New Lead',
  'Contacted',
  'Demo Preparation',
  'Meeting Scheduled',
  'Meeting Completed',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const STAGE_ACTIONS = {
  'New Lead': 'Call Client',
  'Contacted': 'Prepare Demo',
  'Demo Preparation': 'Schedule Meeting',
  'Meeting Scheduled': 'Meeting',
  'Meeting Completed': 'Send Proposal',
  'Proposal Sent': 'Negotiate',
  'Negotiation': 'Collect Advance',
  'Won': 'Start Project'
};

const STAGE_COLORS = {
  'New Lead': 'bg-blue-500',
  'Contacted': 'bg-indigo-500',
  'Demo Preparation': 'bg-purple-500',
  'Meeting Scheduled': 'bg-fuchsia-500',
  'Meeting Completed': 'bg-violet-500',
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
  'PA': 'bg-slate-500'
};

const SORT_OPTIONS = [
  { value: 'amount-asc', label: 'Amount (Low to High)' },
  { value: 'amount-desc', label: 'Amount (High to Low)' },
  { value: 'alpha-asc', label: 'Alphabetical (A-Z)' },
  { value: 'alpha-desc', label: 'Alphabetical (Z-A)' },
  { value: 'date-asc', label: 'Follow-Up Date (Earliest)' },
  { value: 'date-desc', label: 'Follow-Up Date (Latest)' }
];

export default function LeadsPipeline() {
  const [viewMode, setViewMode] = useState('kanban');
  const { items: leads, refetch } = useSupabaseCollection('leads');
  const { items: employees } = useSupabaseCollection('employees');
  const { items: clients, refetch: refetchClients } = useSupabaseCollection('clients');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Filter & Sort State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState({ open: false, leadId: null, stage: null });
  const [filterSource, setFilterSource] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterFollowUp, setFilterFollowUp] = useState('');
  const [filterInterest, setFilterInterest] = useState('');
  const [sortBy, setSortBy] = useState('');

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (filterSource) {
      result = result.filter(l => l.leadSource === filterSource);
    }
    if (filterAssignee) {
      result = result.filter(l => l.assignedTo === filterAssignee);
    }
    if (filterFollowUp) {
      result = result.filter(l => l.nextFollowUp && l.nextFollowUp.startsWith(filterFollowUp));
    }

    if (filterInterest) {
      result = result.filter(l => l.interestLevel === filterInterest);
    }

    if (sortBy) {
      result.sort((a, b) => {
        if (sortBy === 'amount-asc') {
          return (Number(a.expectedValue) || 0) - (Number(b.expectedValue) || 0);
        }
        if (sortBy === 'amount-desc') {
          return (Number(b.expectedValue) || 0) - (Number(a.expectedValue) || 0);
        }
        if (sortBy === 'alpha-asc') {
          return (a.companyName || '').localeCompare(b.companyName || '');
        }
        if (sortBy === 'alpha-desc') {
          return (b.companyName || '').localeCompare(a.companyName || '');
        }
        if (sortBy === 'date-asc') {
          return new Date(a.nextFollowUp || '9999-12-31') - new Date(b.nextFollowUp || '9999-12-31');
        }
        if (sortBy === 'date-desc') {
          return new Date(b.nextFollowUp || '1970-01-01') - new Date(a.nextFollowUp || '1970-01-01');
        }
        return 0;
      });
    }

    return result;
  }, [leads, filterSource, filterAssignee, filterFollowUp, filterInterest, sortBy]);

  const createClientFromLead = async (lead, initialStatus = 'Active') => {
    try {
      const existing = clients.find(c => c.companyName === lead.companyName);
      if (existing) {
        await updateDocument('clients', existing.id, { status: initialStatus });
        refetchClients();
        toast.success(`Client ${lead.companyName} updated to ${initialStatus}`);
        return;
      }

      let maxId = 0;
      clients.forEach(c => {
        if (c.clientId && c.clientId.startsWith('CL-')) {
          const num = parseInt(c.clientId.replace('CL-', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
      });
      const nextId = `CL-${String(maxId + 1).padStart(4, '0')}`;

      const clientData = {
        clientId: nextId,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.address || '',
        industry: lead.industry || '',
        projects: 0,
        ltv: lead.expectedValue || 0,
        owner: lead.assignedTo || '',
        status: initialStatus,
        since: new Date().toISOString().split('T')[0],
        notes: `Converted from lead ${lead.leadId || ''}`
      };

      await createDocument('clients', clientData);
      refetchClients();
      toast.success('Client auto-created successfully!');
    } catch (error) {
      console.error('Failed to create client', error);
      toast.error('Failed to auto-create client: ' + error.message);
    }
  };

  const handleOpenModal = (lead = null) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = async (formData) => {
    try {
      const isNewWon = formData.stage === 'Won' && (!selectedLead || selectedLead.stage !== 'Won');
      const isNewLead = !selectedLead;

      if (selectedLead) {
        await updateDocument('leads', selectedLead.id, formData);
      } else {
        await createDocument('leads', formData);
      }

      if (isNewWon) {
        await createClientFromLead(formData, 'Onboarding');
      }

      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Database operation failed: ' + err.message);
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
      setConfirmDrop({ open: true, leadId, stage });
    }
  };

  const executeDrop = async () => {
    const { leadId, stage } = confirmDrop;
    setConfirmDrop({ open: false, leadId: null, stage: null });
    const lead = leads.find(l => l.id === leadId);

    if (lead && lead.stage !== stage) {
      try {
        await updateDocument('leads', lead.id, { stage });
        toast.success(`Moved to ${stage}`);
        if (stage === 'Won') {
          await createClientFromLead({ ...lead, stage }, 'Onboarding');
        }
        refetch();
      } catch (err) {
        toast.error('Failed to move lead: ' + err.message);
      }
    }
  };

  // KPIs
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const leadsThisMonth = filteredLeads.filter(l => l.created_at >= currentMonthStart).length;

  const pipelineValue = filteredLeads
    .filter(l => !['Won', 'Lost'].includes(l.stage))
    .reduce((sum, l) => sum + (Number(l.expectedValue) || 0), 0);

  const wonLeads = filteredLeads.filter(l => l.stage === 'Won');
  const conversionRate = filteredLeads.length > 0 ? ((wonLeads.length / filteredLeads.length) * 100).toFixed(1) : 0;

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
        <div className="flex gap-3 items-center">
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'kanban' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <ViewColumnsIcon className="h-4 w-4" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <ListBulletIcon className="h-4 w-4" /> List
            </button>
          </div>
          <div className="relative">
            <Button
              variant="secondary"
              className={`bg-white border-neutral-200 gap-2 ${isSortOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : 'text-neutral-700 hover:bg-neutral-50'}`}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <BarsArrowDownIcon className="h-4 w-4" /> Sort
            </Button>
            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-200 rounded-xl shadow-soft py-2 z-50">
                <div className="flex justify-between items-center px-4 pb-2 mb-2 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900 text-sm">Sort By</h3>
                  {sortBy && (
                    <button
                      onClick={() => setSortBy('')}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                        sortBy === option.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <Button
              variant="secondary"
              className={`bg-white border-neutral-200 gap-2 ${isFilterOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : 'text-neutral-700 hover:bg-neutral-50'}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FunnelIcon className="h-4 w-4" /> Filter
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-soft p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-neutral-900 text-sm">Filters</h3>
                  <button
                    onClick={() => {
                      setFilterSource('');
                      setFilterAssignee('');
                      setFilterFollowUp('');
                      setFilterInterest('');
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 -mx-1">

                  <Select
                    label="Lead Source"
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                  >
                    <option value="">All Sources</option>
                    {Object.keys(SOURCE_COLORS).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>

                  <Select
                    label="Assigned To"
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                  >
                    <option value="">Anyone</option>
                    {employees?.map(emp => (
                      <option key={emp.id || emp.uid} value={emp.id || emp.uid}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Follow-up Date"
                    type="date"
                    value={filterFollowUp}
                    onChange={(e) => setFilterFollowUp(e.target.value)}
                  />

                  <Select
                    label="Interest Level"
                    value={filterInterest}
                    onChange={(e) => setFilterInterest(e.target.value)}
                  >
                    <option value="">All Levels</option>
                    <option value="Very Interested">Very Interested</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                  </Select>
                </div>
              </div>
            )}
          </div>
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

      {/* Kanban Board vs List View */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max h-full items-start">
            {STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage);
              const stageValue = stageLeads.reduce((sum, l) => sum + (Number(l.expectedValue) || 0), 0);

              return (
                <div
                  key={stage}
                  className="w-[300px] flex flex-col h-full bg-transparent"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  {/* Stage Header */}
                  <div className="mb-4 px-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage] || 'bg-slate-500'}`}></div>
                        <span className="font-semibold text-sm text-neutral-900">{stage}</span>
                        <span className="text-xs text-neutral-500 ml-1">{stageLeads.length}</span>
                      </div>
                      <div className="text-xs text-neutral-500 font-medium">
                        {formatCurrency(stageValue)}
                      </div>
                    </div>
                    {STAGE_ACTIONS[stage] && (
                      <div className="text-xs text-neutral-500 italic mt-1 ml-4">
                        Action: {STAGE_ACTIONS[stage]}
                      </div>
                    )}
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
                          {lead.interestLevel ? (
                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${lead.interestLevel === 'Very Interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              lead.interestLevel === 'Interested' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-neutral-50 text-neutral-700 border-neutral-200'
                              }`}>
                              {lead.interestLevel}
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
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1 flex flex-col mb-4">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider bg-white">
                  <th className="px-6 py-4 font-semibold">Lead</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold text-center">Stage</th>
                  <th className="px-6 py-4 font-semibold text-right">Value</th>
                  <th className="px-6 py-4 font-semibold text-right">Interest Level</th>
                  <th className="px-6 py-4 font-semibold text-center">Assigned To</th>
                  <th className="px-6 py-4 font-semibold text-center">Next Follow-Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-neutral-500">
                      No leads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const assignee = employees.find(e => e.uid === lead.assignedTo || e.id === lead.assignedTo);
                    const assigneeInitials = assignee ? `${assignee.firstName?.[0] || ''}${assignee.lastName?.[0] || ''}`.toUpperCase() : 'UN';
                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-neutral-50 cursor-pointer transition-colors"
                        onClick={() => handleOpenModal(lead)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-neutral-900">{lead.companyName}</div>
                          <div className="text-xs text-neutral-500">{lead.leadSource || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          <div>{lead.contactPerson}</div>
                          <div className="text-xs">{lead.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] || 'bg-slate-500'} text-white`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 text-right">
                          {formatCurrency(lead.expectedValue || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 text-right">
                          {lead.interestLevel || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center">
                            {lead.assignedTo ? (
                              <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold ring-2 ring-white" title={assignee ? `${assignee.firstName} ${assignee.lastName}` : ''}>
                                {assigneeInitials}
                              </div>
                            ) : (
                              <span className="text-sm text-neutral-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 text-center">
                          {lead.nextFollowUp ? formatDate(lead.nextFollowUp, 'dd MMM yyyy') : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeadFormModal
        open={isModalOpen}
        lead={selectedLead}
        leads={leads}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
      />
      <ConfirmModal
        open={confirmDrop.open}
        title="Confirm Status Change"
        message={<span>Are you sure you want to move this lead to <strong>{confirmDrop.stage}</strong>?</span>}
        onConfirm={executeDrop}
        onCancel={() => setConfirmDrop({ open: false, leadId: null, stage: null })}
        confirmText="Move Lead"
      />
    </div>
  );
}
