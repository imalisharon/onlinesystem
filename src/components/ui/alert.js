import React from "react";
import { cn } from "../../utils/cn";  // Importing the cn function

const Alert = ({ type = "info", message }) => {
  const alertClasses = cn(
    "p-4 rounded-md",
    type === "success" && "bg-green-500 text-white",
    type === "warning" && "bg-yellow-500 text-black",
    type === "error" && "bg-red-500 text-white",
    type === "info" && "bg-blue-500 text-white"
  );

  return <div className={alertClasses}>{message}</div>;
};

export default Alert;
