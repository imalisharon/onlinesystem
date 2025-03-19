import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Coffee, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInUser } from '../firebase/firebaseConfig';
import '../styles.css';

const Login = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Security features
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const MAX_LOGIN_ATTEMPTS = 3;
  const LOCK_DURATION = 30; // seconds
  
  // Check for remembered email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);
  
  // Handle countdown timer for account lockout
  useEffect(() => {
    let interval;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => prev - 1);
      }, 1000);
    } else if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing errors when user types
    if (error) setError('');
  };

  // Function to determine redirect path based on user role
  const getRedirectPath = (role) => {
    switch (role) {
      case 'Admin':
      case 'admin':
        return '/admin-dashboard';
      case 'Lecturer':
      case 'lecturer':
        return '/lecturer-dashboard';
      case 'ClassRep':
      case 'class_rep':
        return '/class-rep-dashboard';
      default:
        return '/';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      // Use the enhanced signInUser function from the updated firebase config
      const result = await signInUser(formData.email, formData.password);
      
      if (!result.success) {
        throw new Error(result.message || 'Login failed. Please try again.');
      }
      
      const userData = result.user;
      const userRole = userData.role;
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Show success message before redirect
      setSuccessMessage(`${result.message} Redirecting to ${userRole} Dashboard...`);
      
      // Redirect based on user role
      setTimeout(() => {
        navigate(getRedirectPath(userRole));
      }, 1500);
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Increment login attempts on failure
      setLoginAttempts(prev => {
        const newAttempts = prev + 1;
        
        // Lock account after max attempts
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          setIsLocked(true);
          setLockTimer(LOCK_DURATION);
        }
        
        return newAttempts;
      });
      
      // Use the error message directly if it comes from our enhanced signInUser
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const handleForgotPassword = () => {
    navigate('/reset-password', { state: { email: formData.email } });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          {/* Header */}
          <div className="login-header">
            <div className="logo">
              <Coffee className="logo-icon" />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to continue to your account</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="alert success">
              <Info className="alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="alert error">
              <AlertCircle className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="icon" />
                  ) : (
                    <Eye className="icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-actions">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="forgot-password"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className={`submit-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <div className="loader"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="button-icon" />
                </>
              )}
            </button>

            {/* Lock Timer */}
            {isLocked && (
              <p className="lock-message">
                Account temporarily locked. Try again in {lockTimer} seconds
              </p>
            )}

            {/* Attempts remaining message */}
            {!isLocked && loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
              <p className="attempts-warning">
                {MAX_LOGIN_ATTEMPTS - loginAttempts} login attempts remaining before temporary lockout
              </p>
            )}
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>Don't have an account? <a href="/signup">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;