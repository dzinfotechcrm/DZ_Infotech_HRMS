import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { numberToWords } from '../../utils/numberToWords';

const colors = {
  primary: '#172A6C', // DZ Dark Blue
  secondary: '#EA6B23', // DZ Orange
  bg: '#F8F9FA',
  text: '#333333',
  lightText: '#666666',
  border: '#E5E7EB'
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.text,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  logo: {
    width: 140,
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  companyDetails: {
    marginTop: 10,
    textAlign: 'right',
    color: colors.lightText,
    fontSize: 9,
    lineHeight: 1.5,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  billToBox: {
    backgroundColor: colors.bg,
    padding: 15,
    borderRadius: 8,
    width: '45%',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  sectionTitle: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  clientInfo: {
    fontSize: 10,
    color: colors.lightText,
    lineHeight: 1.5,
  },
  invoiceInfoBox: {
    width: '45%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.lightText,
    fontWeight: 'bold',
  },
  infoValue: {
    color: colors.text,
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  thDesc: { width: '50%', color: '#FFF', fontWeight: 'bold' },
  thQty: { width: '15%', color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
  thRate: { width: '15%', color: '#FFF', fontWeight: 'bold', textAlign: 'right' },
  thAmount: { width: '20%', color: '#FFF', fontWeight: 'bold', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tdDesc: { width: '50%', color: colors.text },
  tdQty: { width: '15%', textAlign: 'center', color: colors.lightText },
  tdRate: { width: '15%', textAlign: 'right', color: colors.lightText },
  tdAmount: { width: '20%', textAlign: 'right', fontWeight: 'bold', color: colors.primary },
  summaryBox: {
    width: '40%',
    alignSelf: 'flex-end',
    backgroundColor: colors.bg,
    padding: 15,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: { color: colors.lightText },
  summaryValue: { fontWeight: 'bold', color: colors.text },
  totalLabel: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  totalValue: { color: colors.secondary, fontWeight: 'bold', fontSize: 14 },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  notesBox: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesText: {
    fontSize: 9,
    color: colors.lightText,
    lineHeight: 1.5,
  }
});

export const InvoicePDF = ({ data, items }) => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);
  const total = subtotal - Number(data.discount);
  
  const formattedTotal = total.toLocaleString('en-IN');
  const amountInWords = numberToWords(total);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <Image src="/DZ_Infotech_Logo.jpeg" style={styles.logo} />
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.companyDetails}>
              <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 10, marginBottom: 2 }}>DZ INFOTECH</Text>
              <Text>Bhavnagar, Gujarat, India</Text>
              <Text>info@dzinfotech.in</Text>
              <Text>+91 93278 53727</Text>
            </View>
          </View>
        </View>

        <View style={styles.topSection}>
          <View style={styles.billToBox}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            {data.clientName && <Text style={styles.clientName}>{data.clientName}</Text>}
            {data.clientCompany && <Text style={[styles.clientInfo, { fontWeight: 'bold', marginBottom: 2 }]}>{data.clientCompany}</Text>}
            {data.clientAddress && <Text style={styles.clientInfo}>{data.clientAddress}</Text>}
            {data.clientPhone && <Text style={styles.clientInfo}>{data.clientPhone}</Text>}
            {data.clientEmail && <Text style={styles.clientInfo}>{data.clientEmail}</Text>}
          </View>

          <View style={styles.invoiceInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Number</Text>
              <Text style={styles.infoValue}>{data.invoiceNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date</Text>
              <Text style={styles.infoValue}>{new Date(data.date).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{new Date(data.dueDate).toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>Service Description</Text>
            <Text style={styles.thQty}>Qty</Text>
            <Text style={styles.thRate}>Unit Price</Text>
            <Text style={styles.thAmount}>Amount</Text>
          </View>

          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tdDesc}>{item.description}</Text>
              <Text style={styles.tdQty}>{item.quantity}</Text>
              <Text style={styles.tdRate}>{Number(item.rate).toLocaleString('en-IN')}</Text>
              <Text style={styles.tdAmount}>{(Number(item.quantity) * Number(item.rate)).toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '50%' }}>
            <View style={{ backgroundColor: colors.bg, padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: colors.secondary }}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              {data.bankName && <Text style={styles.clientInfo}>Bank Name: <Text style={{ color: colors.text }}>{data.bankName}</Text></Text>}
              {data.accountName && <Text style={styles.clientInfo}>Account Name: <Text style={{ color: colors.text }}>{data.accountName}</Text></Text>}
              {data.accountNo && <Text style={styles.clientInfo}>Account No: <Text style={{ color: colors.text }}>{data.accountNo}</Text></Text>}
              {data.ifsc && <Text style={styles.clientInfo}>IFSC: <Text style={{ color: colors.text }}>{data.ifsc}</Text></Text>}
              {data.upiId && <Text style={styles.clientInfo}>UPI ID: <Text style={{ color: colors.text }}>{data.upiId}</Text></Text>}
            </View>

            <View style={styles.notesBox}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Payment Terms / Notes</Text>
              <Text style={styles.notesText}>Payment is due within 7 days of the invoice date.</Text>
              <Text style={styles.notesText}>Please mention {data.invoiceNo} when making the payment.</Text>
              <Text style={[styles.notesText, { marginTop: 8 }]}>{data.notes || 'Thank you for your business!'}</Text>
            </View>
          </View>

          <View style={[styles.summaryBox, { width: '45%', marginTop: 0 }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹ {subtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>- ₹ {Number(data.discount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹ {formattedTotal}</Text>
            </View>
            
            <View style={{ marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 9, color: colors.lightText, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Amount in Words</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text }}>{amountInWords}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={{ borderTopWidth: 2, borderTopColor: colors.primary, paddingTop: 10 }}>
            <Text style={{ textAlign: 'center', fontSize: 8, color: colors.lightText }}>
              DZ INFOTECH | A professional IT Solutions Provider | This is a computer generated invoice and does not require a physical signature.
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
