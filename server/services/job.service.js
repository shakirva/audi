const jobRepository = require("../repositories/job.repository");
const bookingRepository = require("../repositories/booking.repository");
const enquiryRepository = require("../repositories/enquiry.repository");
const { JobTimeline, JobStaff, JobVendor, JobChecklist, JobDocument } = require("../models");
const { NotFoundError, BadRequestError } = require("../helpers/errors");

class JobService {
  async listJobs({ tenantId, environmentId, status, priority, query }) {
    const result = await jobRepository.findAllWithDetails({
      tenantId,
      environmentId,
      status,
      priority,
      query,
    });
    return { data: result.rows, total: result.total, page: result.page, limit: result.limit };
  }

  async getJob(id, { tenantId, environmentId }) {
    const job = await jobRepository.findByIdWithDetails(id, { tenantId, environmentId });
    if (!job) throw new NotFoundError("Job");
    return job;
  }

  // Called automatically when a booking is confirmed
  async createJobFromBooking(bookingId, { tenantId, environmentId, createdBy }) {
    const booking = await bookingRepository.findById(bookingId, { tenantId, environmentId });
    if (!booking) throw new NotFoundError("Booking");

    // Check if job already exists
    const existing = await jobRepository.findOne({
      tenantId,
      environmentId,
      where: { bookingId }
    });
    if (existing) return existing;

    // Create Job
    const job = await jobRepository.create({
      tenantId,
      environmentId,
      customerId: booking.customerId,
      bookingId: booking.id,
      eventDate: booking.date,
      hall: booking.hall,
      status: "Confirmed",
      priority: "Normal",
      createdBy,
    });

    // Create initial timeline entry
    await JobTimeline.create({
      tenantId,
      environmentId,
      jobId: job.id,
      userId: createdBy,
      action: "Job Created",
      details: `Auto-created from Booking ${booking.bookingId}`,
    });

    // Attempt to pull Sales Executive from Enquiry
    const enquiry = await enquiryRepository.findOne({
      tenantId,
      environmentId,
      where: { customerId: booking.customerId } // Rough heuristic; should ideally link Enquiry -> Booking
    });

    if (enquiry && enquiry.salesExecutiveId) {
      await JobStaff.create({
        tenantId,
        environmentId,
        jobId: job.id,
        userId: enquiry.salesExecutiveId,
        role: "Sales Executive",
        status: "Completed",
        assignedBy: createdBy,
      });

      await JobTimeline.create({
        tenantId,
        environmentId,
        jobId: job.id,
        userId: createdBy,
        action: "Staff Assigned",
        details: "Sales Executive copied from Enquiry",
      });
    }

    return job;
  }

  async updateJobStatus(id, status, { tenantId, environmentId, updatedBy }) {
    const job = await jobRepository.findById(id, { tenantId, environmentId });
    if (!job) throw new NotFoundError("Job");

    const oldStatus = job.status;
    await jobRepository.update(job, { status, updatedBy });

    await JobTimeline.create({
      tenantId,
      environmentId,
      jobId: job.id,
      userId: updatedBy,
      action: "Status Changed",
      details: `Status changed from ${oldStatus} to ${status}`,
    });

    return job;
  }

  async assignStaff(jobId, data, { tenantId, environmentId, createdBy }) {
    const job = await jobRepository.findById(jobId, { tenantId, environmentId });
    if (!job) throw new NotFoundError("Job");

    const staff = await JobStaff.create({
      tenantId,
      environmentId,
      jobId,
      assignedBy: createdBy,
      ...data,
    });

    await JobTimeline.create({
      tenantId,
      environmentId,
      jobId,
      userId: createdBy,
      action: "Staff Assigned",
      details: `Role: ${data.role} assigned to User ID ${data.userId}`,
    });

    return staff;
  }

  async addTimelineEntry(jobId, data, { tenantId, environmentId, createdBy }) {
    return JobTimeline.create({
      tenantId,
      environmentId,
      jobId,
      userId: createdBy,
      ...data,
    });
  }

  async createStandaloneJob(data, { tenantId, environmentId, createdBy }) {
    const job = await jobRepository.create({
      tenantId,
      environmentId,
      eventDate: data.eventDate || data.date,
      hall: data.hall,
      customerName: data.customerName,
      eventType: data.eventType,
      session: data.session,
      status: "Planning",
      priority: "Normal",
      createdBy,
    });
    
    await JobTimeline.create({
      tenantId,
      environmentId,
      jobId: job.id,
      userId: createdBy,
      action: "Job Created",
      details: `Manual job created`,
    });
    return job;
  }

  async deleteJob(id, { tenantId, environmentId }) {
    const job = await jobRepository.findById(id, { tenantId, environmentId });
    if (!job) throw new NotFoundError("Job");
    await jobRepository.delete(id);
    return { success: true };
  }

  async toggleChecklist(jobId, data, { tenantId, environmentId, createdBy }) {
    // If it exists, toggle it, else create it
    const existing = await JobChecklist.findOne({
      where: { tenantId, environmentId, jobId, taskName: data.taskName }
    });
    
    if (existing) {
      existing.isCompleted = !existing.isCompleted;
      existing.completedAt = existing.isCompleted ? new Date() : null;
      existing.completedBy = existing.isCompleted ? createdBy : null;
      await existing.save();
      return existing;
    } else {
      return JobChecklist.create({
        tenantId,
        environmentId,
        jobId,
        taskName: data.taskName,
        isCompleted: true,
        completedAt: new Date(),
        completedBy: createdBy,
        createdBy,
      });
    }
  }

  async addTask(jobId, data, { tenantId, environmentId, createdBy }) {
    return JobChecklist.create({
      tenantId,
      environmentId,
      jobId,
      taskName: data.taskName,
      isCompleted: false,
      createdBy,
    });
  }

  async removeTask(jobId, taskId, { tenantId, environmentId }) {
    const task = await JobChecklist.findOne({
      where: { id: taskId, jobId, tenantId, environmentId }
    });
    if (!task) throw new NotFoundError("Task");
    await task.destroy();
    return { success: true };
  }

  async removeStaff(jobId, staffId, { tenantId, environmentId }) {
    const staff = await JobStaff.findOne({
      where: { id: staffId, jobId, tenantId, environmentId }
    });
    if (!staff) throw new NotFoundError("JobStaff");
    await staff.destroy();
    return { success: true };
  }
}

module.exports = new JobService();
