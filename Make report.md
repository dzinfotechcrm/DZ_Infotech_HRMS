# PROJECT REPORT: DZ INFOTECH OPERATING SYSTEM (DZ HRMS & ERP)
**A Comprehensive Enterprise Human Resource Management, Revenue Operations & Field Sales System**

---

## 1. PROJECT TITLE & GENERAL INFORMATION

* **Project Title:** DZ Infotech Operating System (DZ HRMS, SFMS & Revenue Operations)
* **Organization / Industry Partner:** DZ Infotech
* **Project Type:** Full-Stack Enterprise Web Application & Organizational Operating System
* **Domain:** Enterprise Resource Planning (ERP), Human Resource Management (HRMS), Customer Relationship Management (CRM), Sales Force Automation (SFMS)
* **Academic Submission:** Final Year B.E. / B.Tech / MCA / BCA / Diploma Internship Project Report
* **Document Purpose:** Complete technical architecture, database design, role-based access matrix, functional specifications, and module inventory for college submission and technical defense.

---

## 2. EXECUTIVE SUMMARY / ABSTRACT

In contemporary enterprise landscapes, companies struggle with fragmented software stacks: using one tool for attendance, another for payroll calculations, third-party spreadsheets for sales leads, separate software for field sales tracking, and offline word processors for quotations and offer letters.

**DZ Infotech OS** is an integrated, full-stack, cloud-native Enterprise Operating System engineered specifically for DZ Infotech to centralize and automate end-to-end organizational workflows. The system encompasses six major pillars:
1. **Core Human Resource Management (HRMS):** Employee directory, digital intern onboarding, biometric-like webcam selfie verification for daily attendance, automated break tracking, multi-tier leave approval hierarchy, official company holiday schedules, and automated monthly payroll calculation with instant PDF payslip generation.
2. **Revenue & Client Operations (CRM & ERP):** 9-stage visual sales pipeline (Kanban), client directory, project milestone oversight, financial budget allocation buckets, category-wise expense tracking, and Annual Maintenance Contract (AMC) renewal monitoring.
3. **ConTrack Integration & MRR Tracking:** Specialized sub-system managing ConTrack (DZ Infotech's flagship Construction Project Management product suite), dedicated lead tracking (`contrack_leads`), and Monthly Recurring Revenue (`contrack_revenue`) analytics.
4. **Sales & Field Management System (SFMS):** Hierarchical sales teams, field sales agent tracking, on-site client meeting verification with photo/selfie capture, target vs achievement monitoring, commission lifecycle (Generated -> Approved -> Paid), and field finance reconciliation.
5. **Dedicated Sales Agent Portal:** A lightweight, focused mobile-responsive interface for field agents to execute their daily agenda ("My Day"), update leads, log meeting minutes, submit End-of-Day (EOD) reports, and monitor personal earnings.
6. **Corporate Document Automation & Billing:** Client invoice generator with dynamic GST and number-to-words engine, professional ERP quotation master generator (`quotations`) with WhatsApp sharing, and standardized corporate legal documentation (Offer Letters, NDAs, Experience & Completion Certificates).
7. **System Security & Audit Trail:** Immutable activity audit logs (`audit_logs` & `activities`) providing verifiable accountability for security modifications, login histories, and sensitive payroll operations.

The system is architected as a React 18 Single-Page Application (SPA) powered by Vite, styled using Tailwind CSS, and backed by Supabase with a high-performance PostgreSQL relational database featuring 37 dedicated operational tables, real-time cross-tab state synchronization, and fine-grained Row-Level Security (RLS).

---

## 3. COMPLETE TECHNOLOGY STACK

### 3.1 Frontend Architecture
* **Core Framework:** React 18.3.1 (Component-driven SPA architecture, Virtual DOM, React Hooks)
* **Build Tooling & Bundler:** Vite 5.4.2 (Lightning-fast Hot Module Replacement - HMR, optimized production tree-shaking)
* **Styling & Design System:** Tailwind CSS 3.4.10 (Utility-first CSS framework with custom color tokens: Primary Navy `#172A6C`, Accent `#EA6B23`, Success Emerald, Danger Rose)
* **UI Component Library & Icons:** Heroicons 2.1.5 (Clean, scalable SVG vector icons)
* **Motion & Animation:** Framer Motion 12.40.0 (Fluid micro-interactions and modal transitions)
* **State Management:** 
  * React Context API (`AuthContext` for global session, role state, and user profile)
  * Custom Data Hooks (`useSupabaseCollection`, `useSupabaseDocument`, `useAuth`, `useRole`, `useLeadNotifier`, `useAmcNotifier`)
* **Routing:** React Router DOM 6.26.2 (Declarative nested routing, dynamic URL parameters, client-side route guards via `ProtectedRoute`)
* **Forms & Validation:** React Hook Form 7.53.0 (Uncontrolled and controlled high-performance form handling)
* **Notifications & Toasts:** React Hot Toast 2.5.1 (Real-time user feedback and operation alerts)
* **Date & Time Manipulation:** `date-fns 3.6.0` (Date arithmetic, interval calculation, ISO week handling, working days analysis)

### 3.2 Data Visualization & Reporting
* **Interactive Charts:** Recharts 2.12.7 (SVG-based responsive charts: Bar Charts, Pie Charts, Donut Charts, Trend lines for attendance, lead status, revenue, and expenses)
* **Spreadsheet Export:** `xlsx 0.18.5` (SheetJS for generating downloadable Microsoft Excel spreadsheets for attendance registers and payroll summaries)

### 3.3 Document Generation & PDF Engines
* **Declarative PDF Rendering:** `@react-pdf/renderer 4.5.1` (Direct React-to-PDF rendering for high-resolution vector documents: Invoices, ERP Quotations, Employee/Intern Offer Letters, NDAs)
* **Procedural PDF Export:** `jspdf 2.5.2` & `jspdf-autotable 3.8.4` (Instant client-side PDF document generation for Monthly Payslips and Expense Reports)
* **Number to Words Engine:** Custom Indian currency linguistic converter (`numberToWords.js`) converting numeric values (e.g., ₹1,50,000) into formal words ("Rupees One Lakh Fifty Thousand Only") for GST compliance.

### 3.4 Hardware & Browser Web APIs
* **Web Camera Capture:** HTML5 MediaDevices API (`navigator.mediaDevices.getUserMedia`) in `CameraCapture.jsx` for web camera photo capture during daily attendance check-in and field sales client meetings.
* **Real-time Tab Synchronization:** HTML5 BroadcastChannel API (`new BroadcastChannel('app-updates')`) enabling multi-tab synchronization without reloading when database records change.

### 3.5 Backend & Database (BaaS)
* **Database Engine:** PostgreSQL 15+ hosted on Supabase (Relational schema, foreign keys, cascades, indices, JSONB columns, check constraints)
* **Database Client:** `@supabase/supabase-js 2.108.1` (Modern Supabase SDK with query builder, filtering, mutations, and storage interactions)
* **Authentication Provider:** Supabase Auth (OAuth 2.0 with Google Provider, JWT session management, secure refresh token rotation)
* **Security Layer:** PostgreSQL Row-Level Security (RLS) policies enforcing multi-tenant and role-based data boundaries directly in the database engine, with hybrid UNRESTRICTED mode for high-throughput administrative master tables.
* **Storage Engine:** Supabase Storage (Buckets: `intern_documents`, `company_documents`, employee profile photos) and Cloudinary (Fallback asset hosting).

### 3.6 Deployment & DevOps
* **Hosting Platform:** Vercel (CI/CD pipeline with GitHub integration, SPA rewrite rules via `vercel.json`)
* **Package Manager:** npm / pnpm

---

## 4. SYSTEM ARCHITECTURE & DATA FLOW

### 4.1 High-Level Architectural Flow
```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-----------------------------------------------------------------------------+  |
|  |   React 18 SPA (Vite) + Tailwind CSS + Heroicons + Recharts + React Router   |  |
|  +-----------------------------------------------------------------------------+  |
|            |                                   |                        |         |
|      Authentication                     Data Queries              PDF Engine      |
|    (Google Sign-In)                  (useSupabaseCollection)   (@react-pdf/jspdf) |
+------------|-----------------------------------|------------------------|---------+
             |                                   |                        |
             v                                   v                        v
+------------------------+             +-------------------+    +-------------------+
|  Supabase Auth (OAuth) |             | Supabase Database |    | Client-Side Blob  |
|   Google OAuth Flow    |             |  PostgreSQL 15+   |    | Vector Rendering  |
+------------------------+             | (37 SQL Tables)   |    +-------------------+
             |                         +-------------------+              |
             v                                   ^                        v
+------------------------+                       |              +-------------------+
| Automated User Sync    |-----------------------+              | Instant Download  |
| (public.users linking) |  Role & Profile Synchronization      | (PDF / Excel)     |
+------------------------+                                      +-------------------+
```

### 4.2 Authentication & User Synchronization Algorithm
1. The user clicks **Sign in with Google** via Supabase OAuth.
2. Upon successful Google authentication, the user is redirected back to the application.
3. `AuthProvider` catches the session via `supabase.auth.onAuthStateChange`.
4. The system executes `syncAuthenticatedUser(supabaseUser)` in `src/supabase/auth.js`:
   * Checks `public.users` table for an existing record by `id` or `email`.
   * Queries the `employees` table by UID or email. If found, links the UID and retrieves the role (`admin`, `hr`, `manager`, `employee`).
   * If not found in `employees`, queries the `interns` table. If matched, links the UID, assigns role `intern`, and extracts bank details and document statuses.
   * If not found in `interns`, queries the `sfms_agents` table. If active, assigns role `agent` and links the agent ID.
   * If user is marked inactive or not found in any authorized directory, the session is invalidated, and access is routed to `/access-denied`.
   * If authorized, the combined profile (UID, email, display name, avatar, role, employeeId) is stored in React context.

---

## 5. USER ROLES & ACCESS CONTROL MATRIX (RBAC)

The system enforces strict multi-role governance with six distinct user personas:

| Role Name | System Key | Description | Primary Objective |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | Super Administrator & Executive Director | Unrestricted access across HRMS, Revenue, ConTrack, Company Documents, SFMS, and Global Settings. |
| **HR Manager** | `hr` | Human Resources Lead | Manages employees, interns, leave approvals, attendance auditing, payroll generation, and announcements. |
| **Department Manager**| `manager` | Team / Departmental Lead | Approves departmental leaves, monitors team attendance, and views team dashboard metrics. |
| **Regular Employee** | `employee` | Standard Full-time / Part-time Staff | Daily attendance check-in/out (with selfie), leave requests, payslip viewing, software licenses, and personal profile. |
| **Intern** | `intern` | Intern Staff (Paid / Unpaid) | Attendance logging, intern project assignments, stipend payslips (if paid), offer letter/NDA verification. |
| **Field Sales Agent** | `agent` | On-Field Business Development Executive | Restricted to dedicated Agent Portal: daily route ("My Day"), lead pipeline, meeting logs, EOD reports, commissions. |

### 5.1 Granular Permissions Matrix

| Section / Feature Module | Route Path | Admin | HR | Manager | Employee | Intern | Agent |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Main HRMS Dashboard** | `/dashboard` | Yes | Yes | Yes | Yes | Yes | Redirected |
| **Employee Directory & Profiles** | `/employees` | Full CRUD | Full CRUD | View Only | View Directory | Hidden | Hidden |
| **Intern Projects Assignment** | `/intern-projects` | Full CRUD | Full CRUD | Hidden | Hidden | Hidden | Hidden |
| **Internship Program (Legal Docs & Onboarding)** | `/internship-program` | Full CRUD | Full CRUD | Hidden | Hidden | Hidden | Hidden |
| **Department Management** | `/departments` | Full CRUD | View Only | Hidden | Hidden | Hidden | Hidden |
| **Daily Attendance** | `/attendance` | Full / Export | Full / Export | Team View | Self View | Self View | Hidden |
| **Webcam Selfie Punch-in** | `/dashboard` | Yes | Yes | Yes | Yes | Yes | Hidden |
| **Leave Application (Self)** | `/leave/new` | Yes | Yes | Yes | Yes | Yes | Hidden |
| **Leave Approval Portal** | `/leave/approval` | All Requests | All Requests | Dept Requests| Hidden | Hidden | Hidden |
| **Leave Balance Allocation** | `/leave/balances` | Full Access | Full Access | Hidden | Hidden | Hidden | Hidden |
| **Company Holidays Calendar**| `/holidays` | Full CRUD | Full CRUD | View Only | View Only | View Only | View Only |
| **Payroll & Salary Processing** | `/payroll` | Full / Process| Full / Process| Hidden | Self Payslip | Self (if paid)| Hidden |
| **Activity & Audit Logs** | `/activities` | Full Access | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Software Licenses (Asset Mgmt)**| `/assets/software-licenses` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **My Assigned Licenses** | `/active-licenses` | Hidden | Hidden | View Self | View Self | View Self | Hidden |
| **Announcements Broadcast** | `/announcements` | Full CRUD | Full CRUD | View | View | View | View |
| **Revenue Dashboard & MRR** | `/revenue-dashboard` | Full Access | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Sales Leads CRM (Kanban)** | `/leads` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **ConTrack Leads Pipeline** | `/contrack-leads` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **ConTrack Recurring Revenue** | `/contrack-revenue`| Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Client Portfolio Management** | `/clients` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Client Projects Tracking** | `/projects` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Finance & Bucket Allocations** | `/finance` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Expense Tracking & Logging** | `/expense` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **AMC Contract Management** | `/amc` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Bucket Settings** | `/bucket-settings` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Company Legal Documents** | `/company/documents` | Full Access | Full Access | Hidden | Hidden | Hidden | Hidden |
| **ERP Quotation Generator** | `/company/quotations` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **GST Invoice Generator** | `/company/invoices` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **SFMS Field Dashboard** | `/sfms/dashboard` | Full Access | Hidden | Hidden | Hidden | Hidden | Hidden |
| **SFMS Teams & Agents** | `/sfms/teams`, `agents` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **SFMS Meetings & Field Visits** | `/sfms/meetings` | Full Access | Hidden | Hidden | Hidden | Hidden | Hidden |
| **SFMS Targets & Bonus** | `/sfms/targets` | Full CRUD | Hidden | Hidden | Hidden | Hidden | Hidden |
| **SFMS Commissions & Payouts** | `/sfms/commissions` | Full Control | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Agent Portal: My Day** | `/my-day` | Admin View | Hidden | Hidden | Hidden | Hidden | Assigned View|
| **Agent Portal: My Leads** | `/my-leads` | Admin View | Hidden | Hidden | Hidden | Hidden | Assigned View|
| **Agent Portal: My Meetings** | `/my-meetings` | Admin View | Hidden | Hidden | Hidden | Hidden | Assigned View|
| **Agent Portal: Daily Report** | `/daily-report` | Admin View | Hidden | Hidden | Hidden | Hidden | Assigned View|
| **Agent Portal: My Commissions**| `/my-commissions` | Admin View | Hidden | Hidden | Hidden | Hidden | Assigned View|
| **User Profile & Settings** | `/profile` | Yes | Yes | Yes | Yes | Yes | Yes |

---

## 6. COMPLETE BREAKDOWN OF SECTIONS & MODULES

The application is structured into **6 Primary Functional Sections** comprising over **33 Dedicated Modules**:

```
========================================================================================
                               DZ INFOTECH OPERATING SYSTEM
========================================================================================
   |
   +---> SECTION 1: HRMS (HUMAN RESOURCE MANAGEMENT SYSTEM)
   |       |--- 1.1 Multi-Role Interactive Dashboard
   |       |--- 1.2 Employee Lifecycle Management
   |       |--- 1.3 Intern Management & Project Allocation Module
   |       |--- 1.4 Internship Program (Dedicated Student Onboarding, Auto Offer Letter & NDA Generation)
   |       |--- 1.5 Department & Organizational Hierarchy
   |       |--- 1.6 Smart Attendance with Selfie Verification & Break Tracker
   |       |--- 1.7 Leave Management & Multi-Tier Approval Workflow
   |       |--- 1.8 Company Holidays Calendar & Planning (`holidays`)
   |       |--- 1.9 Automated Payroll Engine & Payslip Generator
   |       |--- 1.10 Corporate Asset & Software License Management
   |       |--- 1.11 Broadcast Announcements Center
   |       |--- 1.12 System Security & Audit Logging (`audit_logs` & `activities`)
   |       +--- 1.13 User Profile & Banking Information
   |
   +---> SECTION 2: REVENUE OPERATIONS & CLIENT CRM (ERP)
   |       |--- 2.1 Executive Revenue & Financial Dashboard
   |       |--- 2.2 9-Stage Sales Leads Pipeline (Kanban CRM)
   |       |--- 2.3 Client Portfolio Management
   |       |--- 2.4 Active Client Projects & Milestone Tracking
   |       |--- 2.5 Finance & Cashflow Bucket Allocation Engine
   |       |--- 2.6 Category-Wise Operational Expense Management
   |       |--- 2.7 Annual Maintenance Contracts (AMC) Tracking & Alerts
   |       +--- 2.8 Revenue Bucket Settings & Budget Customizer
   |
   +---> SECTION 3: CONTRACK INTEGRATION & SUBSCRIPTION REVENUE
   |       |--- 3.1 ConTrack Dedicated Leads Management (`contrack_leads`)
   |       +--- 3.2 ConTrack MRR & Recurring Subscription Revenue (`contrack_revenue`)
   |
   +---> SECTION 4: COMPANY OPERATIONS, BILLING & DOCUMENT AUTOMATION
   |       |--- 4.1 GST Tax Invoice Generator & PDF Engine (`invoices`)
   |       |--- 4.2 Enterprise ERP Quotation Master Generator & Archive (`quotations`)
   |       |--- 4.3 Legal Document Automation (Offer Letters, NDAs, Certificates)
   |       +--- 4.4 Corporate Document Repository (Marketing & Presentations)
   |
   +---> SECTION 5: SFMS (SALES & FIELD MANAGEMENT SYSTEM - ADMIN/EXECUTIVE)
   |       |--- 5.1 SFMS Strategic Operations Dashboard
   |       |--- 5.2 Sales Teams & Territory Management
   |       |--- 5.3 Field Sales Agents Directory & Multi-Team Junction
   |       |--- 5.4 Field Leads Pipeline & Audit Timeline
   |       |--- 5.5 On-Site Client Meeting Tracking with Selfie Capture
   |       |--- 5.6 Milestone Sales Targets & Performance Bonuses
   |       |--- 5.7 Field Commission Approval & Payout Lifecycle
   |       |--- 5.8 Field Finance & Revenue vs Liability Reconciliation
   |       +--- 5.9 Field Performance Reports & EOD Aggregations
   |
   +---> SECTION 6: FIELD AGENT DEDICATED PORTAL
           |--- 6.1 My Day (Daily Operations Agenda & Urgent Actions)
           |--- 6.2 My Leads (Territory Pipeline & Quick Lead Capture)
           |--- 6.3 My Meetings (Field Meeting Check-in with Selfie Upload)
           |--- 6.4 Daily End-of-Day (EOD) Report Submission
           +--- 6.5 My Commissions (Earnings Tracker & Payout History)
========================================================================================
```

---

### SECTION 1: HRMS (HUMAN RESOURCE MANAGEMENT SYSTEM)

#### Module 1.1: Multi-Role Interactive Dashboard
* **Primary Route:** `/dashboard`
* **Components:** `AdminDashboard.jsx`, `EmployeeDashboard.jsx`, `ManagerDashboard.jsx`, `AnnouncementsBanner.jsx`, `AttendanceControl.jsx`, `InternDocumentsCard.jsx`, `UpcomingBirthdays.jsx`, `UpcomingClientEvents.jsx`, `MissingCheckoutWarning.jsx`.
* **Description:** Provides a personalized command center depending on whether the logged-in user is an Admin, HR, Manager, Employee, or Intern.
* **Key Functionalities:**
  * **Real-time KPI Metric Cards:** Total Active Employees, Present Today, On Leave Today, Pending Leave Approvals, Monthly Payroll Outflow, Active Interns.
  * **Interactive Attendance Widget:** Live real-time clock displaying working hours, Check-In, Take Break / Resume, and Check-Out actions.
  * **Webcam Photo Verification:** Integrated camera popup capturing a timestamped selfie when punching in.
  * **Missing Checkout Warning:** Automatically detects if an employee forgot to punch out on the previous working day and prompts for regularization.
  * **Upcoming Celebrations & Deadlines:** Real-time reminders for employee birthdays, client anniversaries, and project milestones.
  * **Intern Document Status Card:** For interns, displays direct status indicators (Offer Letter Generated, NDA Signed, Documents Uploaded).

#### Module 1.2: Employee Lifecycle Management
* **Primary Routes:** `/employees`, `/employees/new`, `/employees/:id/edit`, `/employees/:id`
* **Components:** `EmployeeList.jsx`, `EmployeeForm.jsx`, `EmployeeProfile.jsx`, `AddInternModal.jsx`, `InternDetailModal.jsx`.
* **Description:** Manages the entire employee lifecycle from onboarding to offboarding.
* **Key Functionalities:**
  * **Employee Directory:** Searchable, filterable list by department, status (Active, Inactive, Probation, Terminated), and role. View toggles for Grid Cards and Table rows.
  * **Comprehensive Employee Profile:** Personal details (DOB, Blood Group, Address), Work details (Employee ID, Designation, Department, Date of Joining, Work Mode), Salary details (Basic, HRA, Allowances, PF, Tax/TDS), Bank Account details (Account Number, Bank Name, IFSC, UPI ID), Emergency Contacts, and Attached Documents.
  * **Role Assignment:** Administrators can promote or reassign user roles (`admin`, `hr`, `manager`, `employee`).

#### Module 1.3: Intern Management & Project Allocation
* **Primary Routes:** `/intern-projects`, `/employees` (Intern tab)
* **Components:** `InternProjects.jsx`, `ProjectAssignmentModal.jsx`, `AddInternModal.jsx`, `InternDetailModal.jsx`.
* **Description:** A dedicated sub-system to manage college interns, internship tenures, stipends, and mentor assignments.
* **Key Functionalities:**
  * **Intern Onboarding:** Records university details, internship duration (start & end date), paid/unpaid status, stipend amount, and certificate eligibility.
  * **Project Assignment:** Assigns interns to specific software projects with a designated mentor (`mentor_name`, `mentor_ids`).
  * **Progress & Status Tracking:** Status workflow: `Assigned` -> `In Progress` -> `Completed` -> `On Hold`.
  * **WhatsApp Integration:** Direct one-click WhatsApp action to message project briefs and tasks to the intern's phone.

#### Module 1.4: Internship Program Module (`internship_program`)
* **Primary Route:** `/internship-program`
* **Components:** `InternshipProgramList.jsx`, `InternshipProgramModal.jsx`, `InternshipProgramOfferLetterPDF.jsx`, `InternshipProgramNDAPDF.jsx`.
* **Primary Database Table:** `internship_program`
* **Description:** A completely separate and dedicated industrial internship program module designed for student onboarding, tenures tracking (3-Month Fast-Track and 6-Month Advanced batches), and automated document generation based on the official DZ Infotech master templates (`DZ_Infotech_Internship_Offer_Letter.docx` and `DZ_Infotech_Student_Internship_NDA.docx`).
* **Key Functionalities:**
  * **Structured 3-Tab Intern Registration Form:**
    * *Tab 1 (Candidate & College):* Candidate Full Name, Son/Daughter of (Parent/Guardian name for legal NDA clause), Email, Phone/WhatsApp, College/University name, Degree/Branch & Year, Permanent Residential Address.
    * *Tab 2 (Offer & Terms):* Position/Domain (MERN, React, Python/AI, Mobile, QA), Department/Team, Duration (3 Months / 6 Months), Start Date, End Date (auto-calculated from duration), Work Mode (Remote, Hybrid, On-site), Reporting Mentor, Working Days & Timings, Stipend/Compensation terms.
    * *Tab 3 (NDA & Signatory):* Offer Date, Acceptance Deadline (auto-calculated to +7 days), NDA Effective Date, Authorized Signatory Name, Designation, Place (Bhavnagar, Gujarat), Intern Status, and internal notes.
  * **Automated Offer Letter PDF Generation:** Procedurally generates vector PDFs perfectly matching the Word document layout (`DZ_Infotech_Internship_Offer_Letter.docx`), complete with the 8 formal sections, structured 2-column details table, company signature, and Intern Acceptance Block.
  * **Automated Student NDA PDF Generation:** Generates comprehensive multi-page legal Non-Disclosure Agreements matching `DZ_Infotech_Student_Internship_NDA.docx`, including Definitions, Exclusions, Obligations, IP Rights & Assignment, Return of Assets, Survival Duration, Bhavnagar Jurisdiction, and Dual Signature Blocks (with Parent/Guardian block for minors).
  * **Live PDF Preview & Instant Download:** Embedded in-app modal preview (`iframe` blob viewer) and one-click direct PDF downloads.
  * **Program Analytics & Filtering:** Summary cards tracking Total Enrolled, Active Tenures, 3 Months Fast-Track, and 6 Months Advanced counts; search by name/college/domain, and status filtering.

#### Module 1.5: Department & Organizational Hierarchy
* **Primary Routes:** `/departments`, `/departments/new`, `/departments/:id/edit`
* **Components:** `DepartmentList.jsx`, `DepartmentForm.jsx`.
* **Description:** Manages corporate departments (e.g., Engineering, Sales, Human Resources, UI/UX Design, QA).
* **Key Functionalities:**
  * Displays active employee count per department.
  * Assigns Department Head / Manager to oversee leave approvals.

#### Module 1.6: Smart Attendance & Break Tracker
* **Primary Route:** `/attendance`
* **Components:** `AttendanceList.jsx`, `AttendanceControl.jsx`, `CameraCapture.jsx`.
* **Description:** Biometric-grade attendance logging with automated working hour analysis.
* **Key Functionalities:**
  * **Clock-in / Clock-out with Web Camera Capture:** Captures photo evidence upon punching in to prevent proxy attendance.
  * **Break Tracking:** Multiple break intervals per day (`Break In`, `Break Out`) with cumulative break duration calculation.
  * **Automated Status Calculation:** Automatically flags records as `Present`, `Late`, `Half Day`, or `Absent` based on check-in time and total hours worked.
  * **Overtime Calculation:** Automatically computes overtime hours beyond standard shift durations (8 hours).
  * **Work Notes:** Allows employees to submit daily work summaries upon punching out.
  * **Export to Excel:** Generates formatted `.xlsx` attendance registers with Daily, Monthly, or Custom Date Range scopes.

#### Module 1.7: Leave Management & Multi-Tier Approvals
* **Primary Routes:** `/leave`, `/leave/new`, `/leave/:id/edit`, `/leave/approval`, `/leave/balances`
* **Components:** `LeaveList.jsx`, `LeaveForm.jsx`, `LeaveApproval.jsx`, `LeaveBalances.jsx`.
* **Description:** End-to-end leave application, balance tracking, and hierarchical approval system.
* **Key Functionalities:**
  * **Configurable Leave Types:** Paid Leave (PL), Casual Leave (CL), Sick Leave (SL), Maternity Leave, Loss of Pay (LOP) / Unpaid Leave.
  * **Leave Application:** Date pickers (Start Date, End Date), Half-day toggle, reason for leave, and emergency contact details.
  * **Multi-Tier Approval Hierarchy:** Department Managers can approve or reject leaves for their department members; HR and Admins can approve company-wide leaves.
  * **Real-time Balance Deduction:** Automatically deducts approved leave days from the employee's `leave_balance` record.
  * **Sidebar Badging:** Dynamically shows the count of pending leave requests waiting for the supervisor's action.

#### Module 1.8: Company Holidays Calendar & Planning (`holidays`)
* **Primary Table:** `holidays`
* **Description:** Centralized corporate holiday calendar.
* **Key Functionalities:**
  * Displays official statutory holidays and festive closures.
  * Feeds into attendance and payroll engines to prevent false absenteeism marks on official company off-days.

#### Module 1.9: Automated Payroll Engine & Payslip Generator
* **Primary Routes:** `/payroll`, `/payroll/payslip/:id`
* **Components:** `PayrollList.jsx`, `PayrollProcess.jsx`, `Payslip.jsx`.
* **Description:** Automated salary calculation engine that synthesizes monthly attendance, unpaid leaves, earnings, and deductions.
* **Key Functionalities:**
  * **Automated Calculation Formula:**
    $$\text{Gross Earnings} = \text{Basic Salary} + \text{HRA} + \text{Special Allowances}$$
    $$\text{Per Day Salary} = \frac{\text{Basic Salary}}{\text{Total Days in Month}}$$
    $$\text{LOP Deduction} = \text{Unpaid Leaves} \times \text{Per Day Salary}$$
    $$\text{Total Deductions} = \text{Provident Fund (PF)} + \text{TDS / Income Tax} + \text{LOP Deduction}$$
    $$\text{Net Payable Salary} = \text{Gross Earnings} - \text{Total Deductions}$$
  * **Batch Payroll Processing:** One-click automated salary generation for all employees for any given month/year.
  * **Payment Status Workflow:** `Draft` -> `Pending` -> `Approved` -> `Paid`.
  * **Instant PDF Payslip Generation:** Uses `jspdf` and `jspdf-autotable` to produce professional, downloadable salary slips with the corporate logo, salary breakdown, bank account details, and authorized signature.
  * **Paid Intern Stipends:** Automatically generates stipend vouchers for paid interns based on agreed stipend rates.

#### Module 1.10: Corporate Asset & Software License Management
* **Primary Routes:** `/assets/software-licenses`, `/active-licenses`
* **Components:** `SoftwareLicenses.jsx`, `ActiveLicenses.jsx`.
* **Description:** Tracks corporate software subscriptions, cloud seats, and developer tools.
* **Key Functionalities:**
  * Tracks tool name, vendor (e.g., GitHub, JetBrains, Figma, AWS), monthly/annual subscription cost, renewal dates, and assigned employee.
  * Summary cards show Total Monthly Recurring Software Expense and Active Licenses count.
  * Employees can view their assigned software licenses and access credentials on `/active-licenses`.

#### Module 1.11: Broadcast Announcements Center
* **Primary Route:** `/announcements`
* **Components:** `AnnouncementsAdmin.jsx`, `AnnouncementsBanner.jsx`.
* **Description:** System-wide broadcasting for organizational notices, holidays, and company events.
* **Key Functionalities:**
  * Admin/HR can create announcements with Priority flags (`info`, `warning`, `urgent`).
  * Target audience filtering (`all`, `employees`, `interns`, `managers`).
  * Displays as an eye-catching banner at the top of user dashboards.

#### Module 1.12: System Security & Audit Logging (`audit_logs` & `activities`)
* **Primary Route:** `/activities`
* **Primary Tables:** `audit_logs`, `activities`
* **Components:** `Activities.jsx`.
* **Description:** Immutable system audit trail logging crucial organizational events and security actions.
* **Key Functionalities:**
  * Tracks employee profile updates, leave approvals/rejections, salary disbursements, and lead conversions.
  * Dedicated `audit_logs` table records authentication attempts, permission modifications, and administrative overrides with actor IDs and timestamps.

#### Module 1.13: User Profile & Banking Information
* **Primary Route:** `/profile`
* **Components:** `Profile.jsx`, `InternBankDetailsPrompt.jsx`.
* **Description:** Allows staff to manage their personal information and securely update banking/UPI details for salary and stipend disbursements.

---

### SECTION 2: REVENUE OPERATIONS & CLIENT CRM (ERP)

#### Module 2.1: Executive Revenue & Financial Dashboard
* **Primary Route:** `/revenue-dashboard`
* **Components:** `RevenueDashboard.jsx`.
* **Description:** High-level strategic overview of company financial health, active client accounts, and sales pipeline conversion rates.
* **Key Functionalities:**
  * **Financial Metrics:** Total Expected Project Revenue, Collected Revenue (Advances), Pending Receivables, Total Operational Expenses, Net Operating Profit.
  * **Visual Visualizations:** Recharts Bar and Pie charts illustrating Leads by Pipeline Stage, Project Status distribution, and Expense Breakdown by Category.
  * **AMC Portfolio Value:** Total value of active Annual Maintenance Contracts generating recurring annual revenue.

#### Module 2.2: 9-Stage Sales Leads Pipeline (Kanban CRM)
* **Primary Route:** `/leads`
* **Components:** `LeadsPipeline.jsx`, `LeadFormModal.jsx`, `ContactedDetailsModal.jsx`, `DemoPreparationModal.jsx`, `MeetingScheduledModal.jsx`, `MeetingCompletedModal.jsx`, `ProposalSentModal.jsx`, `NegotiationModal.jsx`, `WonModal.jsx`, `LostModal.jsx`, `LeadActionModal.jsx`, `LeadStageDetailsModal.jsx`.
* **Description:** A visual sales pipeline tracking prospective enterprise clients across 9 distinct progression stages:
  1. `New Lead` (Initial lead entry from website, referral, or field discovery)
  2. `Contacted` (Client reached via call or email, initial requirements gathered)
  3. `Demo Preparation` (Technical team prepares tailored product demo or ERP walkthrough)
  4. `Meeting Scheduled` (Formal presentation or client discovery call booked with calendar date)
  5. `Meeting Completed` (Meeting minutes recorded, scope finalized)
  6. `Proposal Sent` (Quotation and technical RFP submitted)
  7. `Negotiation` (Price discussion, terms adjustment, advance payment timeline)
  8. `Won` (Deal closed! Automatically prompts to convert lead into a Client and create an Active Project)
  9. `Lost` (Deal rejected; captures structured reasons: price, timing, competitor, or budget)
* **Key Functionalities:**
  * Dual-view mode: Interactive Kanban drag-and-drop board and tabular list view.
  * Color-coded lead source tags (Website, Referral, LinkedIn, Cold Outreach, Agent).
  * Guided transition modals prompting for required data at each stage.
  * Automated follow-up notifications via `useLeadNotifier.js`.

#### Module 2.3: Client Portfolio Management
* **Primary Route:** `/clients`
* **Components:** `ClientsList.jsx`, `ClientFormModal.jsx`.
* **Description:** Centralized directory of institutional and corporate clients.
* **Key Functionalities:**
  * Stores Company Name, Contact Person, Phone, Email, GST Number, Billing Address, Industry sector.
  * Tracks Total Projects Count and Client Lifetime Value (LTV).
  * Client status: `Active`, `Inactive`.

#### Module 2.4: Active Client Projects & Milestone Tracking
* **Primary Route:** `/projects`
* **Components:** `ProjectsList.jsx`, `ProjectFormModal.jsx`.
* **Description:** Tracks contracted deliverables, budgets, milestone payments, and assigned teams.
* **Key Functionalities:**
  * Tracks Total Project Value, Advance Received, and Remaining Balance.
  * Start Date, Target Delivery Date, and Project Status (`Planning`, `In Progress`, `Completed`, `On Hold`).
  * Links project directly to the corresponding client in the `clients` table.

#### Module 2.5: Finance & Cashflow Bucket Allocation Engine
* **Primary Route:** `/finance`
* **Components:** `Finance.jsx`.
* **Description:** An algorithmic financial reserve allocation model that splits incoming project revenue into dedicated operating buckets to safeguard cashflow.
* **Key Functionalities:**
  * **Default Reserve Buckets:**
    * *Employee Salary Bucket:* Reserved for staff payroll.
    * *Probation Reserve Bucket:* Safety fund for training and probation hires.
    * *ConTrack Expense Bucket:* Earmarked for sub-contractor and SaaS tooling costs.
    * *Profit Bucket:* Retained earnings and partner distribution.
    * *Company Operating Expense Bucket:* Rent, utilities, and contingency reserves.
  * Displays project-by-project cashflow distribution across buckets in both Card and Table views.

#### Module 2.6: Category-Wise Operational Expense Management
* **Primary Route:** `/expense`
* **Components:** `Expense.jsx`.
* **Description:** Detailed tracking of corporate operational expenditures (OpEx).
* **Key Functionalities:**
  * **Standard Expense Categories:** Software Subscriptions, Office Supplies, Marketing & Ads, Travel, Utilities, Office Rent, Freelancing/Consulting, Internet, Domain & Hosting, AI Tooling.
  * Date filtering and date range analysis (Start Date to End Date).
  * Interactive Recharts Pie and Bar charts illustrating expense distribution.
  * Export expense reports directly to PDF using `exportExpensesPdf`.

#### Module 2.7: Annual Maintenance Contracts (AMC) Tracking & Alerts
* **Primary Route:** `/amc`
* **Components:** `AmcList.jsx`, `AmcFormModal.jsx`.
* **Description:** Manages recurring post-launch maintenance contracts for deployed client software.
* **Key Functionalities:**
  * Stores AMC Contract Start Date, Expiry Date, Annual Maintenance Fee, and Support SLA terms.
  * Visual badge warning indicators for contracts expiring within 30 days.
  * Automated background toast notifications via `useAmcNotifier.js` reminding administrators to send renewal invoices.

#### Module 2.8: Revenue Bucket Settings
* **Primary Route:** `/bucket-settings`
* **Components:** `BucketSettings.jsx`.
* **Description:** Allows administrators to configure financial allocation percentages and financial targets for each reserve bucket.

---

### SECTION 3: CONTRACK INTEGRATION & SUBSCRIPTION REVENUE

#### Module 3.1: ConTrack Dedicated Leads Management (`contrack_leads`)
* **Primary Table:** `contrack_leads`
* **Description:** Specialized sub-pipeline dedicated to prospective construction companies and builders adopting the ConTrack construction management suite.
* **Key Functionalities:**
  * Captures construction industry parameters (ongoing project sites, contractor counts, estimation requirements).
  * Segregated pipeline tracking so SaaS product leads do not mix with custom software service leads.

#### Module 3.2: ConTrack Recurring Revenue & MRR (`contrack_revenue`)
* **Primary Table:** `contrack_revenue`
* **Description:** Dedicated financial tracking of Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR) generated from ConTrack software subscriptions.
* **Key Functionalities:**
  * Tracks subscription tiers, monthly billing cycles, renewal dates, and payment collection status.

---

### SECTION 4: COMPANY OPERATIONS, BILLING & DOCUMENT AUTOMATION

#### Module 4.1: GST Tax Invoice Generator & PDF Engine (`invoices`)
* **Primary Route:** `/company/invoices`
* **Components:** `InvoiceGenerator.jsx`, `InvoicePDF.jsx`.
* **Description:** Professional, GST-compliant invoicing module that eliminates external billing tools.
* **Key Functionalities:**
  * **Automated Sequential Numbering:** Automatically suggests the next sequential invoice number in the format `INV-YYYY-XXX` (e.g., `INV-2026-004`).
  * **Line Item Table:** Dynamic addition of deliverables with Description, Quantity, Unit Rate, and calculated Amount.
  * **Taxation & Discounts:** Configurable discount percentage/amount and automated CGST/SGST/IGST computation.
  * **Indian Number to Words Conversion:** Converts total invoice value (e.g., ₹88,500) into formal legal words ("Rupees Eighty Eight Thousand Five Hundred Only").
  * **Bank Details & UPI Integration:** Embeds company banking details (Bank Name, Account Holder, Account Number, IFSC) and UPI ID directly onto the invoice.
  * **Instant PDF Download:** Uses `@react-pdf/renderer` to generate clean, print-ready corporate invoices.

#### Module 4.2: Enterprise ERP Quotation Master Generator & Archive (`quotations`)
* **Primary Route:** `/company/quotations`
* **Components:** `CompanyQuotations.jsx`, `QuotationPDF.jsx`.
* **Description:** Comprehensive commercial proposal and ERP cost estimation generator based on the official DZ Infotech Master Template.
* **Key Functionalities:**
  * **Module Cost Estimator:** Allows dynamic pricing breakdown across discrete ERP modules:
    * Manufacturing Module
    * Inventory & Warehouse Module
    * Sales & CRM Module
    * HRMS & Payroll Module
    * Analytics & BI Reports Module
    * Cloud Deployment & Setup
    * Annual Maintenance Contract (AMC)
  * **Dynamic Quotation Numbering:** Automatically generates prefix `QT-YYYYMMDD-XX`.
  * **Database Persistence:** Saves quotation records to the `quotations` table in Supabase.
  * **Validity Terms:** Calculates proposal expiration date (default 30 days).
  * **WhatsApp Sharing:** One-click button to launch WhatsApp Web/Mobile with pre-filled proposal summary and client contact details.
  * **Formal PDF Export:** Produces a multi-page commercial quotation detailing project scope, technology architecture, delivery timelines, payment terms, and legal warranties.

#### Module 4.3: Legal Document Automation
* **Primary Route:** `/company/documents`
* **Components:** `CompanyDocuments.jsx`, `OfferLetterPDF.jsx`, `NDAPDF.jsx`, `internPdfGenerator.jsx`.
* **Description:** Automated legal document generator for newly onboarded employees and interns.
* **Key Functionalities:**
  * **Employee & Intern Offer Letters:** Auto-fills candidate name, designation, department, joining date, CTC/stipend, working hours, and probationary terms.
  * **Non-Disclosure Agreement (NDA):** Legally binding document covering intellectual property (IP) assignment, source code confidentiality, client data secrecy, and non-solicitation clauses.
  * **Digital Signature & Company Stamp:** Automatically stamps the official base64 authorized corporate signature onto the generated PDF.
  * **Storage Synchronization:** Automatically stores generated documents in the Supabase Storage bucket (`intern_documents`) under the intern's unique ID folder.

#### Module 4.4: Corporate Document Repository
* **Primary Route:** `/company/documents` (Uploaded documents tab)
* **Components:** `CompanyDocuments.jsx`.
* **Description:** Cloud storage repository for corporate marketing collaterals, company presentation decks (PPT), product catalogues, and standard operating procedures (SOPs).

---

### SECTION 5: SFMS (SALES & FIELD MANAGEMENT SYSTEM - ADMIN / MANAGEMENT)

#### Module 5.1: SFMS Strategic Operations Dashboard
* **Primary Route:** `/sfms/dashboard`
* **Components:** `Dashboard.jsx`.
* **Description:** Real-time analytics dashboard monitoring field sales force performance, territorial lead acquisition, and conversion rates.
* **Key Functionalities:**
  * Displays Total Field Leads, Meetings Conducted This Week, Won Deals, and Active Field Pipeline Value.
  * Visualizes team-by-team target achievement percentages.

#### Module 5.2: Sales Teams & Territory Management
* **Primary Route:** `/sfms/teams`
* **Components:** `Teams.jsx`.
* **Description:** Organizes field sales agents into regional or departmental teams (e.g., Ahmedabad Tech Sales, Surat Enterprise Team, Rajkot Field Force).
* **Key Functionalities:**
  * Assigns Team Leaders (`leader_id`).
  * Supports Many-to-Many team-agent relationships through the junction table `sfms_team_agents`.

#### Module 5.3: Field Sales Agents Directory
* **Primary Routes:** `/sfms/agents`, `/sfms/agents/:id`
* **Components:** `Agents.jsx`, `AgentProfile.jsx`.
* **Description:** Directory of all registered field sales representatives.
* **Key Functionalities:**
  * Stores agent contact information, assigned territory/city, joining date, and status.
  * Detailed Agent Profile page shows personal win rate, meetings completed, active leads, and total earned commissions.

#### Module 5.4: Field Leads & Audit Timeline
* **Primary Routes:** `/sfms/leads`, `/sfms/leads/:id`
* **Components:** `Leads.jsx`, `LeadProfile.jsx`.
* **Description:** Detailed lead management tailored specifically for physical field sales.
* **Key Functionalities:**
  * Field stages: `Assigned`, `Contacted`, `Meeting Scheduled`, `Meeting Completed`, `Proposal Sent`, `Negotiation`, `Won`, `Lost`.
  * Tracks whether advance payment has been collected (`advance_paid`).
  * **Lead Timeline:** Audit log recording stage transitions, timestamps, and who made the change (`sfms_lead_timeline`).

#### Module 5.5: On-Site Client Meeting Tracking & Geo/Selfie Verification
* **Primary Route:** `/sfms/meetings`
* **Components:** `Meetings.jsx`, `CameraCapture.jsx`.
* **Description:** Verifies that field sales agents physically visited prospective clients.
* **Key Functionalities:**
  * Records Meeting Date, Time, Person Met, Designation, Phone, Email, Discussion Summary, and Quotation Amount.
  * **Selfie / Photo Evidence:** Requires the agent to upload or capture a selfie outside or inside the client's office (`selfie_url`, `photos[]`) to prevent falsified reports.
  * Follow-up date scheduling.

#### Module 5.6: Milestone Sales Targets & Performance Bonuses
* **Primary Route:** `/sfms/targets`
* **Components:** `Targets.jsx`.
* **Description:** Defines sales quotas for teams and agents.
* **Key Functionalities:**
  * Target types: `Revenue` (Currency target), `Client` (Number of new clients), `Meeting` (Number of physical meetings).
  * Defines duration (in days), deadline dates, and associated financial bonus amounts upon successful completion.

#### Module 5.7: Field Commission Approval & Payout Lifecycle
* **Primary Route:** `/sfms/commissions`
* **Components:** `Commissions.jsx`.
* **Description:** Governs performance commissions payable to field agents for closed contracts.
* **Key Functionalities:**
  * Commission types: `Advance Commission` (paid upon advance collection) and `Final Commission` (paid upon full project payment).
  * Multi-stage commission workflow: `Generated` -> `Pending Approval` -> `Approved` -> `Payable` -> `Paid`.

#### Module 5.8: Field Finance & Reconciliation
* **Primary Route:** `/sfms/finance`
* **Components:** `Finance.jsx`.
* **Description:** Financial audit reconciling project contract values, advance received, remaining receivables, and outstanding commission liabilities.

#### Module 5.9: Field Sales Performance Reports
* **Primary Route:** `/sfms/reports`
* **Components:** `Reports.jsx`.
* **Description:** Generates aggregate executive reports analyzing field meeting conversions, agent productivity, and territorial revenue generation.

---

### SECTION 6: FIELD AGENT DEDICATED PORTAL

Field sales agents require an ultra-fast, mobile-friendly interface optimized for on-the-road execution. When a user with the `agent` role logs in, they are immediately redirected to `/my-day` instead of the main administrative dashboard.

#### Module 6.1: My Day (Daily Operations Agenda)
* **Primary Route:** `/my-day`
* **Components:** `MyDay.jsx`.
* **Description:** A daily operational cockpit presenting the agent with their immediate daily priorities.
* **Key Functionalities:**
  * Displays today's scheduled client meetings, follow-ups due today, and monthly target progress bars.
  * Quick-action buttons to log a new meeting or capture a new lead on the go.

#### Module 6.2: My Leads
* **Primary Routes:** `/my-leads`, `/my-leads/:id`
* **Components:** `MyLeads.jsx`, `LeadProfile.jsx` (Agent mode).
* **Description:** Filtered view displaying exclusively the leads assigned to the logged-in agent.
* **Key Functionalities:**
  * Allows agents to update lead status, record phone notes, and request a quotation.

#### Module 6.3: My Meetings
* **Primary Route:** `/my-meetings`
* **Components:** `Meetings.jsx` (Agent portal).
* **Description:** Calendar and list of scheduled client visits.
* **Key Functionalities:**
  * Allows agents to check in to meetings and instantly take/upload photo proof with meeting summaries.

#### Module 6.4: Daily End-of-Day (EOD) Report Submission
* **Primary Route:** `/daily-report`
* **Components:** `DailyReport.jsx`.
* **Description:** Structured daily reporting submitted by agents before leaving the field.
* **Key Functionalities:**
  * Form captures: Meetings Completed, Interested Leads count, Very Interested Leads count, Follow-ups Scheduled, Expected Revenue, Challenges Faced in the Market, and Tomorrow's Planned Route.
  * Automatically stores in the `sfms_daily_reports` table.

#### Module 6.5: My Commissions
* **Primary Route:** `/my-commissions`
* **Components:** `MyCommissions.jsx`.
* **Description:** Transparent ledger allowing field agents to track their earned commissions, pending approvals, and bank payouts.

---

## 7. DATABASE ARCHITECTURE & COMPLETE SCHEMA SPECIFICATION

The production database is hosted on Supabase (PostgreSQL 15+) and comprises **38 operational tables and 2 storage buckets**.

### 7.1 Master Database Table Inventory (Alphabetical Order)

The table below lists all 38 database tables directly matching the live Supabase project structure, along with their security enforcement status:

| # | Table Name | Supabase Security Status | Functional Domain | Primary Purpose & Usage |
| :---: | :--- | :---: | :--- | :--- |
| **1** | `activities` | **UNRESTRICTED** | HRMS / System | System-wide event audit trail and operational activity log |
| **2** | `amcs` | **RLS Protected** 🌐 | Revenue & ERP | Annual Maintenance Contracts and automated renewal alerts |
| **3** | `announcements` | **RLS Protected** 🌐 | HRMS Operations | Broadcast notices, urgent banners, and role-targeted memos |
| **4** | `attendance` | **UNRESTRICTED** | HRMS Operations | Daily punch records, webcam selfie URLs, break logs, overtime |
| **5** | `audit_logs` | **UNRESTRICTED** | System Security | Security modifications, authentication audits, and administrative logs |
| **6** | `clients` | **RLS Protected** 🌐 | CRM & ERP | Master corporate client directory, GST numbers, contact persons |
| **7** | `contrack_leads` | **RLS Protected** 🌐 | ConTrack CRM | Dedicated leads pipeline for the ConTrack construction SaaS suite |
| **8** | `contrack_revenue` | **RLS Protected** 🌐 | ConTrack ERP | Monthly Recurring Revenue (MRR) and subscriptions from ConTrack |
| **9** | `departments` | **UNRESTRICTED** | HRMS Structure | Corporate departments, designations, and department managers |
| **10** | `documents` | **UNRESTRICTED** | Corporate Assets | Uploaded company assets, PPTs, brochures, and employee documents |
| **11** | `employees` | **UNRESTRICTED** | Core HRMS | Master employee records, salary CTC breakdown, bank details |
| **12** | `expenses` | **RLS Protected** 🌐 | Finance & ERP | Corporate operational expenditures (OpEx) and categorized receipts |
| **13** | `holidays` | **UNRESTRICTED** | HRMS Operations | Official company holidays calendar and statutory holiday off-days |
| **14** | `intern_projects` | **RLS Protected** 🌐 | Intern Module | Intern project assignments, mentor pairings, WhatsApp task links |
| **15** | `interns` | **RLS Protected** 🌐 | Intern Module | Intern profiles, college credentials, stipends, and legal agreements |
| **16** | `internship_program` | **RLS Protected** 🌐 | Internship Program | Dedicated student applications, tenures, Offer Letter and NDA generation |
| **17** | `invoices` | **UNRESTRICTED** | Billing & Finance | GST tax invoices, line items, CGST/SGST/IGST, payment status |
| **18** | `leads` | **RLS Protected** 🌐 | Sales CRM | Primary 9-stage sales CRM pipeline for custom software services |
| **19** | `leave_balance` | **UNRESTRICTED** | HRMS Operations | Real-time annual leave quotas and remaining balances per employee |
| **20** | `leave_requests` | **UNRESTRICTED** | HRMS Operations | Employee leave applications and multi-tier approval lifecycle |
| **21** | `leave_types` | **UNRESTRICTED** | HRMS Policies | Configurable leave policies (Paid, Casual, Sick, Maternity, LOP) |
| **22** | `notifications` | **RLS Protected** 🌐 | User Experience | User notifications, task assignments, and system reminders |
| **23** | `payroll` | **UNRESTRICTED** | HRMS Finance | Monthly processed payroll register, LOP deductions, net pay |
| **24** | `projects` | **RLS Protected** 🌐 | Project ERP | Contracted client projects, budgets, milestones, and deliverable dates |
| **25** | `quotations` | **UNRESTRICTED** | Commercial ERP | Generated commercial proposals, module pricing, and terms |
| **26** | `settings` | **UNRESTRICTED** | Global Config | Global system parameters, budget allocations, financial buckets |
| **27** | `sfms_agents` | **RLS Protected** 🌐 | Field Sales | Field sales representatives directory, cities, and status |
| **28** | `sfms_commissions`| **RLS Protected** 🌐 | Field Sales | Agent sales commissions lifecycle (Generated -> Approved -> Paid) |
| **29** | `sfms_daily_reports`| **RLS Protected** 🌐 | Field Sales | Field agents' End-of-Day (EOD) reports and route summaries |
| **30** | `sfms_finance` | **RLS Protected** 🌐 | Field Sales | Field revenue collected, advances, and commission payout liability |
| **31** | `sfms_lead_timeline`| **RLS Protected** 🌐 | Field Sales | Audit trail of stage movements for field leads |
| **32** | `sfms_leads` | **RLS Protected** 🌐 | Field Sales | Field sales leads, physical location visits, and closing stages |
| **33** | `sfms_meetings` | **RLS Protected** 🌐 | Field Sales | On-site client visit records, discussion notes, and selfie proofs |
| **34** | `sfms_targets` | **RLS Protected** 🌐 | Field Sales | Revenue, client, and meeting sales quotas and bonus deadlines |
| **35** | `sfms_team_agents` | **RLS Protected** 🌐 | Field Sales | Many-to-many junction table assigning agents to multiple teams |
| **36** | `sfms_teams` | **RLS Protected** 🌐 | Field Sales | Field sales teams, regional territories, and assigned team leaders |
| **37** | `software_licenses`| **RLS Protected** 🌐 | Asset Management | SaaS subscriptions, software tools, seat allocation, monthly costs |
| **38** | `users` | **UNRESTRICTED** | Authentication | Public user identities linked to Supabase Auth and business roles |

---

### 7.2 Detailed Schemas for Core HRMS & User Tables

#### Table 1: `users` (UNRESTRICTED)
* **Purpose:** Stores authenticated user identities and links Supabase Auth to business roles.
* **Columns:**
  * `id` (`UUID`, Primary Key, references `auth.users(id)`)
  * `email` (`TEXT`, Unique, Not Null)
  * `display_name` (`TEXT`)
  * `photo_url` (`TEXT`)
  * `role` (`TEXT`, Default `'employee'`: `'admin'`, `'hr'`, `'manager'`, `'employee'`, `'agent'`, `'intern'`)
  * `employee_id` (`TEXT`, Foreign Key reference to `employees.id` or `interns.id` or `sfms_agents.id`)
  * `employee_linked` (`BOOLEAN`, Default `false`)
  * `is_active` (`BOOLEAN`, Default `true`)
  * `last_login` (`TIMESTAMPTZ`)
  * `created_at` (`TIMESTAMPTZ`, Default `NOW()`)
  * `metadata` (`JSONB`)

#### Table 2: `employees` (UNRESTRICTED)
* **Purpose:** Core employee master repository.
* **Columns:**
  * `id` (`TEXT`, Primary Key, e.g., `'EMP-001'`)
  * `uid` (`UUID`, Foreign Key to `auth.users(id)`)
  * `email` (`TEXT`, Unique, Not Null)
  * `first_name` (`TEXT`), `last_name` (`TEXT`)
  * `role` (`TEXT`, Default `'employee'`)
  * `department_id` (`TEXT`, Foreign Key to `departments.id`)
  * `status` (`TEXT`, Default `'active'`: `'active'`, `'inactive'`, `'probation'`, `'terminated'`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)
  * `data` (`JSONB`: salary breakdown, bank info, emergency contact, date of joining, designation)

#### Table 3: `interns` (RLS Protected)
* **Purpose:** Specialized table for college interns, contracts, and legal document tracking.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `uid` (`UUID`, Foreign Key to `auth.users(id)`)
  * `full_name` (`TEXT`, Not Null), `first_name` (`TEXT`), `middle_name` (`TEXT`), `last_name` (`TEXT`)
  * `email` (`TEXT`, Unique, Not Null), `login_email` (`TEXT`), `phone` (`TEXT`)
  * `address` (`JSONB`: `{ line1, city, state, pincode }`)
  * `photo_url` (`TEXT`)
  * `department_id` (`TEXT`, Foreign Key to `departments.id`)
  * `position` (`TEXT`, e.g., `'Full Stack Intern'`)
  * `reporting_manager_id` (`TEXT`, Foreign Key to `employees.id`)
  * `start_date`, `end_date` (`DATE`)
  * `is_paid` (`BOOLEAN`, Default `false`), `stipend_amount` (`NUMERIC`)
  * `work_mode` (`TEXT`, Default `'Remote'`)
  * `working_days` (`TEXT`, Default `'Monday to Friday'`), `working_hours` (`TEXT`)
  * `max_leave_per_month` (`NUMERIC`, Default `5`)
  * `offer_date`, `acceptance_deadline`, `nda_date` (`DATE`)
  * `certificate_eligible` (`BOOLEAN`, Default `false`)
  * `skills_technologies` (`TEXT`)
  * `status` (`TEXT`, Default `'Active'`: `'Active'`, `'Completed'`, `'Terminated'`)
  * `offer_letter_pdf_url`, `nda_pdf_url`, `signed_offer_letter_url`, `signed_nda_url` (`TEXT`)
  * `document_status` (`TEXT`, Default `'pending_generation'`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 4: `intern_projects` (RLS Protected)
* **Purpose:** Allocates software projects and mentors to interns.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `intern_id` (`TEXT`, Reference to `interns.id`)
  * `intern_name` (`TEXT`, Not Null), `intern_role` (`TEXT`, Not Null)
  * `project_id` (`TEXT`), `project_name` (`TEXT`, Not Null)
  * `mentor_id` (`TEXT`), `mentor_name` (`TEXT`), `mentor_ids` (`TEXT[]`)
  * `start_date` (`DATE`, Not Null), `end_date` (`DATE`)
  * `status` (`TEXT`, Default `'In Progress'`: `'Assigned'`, `'In Progress'`, `'Completed'`, `'On Hold'`)
  * `whatsapp_number` (`TEXT`), `whatsapp_notes` (`TEXT`), `description` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 5: `internship_program` (RLS Protected)
* **Purpose:** Dedicated industrial student internship program repository with dynamic Offer Letter and Student NDA generator fields matching the DZ Infotech master templates.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `full_name` (`TEXT`, Not Null)
  * `guardian_name` (`TEXT`: Parent/Guardian for legal NDA parties clause)
  * `college_name` (`TEXT`, College / University name)
  * `degree_branch` (`TEXT`, Degree / Branch & Year)
  * `permanent_address` (`TEXT`, Residential address)
  * `email` (`TEXT`, Unique / Not Null)
  * `phone` (`TEXT`, Phone / WhatsApp)
  * `position_domain` (`TEXT`, Not Null: e.g. MERN Stack, React, Python/AI)
  * `department` (`TEXT`, Default `'Software Engineering'`)
  * `duration` (`TEXT`, Default `'3 Months (Fast-Track)'`: `'3 Months'`, `'6 Months'`)
  * `start_date`, `end_date` (`DATE`)
  * `work_mode` (`TEXT`, Default `'Remote / Work From Home'`)
  * `mentor_name` (`TEXT`, Reporting Mentor / Supervisor)
  * `working_days_hours` (`TEXT`, Default `'Monday to Friday, 10:00 AM - 6:00 PM'`)
  * `stipend` (`TEXT`, Default `'Performance-based / Unpaid Industrial Internship'`)
  * `offer_date`, `acceptance_deadline`, `nda_effective_date` (`DATE`)
  * `signatory_name`, `signatory_designation`, `signatory_place` (`TEXT`)
  * `status` (`TEXT`: `'Offer Issued'`, `'NDA Signed'`, `'Active'`, `'Completed'`, `'Terminated'`)
  * `notes` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 5: `departments` (UNRESTRICTED)
* **Purpose:** Corporate departments.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `name` (`TEXT`, Not Null), `description` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 6: `attendance` (UNRESTRICTED)
* **Purpose:** Daily attendance records, biometric-style camera capture, and break logs.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `employee_id` (`TEXT`, Foreign Key to `employees.id` or `interns.id`)
  * `date` (`DATE`, e.g., `'2026-11-16'`)
  * `check_in` (`TIMESTAMPTZ`), `check_out` (`TIMESTAMPTZ`)
  * `status` (`TEXT`: `'present'`, `'absent'`, `'half_day'`, `'late'`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)
  * `data` (`JSONB`: `{ selfieUrl, breaks: [{ in, out }], workNotes, totalWorkSeconds, overtimeHours }`)

#### Table 7: `leave_types` (UNRESTRICTED)
* **Purpose:** Leave policy categories.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `name` (`TEXT`, Not Null: `'Paid Leave'`, `'Sick Leave'`, `'Casual Leave'`)
  * `days` (`INT`, Annual quota)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 8: `leave_requests` (UNRESTRICTED)
* **Purpose:** Employee leave applications and approval logs.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `employee_id` (`TEXT`, Foreign Key to `employees.id`)
  * `type_id` (`TEXT`, Foreign Key to `leave_types.id`)
  * `start_date`, `end_date` (`DATE`)
  * `status` (`TEXT`, Default `'pending'`: `'pending'`, `'approved'`, `'rejected'`, `'cancelled'`)
  * `reason` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`: approvedBy, rejectionReason, emergencyContact)

#### Table 9: `leave_balance` (UNRESTRICTED)
* **Purpose:** Real-time accrued and remaining leave balances per employee.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `employee_id` (`TEXT`, Foreign Key to `employees.id`)
  * `balances` (`JSONB`: `{ paidLeave: 12, sickLeave: 7, casualLeave: 5, unpaidLeave: 0 }`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### Table 10: `holidays` (UNRESTRICTED)
* **Purpose:** Official company statutory and festive holidays calendar.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `name` (`TEXT`, Not Null: e.g., `'Diwali'`, `'Independence Day'`)
  * `date` (`DATE`, Not Null)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 11: `payroll` (UNRESTRICTED)
* **Purpose:** Monthly processed salary register and disbursement slips.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `employee_id` (`TEXT`, Foreign Key to `employees.id`)
  * `month` (`TEXT`, e.g., `'11'`), `year` (`INT`, e.g., `2026`)
  * `basic_salary` (`NUMERIC`), `net_salary` (`NUMERIC`)
  * `status` (`TEXT`: `'draft'`, `'pending'`, `'approved'`, `'paid'`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)
  * `data` (`JSONB`: `{ hra, allowances, pf, tds, lopDeduction, paymentDate, transactionRef }`)

#### Table 12: `software_licenses` (RLS Protected)
* **Purpose:** Company software asset repository.
* **Columns:**
  * `id` (`TEXT`, Primary Key)
  * `name` (`TEXT`, Not Null), `provider` (`TEXT`)
  * `cost_per_month` (`NUMERIC`), `assigned_to` (`TEXT`, Reference to `employees.id`)
  * `status` (`TEXT`, Default `'active'`), `notes` (`TEXT`), `created_at` (`TIMESTAMPTZ`)

#### Table 13: `announcements` (RLS Protected)
* **Purpose:** Organizational broadcast messages.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `title` (`TEXT`), `content` (`TEXT`)
  * `priority` (`TEXT`: `'info'`, `'warning'`, `'urgent'`)
  * `target_roles` (`TEXT[]`), `status` (`TEXT`, Default `'active'`), `created_at` (`TIMESTAMPTZ`)

#### Table 14: `activities` (UNRESTRICTED)
* **Purpose:** System-wide operational activity log.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `employee_id` (`TEXT`), `type` (`TEXT`), `description` (`TEXT`)
  * `created_at` (`TIMESTAMPTZ`, Default `NOW()`), `data` (`JSONB`)

#### Table 15: `audit_logs` (UNRESTRICTED)
* **Purpose:** Dedicated security audit trail capturing authentication events, data modifications, and privilege elevations.
* **Columns:**
  * `id` (`UUID` or `TEXT`, Primary Key)
  * `user_id` (`TEXT` or `UUID`), `action` (`TEXT`), `table_name` (`TEXT`), `record_id` (`TEXT`)
  * `old_data` (`JSONB`), `new_data` (`JSONB`), `ip_address` (`TEXT`), `timestamp` (`TIMESTAMPTZ`, Default `NOW()`)

#### Table 16: `documents` (UNRESTRICTED)
* **Purpose:** Corporate and employee document attachments repository.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `employee_id` (`TEXT`), `title` (`TEXT`), `file_url` (`TEXT`), `type` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`: `{ docType, fileName, fileSize }`)

#### Table 17: `notifications` (RLS Protected)
* **Purpose:** User notification inbox.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `user_id` (`TEXT`), `type` (`TEXT`), `title` (`TEXT`), `message` (`TEXT`)
  * `is_read` (`BOOLEAN`, Default `false`), `created_at`, `updated_at` (`TIMESTAMPTZ`)

---

### 7.3 Detailed Schemas for Revenue, ConTrack & CRM Tables

#### Table 18: `leads` (RLS Protected)
* **Purpose:** Primary CRM sales pipeline leads.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `leadId` (`TEXT`), `companyName` (`TEXT`), `contactPerson` (`TEXT`)
  * `phone` (`TEXT`), `whatsapp` (`TEXT`), `email` (`TEXT`), `address` (`TEXT`), `industry` (`TEXT`)
  * `serviceInterested` (`TEXT`), `expectedValue` (`NUMERIC`), `leadSource` (`TEXT`), `assignedTo` (`TEXT`)
  * `stage` (`TEXT`: `'New Lead'`, `'Contacted'`, `'Demo Preparation'`, `'Meeting Scheduled'`, `'Meeting Completed'`, `'Proposal Sent'`, `'Negotiation'`, `'Won'`, `'Lost'`)
  * `nextFollowUp` (`TEXT`), `probability` (`NUMERIC`), `interestLevel` (`TEXT`), `notes` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### Table 19: `contrack_leads` (RLS Protected)
* **Purpose:** Specialized CRM pipeline for ConTrack construction management software prospects.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `company_name` (`TEXT`, Not Null), `contact_person` (`TEXT`), `phone` (`TEXT`), `email` (`TEXT`)
  * `city` (`TEXT`), `contractor_type` (`TEXT`), `active_sites` (`INT`), `expected_mrr` (`NUMERIC`)
  * `stage` (`TEXT`), `source` (`TEXT`), `notes` (`TEXT`), `assigned_to` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### Table 20: `contrack_revenue` (RLS Protected)
* **Purpose:** Monthly Recurring Revenue (MRR) and subscription billing records for ConTrack.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `client_id` (`UUID`), `plan_name` (`TEXT`), `billing_cycle` (`TEXT`: `'Monthly'`, `'Annual'`)
  * `subscription_amount` (`NUMERIC`), `mrr_value` (`NUMERIC`), `start_date` (`DATE`), `renewal_date` (`DATE`)
  * `payment_status` (`TEXT`: `'Paid'`, `'Pending'`, `'Overdue'`), `created_at` (`TIMESTAMPTZ`)

#### Table 21: `clients` (RLS Protected)
* **Purpose:** Won corporate clients directory.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `clientId` (`TEXT`), `companyName` (`TEXT`), `ownerId` (`TEXT`)
  * `phone` (`TEXT`), `email` (`TEXT`), `gstNumber` (`TEXT`), `address` (`TEXT`), `industry` (`TEXT`)
  * `status` (`TEXT`), `projectsCount` (`INT`), `lifetimeValue` (`NUMERIC`), `since` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### Table 22: `projects` (RLS Protected)
* **Purpose:** Contracted software engineering projects.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `name` (`TEXT`), `client_id` (`UUID`, References `clients.id`)
  * `totalValue` (`NUMERIC`), `advanceReceived` (`NUMERIC`), `status` (`TEXT`)
  * `startDate` (`DATE`), `endDate` (`DATE`), `bucketSettings` (`JSONB`), `created_at` (`TIMESTAMPTZ`)

#### Table 23: `expenses` (RLS Protected)
* **Purpose:** Corporate operational expenditures (OpEx).
* **Columns:**
  * `id` (`TEXT`, Primary Key), `date` (`DATE`), `category` (`TEXT`), `description` (`TEXT`)
  * `amount` (`NUMERIC`), `receipt_url` (`TEXT`), `created_at` (`TIMESTAMPTZ`)

#### Table 24: `amcs` (RLS Protected)
* **Purpose:** Annual Maintenance Contracts for deployed software.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `client_name` (`TEXT`), `project_name` (`TEXT`)
  * `start_date` (`DATE`), `end_date` (`DATE`), `amount` (`NUMERIC`), `status` (`TEXT`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

#### Table 25: `invoices` (UNRESTRICTED)
* **Purpose:** GST tax invoices generated for client projects.
* **Columns:**
  * `id` (`TEXT`, Primary Key), `invoiceNo` (`TEXT`, Unique: e.g., `'INV-2026-001'`)
  * `date` (`DATE`), `dueDate` (`DATE`), `clientName` (`TEXT`), `clientCompany` (`TEXT`)
  * `clientAddress` (`TEXT`), `clientGst` (`TEXT`), `items` (`JSONB`: `[{ description, quantity, rate, amount }]`)
  * `subTotal` (`NUMERIC`), `discount` (`NUMERIC`), `taxRate` (`NUMERIC`), `totalAmount` (`NUMERIC`)
  * `status` (`TEXT`: `'Paid'`, `'Pending'`, `'Cancelled'`), `created_at` (`TIMESTAMPTZ`)

#### Table 26: `quotations` (UNRESTRICTED)
* **Purpose:** Commercial proposals and ERP cost estimates generated for clients.
* **Columns:**
  * `id` (`TEXT` or `UUID`, Primary Key), `quotationNumber` (`TEXT`, Unique: e.g., `'QT-20261116-01'`)
  * `clientName` (`TEXT`), `contactPerson` (`TEXT`), `clientPhone` (`TEXT`), `gstin` (`TEXT`), `registeredAddress` (`TEXT`)
  * `quotationDate` (`DATE`), `validityDate` (`DATE`), `businessObjective` (`TEXT`), `proposedSolution` (`TEXT`)
  * `manufacturingCost` (`NUMERIC`), `inventoryCost` (`NUMERIC`), `salesCost` (`NUMERIC`), `hrCost` (`NUMERIC`)
  * `reportsCost` (`NUMERIC`), `deploymentCost` (`NUMERIC`), `specialProjectPrice` (`NUMERIC`), `amcCost` (`NUMERIC`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`), `data` (`JSONB`)

#### Table 27: `settings` (UNRESTRICTED)
* **Purpose:** Global configuration parameters (e.g., bucket allocations).
* **Columns:**
  * `id` (`TEXT`, Primary Key), `key` (`TEXT`, Unique), `value` (`JSONB`), `updated_at` (`TIMESTAMPTZ`)

---

### 7.4 Detailed Schemas for SFMS (Sales & Field Management System) Tables

#### Table 28: `sfms_teams` (RLS Protected)
* **Purpose:** Field sales teams organizing regional territory reps.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `name` (`TEXT`, Not Null), `leader_id` (`UUID`), `status` (`TEXT`, Default `'active'`), `created_at` (`TIMESTAMPTZ`)

#### Table 29: `sfms_agents` (RLS Protected)
* **Purpose:** Master directory of on-field sales representatives.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `name` (`TEXT`, Not Null), `phone` (`TEXT`), `email` (`TEXT`), `city` (`TEXT`), `joining_date` (`DATE`)
  * `team_id` (`UUID`), `status` (`TEXT`, Default `'active'`), `created_at` (`TIMESTAMPTZ`)

#### Table 30: `sfms_team_agents` (RLS Protected)
* **Purpose:** Many-to-many junction table assigning agents to multiple teams/territories.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `team_id` (`UUID`, References `sfms_teams(id)` ON DELETE CASCADE)
  * `agent_id` (`UUID`, References `sfms_agents(id)` ON DELETE CASCADE)
  * `assigned_at` (`TIMESTAMPTZ`, Default `NOW()`), `UNIQUE(team_id, agent_id)`

#### Table 31: `sfms_leads` (RLS Protected)
* **Purpose:** Field sales leads tracked across physical territory sales stages.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `company_name` (`TEXT`, Not Null), `contact_person` (`TEXT`), `phone` (`TEXT`), `email` (`TEXT`), `address` (`TEXT`), `industry` (`TEXT`)
  * `lead_source` (`TEXT`), `expected_revenue` (`NUMERIC`, Default 0), `notes` (`TEXT`)
  * `team_id` (`UUID`, References `sfms_teams(id)`), `agent_id` (`UUID`, References `sfms_agents(id)`)
  * `stage` (`TEXT`, Default `'Assigned'`: `'Assigned'`, `'Contacted'`, `'Meeting Scheduled'`, `'Meeting Completed'`, `'Proposal Sent'`, `'Negotiation'`, `'Won'`, `'Lost'`)
  * `interest_level` (`TEXT`, Default `'Interested'`: `'Very Interested'`, `'Interested'`, `'Not Interested'`)
  * `services_interested` (`TEXT[]`), `lost_reason` (`TEXT`), `closed_by` (`TEXT`: `'Team'`, `'Founder'`), `advance_paid` (`BOOLEAN`, Default `false`)
  * `created_at` (`TIMESTAMPTZ`)

#### Table 32: `sfms_meetings` (RLS Protected)
* **Purpose:** Physical on-site client meeting logs with selfie photo evidence.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `lead_id` (`UUID`, References `sfms_leads(id)`), `team_id` (`UUID`, References `sfms_teams(id)`)
  * `meeting_date` (`DATE`), `meeting_time` (`TIME`), `person_met` (`TEXT`), `designation` (`TEXT`), `phone` (`TEXT`), `email` (`TEXT`)
  * `discussion_summary` (`TEXT`), `services_discussed` (`TEXT[]`), `quotation_amount` (`NUMERIC`, Default 0), `negotiated_amount` (`NUMERIC`, Default 0)
  * `follow_up_date` (`DATE`), `outcome` (`TEXT`: `'Very Interested'`, `'Interested'`, `'Not Interested'`)
  * `selfie_url` (`TEXT`), `photos` (`TEXT[]`), `notes` (`TEXT`), `created_at` (`TIMESTAMPTZ`)

#### Table 33: `sfms_targets` (RLS Protected)
* **Purpose:** Sales quotas and milestone bonus targets for teams and agents.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `team_id` (`UUID`, References `sfms_teams(id)`), `type` (`TEXT`: `'Revenue'`, `'Client'`, `'Meeting'`)
  * `target_value` (`NUMERIC`, Not Null), `duration_days` (`INT`, Not Null), `start_date` (`DATE`), `deadline` (`DATE`), `bonus_amount` (`NUMERIC`, Default 0)
  * `created_at` (`TIMESTAMPTZ`)

#### Table 34: `sfms_commissions` (RLS Protected)
* **Purpose:** Performance commission tracking and payouts for field agents.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `lead_id` (`UUID`, References `sfms_leads(id)`), `agent_id` (`UUID`, References `sfms_agents(id)`)
  * `type` (`TEXT`: `'Advance'`, `'Final'`), `amount` (`NUMERIC`, Default 0)
  * `status` (`TEXT`, Default `'Generated'`: `'Generated'`, `'Pending Approval'`, `'Approved'`, `'Payable'`, `'Paid'`)
  * `created_at` (`TIMESTAMPTZ`)

#### Table 35: `sfms_finance` (RLS Protected)
* **Purpose:** Field financial reconciliation between collected advances and agent commission payouts.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `lead_id` (`UUID`, References `sfms_leads(id)`), `project_value` (`NUMERIC`, Default 0), `advance_received` (`NUMERIC`, Default 0)
  * `remaining_amount` (`NUMERIC`, Default 0), `collected_amount` (`NUMERIC`, Default 0), `commission_liability` (`NUMERIC`, Default 0), `commission_paid` (`NUMERIC`, Default 0)
  * `created_at` (`TIMESTAMPTZ`)

#### Table 36: `sfms_daily_reports` (RLS Protected)
* **Purpose:** End-of-Day (EOD) structured report submitted by field agents.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `team_id` (`UUID`, References `sfms_teams(id)`), `report_date` (`DATE`, Default `CURRENT_DATE`)
  * `meetings_completed` (`INT`, Default 0), `interested_leads` (`INT`, Default 0), `very_interested_leads` (`INT`, Default 0)
  * `follow_ups_scheduled` (`INT`, Default 0), `expected_revenue` (`NUMERIC`, Default 0), `challenges_faced` (`TEXT`), `tomorrows_plan` (`TEXT`)
  * `created_at` (`TIMESTAMPTZ`)

#### Table 37: `sfms_lead_timeline` (RLS Protected)
* **Purpose:** Complete audit trail tracking lead progression across field sales stages.
* **Columns:**
  * `id` (`UUID`, Primary Key, Default `gen_random_uuid()`)
  * `lead_id` (`UUID`, References `sfms_leads(id)`), `stage` (`TEXT`, Not Null), `changed_at` (`TIMESTAMPTZ`, Default `NOW()`), `changed_by` (`TEXT`)

---

## 8. KEY ALGORITHMS & MATHEMATICAL FORMULATIONS

### 8.1 Automated Payroll & LOP Calculation Formula
```javascript
// Step 1: Calculate total calendar days in month
const daysInMonth = new Date(year, month, 0).getDate();

// Step 2: Calculate daily rate
const dailyRate = basicSalary / daysInMonth;

// Step 3: Count approved unpaid leaves (Loss of Pay)
const unpaidDays = leaveRequests
  .filter(req => req.status === 'approved' && req.type === 'unpaid' && isInMonth(req, month, year))
  .reduce((sum, req) => sum + req.durationDays, 0);

// Step 4: Compute Loss of Pay deduction
const lopDeduction = unpaidDays * dailyRate;

// Step 5: Calculate Gross Earnings and Deductions
const grossEarnings = basicSalary + hra + allowances;
const totalDeductions = pfAmount + taxDeduction + lopDeduction;

// Step 6: Net Payable Salary
const netSalary = Math.round(grossEarnings - totalDeductions);
```

### 8.2 Working Hours & Real-Time Break Analysis
* When an employee checks in at $T_{\text{in}}$ and checks out at $T_{\text{out}}$, total elapsed time is:
  $$\Delta T = T_{\text{out}} - T_{\text{in}}$$
* Given $k$ discrete breaks taken during the shift with start $B_{i,\text{start}}$ and end $B_{i,\text{end}}$:
  $$T_{\text{breaks}} = \sum_{i=1}^k (B_{i,\text{end}} - B_{i,\text{start}})$$
* Actual Productive Work Time:
  $$T_{\text{work}} = \Delta T - T_{\text{breaks}}$$
* Overtime:
  $$\text{Overtime} = \max(0, T_{\text{work}} - 8\text{ hours})$$

### 8.3 GST Tax Invoice Computation
$$\text{Line Item Amount}_j = \text{Quantity}_j \times \text{Rate}_j$$
$$\text{SubTotal} = \sum_{j=1}^m \text{Line Item Amount}_j$$
$$\text{Taxable Base} = \text{SubTotal} - \text{Discount}$$
* For Intra-State Supply (Gujarat to Gujarat):
  $$\text{CGST} = \text{Taxable Base} \times 9\%$$
  $$\text{SGST} = \text{Taxable Base} \times 9\%$$
* For Inter-State Supply:
  $$\text{IGST} = \text{Taxable Base} \times 18\%$$
$$\text{Total Invoice Payable} = \text{Taxable Base} + \text{Taxes}$$

---

## 9. SECURITY, PRIVACY & ROW-LEVEL SECURITY (RLS)

### 9.1 Hybrid Security Architecture (UNRESTRICTED vs RLS Protected)
The database operates on an intentional, enterprise-tested hybrid security paradigm visible directly in the Supabase Table Editor:
1. **RLS Protected Tables (🌐 Globe Icon):**
   * Tables: `amcs`, `announcements`, `clients`, `contrack_leads`, `contrack_revenue`, `expenses`, `intern_projects`, `interns`, `leads`, `notifications`, `projects`, `sfms_agents`, `sfms_commissions`, `sfms_daily_reports`, `sfms_finance`, `sfms_lead_timeline`, `sfms_leads`, `sfms_meetings`, `sfms_targets`, `sfms_team_agents`, `sfms_teams`, `software_licenses`.
   * **Why RLS is Enabled:** These tables store sensitive commercial CRM data, agent commissions, client contacts, and intern information where horizontal isolation (e.g., an agent only accessing assigned leads or an intern only accessing their own profile) is strictly enforced at the database layer using PostgreSQL policies (`auth.uid() = uid` or agent filtering).
2. **UNRESTRICTED Tables:**
   * Tables: `activities`, `attendance`, `audit_logs`, `departments`, `documents`, `employees`, `holidays`, `invoices`, `leave_balance`, `leave_requests`, `leave_types`, `payroll`, `quotations`, `settings`, `users`.
   * **Why Unrestricted:** These core administrative master tables require high-throughput multi-user reads, automated batch processing (e.g., automated monthly payroll runs, global attendance exports, company holiday lookups, and quotation generators). In DZ Infotech OS, write operations to these tables are strictly guarded at the application layer through the client-side `ProtectedRoute` and authenticated backend services (`isAdminLike`), avoiding redundant RLS performance bottlenecks while maintaining complete operational velocity.

### 9.2 Client-Side Route Guards (`ProtectedRoute.jsx`)
* Inspects user session state and current role.
* If an unauthenticated user navigates to `/dashboard`, they are redirected to `/login`.
* If an unauthorized role attempts to access restricted paths (e.g., an intern navigating to `/payroll` or `/revenue-dashboard`), they are bounced to `/access-denied`.

### 9.3 Encrypted Storage Buckets
* Storage bucket `intern_documents` enforces folder-level isolation: Interns can only read and write files within the subfolder matching their unique identifier.

---

## 10. SYSTEM SETUP, INSTALLATION & DEPLOYMENT

### 10.1 Environment Variables Configuration (`.env`)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 10.2 Installation Steps
```bash
# 1. Clone project repository
git clone https://github.com/your-username/dz-infotech-hrms.git
cd dz-infotech-hrms

# 2. Install project dependencies
npm install

# 3. Execute database migration scripts in Supabase SQL Editor:
# - supabase_schema.sql (Core HRMS tables)
# - setup_leads_clients.sql (CRM tables)
# - sfms_schema.sql (Field Sales tables)
# - migration_interns.sql (Intern module)
# - create_intern_projects_table.sql (Intern project tracking)

# 4. Start local Vite development server
npm run dev

# 5. Build for production deployment
npm run build
```

---

## 11. COLLEGE VIVA VOCE / PROJECT DEFENSE Q&A GUIDE

### Q1: Why did you choose React + Vite instead of Next.js or standard CRA?
**Answer:** The project is an internal enterprise operating system and ERP dashboard requiring authenticated, high-performance client-side rendering with no need for public search engine optimization (SEO). Vite delivers instantaneous Hot Module Replacement (HMR) and optimized build times compared to deprecated Create React App (CRA). A pure React SPA architecture provides seamless client-side state persistence without the overhead of server-side Node.js rendering.

### Q2: Why Supabase instead of traditional MySQL/PHP or pure Firebase?
**Answer:** While Firebase was initially evaluated, enterprise operations require strict relational integrity (Foreign Keys, Cascading Deletes, ACID transactions) across employees, departments, invoices, and sales leads. Supabase provides PostgreSQL—the world's most advanced open-source relational database—coupled with built-in OAuth authentication, storage buckets, and native Row-Level Security (RLS) directly in SQL.

### Q3: Why are some tables in Supabase marked UNRESTRICTED while others have RLS enabled?
**Answer:** The system uses a hybrid security model. Highly confidential, user-isolated tables (such as `leads`, `contrack_leads`, `sfms_agents`, `sfms_meetings`, `interns`) have Row-Level Security (RLS) enabled in PostgreSQL to ensure agents and interns can never view unauthorized records. Core administrative tables (such as `attendance`, `payroll`, `employees`, `holidays`, `audit_logs`) are marked UNRESTRICTED at the database level to permit high-speed batch payroll generation and multi-table aggregates, while access control is strictly enforced by application-level route guards (`ProtectedRoute`) and role checks (`isAdminLike`).

### Q4: How does the system prevent fake attendance check-ins?
**Answer:** The attendance module integrates the browser's HTML5 MediaDevices API in `CameraCapture.jsx`. When an employee or field agent punches in, the system accesses their webcam or mobile camera to capture a timestamped live photo. This image is uploaded directly to secure storage and linked to the attendance record, enabling HR to audit physical presence.

### Q5: What is the purpose of ConTrack tables (`contrack_leads` & `contrack_revenue`)?
**Answer:** DZ Infotech offers a specialized construction project management software solution under the brand name "ConTrack". To prevent mixing specialized SaaS recurring subscriptions with bespoke software service projects, dedicated tables (`contrack_leads` and `contrack_revenue`) were engineered to track ConTrack-specific builder leads and calculate Monthly Recurring Revenue (MRR) independently.

### Q6: How is Role-Based Access Control (RBAC) enforced?
**Answer:** RBAC is enforced in two complementary layers:
1. *Client-side:* `ProtectedRoute.jsx` intercepts route transitions and checks `PERMISSIONS[module].includes(user.role)`. Unauthorized users are immediately redirected to `/access-denied`.
2. *Database-side:* PostgreSQL Row-Level Security (RLS) policies evaluate `auth.uid()` and user roles directly on the database engine, ensuring API requests cannot tamper with unauthorized rows.

### Q7: How does the Automated Payroll Engine handle Loss of Pay (LOP)?
**Answer:** The payroll engine queries the `leave_requests` table for approved leaves categorized as unpaid during the target billing month. It calculates the employee's per-day wage by dividing basic salary by total calendar days, multiplies by unpaid leave days, and automatically subtracts this LOP deduction from gross earnings before calculating the final net salary.

---

## 12. CONCLUSION & FUTURE ENHANCEMENTS

### 12.1 Conclusion
The **DZ Infotech Operating System** successfully consolidates Human Resources, Customer Relationship Management, ConTrack Subscription Operations, Field Sales Automation, and Corporate Billing into a unified, responsive platform. By digitizing employee workflows, eliminating manual payroll spreadsheets, enforcing biometric-grade webcam attendance verification, and providing dedicated portals for field sales teams, the platform significantly reduces administrative overhead and accelerates business operations.

### 12.2 Future Enhancements
* Mobile Native Apps (React Native) for field sales offline caching and background GPS breadcrumbs.
* AI-driven resume parsing for automated intern and employee onboarding.
* Automated WhatsApp API webhooks for instant invoice delivery and payment reminders.
* Biometric hardware integration (ZKTeco/fingerprint scanner) alongside web camera verification.

---
**Report Compiled & Prepared For Academic Submission**  
*DZ Infotech Human Resource & Operations Management System (DZ HRMS)*
