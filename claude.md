````markdown
# System Instructions: Telecom KPI Payroll & Workforce Automation Platform

## Project Overview

Build a highly advanced enterprise-grade telecommunications KPI, payroll, commission, workforce analytics, and automation platform.

The system must support fully dynamic telecom projects where every project can define:

- Different KPI structures
- Different salary formulas
- Different commission systems
- Different payroll rules
- Different performance calculations
- Different Excel structures
- Different warning thresholds
- Different approval workflows

The application must automate telecom workforce operations from KPI imports to final payroll generation and workflow automation.

The platform should support:

- KPI tracking
- Dynamic formula calculations
- Payroll generation
- Commission management
- Excel processing
- Workforce analytics
- Attendance integration
- Agent performance monitoring
- Warning systems
- HR approvals
- n8n workflow automation

The architecture must be scalable, modular, and optimized for large telecom operations with thousands of agents.

---

# Navigation Structure

## Sidebar Navigation

- Dashboard
- Projects
- KPI Management
- Payroll
- Commissions
- Employees
- Attendance
- Excel Imports
- Reports
- Analytics
- Workflows
- Notifications
- Audit Logs
- Settings

---

## Header Elements

- Global Search
- Notifications Center
- Payroll Alerts
- Warning Alerts
- Workflow Status
- User Profile
- Role Permissions
- Dark/Light Mode Toggle

---

# Dashboard Page

## Executive KPI Overview Cards

### Card 1: Total Workforce
- Total number of telecom agents
- Active vs inactive agents
- Department distribution

### Card 2: Payroll Summary
- Total payroll amount
- Salary distribution
- Monthly payroll trend

### Card 3: KPI Performance
- Average KPI achievement
- Top-performing project
- Lowest-performing project

### Card 4: Commission Summary
- Total commissions paid
- Bonus payouts
- Incentive trends

### Card 5: Warnings & Penalties
- Underperforming agents
- Salary deductions
- Active warning count

### Card 6: Attendance Overview
- Attendance percentage
- Absence tracking
- Late arrival statistics

---

## KPI Performance Analytics

### KPI Trend Chart
- Line chart showing KPI achievement over time
- Filter by:
  - Daily
  - Weekly
  - Monthly
  - Quarterly
- Compare multiple telecom projects

### KPI Weight Distribution
- Pie or donut chart
- Display KPI contribution percentages
- Dynamic based on project configuration

### Team Performance Ranking
- Leaderboard for:
  - Best agents
  - Best teams
  - Best projects
- Rank by KPI score, sales, or attendance

---

## Payroll Analytics

### Payroll Breakdown Chart
- Base salary
- KPI earnings
- Commission
- Bonuses
- Deductions
- Final payout

### Salary Trend Analysis
- Monthly payroll growth
- Historical payroll comparisons
- Department comparisons

---

## Commission Analytics

### Commission Performance
- Bonus achievements
- Incentive payouts
- Extra sales rewards
- Commission forecasting

### Commission Leaderboard
- Top commission earners
- Sales rankings
- Incentive milestones

---

# Projects Management Page

## Telecom Projects List

Each telecom project should include:

- Project name
- Client/company
- KPI structure
- Salary formula
- Commission system
- Active agents
- Status
- Created date

---

## Project Creation

### Configure Project Information

Fields:
- Project Name
- Telecom Client
- Department
- Currency
- Payroll Cycle
- KPI Calculation Method
- Attendance Rules
- Warning Thresholds

---

## KPI Configuration System

Managers must be able to dynamically configure:

- KPI names
- KPI weights
- KPI targets
- KPI formulas
- KPI score logic
- Salary contribution percentages
- Commission triggers
- Bonus thresholds
- Penalty rules

Example KPIs:
- Calls
- Sales
- Conversion Rate
- Attendance
- Quality Score
- Customer Satisfaction
- Resolution Rate
- AHT
- Adherence

---

# Formula Engine

## Dynamic Formula Support

The system must support dynamic telecom KPI formulas.

Supported operators:
- +
- -
- *
- /
- %
- Parentheses
- Nested calculations
- Conditional logic

---

## Weighted KPI Formula Example

```txt
(
((Calls / CallsTarget) * 30)
+
((Sales / SalesTarget) * 40)
+
((Quality / QualityTarget) * 20)
+
((Attendance / AttendanceTarget) * 10)
)
```

Final KPI result must equal a percentage score out of 100%.

---

## Salary Formula Example

```txt
Final Salary =
(Base Salary * KPI Achievement Percentage)
+ Commission
+ Bonus
- Penalties
```

---

## Commission Formula Examples

### Example 1
- Every extra 10 sales = $50 bonus

### Example 2
- Every extra 20 successful calls = commission multiplier

### Example 3
- Conversion rate above 90% = performance bonus

---

# Employees Page

## Employee Directory

Display:
- Agent name
- Employee ID
- Project assignment
- Team leader
- KPI score
- Salary status
- Attendance score
- Warning status

---

## Employee Profile

### Agent Information
- Personal information
- Role
- Department
- Payroll details
- KPI history
- Commission history
- Attendance records

### Performance Tracking
- KPI trends
- Salary evolution
- Monthly comparisons
- Warning history

---

# Attendance Management

## Attendance Tracking

Support:
- Daily attendance
- Shift schedules
- Late check-ins
- Overtime
- Absences
- Leave requests

---

## Attendance Rules

Managers can configure:
- Penalty deductions
- Attendance weights
- Overtime bonuses
- Absence thresholds

---

# Payroll Page

## Payroll Processing

Automatically calculate:
- Base salary
- KPI earnings
- Commission
- Bonus
- Overtime
- Penalties
- Deductions
- Final payout

---

## Payroll Table

Columns:
- Employee Name
- Project
- KPI Score
- Base Salary
- Commission
- Bonus
- Deductions
- Final Salary
- Payroll Status

---

## Payroll Actions

- Approve payroll
- Reject payroll
- Recalculate payroll
- Export payroll
- Generate payslips

---

# Excel Processing System

## Excel Import Features

Support importing:
- KPI reports
- Attendance sheets
- Payroll sheets
- Sales reports
- Agent performance reports

---

## Excel Processing Logic

The system must:
- Parse uploaded Excel files
- Detect project structure
- Validate columns
- Calculate KPI values
- Append payroll calculations
- Export updated sheets

---

## Excel Export Columns

| Employee | KPI Score | Salary | Commission | Bonus | Final Payout |
|----------|------------|---------|-------------|--------|---------------|

---

# Reports Page

## Payroll Reports
- Monthly payroll summary
- Department payroll reports
- Payroll comparisons
- Payroll export

---

## KPI Reports
- KPI trends
- Team performance
- Project comparisons
- Underperformance analysis

---

## Commission Reports
- Incentive payouts
- Bonus tracking
- Commission comparisons

---

# Workflow Automation

## n8n Integration

The platform must integrate with n8n workflows.

---

## Automated Workflows

### Warning Workflows
Trigger when:
- KPI falls below threshold
- Attendance is poor
- Salary reduction occurs
- Repeated underperformance detected

### Commission Workflows
Trigger when:
- Bonus target achieved
- High sales performance detected
- KPI milestones reached

### Payroll Workflows
Trigger:
- Payroll approvals
- Payslip generation
- Payroll exports
- Finance notifications

---

# Notifications System

## Notification Types

- KPI alerts
- Salary reduction alerts
- Payroll completion alerts
- Commission achievement alerts
- Attendance warnings
- HR approval requests

---

# Roles & Permissions

## User Roles

### Admin
- Full system access

### HR
- Payroll management
- Employee management
- Reports access

### Finance
- Payroll approvals
- Salary exports
- Commission reviews

### Supervisor
- KPI monitoring
- Team performance
- Attendance management

### Agent
- View KPI scores
- View payroll
- View commissions

---

# Audit Logs

Track:
- KPI changes
- Formula modifications
- Payroll calculations
- Salary edits
- Excel imports
- Workflow executions
- Commission payouts
- Warning emails

---

# Data Model

## User

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "admin | hr | finance | supervisor | agent",
  "department": "string",
  "projectId": "string",
  "createdAt": "timestamp"
}
```

---

## KPI Configuration

```json
{
  "id": "string",
  "projectId": "string",
  "name": "string",
  "weight": "number",
  "target": "number",
  "formula": "string",
  "warningThreshold": "number"
}
```

---

## Payroll Record

```json
{
  "id": "string",
  "employeeId": "string",
  "baseSalary": "number",
  "kpiScore": "number",
  "commission": "number",
  "bonus": "number",
  "deductions": "number",
  "finalSalary": "number",
  "createdAt": "timestamp"
}
```

---

## Commission Rule

```json
{
  "id": "string",
  "projectId": "string",
  "ruleName": "string",
  "formula": "string",
  "bonusAmount": "number"
}
```

---

# Technical Requirements

## Frontend
- Next.js
- React.js
- Tailwind CSS
- TypeScript
- Recharts
- TanStack Table

---

## Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

---

## Formula Engine
- math.js
- expr-eval
- Dynamic parser engine

---

## Excel Processing
- XLSX library
- CSV Parser
- ExcelJS

---

## Workflow Automation
- n8n
- SMTP
- Gmail API
- Outlook API

---

## Authentication
- JWT
- OAuth2
- RBAC Permission System

---

## Deployment
- Docker
- AWS
- Vercel

---

# Core Functionalities

## KPI Management
- Dynamic KPI systems
- Weighted KPI calculations
- Formula-based scoring
- KPI analytics

---

## Payroll Automation
- Salary calculations
- Commission calculations
- Bonus calculations
- Payroll exports

---

## Excel Automation
- KPI imports
- Payroll exports
- Batch processing
- Dynamic column mapping

---

## Workforce Analytics
- Agent rankings
- KPI forecasting
- Salary trends
- Performance insights

---

## Workflow Automation
- Email notifications
- Approval workflows
- Payroll automation
- KPI alerts

---

# Features for MVP

- Dynamic KPI system
- Formula engine
- Payroll calculations
- Excel import/export
- Commission calculations
- KPI dashboards
- Employee management
- Attendance tracking
- n8n workflow integration
- Role-based authentication

---

# Features to Exclude from MVP

- AI prediction engine
- Real-time telecom integrations
- Biometric attendance
- Mobile application
- Multi-language support
- Multi-country tax engine
- Voice analytics
- AI coaching assistant

---

# SOP (Standard Operating Procedure)

## KPI Payroll Workflow

1. HR creates telecom project.

2. Manager configures KPI structure.

3. KPI formulas and weights are assigned.

4. Commission rules are configured.

5. Agents are assigned to projects.

6. KPI Excel sheets are uploaded.

7. System parses KPI data.

8. Formula engine calculates:
   - KPI scores
   - Weighted achievements
   - Salary earnings
   - Commission earnings

9. Payroll records are generated.

10. Attendance penalties are applied.

11. Final payroll values are calculated.

12. n8n workflows are triggered.

13. Warning notifications are sent.

14. Commission notifications are triggered.

15. Payroll reports are exported.

16. HR and Finance approve payroll.

---

# Final Notes

- Build enterprise-grade scalable architecture.
- Ensure dynamic KPI flexibility.
- Optimize payroll calculations for large datasets.
- Ensure payroll accuracy.
- Build reusable modular services.
- Design responsive dashboards.
- Add complete audit tracking.
- Prepare architecture for future AI integrations.
- Ensure secure payroll and employee data management.
- Support telecom operations at enterprise scale.
- Structure the system for future SaaS expansion.
````
