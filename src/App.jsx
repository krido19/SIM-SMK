import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackProvider } from './context/FeedbackContext'
import { ThemeProvider } from './context/ThemeContext'

// Layouts
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))
const Students = lazy(() => import('./pages/admin/Students'))
const Teachers = lazy(() => import('./pages/admin/Teachers'))
const Subjects = lazy(() => import('./pages/admin/Subjects'))
const Classes = lazy(() => import('./pages/admin/Classes'))
const Schedule = lazy(() => import('./pages/admin/Schedule'))
const Announcements = lazy(() => import('./pages/admin/Announcements'))
const FonnteSettings = lazy(() => import('./pages/admin/FonnteSettings'))
const DatabaseBackup = lazy(() => import('./pages/admin/DatabaseBackup'))
const GeneralSettings = lazy(() => import('./pages/admin/GeneralSettings'))
const GradeEntry = lazy(() => import('./pages/teacher/GradeEntry'))
const AttendanceEntry = lazy(() => import('./pages/teacher/AttendanceEntry'))
const StudentGrades = lazy(() => import('./pages/student/StudentGrades'))
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'))
const Assignments = lazy(() => import('./pages/teacher/Assignments'))
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'))

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Memuat SIM SMK...</p>
    </div>
  </div>
)

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FeedbackProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
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
            </Suspense>
          </BrowserRouter>
        </FeedbackProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
