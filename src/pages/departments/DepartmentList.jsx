import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { query, orderBy } from 'firebase/firestore';
import { BuildingOffice2Icon, PencilSquareIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { removeDocument } from '../../firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { isAdminLike } from '../../utils/rbac';

export default function DepartmentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const departmentsQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const employeesQuery = useMemo(() => (base) => query(base, orderBy('firstName')), []);
  const { items: departments } = useFirestoreCollection('departments', departmentsQuery);
  const { items: employees } = useFirestoreCollection('employees', employeesQuery);

  const managerById = useMemo(() => Object.fromEntries(employees.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`])), [employees]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  // Calculate employee count per department (includes Manager, HR, and regular Employees)
  const employeeCountByDepartment = useMemo(() => {
    const counts = {};
    employees.forEach((employee) => {
      // Count all employees (Manager, HR, Employee) assigned to a department, exclude only Admin
      if (employee.designation !== 'Admin' && employee.departmentId) {
        counts[employee.departmentId] = (counts[employee.departmentId] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

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

      <Modal
        open={deleteModalOpen}
        title="Delete Department"
        onClose={() => setDeleteModalOpen(false)}
        footer={
          <div className="flex gap-3 pt-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={executeDelete} className="flex-1 bg-danger-600 text-white hover:bg-danger-700">
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          Are you sure you want to delete this department? This action cannot be undone.
        </p>
      </Modal>

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
                <div><span className="font-semibold text-neutral-900">Manager:</span> {managerById[department.managerId] || 'Not assigned'}</div>
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
