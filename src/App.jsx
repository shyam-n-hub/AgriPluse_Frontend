// App.jsx – Root component with React Router setup
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import FarmManager from "./pages/FarmManager";
import ClimateSuitability from "./pages/ClimateSuitability";
import IrrigationScheduler from "./pages/IrrigationScheduler";
import PollinationEngine from "./pages/PollinationEngine";
import CropChecker from "./pages/CropChecker";
import RiskRadar from "./pages/RiskRadar";
import SustainabilityScore from "./pages/SustainabilityScore";
import CropRecommendations from "./pages/CropRecommendations";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farm"
            element={
              <ProtectedRoute>
                <Layout><FarmManager /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/climate"
            element={
              <ProtectedRoute>
                <Layout><ClimateSuitability /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/irrigation"
            element={
              <ProtectedRoute>
                <Layout><IrrigationScheduler /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pollination"
            element={
              <ProtectedRoute>
                <Layout><PollinationEngine /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-checker"
            element={
              <ProtectedRoute>
                <Layout><CropChecker /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk-radar"
            element={
              <ProtectedRoute>
                <Layout><RiskRadar /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sustainability"
            element={
              <ProtectedRoute>
                <Layout><SustainabilityScore /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-recommendations"
            element={
              <ProtectedRoute>
                <Layout><CropRecommendations /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          theme="dark"
          toastStyle={{
            background: "#1e293b",
            border: "1px solid #1e3a2f",
            color: "#f1f5f9",
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
