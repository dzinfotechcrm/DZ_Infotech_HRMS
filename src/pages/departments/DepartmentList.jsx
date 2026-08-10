import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { query, orderBy } from '../../supabase/db';
import { BuildingOffice2Icon, PencilSquareIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { removeDocument } from '../../supabase/db';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { isAdminLike } from '../../utils/rbac';

export default function DepartmentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const departmentsQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const employeesQuery = useMemo(() => (base) => query(base, orderBy('firstName')), []);
  const { items: departments } = useSupabaseCollection('departments', departmentsQuery);
  const { items: employees } = useSupabaseCollection('employees', employeesQuery);

  // Calculate employee count and manager per department dynamically
  const { employeeCountByDepartment, managerByDepartment } = useMemo(() => {
    const counts = {};
    const managers = {};
    
    employees.forEach((employee) => {
      // Find the department to get its true ID, matching by ID or Name
      const dept = departments.find(d => d.id === employee.departmentId || d.name === employee.departmentId);
      
      if (dept) {
        // Count all employees (exclude only Admin)
        if (employee.designation !== 'Admin') {
          counts[dept.id] = (counts[dept.id] || 0) + 1;
        }

        // Identify manager
        const isManager = employee.role?.toLowerCase() === 'manager' || employee.designation?.toLowerCase() === 'manager';
        if (isManager) {
          managers[dept.id] = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        }
      }
    });
    
    return { employeeCountByDepartment: counts, managerByDepartment: managers };
  }, [employees, departments]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  // Self-healing: Automatically fix database inconsistencies in department manager assignments
  useEffect(() => {
    if (!employees.length || !departments.length) return;

    departments.forEach(async (dept) => {
      // Find the true manager from the employees table
      const trueManager = employees.find(e => 
        (e.departmentId === dept.id || e.departmentId === dept.name) && 
        (e.role?.toLowerCase() === 'manager' || e.designation?.toLowerCase() === 'manager')
      );
      
      const trueManagerId = trueManager ? trueManager.id : '';
      
      // If the database has a stale or incorrect manager assigned, fix it automatically
      if (dept.managerId !== trueManagerId) {
        try {
          // Dynamically import updateDocument to avoid cyclic dependency issues
          const { updateDocument } = await import('../../supabase/db');
          await updateDocument('departments', dept.id, { data: { ...(dept.data || {}), managerId: trueManagerId } });
        } catch (e) {
          console.error("Failed to auto-heal department manager", e);
        }
      }
    });
  }, [employees, departments]);

  function confirmDelete(id) {
    setDepartmentToDelete(id);
    setDeleteModalOpen(true);
  }

  async function executeDelete() {
    if (!departmentToDelete) return;
    try {
      await removeDocument('departments', departmentToDelete);
      toast.success('Department deleted');
      setDeleteModalOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      toast.error(error.message || 'Unable to delete department');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Departments"
        title="Department registry"
        description="Manage departments, team leaders, and employee allocation across your organization."
        actions={isAdminLike(user?.role) ? <Link to="/departments/new"><Button><UsersIcon className="h-4 w-4" /> Add Department</Button></Link> : null}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setDeleteModalOpen(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => {
          const empCount = employeeCountByDepartment[department.id] || 0;
          return (
            <Card key={department.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <BuildingOffice2Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-neutral-900">{department.name}</div>
                  <div className="text-sm text-neutral-500">{department.description || 'No description'}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-neutral-600">
                <div><span className="font-semibold text-neutral-900">Manager:</span> {managerByDepartment[department.id] || 'Not assigned'}</div>
                <div><span className="font-semibold text-neutral-900">Employees:</span> {empCount}</div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => navigate(`/employees?department=${encodeURIComponent(department.name)}`)}>View Employees</Button>
                {isAdminLike(user?.role) && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/departments/${department.id}/edit`)}><PencilSquareIcon className="h-4 w-4" /></Button>
                    <Button variant="secondary" onClick={() => confirmDelete(department.id)}><TrashIcon className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
