# Healthcare Referral Platform - Complete System Architecture

## 1. APPLICATION OVERVIEW
**Platform Name:** MediConnect (Healthcare Referral & Payment Management System)

### Core Entities
- **Agents:** Field representatives who refer patients to doctors
- **Doctors:** Healthcare providers who receive patients and manage cases
- **Patients:** Referred individuals (data shared anonymously with doctors)
- **Admin/Company:** Super-vision platform managing all aspects
- **Payment Manager:** Handles commissions and withdrawals

---

## 2. TECH STACK

### Frontend
- **Framework:** Flutter 3.x+
- **State Management:** Riverpod / BLoC Pattern
- **Local Storage:** Hive/SharedPreferences
- **API Communication:** Dio/HTTP
- **PDF Generation:** pdf package
- **Charts:** fl_chart for analytics
- **Authentication:** Firebase Auth + JWT

### Backend (Node.js/Express Recommended)
```
- Database: PostgreSQL / MongoDB
- Cache: Redis
- Payment Gateway: Razorpay/Stripe
- File Storage: AWS S3 / Firebase Storage
- Authentication: JWT + OAuth2
- Real-time: WebSockets / Socket.io
```

### DevOps
- Docker containerization
- CI/CD: GitHub Actions
- Hosting: AWS EC2 / Google Cloud
- API Documentation: Swagger/OpenAPI

---

## 3. DATABASE SCHEMA

### Users Table
```
users {
  id, email, phone, password_hash, role, 
  kyc_status, created_at, updated_at, is_active
}
```

### Agents Table
```
agents {
  id, user_id, agent_code, license_number, 
  commission_rate (20-25%), total_cases, 
  total_referrals, bank_account, kyc_verified, 
  campaign_enrolled, created_at
}
```

### Doctors Table
```
doctors {
  id, user_id, doctor_license, specialization, 
  clinic_details, commission_rate (%), 
  bank_account, kyc_verified, created_at
}
```

### Cases Table
```
cases {
  id, case_code, agent_id, doctor_id (anonymized), 
  patient_phone, patient_basic_info, case_status,
  bill_amount, case_type (normal/insurance), 
  created_at, settlement_date, is_settled
}
```

### Commissions Table
```
commissions {
  id, case_id, agent_id, doctor_id, 
  agent_amount, doctor_amount, status,
  withdrawal_eligible_date, created_at
}
```

### Withdrawals Table
```
withdrawals {
  id, user_id (agent/doctor), amount, 
  status (pending/approved/rejected), 
  penalty_percentage (0-3%), requested_at,
  approval_date, bank_transaction_id
}
```

### Campaigns Table
```
campaigns {
  id, name, start_date, end_date, 
  bonus_percentage, description, created_by
}
```

---

## 4. BUSINESS LOGIC

### Commission Calculation
```
Normal Case:
- Bill Amount: 10,000 INR
- Agent Commission: 20-25% (based on case count)
  - 0-10 cases: 20%
  - 11-25 cases: 22%
  - 25+ cases: 25%
- Doctor Commission: 5-10% (negotiable)

Insurance Case:
- Same agent percentage
- Doctor: 5% (fixed for insurance)
```

### Withdrawal Eligibility
```
Normal Cases:
- Eligible after: 3 business days
- Can withdraw: 100% of commission

Insurance Cases (Unsettled):
- Eligible after: 7 days (if not settled)
- Can withdraw: Commission - 2-3% penalty
- Penalty goes to: Company reserve/operational costs
```

### Case Status Flow
```
Patient Referred → Doctor Assigned → 
Case Active → Bill Generated → 
Commission Calculated → Withdrawal Eligible → 
Settlement Complete
```

---

## 5. AGENT VIEW FEATURES

### Dashboard
- [ ] Today's referrals count
- [ ] Active cases
- [ ] Pending commissions
- [ ] Withdrawal requests status

### Patient Referral Form
- [ ] Patient Mobile Number (validation)
- [ ] Patient Name
- [ ] Age / DOB
- [ ] Gender
- [ ] Case Type (Normal/Insurance)
- [ ] Symptoms/Description
- [ ] Location/Address
- [ ] Preferred Doctor Specialization
- [ ] Emergency? (Yes/No)

### My Cases
- [ ] Case list with filters
- [ ] Case details (bill, commission, status)
- [ ] Timeline view
- [ ] Export as PDF

### Commissions
- [ ] Commission breakdown
- [ ] Case-wise earnings
- [ ] Campaign bonuses
- [ ] Withdrawal history

### Withdrawal Management
- [ ] Pending withdrawals
- [ ] Approved withdrawals
- [ ] Rejection reasons (if any)
- [ ] Bank account details

### Profile
- [ ] KYC status
- [ ] Agent license verification
- [ ] Bank account management
- [ ] Contact details

---

## 6. DOCTOR VIEW FEATURES

### Dashboard
- [ ] New referrals (anonymized)
- [ ] Active cases
- [ ] Pending settlements
- [ ] Commission earnings

### My Cases/Patients
- [ ] Patient list (anonymous ID)
- [ ] Case details (symptoms, bill, referral date)
- [ ] Case timeline
- [ ] Add prescription/notes
- [ ] Mark case as settled

### Case Management
- [ ] Update case status
- [ ] Generate bill/invoice
- [ ] Add medical notes
- [ ] Mark insurance settlement
- [ ] Case history

### Commissions
- [ ] Commission breakdown
- [ ] Case-wise earnings
- [ ] Settlement status
- [ ] Withdrawal history

### Withdrawal Management
- [ ] View available balance
- [ ] Request withdrawal
- [ ] Bank account details
- [ ] Withdrawal history

### Profile
- [ ] Doctor details
- [ ] License verification
- [ ] Specializations
- [ ] Bank details

---

## 7. ADMIN/SUPER-VISION APP FEATURES

### Dashboard (KPIs)
- [ ] Total agents, doctors, patients
- [ ] Total bill amount
- [ ] Total commissions paid
- [ ] Pending withdrawals
- [ ] KYC pending count

### User Management
- [ ] Agent list with filters
- [ ] Doctor list with filters
- [ ] Approval/Rejection of new registrations
- [ ] KYC verification panel
- [ ] User suspension/activation
- [ ] View user details and documents

### Case Management
- [ ] All cases view
- [ ] Case analytics (by agent, doctor, type)
- [ ] Bill amount distribution
- [ ] Settlement tracking
- [ ] Dispute resolution

### Commission Management
- [ ] Commission breakdown by agent/doctor
- [ ] Commission tier adjustment
- [ ] Manual commission adjustments
- [ ] Audit trail

### Payment Management
- [ ] Withdrawal requests queue
- [ ] Approval/rejection interface
- [ ] Bank integration status
- [ ] Transaction history
- [ ] Penalty management

### Campaign Management
- [ ] Create/edit campaigns
- [ ] Assign agents to campaigns
- [ ] Campaign performance tracking
- [ ] Bonus distribution

### Reports
- [ ] Agent performance report
- [ ] Doctor performance report
- [ ] Financial summary
- [ ] KYC status report
- [ ] Withdrawal report
- [ ] Export to CSV/PDF

### Settings
- [ ] Commission rates configuration
- [ ] Withdrawal eligibility rules
- [ ] Insurance case rules
- [ ] Penalty percentage settings

---

## 8. API ENDPOINTS STRUCTURE

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
GET    /api/auth/verify-otp
```

### Agent Endpoints
```
GET    /api/agents/dashboard
POST   /api/agents/refer-patient
GET    /api/agents/my-cases
GET    /api/agents/cases/:caseId
GET    /api/agents/commissions
POST   /api/agents/withdraw-request
GET    /api/agents/withdrawals
PUT    /api/agents/profile
```

### Doctor Endpoints
```
GET    /api/doctors/dashboard
GET    /api/doctors/my-cases
GET    /api/doctors/cases/:caseId
PUT    /api/doctors/cases/:caseId/update-status
POST   /api/doctors/cases/:caseId/bill
GET    /api/doctors/commissions
POST   /api/doctors/withdraw-request
GET    /api/doctors/withdrawals
```

### Admin Endpoints
```
GET    /api/admin/dashboard
GET    /api/admin/agents
PUT    /api/admin/agents/:agentId/approve-kyc
GET    /api/admin/doctors
PUT    /api/admin/doctors/:doctorId/approve-kyc
GET    /api/admin/cases
PUT    /api/admin/cases/:caseId/resolve
GET    /api/admin/withdrawals
PUT    /api/admin/withdrawals/:withdrawalId/approve
GET    /api/admin/reports/agents
GET    /api/admin/reports/financial
```

---

## 9. SECURITY CONSIDERATIONS

### Authentication & Authorization
- JWT with 15-minute expiry
- Refresh tokens with 7-day expiry
- Role-based access control (RBAC)
- OAuth2 for social login

### Data Protection
- End-to-end encryption for sensitive data
- PII anonymization (patient data for doctors)
- Secure storage of bank details
- SSL/TLS for all API calls
- GDPR compliance

### Fraud Prevention
- Case verification by admins
- Doctor identity verification
- Agent license validation
- Duplicate registration checks
- IP whitelisting for admin panel

### Audit Trail
- All transactions logged
- Commission calculations auditable
- Withdrawal approval chain tracked
- User activity logs

---

## 10. DEPLOYMENT CHECKLIST

- [ ] Database setup and migration
- [ ] API server deployment
- [ ] Firebase/Authentication setup
- [ ] Payment gateway integration
- [ ] S3/Cloud storage setup
- [ ] Email service configuration
- [ ] SMS service configuration
- [ ] Monitoring and logging (DataDog/Sentry)
- [ ] Backup and disaster recovery
- [ ] Load testing
- [ ] Security audit
- [ ] App store submission (iOS/Android)

---

## 11. TESTING STRATEGY

### Unit Tests
- Commission calculation logic
- Eligibility date calculations
- Validation functions

### Integration Tests
- API endpoint testing
- Database transactions
- Payment gateway integration

### E2E Tests
- Agent referral flow
- Doctor case management
- Withdrawal request flow
- Admin approval workflow

### Load Testing
- 10k+ concurrent users
- Peak case load scenarios
