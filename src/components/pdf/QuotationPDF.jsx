import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register font for better rendering
Font.register({
  family: 'Arial',
  fonts: [
    { src: '/fonts/arial.ttf' },
    { src: '/fonts/arialbd.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Arial',
    fontSize: 10,
    lineHeight: 1.3,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f3864',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C55A11',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f3864',
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f3864',
    paddingBottom: 2,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    marginBottom: 6,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 15,
  },
  bulletPoint: {
    width: 15,
    fontSize: 12,
  },
  listItemText: {
    flex: 1,
    textAlign: 'justify',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  signatureBlock: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureColumn: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
    marginTop: 30,
  }
});

const Bullet = ({ children }) => (
  <View wrap={false} style={styles.listItem}>
    <Text style={styles.bulletPoint}>•</Text>
    <Text style={styles.listItemText}>{children}</Text>
  </View>
);

export const QuotationPDF = ({ data }) => {
  const {
    clientName,
    contactPerson,
    quotationNumber,
    quotationDate,
    validityDate,
    businessObjective,
    proposedSolution,
    manufacturingCost,
    inventoryCost,
    salesCost,
    hrCost,
    reportsCost,
    deploymentCost,
    specialProjectPrice,
    gstin,
    registeredAddress
  } = data;

  const erpAppDevCost = 120000;
  const totalProjectValue = 
    Number(erpAppDevCost) + 
    Number(manufacturingCost) + 
    Number(inventoryCost) + 
    Number(salesCost) + 
    Number(hrCost) + 
    Number(reportsCost) + 
    Number(deploymentCost);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyTitle}>DZ INFOTECH</Text>
            <Text style={styles.docTitle}>ERP QUOTATION</Text>
            <Text style={{ marginTop: 10, fontSize: 9 }}>Customized Manufacturing ERP Software</Text>
            <Text style={{ fontSize: 9 }}>Design, Development & Implementation</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.bold}>PREPARED FOR</Text>
            <Text>{clientName || '[Client Company Name]'}</Text>
            <Text style={{ marginTop: 5, ...styles.bold }}>CONTACT</Text>
            <Text>{contactPerson || '[Client Contact Person]'}</Text>
            
            <View style={{ marginTop: 10, alignSelf: 'flex-end', width: 120 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.bold}>QUOTATION NO:</Text>
                <Text>{quotationNumber || 'QT-YYYYMMDD-A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.bold}>DATE:</Text>
                <Text>{quotationDate || '[Date]'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.bold}>VALID UNTIL:</Text>
                <Text>{validityDate || '[Validity Date]'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ ...styles.bold, color: '#C55A11', marginBottom: 4 }}>BUSINESS OBJECTIVE</Text>
          <Text style={styles.text}>{businessObjective || '[One to two sentences on the client\'s business, plant/operations, and the core problem this ERP solves for them.]'}</Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ ...styles.bold, color: '#C55A11', marginBottom: 4 }}>PROPOSED SOLUTION</Text>
          <Text style={styles.text}>{proposedSolution || '[One to two sentences on the proposed system — a fully customized ERP built around the client\'s actual workflow.]'}</Text>
        </View>

        {/* SECTION 01 */}
        <Text style={styles.sectionTitle}>01 Project Overview</Text>
        <Text style={styles.text}>A fully customized ERP built to streamline operations from procurement through production, dispatch, and payroll, so every department works off one live, accurate source of truth.</Text>
        
        <Text style={styles.subSectionTitle}>Module Flow</Text>
        <Text style={styles.text}>Purchase → Inventory → Production → Job Work → Sales & Dispatch → HR & Payroll → Reports</Text>

        <Text style={styles.subSectionTitle}>Module Summary</Text>
        <Bullet>Purchase — vendor POs, shortage-driven ordering, GRN tracking against open POs.</Bullet>
        <Bullet>Inventory — multi-location stock, transfers, reorder alerts, physical-count adjustments, valuation.</Bullet>
        <Bullet>Production — multi-level BOMs, stage-wise routing, job-work tracking, live work-order status.</Bullet>
        <Bullet>Sales & Dispatch — sales orders, delivery challans, partial dispatch, real-time finished-goods visibility.</Bullet>
        <Bullet>HR & Payroll — employee master, attendance, leave, payroll and payslip generation.</Bullet>
        <Bullet>Reports & Access Control — on-screen and exportable reports, role-based access across departments.</Bullet>

        {/* SECTION 02 */}
        <Text style={styles.sectionTitle}>02 Detailed Functional Scope</Text>
        
        <Text style={styles.subSectionTitle}>Purchase</Text>
        <Bullet>Material requirement visibility — shortages calculated from active production, current stock, and open POs</Bullet>
        <Bullet>Purchase Orders raised against a vendor with item, quantity, rate, and delivery date</Bullet>
        <Bullet>PO status tracking — Open, Partially Received, Closed</Bullet>
        <Bullet>GRN entry with partial/multiple deliveries and automatic mismatch flags against the PO</Bullet>

        <Text style={styles.subSectionTitle}>Inventory</Text>
        <Bullet>Multi-location stock — raw material, factory floor/WIP, finished goods, and material at job-work vendors</Bullet>
        <Bullet>Stock transfers between locations, updating both ends in one step</Bullet>
        <Bullet>Reorder alerts when stock falls below a set level</Bullet>
        <Bullet>Stock adjustments after physical count, with a logged audit trail</Bullet>

        <Text style={styles.subSectionTitle}>Production</Text>
        <Bullet>Bills of Materials, including multi-level BOMs and BOM versioning</Bullet>
        <Bullet>Routing and stage-wise tracking for every Work Order</Bullet>
        <Bullet>Job-work tracking — material sent to a vendor, outstanding balance, and receipts</Bullet>
        <Bullet>Work Orders with BOM auto-explosion for material requirement</Bullet>
        <Bullet>Live production status and completion % without a floor visit</Bullet>

      </Page>
      
      <Page size="A4" style={styles.page}>
        <Text style={styles.subSectionTitle}>Sales & Dispatch</Text>
        <Bullet>Sales Orders with items, quantities, rates, and delivery dates</Bullet>
        <Bullet>Dispatch Notes / Delivery Challans, including partial dispatch</Bullet>
        <Bullet>Real-time finished-goods visibility for delivery commitments</Bullet>
        <Bullet>Order status tracking — Pending, Partially Dispatched, Fully Dispatched</Bullet>

        <Text style={styles.subSectionTitle}>HR & Payroll</Text>
        <Bullet>Employee master for permanent and daily-wage/contract staff</Bullet>
        <Bullet>Daily attendance marking, individually or in bulk</Bullet>
        <Bullet>Leave types and balances tracked automatically per employee</Bullet>
        <Bullet>Monthly payroll from attendance and salary structure, including daily-wage computation</Bullet>
        <Bullet>Payslips and a consolidated monthly salary register</Bullet>

        <Text style={styles.subSectionTitle}>Reports & Access Control</Text>
        <Bullet>On-screen and downloadable (PDF/Excel) reports across all modules</Bullet>
        <Bullet>Role-based access, assignable and adjustable at any time</Bullet>

        {/* SECTION 03 */}
        <Text style={styles.sectionTitle}>03 Deliverables & Implementation</Text>
        
        <Text style={styles.subSectionTitle}>Project Deliverables</Text>
        <Bullet>ERP Platform — web-based application, secure login, role-based access, department dashboards</Bullet>
        <Bullet>Operations — Purchase, Inventory, Production, Job Work, Sales, Dispatch</Bullet>
        <Bullet>People — employee management, attendance, leave, payroll</Bullet>
        <Bullet>Management — reports, Excel/PDF exports, audit trails, dashboard</Bullet>
        <Bullet>Implementation — data setup, testing, training, go-live, post-go-live support</Bullet>

        <Text style={styles.subSectionTitle}>Implementation Roadmap</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Phase</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Duration</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Phase 1 — Requirement Study & SRS</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>1–2 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Phase 2 — Core ERP Development</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>3–5 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Phase 3 — Manufacturing & Production</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>2–3 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Phase 4 — HR, Reports & Finalization</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>1–2 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Phase 5 — UAT & Corrections</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>1 week</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Phase 6 — Training & Go-Live</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>1 week</Text></View>
          </View>
        </View>

        {/* SECTION 04 */}
        <Text style={styles.sectionTitle}>04 Commercial Proposal</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Component</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Amount (₹)</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>ERP Application Development</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{erpAppDevCost.toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Manufacturing & Production Module</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{Number(manufacturingCost).toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Inventory & Purchase Module</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{Number(inventoryCost).toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Sales & Dispatch Module</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{Number(salesCost).toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>HR & Payroll Module</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{Number(hrCost).toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Reports & Access Control</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{Number(reportsCost).toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Deployment, Training & Implementation</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{Number(deploymentCost).toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{...styles.tableColHeader, backgroundColor: '#e2e8f0'}}><Text style={styles.tableCellHeader}>Total Project Value</Text></View>
            <View style={{...styles.tableColHeader, backgroundColor: '#e2e8f0'}}><Text style={styles.tableCellHeader}>{totalProjectValue.toLocaleString('en-IN')}</Text></View>
          </View>
          {specialProjectPrice && (
            <View style={styles.tableRow}>
              <View style={{...styles.tableColHeader, backgroundColor: '#dbeafe'}}><Text style={styles.tableCellHeader}>Special Project Price</Text></View>
              <View style={{...styles.tableColHeader, backgroundColor: '#dbeafe'}}><Text style={styles.tableCellHeader}>{Number(specialProjectPrice).toLocaleString('en-IN')}</Text></View>
            </View>
          )}
        </View>

        <Text style={styles.text}><Text style={styles.bold}>Project Value: </Text>₹{Number(specialProjectPrice || totalProjectValue).toLocaleString('en-IN')}</Text>
        <Text style={styles.text}><Text style={styles.bold}>GST: </Text>Extra as applicable</Text>
        <Text style={styles.text}><Text style={styles.bold}>Total Payable: </Text>₹{Number(specialProjectPrice || totalProjectValue).toLocaleString('en-IN')} + applicable GST</Text>
        
        {gstin && <Text style={{...styles.text, marginTop: 10}}><Text style={styles.bold}>Client GSTIN: </Text>{gstin}</Text>}
        {registeredAddress && <Text style={styles.text}><Text style={styles.bold}>Registered Address: </Text>{registeredAddress}</Text>}

      </Page>

      <Page size="A4" style={styles.page}>
        
        <Text style={styles.subSectionTitle}>Payment Schedule</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Milestone</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>% of Total</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Advance — on project confirmation</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>30%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Core modules completed</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>30%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>UAT deployment</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>25%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Production go-live</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>15%</Text></View>
          </View>
        </View>

        {/* SECTION 05 */}
        <Text style={styles.sectionTitle}>05 Support & Maintenance</Text>
        <Text style={styles.text}>Post-implementation support is provided for 6 months from the go-live date.</Text>
        
        <Text style={styles.subSectionTitle}>Included</Text>
        <Bullet>Bug fixing and issues in agreed functionality</Bullet>
        <Bullet>Basic user assistance and minor configuration corrections</Bullet>
        <Bullet>Production support</Bullet>

        <Text style={styles.subSectionTitle}>Not Included</Text>
        <Bullet>New features / reports / integrations or major UI changes</Bullet>
        <Bullet>Third-party service charges or infrastructure/hardware changes</Bullet>

        {/* SECTION 06 */}
        <Text style={styles.sectionTitle}>06 Assumptions, Exclusions & Responsibilities</Text>
        <Text style={styles.text}>The proposed scope and timeline are based on the assumption that required business information and master data will be provided in a timely manner. A designated client representative will be available for requirement validation and UAT.</Text>
        <Text style={styles.text}>Integration with third-party systems, accounting software, biometric devices, or SMS gateways is excluded unless specifically listed in the approved SRS.</Text>
        
        {/* SECTION 07 */}
        <Text style={styles.sectionTitle}>07 Handover & Ownership</Text>
        <Text style={styles.text}>The approved SRS shall serve as the baseline document. Any functionality requested after SRS approval that materially changes the agreed scope shall be treated as a Change Request.</Text>
        <Text style={styles.text}>Source code and project intellectual property shall be transferred to the client upon receipt of 100% of the project payment, subject to the terms of the final agreement.</Text>

        {/* SECTION 08 */}
        <Text style={styles.sectionTitle}>08 Acceptance</Text>
        <Text style={styles.text}>If this offer is acceptable, kindly confirm with your purchase order and advance payment so we can begin the detailed requirement study and start ERP customization. Pricing remains valid for 30 days from the date above.</Text>

        <View wrap={false} style={styles.signatureBlock}>
          <View style={styles.signatureColumn}>
            <Text style={styles.bold}>For DZ INFOTECH</Text>
            <View style={styles.signatureLine} />
            <Text>Authorized Signatory</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text style={styles.bold}>For {clientName || '[Client Company Name]'}</Text>
            <View style={styles.signatureLine} />
            <Text>Authorized Signatory: {contactPerson || '________________'}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
