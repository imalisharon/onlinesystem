import React, { useState, useEffect } from 'react';
import { createClass, getLecturers, getClassReps } from "../firebase/firebaseConfig";
import './AddClassModal.css'; // Import the CSS file

const AddClassModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    classTitle: "",
    courseCode: "",
    lecturer: "",
    classRep: "",
    room: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Options for dropdowns
  const [lecturers, setLecturers] = useState([]);
  const [classReps, setClassReps] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Load lecturers and class reps on component mount
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);
  
  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      // Fetch lecturers and class reps from Firebase
      const fetchedLecturers = await getLecturers();
      const fetchedClassReps = await getClassReps();

      console.log("Lecturers:", fetchedLecturers);
      console.log("Class Reps:", fetchedClassReps);
      
      setLecturers(fetchedLecturers);
      setClassReps(fetchedClassReps);
    } catch (error) {
      console.error("Error loading options:", error);
      setError("Failed to load lecturers and class representatives");
    } finally {
      setLoadingOptions(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    // Basic validation
    if (!formData.classTitle || !formData.courseCode || !formData.lecturer || 
        !formData.classRep || !formData.room || !formData.startDate || 
        !formData.startTime || !formData.endDate || !formData.endTime) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }
    
    try {
      // Format dates and times
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Validate datetime
      if (endDateTime <= startDateTime) {
        setError("End time must be after start time");
        setLoading(false);
        return;
      }
      
      // Retrieve the selected lecturer's email
      const selectedLecturer = lecturers.find(l => l.id === formData.lecturer);
      if (!selectedLecturer || !selectedLecturer.email) {
        setError("Selected lecturer does not have an email address");
        setLoading(false);
        return;
      }
      
      // Create class in Firebase
      const result = await createClass({
        title: formData.classTitle,
        courseCode: formData.courseCode,
        lecturerEmail: selectedLecturer.email, // Pass the lecturer's email
        lecturerId: formData.lecturer,
        classRepId: formData.classRep,
        room: formData.room,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });
      
      if (result.success) {
        setSuccess("Class created successfully!");
        
        // Reset form
        setFormData({
          classTitle: "",
          courseCode: "",
          lecturer: "",
          classRep: "",
          room: "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: ""
        });
        
        // Close modal after delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || "Failed to create class");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Class</h2>
          <button className="close-button" onClick={onClose}>×</button>
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
        
        <form onSubmit={handleSubmit} className="class-form">
          <div className="form-group">
            <label>Class Title <span className="required">*</span></label>
            <input
              type="text"
              name="classTitle"
              value={formData.classTitle}
              onChange={handleInputChange}
              placeholder="Introduction to Programming"
              required
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label>Course Code <span className="required">*</span></label>
            <input
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleInputChange}
              placeholder="CS101"
              required
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label>Lecturer <span className="required">*</span></label>
            <select
              name="lecturer"
              value={formData.lecturer}
              onChange={handleInputChange}
              required
              className="select-input"
              disabled={loadingOptions}
            >
              <option value="">Select a lecturer</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.displayName || lecturer.fullName || lecturer.name || lecturer.email || "Unnamed Lecturer"}
                </option>
              ))}
            </select>
            {loadingOptions && <p className="input-hint">Loading lecturers...</p>}
          </div>
          
          <div className="form-group">
            <label>Class Representative <span className="required">*</span></label>
            <select
              name="classRep"
              value={formData.classRep}
              onChange={handleInputChange}
              required
              className="select-input"
              disabled={loadingOptions}
            >
              <option value="">Select a class rep</option>
              {classReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.displayName || rep.fullName || rep.name || rep.email || "Unnamed Class Rep"}
                  {rep.courseCode ? ` (${rep.courseCode})` : ''}
                </option>
              ))}
            </select>
            {loadingOptions && <p className="input-hint">Loading class representatives...</p>}
          </div>
          
          <div className="form-group">
            <label>Room <span className="required">*</span></label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleInputChange}
              placeholder="A101"
              required
              className="input-field"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>Start Date <span className="required">*</span></label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
            
            <div className="form-group half">
              <label>Start Time <span className="required">*</span></label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>End Date <span className="required">*</span></label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
            
            <div className="form-group half">
              <label>End Time <span className="required">*</span></label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className={`submit-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="loader"></span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClassModal;