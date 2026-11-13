import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginView from '../views/LoginView';
import ClassroomView from '../views/ClassroomView';
import SchoolManagementView from '../views/SchoolManagementView';
import RepositoryView from '../views/RepositoryView';
import SystemView from '../views/SystemView';

function ProtectedRoute({ route, children }) {
  const { isAuthenticated, canAccessRoute } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!canAccessRoute(route)) {
    return <Navigate to="/aula" replace />;
  }
  return children;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route path="/" element={<Navigate to={isAuthenticated ? "/aula" : "/login"} replace />} />
      
      {/* 1. MÓDULO AULA VIRTUAL */}
      <Route path="/aula" element={<ProtectedRoute route="/aula"><ClassroomView /></ProtectedRoute>} />
      <Route path="/aula/*" element={<ProtectedRoute route="/aula"><ClassroomView /></ProtectedRoute>} />

      {/* 2. MÓDULO GESTIÓN ESCOLAR */}
      <Route path="/escolar" element={<ProtectedRoute route="/escolar"><SchoolManagementView /></ProtectedRoute>} />
      <Route path="/escolar/*" element={<ProtectedRoute route="/escolar"><SchoolManagementView /></ProtectedRoute>} />

      {/* 3. MÓDULO REPOSITORIO */}
      <Route path="/repositorio" element={<ProtectedRoute route="/repositorio"><RepositoryView /></ProtectedRoute>} />
      <Route path="/repositorio/*" element={<ProtectedRoute route="/repositorio"><RepositoryView /></ProtectedRoute>} />

      {/* 4. MÓDULO CONFIGURACIÓN & SEGURIDAD RBAC */}
      <Route path="/sistema" element={<ProtectedRoute route="/sistema"><SystemView /></ProtectedRoute>} />
      <Route path="/sistema/*" element={<ProtectedRoute route="/sistema"><SystemView /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={isAuthenticated ? "/aula" : "/login"} replace />} />
    </Routes>
  );
}
