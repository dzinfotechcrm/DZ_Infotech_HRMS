import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export default function LeadStageDetailsModal({ open, lead, onClose, onEditLead, onUpdateLead }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    setIsEditing(false);
  }, [currentTab, open]);

  useEffect(() => {
    if (lead) {
      setEditData(lead);
    }
  }, [lead, isEditing]);

  const handleSave = () => {
    const currentGroupFields = tabGroups[currentTab];
    const updates = {};
    currentGroupFields.forEach(k => {
      if (editData[k] !== undefined && editData[k] !== lead[k]) {
        updates[k] = editData[k];
      }
    });
    
    if (Object.keys(updates).length > 0 && onUpdateLead) {
      onUpdateLead(lead.id, updates);
    }
    setIsEditing(false);
  };

  if (!open || !lead) return null;

  const allowedModalFields = [
    'basicRequirements', 'businessDetails', 'serviceRequired', 'budget', 'timeline',
    'demoWebsite',
    'meetingDate', 'meetingTime', 'meetingType', 'meetingReminder',
    'attendedBy', 'meetingNotes', 'servicesDiscussed', 'interestedServices', 'quotationEstimate', 'negotiatedAmount',
    'quotation', 'quotationAmount', 'proposalTimeline', 'amcIncluded', 'amcAmount',
    'currentPrice', 'clientCounterOffer', 'latestOffer', 'discountReason',
    'advancePaymentReceived',
    'nextFollowUp', 'interestLevel'
  ];

  const extraFields = Object.keys(lead).filter(key =>
    allowedModalFields.includes(key) && lead[key] !== null && lead[key] !== '' && lead[key] !== undefined
  );

  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const TABS = ['Contacted', 'Demo Prep', 'Scheduled', 'Completed', 'Proposal', 'Negotiation', 'Won'];

  const tabGroups = [
    // Contacted
    ['basicRequirements', 'businessDetails', 'serviceRequired', 'budget', 'timeline', 'nextFollowUp'],
    // Demo Prep
    ['demoWebsite', 'nextFollowUp'],
    // Scheduled
    ['meetingDate', 'meetingTime', 'meetingType', 'meetingReminder', 'nextFollowUp'],
    // Completed
    ['attendedBy', 'meetingNotes', 'servicesDiscussed', 'interestedServices', 'quotationEstimate', 'negotiatedAmount', 'nextFollowUp', 'interestLevel'],
    // Proposal
    ['quotation', 'quotationAmount', 'proposalTimeline', 'amcIncluded', 'amcAmount', 'nextFollowUp'],
    // Negotiation
    ['currentPrice', 'clientCounterOffer', 'latestOffer', 'discountReason', 'nextFollowUp'],
    // Won
    ['advancePaymentReceived']
  ];

  const uniqueStageKeys = [
    ['basicRequirements', 'businessDetails', 'serviceRequired', 'budget', 'timeline'],
    ['demoWebsite'],
    ['meetingDate', 'meetingTime', 'meetingType', 'meetingReminder'],
    ['attendedBy', 'meetingNotes', 'servicesDiscussed', 'interestedServices', 'quotationEstimate', 'negotiatedAmount'],
    ['quotation', 'quotationAmount', 'proposalTimeline', 'amcIncluded', 'amcAmount'],
    ['currentPrice', 'clientCounterOffer', 'latestOffer', 'discountReason'],
    ['advancePaymentReceived']
  ];

  const hasUniqueData = uniqueStageKeys[currentTab].some(key => extraFields.includes(key));

  return (
    <Modal open={open} onClose={onClose} title={`Stage Details`} size="max-w-4xl">
      <div className="space-y-6 text-slate-900">
        <div className="mb-8 px-2 mt-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
            {TABS.map((tab, index) => {
              const isActive = index === currentTab;
              return (
                <div
                  key={tab}
                  className="flex flex-col items-center gap-2 cursor-pointer bg-white px-1"
                  onClick={() => setCurrentTab(index)}
                >
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors duration-300 ${isActive ? 'bg-primary-600 text-white ring-4 ring-primary-50' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}>
                    {index + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight max-w-[60px] sm:max-w-[80px] ${isActive ? 'text-primary-700' : 'text-slate-400'}`}>
                    {tab}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 min-h-[220px]">
          <div className="flex justify-between items-start mb-6">
            <h4 className="font-semibold text-lg text-slate-800">{lead.companyName}</h4>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={onEditLead} className="text-xs py-1.5 px-3">
                Edit Basic Info
              </Button>
              {hasUniqueData && (
                isEditing ? (
                  <>
                    <Button variant="secondary" onClick={() => setIsEditing(false)} className="text-xs py-1.5 px-3 border-slate-300 text-slate-600 hover:bg-slate-100">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="text-xs py-1.5 px-3">
                      Save Stage Info
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setIsEditing(true)} className="text-xs py-1.5 px-3 border-primary-200 text-primary-700 hover:bg-primary-50">
                    Edit Stage Info
                  </Button>
                )
              )}
            </div>
          </div>
          
          {(() => {
            if (!hasUniqueData) {
              return <p className="text-sm text-slate-500 italic mt-8 text-center">No details recorded for {TABS[currentTab]} yet.</p>;
            }

            const currentGroupFields = tabGroups[currentTab];
            const fieldsToRender = isEditing 
              ? currentGroupFields 
              : currentGroupFields.filter(key => extraFields.includes(key));

            return (
              <div className="grid gap-5 sm:grid-cols-2">
                {fieldsToRender.map(key => (
                  <div key={key} className="col-span-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{formatKey(key)}</div>
                    {isEditing ? (
                      key.toLowerCase().includes('date') || key === 'nextFollowUp' ? (
                        <input
                          type="date"
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        />
                      ) : key.toLowerCase().includes('time') && key !== 'timeline' ? (
                         <input
                          type="time"
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        />
                      ) : key === 'budget' || key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('offer') || key === 'quotationEstimate' ? (
                        <input
                          type="number"
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value ? Number(e.target.value) : ''})}
                        />
                      ) : key === 'interestLevel' ? (
                        <select
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        >
                          <option value="">Select Level</option>
                          <option value="Very Interested">Very Interested</option>
                          <option value="Interested">Interested</option>
                          <option value="Not Interested">Not Interested</option>
                        </select>
                      ) : key === 'meetingType' ? (
                        <select
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        >
                          <option value="">Select Type</option>
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                        </select>
                      ) : key === 'serviceRequired' ? (
                         <input
                          type="text"
                          placeholder="Comma separated values"
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={Array.isArray(editData[key]) ? editData[key].join(', ') : editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        />
                      ) : (
                        <textarea
                          rows="2"
                          className="w-full text-sm text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                          value={editData[key] || ''}
                          onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        />
                      )
                    ) : (
                      <div className="text-sm text-slate-900 bg-white p-3 rounded-xl border border-slate-200 shadow-sm whitespace-pre-wrap">
                        {Array.isArray(lead[key]) ? lead[key].join(', ') : String(lead[key] || '-')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="flex justify-between pt-2 border-t border-slate-200 mt-6">
          <div>
            {currentTab > 0 && (
              <Button variant="secondary" onClick={() => setCurrentTab(c => c - 1)}>Previous</Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentTab < TABS.length - 1 ? (
              <Button onClick={() => setCurrentTab(c => c + 1)}>Next</Button>
            ) : (
              <Button onClick={onClose}>Close Details</Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
