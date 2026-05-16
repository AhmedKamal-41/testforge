import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../stores/auth";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }: { children: ReactElement }) {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/products" replace />;
  return children;
}
