import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { SIGNATURE_BASE64 } from '../../utils/constants';

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 54,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.65,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  headerLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 76,
    height: 72,
    objectFit: 'contain',
  },
  orangeDivider: {
    width: '100%',
    height: 2.8,
    backgroundColor: '#EA6B23', // DZ Infotech Brand Orange
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#2b2b2b',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  titleText: {
    fontSize: 13.5,
    fontFamily: 'Helvetica-Bold',
    color: '#172A6C', // DZ Infotech Deep Navy Blue
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bodyParagraph: {
    fontSize: 10.5,
    lineHeight: 1.7,
    textAlign: 'justify',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  wishesText: {
    fontSize: 10.5,
    lineHeight: 1.7,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'justify',
  },
  thankingSection: {
    marginBottom: 14,
  },
  thankingText: {
    fontSize: 10.5,
    color: '#1a1a1a',
  },
  signatorySection: {
    marginTop: 4,
  },
  forCompanyText: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  signatureContainer: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  signatureImage: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  signatoryName: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: '#172A6C', // Deep Navy Blue
    marginBottom: 2,
  },
  signatoryDesignation: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#262626',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 26,
    left: 54,
    right: 54,
  },
  footerBlueDivider: {
    width: '100%',
    height: 2.8,
    backgroundColor: '#172A6C', // DZ Infotech Navy Blue
    marginBottom: 6,
  },
  footerText: {
    fontSize: 8.8,
    fontFamily: 'Helvetica-Bold',
    color: '#172A6C',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

const formatCertificateDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal.trim())) {
      return dateVal.trim();
    }
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal.trim())) {
      const [y, m, d] = dateVal.trim().split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return String(dateVal);
  } catch (e) {
    return String(dateVal);
  }
};

export const InternshipCertificatePDF = ({ intern = {}, options = {} }) => {
  // Candidate info & Prefix
  const rawFullName = (intern.full_name || `${intern.first_name || ''} ${intern.last_name || ''}`).trim() || 'Intern Name';
  const gender = (intern.gender || options.gender || '').toLowerCase();
  const isFemale = gender === 'female' || gender === 'f';
  const prefix = options.prefix || (gender ? (isFemale ? 'Ms.' : 'Mr.') : '');
  const candidateDisplayName = prefix ? `${prefix} ${rawFullName}` : rawFullName;

  // Pronouns
  const pronoun = isFemale ? 'her' : 'him';
  const possessivePronoun = isFemale ? 'her' : 'his';
  const possessivePronounCaps = isFemale ? 'Her' : 'His';
  const pronounCaps = isFemale ? 'She' : 'He';

  // College & Education
  const collegeName = (options.college_name || intern.college_name || intern.data?.college_name || '').trim();
  const degreeBranch = (options.degree_branch || intern.degree_branch || intern.data?.degree_branch || '').trim();

  let educationPhrase = '';
  if (degreeBranch && collegeName) {
    educationPhrase = `, ${degreeBranch} student of ${collegeName},`;
  } else if (collegeName) {
    educationPhrase = `, student of ${collegeName},`;
  } else if (degreeBranch) {
    educationPhrase = `, ${degreeBranch} student,`;
  }

  // Dates
  const startDateStr = formatCertificateDate(intern.start_date || options.start_date || '2026-05-28');
  const endDateStr = formatCertificateDate(intern.end_date || options.end_date || '2026-06-28');
  const issueDateStr = formatCertificateDate(options.issue_date || intern.certificate_date || intern.end_date || new Date());

  // Certificate Reference Number
  const certYear = (intern.start_date || intern.end_date || new Date().toISOString()).slice(0, 4);
  const rawId = String(intern.id || '001').replace(/[^a-zA-Z0-9]/g, '');
  const shortId = rawId.length > 5 ? rawId.slice(-5).toUpperCase() : rawId.padStart(4, '0').toUpperCase();
  const defaultCertNo = `DZI/CERT/${certYear}/${shortId}`;
  const certNumber = options.certificate_no || intern.certificate_no || defaultCertNo;

  // Project / Domain
  const projectTitle = (
    options.project_title ||
    intern.project_title ||
    intern.data?.project_title ||
    intern.position_domain ||
    intern.position ||
    'Full Stack Web Development'
  ).trim();

  // Certificate Type / Title
  const isSummer = options.is_summer !== undefined 
    ? options.is_summer 
    : (
        (intern.duration || '').toLowerCase().includes('summer') ||
        (intern.notes || '').toLowerCase().includes('summer') ||
        (options.certificate_title || '').toLowerCase().includes('summer')
      );

  const certificateTitle = (
    options.certificate_title ||
    (isSummer ? 'SUMMER INTERNSHIP COMPLETION CERTIFICATE' : 'INTERNSHIP COMPLETION CERTIFICATE')
  ).toUpperCase();

  const internshipTypeText = isSummer ? 'a summer internship' : 'an internship';

  // Signatory
  const signatoryName = options.signatory_name || intern.signatory_name || 'Soumyarajsinh Zala';
  const signatoryDesignation = options.signatory_designation || intern.signatory_designation || 'Co-Founder';

  // Logo URL
  const logoSrc = typeof window !== 'undefined' && window.location?.origin 
    ? `${window.location.origin}/DZ_Infotech_Logo.jpeg` 
    : '/DZ_Infotech_Logo.jpeg';

  // Document file title for PDF viewer metadata & tab name
  const safeCandidateName = rawFullName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const documentFileName = options.fileName || `${safeCandidateName}_Internship_Certificate.pdf`;

  return (
    <Document
      title={documentFileName}
      author="DZ Infotech"
      subject={certificateTitle}
      creator="DZ Infotech HRMS"
      producer="DZ Infotech"
    >
      <Page size="A4" style={styles.page}>
        {/* DZ Infotech Logo Centered */}
        <View style={styles.headerLogoContainer}>
          <Image src={logoSrc} style={styles.logoImage} />
        </View>

        {/* Orange Brand Divider Line */}
        <View style={styles.orangeDivider} />

        {/* Top Reference Meta Row: Certificate Number & Date */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Certificate No : <Text style={styles.boldText}>{certNumber}</Text>
          </Text>
          <Text style={styles.metaText}>
            Date : <Text style={styles.boldText}>{issueDateStr}</Text>
          </Text>
        </View>

        {/* Certificate Title: Navy Blue Centered */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{certificateTitle}</Text>
        </View>

        {/* Paragraph 1: Core Certification Statement with Bold Entities */}
        <Text style={styles.bodyParagraph}>
          This is to certify that{' '}
          <Text style={styles.boldText}>{candidateDisplayName}</Text>
          {educationPhrase ? ` ${educationPhrase}` : ''}{' '}
          has successfully completed {internshipTypeText} on{' '}
          <Text style={styles.boldText}>“{projectTitle}”</Text> at{' '}
          <Text style={styles.boldText}>DZ Infotech</Text> from{' '}
          <Text style={styles.boldText}>{startDateStr}</Text> to{' '}
          <Text style={styles.boldText}>{endDateStr}</Text>.
        </Text>

        {/* Paragraph 2: Performance, Character & Conduct Assessment */}
        <Text style={styles.bodyParagraph}>
          Throughout the internship period, we found {pronoun} to be hardworking, inquisitive, disciplined, and proactive. {possessivePronounCaps} performance, conduct, and dedication towards assigned tasks and collaborative team discussions were found to be exemplary.
        </Text>

        {/* Paragraph 3: Wishes for Future Career */}
        <Text style={styles.wishesText}>
          We appreciate {possessivePronoun} sincere contributions to the organization and wish {pronoun} all the very best for {possessivePronoun} upcoming endeavors and a bright, successful career ahead.
        </Text>

        {/* Thanking You */}
        <View style={styles.thankingSection}>
          <Text style={styles.thankingText}>Thanking you.</Text>
        </View>

        {/* Sign-off / Signatory Block with Soumyarajsinh Zala's Signature */}
        <View style={styles.signatorySection} wrap={false}>
          <Text style={styles.forCompanyText}>For DZ Infotech</Text>
          <View style={styles.signatureContainer}>
            {SIGNATURE_BASE64 ? (
              <Image src={SIGNATURE_BASE64} style={styles.signatureImage} />
            ) : (
              <View style={{ height: 38 }} />
            )}
          </View>
          <Text style={styles.signatoryName}>{signatoryName}</Text>
          <Text style={styles.signatoryDesignation}>{signatoryDesignation}</Text>
        </View>

        {/* Footer: Navy Line & Company Email */}
        <View style={styles.footerContainer} fixed>
          <View style={styles.footerBlueDivider} />
          <Text style={styles.footerText}>
            DZ Infotech   |   info@dzinfotech.in
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InternshipCertificatePDF;
