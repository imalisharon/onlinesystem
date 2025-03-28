// App.js
import React from "react"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard"; 
import LecturerDashboard from "./pages/LecturerDashboard"; 
import ClassRepDashboard from "./pages/ClassRepDashboard"; 
import ClassesPage from "./pages/ClassesPage"; // Notice the exact casing here
import Login from "./pages/Login"; 
import Signup from "./pages/Signup"; 
import Home from "./pages/Home"; 
import "./styles.css";

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
          <Route path="/classes" element={<ClassesPage />} />     
        </Routes>      
      </div>     
    </Router>  
  ); 
}  

export default App;
