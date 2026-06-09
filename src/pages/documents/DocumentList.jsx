import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { isAdminLike } from '../../utils/rbac';
import { formatDateTime } from '../../utils/dateHelpers';
import { removeDocument } from '../../firebase/firestore';

export default function DocumentList() {
  const { user } = useAuth();
  const documentQuery = useMemo(() => (base) => query(base, orderBy('createdAt', 'desc')), []);
  const { items: documents } = useFirestoreCollection('documents', documentQuery);
  const visible = isAdminLike(user?.role) ? documents : documents.filter((item) => item.employeeId === user?.uid);

  async function handleDelete(id) {
    if (!window.confirm('Delete this document?')) {
      return;
    }
    try {
      await removeDocument('documents', id);
      toast.success('Document deleted');
    } catch (error) {
      toast.error(error?.message || 'Unable to delete document');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="Document storage and management"
        description="Upload, review, and manage employee documents with secure access controls."
        actions={<Link to="/documents/upload"><Button>Upload Document</Button></Link>}
      />
      <Card className="p-5">
        <Table
          columns={[{ key: 'employee', label: 'Employee' }, { key: 'type', label: 'Type' }, { key: 'file', label: 'File' }, { key: 'uploaded', label: 'Uploaded' }, { key: 'actions', label: 'Actions' }]}
          data={visible}
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{row.employeeName || row.employeeId}</td>
              <td className="px-4 py-3"><Badge tone="primary">{row.docType}</Badge></td>
              <td className="px-4 py-3">{row.fileName}</td>
              <td className="px-4 py-3">{formatDateTime(row.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <a className="text-primary-600 hover:underline" href={row.fileURL} target="_blank" rel="noreferrer">Open</a>
                  {(user?.role === 'admin' || user?.role === 'hr') && <button className="text-danger-600" onClick={() => handleDelete(row.id)}>Delete</button>}
                </div>
              </td>
            </tr>
          )}
        />
      </Card>
    </div>
  );
}
