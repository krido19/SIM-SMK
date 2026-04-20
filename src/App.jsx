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
const TeacherSchedule = lazy(() => import('./pages/teacher/TeacherSchedule'))
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'))
const StudentSchedule = lazy(() => import('./pages/student/StudentSchedule'))
const StudentAnnouncements = lazy(() => import('./pages/student/StudentAnnouncements'))

const LoadingFallback = () => (
  <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-6">
      <div className="flex space-x-2">
        <div className="w-8 h-8 rounded-md bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-8 h-8 rounded-md bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-8 h-8 rounded-md bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <div className="text-center w-64 pt-4">
        <p className="text-gray-900 font-sans font-bold uppercase tracking-widest text-xl leading-none">Memuat</p>
        <p className="text-gray-500 font-sans font-medium text-sm mt-2">Menyiapkan ruang kerja...</p>
      </div>
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
                  <Route path="/teacher/announcements" element={<Announcements />} />
                  <Route path="/teacher/schedule" element={<TeacherSchedule />} />

                  {/* Student/Parent Routes */}
                  <Route path="/student/grades" element={<StudentGrades />} />
                  <Route path="/student/attendance" element={<StudentAttendance />} />
                  <Route path="/student/assignments" element={<StudentAssignments />} />
                  <Route path="/student/schedule" element={<StudentSchedule />} />
                  <Route path="/student/announcements" element={<StudentAnnouncements />} />

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
