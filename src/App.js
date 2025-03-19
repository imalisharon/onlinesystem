import React from "react"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
 import AdminDashboard from "./pages/AdminDashboard"; 
import LecturerDashboard from "./pages/LecturerDashboard"; 
import ClassRepDashboard from "./pages/ClassRepDashboard"; 
import Timetable from "./pages/Timetable"; // New timetable page 
 import Login from "./pages/Login"; 
 import Signup from "./pages/Signup"; 
 import Home from "./pages/Home"; 
 import "./styles.css"; // Normal CSS styling  
 function App() {   
  return (     
  <Router>       
  <div>         
  <Routes>           
  <Route path="/" element={<Home />} />           
  <Route path="/login" element={<Login />} />           
  <Route path="/signup" element={<Signup />} />           
  <Route path="/admin-dashboard" element={<AdminDashboard />} />           
  <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />           
  <Route path="/class-rep-dashboard" element={<ClassRepDashboard />} />           
  <Route path="/timetable" element={<Timetable />} />         
   </Routes>      
    </div>     
    </Router>  
     ); }  
     export default App;