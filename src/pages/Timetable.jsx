import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import "../styles.css";

const Timetable = () => {
  const [events, setEvents] = useState([]);

  // 🔹 Fetch schedule from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, "timetable"));
      const fetchedEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(fetchedEvents);
    };
    fetchEvents();
  }, []);

  // 🔹 Handle new event creation
  const handleDateClick = async (info) => {
    const title = prompt("Enter event title:");
    if (title) {
      const newEvent = {
        title,
        start: info.dateStr,
        end: info.dateStr,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "timetable"), newEvent);

      // Update UI
      setEvents([...events, { id: docRef.id, ...newEvent }]);
    }
  };

  return (
    <div className="calendar-container">
      <h2>Lecturer & Class Rep Timetable</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        editable={true}
        selectable={true}
        events={events}
        dateClick={handleDateClick} // Click to add new events
      />
    </div>
  );
};

export default Timetable;
