import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const colors = {
  primary: '#172A6C',
  secondary: '#EA6B23',
  number: '#D8CBB0',
  text: '#222222',
  lightText: '#888888',
  footerText: '#555555',
  gold: '#B08D57' // A nice gold/brown color for the values
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.3,
    color: colors.text,
  },
  coverPage: {
    marginBottom: 20,
  },
  coverLogo: {
    width: 180,
    marginTop: 30,
    marginBottom: 30,
    alignSelf: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.primary,
    marginBottom: 25,
    textAlign: 'center',
  },
  heroModules: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  heroDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    width: '100%',
    marginBottom: 30,
  },
  grid2: {
    flexDirection: 'row',
    marginBottom: 15
  },
  gridCol2: {
    width: '50%'
  },
  grid3: {
    flexDirection: 'row',
    marginBottom: 20
  },
  gridCol3: {
    width: '33.33%'
  },
  orangeLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#000000',
  },
  sectionHeaderContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  sectionHeaderRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionHeaderCompany: {
    fontSize: 14,
    color: colors.lightText,
  },
  sectionHeaderLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    width: '100%',
  },
  sectionNumber: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.number,
    marginRight: 6,
    lineHeight: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 1,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    marginBottom: 6,
    textAlign: 'justify',
  },
  textItalic: {
    marginBottom: 6,
    textAlign: 'justify',
    fontStyle: 'italic',
  },
  textBold: {
    fontWeight: 'bold',
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
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableRowSpecial: {
    flexDirection: 'row',
    backgroundColor: '#EFE5D3',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableColHeader: {
    padding: 6,
    backgroundColor: colors.primary,
  },
  tableCol: {
    padding: 6,
  },
  tableCellHeaderWhite: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableCellHeader: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10.5,
  },
  splitBox: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10
  },
  splitBoxCol: {
    width: '50%',
    paddingRight: 10,
  },
  splitBoxColRight: {
    width: '50%',
    paddingLeft: 10,
  },
  textGreen: {
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  textRed: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  calloutBox: {
    backgroundColor: '#F8F5EE',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  pageHeaderRight: {
    position: 'absolute',
    top: 20,
    right: 40,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

const Bullet = ({ children }) => (
  <View wrap={false} style={styles.listItem}>
    <Text style={styles.bulletPoint}>•</Text>
    <Text style={styles.listItemText}>{children}</Text>
  </View>
);

const SectionHeader = ({ number, title, pageBreak = true }) => (
  <View style={styles.sectionHeaderContainer} break={pageBreak}>
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionNumber}>{number}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
    <View style={styles.sectionHeaderLine} />
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
    amcCost,
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

  const formatNumber = (num) => Number(num).toLocaleString('en-IN');

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.pageHeaderRight} fixed>DZ INFOTECH</Text>
        <View style={styles.coverPage}>
          <Image src="/DZ_Infotech_Logo.jpeg" style={styles.coverLogo} />
          <Text style={styles.heroTitle}>Customized Manufacturing ERP</Text>
          <Text style={styles.heroSubtitle}>Software Design, Development & Implementation</Text>
          <Text style={styles.heroModules}>MANUFACTURING  •  INVENTORY  •  PRODUCTION  •  HR & PAYROLL</Text>

          <View style={styles.heroDivider} />

          <View style={styles.grid2}>
            <View style={styles.gridCol2}>
              <Text style={styles.orangeLabel}>PREPARED FOR</Text>
              <Text style={styles.valueText}>{clientName || '[Client Company Name]'}</Text>
            </View>
            <View style={styles.gridCol2}>
              <Text style={styles.orangeLabel}>CONTACT</Text>
              <Text style={styles.valueText}>{contactPerson || '[Client Contact Person]'}</Text>
            </View>
          </View>

          <View style={styles.grid3}>
            <View style={styles.gridCol3}>
              <Text style={styles.orangeLabel}>QUOTATION NO.</Text>
              <Text style={styles.valueText}>{quotationNumber || '[QT-YYYYMMDD-A]'}</Text>
            </View>
            <View style={styles.gridCol3}>
              <Text style={styles.orangeLabel}>DATE</Text>
              <Text style={styles.valueText}>{quotationDate || '[Quotation Date]'}</Text>
            </View>
            <View style={styles.gridCol3}>
              <Text style={styles.orangeLabel}>VALID UNTIL</Text>
              <Text style={styles.valueText}>{validityDate || '[Validity Date]'}</Text>
            </View>
          </View>

          <Text style={styles.orangeLabel}>BUSINESS OBJECTIVE</Text>
          <Text style={styles.textItalic}>{businessObjective || "[One to two sentences on the client's business, plant/operations, and the core problem this ERP solves for them — replace scattered spreadsheets, disconnected tracking, lack of real-time visibility, etc.]"}</Text>

          <Text style={styles.orangeLabel}>PROPOSED SOLUTION</Text>
          <Text style={styles.textItalic}>{proposedSolution || "[One to two sentences on the proposed system — a fully customized ERP built around the client's actual workflow, covering procurement through production, dispatch, and payroll, so every department works off one live, accurate source of truth.]"}</Text>
        </View>

        <SectionHeader number="01" title="Project Overview" pageBreak={true} />

        <Text style={styles.subTitle}>Module Flow</Text>
        <Text style={{ ...styles.textBold, color: colors.primary, fontSize: 10 }}>Purchase → Inventory → Production → Job Work → Sales & Dispatch → HR & Payroll → Reports</Text>

        <Text style={styles.subTitle}>Module Summary</Text>
        <Bullet>Purchase — vendor POs, shortage-driven ordering, GRN tracking against open POs.</Bullet>
        <Bullet>Inventory — multi-location stock, transfers, reorder alerts, physical-count adjustments, valuation.</Bullet>
        <Bullet>Production — multi-level BOMs, stage-wise routing, job-work tracking, live work-order status.</Bullet>
        <Bullet>Sales & Dispatch — sales orders, delivery challans, partial dispatch, real-time finished-goods visibility.</Bullet>
        <Bullet>HR & Payroll — employee master, attendance, leave, payroll and payslip generation.</Bullet>
        <Bullet>Reports & Access Control — on-screen and exportable reports, role-based access across departments.</Bullet>

        <SectionHeader number="02" title="Detailed Functional Scope" pageBreak={true} />

        <Text style={styles.subTitle}>Purchase</Text>
        <Bullet>Material requirement visibility — shortages calculated from active production, current stock, and open POs</Bullet>
        <Bullet>Purchase Orders raised against a vendor with item, quantity, rate, and delivery date</Bullet>
        <Bullet>PO status tracking — Open, Partially Received, Closed</Bullet>
        <Bullet>GRN entry with partial/multiple deliveries and automatic mismatch flags against the PO</Bullet>

        <Text style={styles.subTitle}>Inventory</Text>
        <Bullet>Multi-location stock — raw material, factory floor/WIP, finished goods, and material at job-work vendors</Bullet>
        <Bullet>Stock transfers between locations, updating both ends in one step</Bullet>
        <Bullet>Reorder alerts when stock falls below a set level</Bullet>
        <Bullet>Stock adjustments after physical count, with a logged audit trail</Bullet>
        <Bullet>Stock valuation by item and location</Bullet>

        <Text style={styles.subTitle}>Production</Text>
        <Bullet>Bills of Materials, including multi-level BOMs and BOM versioning</Bullet>
        <Bullet>Routing and stage-wise tracking for every Work Order</Bullet>
        <Bullet>Job-work tracking — material sent to a vendor, outstanding balance, and receipts</Bullet>
        <Bullet>Work Orders with BOM auto-explosion for material requirement</Bullet>
        <Bullet>Live production status and completion % without a floor visit</Bullet>

        <Text style={styles.subTitle}>Sales & Dispatch</Text>
        <Bullet>Sales Orders with items, quantities, rates, and delivery dates</Bullet>
        <Bullet>Dispatch Notes / Delivery Challans, including partial dispatch</Bullet>
        <Bullet>Real-time finished-goods visibility for delivery commitments</Bullet>
        <Bullet>Order status tracking — Pending, Partially Dispatched, Fully Dispatched</Bullet>

        <Text style={styles.subTitle}>HR & Payroll</Text>
        <Bullet>Employee master for permanent and daily-wage/contract staff</Bullet>
        <Bullet>Daily attendance marking, individually or in bulk</Bullet>
        <Bullet>Leave types and balances tracked automatically per employee</Bullet>
        <Bullet>Monthly payroll from attendance and salary structure, including daily-wage computation</Bullet>
        <Bullet>Payslips and a consolidated monthly salary register</Bullet>

        <Text style={styles.textItalic}>Note: this module covers HR & Payroll only. If ledger, GST, TDS, bank reconciliation, or financial-statement functionality is required, it must be listed separately as an Accounting module.</Text>

        <Text style={styles.subTitle}>Reports & Access Control</Text>
        <Bullet>On-screen and downloadable (PDF/Excel) reports across all modules</Bullet>
        <Bullet>Role-based access, assignable and adjustable at any time</Bullet>

        <SectionHeader number="03" title="Deliverables & Implementation" pageBreak={true} />

        <Text style={styles.subTitle}>Project Deliverables</Text>
        <Bullet><Text style={styles.textBold}>ERP Platform — web-based application, secure login, role-based access, department dashboards</Text></Bullet>
        <Bullet><Text style={styles.textBold}>Operations — Purchase, Inventory, Production, Job Work, Sales, Dispatch</Text></Bullet>
        <Bullet><Text style={styles.textBold}>People — employee management, attendance, leave, payroll</Text></Bullet>
        <Bullet><Text style={styles.textBold}>Management — reports, Excel/PDF exports, audit trails, dashboard</Text></Bullet>
        <Bullet><Text style={styles.textBold}>Implementation — data setup, testing, training, go-live, post-go-live support</Text></Bullet>

        <Text style={styles.subTitle}>Scope of Work</Text>
        <Bullet>Understanding the client's business requirements and existing plant workflow</Bullet>
        <Bullet>Preparation of a Software Requirement Specification (SRS) and client approval</Bullet>
        <Bullet>ERP customization as per the approved process flow</Bullet>
        <Bullet>Master data setup — items, customers, suppliers, machines, users, and process data</Bullet>
        <Bullet>Testing, validation, and correction of identified issues before go-live</Bullet>
        <Bullet>User training for concerned departments</Bullet>
        <Bullet>Implementation support during the go-live phase</Bullet>
        <Bullet>Post-implementation support for the agreed support period</Bullet>

        <Text style={styles.subTitle}>Implementation Roadmap</Text>
        <View style={styles.table} wrap={false}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableColHeader, width: '50%' }}><Text style={styles.tableCellHeaderWhite}>Phase</Text></View>
            <View style={{ ...styles.tableColHeader, width: '50%' }}><Text style={styles.tableCellHeaderWhite}>Duration</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Phase 1 — Requirement Study & SRS</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>1–2 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Phase 2 — Core ERP Development</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>3–5 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Phase 3 — Manufacturing & Production</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>2–3 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Phase 4 — HR, Reports & Finalization</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>1–2 weeks</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Phase 5 — UAT & Corrections</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>1 week</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Phase 6 — Training & Go-Live</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>1 week</Text></View>
          </View>
        </View>
        <Text style={styles.textItalic}>Timeline is dependent on timely availability of master data, feedback, approvals and client-side resources.</Text>

        <SectionHeader number="04" title="Commercial Proposal" pageBreak={true} />
        <View style={styles.table} wrap={false}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableColHeader, width: '70%' }}><Text style={styles.tableCellHeaderWhite}>Component</Text></View>
            <View style={{ ...styles.tableColHeader, width: '30%' }}><Text style={styles.tableCellHeaderWhite}>Amount (₹)</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>ERP Application Development</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(erpAppDevCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Manufacturing & Production Module</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(manufacturingCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Inventory & Purchase Module</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(inventoryCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Sales & Dispatch Module</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(salesCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>HR & Payroll Module</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(hrCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Reports & Access Control</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(reportsCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Deployment, Training & Implementation</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{formatNumber(deploymentCost)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCellHeader}>Total Project Value</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCellHeader}>{formatNumber(totalProjectValue)}</Text></View>
          </View>
          <View style={styles.tableRowSpecial}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCellHeader}>Special Project Price</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={{ ...styles.tableCellHeader, color: colors.secondary }}>{formatNumber(specialProjectPrice || totalProjectValue)}</Text></View>
          </View>
        </View>

        <Text style={styles.text}><Text style={styles.textBold}>Project Value: </Text>Rs. {formatNumber(specialProjectPrice || totalProjectValue)}</Text>
        <Text style={styles.text}><Text style={styles.textBold}>GST: </Text>Extra as applicable</Text>
        <Text style={{ ...styles.textBold, color: colors.primary }}>Total Payable: Rs. {formatNumber(specialProjectPrice || totalProjectValue)} + applicable GST</Text>

        <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 15 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ ...styles.textItalic, marginBottom: 0 }}>GSTIN: {gstin || '[GSTIN Number]'}</Text>
          </View>
          <View style={{ flex: 1.5, flexDirection: 'row' }}>
            <Text style={{ ...styles.textItalic, marginBottom: 0, flexShrink: 0 }}>Registered Address: </Text>
            <Text style={{ ...styles.textItalic, marginBottom: 0, flex: 1 }}>{registeredAddress || '[Company Registered Address]'}</Text>
          </View>
        </View>

        <Text style={styles.subTitle}>Payment Schedule</Text>
        <View style={styles.table} wrap={false}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableColHeader, width: '70%' }}><Text style={styles.tableCellHeaderWhite}>Milestone</Text></View>
            <View style={{ ...styles.tableColHeader, width: '30%' }}><Text style={styles.tableCellHeaderWhite}>% of Total</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Advance — on project confirmation</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>30%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Core modules completed</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>30%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>UAT deployment</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>25%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '70%' }}><Text style={styles.tableCell}>Production go-live</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>15%</Text></View>
          </View>
        </View>
        <Text style={styles.textItalic}>Production deployment, source-code handover, and final documentation will be completed after receipt of all outstanding project payments.</Text>

        <SectionHeader number="05" title="Support & Maintenance" pageBreak={true} />
        <Text style={styles.text}>Post-implementation support is provided for 6 months from the go-live date.</Text>

        <View style={styles.splitBox} wrap={false}>
          <View style={styles.splitBoxCol}>
            <Text style={styles.textGreen}>Included</Text>
            <Bullet>Bug fixing</Bullet>
            <Bullet>Issues in agreed functionality</Bullet>
            <Bullet>Basic user assistance</Bullet>
            <Bullet>Minor configuration corrections</Bullet>
            <Bullet>Production support</Bullet>
          </View>
          <View style={styles.splitBoxColRight}>
            <Text style={styles.textRed}>Not Included</Text>
            <Bullet>New features / reports / integrations</Bullet>
            <Bullet>Major UI changes</Bullet>
            <Bullet>New workflows</Bullet>
            <Bullet>Third-party service charges</Bullet>
            <Bullet>Infrastructure or hardware changes</Bullet>
          </View>
        </View>
        <Text style={styles.textItalic}>Support does not include changes resulting from modifications made by third-party developers or unauthorized changes to the application or database.</Text>

        <Text style={styles.subTitle}>Annual Maintenance Contract</Text>
        <Text style={styles.text}>An Annual Maintenance Contract at Rs. {formatNumber(amcCost || 30000)}/year is available once the free support period ends.</Text>

        <SectionHeader number="06" title="Assumptions, Exclusions & Responsibilities" pageBreak={true} />

        <Text style={styles.subTitle}>Scope Summary</Text>
        <View style={styles.splitBox} wrap={false}>
          <View style={styles.splitBoxCol}>
            <Text style={styles.textGreen}>Within Scope</Text>
            <Bullet>Full ERP customization across the modules listed above</Bullet>
            <Bullet>Role-based access control</Bullet>
            <Bullet>Master data setup for agreed items and opening balances</Bullet>
            <Bullet>User training and go-live implementation support</Bullet>
            <Bullet>6 months of post-implementation support from go-live</Bullet>
          </View>
          <View style={styles.splitBoxColRight}>
            <Text style={styles.textRed}>Outside Scope</Text>
            <Bullet>Mobile application</Bullet>
            <Bullet>Tally / accounting software integration</Bullet>
            <Bullet>Biometric or barcode/QR hardware</Bullet>
            <Bullet>GST e-invoicing, WhatsApp, SMS or email gateway charges</Bullet>
            <Bullet>Hosting, server, or networking charges</Bullet>
            <Bullet>Major UI redesign after SRS approval</Bullet>
            <Bullet>Additional modules, reports, or user roles beyond scope</Bullet>
            <Bullet>Historical data migration beyond the agreed dataset</Bullet>
          </View>
        </View>

        <Text style={styles.subTitle}>Hosting & Infrastructure</Text>
        <Text style={styles.text}>This quotation covers application development and implementation only. Cloud/server hosting, domain, SSL certificates, email/SMS/WhatsApp services, third-party APIs, biometric hardware, networking equipment, and other third-party infrastructure or services are excluded unless specifically mentioned. Where hosting is provided by DZ Infotech, it is billed separately as a recurring line item (e.g. Cloud Hosting & Backup: ₹[X]/month or ₹[X]/year).</Text>

        <Text style={styles.subTitle}>Integrations</Text>
        <Text style={styles.text}>Integration with third-party systems, accounting software, biometric devices, weighing machines, payment gateways, WhatsApp, email/SMS gateways, APIs, or other external systems is excluded unless specifically listed in the approved SRS.</Text>

        <View style={styles.table} wrap={false}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableColHeader, width: '50%' }}><Text style={styles.tableCellHeaderWhite}>Integration</Text></View>
            <View style={{ ...styles.tableColHeader, width: '50%' }}><Text style={styles.tableCellHeaderWhite}>Status</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Biometric Device</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>[Future / Optional / Included]</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Accounting Software (e.g. Tally)</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>[Not Included / Included]</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>WhatsApp</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>[Not Included / Included]</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Email</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>[Optional / Included]</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>Barcode / QR</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.tableCell}>[Optional / Included]</Text></View>
          </View>
        </View>

        <Text style={styles.subTitle}>Data Security & Backup</Text>
        <Text style={styles.text}>The system will implement role-based access control and appropriate application-level security measures. Database backups will be configured according to the agreed hosting architecture. Backup retention, disaster recovery, and infrastructure-level security will depend on the selected hosting environment.</Text>

        <Text style={styles.subTitle}>Client Responsibilities</Text>
        <Text style={styles.text}>{clientName || '[Client Company Name]'} shall provide accurate business process information, master data (item, vendor, customer, and employee masters, BOMs, process/routing information, opening stock, salary structures), required approvals, authorized users, timely feedback, and necessary access to relevant personnel for requirement validation and UAT.</Text>

        <Text style={styles.subTitle}>Dependencies & Assumptions</Text>
        <Text style={styles.text}>The proposed scope and timeline are based on the assumption that:</Text>
        <Bullet>Required business information will be provided in a timely manner</Bullet>
        <Bullet>Master data will be supplied in agreed formats</Bullet>
        <Bullet>A designated client representative will be available for requirement validation and UAT</Bullet>
        <Bullet>Required third-party hardware/API access will be provided by the client</Bullet>
        <Bullet>Any major changes to the approved workflow may affect project cost and timeline</Bullet>

        <SectionHeader number="07" title="Handover & Ownership" pageBreak={true} />

        <Text style={styles.subTitle}>Scope Baseline</Text>
        <Text style={styles.text}>The approved SRS shall serve as the baseline document for development and acceptance. Any functionality not explicitly included in the approved SRS shall be considered outside the initial project scope unless otherwise agreed in writing.</Text>

        <Text style={styles.subTitle}>Change Requests</Text>
        <Text style={styles.text}>The project scope is based on the approved SRS. Any functionality, workflow, report, integration, screen, business rule, or modification requested after SRS approval that materially changes the agreed scope shall be treated as a Change Request. Such requests will be evaluated for effort, cost, and timeline and will be implemented only after written approval.</Text>

        <Text style={styles.subTitle}>User Acceptance Testing</Text>
        <Text style={styles.text}>Following completion of development, the ERP will be deployed to a staging/UAT environment for client testing. The client will review the system against the approved SRS and provide consolidated feedback. Issues relating to agreed functionality will be corrected by DZ Infotech. New functionality or changes to approved workflows will be treated as Change Requests.</Text>
        <Text style={styles.text}>If no material issues are reported within 7 business days of UAT deployment, the system shall be considered accepted for go-live.</Text>

        <Text style={styles.subTitle}>Handover Deliverables</Text>
        <Bullet>User login credentials with a short training walkthrough for each department</Bullet>
        <Bullet>User manual and technical documentation</Bullet>
        <Bullet>Master data setup as configured for the client</Bullet>

        <Text style={styles.subTitle}>Source Code & Intellectual Property</Text>
        <Text style={styles.text}>Source code and project intellectual property shall be transferred to the client upon receipt of 100% of the project payment, subject to the terms of the final agreement. DZ Infotech retains ownership of its pre-existing libraries, frameworks, reusable components, tools, templates, and proprietary technology used in the development of the solution.</Text>

        <View style={styles.calloutBox} wrap={false}>
          <Text style={styles.calloutTitle}>Optional — recurring revenue variant</Text>
          <Text style={{ ...styles.text, marginBottom: 0 }}>Source-code transfer is included only under the selected ownership package. Standard implementation packages provide usage rights while the underlying reusable technology remains the property of DZ Infotech.</Text>
        </View>

        <SectionHeader number="08" title="Acceptance" pageBreak={true} />

        <View style={styles.calloutBox} wrap={false}>
          <Text style={styles.calloutTitle}>What happens next</Text>
          <Text style={{ ...styles.text, marginBottom: 0 }}>If this offer is acceptable, kindly confirm with your purchase order and advance payment so we can begin the detailed requirement study and start ERP customization. Pricing is based on the scope and assumptions defined in this quotation and remains valid for 30 days from the date above; any changes in scope after quotation expiry may be subject to revised commercial terms.</Text>
        </View>

        <Text style={styles.text}>For DZ Infotech</Text>
        <Text style={styles.textBold}>Soumyarajsinh Zala</Text>
        <Text style={{ fontSize: 9, color: colors.footerText }}>DZ Infotech · info@dzinfotech.in · 9327853727</Text>

        <Text style={styles.orangeLabel}>ACCEPTANCE</Text>
        <Text style={styles.subTitle}>Offer Acceptance by {clientName || '[Client Company Name]'}</Text>
        <Text style={styles.text}>By signing below, {clientName || '[Client Company Name]'} confirms it has read and accepted this quotation and its terms, and authorizes DZ Infotech to proceed as outlined above.</Text>

        <Text style={styles.text}>For {clientName || '[Client Company Name]'}</Text>

        <View style={{ marginTop: 30 }} wrap={false}>
          <Text style={styles.text}>Authorized Signatory: ___________________________________</Text>
        </View>
        <View style={{ marginTop: 15 }} wrap={false}>
          <Text style={styles.text}>Name: ___________________________________</Text>
        </View>
      </Page>
    </Document>
  );
};
