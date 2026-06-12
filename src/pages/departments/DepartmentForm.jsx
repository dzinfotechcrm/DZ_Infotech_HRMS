import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { query, orderBy } from 'firebase/firestore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { createDocument, updateDocument } from '../../firebase/firestore';
import { useFirestoreCollection, useFirestoreDocument } from '../../hooks/useFirestore';
import toast from 'react-hot-toast';

export default function DepartmentForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item: department, loading } = useFirestoreDocument('departments', id);
  const { items: employees } = useFirestoreCollection('employees', (base) => query(base, orderBy('firstName')));
  const { items: departments } = useFirestoreCollection('departments', (base) => query(base, orderBy('name')));
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();

  // Get list of already assigned manager IDs (except current department)
  const assignedManagerIds = useMemo(() => {
    return new Set(
      departments
        .filter((dept) => dept.id !== id) // Exclude current department
        .map((dept) => dept.managerId)
        .filter(Boolean)
    );
  }, [departments, id]);

  const currentCount = useMemo(() => {
    if (mode === 'create' || !id || !employees) return 0;
    return employees.filter(e => e.departmentId === id && e.designation !== 'Admin').length;
  }, [id, employees, mode]);

  useEffect(() => {
    if (department) {
      reset(department);
    }
  }, [department, reset]);

  async function onSubmit(values) {
    const payload = {
      ...values,
      employeeCount: mode === 'edit' ? currentCount : 0,
    };
    try {
      if (mode === 'edit' && id) {
        await updateDocument('departments', id, payload);
        toast.success('Department updated');
      } else {
        await createDocument('departments', payload);
        toast.success('Department created');
      }
      navigate('/departments');
    } catch (error) {
      toast.error(error.message || 'Unable to save department');
    }
  }

  if (mode === 'edit' && loading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Departments"
        title={mode === 'edit' ? 'Edit department' : 'Create department'}
        description="Add or update department details, managers, and department headcount."
      />
      <Card className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-700">Departments</div>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">{mode === 'edit' ? 'Edit department' : 'Create department'}</h1>
          </div>
          <Link to="/departments"><Button variant="secondary">Back</Button></Link>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Department Name" {...register('name', { required: 'Department name is required' })} error={errors.name?.message} />
          <Select label="Manager" value={watch('managerId') || ''} {...register('managerId')}>
            <option value="">Select manager</option>
            {employees
              .filter((employee) => (employee.role?.toLowerCase() === 'manager' || employee.designation?.toLowerCase() === 'manager') && !assignedManagerIds.has(employee.id))
              .map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
          </Select>
          <Input label="Description" className="md:col-span-2" {...register('description', { required: 'Description is required' })} error={errors.description?.message} />
          
          <Input 
            label="Employee Count" 
            type="number" 
            value={mode === 'edit' ? currentCount : 0} 
            readOnly 
            className="bg-slate-50 text-slate-500 cursor-not-allowed"
            title="Automatically calculated based on assigned employees"
          />

          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Department'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
