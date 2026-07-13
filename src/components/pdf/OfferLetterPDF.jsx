import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { SIGNATURE_BASE64 } from '../../utils/constants';

// Register font for better rendering (optional, using default Helvetica for now)


Font.register({
  family: 'Arial',
  fonts: [
    { src: '/fonts/arial.ttf' },
    { src: '/fonts/arialbd.ttf', fontWeight: 'bold' }
  ]
});
Font.register({
  family: 'Times-Roman',
  src: '/fonts/times.ttf'
});

const styles = StyleSheet.create({
  page: {
    padding: 54,
    fontFamily: 'Arial',
    fontSize: 10,
    lineHeight: 1.2,
    color: '#000',
  },
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#1f3864',
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  companyAddress: {
    textAlign: 'center',
    color: '#444444',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#C55A11',
    marginTop: 15,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#C55A11',
    paddingBottom: 2,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#1f3864',
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 18,
  },
  bulletPoint: {
    width: 15,
    fontFamily: 'Arial',
    fontSize: 12,
  },
  listItemText: {
    flex: 1,
    textAlign: 'justify',
  },
  signatureBlock: {
    marginTop: 30,
  },
  signatureImage: {
    width: 100,
    height: 50,
    marginBottom: 5,
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
  },
  signatureText: {
    marginBottom: 2,
  }
});

const Bullet = ({ children }) => (
  <View wrap={false} style={styles.listItem}>
    <Text style={styles.bulletPoint}>•</Text>
    <Text style={styles.listItemText}>{children}</Text>
  </View>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export const OfferLetterPDF = ({ intern }) => {
  const {
    full_name,
    first_name,
    position,
    start_date,
    end_date,
    duration_text,
    work_mode,
    working_days,
    working_hours,
    max_leave_per_month,
    skills_technologies,
    is_paid,
    stipend_amount,
    certificate_eligible,
    offer_date,
    acceptance_deadline,
  } = intern;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>DZ INFOTECH</Text>
          <Text style={styles.companyAddress}>Bhavnagar, Gujarat, India</Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ marginBottom: 5 }}>Date: {formatDate(offer_date)}</Text>
          <Text style={{ marginBottom: 2 }}>To,</Text>
          <Text style={{ ...styles.bold, marginBottom: 5 }}>{full_name}</Text>
          <Text style={{ marginTop: 10, fontFamily: 'Arial', fontWeight: 'bold' }}>Subject: Offer Letter for {position}</Text>
        </View>

        <Text style={styles.text}>Dear {first_name},</Text>
        <Text style={styles.text}>
          We are pleased to offer you an internship position at DZ Infotech. We were impressed with your skills and enthusiasm during the interview process, and we believe you will be a valuable addition to our team.
        </Text>
        <Text style={styles.text}>
          We are excited to have you work with us on <Text style={styles.bold}>Contrack</Text>, our construction management software that brings construction projects to your fingertips. This internship will provide you with valuable hands-on experience working on a live product used by real construction companies.
        </Text>

        <Text style={styles.sectionTitle}>1. INTERNSHIP DETAILS</Text>

        <Text style={styles.subSectionTitle}>1.1 Position and Duration</Text>
        <Text style={styles.text}><Text style={styles.bold}>Position: </Text><Text style={{ color: '#C55A11', fontFamily: 'Helvetica-Bold' }}>{position}</Text></Text>
        <Text style={styles.text}><Text style={styles.bold}>Start Date: </Text>{formatDate(start_date)}</Text>
        <Text style={styles.text}><Text style={styles.bold}>End Date: </Text>{formatDate(end_date)}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Duration: </Text>{duration_text}</Text>

        <Text style={styles.subSectionTitle}>1.2 Work Mode and Schedule</Text>
        {work_mode !== 'Not Mentioned' && (
          <Text style={styles.text}><Text style={styles.bold}>Work Mode: </Text>{work_mode}</Text>
        )}
        <Text style={styles.text}><Text style={styles.bold}>Working Days: </Text>{working_days}</Text>
        {work_mode !== 'Not Mentioned' && (
          <Text style={styles.text}><Text style={styles.bold}>Working Hours: </Text>{working_hours}</Text>
        )}
        <Text style={styles.text}><Text style={styles.bold}>Holidays: </Text>Weekends (Saturday and Sunday) and public holidays as per company calendar</Text>
        <Text style={styles.text}><Text style={styles.bold}>Max Leave: </Text>{max_leave_per_month} days per month. Any exam leave must be declared at the time of joining.</Text>

        <Text style={styles.subSectionTitle}>1.3 Communication and Collaboration</Text>
        <Text style={styles.text}>
          All work will be conducted remotely through online collaboration tools including Google Meet for video calls, Google Chat for daily communication, GitHub/GitLab for code management, and project management tools as assigned.
        </Text>

        <Text style={styles.sectionTitle}>2. ROLES AND RESPONSIBILITIES</Text>
        <Text style={styles.text}>Your primary responsibilities will include but are not limited to:</Text>
        <Bullet>Develop and maintain both frontend and backend features for the Contrack platform.</Bullet>
        <Bullet>Build responsive web interfaces using React JS and integrate them with backend APIs.</Bullet>
        <Bullet>Design and implement RESTful APIs and backend services.</Bullet>
        <Bullet>Work with databases and ensure data integrity and performance.</Bullet>
        <Bullet>Write clean, maintainable, and well-documented code following best practices.</Bullet>
        <Bullet>Participate in code reviews and provide constructive feedback.</Bullet>
        <Bullet>Test features thoroughly before deployment and fix bugs as identified.</Bullet>
        <Bullet>Collaborate with team members through daily updates and weekly sync meetings.</Bullet>
        <Bullet>Learn and implement new technologies and frameworks as required.</Bullet>
        <Bullet>Contribute to product improvements and suggest innovative solutions.</Bullet>

        <Text style={{ ...styles.text, marginTop: 10 }}>
          <Text style={styles.bold}>Tech Stack: </Text>{skills_technologies || 'React JS, Node JS, JavaScript, HTML, CSS, REST APIs, Databases'}
        </Text>

        <Text style={styles.sectionTitle}>3. STIPEND AND COMPENSATION</Text>
        {is_paid ? (
          <>
            <Text style={styles.text}>
              This is a <Text style={styles.bold}>paid internship</Text> for the entire duration. You will receive a stipend of <Text style={styles.bold}>Rs. {stipend_amount} per month</Text>, subject to applicable tax deductions.
            </Text>
            <Text style={styles.text}>
              The stipend will be processed and credited to your designated bank account according to the company's regular payroll cycle. This internship is designed as a training and learning phase where you will gain valuable hands-on experience working on a live product with real users.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.text}>
              This is an <Text style={styles.bold}>unpaid internship</Text> for the entire {duration_text}. This period is designed as a training and learning phase where you will gain valuable hands-on experience working on a live product with real users.
            </Text>
            <Text style={styles.text}>
              No stipend, salary, or monetary compensation will be provided during this internship period. The company is not liable to provide any financial benefits, allowances, or reimbursements.
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>4. PERFORMANCE EVALUATION</Text>
        <Text style={styles.text}>Your performance will be evaluated continuously throughout the internship based on the following criteria:</Text>
        <Bullet>Quality and timeliness of work delivered</Bullet>
        <Bullet>Code quality, adherence to best practices, and maintainability</Bullet>
        <Bullet>Communication skills and responsiveness</Bullet>
        <Bullet>Collaboration with team members</Bullet>
        <Bullet>Learning attitude and initiative to solve problems independently</Bullet>
        <Bullet>Attendance, punctuality, and commitment to assigned hours</Bullet>
        <Bullet>Weekly deliverable — intern must show at least one completed task per week</Bullet>
        <Text style={{ ...styles.text, marginTop: 5 }}>Regular feedback will be provided to help you improve and grow during the internship.</Text>

        <Text style={styles.sectionTitle}>5. INTERNSHIP CERTIFICATE</Text>
        {certificate_eligible ? (
          <>
            <Text style={styles.text}>
              Upon successful completion of the internship with satisfactory performance, you will be issued an <Text style={styles.bold}>Internship Completion Certificate</Text>. The certificate will include:
            </Text>
            <Bullet>Duration of internship</Bullet>
            <Bullet>Position/role held</Bullet>
            <Bullet>Key technologies and skills developed</Bullet>
            <Bullet>Brief summary of contributions</Bullet>
          </>
        ) : (
          <Text style={styles.text}>
            Please note that an Internship Completion Certificate will not be issued for this specific engagement, as per the terms agreed upon prior to joining.
          </Text>
        )}

        <Text style={styles.sectionTitle}>6. CONFIDENTIALITY AND NON-DISCLOSURE</Text>
        <Text style={styles.text}>You will be required to sign a separate <Text style={styles.bold}>Non-Disclosure Agreement (NDA)</Text> along with this offer letter. You agree to:</Text>
        <Bullet>Maintain strict confidentiality of all company information, source code, client data, business strategies, and proprietary information</Bullet>
        <Bullet>Not disclose any confidential information to third parties during or after the internship</Bullet>
        <Bullet>Not use company resources, code, or information for personal projects or commercial purposes</Bullet>
        <Bullet>Not share source code, database credentials, API keys, or any technical materials publicly (including GitHub, forums, social media)</Bullet>
        <Text style={{ ...styles.text, ...styles.bold, marginTop: 5, color: '#C00000' }}>Breach of confidentiality will result in immediate termination and may lead to legal action.</Text>

        <Text style={styles.sectionTitle}>7. INTELLECTUAL PROPERTY RIGHTS</Text>
        <Text style={styles.text}>
          All work products, including but not limited to code, designs, documentation, algorithms, and any other materials created by you during the internship, shall be the <Text style={styles.bold}>sole and exclusive property of DZ Infotech</Text>.
        </Text>
        <Text style={styles.text}>
          You hereby assign all rights, title, and interest in such work products to the Company. You shall have no claim to any intellectual property developed during the internship period.
        </Text>

        <Text style={styles.sectionTitle}>8. CODE OF CONDUCT AND PROFESSIONAL BEHAVIOR</Text>
        <Text style={styles.text}>During your internship, you are expected to:</Text>
        <Bullet>Maintain professional behavior and communication at all times</Bullet>
        <Bullet>Respect deadlines and commitments made to the team</Bullet>
        <Bullet>Adhere to company policies, guidelines, and instructions from supervisors</Bullet>
        <Bullet>Show respect to all team members and maintain a harassment-free work environment</Bullet>
        <Bullet>Not engage in any discriminatory behavior based on gender, religion, caste, ethnicity, or any other factor</Bullet>
        <Bullet>Use company resources (tools, software licenses, etc.) only for internship-related work</Bullet>
        <Bullet>Inform the company promptly of any issues, delays, or challenges faced</Bullet>

        <Text style={styles.sectionTitle}>9. TERMINATION</Text>
        <Text style={styles.subSectionTitle}>9.1 Termination by Intern</Text>
        <Text style={styles.text}>
          If you wish to terminate the internship, you must provide <Text style={styles.bold}>14 days written notice</Text> via email. During this notice period, you must complete any pending tasks and hand over all work properly.
        </Text>

        <Text style={styles.subSectionTitle}>9.2 Termination by Company</Text>
        <Text style={styles.text}>
          The Company may terminate the internship with <Text style={styles.bold}>7 days written notice</Text> for reasons including but not limited to restructuring, project completion, or other business needs.
        </Text>

        <Text style={styles.subSectionTitle}>9.3 Immediate Termination</Text>
        <Text style={styles.text}>
          The Company reserves the right to terminate the internship <Text style={styles.bold}>immediately without notice</Text> in the following cases:
        </Text>
        <Bullet>Breach of confidentiality or Non-Disclosure Agreement</Bullet>
        <Bullet>Misconduct, unprofessional behavior, or harassment</Bullet>
        <Bullet>Consistent non-performance or failure to meet expectations</Bullet>
        <Bullet>Unauthorized absence or repeated violations of working hours</Bullet>
        <Bullet>Missing weekly deliverable for 2 or more consecutive weeks without valid reason</Bullet>
        <Bullet>Sharing proprietary code, information, or company resources without authorization</Bullet>
        <Bullet>Any fraudulent activity or violation of company policies</Bullet>

        <Text style={styles.subSectionTitle}>9.4 Return of Company Property</Text>
        <Text style={styles.text}>Upon termination, you must immediately:</Text>
        <Bullet>Return all company documents, files, code, and materials</Bullet>
        <Bullet>Delete all confidential information from personal devices and cloud storage</Bullet>
        <Bullet>Provide written certification of deletion/return within 7 days</Bullet>
        <Bullet>Revoke access to all company systems, tools, and accounts will be immediately disabled</Bullet>

        <Text style={styles.sectionTitle}>10. NO EMPLOYMENT RELATIONSHIP</Text>
        <Text style={styles.text}>
          This internship <Text style={styles.bold}>does not create an employer-employee relationship</Text>. You are an intern for a fixed term and are not entitled to any employee benefits.
        </Text>

        <Text style={styles.sectionTitle}>11. GENERAL PROVISIONS</Text>
        <Text style={styles.text}><Text style={styles.bold}>Governing Law: </Text>This agreement shall be governed by and construed in accordance with the laws of India.</Text>
        <Text style={styles.text}><Text style={styles.bold}>Jurisdiction: </Text>Any disputes arising from this internship shall be subject to the exclusive jurisdiction of courts in Bhavnagar, Gujarat.</Text>
        <Text style={styles.text}><Text style={styles.bold}>Entire Agreement: </Text>This offer letter along with the NDA constitutes the entire agreement between you and DZ Infotech regarding this internship.</Text>
        <Text style={styles.text}><Text style={styles.bold}>Amendments: </Text>Any modifications to this agreement must be made in writing and signed by both parties.</Text>

        <Text style={styles.sectionTitle}>12. ACCEPTANCE</Text>
        <Text style={styles.text}>
          Please sign and return a scanned copy of this offer letter along with the signed Non-Disclosure Agreement by <Text style={styles.bold}>{formatDate(acceptance_deadline)}</Text> to confirm your acceptance of this internship offer.
        </Text>
        <Text style={styles.text}>
          If you have any questions or need clarification on any terms mentioned in this offer letter, please feel free to reach out to us before signing.
        </Text>
        <Text style={styles.text}>
          We look forward to having you on board and working together to build great products!
        </Text>

        <View wrap={false} style={styles.signatureBlock}>
          <Text style={styles.text}>Best Regards,</Text>
          <Image src={SIGNATURE_BASE64} style={styles.signatureImage} />
          <Text style={{ ...styles.signatureText, ...styles.bold }}>Soumyarajsinh Zala</Text>
          <Text style={styles.signatureText}>Co-Founder</Text>
          <Text style={styles.signatureText}>DZ Infotech</Text>
          <Text style={styles.signatureText}>Dzinfotech10@gmail.com</Text>
          <Text style={styles.signatureText}>9327853727</Text>
        </View>

        <View wrap={false} style={{ ...styles.signatureBlock, marginTop: 40, borderTopWidth: 1, borderTopColor: '#1f3864', paddingTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial', textAlign: 'center', color: '#1f3864', marginBottom: 10 }}>ACCEPTANCE OF OFFER</Text>
          <Text style={styles.text}>
            I, <Text style={styles.bold}>{full_name}</Text>, have read and understood all the terms and conditions mentioned in this offer letter. I hereby accept this internship offer and agree to abide by all the policies, guidelines, and terms stated above.
          </Text>

          <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <View style={styles.signatureLine} />
              <Text>Intern's Signature</Text>
            </View>
            <View>
              <View style={styles.signatureLine} />
              <Text>Date</Text>
            </View>
          </View>

          <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ ...styles.bold, borderBottomWidth: 1, borderBottomColor: '#000', width: 200, paddingBottom: 2, marginBottom: 5 }}>{full_name}</Text>
              <Text>Intern's Full Name</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
