import { useState } from 'react';
import { query, orderBy } from '../../supabase/db';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { isAdminLike } from '../../utils/rbac';
import { createDocument, removeDocument, updateDocument, upsertDocument } from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';

export default function Settings() {
  const { user } = useAuth();
  const companyQuery = (base) => query(base, orderBy('updatedAt', 'desc'));
  const { items: settingsData } = useSupabaseCollection('settings', companyQuery);
  const { items: leaveTypes } = useSupabaseCollection('leaveTypes', (base) => query(base, orderBy('name')));
  const { items: holidays } = useSupabaseCollection('holidays', (base) => query(base, orderBy('date')));
  const { items: users } = useSupabaseCollection('users', (base) => query(base, orderBy('displayName')));
  const [logo, setLogo] = useState(null);

  const company = settingsData.find(s => s.id === 'company') || { companyName: 'DZ Infotech', address: 'Bhavnagar', phone: '', email: '', logoURL: '', workingHours: { start: '09:00', end: '18:00' }, payrollSettings: { pfPercent: 12, esicPercent: 0.75, taxSlab: 'old' } };
  const companyPhone = /^\d{10}$/.test(company.phone || '') ? company.phone : '';
  const editable = isAdminLike(user?.role);

  if (!editable) {
    return <Card className="p-6 text-center">Settings are restricted to Admin users.</Card>;
  }

  async function saveCompany(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = (formData.get('phone') || '').toString().trim();
    if (phone && !/^\d{10}$/.test(phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    try {
      let logoURL = company.logoURL || '';
      const file = logo;
      if (file) {
        logoURL = await uploadFile(`company/logo-${Date.now()}-${file.name}`, file, { contentType: file.type });
      }
      await upsertDocument('settings', 'company', {
        companyName: formData.get('companyName'),
        address: formData.get('companyAddress'),
        phone,
        email: formData.get('email'),
        logoURL,
        workingHours: {
          start: formData.get('workStart') || '09:00',
          end: formData.get('workEnd') || '18:00',
        },
        payrollSettings: {
          pfPercent: Number(formData.get('pfPercent') || 12),
          esicPercent: Number(formData.get('esicPercent') || 0.75),
          taxSlab: formData.get('taxSlab') || 'old',
        }
      });
      toast.success('Company settings saved');
    } catch (error) {
      toast.error(error?.message || 'Unable to save company settings');
    }
  }

  async function addLeaveType(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await createDocument('leaveTypes', {
        name: formData.get('name'),
        maxDaysPerYear: Number(formData.get('maxDaysPerYear')),
        isPaid: formData.get('isPaid') === 'on',
        carryForward: formData.get('carryForward') === 'on',
        color: formData.get('color') || '#000000'
      });
      event.currentTarget.reset();
      toast.success('Leave type added');
    } catch (error) {
      toast.error(error?.message || 'Unable to add leave type');
    }
  }

  async function addHoliday(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const dateVal = formData.get('date');
      const yearStr = dateVal ? dateVal.substring(0, 4) : new Date().getFullYear().toString();
      await createDocument('holidays', {
        name: formData.get('name'),
        date: dateVal,
        type: formData.get('type') || 'national',
        year: yearStr,
        isOptional: formData.get('isOptional') === 'on'
      });
      event.currentTarget.reset();
      toast.success('Holiday added');
    } catch (error) {
      toast.error(error?.message || 'Unable to add holiday');
    }
  }

  async function deleteHoliday(id) {
    try {
      await removeDocument('holidays', id);
      toast.success('Holiday removed');
    } catch (error) {
      toast.error(error?.message || 'Unable to remove holiday');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Company and HR settings"
        description="Manage company profile, leave types, holidays, users, and notification preferences."
      />

      <Card className="p-6">
        <h2 className="section-title">Company Info</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={saveCompany}>
          <Input name="companyName" label="Company Name" defaultValue={company.companyName} />
          <Input name="companyAddress" label="Company Address" defaultValue={company.address} />
          <Input
            name="phone"
            label="Phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            title="Enter exactly 10 digits"
            maxLength={10}
            placeholder="1234567890"
            defaultValue={companyPhone}
            onInput={(event) => {
              event.target.value = event.target.value.replace(/\D/g, '');
            }}
          />
          <Input name="email" label="Email" type="email" defaultValue={company.email} />
          <Input label="Company Logo" type="file" accept="image/*" onChange={(event) => setLogo(event.target.files?.[0] || null)} />
          <Input name="workStart" label="Work Start Time" type="time" defaultValue={company.workingHours?.start} />
          <Input name="workEnd" label="Work End Time" type="time" defaultValue={company.workingHours?.end} />
          <Input name="pfPercent" label="PF %" type="number" step="0.1" defaultValue={company.payrollSettings?.pfPercent} />
          <Input name="esicPercent" label="ESIC %" type="number" step="0.01" defaultValue={company.payrollSettings?.esicPercent} />
          <Select name="taxSlab" label="Tax Slab" defaultValue={company.payrollSettings?.taxSlab}>
            <option value="old">Old</option>
            <option value="new">New</option>
          </Select>
          <div className="flex items-end md:col-span-2"><Button type="submit">Save Company</Button></div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="section-title">Leave Types</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={addLeaveType}>
            <Input name="name" label="Type Name" placeholder="Casual" />
            <Input name="maxDaysPerYear" type="number" label="Max Days Per Year" />
            <Input name="color" type="color" label="Badge Color" />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-neutral-700"><input name="isPaid" type="checkbox" />Paid Leave</label>
              <label className="flex items-center gap-2 text-sm text-neutral-700"><input name="carryForward" type="checkbox" />Carry Forward</label>
            </div>
            <div className="md:col-span-2"><Button type="submit">Add Leave Type</Button></div>
          </form>
          <div className="mt-5">
            <Table columns={[{ key: 'name', label: 'Type' }, { key: 'days', label: 'Max Days' }, { key: 'paid', label: 'Paid' }, { key: 'carry', label: 'Carry Fwd' }]} data={leaveTypes} renderRow={(item) => (
              <tr key={item.id}>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div></td>
                <td className="px-4 py-3">{item.maxDaysPerYear}</td>
                <td className="px-4 py-3">{item.isPaid ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">{item.carryForward ? 'Yes' : 'No'}</td>
              </tr>
            )} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="section-title">Holiday Management</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={addHoliday}>
            <Input name="name" label="Holiday Name" />
            <Input name="date" type="date" label="Date" />
            <Select name="type" label="Type">
              <option value="national">National</option>
              <option value="regional">Regional</option>
              <option value="optional">Optional</option>
            </Select>
            <label className="flex items-center gap-2 text-sm text-neutral-700 mt-6"><input name="isOptional" type="checkbox" />Is Optional</label>
            <div className="md:col-span-2"><Button type="submit">Add Holiday</Button></div>
          </form>
          <div className="mt-5">
            <Table columns={[{ key: 'name', label: 'Holiday' }, { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'actions', label: 'Actions' }]} data={holidays} renderRow={(item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.name} {item.isOptional && <span className="text-xs text-neutral-400">(Optional)</span>}</td>
                <td className="px-4 py-3">{item.date}</td>
                <td className="px-4 py-3 capitalize">{item.type}</td>
                <td className="px-4 py-3"><Button variant="danger" onClick={() => deleteHoliday(item.id)}>Delete</Button></td>
              </tr>
            )} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="section-title">Role & User Management</h2>
        <Table
          columns={[{ key: 'name', label: 'User' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }]}
          data={users}
          renderRow={(item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.displayName || item.email}</td>
              <td className="px-4 py-3">{item.email}</td>
              <td className="px-4 py-3">
                <Select value={item.role || 'employee'} onChange={(event) => updateDocument('users', item.id, { role: event.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="employee">Employee</option>
                </Select>
              </td>
            </tr>
          )}
        />
      </Card>
    </div>
  );
}
