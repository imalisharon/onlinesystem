import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../images/logo.png';

function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`home-container ${isVisible ? 'fade-in' : ''}`}>
      {/* Top Bar - Simplified */}
      <div className="top-bar">
        <div className="time-display">
          {currentTime.toLocaleTimeString()}
        </div>
        <div className="quick-links">
          <a href="#contact">Contact</a>
          <a href="#help">Help</a>
        </div>
      </div>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="animated-background"></div>
        <div className="hero-content">
          <div className="logo-container">
            <div className="university-logo">
            <img src={logo} alt="University Logo" className="logo" />
            </div>
          </div>
          <h1>Technical University of Mombasa</h1>
          <h2>Smart Timetable Management System</h2>
          <p>Experience the next generation of academic scheduling</p>
          <div className="hero-buttons">
            <Link to="/login">
              <button className="primary-button pulse">
                <span className="button-text">Login</span>
                <span className="button-icon">→</span>
              </button>
            </Link>
            <Link to="/signup">
              <button className="secondary-button">
                <span className="button-text">Sign Up</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Counter Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Departments</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">1000+</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Support</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Advanced Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon smart-icon"></div>
            <h3>Smart Scheduling</h3>
            <p>AI-powered timetable generation with conflict resolution</p>
            <div className="feature-hover">
              <span className="learn-more">Learn More</span>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon realtime-icon"></div>
            <h3>Real-time Updates</h3>
            <p>Instant notifications and live schedule changes</p>
            <div className="feature-hover">
              <span className="learn-more">Learn More</span>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon access-icon"></div>
            <h3>Smart Access Control</h3>
            <p>Role-based permissions and secure authentication</p>
            <div className="feature-hover">
              <span className="learn-more">Learn More</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Dashboard */}
      <section className="dashboard-section">
        <h2>Quick Access Dashboard</h2>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon calendar"></div>
            <h3>Academic Calendar</h3>
            <p>View and manage academic schedules</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon departments"></div>
            <h3>Departments</h3>
            <p>Access department portals</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon notifications"></div>
            <h3>Notifications</h3>
            <p>Stay updated with alerts</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon resources"></div>
            <h3>Resources</h3>
            <p>Access learning materials</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join our modern timetable management system today</p>
          <Link to="/signup">
            <button className="cta-button">Create Account</button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>Email: info@tum.ac.ke</p>
            <p>Phone: +254 123 456 789</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <a href="#about">About Us</a>
            <a href="#help">Help Center</a>
            <a href="#privacy">Privacy Policy</a>
          </div>
          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#" className="social-icon facebook"></a>
              <a href="#" className="social-icon twitter"></a>
              <a href="#" className="social-icon linkedin"></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 Technical University of Mombasa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;