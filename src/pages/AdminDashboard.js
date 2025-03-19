import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { 
  db, 
  getCurrentUser,
  updateUserProfile,
  countUsersByRole 
} from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { 
  Calendar, Users, Bell, CheckSquare, AlertTriangle, 
  BarChart2, X, Edit, PlusSquare, FileText
} from "lucide-react";
import "../styles.css";

const AdminDashboard = () => {
  // State management
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classReps, setClassReps] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState("timetable");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ type: "", data: {} });
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    attendanceRate: 0,
    lecturerCount: 0,
    classRepCount: 0
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Check current user authentication status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role === 'admin') {
          setCurrentUser(user);
        } else {
          // Redirect non-admin users (implement your routing logic here)
          console.warn("Non-admin access attempted");
          // Example: navigate('/login');
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Handle auth error
      }
    };
    
    loadUserData();
  }, []);

  // Fetch events from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = onSnapshot(collection(db, "timetable"), (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        color: getRandomColor(doc.data().title) 
      }));
      setEvents(fetchedEvents);
      checkForConflicts(fetchedEvents);
      setStats(prev => ({
        ...prev,
        totalClasses: fetchedEvents.length,
        activeClasses: fetchedEvents.filter(e => new Date(e.start) >= new Date()).length
      }));
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch lecturers and class reps
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUsers = async () => {
      try {
        // Use the countUsersByRole function from firebaseConfig
        const lecturerCount = await countUsersByRole("lecturer");
        setStats(prev => ({ ...prev, lecturerCount }));
        
        const classRepCount = await countUsersByRole("class_rep");
        setStats(prev => ({ ...prev, classRepCount }));
        
        // Fetch actual lecturer data
        const lecturersSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "lecturer")));
        const fetchedLecturers = lecturersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLecturers(fetchedLecturers);

        // Fetch class rep data
        const classRepsSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "class_rep")));
        const fetchedClassReps = classRepsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClassReps(fetchedClassReps);

        // Fetch pending approvals
        const pendingSnapshot = await getDocs(query(collection(db, "users"), where("approved", "==", false)));
        const fetchedPending = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingApprovals(fetchedPending);
      } catch (error) {
        console.error("Error fetching users:", error);
        setNotifications(prev => [...prev, { 
          id: Date.now(), 
          message: "Error fetching user data. Please try again later.", 
          type: "error" 
        }]);
      }
    };

    fetchUsers();
    
    // Fetch attendance stats
    const fetchAttendanceStats = async () => {
      try {
        const attendanceSnapshot = await getDocs(collection(db, "attendance"));
        const attendanceData = attendanceSnapshot.docs.map(doc => doc.data());
        const attendanceRate = attendanceData.length > 0 
          ? (attendanceData.reduce((acc, curr) => acc + (curr.present ? 1 : 0), 0) / attendanceData.length) * 100 
          : 0;
        setStats(prev => ({ ...prev, attendanceRate: Math.round(attendanceRate) }));
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };
    
    fetchAttendanceStats();
  }, [currentUser]);

  // Check for scheduling conflicts
  const checkForConflicts = (events) => {
    // Check lecturer double-booking
    const lecturerConflicts = {};
    events.forEach(event => {
      const key = `${event.lecturer}_${event.start}`;
      if (lecturerConflicts[key]) {
        lecturerConflicts[key].push(event);
      } else {
        lecturerConflicts[key] = [event];
      }
    });

    // Check room double-booking
    const roomConflicts = {};
    events.forEach(event => {
      if (event.room) {
        const key = `${event.room}_${event.start}`;
        if (roomConflicts[key]) {
          roomConflicts[key].push(event);
        } else {
          roomConflicts[key] = [event];
        }
      }
    });

    const conflictingLecturers = Object.values(lecturerConflicts).filter(c => c.length > 1);
    const conflictingRooms = Object.values(roomConflicts).filter(c => c.length > 1);

    if (conflictingLecturers.length > 0) {
      setNotifications(prev => [...prev.filter(n => !n.message.includes("lecturer conflict")), 
        { id: Date.now(), message: "🚨 Conflict detected: A lecturer has two classes at the same time.", type: "error" }]);
    }

    if (conflictingRooms.length > 0) {
      setNotifications(prev => [...prev.filter(n => !n.message.includes("room conflict")), 
        { id: Date.now(), message: "🚨 Conflict detected: A room is double-booked.", type: "error" }]);
    }
  };

  // Handle calendar date click
  const handleDateClick = (info) => {
    setModalData({
      type: "newEvent",
      data: { date: info.dateStr }
    });
    setIsModalOpen(true);
  };

  // Handle event creation
  const handleCreateEvent = async (eventData) => {
    const { title, lecturer, course, room, start, end, classRep } = eventData;
    
    // Check for conflicts
    if (events.some(event => event.lecturer === lecturer && event.start === start)) {
      alert(`⚠️ Conflict detected! ${lecturer} is already scheduled at this time.`);
      return false;
    }
    
    if (events.some(event => event.room === room && event.start === start)) {
      alert(`⚠️ Conflict detected! Room ${room} is already booked at this time.`);
      return false;
    }
    
    try {
      const newEvent = { 
        title, 
        lecturer, 
        course,
        room,
        classRep,
        start, 
        end: end || start,
        color: getRandomColor(title),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "timetable"), newEvent);
      setNotifications(prev => [...prev, { 
        id: Date.now(), 
        message: `✅ New class scheduled: ${title} with ${lecturer}`, 
        type: "success" 
      }]);
      return true;
    } catch (error) {
      console.error("Error creating event:", error);
      setNotifications(prev => [...prev, { 
        id: Date.now(), 
        message: `❌ Error creating event: ${error.message}`, 
        type: "error" 
      }]);
      return false;
    }
  };

  // Handle event edit
  const handleEventClick = (info) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      setModalData({
        type: "editEvent",
        data: event
      });
      setIsModalOpen(true);
    }
  };

  // Handle event update
  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      await updateDoc(doc(db, "timetable", eventId), {
        ...eventData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });
      
      setNotifications(prev => [...prev, { 
        id: Date.now(), 
        message: "✅ Class details updated successfully", 
        type: "success" 
      }]);
      
      return true;
    } catch (error) {
      console.error("Error updating event:", error);
      setNotifications(prev => [...prev, { 
        id: Date.now(), 
        message: `❌ Error updating event: ${error.message}`, 
        type: "error" 
      }]);
      return false;
    }
  };

  // Handle event deletion
  const handleEventDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteDoc(doc(db, "timetable", eventId));
        setNotifications(prev => [...prev, { 
          id: Date.now(), 
          message: "🗑️ Class has been removed from the schedule", 
          type: "info" 
        }]);
      } catch (error) {
        console.error("Error deleting event:", error);
        setNotifications(prev => [...prev, { 
          id: Date.now(), 
          message: `❌ Error deleting class: ${error.message}`, 
          type: "error" 
        }]);
      }
    }
  };

  // Handle user approval
  const handleApproveUser = async (userId) => {
    try {
      const result = await updateUserProfile(userId, { 
        approved: true,
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString()
      });
      
      if (result.success) {
        setPendingApprovals(prev => prev.filter(user => user.id !== userId));
        setNotifications(prev => [...prev, { 
          id: Date.now(), 
          message: "👍 User account approved successfully", 
          type: "success" 
        }]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error approving user:", error);
      setNotifications(prev => [...prev, { 
        id: Date.now(), 
        message: `❌ Error approving user: ${error.message}`, 
        type: "error" 
      }]);
    }
  };

  // Handle user rejection
  const handleRejectUser = async (userId) => {
    if (window.confirm("Are you sure you want to reject this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setPendingApprovals(prev => prev.filter(user => user.id !== userId));
        setNotifications(prev => [...prev, { 
          id: Date.now(), 
          message: "User account request rejected", 
          type: "info" 
        }]);
      } catch (error) {
        console.error("Error rejecting user:", error);
        setNotifications(prev => [...prev, { 
          id: Date.now(), 
          message: `❌ Error rejecting user: ${error.message}`, 
          type: "error" 
        }]);
      }
    }
  };

  // Utility function for generating consistent colors based on course title
  const getRandomColor = (seed) => {
    const colors = [
      "#4285F4", "#EA4335", "#FBBC05", "#34A853", // Google colors
      "#3498db", "#e74c3c", "#2ecc71", "#f39c12", // Flat UI colors
      "#9b59b6", "#1abc9c", "#d35400", "#c0392b", 
    ];
    
    // Simple hash function for string
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate attendance report
  const generateReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.uid,
      attendanceStats: stats.attendanceRate,
      courseAttendance: events.map(event => ({
        course: event.title,
        lecturer: event.lecturer,
        attendanceRate: Math.floor(Math.random() * 30) + 70 // Simulated data
      }))
    };
    
    console.log("Report generated:", reportData);
    setNotifications(prev => [...prev, { 
      id: Date.now(), 
      message: "📊 Attendance report has been generated", 
      type: "info" 
    }]);
    
    // In a real app, you might send this to a server to generate a PDF
    alert("Report generated successfully. Check the downloads folder.");
  };

  // Dismiss notification
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(note => note.id !== id));
  };

  // If user is not authenticated as admin, show loading state
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">University Admin Dashboard</h1>
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>{stats.totalClasses}</h3>
              <p>Total Classes</p>
            </div>
            <div className="stat-card">
              <h3>{stats.lecturerCount}</h3>
              <p>Lecturers</p>
            </div>
            <div className="stat-card">
              <h3>{stats.classRepCount}</h3>
              <p>Class Reps</p>
            </div>
            <div className="stat-card">
              <h3>{stats.attendanceRate}%</h3>
              <p>Avg. Attendance</p>
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        <div className="notifications-panel">
          <h2><Bell size={18} /> Notifications</h2>
          <div className="notifications-container">
            {notifications.length === 0 ? (
              <p>No new notifications</p>
            ) : (
              <ul className="notifications-list">
                {notifications.map((note) => (
                  <li key={note.id} className={`notification-item ${note.type}`}>
                    {note.message}
                    <button onClick={() => dismissNotification(note.id)} className="dismiss-btn">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Main Content Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === "timetable" ? "active" : ""}`}
            onClick={() => setActiveTab("timetable")}
          >
            <Calendar size={16} /> Timetable
          </button>
          <button 
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={16} /> Users
          </button>
          <button 
            className={`tab-btn ${activeTab === "approvals" ? "active" : ""}`}
            onClick={() => setActiveTab("approvals")}
          >
            <CheckSquare size={16} /> Approvals
            {pendingApprovals.length > 0 && (
              <span className="badge">{pendingApprovals.length}</span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <BarChart2 size={16} /> Reports
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {/* Timetable Tab */}
          {activeTab === "timetable" && (
            <div className="timetable-section">
              <div className="section-header">
                <h2>Class Schedule</h2>
                <button 
                  className="action-btn primary" 
                  onClick={() => {
                    setModalData({
                      type: "newEvent",
                      data: { date: new Date().toISOString().split('T')[0] }
                    });
                    setIsModalOpen(true);
                  }}
                >
                  <PlusSquare size={16} /> Add Class
                </button>
              </div>
              
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                  }}
                  initialView="dayGridMonth"
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  events={events}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  eventContent={(eventInfo) => (
                    <>
                      <b>{eventInfo.event.title}</b>
                      <p>{eventInfo.event.extendedProps.lecturer}</p>
                      {eventInfo.event.extendedProps.room && (
                        <p>Room: {eventInfo.event.extendedProps.room}</p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          )}
          
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="users-section">
              <div className="users-container">
                <div className="user-list-section">
                  <h3>Lecturers ({lecturers.length})</h3>
                  <ul className="user-list">
                    {lecturers.map(lecturer => (
                      <li key={lecturer.id} className="user-item">
                        <div className="user-avatar">{lecturer.email.charAt(0).toUpperCase()}</div>
                        <div className="user-details">
                          <h4>{lecturer.email}</h4>
                          <p>{lecturer.department || "Department not set"}</p>
                        </div>
                        <div className="user-actions">
                          <button className="icon-btn"><Edit size={16} /></button>
                        </div>
                      </li>
                    ))}
                    {lecturers.length === 0 && <p>No lecturers found</p>}
                  </ul>
                </div>
                
                <div className="user-list-section">
                  <h3>Class Representatives ({classReps.length})</h3>
                  <ul className="user-list">
                    {classReps.map(rep => (
                      <li key={rep.id} className="user-item">
                        <div className="user-avatar">{rep.email.charAt(0).toUpperCase()}</div>
                        <div className="user-details">
                          <h4>{rep.email}</h4>
                          <p>{rep.course || "Course not set"}</p>
                        </div>
                        <div className="user-actions">
                          <button className="icon-btn"><Edit size={16} /></button>
                        </div>
                      </li>
                    ))}
                    {classReps.length === 0 && <p>No class representatives found</p>}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Approvals Tab */}
          {activeTab === "approvals" && (
            <div className="approvals-section">
              <h3>Pending Account Approvals ({pendingApprovals.length})</h3>
              {pendingApprovals.length === 0 ? (
                <p>No pending approvals</p>
              ) : (
                <ul className="approvals-list">
                  {pendingApprovals.map(user => (
                    <li key={user.id} className="approval-item">
                      <div className="approval-details">
                        <h4>{user.email}</h4>
                        <p>Role: {user.role}</p>
                        {user.department && <p>Department: {user.department}</p>}
                        {user.course && <p>Course: {user.course}</p>}
                        <p>Requested: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="approval-actions">
                        <button 
                          className="action-btn success"
                          onClick={() => handleApproveUser(user.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="action-btn danger"
                          onClick={() => handleRejectUser(user.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="reports-section">
              <h3>Attendance Reports</h3>
              <div className="report-actions">
                <button className="action-btn primary" onClick={generateReport}>
                  <FileText size={16} /> Generate Attendance Report
                </button>
              </div>
              
              <div className="attendance-summary">
                <h4>Attendance Overview</h4>
                <div className="attendance-chart">
                  <div 
                    className="attendance-bar" 
                    style={{ width: `${stats.attendanceRate}%` }}
                  >
                    {stats.attendanceRate}%
                  </div>
                </div>
                <p>Overall attendance rate across all classes</p>
              </div>
              
              <h4>Recent Classes</h4>
              <ul className="recent-classes">
                {events
                  .filter(event => new Date(event.start) <= new Date())
                  .sort((a, b) => new Date(b.start) - new Date(a.start))
                  .slice(0, 5)
                  .map(event => (
                    <li key={event.id} className="recent-class-item">
                      <div className="class-details">
                        <h5>{event.title}</h5>
                        <p>Lecturer: {event.lecturer}</p>
                        <p>Date: {new Date(event.start).toLocaleDateString()}</p>
                      </div>
                      <div className="attendance-indicator">
                        <span>{Math.floor(Math.random() * 30) + 70}%</span>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Event Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>{modalData.type === "newEvent" ? "Schedule New Class" : "Edit Class"}</h3>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <EventForm 
                initialData={modalData.data}
                lecturers={lecturers}
                classReps={classReps}
                onSubmit={async (data) => {
                  let success;
                  if (modalData.type === "newEvent") {
                    success = await handleCreateEvent(data);
                  } else {
                    success = await handleUpdateEvent(modalData.data.id, data);
                  }
                  
                  if (success) setIsModalOpen(false);
                }}
                onCancel={() => setIsModalOpen(false)}
                onDelete={modalData.type === "editEvent" ? () => {
                  handleEventDelete(modalData.data.id);
                  setIsModalOpen(false);
                } : null}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Event Form Component
const EventForm = ({ initialData, lecturers, classReps, onSubmit, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    course: initialData.course || "",
    lecturer: initialData.lecturer || "",
    room: initialData.room || "",
    classRep: initialData.classRep || "",
    start: initialData.date || initialData.start || new Date().toISOString().split('T')[0],
    end: initialData.end || initialData.date || new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <div className="form-group">
        <label>Class Title</label>
        <input 
          type="text" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          placeholder="Introduction to Programming"
        />
      </div>
      
      <div className="form-group">
        <label>Course Code</label>
        <input 
          type="text" 
          name="course" 
          value={formData.course} 
          onChange={handleChange} 
          placeholder="CS101"
        />
      </div>
      
      <div className="form-group">
        <label>Lecturer</label>
        <select 
          name="lecturer" 
          value={formData.lecturer} 
          onChange={handleChange} 
          required
        >
          <option value="">Select a lecturer</option>
          {lecturers.map(lecturer => (
            <option key={lecturer.id} value={lecturer.email}>{lecturer.email}</option>
          ))}
          <option value="new">Add New Lecturer</option>
        </select>
        {formData.lecturer === "new" && (
          <input 
            type="text" 
            name="newLecturer" 
            placeholder="Enter new lecturer email" 
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              lecturer: e.target.value 
            }))} 
          />
        )}
      </div>
      
      <div className="form-group">
        <label>Class Representative</label>
        <select 
          name="classRep" 
          value={formData.classRep} 
          onChange={handleChange}
        >
          <option value="">Select a class rep</option>
          {classReps.map(rep => (
            <option key={rep.id} value={rep.email}>{rep.email}</option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Room</label>
        <input 
          type="text" 
          name="room" 
          value={formData.room} 
          onChange={handleChange} 
          placeholder="A101"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Start Date</label>
          <input 
            type="datetime-local" 
            name="start" 
            value={formData.start} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>End Date</label>
          <input 
            type="datetime-local" 
            name="end" 
            value={formData.end} 
            onChange={handleChange} 
            required 
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        {onDelete && (
          <button type="button" className="delete-btn" onClick={onDelete}>Delete</button>
        )}
        <button type="submit" className="submit-btn">Save</button>
      </div>
    </form>
  );
};

export default AdminDashboard;