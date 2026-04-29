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
    Moon,
    TrendingUp,
    Printer,
    FileText
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 transition-all duration-200 rounded-md ${isActive
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900 font-medium'}`
        }
    >
        {({ isActive }) => (
            <>
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-sans text-[13px] tracking-wide leading-none overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
            </>
        )}
    </NavLink>
);

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('userRole') || 'admin');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [userClass, setUserClass] = useState(localStorage.getItem('userClass') || '');
    const [schoolName, setSchoolName] = useState('SIM SMK HAFIDZ');
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

    const menuItems = {
        admin: [
            {
                category: "Halaman Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Direktori", items: [
                    { to: '/admin/students', icon: Users, label: 'Data Siswa' },
                    { to: '/admin/teachers', icon: UserCircle, label: 'Data Guru' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/admin/classes', icon: Hash, label: 'Kelas' },
                    { to: '/admin/subjects', icon: BookOpen, label: 'Mata Pelajaran' },
                    { to: '/admin/schedule', icon: Calendar, label: 'Jadwal Pelajaran' }
                ]
            },
            {
                category: "Laporan & Lanjutan", items: [
                    { to: '/admin/analytics', icon: TrendingUp, label: 'Executive Dashboard' },
                    { to: '/admin/documents', icon: Printer, label: 'Cetak Dokumen' }
                ]
            },
            {
                category: "Administrasi", items: [
                    { to: '/admin/announcements', icon: Bell, label: 'Pengumuman' },
                    { to: '/admin/fonnte', icon: MessageCircle, label: 'Pusat Pesan' },
                    { to: '/admin/backup', icon: Database, label: 'Cadangan Data' },
                    { to: '/admin/settings', icon: Settings, label: 'Pengaturan' }
                ]
            }
        ],
        guru: [
            {
                category: "Halaman Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/teacher/schedule', icon: Calendar, label: 'Jadwal Mengajar' },
                    { to: '/teacher/grades', icon: BookOpen, label: 'Input Nilai' },
                    { to: '/teacher/attendance', icon: Users, label: 'Absensi Siswa' },
                    { to: '/teacher/journals', icon: FileText, label: 'Jurnal Mengajar' },
                    { to: '/teacher/assignments', icon: ClipboardList, label: 'Tugas & Penilaian' }
                ]
            },
            {
                category: "Informasi", items: [
                    { to: '/teacher/announcements', icon: Bell, label: 'Pengumuman' }
                ]
            }
        ],
        siswa: [
            {
                category: "Halaman Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/student/schedule', icon: Calendar, label: 'Jadwal Pelajaran' },
                    { to: '/student/grades', icon: Award, label: 'Rapor & Nilai' },
                    { to: '/student/attendance', icon: Users, label: 'Rekap Kehadiran' },
                    { to: '/student/assignments', icon: ClipboardList, label: 'Tugas Saya' }
                ]
            },
            {
                category: "Informasi", items: [
                    { to: '/student/announcements', icon: Bell, label: 'Pengumuman' }
                ]
            }
        ],
        parent: [
            {
                category: "Halaman Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/student/schedule', icon: Calendar, label: 'Jadwal Anak' },
                    { to: '/student/grades', icon: Award, label: 'Rapor & Nilai' },
                    { to: '/student/attendance', icon: Users, label: 'Rekap Kehadiran' },
                    { to: '/student/assignments', icon: ClipboardList, label: 'Tugas Anak' }
                ]
            }
        ]
    };

    const getMenu = () => {
        return menuItems[role] || menuItems.admin;
    };

    return (
        <div className={`flex h-screen overflow-hidden bg-gray-50 text-gray-900 transition-colors duration-300`}>
            {/* Sidebar Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-ink/60 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-sm
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Header Logo Section */}
                    <div className="p-6 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain filter brightness-0 invert" />
                            </div>
                            <button className="lg:hidden text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-1 rounded-md" onClick={() => setIsSidebarOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <h1 className="text-xl font-sans font-bold tracking-tight text-gray-900 leading-tight mb-1 truncate">
                            {schoolName}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium">Sistem Informasi Akademik</p>
                    </div>

                    <nav className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                        {getMenu().map((group, groupIdx) => (
                            <div key={groupIdx}>
                                <h3 className="px-4 text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    {group.category}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <SidebarLink key={item.to + item.label} to={item.to} icon={item.icon}>
                                            {item.label}
                                        </SidebarLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-50 bg-white">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-sans text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={16} strokeWidth={2} />
                            <span>Keluar Sistem</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
                    <button
                        className="p-2 lg:hidden text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden lg:flex items-center text-sm font-medium text-gray-400">
                        <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center space-x-6 h-full ml-auto">
                        <div className="hidden sm:flex h-full items-center mr-2">
                            <div className="text-right">
                                <p className="text-sm font-sans font-bold text-gray-900 leading-none">
                                    {userName || "Pengguna"}
                                </p>
                                <p className="text-xs font-sans text-blue-600 font-medium mt-1">
                                    {role.charAt(0).toUpperCase() + role.slice(1)} {(role === 'siswa' && userClass) ? ` • ${userClass}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-sans font-bold text-white text-lg shadow-sm border-2 border-white ring-2 ring-blue-50">
                            {role[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="max-w-screen-2xl mx-auto p-6 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
