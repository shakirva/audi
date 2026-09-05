import React, { useState, useEffect, useCallback } from "react";
import { Briefcase, Clock, CheckCircle, ChevronRight, UserCircle, Search, FileText, CheckSquare, Plus, ArrowLeft, RefreshCw, AlertCircle, Printer, X } from "lucide-react";
import { jobsAPI, isPlanRestriction } from "../services/api";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";
import { useConfirm } from "../components/ConfirmProvider";

function JobSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ height: 16, background: "#f1f5f9", borderRadius: 6, width: 80, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
          <div style={{ height: 20, background: "#f1f5f9", borderRadius: 6, width: 150, marginBottom: 4, animation: "pulse 1.5s infinite" }} />
          <div style={{ height: 14, background: "#f1f5f9", borderRadius: 6, width: 100, animation: "pulse 1.5s infinite" }} />
        </div>
        <div style={{ height: 20, background: "#f1f5f9", borderRadius: 10, width: 70, animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ height: 36, background: "#f1f5f9", borderRadius: 8, marginBottom: 20, animation: "pulse 1.5s infinite" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ height: 16, background: "#f1f5f9", borderRadius: 6, width: 60, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 16, background: "#f1f5f9", borderRadius: 6, width: 40, animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

import { generateAgreement } from "../utils/documentGenerator";

export default function Jobs() {
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const { user, role, venueInfo, tenant } = useRole();
  const tSlug = tenant?.slug || 'default';
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [taskModal, setTaskModal] = useState({ open: false, taskName: "" });
  const [staffModal, setStaffModal] = useState({ open: false, staffId: "", staffName: "", role: "Sales" });
  const [jobModal, setJobModal] = useState({ open: false, customerName: "", eventType: "", hall: "Main Hall", date: "", session: "Morning", amount: "" });

  useEffect(() => {
    import("../services/api").then(({ settingsAPI }) => {
      if (settingsAPI.getUsers) {
        settingsAPI.getUsers().then(res => {
          if (res.data.data) setUsersList(res.data.data.filter(u => u.active !== false));
        }).catch(() => {});
      }
    });
  }, []);

  const toggleChecklistLocal = async (jobId, checklistId) => {
    try {
      await jobsAPI.toggleChecklist(jobId, { taskName: checklistId });
      // update state optimistically
      setJobs(jobs.map(j => {
        if (j.id === jobId) {
          const checklists = j.JobChecklists || [];
          const idx = checklists.findIndex(c => c.taskName === checklistId);
          if (idx >= 0) {
            const updated = [...checklists];
            updated[idx].isCompleted = !updated[idx].isCompleted;
            return { ...j, JobChecklists: updated };
          } else {
            return { ...j, JobChecklists: [...checklists, { taskName: checklistId, isCompleted: true }] };
          }
        }
        return j;
      }));
    } catch (e) {
      addToast("Failed to update checklist", "error");
    }
  };

  useEffect(() => {
    const fetchAndMigrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const localJobsRaw = localStorage.getItem(`hm_local_jobs_${tSlug}`);
        const localChecklistsRaw = localStorage.getItem(`hm_local_checklists_${tSlug}`);
        const localTasksRaw = localStorage.getItem(`hm_local_tasks_${tSlug}`);
        const localStaffRaw = localStorage.getItem(`hm_local_staff_${tSlug}`);

        if (localJobsRaw) {
          const oldLocalJobs = JSON.parse(localJobsRaw) || [];
          const oldTasks = JSON.parse(localTasksRaw || "{}");
          const oldStaff = JSON.parse(localStaffRaw || "{}");
          const oldChecklists = JSON.parse(localChecklistsRaw || "{}");

          for (const lj of oldLocalJobs) {
            try {
              const res = await jobsAPI.create({
                customerName: lj.customerName,
                eventType: lj.Booking?.eventType || "Event",
                hall: lj.hall,
                date: lj.eventDate,
                session: lj.Booking?.session || "Morning",
              });
              const newJob = res.data.data;
              
              const tasks = oldTasks[lj.id] || [];
              for (const task of tasks) {
                await jobsAPI.addTask(newJob.id, { taskName: task.taskName });
              }
              const staffList = oldStaff[lj.id] || [];
              for (const staff of staffList) {
                await jobsAPI.assignStaff(newJob.id, { userId: staff.userId, role: staff.role });
              }
              // checklists are job-independent in UI, so we just migrate if any existed for this LOCAL_ ID
              const checklistKeys = Object.keys(oldChecklists).filter(k => k.startsWith(lj.id + "_") && oldChecklists[k]);
              for (const key of checklistKeys) {
                const taskName = key.replace(lj.id + "_", "");
                await jobsAPI.toggleChecklist(newJob.id, { taskName });
              }
            } catch (err) {
              console.error("Failed to migrate job", lj.id, err);
            }
          }
          localStorage.removeItem(`hm_local_jobs_${tSlug}`);
          localStorage.removeItem(`hm_local_tasks_${tSlug}`);
          localStorage.removeItem(`hm_local_staff_${tSlug}`);
          localStorage.removeItem(`hm_local_checklists_${tSlug}`);
          addToast("Migrated local jobs to database", "success");
        }

        const params = {};
        if (search) params.search = search;
        const res = await jobsAPI.getAll(params);
        let data = res.data.data || [];
        
        if (role === "Sales" || role === "Operations") {
          data = data.filter(job => {
            const staff = [...(job.JobStaffs || []), ...(job.Staff || [])];
            return staff.some(s => s.userId === user?.id || s.User?.id === user?.id || s.User?.name === user?.name || s.name === user?.name) ||
                   job.salesExecutiveId === user?.id || job.createdBy === user?.id; 
          });
        }
        setJobs(data);
      } catch (err) {
        if (!isPlanRestriction(err)) {
          const msg = err.response?.data?.message || "Failed to load jobs";
          setError(msg);
          addToast(msg, "error");
        }
      } finally {
        setLoading(false);
      }
    };
    if (tSlug) fetchAndMigrate();
  }, [search, role, user, tSlug]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const res = await jobsAPI.create({
        customerName: jobModal.customerName,
        eventType: jobModal.eventType,
        hall: jobModal.hall,
        date: jobModal.date,
        session: jobModal.session,
        amount: jobModal.amount
      });
      setJobs([res.data.data, ...jobs]);
      setJobModal({ open: false, customerName: "", eventType: "", hall: "Main Hall", date: "", session: "Morning", amount: "" });
      addToast("Job created successfully", "success");
    } catch(e) {
      addToast("Failed to create job", "error");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!(await confirm("Are you sure you want to delete this job?"))) return;
    try {
      await jobsAPI.remove(id);
      setJobs(prev => prev.filter(j => j.id !== id));
      setSelectedJob(null);
      addToast("Job deleted successfully", "success");
    } catch(e) {
      addToast("Failed to delete job", "error");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await jobsAPI.updateStatus(id, newStatus);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
      if (selectedJob && selectedJob.id === id) setSelectedJob(prev => ({ ...prev, status: newStatus }));
      addToast("Job status updated", "success");
    } catch (e) {
      addToast("Failed to update status", "error");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const jId = selectedJob.id;
    try {
      const res = await jobsAPI.addTask(jId, { taskName: taskModal.taskName });
      const newTask = res.data.data;
      setJobs(jobs.map(j => j.id === jId ? { ...j, JobChecklists: [...(j.JobChecklists||[]), newTask] } : j));
      setTaskModal({ open: false, taskName: "" });
      addToast("Task added", "success");
    } catch(e) {
      addToast("Failed to add task", "error");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const jId = selectedJob.id;
    try {
      const res = await jobsAPI.assignStaff(jId, { userId: staffModal.staffId, role: staffModal.role });
      const newStaff = res.data.data;
      setJobs(jobs.map(j => j.id === jId ? { ...j, JobStaffs: [...(j.JobStaffs||[]), newStaff] } : j));
      setStaffModal({ open: false, staffId: "", staffName: "", role: "Sales" });
      addToast("Staff assigned", "success");
    } catch (e) {
      addToast(e.response?.data?.message || "Failed to assign staff", "error");
    }
  };

  const handleRemoveTask = async (taskId) => {
    const jId = selectedJob.id;
    try {
      await jobsAPI.removeTask(jId, taskId);
      setJobs(jobs.map(j => j.id === jId ? { ...j, JobChecklists: (j.JobChecklists||[]).filter(t => t.id !== taskId) } : j));
    } catch(e) {
      addToast("Failed to remove task", "error");
    }
  };

  const handleRemoveStaff = async (staffLocalId) => {
    const jId = selectedJob.id;
    try {
      await jobsAPI.removeStaff(jId, staffLocalId);
      setJobs(jobs.map(j => j.id === jId ? { ...j, JobStaffs: (j.JobStaffs||[]).filter(s => s.id !== staffLocalId) } : j));
    } catch (e) {
      addToast("Failed to remove staff", "error");
    }
  };

  const getCustomerName = (job) => {
    if (job.customerName) return job.customerName;
    if (job.Customer?.name) return job.Customer.name;
    if (job.Booking?.customerName) return job.Booking.customerName;
    return "Unknown Customer";
  };

  const getEventType = (job) => {
    if (job.eventType) return job.eventType;
    if (job.Booking?.eventType) return job.Booking.eventType;
    return "Event";
  };

  if (selectedJob) {
    const jobNum = selectedJob.jobNumber || `JOB${String(selectedJob.id).padStart(4, "0")}`;
    const customer = getCustomerName(selectedJob);
    const eventType = getEventType(selectedJob);
    const hall = selectedJob.hall || selectedJob.Booking?.hall || "Main Hall";
    const date = new Date(selectedJob.eventDate || selectedJob.Booking?.date || selectedJob.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const amount = selectedJob.Booking?.totalAmount ? `₹${Number(selectedJob.Booking.totalAmount).toLocaleString("en-IN")}` : "—";
    
    // Now using DB JobChecklists and JobStaffs
    const checklists = selectedJob.JobChecklists || [];
    const completedTasks = checklists.filter(c => c.isCompleted).length;
    const totalTasks = checklists.length;
    const staff = selectedJob.JobStaffs || selectedJob.Staff || [];
    const timeline = selectedJob.JobTimelines || selectedJob.Timeline || [];

    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
        <button 
          onClick={() => setSelectedJob(null)}
          style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 6, color: "#666", cursor: "pointer", marginBottom: 20, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Jobs
        </button>
        
        {/* Job Header */}
        <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #eaeaea", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 24, color: "#111" }}>{customer} - {eventType}</h1>
              <select 
                value={selectedJob.status} 
                onChange={(e) => handleUpdateStatus(selectedJob.id, e.target.value)}
                style={{ background: "#e0f2fe", color: "#0284c7", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", outline: "none" }}
              >
                <option value="Planning">Planning</option>
                <option value="Setup">Setup</option>
                <option value="Event Running">Event Running</option>
                <option value="Cleanup">Cleanup</option>
                <option value="Completed">Completed</option>
              </select>
              {String(selectedJob.id).startsWith("LOCAL_") && (
                <button onClick={() => handleDeleteJob(selectedJob.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
              )}
            </div>
            <div style={{ display: "flex", gap: 24, color: "#666", fontSize: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={16} /> {date}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={16} /> {hall}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FileText size={16} /> {jobNum}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Total Value</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1B4332", marginBottom: 8 }}>{amount}</div>
            <button
              onClick={() => generateAgreement({ booking: selectedJob.Booking || selectedJob })}
              style={{ padding: "6px 12px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, display: "inline-flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontSize: 12, fontWeight: 600, gap: 6 }}
            >
              <Printer size={14} /> Print Agreement
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Left Column */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Checklist */}
            <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #eaeaea" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "#111", display: "flex", alignItems: "center", gap: 8 }}><CheckSquare size={18} /> Operational Checklist</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{completedTasks}/{totalTasks} Completed</span>
                  <button onClick={() => setTaskModal({ open: true, taskName: "" })} style={{ background: "none", border: "none", color: "#1B4332", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} /> Add</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {totalTasks === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 13 }}>No checklist items added yet.</div>
                ) : checklists.map((task, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#f8f9fa", borderRadius: 8, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "#f8f9fa"}>
                    <div onClick={() => toggleChecklistLocal(selectedJob.id, task.taskName)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}>
                      <CheckCircle size={18} color={task.isCompleted ? "#22c55e" : "#cbd5e1"} />
                      <span style={{ fontSize: 14, color: task.isCompleted ? "#333" : "#666", textDecoration: task.isCompleted ? "line-through" : "none" }}>{task.taskName}</span>
                    </div>
                    {task.id && (
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveTask(task.id); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Staff Assigned */}
            <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #eaeaea" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "#111", display: "flex", alignItems: "center", gap: 8 }}><UserCircle size={18} /> Staff Assignments</h3>
                {role !== "Sales" && role !== "Operations" && (
                  <button onClick={() => setStaffModal({ open: true, staffName: "", role: "Sales" })} style={{ background: "none", border: "none", color: "#D4A017", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Assign</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {staff.length === 0 ? (
                  <div style={{ padding: 20, color: "#999", fontSize: 13, textAlign: "center", width: "100%" }}>No staff assigned yet.</div>
                ) : staff.map((s, i) => (
                  <div key={i} style={{ border: "1px solid #eaeaea", padding: 12, borderRadius: 8, display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1B4332", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      {s.User?.name?.charAt(0) || s.name?.charAt(0) || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#333", fontSize: 14 }}>{s.User?.name || s.name || "Unknown"}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{s.role}</div>
                    </div>
                    {s.id && (
                      <button onClick={() => handleRemoveStaff(s.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Timeline) */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #eaeaea", minHeight: 400 }}>
              <h3 style={{ margin: "0 0 24px", fontSize: 16, color: "#111", display: "flex", alignItems: "center", gap: 8 }}><Clock size={18} /> Job Timeline</h3>
              <div style={{ position: "relative", paddingLeft: 16, borderLeft: "2px solid #eaeaea", display: "flex", flexDirection: "column", gap: 24 }}>
                {timeline.length === 0 ? (
                  <div style={{ padding: 20, color: "#999", fontSize: 13 }}>No timeline events found.</div>
                ) : timeline.map((entry, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -21, top: 2, width: 10, height: 10, borderRadius: "50%", background: "#1B4332", border: "2px solid #fff" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 2 }}>{entry.action}</div>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
                      {new Date(entry.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>{entry.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Task Modal */}
        {taskModal.open && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            <form onSubmit={handleAddTask} style={{ background: "#fff", width: 400, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add Task</h2>
                <button type="button" onClick={() => setTaskModal({ open: false, taskName: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={18} /></button>
              </div>
              <input autoFocus required type="text" value={taskModal.taskName} onChange={e => setTaskModal({ ...taskModal, taskName: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", marginBottom: 16 }} placeholder="Task description..." />
              <button type="submit" style={{ width: "100%", padding: 12, background: "#1B4332", color: "#fff", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>Add Task</button>
            </form>
          </div>
        )}

        {/* Assign Staff Modal */}
        {staffModal.open && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            <form onSubmit={handleAddStaff} style={{ background: "#fff", width: 400, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Assign Staff</h2>
                <button type="button" onClick={() => setStaffModal({ open: false, staffId: "", staffName: "", role: "Sales" })} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={18} /></button>
              </div>
              <select 
                required 
                value={staffModal.staffId} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setStaffModal({ ...staffModal, staffId: "custom", staffName: "" });
                  } else {
                    const u = usersList.find(x => x.id === val);
                    setStaffModal({ ...staffModal, staffId: val, staffName: u ? u.name : "", role: u ? u.role : "Sales" });
                  }
                }} 
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", marginBottom: 12, outline: "none" }}
              >
                <option value="" disabled>-- Select Staff --</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
                <option value="custom">Custom (Type Name)</option>
              </select>
              {staffModal.staffId === "custom" && (
                <input required type="text" value={staffModal.staffName} onChange={e => setStaffModal({ ...staffModal, staffName: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", marginBottom: 12 }} placeholder="Staff Name" />
              )}
              <select required value={staffModal.role} onChange={e => setStaffModal({ ...staffModal, role: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", marginBottom: 16 }}>
                <option value="Operations">Operations</option>
                <option value="Technician">Technician</option>
                <option value="Security">Security</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Sales">Sales</option>
              </select>
              <button type="submit" style={{ width: "100%", padding: 12, background: "#D4A017", color: "#fff", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>Assign</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Job Listing View
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#0D2418" }}>Job Management</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 14 }}>Track operational events, staff assignments, and checklists.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setJobModal({ open: true, customerName: "", eventType: "", hall: "Main Hall", date: "" })} style={{
            background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, cursor: "pointer", fontSize: 14
          }}>
            <Plus size={16} /> Create Job
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: 11, color: "#999" }} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" }}
          />
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: "#dc2626", fontWeight: 600 }}>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {loading ? (
          [1,2,3,4,5,6].map(i => <JobSkeleton key={i} />)
        ) : jobs.length === 0 && !error ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <Briefcase size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>No jobs found</p>
            <p style={{ fontSize: 14 }}>Jobs are automatically created when a booking is confirmed.</p>
          </div>
        ) : (
          jobs.map((job, i) => {
            const jobNum = job.jobNumber || `JOB${String(job.id).padStart(4, "0")}`;
            const customer = getCustomerName(job);
            const eventType = getEventType(job);
            const hall = job.hall || job.Booking?.hall || "Main Hall";
            const date = new Date(job.eventDate || job.Booking?.date || job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            const staffCount = (job.JobStaffs?.length || job.Staff?.length || 0);
            const checklists = job.JobChecklists || [];
            const completedTasks = checklists.filter(c => c.isCompleted).length;
            const totalTasks = checklists.length;

            return (
              <div key={job.id} onClick={() => setSelectedJob(job)} style={{
                background: "#fff", borderRadius: 12, border: "1px solid #eaeaea",
                padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", cursor: "pointer",
                transition: "all 0.2s", ":hover": { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#1B4332", letterSpacing: 0.5, background: "rgba(27,67,50,0.1)", padding: "4px 8px", borderRadius: 6 }}>{jobNum}</span>
                    <h3 style={{ margin: "8px 0 4px", fontSize: 18, color: "#111" }}>{customer}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{eventType}</p>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: job.status === "Event Running" ? "#fef08a" : job.status === "Planning" ? "#e0f2fe" : "#f1f5f9",
                    color: job.status === "Event Running" ? "#a16207" : job.status === "Planning" ? "#0284c7" : "#475569"
                  }}>
                    {job.status}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, background: "#f8f9fa", padding: 12, borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", fontSize: 13, fontWeight: 600 }}>
                    <Clock size={14} color="#666" /> {date}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", fontSize: 13, fontWeight: 600 }}>
                    <Briefcase size={14} color="#666" /> {hall}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: -8 }}>
                    {staffCount === 0 ? (
                      <span style={{ fontSize: 12, color: "#999" }}>No staff</span>
                    ) : (
                      <>
                        {[...Array(Math.min(staffCount, 3))].map((_, idx) => (
                          <div key={idx} style={{ width: 28, height: 28, borderRadius: "50%", background: "#D4A017", border: "2px solid #fff", marginLeft: idx > 0 ? -10 : 0 }} />
                        ))}
                        <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>{staffCount} Staff</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: totalTasks > 0 && completedTasks === totalTasks ? "#22c55e" : "#666", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle size={14} /> {completedTasks}/{totalTasks}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Job Modal */}
      {jobModal.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
          <form onSubmit={handleCreateJob} style={{ background: "#fff", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Create Custom Job</h2>
              <button type="button" onClick={() => setJobModal({ ...jobModal, open: false })} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input required type="text" value={jobModal.customerName} onChange={e => setJobModal({ ...jobModal, customerName: e.target.value })} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }} placeholder="Customer Name" />
              <input required type="text" value={jobModal.eventType} onChange={e => setJobModal({ ...jobModal, eventType: e.target.value })} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }} placeholder="Event Type (e.g. Wedding)" />
              <input required type="date" value={jobModal.date} onChange={e => setJobModal({ ...jobModal, date: e.target.value })} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }} />
              <select required value={jobModal.hall} onChange={e => setJobModal({ ...jobModal, hall: e.target.value })} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}>
                <option value="Main Hall">Main Hall</option>
                <option value="Mini Hall">Mini Hall</option>
                <option value="Dining Hall">Dining Hall</option>
              </select>
              <div style={{ display: "flex", gap: 12 }}>
                <select required value={jobModal.session} onChange={e => setJobModal({ ...jobModal, session: e.target.value })} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Full Day">Full Day</option>
                </select>
                <input type="number" value={jobModal.amount} onChange={e => setJobModal({ ...jobModal, amount: e.target.value })} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }} placeholder="Amount (₹)" />
              </div>
            </div>
            <button type="submit" style={{ width: "100%", padding: 12, background: "#1B4332", color: "#fff", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer", marginTop: 20 }}>Create Job</button>
          </form>
        </div>
      )}
    </div>
  );
}
