import React, { useState, useMemo } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { FunnelIcon, PlusIcon, CalendarIcon, ListBulletIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const STAGES = [
  'Assigned',
  'Contacted',
  'Meeting Scheduled',
  'Meeting Completed',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const STAGE_COLORS = {
  'Assigned': 'bg-blue-500',
  'Contacted': 'bg-indigo-500',
  'Meeting Scheduled': 'bg-purple-500',
  'Meeting Completed': 'bg-fuchsia-500',
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

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val.toFixed(0)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function SfmsLeadsBoard({
  leads = [],
  teams = [],
  agents = [],
  meetings = [],
  onLeadClick,
  onNewLead,
  onStageChange
}) {
  const [viewMode, setViewMode] = useState('kanban');

  // Filter & Sort State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (filterSource) {
      result = result.filter(l => l.lead_source === filterSource);
    }
    if (filterTeam) {
      result = result.filter(l => l.team_id === filterTeam);
    }
    if (filterAgent) {
      result = result.filter(l => l.agent_id === filterAgent);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.company_name?.toLowerCase().includes(lower) ||
        l.contact_person?.toLowerCase().includes(lower) ||
        l.phone?.includes(lower)
      );
    }

    // Sort by created_at desc by default
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return result;
  }, [leads, filterSource, filterTeam, filterAgent, searchQuery]);

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
      if (onStageChange) {
        onStageChange(leadId, stage);
      }
    }
  };

  // KPIs
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const leadsThisMonth = filteredLeads.filter(l => l.created_at >= currentMonthStart).length;

  const pipelineValue = filteredLeads
    .filter(l => !['Won', 'Lost'].includes(l.stage))
    .reduce((sum, l) => sum + (Number(l.expected_revenue) || 0), 0);

  const wonLeads = filteredLeads.filter(l => l.stage === 'Won');
  const conversionRate = filteredLeads.length > 0 ? ((wonLeads.length / filteredLeads.length) * 100).toFixed(1) : 0;

  const avgDealSize = wonLeads.length > 0
    ? wonLeads.reduce((sum, l) => sum + (Number(l.expected_revenue) || 0), 0) / wonLeads.length
    : 0;

  const getLeadNextFollowUp = (leadId) => {
    const leadMeetings = meetings.filter(m => m.lead_id === leadId && m.follow_up_date);
    if (leadMeetings.length === 0) return null;
    leadMeetings.sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
    const upcoming = leadMeetings.find(m => new Date(m.follow_up_date) >= new Date(new Date().setHours(0, 0, 0, 0)));
    return upcoming ? upcoming.follow_up_date : leadMeetings[leadMeetings.length - 1].follow_up_date;
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-neutral-900 w-full min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Leads ({leads.length})</h1>
          <p className="text-sm text-neutral-500">Pipeline · scoring · follow-ups · forecast</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          <div className="w-full sm:w-auto flex-1 sm:flex-none">
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-white"
            />
          </div>

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
              className={`bg-white border-neutral-200 gap-2 whitespace-nowrap ${isFilterOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : 'text-neutral-700 hover:bg-neutral-50'}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FunnelIcon className="h-4 w-4" /> Filter
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-soft p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-neutral-900 text-sm">Filters</h3>
                  <button
                    onClick={() => {
                      setFilterSource('');
                      setFilterTeam('');
                      setFilterAgent('');
                      setSearchQuery('');
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-4">
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
                    label="Team"
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                  >
                    <option value="">Any Team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>

                  <Select
                    label="Agent"
                    value={filterAgent}
                    onChange={(e) => setFilterAgent(e.target.value)}
                  >
                    <option value="">Any Agent</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </div>
          {onNewLead && (
            <Button className="gap-2 whitespace-nowrap" onClick={onNewLead}>
              <PlusIcon className="h-4 w-4" /> New lead
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="flex-1 overflow-x-auto pb-4 min-h-[500px]">
          <div className="flex gap-4 min-w-max h-full items-start">
            {STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage);
              const stageValue = stageLeads.reduce((sum, l) => sum + (Number(l.expected_revenue) || 0), 0);

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
                    {stageLeads.map(lead => {
                      const nextFollowUp = getLeadNextFollowUp(lead.id);
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => onLeadClick && onLeadClick(lead)}
                          className="bg-white rounded-xl p-4 border border-neutral-200 cursor-pointer hover:border-primary-500/50 transition-colors shadow-sm hover:shadow-md"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-neutral-900 truncate pr-2">{lead.company_name}</div>
                            {lead.interest_level ? (
                              <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap
                              ${lead.interest_level === 'Very Interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  lead.interest_level === 'Interested' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-slate-50 text-slate-700 border-slate-200'}`}
                              >
                                {lead.interest_level === 'Very Interested' ? 'Hot' : lead.interest_level === 'Interested' ? 'Warm' : 'Cold'}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-neutral-500 mb-1">{lead.contact_person}</div>
                          {nextFollowUp && (
                            <div className="text-[10px] text-amber-600 font-medium mb-3 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Follow-up: {formatDate(nextFollowUp)}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-auto">
                            <div className="text-sm font-semibold text-neutral-900">
                              {formatCurrency(lead.expected_revenue || 0)}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">{lead.lead_source}</span>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${SOURCE_COLORS[lead.lead_source] || 'bg-slate-600'}`}>
                                {lead.company_name?.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

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
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex-1 flex flex-col mb-4 min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider bg-white">
                  <th className="px-6 py-4 font-semibold">Lead</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold text-center">Stage</th>
                  <th className="px-6 py-4 font-semibold text-right">Value</th>
                  <th className="px-6 py-4 font-semibold text-right">Interest</th>
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
                    const assigneeTeam = teams.find(t => t.id === lead.team_id);
                    const assigneeAgent = agents.find(a => a.id === lead.agent_id);
                    const assigneeInitials = assigneeAgent
                      ? assigneeAgent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : (assigneeTeam ? 'T' : 'UN');
                    const assigneeName = assigneeAgent?.name || assigneeTeam?.name || 'Unassigned';

                    const nextFollowUp = getLeadNextFollowUp(lead.id);

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-neutral-50 cursor-pointer transition-colors"
                        onClick={() => onLeadClick && onLeadClick(lead)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-neutral-900">{lead.company_name}</div>
                          <div className="text-xs text-neutral-500">{lead.lead_source || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          <div>{lead.contact_person}</div>
                          <div className="text-xs">{lead.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] || 'bg-slate-500'} text-white`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 text-right">
                          {formatCurrency(lead.expected_revenue || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 text-right">
                          {lead.interest_level || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center">
                            {lead.agent_id || lead.team_id ? (
                              <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold ring-2 ring-white" title={assigneeName}>
                                {assigneeInitials}
                              </div>
                            ) : (
                              <span className="text-sm text-neutral-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 text-center">
                          {nextFollowUp ? formatDate(nextFollowUp) : '-'}
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
    </div>
  );
}
