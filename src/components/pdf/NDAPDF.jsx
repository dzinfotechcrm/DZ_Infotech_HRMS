import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { SIGNATURE_BASE64 } from '../../utils/constants';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#000',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#2F5496',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#C55A11',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#C55A11',
    marginTop: 15,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#C55A11',
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#2F5496',
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 10,
  },
  bulletPoint: {
    width: 25,
    fontSize: 10,
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
  }
});

const NumberedItem = ({ prefix, title, children }) => (
  <View style={styles.listItem}>
    <Text style={styles.bulletPoint}>{prefix}</Text>
    <Text style={styles.listItemText}>
      {title && <Text style={styles.bold}>{title}: </Text>}
      {children}
    </Text>
  </View>
);

export const NDAPDF = ({ intern }) => {
  const {
    full_name,
    position,
    nda_date,
    address,
  } = intern;

  // Format address nicely
  const addressStr = address 
    ? `${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',')
    : '____________________________________';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>NON-DISCLOSURE AGREEMENT</Text>
        <Text style={styles.title}>(NDA)</Text>
        <Text style={styles.subtitle}>{position}</Text>

        <Text style={styles.text}>
          This Non-Disclosure Agreement ("Agreement") is entered into on <Text style={styles.bold}>{nda_date}</Text>
        </Text>

        <Text style={{ ...styles.text, ...styles.bold, marginTop: 10 }}>BETWEEN:</Text>
        <Text style={styles.text}><Text style={styles.bold}>DZ Infotech ("Company" or "Disclosing Party")</Text></Text>
        <Text style={styles.text}>Registered Office: Bhavnagar, Gujarat, India</Text>

        <Text style={{ ...styles.text, ...styles.bold, marginTop: 10 }}>AND</Text>
        <Text style={styles.text}><Text style={styles.bold}>{full_name} ("Intern" or "Receiving Party")</Text></Text>
        <Text style={styles.text}>Address: {addressStr}</Text>

        <Text style={{ ...styles.text, ...styles.bold, marginTop: 15 }}>RECITALS:</Text>
        <Text style={styles.text}>WHEREAS the Company is engaged in software development and provides construction management solutions under the brand name "Contrack";</Text>
        <Text style={styles.text}>WHEREAS the Intern will be undertaking an internship with the Company and will be exposed to confidential and proprietary information;</Text>
        <Text style={styles.text}>WHEREAS the Company desires to protect its confidential information and trade secrets;</Text>
        <Text style={styles.text}>NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the parties agree as follows:</Text>

        <Text style={styles.sectionTitle}>1. DEFINITION OF CONFIDENTIAL INFORMATION</Text>
        <Text style={styles.text}>
          "Confidential Information" means any and all information, whether disclosed orally, in writing, electronically, or by any other means, that relates to the business, operations, products, services, or activities of the Company, including but not limited to:
        </Text>
        <NumberedItem prefix="a)" title="Source Code and Technical Information">
          All source code, algorithms, software architecture, database schemas, API designs, technical specifications, system designs, development methodologies, and any other technical documentation related to Contrack or any other Company products.
        </NumberedItem>
        <NumberedItem prefix="b)" title="Product Information">
          Product designs, features, functionalities, roadmaps, development plans, user interface designs, wireframes, mockups, prototypes, and any information about current or future products.
        </NumberedItem>
        <NumberedItem prefix="c)" title="Customer and User Data">
          Customer information, user data, usage analytics, customer lists, contact information, project data, and any other data stored in the Company's systems.
        </NumberedItem>
        <NumberedItem prefix="d)" title="Business Information">
          Business strategies, marketing plans, sales strategies, pricing information, business models, revenue data, financial information, investor information, partnership agreements, and vendor relationships.
        </NumberedItem>
        <NumberedItem prefix="e)" title="Client Information">
          Names of clients, prospective clients, client requirements, contractual terms, service level agreements, and any communication with clients.
        </NumberedItem>
        <NumberedItem prefix="f)" title="Trade Secrets">
          Proprietary methods, processes, techniques, know-how, inventions, research and development activities, and any other information that constitutes a trade secret under applicable law.
        </NumberedItem>
        <NumberedItem prefix="g)" title="Technical Infrastructure">
          Firebase database structure, Firestore collections and documents, API endpoints, API keys, authentication tokens, access credentials, server configurations, cloud infrastructure details, and any other technical infrastructure information.
        </NumberedItem>
        <NumberedItem prefix="h)" title="Internal Communications">
          Any discussions, meetings, emails, chat messages, documents, presentations, or other communications within the Company.
        </NumberedItem>

        <Text style={styles.sectionTitle}>2. NON-DISCLOSURE OBLIGATIONS</Text>
        <Text style={styles.text}>The Intern agrees and undertakes to:</Text>
        <NumberedItem prefix="i)" title="Confidentiality">
          Keep all Confidential Information strictly confidential and not disclose it to any third party without the prior written consent of the Company.
        </NumberedItem>
        <NumberedItem prefix="j)" title="Limited Use">
          Use the Confidential Information solely for the purpose of performing internship duties as assigned by the Company.
        </NumberedItem>
        <NumberedItem prefix="k)" title="Protection">
          Take all reasonable measures to protect the Confidential Information from unauthorized disclosure, access, or use.
        </NumberedItem>
        <NumberedItem prefix="l)" title="No Reproduction">
          Not copy, reproduce, modify, reverse-engineer, decompile, or create derivative works from any Confidential Information without express written authorization.
        </NumberedItem>
        <NumberedItem prefix="m)" title="No Public Disclosure">
          Not post, share, or discuss any Confidential Information on social media platforms, technical forums, blogs, or any other public platforms.
        </NumberedItem>
        <NumberedItem prefix="n)" title="Secure Storage">
          Store all Confidential Information securely using password protection where appropriate.
        </NumberedItem>
        <NumberedItem prefix="o)" title="Return of Materials">
          Upon termination of the internship or upon request, immediately return or destroy all Confidential Information.
        </NumberedItem>

        <Text style={styles.sectionTitle}>3. PROHIBITION ON SHARING CODE AND TECHNICAL MATERIALS</Text>
        <Text style={styles.text}>The Intern specifically agrees NOT to:</Text>
        <NumberedItem prefix="p)" title="Public Repositories">
          Share, upload, or publish any source code, code snippets, or technical implementations on public repositories including GitHub, GitLab, Bitbucket, or any other code hosting platforms.
        </NumberedItem>
        <NumberedItem prefix="q)" title="Technical Forums">
          Post code snippets, technical problems, or implementation details on Stack Overflow, Reddit, Quora, or any other public forums without prior written permission.
        </NumberedItem>
        <NumberedItem prefix="r)" title="Credentials and Access Keys">
          Share, disclose, or expose API keys, database credentials, authentication tokens, Firebase configuration, or any other access credentials.
        </NumberedItem>
        <NumberedItem prefix="s)" title="Screenshots and Documentation">
          Share screenshots, screen recordings, technical documentation, UI designs, or any visual materials containing Confidential Information on public platforms.
        </NumberedItem>
        <NumberedItem prefix="t)" title="Personal Projects">
          Use Company code, designs, or any Confidential Information in personal projects, portfolio websites, or resume submissions without prior written permission.
        </NumberedItem>

        <Text style={styles.sectionTitle}>4. EXCLUSIONS FROM CONFIDENTIAL INFORMATION</Text>
        <Text style={styles.text}>This Agreement does not apply to information that:</Text>
        <NumberedItem prefix="u)" title="Public Domain">
          Was publicly available at the time of disclosure or becomes publicly available through no breach of this Agreement.
        </NumberedItem>
        <NumberedItem prefix="v)" title="Prior Knowledge">
          Was already known to the Intern prior to disclosure by the Company.
        </NumberedItem>
        <NumberedItem prefix="w)" title="Independent Development">
          Is independently developed by the Intern without use of Confidential Information.
        </NumberedItem>
        <NumberedItem prefix="x)" title="Legal Requirement">
          Is required to be disclosed by law or valid court order, provided that the Intern gives the Company prompt written notice.
        </NumberedItem>

        <Text style={styles.sectionTitle}>5. DURATION OF CONFIDENTIALITY OBLIGATIONS</Text>
        <Text style={styles.text}>This Agreement shall:</Text>
        <NumberedItem prefix="y)">Commence on the date first written above;</NumberedItem>
        <NumberedItem prefix="z)">Remain in full force and effect during the entire period of the internship;</NumberedItem>
        <NumberedItem prefix="aa)">Continue for a period of <Text style={styles.bold}>two (2) years</Text> after the termination or expiration of the internship;</NumberedItem>
        <NumberedItem prefix="bb)">Survive termination of the internship for any reason.</NumberedItem>

        <Text style={styles.sectionTitle}>6. INTELLECTUAL PROPERTY ASSIGNMENT</Text>
        <Text style={styles.text}>The Intern agrees and acknowledges that:</Text>
        <NumberedItem prefix="cc)" title="Company Ownership">
          All work products, inventions, code, designs, documentation, and any other materials created by the Intern during the internship shall be the sole and exclusive property of the Company.
        </NumberedItem>
        <NumberedItem prefix="dd)" title="Assignment of Rights">
          The Intern hereby irrevocably assigns all rights, title, and interest in and to all Work Product to the Company, without any requirement for further compensation.
        </NumberedItem>
        <NumberedItem prefix="ee)" title="Cooperation">
          The Intern agrees to cooperate with the Company and execute any documents necessary to establish or enforce the Company's ownership rights.
        </NumberedItem>
        <NumberedItem prefix="ff)" title="Waiver of Moral Rights">
          The Intern hereby irrevocably waives all moral rights in the Work Product to the maximum extent permitted by applicable law.
        </NumberedItem>

        <Text style={styles.sectionTitle}>7. REMEDIES AND ENFORCEMENT</Text>
        <Text style={styles.text}>The Intern acknowledges and agrees that:</Text>
        <NumberedItem prefix="gg)" title="Irreparable Harm">
          Any breach or threatened breach of this Agreement will cause irreparable harm to the Company for which monetary damages alone would be an inadequate remedy.
        </NumberedItem>
        <NumberedItem prefix="hh)" title="Injunctive Relief">
          The Company shall be entitled to seek injunctive relief, specific performance, and other equitable remedies in addition to any other remedies available at law.
        </NumberedItem>
        <NumberedItem prefix="ii)" title="Monetary Damages">
          The Company may seek monetary damages for any breach, including damages for lost profits, business opportunities, and harm to reputation.
        </NumberedItem>
        <NumberedItem prefix="jj)" title="Legal Costs">
          In the event of any breach, the Intern shall be liable for all costs incurred, including reasonable attorney's fees and court costs.
        </NumberedItem>

        <Text style={styles.sectionTitle}>8. GENERAL PROVISIONS</Text>
        <Text style={styles.subSectionTitle}>8.1 Governing Law</Text>
        <Text style={styles.text}>This Agreement shall be governed by and construed in accordance with the laws of India.</Text>
        
        <Text style={styles.subSectionTitle}>8.2 Jurisdiction</Text>
        <Text style={styles.text}>Any disputes arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the courts in Bhavnagar, Gujarat, India.</Text>
        
        <Text style={styles.subSectionTitle}>8.3 Entire Agreement</Text>
        <Text style={styles.text}>This Agreement, together with the Internship Offer Letter, constitutes the entire agreement between the parties with respect to the subject matter hereof.</Text>
        
        <Text style={styles.subSectionTitle}>8.4 Amendments</Text>
        <Text style={styles.text}>This Agreement may not be amended except by a written instrument signed by authorized representatives of both parties.</Text>
        
        <Text style={styles.subSectionTitle}>8.5 Survival</Text>
        <Text style={styles.text}>The obligations and restrictions set forth in this Agreement shall survive the termination or expiration of the internship.</Text>

        <Text style={styles.sectionTitle}>9. ACKNOWLEDGMENT AND REPRESENTATIONS</Text>
        <Text style={styles.text}>The Intern hereby acknowledges, represents, and warrants that:</Text>
        <NumberedItem prefix="kk)">The Intern has carefully read and fully understands all the terms, conditions, and obligations set forth in this Agreement;</NumberedItem>
        <NumberedItem prefix="ll)">The Intern is entering into this Agreement freely, voluntarily, and without any duress or coercion;</NumberedItem>
        <NumberedItem prefix="mm)">The Intern fully understands the serious consequences of breaching this Agreement;</NumberedItem>
        <NumberedItem prefix="nn)">The Intern has the legal capacity and authority to enter into this Agreement.</NumberedItem>

        <Text style={{ ...styles.text, ...styles.bold, marginTop: 20 }}>
          IN WITNESS WHEREOF, the parties have executed this Non-Disclosure Agreement as of the date first written above.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 }}>
          {/* Company Signature */}
          <View style={{ width: '45%' }}>
            <Text style={{ ...styles.text, ...styles.bold }}>FOR DZ INFOTECH (COMPANY):</Text>
            <View style={styles.signatureBlock}>
              <Text style={{ marginBottom: 5 }}>Signature:</Text>
              <Image src={SIGNATURE_BASE64} style={styles.signatureImage} />
              <Text style={styles.text}>Name: <Text style={styles.bold}>Soumyarajsinh Zala</Text></Text>
              <Text style={styles.text}>Designation: Co-Founder</Text>
              <Text style={styles.text}>Date: {nda_date}</Text>
            </View>
          </View>

          {/* Intern Signature */}
          <View style={{ width: '45%' }}>
            <Text style={{ ...styles.text, ...styles.bold }}>INTERN (RECEIVING PARTY):</Text>
            <View style={styles.signatureBlock}>
              <Text style={{ marginBottom: 40 }}>Signature: _______________________________</Text>
              <Text style={styles.text}>Name: <Text style={styles.bold}>{full_name}</Text></Text>
              <Text style={styles.text}>Role: {position}</Text>
              <Text style={styles.text}>Date: _______________________________</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
