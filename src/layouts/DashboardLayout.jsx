import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Calendar,
    UserCircle,
    LogOut,
    Bell,
    GraduationCap,
    Menu,
    X,
    Hash,
    ClipboardList,
    Star,
    Award,
    ChevronDown,
    MessageCircle,
    Database,
    Settings,
    Sun,
    Moon
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`
        }
    >
        <Icon size={20} />
        <span className="font-bold text-sm tracking-tight">{children}</span>
    </NavLink>
);

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('userRole') || 'admin');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [userClass, setUserClass] = useState(localStorage.getItem('userClass') || '');
    const [schoolName, setSchoolName] = useState('SIM SMKN 4');
    const [schoolLogo, setSchoolLogo] = useState('');
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        const storedName = localStorage.getItem('userName');
        const storedClass = localStorage.getItem('userClass');

        if (!storedRole) {
            navigate('/login');
            return;
        }

        setRole(storedRole);
        if (storedName) setUserName(storedName);
        if (storedClass) setUserClass(storedClass);

        fetchSchoolName();
    }, [navigate]);

    const fetchSchoolName = async () => {
        const { data } = await supabase
            .from('settings')
            .select('key, value')
            .or('key.eq.school_name,key.eq.school_logo');

        if (data) {
            const name = data.find(s => s.key === 'school_name')?.value;
            const logo = data.find(s => s.key === 'school_logo')?.value;
            if (name) setSchoolName(name);
            if (logo) setSchoolLogo(logo);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        localStorage.setItem('userRole', newRole);
    };

    const menuItems = {
        admin: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/admin/students', icon: Users, label: 'Data Siswa' },
            { to: '/admin/teachers', icon: UserCircle, label: 'Data Guru' },
            { to: '/admin/classes', icon: Hash, label: 'Data Kelas' },
            { to: '/admin/subjects', icon: BookOpen, label: 'Mata Pelajaran' },
            { to: '/admin/schedule', icon: Calendar, label: 'Jadwal' },
            { to: '/admin/announcements', icon: Bell, label: 'Pengumuman' },
            { to: '/admin/fonnte', icon: MessageCircle, label: 'Fonnte WhatsApp' },
            { to: '/admin/backup', icon: Database, label: 'Backup SQL' },
            { to: '/admin/settings', icon: Settings, label: 'Pengaturan Umum' },
        ],
        guru: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/teacher/grades', icon: Star, label: 'Input Nilai' },
            { to: '/teacher/attendance', icon: ClipboardList, label: 'Input Absensi' },
            { to: '/teacher/assignments', icon: BookOpen, label: 'Input Tugas' },
            { to: '/admin/schedule', icon: Calendar, label: 'Jadwal Mengajar' },
            { to: '/admin/announcements', icon: Bell, label: 'Pengumuman' },
        ],
        siswa: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/grades', icon: Award, label: 'Lihat Nilai' },
            { to: '/student/attendance', icon: ClipboardList, label: 'Lihat Absensi' },
            { to: '/student/assignments', icon: BookOpen, label: 'Lihat Tugas' },
            { to: '/admin/schedule', icon: Calendar, label: 'Lihat Jadwal' },
            { to: '/admin/announcements', icon: Bell, label: 'Pengumuman' },
        ],
        parent: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/grades', icon: Award, label: 'Nilai Anak' },
            { to: '/student/attendance', icon: ClipboardList, label: 'Absensi Anak' },
            { to: '/admin/schedule', icon: Calendar, label: 'Jadwal Anak' },
            { to: '/admin/announcements', icon: Bell, label: 'Pengumuman' },
        ],
    };

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10 px-2 text-blue-600">
                        <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded-2xl flex items-center justify-center overflow-hidden w-12 h-12 ${!schoolLogo ? 'bg-blue-600 shadow-lg shadow-blue-100' : ''}`}>
                                {schoolLogo ? (
                                    <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <GraduationCap className="text-white" size={24} />
                                )}
                            </div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-tight dark:text-gray-100">
                                {schoolName}
                            </h1>
                        </div>
                        <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} className="text-gray-400 dark:text-gray-500" />
                        </button>
                    </div>

                    <div className="mb-6 px-2">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent dark:border-gray-700"
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-600/10 text-blue-500' : 'bg-orange-600/10 text-orange-600'}`}>
                                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </span>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
                            </div>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                        <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Menu Utama</p>
                        {(menuItems[role] || menuItems.admin).map((item) => (
                            <SidebarLink key={item.to + item.label} to={item.to} icon={item.icon}>
                                {item.label}
                            </SidebarLink>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 rounded-xl transition-all font-bold text-sm group"
                        >
                            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                            <span>Keluar Sesi</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
                    <button
                        className="p-3 lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center space-x-6 ml-auto">
                        <div className="flex items-center space-x-4 pl-6 border-l border-gray-100 dark:border-gray-800">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-black text-gray-900 dark:text-gray-100 leading-none">
                                    {userName || (role === 'siswa' ? 'Siswa User' : role === 'guru' ? 'Guru User' : role === 'parent' ? 'Wali Murid' : 'Admin User')}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1 uppercase">
                                    {role === 'siswa' ? `Kelas: ${userClass || '-'}` : `Mode: ${role}`}
                                </p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-100 dark:shadow-blue-900/20 active:scale-95 transition-transform">
                                    <div className="h-full w-full bg-white dark:bg-gray-800 rounded-[14px] flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                                        {role[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gray-50/50 dark:bg-gray-950/50 transition-colors duration-300">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
