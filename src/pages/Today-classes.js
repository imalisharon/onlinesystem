import React, { useState, useEffect } from 'react';
import { 
  validateEmailByRole, 
  createNewUser, 
  getAdminCount, 
  checkClassRepExists 
} from "../firebase/firebaseConfig";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    course: "",
    agreeToTerms: false,
    captchaAnswer: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  
  // State for department and course options
  const [departments, setDepartments] = useState({});
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Captcha state
  const [captcha, setCaptcha] = useState({
    firstNumber: 0,
    secondNumber: 0,
    operator: '',
    correctAnswer: 0
  });
  
  // Role-specific validation states
  const [adminCount, setAdminCount] = useState(0);
  const [emailValid, setEmailValid] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  // Initialize department and course data
  useEffect(() => {
    const departmentData = {
      "Computer Science": ["BTIT", "BSIT", "BSCS"],
      "Business": ["BCOM", "BBM", "BBA"],
      "Mathematics and Physics": ["BMCS", "BSMF", "BSSC"],
      "Engineering": ["BEEE", "BEBCE", "BSCE"]
    };
    setDepartments(departmentData);
    
    // Generate captcha on first load
    generateCaptcha();
    
    // Check admin count
    loadAdminCount();
  }, []);

  // Update available courses when department changes
  useEffect(() => {
    if (formData.department && departments[formData.department]) {
      setAvailableCourses(departments[formData.department]);
    } else {
      setAvailableCourses([]);
    }
    
    // Reset course when department changes
    if (formData.course) {
      setFormData(prev => ({
        ...prev,
        course: ""
      }));
    }
  }, [formData.department]);

  // Check if email is valid based on role
  useEffect(() => {
    if (formData.email && formData.role) {
      validateEmail();
    } else {
      setEmailValid(false);
    }
  }, [formData.email, formData.role, formData.department, formData.course]);

  // Load admin count using the new Firebase function
  const loadAdminCount = async () => {
    try {
      const count = await getAdminCount();
      setAdminCount(count);
    } catch (error) {
      console.error("Error loading admin count:", error);
      setAdminCount(0);
    }
  };

  // Generate math captcha
  const generateCaptcha = () => {
    const operators = ['+', '-', '*'];
    const firstNumber = Math.floor(Math.random() * 10) + 1;
    const secondNumber = Math.floor(Math.random() * 10) + 1;
    const operatorIndex = Math.floor(Math.random() * operators.length);
    const operator = operators[operatorIndex];
    
    let answer;
    switch (operator) {
      case '+':
        answer = firstNumber + secondNumber;
        break;
      case '-':
        // Ensure positive result
        if (firstNumber >= secondNumber) {
          answer = firstNumber - secondNumber;
        } else {
          answer = secondNumber - firstNumber;
          // Swap numbers to avoid negative results
          return setCaptcha({
            firstNumber: secondNumber,
            secondNumber: firstNumber,
            operator,
            correctAnswer: answer
          });
        }
        break;
      case '*':
        answer = firstNumber * secondNumber;
        break;
      default:
        answer = 0;
    }
    
    setCaptcha({
      firstNumber,
      secondNumber,
      operator,
      correctAnswer: answer
    });

    // Reset captcha answer in form
    setFormData(prev => ({
      ...prev,
      captchaAnswer: ""
    }));
  };

  // Validate email using the new Firebase function
  const validateEmail = async () => {
    if (!formData.email || !formData.role) return;
    
    setEmailChecking(true);
    setEmailValid(false);
    
    try {
      const result = await validateEmailByRole(
        formData.email,
        formData.role,
        formData.department,
        formData.course
      );
      
      setEmailValid(result.valid);
      if (!result.valid) {
        setError(result.error);
      } else {
        setError("");
      }
    } catch (error) {
      console.error("Error validating email:", error);
      setEmailValid(false);
      setError("Error validating email. Please try again.");
    } finally {
      setEmailChecking(false);
    }
  };

  const validatePassword = (password) => {
    const feedback = [];
    if (password.length < 8) feedback.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) feedback.push("One uppercase letter");
    if (!/[a-z]/.test(password)) feedback.push("One lowercase letter");
    if (!/[0-9]/.test(password)) feedback.push("One number");
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push("One special character");
    
    const score = 5 - feedback.length;
    setPasswordStrength({ score, feedback });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setError("Please create a stronger password");
      setLoading(false);
      return;
    }

    // Validate captcha
    if (parseInt(formData.captchaAnswer) !== captcha.correctAnswer) {
      setError("Incorrect captcha answer. Please try again.");
      generateCaptcha();
      setLoading(false);
      return;
    }

    // Validate email based on role
    if (!emailValid) {
      await validateEmail();
      if (!emailValid) {
        setLoading(false);
        return;
      }
    }

    try {
      // Use the new createNewUser function from firebaseConfig
      const result = await createNewUser(
        formData.email,
        formData.password,
        formData.role,
        formData.department,
        formData.course
      );

      if (result.success) {
        setSuccess(result.message);
        
        // Reset form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
          department: "",
          course: "",
          agreeToTerms: false,
          captchaAnswer: ""
        });
        
        // Generate new captcha
        generateCaptcha();
        
        // Refresh admin count if an admin was added
        if (formData.role === 'admin') {
          await loadAdminCount();
        }
        
        // Redirect based on role
        setTimeout(() => {
          // window.location.href = formData.role === 'admin' ? '/admin/dashboard' : '/pending';
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Error creating account:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Get color for password strength indicator
  const getStrengthColor = (score) => {
    if (score <= 1) return "red";
    if (score <= 3) return "orange";
    return "green";
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1>Create Your Account</h1>
          <p>Join our university management system</p>
        </div>

        {error && (
          <div className="alert error">
            <i className="alert-icon">⚠️</i>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="alert success">
            <i className="alert-icon">✓</i>
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label>Role <span className="required">*</span></label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="select-input"
            >
              <option value="">Select your role</option>
              <option value="admin" disabled={adminCount >= 2}>
                Administrator {adminCount >= 2 ? "(Max limit reached)" : ""}
              </option>
              <option value="lecturer">Lecturer</option>
              <option value="class_rep">Class Representative</option>
            </select>
            {formData.role === 'admin' && adminCount >= 2 && (
              <p className="input-hint error">
                Maximum number of administrators (2) already registered
              </p>
            )}
          </div>

          {(formData.role === 'lecturer' || formData.role === 'class_rep') && (
            <div className="form-group">
              <label>Department <span className="required">*</span></label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="select-input"
              >
                <option value="">Select department</option>
                {Object.keys(departments).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'class_rep' && formData.department && (
            <div className="form-group">
              <label>Course <span className="required">*</span></label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
                className="select-input"
              >
                <option value="">Select course</option>
                {availableCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={
                formData.role === 'lecturer' 
                  ? "janedoe@tum.ac.ke" 
                  : formData.role === 'class_rep' && formData.course 
                    ? `${formData.course}/123J/2024@students.tum.ac.ke` 
                    : "your@email.com"
              }
              required
              className={`input-field ${
                formData.email && (emailValid ? 'valid' : 'invalid')
              }`}
            />
            {formData.role === 'lecturer' && (
              <p className="input-hint">
                Use your university email (e.g., janedoe@tum.ac.ke)
              </p>
            )}
            {formData.role === 'class_rep' && formData.course && (
              <p className="input-hint">
                Use your student email format: {formData.course}/STUDENTNUMBER/YEAR@students.tum.ac.ke
              </p>
            )}
            {emailChecking && <p className="input-hint">Validating email...</p>}
          </div>

          <div className="form-group">
            <label>Password <span className="required">*</span></label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                className="input-field"
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-meter">
                  <div className="strength-label">
                    Password strength: 
                    <span style={{ color: getStrengthColor(passwordStrength.score) }}>
                      {passwordStrength.score <= 1 ? " Weak" : 
                       passwordStrength.score <= 3 ? " Moderate" : " Strong"}
                    </span>
                  </div>
                  <div className="strength-bars">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`strength-bar ${
                          i < passwordStrength.score ? 'filled' : ''
                        }`}
                        style={{
                          backgroundColor: i < passwordStrength.score 
                            ? getStrengthColor(passwordStrength.score) 
                            : '#e0e0e0'
                        }}
                      />
                    ))}
                  </div>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="password-feedback">
                    {passwordStrength.feedback.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password <span className="required">*</span></label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              className={`input-field ${
                formData.confirmPassword && 
                (formData.confirmPassword === formData.password ? 'valid' : 'invalid')
              }`}
            />
            {formData.confirmPassword && formData.confirmPassword !== formData.password && (
              <p className="input-hint error">Passwords do not match</p>
            )}
          </div>

          <div className="form-group captcha-container">
            <label>Verification <span className="required">*</span></label>
            <div className="captcha">
              <div className="captcha-equation">
                {captcha.firstNumber} {captcha.operator} {captcha.secondNumber} = ?
              </div>
              <input
                type="number"
                name="captchaAnswer"
                value={formData.captchaAnswer}
                onChange={handleInputChange}
                placeholder="Enter answer"
                required
                className="captcha-input input-field"
              />
              <button 
                type="button" 
                className="refresh-captcha"
                onClick={generateCaptcha}
                aria-label="Refresh captcha"
              >
                🔄
              </button>
            </div>
            <p className="input-hint">
              Solve this math problem to verify you're human
            </p>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              required
              className="checkbox-input"
            />
            <label htmlFor="agreeToTerms">
              I agree to the <a href="/terms" className="link">Terms of Service</a> and <a href="/privacy" className="link">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading || !formData.agreeToTerms}
          >
            {loading ? (
              <span className="loader"></span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <a href="/login" className="link">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;  