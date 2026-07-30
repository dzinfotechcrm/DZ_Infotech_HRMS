import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useSupabaseCollection, useSupabaseDocument } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument, query, orderBy } from '../../supabase/db';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const expensesQuery = (base) => query(base, orderBy('date', 'desc'));

export default function Expense() {
  const { items: expenses, loading: expensesLoading } = useSupabaseCollection('expenses', expensesQuery);
  const { item: settingsItem, loading: settingsLoading } = useSupabaseDocument('settings', 'bucket_allocations');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newExpense, setNewExpense] = useState({ date: new Date().toISOString().split('T')[0], category: 'Software Subscriptions', description: '', amount: '' });

  const loading = expensesLoading || settingsLoading;

  const defaultBuckets = [
    { id: '1', name: 'Employee', target: 250000 },
    { id: '2', name: 'Probation Reserve', target: 50000 },
    { id: '3', name: 'Contrack Expense', target: 75000 },
    { id: '4', name: 'Profit', target: 100000 },
    { id: '5', name: 'Company Expense', target: 25000 },
  ];
  
  const globalBuckets = settingsItem?.value?.buckets || defaultBuckets;

  const standardCategories = [
    { value: 'Software Subscriptions', label: 'Software Subscriptions' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Rent', label: 'Rent' },
    { value: 'Salary', label: 'Salary' },
    { value: 'Other', label: 'Other' },
  ];

  const categories = [...standardCategories];
  globalBuckets.forEach(b => {
    if (!categories.find(c => c.value === b.name)) {
      categories.push({ value: b.name, label: b.name });
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.date || !newExpense.amount || !newExpense.description) return;
    
    try {
      const payload = {
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount)
      };

      if (editingId) {
        await updateDocument('expenses', editingId, payload);
        toast.success('Expense updated successfully');
      } else {
        await createDocument('expenses', payload);
        toast.success('Expense added successfully');
      }
      
      setShowModal(false);
      setEditingId(null);
      setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'Software Subscriptions', description: '', amount: '' });
    } catch (error) {
      toast.error(editingId ? 'Failed to update expense' : 'Failed to add expense');
    }
  };

  const handleEdit = (expense) => {
    setNewExpense({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount
    });
    setEditingId(expense.id);
    setShowModal(true);
  };

  const openModalForCreate = () => {
    setEditingId(null);
    setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'Software Subscriptions', description: '', amount: '' });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await removeDocument('expenses', deleteId);
      toast.success('Expense deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

  const categoryData = useMemo(() => {
    const data = categories.map(cat => ({
      name: cat.label,
      value: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount || 0), 0)
    })).filter(item => item.value > 0);
    return data.sort((a, b) => b.value - a.value);
  }, [expenses]);

  const timeData = useMemo(() => {
    const expensesByDate = expenses.reduce((acc, exp) => {
      const date = exp.date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += Number(exp.amount || 0);
      return acc;
    }, {});
    
    return Object.keys(expensesByDate).sort().map(date => ({
      date: formatDate(date),
      amount: expensesByDate[date]
    }));
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 shadow-lg rounded-lg p-3 text-sm">
          <p className="font-semibold text-neutral-800 mb-1">{label || payload[0].name}</p>
          <p className="text-primary-600 font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue"
        title="Expense Tracking"
        description="Manage and track company expenses and operational costs."
        actions={
          <Button onClick={openModalForCreate} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Expense
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-primary-100 bg-primary-50/30 md:col-span-3 lg:col-span-1 flex flex-col justify-center">
          <div className="text-sm font-semibold uppercase tracking-wider text-primary-800 mb-2">Total Expenses</div>
          <div className="text-4xl font-black text-primary-900">{formatCurrency(totalExpense)}</div>
        </Card>
      </div>



      <Card className="p-0 overflow-hidden shadow-sm border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 whitespace-nowrap text-sm">
            <thead className="bg-white border-b border-neutral-200 text-neutral-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Category</th>
                <th className="px-6 py-4 text-left font-semibold">Description</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No expenses recorded.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} onClick={() => handleEdit(expense)} className="hover:bg-neutral-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-neutral-600 font-medium">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-neutral-900">{expense.description}</td>
                    <td className="px-6 py-4 text-right font-bold text-danger-600">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(expense.id);
                        }}
                        className="p-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showModal}
        title={editingId ? "Edit Expense" : "Add New Expense"}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        overflowVisible
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => {
              setShowModal(false);
              setEditingId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveExpense}>
              {editingId ? "Update Expense" : "Save Expense"}
            </Button>
          </div>
        }
      >
        <form id="expense-form" onSubmit={handleSaveExpense} className="space-y-4 pt-2">
          <Input
            label="Date"
            type="date"
            required
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
          />
          <Select
            label="Category"
            options={categories}
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
          />
          <Input
            label="Description"
            required
            placeholder="e.g. AWS Hosting"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          />
          <Input
            label="Amount (INR)"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            value={newExpense.amount}
            onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        open={!!deleteId}
        title="Confirm Deletion"
        onClose={() => setDeleteId(null)}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Expense
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600 pb-4">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
