/**
 * Model associations — defines all relationships between models.
 * Import this file once in index.js after all models are loaded.
 */
const Tenant = require("./Tenant");
const Environment = require("./Environment");
const Subscription = require("./Subscription");
const User = require("./User");
const Booking = require("./Booking");
const Expense = require("./Expense");
const Settings = require("./Settings");
const AuditLog = require("./AuditLog");
const Customer = require("./Customer");
const Enquiry = require("./Enquiry");
const FollowUp = require("./FollowUp");
const Agreement = require("./Agreement");
const AgreementTemplate = require("./AgreementTemplate");
const AgreementVersion = require("./AgreementVersion");
const Payment = require("./Payment");
const Receipt = require("./Receipt");
const Job = require("./Job");
const JobStaff = require("./JobStaff");
const JobVendor = require("./JobVendor");
const JobTimeline = require("./JobTimeline");
const JobChecklist = require("./JobChecklist");
const JobDocument = require("./JobDocument");
const AccountStatement = require("./AccountStatement");
const CashBook = require("./CashBook");
const BankBook = require("./BankBook");
const ChartOfAccount = require("./ChartOfAccount");
const JournalEntry = require("./JournalEntry");
const Voucher = require("./Voucher");
const {
  MasterHall, MasterPackage, MasterService, MasterEventType,
  MasterLeadSource, MasterPaymentMode, MasterBank, MasterExpenseCategory,
} = require("./Master");

// ── Tenant has many ──
Tenant.hasMany(Environment, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(User, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Booking, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Expense, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasOne(Settings, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Subscription, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Customer, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Enquiry, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(FollowUp, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Agreement, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(AgreementTemplate, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(AgreementVersion, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Payment, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Receipt, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Job, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(JobStaff, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(JobVendor, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(JobTimeline, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(JobChecklist, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(JobDocument, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(AccountStatement, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(CashBook, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(BankBook, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(ChartOfAccount, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(JournalEntry, { foreignKey: "tenantId", onDelete: "CASCADE" });
Tenant.hasMany(Voucher, { foreignKey: "tenantId", onDelete: "CASCADE" });

// ── Environment has many ──
Environment.hasMany(Booking, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Expense, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasOne(Settings, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Customer, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Enquiry, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(FollowUp, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Agreement, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(AgreementTemplate, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(AgreementVersion, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Payment, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Receipt, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Job, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(JobStaff, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(JobVendor, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(JobTimeline, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(JobChecklist, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(JobDocument, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(AccountStatement, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(CashBook, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(BankBook, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(ChartOfAccount, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(JournalEntry, { foreignKey: "environmentId", onDelete: "CASCADE" });
Environment.hasMany(Voucher, { foreignKey: "environmentId", onDelete: "CASCADE" });

// ── Customer has many ──
Customer.hasMany(Booking, { foreignKey: "customerId", onDelete: "SET NULL" });
Customer.hasMany(Enquiry, { foreignKey: "customerId", onDelete: "CASCADE" });
Customer.hasMany(Payment, { foreignKey: "customerId", onDelete: "CASCADE" });
Customer.hasMany(Receipt, { foreignKey: "customerId", onDelete: "CASCADE" });
Customer.hasMany(Job, { foreignKey: "customerId", onDelete: "CASCADE" });
Customer.hasMany(AccountStatement, { foreignKey: "customerId", onDelete: "CASCADE" });

// ── Enquiry has many ──
Enquiry.hasMany(FollowUp, { foreignKey: "enquiryId", onDelete: "CASCADE" });

// ── Booking has many/one ──
Booking.hasOne(Agreement, { foreignKey: "bookingId", onDelete: "CASCADE" });
Booking.hasMany(Payment, { foreignKey: "bookingId", onDelete: "CASCADE" });
Booking.hasMany(Receipt, { foreignKey: "bookingId", onDelete: "CASCADE" });
Booking.hasOne(Job, { foreignKey: "bookingId", onDelete: "CASCADE" });

// ── Agreement has many ──
Agreement.hasMany(AgreementVersion, { foreignKey: "agreementId", onDelete: "CASCADE" });
AgreementTemplate.hasMany(Agreement, { foreignKey: "templateId", onDelete: "SET NULL" });
Agreement.hasOne(Job, { foreignKey: "agreementId", onDelete: "SET NULL" });

// ── Payment has one ──
Payment.hasOne(Receipt, { foreignKey: "paymentId", onDelete: "CASCADE" });

// ── User has many ──
User.hasMany(Enquiry, { foreignKey: "salesExecutiveId", onDelete: "SET NULL" });
User.hasMany(JobStaff, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(JobTimeline, { foreignKey: "userId", onDelete: "SET NULL" });
User.hasMany(JobChecklist, { foreignKey: "completedBy", onDelete: "SET NULL" });
User.hasMany(JobDocument, { foreignKey: "uploadedBy", onDelete: "SET NULL" });

// ── Job has many ──
Job.hasMany(JobStaff, { foreignKey: "jobId", onDelete: "CASCADE" });
Job.hasMany(JobVendor, { foreignKey: "jobId", onDelete: "CASCADE" });
Job.hasMany(JobTimeline, { foreignKey: "jobId", onDelete: "CASCADE" });
Job.hasMany(JobChecklist, { foreignKey: "jobId", onDelete: "CASCADE" });
Job.hasMany(JobDocument, { foreignKey: "jobId", onDelete: "CASCADE" });

// ── Belongs to Tenant ──
Environment.belongsTo(Tenant, { foreignKey: "tenantId" });
User.belongsTo(Tenant, { foreignKey: "tenantId" });
Booking.belongsTo(Tenant, { foreignKey: "tenantId" });
Expense.belongsTo(Tenant, { foreignKey: "tenantId" });
Settings.belongsTo(Tenant, { foreignKey: "tenantId" });
Subscription.belongsTo(Tenant, { foreignKey: "tenantId" });
Customer.belongsTo(Tenant, { foreignKey: "tenantId" });
Enquiry.belongsTo(Tenant, { foreignKey: "tenantId" });
FollowUp.belongsTo(Tenant, { foreignKey: "tenantId" });
Agreement.belongsTo(Tenant, { foreignKey: "tenantId" });
AgreementTemplate.belongsTo(Tenant, { foreignKey: "tenantId" });
AgreementVersion.belongsTo(Tenant, { foreignKey: "tenantId" });
Payment.belongsTo(Tenant, { foreignKey: "tenantId" });
Receipt.belongsTo(Tenant, { foreignKey: "tenantId" });
Job.belongsTo(Tenant, { foreignKey: "tenantId" });
JobStaff.belongsTo(Tenant, { foreignKey: "tenantId" });
JobVendor.belongsTo(Tenant, { foreignKey: "tenantId" });
JobTimeline.belongsTo(Tenant, { foreignKey: "tenantId" });
JobChecklist.belongsTo(Tenant, { foreignKey: "tenantId" });
JobDocument.belongsTo(Tenant, { foreignKey: "tenantId" });
AccountStatement.belongsTo(Tenant, { foreignKey: "tenantId" });
CashBook.belongsTo(Tenant, { foreignKey: "tenantId" });
BankBook.belongsTo(Tenant, { foreignKey: "tenantId" });
ChartOfAccount.belongsTo(Tenant, { foreignKey: "tenantId" });
JournalEntry.belongsTo(Tenant, { foreignKey: "tenantId" });
Voucher.belongsTo(Tenant, { foreignKey: "tenantId" });

// ── Belongs to Environment ──
Booking.belongsTo(Environment, { foreignKey: "environmentId" });
Expense.belongsTo(Environment, { foreignKey: "environmentId" });
Settings.belongsTo(Environment, { foreignKey: "environmentId" });
Customer.belongsTo(Environment, { foreignKey: "environmentId" });
Enquiry.belongsTo(Environment, { foreignKey: "environmentId" });
FollowUp.belongsTo(Environment, { foreignKey: "environmentId" });
Agreement.belongsTo(Environment, { foreignKey: "environmentId" });
AgreementTemplate.belongsTo(Environment, { foreignKey: "environmentId" });
AgreementVersion.belongsTo(Environment, { foreignKey: "environmentId" });
Payment.belongsTo(Environment, { foreignKey: "environmentId" });
Receipt.belongsTo(Environment, { foreignKey: "environmentId" });
Job.belongsTo(Environment, { foreignKey: "environmentId" });
JobStaff.belongsTo(Environment, { foreignKey: "environmentId" });
JobVendor.belongsTo(Environment, { foreignKey: "environmentId" });
JobTimeline.belongsTo(Environment, { foreignKey: "environmentId" });
JobChecklist.belongsTo(Environment, { foreignKey: "environmentId" });
JobDocument.belongsTo(Environment, { foreignKey: "environmentId" });
AccountStatement.belongsTo(Environment, { foreignKey: "environmentId" });
CashBook.belongsTo(Environment, { foreignKey: "environmentId" });
BankBook.belongsTo(Environment, { foreignKey: "environmentId" });
ChartOfAccount.belongsTo(Environment, { foreignKey: "environmentId" });
JournalEntry.belongsTo(Environment, { foreignKey: "environmentId" });
Voucher.belongsTo(Environment, { foreignKey: "environmentId" });

// ── Journal/Voucher associations ──
JournalEntry.belongsTo(ChartOfAccount, { as: "DebitAccount", foreignKey: "debitAccountId" });
JournalEntry.belongsTo(ChartOfAccount, { as: "CreditAccount", foreignKey: "creditAccountId" });
JournalEntry.belongsTo(Voucher, { foreignKey: "voucherId" });
JournalEntry.belongsTo(Customer, { foreignKey: "customerId" });
JournalEntry.belongsTo(Booking, { foreignKey: "bookingId" });
Voucher.hasMany(JournalEntry, { foreignKey: "voucherId" });
Voucher.belongsTo(Customer, { foreignKey: "customerId" });
Voucher.belongsTo(Booking, { foreignKey: "bookingId" });
ChartOfAccount.hasMany(JournalEntry, { as: "DebitEntries", foreignKey: "debitAccountId" });
ChartOfAccount.hasMany(JournalEntry, { as: "CreditEntries", foreignKey: "creditAccountId" });

// ── Other BelongsTo ──
Booking.belongsTo(Customer, { foreignKey: "customerId" });
Enquiry.belongsTo(Customer, { foreignKey: "customerId" });
Enquiry.belongsTo(User, { as: "SalesExecutive", foreignKey: "salesExecutiveId" });
FollowUp.belongsTo(Enquiry, { foreignKey: "enquiryId" });

Expense.belongsTo(Booking, { foreignKey: "bookingId" });
Booking.hasMany(Expense, { foreignKey: "bookingId" });

Agreement.belongsTo(Booking, { foreignKey: "bookingId" });
Agreement.belongsTo(AgreementTemplate, { foreignKey: "templateId" });
AgreementVersion.belongsTo(Agreement, { foreignKey: "agreementId" });

Payment.belongsTo(Booking, { foreignKey: "bookingId" });
Payment.belongsTo(Customer, { foreignKey: "customerId" });
Payment.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Receipt.belongsTo(Payment, { foreignKey: "paymentId" });
Receipt.belongsTo(Booking, { foreignKey: "bookingId" });
Receipt.belongsTo(Customer, { foreignKey: "customerId" });

Job.belongsTo(Customer, { foreignKey: "customerId" });
Job.belongsTo(Booking, { foreignKey: "bookingId" });
Job.belongsTo(Agreement, { foreignKey: "agreementId" });

JobStaff.belongsTo(Job, { foreignKey: "jobId" });
JobStaff.belongsTo(User, { foreignKey: "userId" });

JobVendor.belongsTo(Job, { foreignKey: "jobId" });

JobTimeline.belongsTo(Job, { foreignKey: "jobId" });
JobTimeline.belongsTo(User, { foreignKey: "userId" });

JobChecklist.belongsTo(Job, { foreignKey: "jobId" });
JobChecklist.belongsTo(User, { as: "CompletedByUser", foreignKey: "completedBy" });

JobDocument.belongsTo(Job, { foreignKey: "jobId" });
JobDocument.belongsTo(User, { as: "UploadedByUser", foreignKey: "uploadedBy" });

AccountStatement.belongsTo(Customer, { foreignKey: "customerId" });

module.exports = { 
  Tenant, Environment, Subscription, User, Booking, Expense, Settings, AuditLog, Customer, Enquiry, FollowUp,
  Agreement, AgreementTemplate, AgreementVersion, Payment, Receipt,
  Job, JobStaff, JobVendor, JobTimeline, JobChecklist, JobDocument,
  AccountStatement, CashBook, BankBook,
  ChartOfAccount, JournalEntry, Voucher,
  MasterHall, MasterPackage, MasterService, MasterEventType, MasterLeadSource, MasterPaymentMode, MasterBank, MasterExpenseCategory 
};





