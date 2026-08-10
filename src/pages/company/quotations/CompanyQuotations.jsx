import React from 'react';
import PageHeader from '../../../components/ui/PageHeader';

export default function CompanyQuotations() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quotations" description="Manage and view company quotations" />
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <p className="text-neutral-500">Quotation module content goes here.</p>
      </div>
    </div>
  );
}
