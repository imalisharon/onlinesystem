// AllClassesPage.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Adjust path as needed

const AllClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesRef = collection(db, "classes");
        const querySnapshot = await getDocs(classesRef);
        const classesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClasses(classesData);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to load classes.");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Inline styles
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px"
  };

  const headerStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "24px",
    textAlign: "center"
  };

  const loadingStyle = {
    textAlign: "center"
  };

  const errorStyle = {
    textAlign: "center",
    color: "red"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px"
  };

  const cardStyle = {
    background: "linear-gradient(to right, #60A5FA, #8B5CF6)",
    color: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "24px",
    transition: "transform 0.3s ease",
    cursor: "pointer"
  };

  const cardTitleStyle = {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "16px"
  };

  const textStyle = {
    marginBottom: "8px"
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>All Classes</h1>
      {loading && <p style={loadingStyle}>Loading classes...</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && !error && (
        <div style={gridStyle}>
          {classes.map((cls) => (
            <div key={cls.id} style={cardStyle}>
              <h2 style={cardTitleStyle}>{cls.title}</h2>
              <p style={textStyle}>
                <strong>Course Code:</strong> {cls.courseCode}
              </p>
              <p style={textStyle}>
                <strong>Lecturer:</strong> {cls.lecturerEmail}
              </p>
              <p style={textStyle}>
                <strong>Room:</strong> {cls.room}
              </p>
              <p style={textStyle}>
                <strong>Start:</strong> {new Date(cls.startDateTime).toLocaleString()}
              </p>
              <p style={textStyle}>
                <strong>End:</strong> {new Date(cls.endDateTime).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllClassesPage;
