import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { createDocument } from './firestore';

export async function initializeSeedData() {
  const companyRef = doc(db, 'settings', 'company');
  const snapshot = await getDoc(companyRef);
  const data = snapshot.data();

  if (data && data.seedCompleted && data.employeesSeeded) {
    return; // Already completely seeded
  }

  // 1. Create settings document
  await setDoc(companyRef, {
    companyName: 'DZ Infotech',
    address: 'Bhavnagar, Gujarat, India',
    phone: '',
    email: 'hr@dzinfotech.com',
    logoURL: '',
    workingHours: { start: '09:00', end: '18:00' },
    payrollSettings: { pfPercent: 12, esicPercent: 0.75, taxSlab: 'old' },
    seedCompleted: true,
    employeesSeeded: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 2. Create leaveTypes documents
  const leaveTypes = [
    { name: 'Casual Leave', maxDaysPerYear: 12, isPaid: true, carryForward: false, color: '#3B82F6' },
    { name: 'Medical Leave', maxDaysPerYear: 12, isPaid: true, carryForward: false, color: '#10B981' },
    { name: 'Annual Leave', maxDaysPerYear: 15, isPaid: true, carryForward: true, color: '#8B5CF6' },
    { name: 'Maternity Leave', maxDaysPerYear: 90, isPaid: true, carryForward: false, color: '#EC4899' },
    { name: 'Paternity Leave', maxDaysPerYear: 15, isPaid: true, carryForward: false, color: '#06B6D4' },
    { name: 'Unpaid Leave', maxDaysPerYear: 30, isPaid: false, carryForward: false, color: '#F59E0B' },
  ];

  if (!data?.seedCompleted) {
    for (const type of leaveTypes) {
      await createDocument('leaveTypes', type);
    }
  }

  if (!data?.employeesSeeded) {
    const employeesToSeed = [
      { email: 'dzinfotechcrm@gmail.com', firstName: 'DZ Infotech', lastName: 'CRM', role: 'admin', designation: 'Admin' },
      { email: 'dzinfotech10@gmail.com', firstName: 'DZ Infotech', lastName: '10', role: 'admin', designation: 'Admin' },
      { email: 'savanimiren7@gmail.com', firstName: 'Miren', lastName: 'Savani', role: 'admin', designation: 'Admin' },
      { email: 'mirendsavani@gmail.com', firstName: 'Miren', lastName: 'Savani', role: 'hr', designation: 'Manager' },
      { email: 'mdsavani007@gmail.com', firstName: 'MD', lastName: 'Savani', role: 'hr', designation: 'Manager' },
      { email: 'vahaniyash7@gmail.com', firstName: 'Yash', lastName: 'Vahani', role: 'employee', designation: 'Employee' },
      { email: '23cs084@charusat.edu.in', firstName: 'Charusat', lastName: 'Student', role: 'employee', designation: 'Employee' }
    ];

    for (const emp of employeesToSeed) {
      const employeeId = `${emp.firstName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await createDocument('employees', {
        ...emp,
        employeeId,
        phone: '',
        gender: 'male',
        dob: '2000-01-01',
        address: { line1: 'Bhavnagar', city: 'Bhavnagar', state: 'Gujarat', pincode: '364001' },
        departmentId: '',
        joinDate: new Date().toISOString().split('T')[0],
        basicSalary: 50000,
        status: 'active',
        managerId: '',
        uid: '', 
        photoURL: '',
      });
    }
  }

  console.log('Seed data initialized successfully.');
}
