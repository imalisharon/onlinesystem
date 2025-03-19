import React, { useState } from "react";
import { 
  Grid, 
  Calendar, 
  Users, 
  Bell, 
  BarChart2, 
  BookOpen, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Clock,
  MessageSquare,
  FileText,
  AlertTriangle,
  Share2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../styles.css";

const DashboardLayout = ({ children, userRole = "admin" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // Normalize userRole casing
  const safeUserRole = userRole.toLowerCase() === "classrep" ? "classRep" : userRole;
  
  // Configuration for different user roles
  const roleConfig = {
    admin: {
      title: "Admin User",
      subtitle: "Administrator",
      avatar: "A",
      navItems: [
        { icon: <Calendar size={18} />, text: "Timetable", link: "/admin-dashboard" },
        { icon: <Users size={18} />, text: "Users", link: "/users" },
        { icon: <CheckSquare size={18} />, text: "Approvals", link: "/approvals" },
        { icon: <BarChart2 size={18} />, text: "Reports", link: "/reports" },
        { icon: <BookOpen size={18} />, text: "Courses", link: "/courses" }
      ],
      theme: "admin-theme"
    },
    lecturer: {
      title: "Lecturer",
      subtitle: "Faculty",
      avatar: "L",
      navItems: [
        { icon: <Calendar size={18} />, text: "Timetable", link: "/lecturer-dashboard" },
        { icon: <Users size={18} />, text: "Students", link: "/students" },
        { icon: <Clock size={18} />, text: "Today's Classes", link: "/today-classes" },
        { icon: <FileText size={18} />, text: "Lesson Plans", link: "/lesson-plans" },
        { icon: <Bell size={18} />, text: "Attendance", link: "/attendance" },
        { icon: <MessageSquare size={18} />, text: "Messages", link: "/messages" },
        { icon: <BarChart2 size={18} />, text: "Reports", link: "/reports" }
      ],
      theme: "lecturer-theme"
    },
    classRep: {
      title: "Class Rep",
      subtitle: "Student",
      avatar: "C",
      navItems: [
        { icon: <Calendar size={18} />, text: "Timetable", link: "/class-rep-dashboard" },
        { icon: <Users size={18} />, text: "Students", link: "/students" },
        { icon: <Bell size={18} />, text: "Attendance", link: "/attendance-tracking" },
        { icon: <AlertTriangle size={18} />, text: "Conflicts", link: "/conflicts" },
        { icon: <Share2 size={18} />, text: "Share", link: "/share" },
        { icon: <MessageSquare size={18} />, text: "Messages", link: "/messages" },
        { icon: <BarChart2 size={18} />, text: "Reports", link: "/reports" }
      ],
      theme: "classrep-theme"
    }
  };

  // Get configuration for current user role
  const config = roleConfig[safeUserRole] || roleConfig.admin;

  // Determine logo text based on user role
  const logoText = "UniPortal";

  return (
    <div className={`dashboard-layout ${config.theme}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="mobile-title">{logoText}</h1>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <Grid size={24} className="logo-icon" />
            <h2 className="logo-text">{logoText}</h2>
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="profile-section">
          <div className="avatar">{config.avatar}</div>
          <div className="profile-info">
            <h3>{config.title}</h3>
            <p>{config.subtitle}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {config.navItems.map((item, index) => (
              <li 
                key={index} 
                className={`nav-item ${location.pathname === item.link ? 'active' : ''}`}
              >
                <Link to={item.link}>
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="settings-btn">
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;