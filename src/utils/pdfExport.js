import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateHelpers';

export function exportTableToPdf({ title, subtitle, columns, rows, fileName = 'report.pdf' }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(18);
  doc.setTextColor('#0D1B2A');
  doc.text(title, 40, 40);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor('#475569');
    doc.text(subtitle, 40, 58);
  }
  autoTable(doc, {
    startY: 78,
    head: [columns],
    body: rows,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [29, 78, 216] },
  });
  doc.save(fileName);
}

// Helper to convert image to base64
function getBase64Image(imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imgUrl;
  });
}

export async function exportPayslipPdf({ employee, payroll, companyName = 'DZ Infotech' }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  
  try {
    const logoBase64 = await getBase64Image('/DZ_Infotech_Logo.png');
    // Draw Logo
    doc.addImage(logoBase64, 'PNG', 40, 30, 60, 60);
    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#0f172a'); // slate-900
    doc.text(companyName, 115, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#64748b'); // slate-500
    doc.text('Official Employee Payslip', 115, 72);
  } catch(e) {
    // fallback if image fails to load
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#0f172a');
    doc.text(companyName, 40, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#64748b');
    doc.text('Official Employee Payslip', 40, 72);
  }
  
  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(40, 100, pageWidth - 40, 100);

  // Employee Details Column
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#334155'); // slate-700
  doc.text('EMPLOYEE DETAILS', 40, 130);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name:`, 40, 150);
  doc.text(`${employee.firstName} ${employee.lastName}`, 120, 150);
  
  doc.text(`Employee ID:`, 40, 165);
  doc.text(`${employee.employeeId || '—'}`, 120, 165);
  
  doc.text(`Department:`, 40, 180);
  doc.text(`${employee.department || '—'}`, 120, 180);
  
  doc.text(`Designation:`, 40, 195);
  doc.text(`${employee.designation || '—'}`, 120, 195);

  // Payslip Details Column
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP DETAILS', pageWidth / 2 + 10, 130);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Payslip For:`, pageWidth / 2 + 10, 150);
  doc.text(`${payroll.month} / ${payroll.year}`, pageWidth / 2 + 100, 150);
  
  doc.text(`Working Days:`, pageWidth / 2 + 10, 165);
  doc.text(`${payroll.workingDays || 22}`, pageWidth / 2 + 100, 165);
  
  doc.text(`Present Days:`, pageWidth / 2 + 10, 180);
  doc.text(`${payroll.exactPresentDays ?? payroll.presentDays ?? '—'}`, pageWidth / 2 + 100, 180);
  
  doc.text(`Paid Leaves:`, pageWidth / 2 + 10, 195);
  doc.text(`${payroll.paidLeaveDays ?? 0}`, pageWidth / 2 + 100, 195);

  const resolveObj = (val) => {
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).reduce((s, v) => s + Number(v || 0), 0);
    }
    return Number(val || 0);
  };

  const fmtAmount = (val) => Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  
  const basic = Number(payroll.basicSalary || 0);
  const hra = Number(payroll.hra || basic * 0.4);
  const da = Number(payroll.da || basic * 0.15);
  const allowances = resolveObj(payroll.allowances);
  
  const pf = employee.pfApplicable ? basic * 0.12 : 0;
  const tax = Number(payroll.tax || 0);
  const absentDed = resolveObj(payroll.deductions);
  
  const totalEarnings = basic + hra + da + allowances;
  const totalDeductions = pf + tax + absentDed;
  
  const tableY = 230;
  
  // Earnings Table (Left Side)
  autoTable(doc, {
    startY: tableY,
    head: [['Earnings', 'Amount (Rs.)']],
    body: [
      ['Basic Salary', fmtAmount(basic)],
      ['HRA (40%)', fmtAmount(hra)],
      ['DA (15%)', fmtAmount(da)],
      ['Allowances', fmtAmount(allowances)],
    ],
    foot: [['Total Earnings', fmtAmount(totalEarnings)]],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 6, textColor: [51, 65, 85] },
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [226, 232, 240], lineWidth: 1 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [226, 232, 240], lineWidth: 1 },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 90, halign: 'right' }
    },
    margin: { left: 40, right: pageWidth / 2 + 10 }
  });
  
  const leftTableFinalY = doc.lastAutoTable.finalY;

  // Deductions Table (Right Side)
  autoTable(doc, {
    startY: tableY,
    head: [['Deductions', 'Amount (Rs.)']],
    body: [
      ['PF Deduction (12%)', fmtAmount(pf)],
      ['Tax (TDS)', fmtAmount(tax)],
      ['Absent Deduction', fmtAmount(absentDed)],
      ['', ''] 
    ],
    foot: [['Total Deductions', fmtAmount(totalDeductions)]],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 6, textColor: [51, 65, 85] },
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [226, 232, 240], lineWidth: 1 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [226, 232, 240], lineWidth: 1 },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 90, halign: 'right' }
    },
    margin: { left: pageWidth / 2 + 10, right: 40 }
  });
  
  const rightTableFinalY = doc.lastAutoTable.finalY;
  const finalY = Math.max(leftTableFinalY, rightTableFinalY) + 30;

  // Net Salary Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(40, finalY, pageWidth - 80, 40, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#0f172a');
  doc.text('Net Salary Payable', 55, finalY + 25);
  doc.setFontSize(16);
  doc.setTextColor('#0284c7'); // sky-600
  doc.text(`Rs. ${fmtAmount(payroll.netSalary)}`, pageWidth - 55, finalY + 26, { align: 'right' });

  // Footer / Signature Area
  const signatureY = finalY + 120;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#94a3b8');
  doc.text('This is a computer-generated document. No signature is required.', pageWidth / 2, signatureY, { align: 'center' });
  
  doc.text(`Generated on ${formatDate(new Date(), 'dd MMM yyyy')}`, 40, signatureY + 20);
  doc.text('Authorized Signatory', pageWidth - 40, signatureY + 20, { align: 'right' });
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(pageWidth - 160, signatureY + 5, pageWidth - 40, signatureY + 5);

  doc.save(`${employee.firstName}-${employee.lastName}-Payslip-${payroll.month}-${payroll.year}.pdf`);
}
