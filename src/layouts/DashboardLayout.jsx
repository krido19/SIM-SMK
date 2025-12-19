import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    ChevronDown
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
            }`
        }
    >
        <Icon size={20} />
        <span className="font-bold text-sm tracking-tight">{children}</span>
    </NavLink>
);

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('userRole') || 'admin');
    const navigate = useNavigate();

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

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
        ],
        guru: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/teacher/grades', icon: Star, label: 'Input Nilai' },
            { to: '/teacher/attendance', icon: ClipboardList, label: 'Input Absensi' },
            { to: '/admin/schedule', icon: Calendar, label: 'Jadwal Mengajar' },
        ],
        siswa: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/grades', icon: Award, label: 'Lihat Nilai' },
            { to: '/student/attendance', icon: ClipboardList, label: 'Lihat Absensi' },
            { to: '/admin/schedule', icon: Calendar, label: 'Lihat Jadwal' },
        ],
        parent: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/grades', icon: Award, label: 'Nilai Anak' },
            { to: '/student/attendance', icon: ClipboardList, label: 'Absensi Anak' },
            { to: '/admin/schedule', icon: Calendar, label: 'Jadwal Anak' },
        ],
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10 px-2 text-blue-600">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
                                <GraduationCap className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase whitespace-nowrap">SIM SMKN 4</h1>
                        </div>
                        <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                        <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Menu Utama</p>
                        {(menuItems[role] || menuItems.admin).map((item) => (
                            <SidebarLink key={item.to + item.label} to={item.to} icon={item.icon}>
                                {item.label}
                            </SidebarLink>
                        ))}
                        <SidebarLink to="/admin/announcements" icon={Bell}>Pengumuman</SidebarLink>
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-bold text-sm group"
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
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
                    <button
                        className="p-3 lg:hidden text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center space-x-6 ml-auto">
                        {/* Role Switcher Demo */}
                        <div className="hidden lg:flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                            {['admin', 'guru', 'siswa', 'parent'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => handleRoleChange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${role === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-4 pl-6 border-l border-gray-100">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-black text-gray-900 leading-none">{role === 'siswa' ? 'Siswa User' : role === 'guru' ? 'Guru User' : role === 'parent' ? 'Wali Murid' : 'Admin User'}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 uppercase">Mode: {role}</p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-100 active:scale-95 transition-transform">
                                    <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center text-blue-600 font-black text-sm">
                                        {role[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gray-50/50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
