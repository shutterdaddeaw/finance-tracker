import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  // ถ้าไม่มี user ให้ดีดกลับไปหน้า Login
  return currentUser ? children : <Navigate to="/login" />;
}