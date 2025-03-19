import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Clock, Calendar, Bell, Users, BookOpen, MessageSquare } from "lucide-react";

const LecturerDashboard = ({ lecturerName, lecturerId }) => {
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("timeGridWeek");
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  // Fetch events assigned to the logged-in lecturer
  useEffect(() => {
    const fetchLecturerData = async () => {
      try {
        setIsLoading(true);
        if (!lecturerId) return;
        
        // Fetch scheduled classes
        const eventsQuery = query(
          collection(db, "timetable"), 
          where("lecturer", "==", lecturerName)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const fetchedEvents = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().title || doc.data().courseName,
          allDay: false,
          extendedProps: {
            location: doc.data().location,
            students: doc.data().students || 0,
            notes: doc.data().notes || "",
          }
        }));
        
        // Fetch personal reminders
        const remindersQuery = query(
          collection(db, "reminders"),
          where("lecturerId", "==", lecturerId)
        );
        const remindersSnapshot = await getDocs(remindersQuery);
        const fetchedReminders = remindersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Fetch attendance data
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("lecturerId", "==", lecturerId)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceMap = {};
        attendanceSnapshot.docs.forEach(doc => {
          const data = doc.data();
          attendanceMap[data.eventId] = data;
        });
        
        setEvents(fetchedEvents);
        setReminders(fetchedReminders);
        setAttendanceData(attendanceMap);
      } catch (error) {
        toast.error("Failed to load your schedule. Please try again.");
        console.error("Error fetching lecturer data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLecturerData();
  }, [lecturerId, lecturerName]);

  // Handle adding a personal reminder
  const handleAddReminder = async () => {
    if (!reminderText || !reminderDate) {
      toast.warning("Please fill in all reminder details");
      return;
    }
    
    try {
      const newReminder = {
        title: reminderText,
        date: reminderDate,
        lecturerId: lecturerId,
        created: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, "reminders"), newReminder);
      setReminders([...reminders, { ...newReminder, id: docRef.id }]);
      setReminderText("");
      setReminderDate("");
      setShowReminderModal(false);
      toast.success("Reminder added successfully");
    } catch (error) {
      toast.error("Failed to add reminder");
      console.error("Error adding reminder:", error);
    }
  };

  // Handle event click to show details
  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      location: info.event.extendedProps.location,
      students: info.event.extendedProps.students,
      notes: info.event.extendedProps.notes,
    });
    setShowEventModal(true);
  };

  // Handle requesting schedule change
  const handleRequestChange = async () => {
    if (!selectedEvent) return;
    
    try {
      await addDoc(collection(db, "changeRequests"), {
        eventId: selectedEvent.id,
        lecturerId: lecturerId,
        lecturerName: lecturerName,
        requestDate: new Date().toISOString(),
        status: "pending",
        reason: document.getElementById("changeReason").value,
      });
      
      toast.success("Change request submitted successfully");
      setShowEventModal(false);
    } catch (error) {
      toast.error("Failed to submit change request");
      console.error("Error submitting change request:", error);
    }
  };

  // Update attendance feedback
  const handleAttendanceUpdate = async (eventId, attendanceCount) => {
    try {
      const attendanceRef = doc(db, "attendance", eventId);
      await updateDoc(attendanceRef, {
        count: attendanceCount,
        updatedAt: new Date().toISOString(),
      });
      
      toast.success("Attendance updated");
      setAttendanceData({
        ...attendanceData,
        [eventId]: { ...attendanceData[eventId], count: attendanceCount }
      });
    } catch (error) {
      toast.error("Failed to update attendance");
      console.error("Error updating attendance:", error);
    }
  };

  // Get events for today
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  // Calculate weekly stats
  const weeklyStats = {
    totalClasses: events.length,
    upcomingToday: todayEvents.length,
    remindersCount: reminders.length,
  };

  return (
    <DashboardLayout userRole="lecturer">
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome, {lecturerName}</h1>
        <p className="welcome-subtitle">Manage your teaching schedule and class activities</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Stats Cards */}
          <div className="stats-container">
            <div className="stat-card indigo">
              <div className="stat-icon">
                <Calendar className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Weekly Classes</p>
                <p className="stat-value">{weeklyStats.totalClasses}</p>
              </div>
            </div>
            
            <div className="stat-card green">
              <div className="stat-icon">
                <Clock className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Today's Classes</p>
                <p className="stat-value">{weeklyStats.upcomingToday}</p>
              </div>
            </div>
            
            <div className="stat-card amber">
              <div className="stat-icon">
                <Bell className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Reminders</p>
                <p className="stat-value">{weeklyStats.remindersCount}</p>
              </div>
            </div>
          </div>
          
          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Schedule Calendar</h2>
                <div className="view-buttons">
                  <button 
                    onClick={() => setViewMode("timeGridDay")}
                    className={`view-button ${viewMode === "timeGridDay" ? "active" : ""}`}
                  >
                    Day
                  </button>
                  <button 
                    onClick={() => setViewMode("timeGridWeek")}
                    className={`view-button ${viewMode === "timeGridWeek" ? "active" : ""}`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setViewMode("dayGridMonth")}
                    className={`view-button ${viewMode === "dayGridMonth" ? "active" : ""}`}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setViewMode("listWeek")}
                    className={`view-button ${viewMode === "listWeek" ? "active" : ""}`}
                  >
                    List
                  </button>
                </div>
              </div>
              
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                  initialView={viewMode}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                  }}
                  events={[
                    ...events,
                    ...reminders.map(reminder => ({
                      id: reminder.id,
                      title: `📌 ${reminder.title}`,
                      start: reminder.date,
                      backgroundColor: '#FCD34D',
                      borderColor: '#F59E0B',
                      textColor: '#000000',
                    }))
                  ]}
                  eventClick={handleEventClick}
                  height="auto"
                  aspectRatio={1.8}
                  nowIndicator={true}
                  slotMinTime="07:00:00"
                  slotMaxTime="21:00:00"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: true
                  }}
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: '08:00',
                    endTime: '18:00',
                  }}
                  eventClassNames={(arg) => {
                    if (arg.event.title.includes('📌')) {
                      return ['reminder-event'];
                    }
                    return ['class-event'];
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Side Panel */}
          <div className="side-panel">
            {/* Today's Classes */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Clock className="header-icon" /> Today's Classes
                </h2>
              </div>
              <div className="card-content">
                {todayEvents.length > 0 ? (
                  <ul className="event-list">
                    {todayEvents.map(event => (
                      <li key={event.id} className="event-item">
                        <p className="event-title">{event.title}</p>
                        <p className="event-time">
                          {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="event-location">{event.extendedProps.location}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No classes scheduled for today</p>
                )}
              </div>
            </div>
            
            {/* Reminders */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Bell className="header-icon" /> Your Reminders
                </h2>
                <button 
                  onClick={() => setShowReminderModal(true)}
                  className="add-button"
                >
                  + Add
                </button>
              </div>
              <div className="card-content">
                {reminders.length > 0 ? (
                  <ul className="reminder-list">
                    {reminders.slice(0, 3).map(reminder => (
                      <li key={reminder.id} className="reminder-item">
                        <p className="reminder-title">{reminder.title}</p>
                        <p className="reminder-date">
                          {new Date(reminder.date).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                    {reminders.length > 3 && (
                      <p className="view-all">
                        View all ({reminders.length})
                      </p>
                    )}
                  </ul>
                ) : (
                  <p className="no-data">No reminders set</p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="card">
              <h2 className="card-title">Quick Actions</h2>
              <div className="quick-actions">
                <button className="action-button">
                  <Users className="action-icon" />
                  <span>Attendance</span>
                </button>
                <button className="action-button">
                  <BookOpen className="action-icon" />
                  <span>Lesson Plans</span>
                </button>
                <button className="action-button">
                  <MessageSquare className="action-icon" />
                  <span>Message</span>
                </button>
                <button className="action-button">
                  <Calendar className="action-icon" />
                  <span>Schedule</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="modal-title">Add Personal Reminder</h3>
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Reminder</label>
                <input
                  type="text"
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  className="form-input"
                  placeholder="Enter reminder text"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowReminderModal(false)}
                className="button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="button-primary"
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="modal-title">{selectedEvent.title}</h3>
            <p className="event-datetime">
              {new Date(selectedEvent.start).toLocaleString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <div className="modal-content">
              <div className="event-details">
                <p className="event-detail">
                  <span className="detail-label">Location:</span>
                  <span>{selectedEvent.location || 'Not specified'}</span>
                </p>
                <p className="event-detail">
                  <span className="detail-label">Students:</span>
                  <span>{selectedEvent.students || '0'}</span>
                </p>
                <p className="event-detail">
                  <span className="detail-label">Notes:</span>
                  <span>{selectedEvent.notes || 'No notes available'}</span>
                </p>
              </div>
              
              {/* Attendance Form */}
              <div className="attendance-section">
                <h4 className="section-title">Update Attendance</h4>
                <div className="attendance-form">
                  <input 
                    type="number" 
                    id="attendanceCount"
                    min="0"
                    max={selectedEvent.students || 100}
                    defaultValue={attendanceData[selectedEvent.id]?.count || 0}
                    className="attendance-input"
                  />
                  <span className="attendance-label">of {selectedEvent.students || '?'} students</span>
                </div>
                <button
                  onClick={() => handleAttendanceUpdate(
                    selectedEvent.id, 
                    document.getElementById('attendanceCount').value
                  )}
                  className="update-button"
                >
                  Update Attendance
                </button>
              </div>
              
              {/* Request Change Form */}
              <div className="change-request-section">
                <h4 className="section-title">Request Schedule Change</h4>
                <textarea
                  id="changeReason"
                  className="change-reason"
                  placeholder="Reason for change request"
                  rows="2"
                ></textarea>
                <button
                  onClick={handleRequestChange}
                  className="request-button"
                >
                  Submit Change Request
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowEventModal(false)}
                className="button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{` 
  .welcome-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 24px;
  font-weight: bold;
  color: #4f46e5;
  margin-bottom: 8px;
}

.welcome-subtitle {
  color: #6b7280;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 256px;
}

.loading-spinner {
  height: 48px;
  width: 48px;
  border-radius: 50%;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4f46e5;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 3fr 1fr;
  }
  
  .stats-container {
    grid-column: 1 / -1;
  }
}

/* Stats cards */
.stats-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card.indigo {
  background-color: #eef2ff;
}

.stat-card.green {
  background-color: #ecfdf5;
}

.stat-card.amber {
  background-color: #fffbeb;
}

.stat-icon {
  border-radius: 50%;
  padding: 12px;
  margin-right: 16px;
}

.stat-card.indigo .stat-icon {
  background-color: #e0e7ff;
}

.stat-card.green .stat-icon {
  background-color: #d1fae5;
}

.stat-card.amber .stat-icon {
  background-color: #fef3c7;
}

.icon {
  height: 24px;
  width: 24px;
}

.stat-card.indigo .icon {
  color: #4f46e5;
}

.stat-card.green .icon {
  color: #059669;
}

.stat-card.amber .icon {
  color: #d97706;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

/* Card styles */
.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
}

.header-icon {
  height: 16px;
  width: 16px;
  margin-right: 8px;
}

.view-buttons {
  display: flex;
  gap: 8px;
}

.view-button {
  padding: 4px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  background-color: #f3f4f6;
  cursor: pointer;
}

.view-button.active {
  background-color: #4f46e5;
  color: white;
}

/* Calendar styles */
.calendar-container {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
}

/* Event list styles */
.event-list {
  list-style-type: none;
}

.event-item {
  border-left: 4px solid #4f46e5;
  padding-left: 12px;
  padding-top: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.event-item:hover {
  background-color: #f9fafb;
}

.event-title {
  font-weight: 500;
}

.event-time {
  font-size: 14px;
  color: #6b7280;
}

.event-location {
  font-size: 14px;
  color: #9ca3af;
}

/* Reminder styles */
.add-button {
  font-size: 12px;
  padding: 4px 8px;
  background-color: #fef3c7;
  color: #92400e;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}

.add-button:hover {
  background-color: #fde68a;
}

.reminder-list {
  list-style-type: none;
}

.reminder-item {
  background-color: #fffbeb;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.reminder-title {
  font-weight: 500;
}

.reminder-date {
  font-size: 12px;
  color: #6b7280;
}

.view-all {
  font-size: 12px;
  text-align: right;
  color: #4f46e5;
  cursor: pointer;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
}

/* Quick actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.action-button {
  padding: 8px;
  background-color: #eef2ff;
  border-radius: 8px;
  text-align: center;
  border: none;
  cursor: pointer;
}

.action-button:hover {
  background-color: #e0e7ff;
}

.action-icon {
  height: 20px;
  width: 20px;
  margin: 0 auto 4px auto;
  display: block;
  color: #4f46e5;
}

.action-button span {
  font-size: 12px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.event-datetime {
  color: #6b7280;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.button-primary {
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.button-secondary {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
}

/* Event details */
.event-details {
  margin-bottom: 16px;
}

.event-detail {
  display: flex;
  margin-bottom: 12px;
}

.detail-label {
  width: 96px;
  color: #6b7280;
}

/* Attendance section */
.attendance-section, .change-request-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.attendance-form {
  display: flex;
  align-items: center;
}

.attendance-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-right: 8px;
}

.attendance-label {
  color: #6b7280;
}

.update-button {
  margin-top: 8px;
  padding: 4px 12px;
  background-color: #ecfdf5;
  color: #059669;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.change-reason {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: vertical;
}

.request-button {
  margin-top: 8px;
  padding: 4px 12px;
  background-color: #fffbeb;
  color: #92400e;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* FullCalendar custom styles */
.class-event {
  background-color: #4f46e5;
  border-color: #4338ca;
}

.reminder-event {
  background-color: #fcd34d;
  border-color: #f59e0b;
}
`}</style>
    </DashboardLayout>
  );
};

export default LecturerDashboard;