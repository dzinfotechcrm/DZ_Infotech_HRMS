import * as fs from 'fs';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    UnderlineType
} from 'docx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createCatalog() {
    const logoPath = join(__dirname, '..', 'public', 'DZ_Infotech_Logo.jpeg');
    let logoImage = null;

    if (fs.existsSync(logoPath)) {
        logoImage = new ImageRun({
            data: fs.readFileSync(logoPath),
            transformation: {
                width: 200,
                height: 200
            }
        });
    }

    const services = [
        {
            title: "1. Static Website",
            desc: "A lightweight, fast-loading website designed to establish a basic online presence. Ideal for small businesses, portfolios, or landing pages that do not require frequent content updates.",
            features: "Responsive design, fast load times, SEO-friendly structure, contact form integration.",
            target: "Startups, local businesses, personal brands."
        },
        {
            title: "2. Dynamic Website",
            desc: "A fully featured website with a Content Management System (CMS) allowing the client to easily update content, blogs, and media without technical expertise.",
            features: "Admin dashboard, dynamic content rendering, blog integration, user authentication (if required), scalable architecture.",
            target: "Growing businesses, news portals, content-heavy organizations."
        },
        {
            title: "3. Ecommerce Website",
            desc: "A comprehensive online storefront designed to sell products or services directly to consumers.",
            features: "Product catalog management, shopping cart, secure payment gateway integration, order tracking, inventory management, customer accounts.",
            target: "Retailers, wholesalers, D2C brands."
        },
        {
            title: "4. CRM (Customer Relationship Management)",
            desc: "A customized software solution to manage a company's interactions with current and potential customers.",
            features: "Lead tracking, sales pipeline management, meeting scheduling, automated follow-ups, performance analytics, agent portals.",
            target: "Sales agencies, B2B companies, service providers."
        },
        {
            title: "5. ERP (Enterprise Resource Planning)",
            desc: "An integrated management system for core business processes, often updated in real-time.",
            features: "Human Resources (HRMS), Payroll, Finance and Accounting, Inventory Management, Supply Chain Management, comprehensive reporting.",
            target: "Medium to large enterprises looking to centralize their operations."
        },
        {
            title: "6. ConTrack",
            desc: "A specialized project and expense tracking solution developed by DZ Infotech.",
            features: "Project timeline tracking, budget allocation, expense monitoring, milestone management.",
            target: "Construction firms, agencies, project-based organizations."
        },
        {
            title: "7. AI Chatbot",
            desc: "Intelligent conversational agents powered by AI, designed to handle customer inquiries 24/7.",
            features: "Natural Language Processing (NLP), contextual responses, lead qualification, human-handoff, multi-platform integration (Website, WhatsApp, Messenger).",
            target: "E-commerce, customer support centers, service businesses."
        },
        {
            title: "8. AI Automation",
            desc: "Streamlining repetitive business processes using Artificial Intelligence to save time and reduce human error.",
            features: "Workflow automation, automated data entry, intelligent document processing, predictive analytics.",
            target: "Enterprises looking to optimize operational efficiency and reduce overhead costs."
        },
        {
            title: "9. Whatsapp API Integration",
            desc: "Leveraging the official WhatsApp Business API for automated, at-scale customer communication.",
            features: "Bulk promotional messaging, automated transactional updates (order status, appointment reminders), interactive message buttons, integrated AI chatbots.",
            target: "Retailers, healthcare providers, event organizers, any B2C business."
        }
    ];

    const children = [];

    // Add Logo
    if (logoImage) {
        children.push(new Paragraph({
            children: [logoImage],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }));
    }

    // Company Name (Title - so using heading size 14pt -> 28)
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: "DZ INFOTECH",
                bold: true,
                size: 28, // 14pt (User requested Heading font size 14)
                color: "003366", // Dark Blue
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }));

    // Document Subtitle
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: "PROJECT & SERVICE CATALOG",
                bold: true,
                underline: {
                    type: UnderlineType.SINGLE,
                    color: "555555"
                },
                size: 28, // 14pt
                color: "555555",
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }));

    // Introduction (Normal size 12pt -> 24)
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: "This document catalogs all the standard services and project types offered by ",
                size: 24, // 12pt
            }),
            new TextRun({
                text: "DZ Infotech",
                bold: true,
                size: 24, // 12pt
            }),
            new TextRun({
                text: ". It serves as a comprehensive reference detailing the overview, key features, and target audience for each of our specialized solutions.",
                italics: true,
                size: 24, // 12pt
            })
        ],
        spacing: { after: 400 }
    }));

    // Add each service
    services.forEach(service => {
        // Service Title (Heading 14pt -> 28)
        children.push(new Paragraph({
            children: [
                new TextRun({
                    text: service.title,
                    bold: true,
                    size: 28, // 14pt
                    color: "003366",
                    underline: {
                        type: UnderlineType.SINGLE,
                        color: "003366"
                    }
                })
            ],
            spacing: { before: 200, after: 100 }
        }));

        // Overview
        children.push(new Paragraph({
            children: [
                new TextRun({ text: "Overview: ", bold: true, italics: true, color: "333333", size: 24 }),
                new TextRun({ text: service.desc, color: "555555", size: 24 })
            ],
            spacing: { after: 100 }
        }));

        // Features
        children.push(new Paragraph({
            children: [
                new TextRun({ text: "Key Features: ", bold: true, italics: true, color: "333333", size: 24 }),
                new TextRun({ text: service.features, color: "555555", size: 24 })
            ],
            spacing: { after: 100 }
        }));

        // Target Audience
        children.push(new Paragraph({
            children: [
                new TextRun({ text: "Target Audience: ", bold: true, italics: true, color: "333333", size: 24 }),
                new TextRun({ text: service.target, color: "555555", size: 24 })
            ],
            spacing: { after: 300 } // Extra space after each service
        }));
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Times New Roman",
                        size: 24, // Default to 12pt (24 half-points)
                    },
                },
            },
        },
        sections: [{
            properties: {},
            children: children
        }]
    });

    const outputPath = join(__dirname, 'Project_Catalog.docx');
    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync(outputPath, buffer);
        console.log(`Document created successfully at ${outputPath}`);
    }).catch(err => {
        console.error("Error creating document:", err);
    });
}

createCatalog();
