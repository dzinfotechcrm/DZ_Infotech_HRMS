import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { SIGNATURE_BASE64 } from '../../utils/constants';

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 45,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#1a1a1a',
  },
  header: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    textAlign: 'right',
    letterSpacing: 1,
    marginBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    paddingBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 45,
    right: 45,
    fontSize: 8,
    color: '#71717a',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e4e4e7',
    paddingTop: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    marginBottom: 10,
  },
  recipientBox: {
    marginBottom: 10,
    lineHeight: 1.4,
  },
  subjectLine: {
    marginVertical: 10,
    fontSize: 10,
  },
  subjectBold: {
    fontFamily: 'Helvetica-Bold',
  },
  salutation: {
    marginBottom: 8,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 5,
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    marginVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    minHeight: 18,
    alignItems: 'center',
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 18,
    alignItems: 'center',
  },
  tableColLabel: {
    width: '38%',
    backgroundColor: '#f8fafc',
    borderRightWidth: 0.5,
    borderRightColor: '#94a3b8',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#1e293b',
  },
  tableColValue: {
    width: '62%',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    fontSize: 8.5,
    color: '#0f172a',
  },
  bulletList: {
    marginLeft: 12,
    marginBottom: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    textAlign: 'justify',
    lineHeight: 1.3,
  },
  signOffSection: {
    marginTop: 12,
  },
  signatureImage: {
    width: 110,
    height: 40,
    marginVertical: 3,
  },
  acceptanceBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 0.8,
    borderColor: '#64748b',
    backgroundColor: '#fafafa',
  },
  acceptanceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#0f172a',
  },
});

function formatDateStr(dateStr) {
  if (!dateStr) return '____________________';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export function InternshipProgramOfferLetterPDF({ intern = {} }) {
  const offerDateFormatted = formatDateStr(intern.offer_date || intern.created_at);
  const startDateFormatted = formatDateStr(intern.start_date);
  const endDateFormatted = formatDateStr(intern.end_date);
  const deadlineFormatted = formatDateStr(intern.acceptance_deadline);

  const fullName = intern.full_name || '__________________________________________';
  const firstName = fullName.split(' ')[0] || 'Candidate';
  const address = intern.permanent_address || '___________________________________________';
  const email = intern.email || '_____________________________________________';

  const position = intern.position_domain || 'Intern';
  const department = intern.department || 'Software Engineering';
  const duration = intern.duration || '3 months / 6 months';
  const workMode = intern.work_mode || 'Remote / Work From Home';
  const mentor = intern.mentor_name || 'Designated Lead / Mentor';
  const timings = intern.working_days_hours || 'Monday to Friday, 10:00 AM - 6:00 PM';
  const stipend = intern.stipend || 'Performance-based / Unpaid Industrial Internship';

  const signatoryName = intern.signatory_name || 'Authorized Signatory';
  const signatoryDesignation = intern.signatory_designation || 'Founder & Director';
  const signatoryPlace = intern.signatory_place || 'Bhavnagar, Gujarat, India';

  const rawName = (intern.full_name || 'Candidate').trim();
  const safeName = rawName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const documentTitle = `${safeName}_Offer_Letter.pdf`;

  return (
    <Document title={documentTitle} author="DZ Infotech" subject="Internship Offer Letter">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header} fixed>DZ INFOTECH</Text>

        {/* Title */}
        <Text style={styles.title}>INTERNSHIP OFFER LETTER</Text>

        {/* Date & Recipient */}
        <Text style={styles.dateText}>Date: {offerDateFormatted}</Text>

        <View style={styles.recipientBox}>
          <Text>To,</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Mr. / Ms. {fullName}</Text>
          <Text>Address: {address}</Text>
          <Text>Email: {email}</Text>
        </View>

        {/* Subject */}
        <Text style={styles.subjectLine}>
          <Text style={styles.subjectBold}>Subject: </Text>
          Offer of Internship with DZ Infotech
        </Text>

        {/* Salutation */}
        <Text style={styles.salutation}>Dear {firstName},</Text>

        {/* Opening Paragraph */}
        <Text style={styles.paragraph}>
          We are pleased to offer you an internship opportunity with DZ Infotech, a partnership firm having its principal place of business at Bhavnagar, Gujarat, India. Based on your application and interaction with us, we are happy to invite you to join our internship program on the terms set out below.
        </Text>

        {/* Section 1: Internship Details Table */}
        <Text style={styles.sectionHeading}>1. Internship Details</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Internship Position / Domain</Text>
            <Text style={styles.tableColValue}>{position}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Department / Team</Text>
            <Text style={styles.tableColValue}>{department}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Internship Duration</Text>
            <Text style={styles.tableColValue}>{duration}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Start Date</Text>
            <Text style={styles.tableColValue}>{startDateFormatted}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>End Date</Text>
            <Text style={styles.tableColValue}>{endDateFormatted}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Work Mode / Location</Text>
            <Text style={styles.tableColValue}>{workMode}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Reporting Mentor / Supervisor</Text>
            <Text style={styles.tableColValue}>{mentor}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColLabel}>Working Days & Timings</Text>
            <Text style={styles.tableColValue}>{timings}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableColLabel}>Stipend / Compensation</Text>
            <Text style={styles.tableColValue}>{stipend}</Text>
          </View>
        </View>

        {/* Section 2: Internship Program */}
        <Text style={styles.sectionHeading}>2. Internship Program</Text>
        <Text style={styles.paragraph}>
          During the internship, you will participate in mentor-guided learning activities, interactive sessions, and practical assignments. Depending on the program and project allocation, your responsibilities may include:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Attending scheduled training, mentoring, and review sessions.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Working on assigned individual projects and/or collaborative demo projects.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Applying relevant technical concepts, tools, and development practices to assigned tasks.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Providing progress updates and submitting assigned work within agreed timelines.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Following the Company's technical, security, communication, and project-management guidelines.</Text>
          </View>
        </View>

        {/* Section 3 */}
        <Text style={styles.sectionHeading}>3. Code of Conduct and Responsibilities</Text>
        <Text style={styles.paragraph}>
          You are expected to maintain professional conduct throughout the internship, communicate respectfully with mentors and team members, attend scheduled sessions punctually, and complete assigned tasks with due care. You must follow all reasonable instructions and policies communicated by DZ Infotech.
        </Text>

        {/* Section 4 */}
        <Text style={styles.sectionHeading}>4. Confidentiality and Intellectual Property</Text>
        <Text style={styles.paragraph}>
          As part of your internship, you may receive access to confidential Company or client information. You are required to sign and comply with the Student Internship Non-Disclosure and Confidentiality Agreement (NDA) provided separately. The NDA and any applicable project-specific instructions will govern the handling of confidential information and intellectual property.
        </Text>

        {/* Section 5 */}
        <Text style={styles.sectionHeading}>5. Attendance, Leave, and Performance</Text>
        <Text style={styles.paragraph}>
          You are expected to maintain regular attendance and inform your reporting mentor in advance of any absence or delay, except in emergencies. Your progress and performance may be reviewed periodically. Continued participation in the internship is subject to satisfactory conduct, attendance, engagement, and completion of assigned responsibilities.
        </Text>

        {/* Section 6 */}
        <Text style={styles.sectionHeading}>6. Completion and Certification</Text>
        <Text style={styles.paragraph}>
          An Internship Completion Certificate and, where applicable, a Letter of Recommendation may be considered upon successful completion of the internship, subject to attendance, performance, conduct, and completion of assigned requirements. Issuance of such documents is not automatic and will be determined by DZ Infotech based on the applicable completion criteria.
        </Text>

        {/* Section 7 */}
        <Text style={styles.sectionHeading}>7. Nature of Engagement and Termination</Text>
        <Text style={styles.paragraph}>
          This internship is intended for learning and practical experience and does not, by itself, create an employer-employee relationship. Either party may request termination of the internship by providing written notice of <Text style={{ fontFamily: 'Helvetica-Bold' }}>7 days</Text>, subject to any applicable Company policies and the terms of the signed NDA. DZ Infotech may end the internship earlier in cases of serious misconduct, breach of confidentiality, or repeated failure to meet reasonable internship requirements.
        </Text>

        {/* Section 8 */}
        <Text style={styles.sectionHeading}>8. Acceptance of Offer</Text>
        <Text style={styles.paragraph}>
          Please confirm your acceptance of this offer by signing and returning a copy of this letter on or before <Text style={{ fontFamily: 'Helvetica-Bold' }}>{deadlineFormatted}</Text>. Your signature confirms that you have read and accepted the terms stated in this offer letter. This offer should be read together with the separately provided NDA.
        </Text>

        <Text style={styles.paragraph}>
          We look forward to having you join DZ Infotech and wish you a productive and rewarding learning experience.
        </Text>

        {/* Sign-off Block */}
        <View wrap={false} style={styles.signOffSection}>
          <Text>Sincerely,</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 3, marginBottom: 4 }}>For DZ INFOTECH</Text>

          <View style={{ width: 220, marginBottom: 5 }}>
            <View style={{ height: 42, justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 2 }}>
              {SIGNATURE_BASE64 ? (
                <Image src={SIGNATURE_BASE64} style={{ width: 110, height: 38, objectFit: 'contain' }} />
              ) : null}
              <View style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#475569' }} />
            </View>
            <Text style={{ fontSize: 7.5, color: '#64748b', marginBottom: 4 }}>(Authorized Signature)</Text>
          </View>

          <Text style={{ marginTop: 1.5 }}>Authorized Signatory: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{signatoryName}</Text></Text>
          <Text style={{ marginTop: 1.5 }}>Designation: {signatoryDesignation}</Text>
          <Text style={{ marginTop: 1.5 }}>Date: {offerDateFormatted}</Text>
          <Text style={{ marginTop: 1.5 }}>Place: {signatoryPlace}</Text>
        </View>

        {/* Acceptance Box */}
        <View wrap={false} style={styles.acceptanceBox}>
          <Text style={styles.acceptanceTitle}>ACCEPTANCE BY INTERN</Text>
          <Text style={styles.paragraph}>
            I, <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fullName}</Text>, accept the internship offer made by DZ Infotech and agree to the terms stated in this letter.
          </Text>
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ width: '55%' }}>
              <Text style={{ marginBottom: 4 }}>Full Name: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fullName}</Text></Text>
              <Text style={{ marginBottom: 4 }}>Date: _____________________________</Text>
              <Text>Place: ____________________________</Text>
            </View>
            <View style={{ width: '40%', alignItems: 'center' }}>
              <View style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#475569', height: 28, marginBottom: 3 }} />
              <Text style={{ fontSize: 7.5, color: '#64748b' }}>(Intern's Signature)</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `DZ Infotech | Internship Offer Letter  •  Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export default InternshipProgramOfferLetterPDF;
