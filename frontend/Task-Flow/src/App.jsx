import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Admin/Dashboard";
import ManageTasks from "./pages/Admin/ManageTasks";
import CreateTask from "./pages/Admin/CreateTask";
import UpdateTask from "./pages/Admin/UpdateTask";
import ManageUsers from "./pages/Admin/ManageUsers";
import UserProfile from "./pages/Admin/UserProfile";

import UserDashboard from "./pages/User/UserDashboard";
import MyTasks from "./pages/User/MyTasks";
import ViewTaskDetails from "./pages/User/ViewTaskDetails";

import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";

import PrivateRoute from "./routes/PrivateRoute";
import UserProvider, { UserContext } from "./context/UserContext";
import { Toaster } from "react-hot-toast";
import Loader from "./components/Loader";

// ✅ Import the ChatPage you created
import ChatPage from "./pages/ChatPage";

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/admin/update-task/:taskId" element={<UpdateTask />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/users/:id" element={<UserProfile />} />
          </Route>

          {/* User Routes */}
          <Route element={<PrivateRoute allowedRoles={["member"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
          </Route>

          {/* Chat Route (both admin & member can access) */}
          <Route element={<PrivateRoute allowedRoles={["admin", "member"]} />}>
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          toastOptions={{
            style: { fontSize: "13px" },
          }}
        />
      </Router>
    </UserProvider>
  );
};

export default App;

// Handles redirect on root "/"
const RootRedirect = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <Loader />;

  if (!user) return <Navigate to="/login" replace />;

  return user.role === "admin" ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/user/dashboard" replace />
  );
};