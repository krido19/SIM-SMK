import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Hash, Users, ClipboardList, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';

const TeacherDashboard = ({ userName }) => {
    const [stats, setStats] = useState({
        classesTaught: 0,
        totalStudents: 0,
        pendingTasks: 0,
        attendance: '0%'
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        let userId = localStorage.getItem('userId');
        const userNIP = localStorage.getItem('userNIP');

        try {
            // Fallback 1: Try NIP
            if (!userId && userNIP) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('nip', userNIP).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            // Fallback 2: Try Name
            if (!userId && userName) {
                const { data: teacher } = await supabase.from('teachers').select('id').eq('name', userName).maybeSingle();
                if (teacher) {
                    userId = teacher.id;
                    localStorage.setItem('userId', userId);
                }
            }

            if (userId) {
                // Get classes taught
                const { data: schedules } = await supabase
                    .from('schedules')
                    .select('class_id')
                    .or(`teacher_id.eq.${userId},teacher_name.eq."${userName}",teacher_name.ilike."%${userName}%"`);

                const uniqueClasses = [...new Set(schedules?.map(s => s.class_id) || [])];

                // Count students
                let studentCount = 0;
                let studentIds = [];
                if (uniqueClasses.length > 0) {
                    const { data: students, count } = await supabase
                        .from('students')
                        .select('id', { count: 'exact' })
                        .in('class_id', uniqueClasses);
                    studentCount = count || 0;
                    studentIds = students?.map(s => s.id) || [];
                }

                // Calculate Attendance
                let attendancePercentage = 0;
                if (studentIds.length > 0) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const { count: presentCount } = await supabase
                        .from('attendance')
                        .select('*', { count: 'exact', head: true })
                        .in('student_id', studentIds)
                        .eq('date', todayStr)
                        .eq('status', 'Hadir');

                    if (studentCount > 0) {
                        attendancePercentage = Math.round((presentCount / studentCount) * 100);
                    }
                }

                // Get assignments count
                const { count: taskCount } = await supabase
                    .from('assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', userId);

                setStats({
                    classesTaught: uniqueClasses.length,
                    totalStudents: studentCount,
                    pendingTasks: taskCount || 0,
                    attendance: `${attendancePercentage}%`
                });
            }
        } catch (error) {
            console.error('Error fetching teacher dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="animate-pulse font-mono text-[10px] uppercase">Retrieving Records...</div>;

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Assigned Sections" value={stats.classesTaught?.toString() || "0"} icon={Hash} />
                <StatCard title="Student Roster" value={stats.totalStudents?.toString() || "0"} icon={Users} />
                <StatCard title="Pending Review" value={stats.pendingTasks?.toString() || "0"} icon={ClipboardList} trend={stats.pendingTasks > 0 ? "- Action Reqd" : ""} to="/teacher/assignments" />
                <StatCard title="Daily Attendance" value={stats.attendance} icon={TrendingUp} />
            </div>

            <div className="bg-paper p-8 border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative newsprint-texture">
                <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} className="text-newsprint-red" strokeWidth={1.5} />
                        <h3 className="text-2xl font-serif font-black text-ink uppercase tracking-tight">Required Actions</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border border-ink/20 p-6 hover:bg-ink hover:text-paper transition-colors group">
                        <h4 className="font-serif font-bold text-xl mb-2">Record Daily Attendance</h4>
                        <p className="font-body text-sm mb-6 opacity-70">The attendance roster for your active classes requires your signature for today's session.</p>
                        <Link to="/teacher/attendance" className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest border-b border-current pb-1 group-hover:text-newsprint-red">
                            Open Roster <ChevronRight size={14} className="ml-1" />
                        </Link>
                    </div>

                    <div className="border border-ink/20 p-6 hover:bg-ink hover:text-paper transition-colors group">
                        <h4 className="font-serif font-bold text-xl mb-2">Grade Open Assignments</h4>
                        <p className="font-body text-sm mb-6 opacity-70">You have coursework submissions pending your review and grading.</p>
                        <Link to="/teacher/assignments" className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest border-b border-current pb-1 group-hover:text-newsprint-red">
                            Open Gradebook <ChevronRight size={14} className="ml-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
