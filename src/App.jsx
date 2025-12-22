import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Students from './pages/admin/Students'
import Teachers from './pages/admin/Teachers'
import Subjects from './pages/admin/Subjects'
import Classes from './pages/admin/Classes'
import Schedule from './pages/admin/Schedule'
import Announcements from './pages/admin/Announcements'
import FonnteSettings from './pages/admin/FonnteSettings'
import DatabaseBackup from './pages/admin/DatabaseBackup' // Added this import
import GeneralSettings from './pages/admin/GeneralSettings'
import GradeEntry from './pages/teacher/GradeEntry'
import AttendanceEntry from './pages/teacher/AttendanceEntry'
import StudentGrades from './pages/student/StudentGrades'
import StudentAttendance from './pages/student/StudentAttendance'
import Assignments from './pages/teacher/Assignments'
import StudentAssignments from './pages/student/StudentAssignments'

import { FeedbackProvider } from './context/FeedbackContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin Routes */}
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route path="/admin/subjects" element={<Subjects />} />
              <Route path="/admin/classes" element={<Classes />} />
              <Route path="/admin/schedule" element={<Schedule />} />
              <Route path="/admin/announcements" element={<Announcements />} />
              <Route path="/admin/fonnte" element={<FonnteSettings />} />
              <Route path="/admin/backup" element={<DatabaseBackup />} />
              <Route path="/admin/settings" element={<GeneralSettings />} />

              {/* Teacher Routes */}
              <Route path="/teacher/grades" element={<GradeEntry />} />
              <Route path="/teacher/attendance" element={<AttendanceEntry />} />
              <Route path="/teacher/assignments" element={<Assignments />} />

              {/* Student/Parent Routes */}
              <Route path="/student/grades" element={<StudentGrades />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />

              <Route path="/" element={<Navigate to="/login" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FeedbackProvider>
    </QueryClientProvider>
  )
}

export default App
