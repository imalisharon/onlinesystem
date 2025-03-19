import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, query, where, doc, updateDoc, getDoc } from "firebase/firestore";

const ClassRepDashboard = ({ className, userInfo }) => {
  // State management
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendanceFeedback, setAttendanceFeedback] = useState("");
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    attended: 0,
    lateOrCancelled: 0
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeTab, setActiveTab] = useState("calendar");
  const [conflictReport, setConflictReport] = useState("");
  const [students, setStudents] = useState([]);
  const [sharedEvents, setSharedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!className) return;
      
      setIsLoading(true);
      
      // Fetch timetable
      const q = query(collection(db, "timetable"), where("class", "==", className));
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        title: doc.data().title || doc.data().subject,
        backgroundColor: doc.data().status === "cancelled" ? "#FCA5A5" : 
                          doc.data().status === "late" ? "#FCD34D" : "#93C5FD"
      }));
      setEvents(fetchedEvents);
      
      // Calculate upcoming classes (next 48 hours)
      const now = new Date();
      const future = new Date(now.getTime() + (48 * 60 * 60 * 1000));
      const upcoming = fetchedEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate > now && eventDate < future;
      });
      setUpcomingClasses(upcoming);
      
      // Fetch attendance stats
      const statsQuery = query(collection(db, "attendanceStats"), where("class", "==", className));
      const statsSnapshot = await getDocs(statsQuery);
      if (!statsSnapshot.empty) {
        setAttendanceStats(statsSnapshot.docs[0].data());
      }
      
      // Fetch students in this class
      const studentsQuery = query(collection(db, "students"), where("class", "==", className));
      const studentsSnapshot = await getDocs(studentsQuery);
      setStudents(studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      // Fetch previously shared events
      const sharedQuery = query(collection(db, "sharedSchedules"), where("class", "==", className));
      const sharedSnapshot = await getDocs(sharedQuery);
      setSharedEvents(sharedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [className]);

  // Handle calendar event click
  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      location: clickInfo.event.extendedProps.location,
      lecturer: clickInfo.event.extendedProps.lecturer,
      status: clickInfo.event.extendedProps.status || "scheduled"
    });
  };

  // Submit attendance feedback
  const handleFeedbackSubmit = async () => {
    if (!attendanceFeedback.trim()) {
      alert("Please enter feedback before submitting.");
      return;
    }
    
    try {
      setIsLoading(true);
      await addDoc(collection(db, "attendanceFeedback"), {
        class: className,
        feedback: attendanceFeedback,
        timestamp: new Date(),
        submittedBy: userInfo?.name || "Class Representative"
      });
      
      setAttendanceFeedback("");
      setIsLoading(false);
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      alert("Failed to submit feedback. Please try again.");
      setIsLoading(false);
    }
  };

  // Report scheduling conflict
  const handleConflictReport = async () => {
    if (!conflictReport.trim()) {
      alert("Please describe the scheduling conflict.");
      return;
    }
    
    try {
      setIsLoading(true);
      await addDoc(collection(db, "scheduleConflicts"), {
        class: className,
        report: conflictReport,
        timestamp: new Date(),
        status: "pending",
        submittedBy: userInfo?.name || "Class Representative"
      });
      
      setConflictReport("");
      setIsLoading(false);
      alert("Conflict report submitted to admin!");
    } catch (error) {
      console.error("Error reporting conflict: ", error);
      alert("Failed to report conflict. Please try again.");
      setIsLoading(false);
    }
  };

  // Share timetable with students
  const handleShareSchedule = async () => {
    try {
      setIsLoading(true);
      
      // Filter out only upcoming events to share
      const now = new Date();
      const eventsToShare = events.filter(event => new Date(event.start) > now);
      
      await addDoc(collection(db, "sharedSchedules"), {
        class: className,
        events: eventsToShare,
        sharedBy: userInfo?.name || "Class Representative",
        sharedAt: new Date()
      });
      
      // Update local state to reflect the share
      setSharedEvents([...sharedEvents, {
        events: eventsToShare,
        sharedAt: new Date()
      }]);
      
      setIsLoading(false);
      alert("Schedule shared with students!");
    } catch (error) {
      console.error("Error sharing schedule: ", error);
      alert("Failed to share schedule. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Icons as components for better maintainability
  const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
    </svg>
  );
  
  const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
  
  const ExclamationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
  
  const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
  
  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
  
  const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon status-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon status-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <DashboardLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Class Representative Dashboard</h1>
            <p className="dashboard-subtitle">Managing schedules and attendance for {className}</p>
          </div>
          
          <div className="dashboard-nav">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`dashboard-nav-button ${activeTab === "calendar" ? "active" : ""}`}
            >
              <CalendarIcon />
              Calendar
            </button>
            
            <button
              onClick={() => setActiveTab("feedback")}
              className={`dashboard-nav-button ${activeTab === "feedback" ? "active" : ""}`}
            >
              <BellIcon />
              Attendance
            </button>
            
            <button
              onClick={() => setActiveTab("conflicts")}
              className={`dashboard-nav-button ${activeTab === "conflicts" ? "active" : ""}`}
            >
              <ExclamationIcon />
              Conflicts
            </button>
            
            <button
              onClick={() => setActiveTab("share")}
              className={`dashboard-nav-button ${activeTab === "share" ? "active" : ""}`}
            >
              <ShareIcon />
              Share
            </button>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="dashboard-card">
              <div className="calendar-layout">
                <div className="calendar-container">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    height="auto"
                    events={events}
                    eventClick={handleEventClick}
                    businessHours={{
                      daysOfWeek: [1, 2, 3, 4, 5],
                      startTime: '08:00',
                      endTime: '18:00',
                    }}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                  />
                </div>
                
                <div className="dashboard-sidebar">
                  <h3 className="sidebar-heading">Upcoming Classes</h3>
                  
                  {upcomingClasses.length === 0 ? (
                    <p className="empty-message">No upcoming classes in the next 48 hours</p>
                  ) : (
                    <div className="upcoming-classes">
                      {upcomingClasses.map(event => (
                        <div key={event.id} className="upcoming-class-card">
                          <div className="upcoming-class-title">{event.title}</div>
                          <div className="upcoming-class-details">
                            <div className="detail-row">
                              <ClockIcon />
                              {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div className="detail-row">
                              <UserGroupIcon />
                              {event.lecturer}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="stats-container">
                    <h3 className="sidebar-heading">Attendance Stats</h3>
                    <div className="stats-grid">
                      <div>
                        <div className="stat-value stat-total">{attendanceStats.total}</div>
                        <div className="stat-label">Total</div>
                      </div>
                      <div>
                        <div className="stat-value stat-attended">{attendanceStats.attended}</div>
                        <div className="stat-label">Attended</div>
                      </div>
                      <div>
                        <div className="stat-value stat-issues">{attendanceStats.lateOrCancelled}</div>
                        <div className="stat-label">Late/Cancelled</div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedEvent && (
                    <div className="selected-event">
                      <h3 className="sidebar-heading">Selected Class</h3>
                      <div className="event-card">
                        <h4 className="event-title">{selectedEvent.title}</h4>
                        <div className="event-details">
                          <div className="detail-row">
                            <CalendarIcon />
                            {new Date(selectedEvent.start).toLocaleDateString()}
                          </div>
                          <div className="detail-row">
                            <ClockIcon />
                            {new Date(selectedEvent.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(selectedEvent.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="detail-row">
                            <UserGroupIcon />
                            {selectedEvent.lecturer}
                          </div>
                          <div>
                            <span className={`event-status 
                              ${selectedEvent.status === 'cancelled' ? 'status-cancelled' : 
                                selectedEvent.status === 'late' ? 'status-late' : 
                                'status-scheduled'}`}>
                              {selectedEvent.status === 'cancelled' ? (
                                <>
                                  <XCircleIcon />
                                  Cancelled
                                </>
                              ) : selectedEvent.status === 'late' ? (
                                <>
                                  <ClockIcon />
                                  Late
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon />
                                  Scheduled
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Attendance Feedback Tab */}
          {activeTab === "feedback" && (
            <div className="dashboard-card form-section">
              <h2 className="form-title">Weekly Attendance Feedback</h2>
              <p className="form-description">
                Report any issues with lecturer attendance, late arrivals, or cancellations.
                Your feedback helps administration maintain teaching quality.
              </p>
              
              <div className="form-group">
                <label className="form-label">
                  Attendance Issues and Feedback
                </label>
                <textarea
                  value={attendanceFeedback}
                  onChange={(e) => setAttendanceFeedback(e.target.value)}
                  placeholder="Describe any attendance issues or patterns, late arrivals, or early dismissals..."
                  className="form-textarea"
                  rows={6}
                />
              </div>
              
              <button
                onClick={handleFeedbackSubmit}
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? "Submitting..." : "Submit Attendance Feedback"}
              </button>
            </div>
          )}
          {/* Conflicts Tab */}
          {activeTab === "conflicts" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Report Scheduling Conflicts</h2>
              <p className="text-gray-600 mb-4">
                Report any timetable conflicts, room double-bookings, or scheduling issues.
                Your reports are sent directly to the administration for resolution.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conflict Description
                </label>
                <textarea
                  value={conflictReport}
                  onChange={(e) => setConflictReport(e.target.value)}
                  placeholder="Describe the scheduling conflict in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={6}
                />
              </div>
              
              <button
                onClick={handleConflictReport}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Submitting..." : "Report Conflict to Admin"}
              </button>
            </div>
          )}
          
          {/* Share Tab */}
          {activeTab === "share" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Share Timetable with Students</h2>
              <p className="text-gray-600 mb-4">
                Share the current timetable with all students in your class. This will send a notification
                to all registered students with the latest schedule information.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-blue-700 mb-2">Sharing Information</h3>
                <ul className="text-sm text-blue-700 list-disc list-inside">
                  <li>Your class has {students.length} registered students</li>
                  <li>Last shared: {sharedEvents.length > 0 ? new Date(sharedEvents[sharedEvents.length - 1].sharedAt).toLocaleString() : "Never"}</li>
                  <li>Upcoming events to share: {events.filter(event => new Date(event.start) > new Date()).length}</li>
                </ul>
              </div>
              
              <button
                onClick={handleShareSchedule}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Sharing..." : "Share Current Schedule with Class"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
/* General Layout */
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 700;
  color: #4338ca;
  margin: 0;
}

.dashboard-subtitle {
  color: #6b7280;
  margin: 4px 0 0 0;
}

.dashboard-nav {
  display: flex;
  gap: 16px;
}

.dashboard-nav-button {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #6b7280;
}

.dashboard-nav-button:hover {
  background-color: #f3f4f6;
}

.dashboard-nav-button.active {
  background-color: #e0e7ff;
  color: #4338ca;
}

.dashboard-nav-button svg {
  width: 20px;
  height: 20px;
  margin-right: 4px;
}

.dashboard-content {
  flex: 1;
}

.dashboard-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

/* Calendar Layout */
.calendar-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 1024px) {
  .calendar-layout {
    grid-template-columns: 3fr 1fr;
  }
}

.calendar-container {
  min-height: 600px;
}

.dashboard-sidebar {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.sidebar-heading {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.empty-message {
  color: #6b7280;
}

/* Upcoming Classes */
.upcoming-classes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-class-card {
  background-color: #ffffff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.upcoming-class-title {
  font-weight: 500;
  margin: 0 0 4px 0;
}

.upcoming-class-details {
  font-size: 14px;
  color: #6b7280;
}

.detail-row {
  display: flex;
  align-items: center;
}

.detail-row svg {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

/* Stats Component */
.stats-container {
  margin-top: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-total {
  color: #3b82f6;
}

.stat-attended {
  color: #10b981;
}

.stat-issues {
  color: #f59e0b;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

/* Selected Event Card */
.selected-event {
  margin-top: 24px;
}

.event-card {
  background-color: #ffffff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.event-title {
  font-weight: 500;
  margin: 0 0 8px 0;
}

.event-details {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
}

.status-scheduled {
  background-color: #d1fae5;
  color: #065f46;
}

.status-late {
  background-color: #fef3c7;
  color: #92400e;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
}

/* Forms */
.form-section {
  padding: 24px;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.form-description {
  color: #6b7280;
  margin: 0 0 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  font-size: 14px;
}

.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.submit-button {
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: #4338ca;
}

.submit-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Info Box */
.info-box {
  background-color: #eff6ff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-title {
  font-weight: 500;
  color: #1e40af;
  margin: 0 0 8px 0;
}

.info-list {
  list-style-type: disc;
  padding-left: 24px;
  font-size: 14px;
  color: #1e40af;
}

/* Full Calendar Overrides */
.fc .fc-toolbar-title {
  font-size: 20px;
}

.fc .fc-button-primary {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.fc .fc-button-primary:hover {
  background-color: #4338ca;
  border-color: #4338ca;
}

.fc .fc-button-primary:disabled {
  background-color: #6b7280;
  border-color: #6b7280;
}

.fc .fc-today-button {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.fc .fc-today-button:disabled {
  background-color: #6b7280;
  border-color: #6b7280;
}

.fc .fc-event {
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.fc .fc-event-main {
  padding: 2px 4px;
}
      `}</style>

    </DashboardLayout>
  );
};

export default ClassRepDashboard;