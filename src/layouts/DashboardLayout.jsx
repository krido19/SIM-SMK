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
            `flex items-center space-x-3 px-4 py-3 transition-colors duration-200 border-b border-ink/5 last:border-0 ${isActive
                ? 'bg-ink text-paper'
                : 'text-ink/60 hover:bg-neutral-100'}`
        }
    >
        <Icon size={18} strokeWidth={1.5} />
        <span className="font-sans font-bold text-[11px] uppercase tracking-widest leading-none">{children}</span>
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
        <div className={`flex h-screen overflow-hidden bg-paper text-ink transition-colors duration-300 newsprint-texture`}>
            {/* Sidebar Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-ink/60 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-paper border-r-2 border-ink transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Header Logo Section */}
                    <div className="p-6 border-b-2 border-ink">
                        <div className="flex items-center justify-between mb-4">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <h1 className="text-2xl font-serif font-black tracking-tighter leading-none mb-2">
                            {schoolName}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest border border-ink/20 px-1.5 py-0.5">Vol. 1</span>
                            <span className="text-[9px] font-mono uppercase tracking-widest border border-ink/20 px-1.5 py-0.5">Est. 2024</span>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto no-scrollbar pb-6">
                        {getMenu().map((group, groupIdx) => (
                            <div key={groupIdx}>
                                <div className="px-4 py-2 bg-ink text-paper border-y-2 border-ink mt-[-2px]">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{group.category}</p>
                                </div>
                                <div className="py-2">
                                    {group.items.map((item) => (
                                        <SidebarLink key={item.to + item.label} to={item.to} icon={item.icon}>
                                            {item.label}
                                        </SidebarLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="p-4 border-t-2 border-ink bg-neutral-100/30">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-ink font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-ink hover:text-paper transition-all"
                        >
                            <LogOut size={16} strokeWidth={2} />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-paper border-b-2 border-ink flex items-center justify-between px-6 sticky top-0 z-30">
                    <button
                        className="p-2 lg:hidden border border-ink hover:bg-ink hover:text-paper transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest opacity-60">
                        <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center space-x-4 h-full">
                        <div className="hidden md:flex h-full items-center border-x-2 border-ink px-6">
                            <div className="text-right">
                                <p className="text-[11px] font-serif font-black leading-none">
                                    {userName || "PENGGUNA"}
                                </p>
                                <p className="text-[9px] font-mono uppercase tracking-widest mt-1 opacity-50">
                                    Peran: {role}
                                </p>
                            </div>
                        </div>
                        <div className="h-10 w-10 border-2 border-ink flex items-center justify-center font-serif font-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {role[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-paper">
                    <div className="max-w-screen-2xl mx-auto p-6 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
