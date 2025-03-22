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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">All Classes</h1>
      {loading && <p className="text-center">Loading classes...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
              <h2 className="text-2xl font-semibold mb-2">{cls.title}</h2>
              <p className="mb-1"><strong>Course Code:</strong> {cls.courseCode}</p>
              <p className="mb-1"><strong>Lecturer:</strong> {cls.lecturerEmail}</p>
              <p className="mb-1"><strong>Room:</strong> {cls.room}</p>
              <p className="mb-1">
                <strong>Start:</strong> {new Date(cls.startDateTime).toLocaleString()}
              </p>
              <p className="mb-1">
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
