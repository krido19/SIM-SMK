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
// const FonnteSettings = lazy(() => import('./pages/admin/FonnteSettings'))
const DatabaseBackup = lazy(() => import('./pages/admin/DatabaseBackup'))
const GeneralSettings = lazy(() => import('./pages/admin/GeneralSettings'))
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'))
const DocumentGenerator = lazy(() => import('./pages/admin/DocumentGenerator'))
const GradeEntry = lazy(() => import('./pages/teacher/GradeEntry'))
const AttendanceEntry = lazy(() => import('./pages/teacher/AttendanceEntry'))
const TeachingJournals = lazy(() => import('./pages/teacher/TeachingJournals'))
const StudentGrades = lazy(() => import('./pages/student/StudentGrades'))
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'))
const Assignments = lazy(() => import('./pages/teacher/Assignments'))
const TeacherSchedule = lazy(() => import('./pages/teacher/TeacherSchedule'))
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'))
const StudentSchedule = lazy(() => import('./pages/student/StudentSchedule'))
const StudentAnnouncements = lazy(() => import('./pages/student/StudentAnnouncements'))

const LoadingFallback = () => (
  <div className="min-h-screen bg-neo-cream neo-grid-bg flex items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-6">
      <div className="flex space-x-3">
        <div className="w-10 h-10 border-4 border-black bg-neo-accent shadow-[4px_4px_0px_0px_#000] animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-10 h-10 border-4 border-black bg-neo-secondary shadow-[4px_4px_0px_0px_#000] animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-10 h-10 border-4 border-black bg-neo-muted shadow-[4px_4px_0px_0px_#000] animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] px-8 py-4 text-center">
        <p className="font-black uppercase tracking-widest text-xl leading-none text-black">MEMUAT</p>
        <p className="font-bold text-black/50 text-sm mt-2 uppercase tracking-wider">Menyiapkan ruang kerja...</p>
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
                  {/* <Route path="/admin/fonnte" element={<FonnteSettings />} /> */}
                  <Route path="/admin/backup" element={<DatabaseBackup />} />
                  <Route path="/admin/settings" element={<GeneralSettings />} />
                  <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/admin/documents" element={<DocumentGenerator />} />

                  {/* Teacher Routes */}
                  <Route path="/teacher/grades" element={<GradeEntry />} />
                  <Route path="/teacher/attendance" element={<AttendanceEntry />} />
                  <Route path="/teacher/journals" element={<TeachingJournals />} />
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
