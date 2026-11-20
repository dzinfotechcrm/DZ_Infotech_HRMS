import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { SIGNATURE_BASE64 } from '../../utils/constants';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontFamily: 'Helvetica',
    fontSize: 9.2,
    lineHeight: 1.35,
    color: '#1a1a1a',
  },
  header: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    textAlign: 'right',
    letterSpacing: 1,
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    paddingBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 45,
    right: 45,
    fontSize: 8,
    color: '#71717a',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e4e4e7',
    paddingTop: 5,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  noticeBox: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    marginBottom: 8,
    fontSize: 8.5,
    lineHeight: 1.3,
  },
  effectiveDate: {
    fontFamily: 'Helvetica',
    marginBottom: 6,
    fontSize: 9,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 7,
    marginBottom: 3.5,
  },
  paragraph: {
    marginBottom: 5,
    textAlign: 'justify',
  },
  listContainer: {
    marginLeft: 4,
    marginBottom: 5,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  listNum: {
    width: 20,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  listText: {
    flex: 1,
    fontSize: 9,
    textAlign: 'justify',
    lineHeight: 1.3,
  },
  bulletList: {
    marginLeft: 12,
    marginBottom: 5,
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
    fontSize: 8.8,
    textAlign: 'justify',
    lineHeight: 1.3,
  },
  boldLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  partiesBox: {
    padding: 5,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#fafafa',
    marginBottom: 6,
  },
  partyRow: {
    marginBottom: 2,
    fontSize: 8.8,
  },
  parentSignatureBox: {
    marginTop: 6,
    padding: 6,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    width: '100%',
  },
});

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatEffectiveDate(dateStr) {
  if (!dateStr) return '_____ day of ____________________, 20____';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const dayOrdinal = getOrdinal(day);
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    return `${dayOrdinal} day of ${month}, ${year}`;
  } catch (e) {
    return dateStr;
  }
}

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

export function InternshipProgramNDAPDF({ intern = {} }) {
  const effectiveDateFormatted = formatEffectiveDate(intern.nda_effective_date || intern.start_date || intern.offer_date);
  const signDateFormatted = formatDateStr(intern.nda_effective_date || intern.start_date || intern.offer_date);

  const fullName = intern.full_name || '______________________________________________________________';
  const guardianName = intern.guardian_name || '______________________________________________________________';
  const collegeName = intern.college_name || '______________________________________________________________';
  const degreeBranch = intern.degree_branch || '______________________________________________________________';
  const address = intern.permanent_address || '______________________________________________________________';
  const email = intern.email || '__________________________________________________________';
  const phone = intern.phone || '______________________________________________________';
  const duration = (intern.duration || '').toLowerCase().includes('6') ? '6 Months' : '3 Months';

  const signatoryName = intern.signatory_name || 'Authorized Signatory';
  const signatoryDesignation = intern.signatory_designation || 'Founder & Director';
  const signatoryPlace = intern.signatory_place || 'Bhavnagar, Gujarat, India';

  const rawName = (intern.full_name || 'Student').trim();
  const safeName = rawName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const documentTitle = `${safeName}_NDA.pdf`;

  return (
    <Document title={documentTitle} author="DZ Infotech" subject="Student Internship Non-Disclosure Agreement">
      {/* ================= PAGE 1 ================= */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>STUDENT INTERNSHIP NON-DISCLOSURE AND{'\n'}CONFIDENTIALITY AGREEMENT (NDA)</Text>

        <View style={styles.noticeBox}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>IMPORTANT: </Text>
          <Text>
            This Non-Disclosure and Confidentiality Agreement ("Agreement") is a legal contract between DZ Infotech and the undersigned student/intern. Please review all terms carefully before signing.
          </Text>
        </View>

        <Text style={styles.effectiveDate}>
          This Agreement is made and entered into on this {effectiveDateFormatted} ("Effective Date"), by and between:
        </Text>

        <Text style={styles.sectionHeading}>1. PARTIES</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>DZ INFOTECH</Text>, a partnership firm having its principal place of business at Bhavnagar, Gujarat, India (hereinafter referred to as the “Company” or “DZ Infotech”, which expression shall unless repugnant to the context include its partners, successors, affiliates, and permitted assigns) of the <Text style={{ fontFamily: 'Helvetica-Bold' }}>FIRST PART</Text>;
        </Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', marginVertical: 2.5 }}>AND</Text>

        <View style={styles.partiesBox}>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>Mr. / Ms.: </Text>{fullName}</Text>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>Son / Daughter of: </Text>{guardianName}</Text>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>College / University: </Text>{collegeName}</Text>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>Degree / Branch & Year: </Text>{degreeBranch}</Text>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>Permanent Address: </Text>{address}</Text>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>Email Address: </Text>{email}</Text>
          <Text style={styles.partyRow}><Text style={styles.boldLabel}>Phone / WhatsApp: </Text>{phone}</Text>
        </View>

        <Text style={styles.paragraph}>
          (hereinafter referred to as the “Intern” or “Student”, which expression shall unless repugnant to the context include their legal heirs and representatives) of the <Text style={{ fontFamily: 'Helvetica-Bold' }}>SECOND PART</Text>.
        </Text>
        <Text style={styles.paragraph}>
          (The Company and the Intern are collectively referred to as the “Parties” and individually as a “Party”.)
        </Text>

        {/* PREAMBLE / RECITALS */}
        <Text style={styles.sectionHeading}>PREAMBLE / RECITALS</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>WHEREAS:</Text>
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>1.</Text>
            <Text style={styles.listText}>The Company is engaged in technology solutions, software engineering, enterprise automations, application development, and digital consulting.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>2.</Text>
            <Text style={styles.listText}>The Company conducts mentor-guided industrial internship programs (3-month fast-track and 6-month advanced batches) where students participate in live interactive sessions, execute individual live projects, and collaborate on demo group projects.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>3.</Text>
            <Text style={styles.listText}>In connection with the Intern’s enrollment and participation in the internship program, the Company will grant the Intern access to certain non-public, proprietary, and business-critical technical and commercial information.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>4.</Text>
            <Text style={styles.listText}>To protect the Company’s proprietary interests, intellectual property, client trust, and trade secrets, the Parties agree to enter into this Agreement.</Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>NOW, THEREFORE,</Text> in consideration of the mutual covenants contained herein and other good and valuable consideration (including the training, project allocations, and mentorship provided), the Parties agree as follows:
        </Text>

        {/* 1. DEFINITION OF CONFIDENTIAL INFORMATION */}
        <Text style={styles.sectionHeading}>1. DEFINITION OF CONFIDENTIAL INFORMATION</Text>
        <Text style={styles.paragraph}>
          For the purposes of this Agreement, “Confidential Information” shall mean any and all non-public, sensitive, or proprietary information, whether technical, operational, or commercial, disclosed directly or indirectly by the Company to the Intern, whether in writing, oral, electronic, visual, or machine-readable format, including but not limited to:
        </Text>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Student Internship Non-Disclosure and Confidentiality Agreement  •  Page 1 of 4
        </Text>
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.header}>DZ INFOTECH</Text>

        {/* 5 through 9 under Definition */}
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>5.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Source Code & Technical Assets: </Text>Source code, object code, system architectures, database schemas, API keys, credentials, algorithms, data structures, repositories, pull requests, frameworks, design patterns, testing suites, bug logs, and server configurations.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>6.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Project Data & Client Information: </Text>Real-world client requirements, business specifications, wireframes, prototypes, user journeys, production datasets, operational workflows, customer lists, and client identities.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>7.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Internal Materials & Sessions: </Text>Training curricula, session recordings, workshop notes, mentorship guidelines, internal roadmaps, internal discussion boards, and operational procedures.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>8.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Business & Financial Information: </Text>Business strategies, pricing structures, marketing initiatives, partnership details, and operational practices.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>9.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Derivative Works: </Text>Any code, notes, summaries, diagrams, or deliverables created by the Intern based upon or incorporating the Company's Confidential Information.</Text>
          </View>
        </View>

        {/* 2. EXCLUSIONS */}
        <Text style={styles.sectionHeading}>2. EXCLUSIONS FROM CONFIDENTIAL INFORMATION</Text>
        <Text style={styles.paragraph}>
          Confidential Information shall not include information that the Intern can demonstrate through documented proof:
        </Text>
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>10.</Text>
            <Text style={styles.listText}>Is or becomes publicly known without breach of this Agreement by the Intern.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>11.</Text>
            <Text style={styles.listText}>Was already in the rightful possession of the Intern prior to disclosure by the Company, without any obligation of confidentiality.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>12.</Text>
            <Text style={styles.listText}>Is independently developed by the Intern without any reference to, access to, or reliance upon the Company's Confidential Information.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>13.</Text>
            <Text style={styles.listText}>Is rightfully obtained by the Intern from an independent third party without breach of any confidentiality obligation.</Text>
          </View>
        </View>

        {/* 3. OBLIGATIONS */}
        <Text style={styles.sectionHeading}>3. OBLIGATIONS OF THE INTERN</Text>
        <Text style={styles.paragraph}>The Intern explicitly agrees to the following covenants:</Text>
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>14.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Standard of Care: </Text>The Intern shall hold all Confidential Information in strict confidence and shall apply the highest degree of care (at least reasonable care) to prevent unauthorized disclosure, leakage, copying, or misuse.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>15.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Limited & Permitted Purpose: </Text>The Intern shall use Confidential Information solely and strictly for the purpose of completing their assigned internship tasks, projects, and guided sessions under the supervision of DZ Infotech mentors.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>16.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>No Third-Party Disclosure: </Text>The Intern shall not publish, share, transmit, forward, or disclose any Confidential Information to any third party (including friends, classmates, professors, or unauthorized individuals) without prior written authorization from DZ Infotech.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>17.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>Prohibition of Public Code Repositories: </Text>Under no circumstances shall the Intern push, upload, host, or publish any live project code, client code, proprietary scripts, database schemas, or API credentials to public code-hosting platforms (including public GitHub, GitLab, Bitbucket, Pastebin, Gist, or public Google Drive folders). All code must strictly remain in private company-designated repositories.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>18.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>No AI Scraping / Public Model Ingestion: </Text>The Intern shall not upload or feed the Company’s or clients’ proprietary source code, credentials, or sensitive business logic into public, unvetted AI tools or third-party web tools that use inputted data for public training.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNum}>19.</Text>
            <Text style={styles.listText}><Text style={styles.boldLabel}>No Reverse Engineering: </Text>The Intern shall not decompile, reverse-engineer, or attempt to derive underlying algorithms from the Company’s proprietary tools or platforms.</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Student Internship Non-Disclosure and Confidentiality Agreement  •  Page 2 of 4
        </Text>
      </Page>

      {/* ================= PAGE 3 ================= */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.header}>DZ INFOTECH</Text>

        {/* 4. INTELLECTUAL PROPERTY */}
        <Text style={styles.sectionHeading}>4. INTELLECTUAL PROPERTY (IP) RIGHTS & OWNERSHIP</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>1. Company Ownership: </Text>The Intern agrees that all rights, title, interest, and intellectual property (including copyrights, patents, design rights, and trade secrets) in and to:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>All code, scripts, architectures, documentation, modules, and deliverables created by the Intern during the course of the internship; and</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>All contributions made to individual live projects, demo group projects, internal tools, and client workflows,</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          shall belong exclusively and perpetually to DZ Infotech (or its designated clients/partners).
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>2. Work Made for Hire / Assignment: </Text>To the extent any deliverables or intellectual property created by the Intern do not automatically vest in the Company, the Intern hereby irrevocably and unconditionally assigns and transfers to DZ Infotech all rights, title, and interest therein, worldwide and in perpetuity, without requiring additional compensation.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>3. Portfolio & Resume Disclosure Guidelines:</Text>
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The Intern is permitted to state on their resume, LinkedIn profile, and career profiles that they completed a {duration} Internship at DZ Infotech, along with high-level descriptions of learning outcomes, general technical skills mastered, and overall responsibilities.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The Intern shall not disclose proprietary business logic, client identity, live database credentials, exact production URLs (unless authorized in writing), or proprietary codebase architectures in public portfolios.</Text>
          </View>
        </View>

        {/* 5. RETURN OR DESTRUCTION */}
        <Text style={styles.sectionHeading}>5. RETURN OR DESTRUCTION OF PROPRIETARY MATERIALS</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>1. </Text>Upon the conclusion, expiration, or termination of the internship (or at any time upon the Company's written request), the Intern shall immediately:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Cease all access to and use of Company tools, servers, accounts, and private repositories.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Permanently delete all local copies of proprietary code, project datasets, server keys, and documents stored on personal computers, laptops, hard drives, or cloud storage.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Return any physical or digital assets provided by the Company.</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>2. </Text>The Intern shall, if requested by the Company, provide written confirmation certifying full compliance with this section.
        </Text>

        {/* 6. DURATION & SURVIVAL */}
        <Text style={styles.sectionHeading}>6. DURATION & SURVIVAL OF CONFIDENTIALITY</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>1. </Text>This Agreement takes effect on the Effective Date and continues in effect for the entire duration of the Intern’s tenure ({duration}).
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>2. </Text>The confidentiality obligations set forth herein shall survive the expiration or termination of the internship:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldLabel}>General Confidential Information: </Text>For a period of three (3) years from the date of completion or termination.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldLabel}>Trade Secrets & Core Proprietary Source Code: </Text>Shall remain protected indefinitely or for the maximum period permitted by applicable law.</Text>
          </View>
        </View>

        {/* 7. BREACH, CONSEQUENCES & REMEDIES */}
        <Text style={styles.sectionHeading}>7. BREACH, CONSEQUENCES & REMEDIES</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>1. </Text>The Intern acknowledges that any breach or threatened breach of this Agreement will cause irreparable injury, commercial harm, and reputational loss to DZ Infotech and its clients, for which monetary damages alone would be inadequate.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>2. </Text>In the event of a breach:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The Company shall have the right to seek injunctive relief, restraining orders, and specific performance in a court of competent jurisdiction, without prejudice to any other remedies available under law.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The Intern’s internship tenure shall be subject to immediate termination with cause.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The Company reserves the right to withhold or revoke the official Certificate of Completion and letters of recommendation.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>The Company may initiate legal proceedings for financial damages, losses, and legal costs incurred.</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Student Internship Non-Disclosure and Confidentiality Agreement  •  Page 3 of 4
        </Text>
      </Page>

      {/* ================= PAGE 4 ================= */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.header}>DZ INFOTECH</Text>

        {/* 8. GOVERNING LAW */}
        <Text style={styles.sectionHeading}>8. GOVERNING LAW & DISPUTE RESOLUTION</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>1. Governing Law: </Text>This Agreement shall be governed by, construed, and enforced in accordance with the substantive laws of India.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>2. Jurisdiction: </Text>In respect of any dispute, difference, or legal proceeding arising out of or in connection with this Agreement, the courts of competent jurisdiction at Bhavnagar, Gujarat, India shall have exclusive jurisdiction.
        </Text>

        {/* 9. GENERAL PROVISIONS */}
        <Text style={styles.sectionHeading}>9. GENERAL PROVISIONS</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>1. Severability: </Text>If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be severed, and the remaining provisions shall continue in full force and effect.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>2. Entire Agreement: </Text>This Agreement constitutes the entire understanding between the Parties concerning non-disclosure and confidentiality and supersedes all prior verbal or written understandings.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>3. No Employment Relationship: </Text>This Agreement and participation in the internship program does not create an employer-employee relationship, partnership, or joint venture between the Company and the Intern.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.boldLabel}>4. Amendments: </Text>Any modification to this Agreement must be in writing and signed by an authorized representative of DZ Infotech.
        </Text>

        {/* 10. ACKNOWLEDGMENT AND SIGNATURES */}
        <Text style={styles.sectionHeading}>10. ACKNOWLEDGMENT AND SIGNATURES</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>BY SIGNING BELOW</Text>, the Intern acknowledges that they have read, understood, and agreed to be bound by all the terms, conditions, and obligations of this Non-Disclosure and Confidentiality Agreement.
        </Text>

        {/* Signatures Stacked Layout */}
        <View wrap={false} style={{ marginTop: 8 }}>
          {/* FOR THE INTERN */}
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#0f172a', marginBottom: 5 }}>FOR THE INTERN:</Text>
          <View style={{ marginBottom: 4 }}>
            <View style={{ height: 26, justifyContent: 'flex-end', marginBottom: 2 }}>
              <View style={{ width: 260, borderBottomWidth: 1, borderBottomColor: '#475569' }} />
            </View>
            <Text style={{ fontSize: 7.5, color: '#64748b', marginBottom: 3 }}>(Signature of Intern / Student)</Text>
          </View>
          <Text style={{ marginBottom: 2.5 }}>Full Name: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fullName}</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ width: 220 }}>Date: {signDateFormatted}</Text>
            <Text>Place: Bhavnagar, Gujarat</Text>
          </View>

          {/* Under 18 Parent Box */}
          <View style={styles.parentSignatureBox}>
            <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 3, color: '#64748b' }}>
              (If the Intern is under 18 years of age, Parent / Guardian signature is required below:)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2.5 }}>
              <Text style={{ fontSize: 8.5 }}>Parent / Guardian Signature: </Text>
              <View style={{ width: 240, borderBottomWidth: 1, borderBottomColor: '#94a3b8', height: 12 }} />
            </View>
            <Text style={{ fontSize: 8.5, marginTop: 1.5 }}>
              Parent / Guardian Name: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{guardianName !== '______________________________________________________________' ? guardianName : '______________________________'}</Text>
            </Text>
            <Text style={{ fontSize: 8.5, marginTop: 1.5 }}>Relationship: Father / Mother / Legal Guardian</Text>
          </View>

          {/* FOR DZ INFOTECH */}
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#0f172a', marginBottom: 5 }}>FOR DZ INFOTECH:</Text>
            <View style={{ width: 220, marginBottom: 4 }}>
              <View style={{ height: 40, justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 2 }}>
                {SIGNATURE_BASE64 ? (
                  <Image src={SIGNATURE_BASE64} style={{ width: 110, height: 38, objectFit: 'contain' }} />
                ) : null}
                <View style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: '#475569' }} />
              </View>
              <Text style={{ fontSize: 7.5, color: '#64748b', marginBottom: 3 }}>(Authorized Signature)</Text>
            </View>
            <Text style={{ marginBottom: 2 }}>Authorized Signatory: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{signatoryName}</Text></Text>
            <Text style={{ marginBottom: 2 }}>Designation: {signatoryDesignation}</Text>
            <Text style={{ marginBottom: 2 }}>Date: {signDateFormatted}</Text>
            <Text>Place: {signatoryPlace}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Student Internship Non-Disclosure and Confidentiality Agreement  •  Page 4 of 4
        </Text>
      </Page>
    </Document>
  );
}

export default InternshipProgramNDAPDF;
