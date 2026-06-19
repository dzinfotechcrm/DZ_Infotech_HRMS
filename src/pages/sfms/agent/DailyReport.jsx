import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Spinner from '../../../components/ui/Spinner';
import { useSupabaseCollection } from '../../../hooks/useSupabase';
import { supabase } from '../../../supabase/config';
import { useAuth } from '../../../hooks/useAuth';

const formatCurrency = (value) => {
  if (!value) return '₹0';
  const val = Number(value);
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

export default function DailyReport() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { items: agents, loading: agentsLoading } = useSupabaseCollection('sfmsAgents');
  const { items: reports, loading: reportsLoading, refetch: refetchReports } = useSupabaseCollection('sfmsDailyReports');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loading = agentsLoading || reportsLoading;

  const agentData = useMemo(() => {
    if (loading || !user?.email) return null;
    return agents.find(a => a.email?.toLowerCase() === user.email?.toLowerCase());
  }, [agents, user, loading]);

  const recentReports = useMemo(() => {
    if (!agentData) return [];
    return reports
      .filter(r => r.team_id === agentData.team_id)
      .sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
  }, [reports, agentData]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        team_id: agentData?.team_id || null,
        report_date: new Date().toISOString().split('T')[0],
        meetings_completed: Number(data.meetings_completed) || 0,
        interested_leads: Number(data.interested_leads) || 0,
        very_interested_leads: Number(data.very_interested_leads) || 0,
        follow_ups_scheduled: Number(data.follow_ups_scheduled) || 0,
        expected_revenue: Number(data.expected_revenue) || 0,
        challenges_faced: data.challenges_faced || '',
        tomorrows_plan: data.tomorrows_plan || ''
      };
      
      const { error } = await supabase.from('sfms_daily_reports').insert([payload]);
      if (error) throw error;
      
      toast.success('Report submitted successfully');
      reset();
      refetchReports();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!agentData || !agentData.team_id) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center text-neutral-500">
          You are not assigned to any team. Contact your administrator.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">Daily Report</h1>
          <p className="text-sm text-neutral-500">Submit your end of day report.</p>
        </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Submit Form */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">END OF DAY</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Submit today's report</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input 
                  label="Meetings Completed" 
                  type="number" 
                  min="0"
                  {...register('meetings_completed', { required: true })} 
                />
                <Input 
                  label="Interested Leads" 
                  type="number" 
                  min="0"
                  {...register('interested_leads')} 
                />
                <Input 
                  label="Very Interested" 
                  type="number" 
                  min="0"
                  {...register('very_interested_leads')} 
                />
                <Input 
                  label="Follow Ups Scheduled" 
                  type="number" 
                  min="0"
                  {...register('follow_ups_scheduled')} 
                />
                <Input 
                  label="Expected Revenue (₹)" 
                  type="number" 
                  min="0"
                  {...register('expected_revenue')} 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Challenges faced</label>
                  <textarea
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    rows={4}
                    {...register('challenges_faced')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tomorrow's plan</label>
                  <textarea
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    rows={4}
                    {...register('tomorrows_plan')}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={submitting}>Submit report</Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Recent Reports sidebar */}
        <div className="md:col-span-1 lg:col-span-1">
          <Card className="p-6 h-full">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">RECENT REPORTS</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Your team</h2>

            <div className="space-y-4">
              {recentReports.length === 0 ? (
                <div className="text-sm text-neutral-500 py-4">No recent reports found.</div>
              ) : (
                recentReports.slice(0, 5).map(report => (
                  <div key={report.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-bold text-primary-600">
                        {new Date(report.report_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs font-bold text-emerald-600">
                        {formatCurrency(report.expected_revenue)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-neutral-900 mb-1">
                      {report.meetings_completed} meetings • {report.follow_ups_scheduled} follow ups
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {report.tomorrows_plan || report.challenges_faced || 'No notes provided.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
