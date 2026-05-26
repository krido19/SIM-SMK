import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
    TrendingUp,
    Printer,
    FileText,
    Zap,
    User,
    Key,
    Camera
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 transition-all duration-100 border-2 ${isActive
                ? 'bg-neo-secondary border-black shadow-[3px_3px_0px_0px_#000] font-black text-black'
                : 'border-transparent text-black hover:border-black hover:bg-neo-cream hover:shadow-[2px_2px_0px_0px_#000] font-bold'}`
        }
    >
        {({ isActive }) => (
            <>
                <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[12px] uppercase tracking-wide leading-none overflow-hidden text-ellipsis whitespace-nowrap">
                    {children}
                </span>
            </>
        )}
    </NavLink>
);

const SidebarCollapsible = ({ icon: Icon, label, subItems }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Auto-open if a child is active (using current path could be tricky inside simple component without useLocation, so we just toggle manually for now)

    return (
        <div className="flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-3 py-2.5 transition-all duration-100 border-2 border-transparent text-black hover:border-black hover:bg-neo-cream hover:shadow-[2px_2px_0px_0px_#000] font-bold w-full"
            >
                <div className="flex items-center space-x-3">
                    <Icon size={16} strokeWidth={2} />
                    <span className="text-[12px] uppercase tracking-wide leading-none">{label}</span>
                </div>
                <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="flex flex-col ml-6 mt-1 space-y-0.5 border-l-2 border-black/10 pl-2">
                    {subItems.map((sub) => (
                        <SidebarLink key={sub.to + sub.label} to={sub.to} icon={sub.icon}>
                            {sub.label}
                        </SidebarLink>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('userRole') || 'admin');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [userClass, setUserClass] = useState(localStorage.getItem('userClass') || '');
    const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
    const [userPhoto, setUserPhoto] = useState(null);
    const [schoolName, setSchoolName] = useState('SIM SMK HAFIDZ');
    const [schoolLogo, setSchoolLogo] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        const storedName = localStorage.getItem('userName');
        const storedClass = localStorage.getItem('userClass');
        const storedId = localStorage.getItem('userId');

        if (!storedRole) {
            navigate('/login');
            return;
        }

        setRole(storedRole);
        if (storedName) setUserName(storedName);
        if (storedClass) setUserClass(storedClass);
        if (storedId) {
            setUserId(storedId);
            const savedPhoto = localStorage.getItem(`userPhoto_${storedId}`);
            if (savedPhoto) setUserPhoto(savedPhoto);
        }

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
                category: "Utama", items: [
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
                category: "Laporan", items: [
                    { to: '/admin/analytics', icon: TrendingUp, label: 'Executive Dashboard' },
                    { to: '/admin/documents', icon: Printer, label: 'Cetak Dokumen' }
                ]
            },
            {
                category: "Administrasi", items: [
                    { to: '/admin/announcements', icon: Bell, label: 'Pengumuman' },
                    { to: '/admin/backup', icon: Database, label: 'Cadangan Data' },
                    { to: '/admin/settings', icon: Settings, label: 'Pengaturan' }
                ]
            }
        ],
        guru: [
            {
                category: "Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/teacher/schedule', icon: Calendar, label: 'Jadwal Mengajar' },
                    { to: '/teacher/grades', icon: BookOpen, label: 'Input Nilai' },
                    { to: '/teacher/attendance', icon: Users, label: 'Absensi Siswa' },
                    { to: '/teacher/journals', icon: FileText, label: 'Jurnal Mengajar' }
                    // { to: '/teacher/assignments', icon: ClipboardList, label: 'Tugas & Penilaian' }
                ]
            },
            {
                category: "Informasi", items: [
                    { to: '/teacher/announcements', icon: Bell, label: 'Pengumuman' }
                ]
            },
            {
                category: "Pengaturan", items: [
                    { 
                        isCollapsible: true,
                        icon: Settings, 
                        label: 'Pengaturan Akun',
                        subItems: [
                            { to: '/profile', icon: User, label: 'Profil & Foto' },
                            { to: '/change-password', icon: Key, label: 'Ganti Password' }
                        ]
                    }
                ]
            }
        ],
        siswa: [
            {
                category: "Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/student/schedule', icon: Calendar, label: 'Jadwal Pelajaran' },
                    { to: '/student/grades', icon: Award, label: 'Rapor & Nilai' },
                    { to: '/student/attendance', icon: Users, label: 'Rekap Kehadiran' }
                    // { to: '/student/assignments', icon: ClipboardList, label: 'Tugas Saya' }
                ]
            },
            {
                category: "Informasi", items: [
                    { to: '/student/announcements', icon: Bell, label: 'Pengumuman' }
                ]
            },
            {
                category: "Pengaturan", items: [
                    { 
                        isCollapsible: true,
                        icon: Settings, 
                        label: 'Pengaturan Akun',
                        subItems: [
                            { to: '/profile', icon: User, label: 'Profil & Foto' },
                            { to: '/change-password', icon: Key, label: 'Ganti Password' }
                        ]
                    }
                ]
            }
        ],
        parent: [
            {
                category: "Utama", items: [
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' }
                ]
            },
            {
                category: "Akademik", items: [
                    { to: '/student/schedule', icon: Calendar, label: 'Jadwal Anak' },
                    { to: '/student/grades', icon: Award, label: 'Rapor & Nilai' },
                    { to: '/student/attendance', icon: Users, label: 'Rekap Kehadiran' }
                    // { to: '/student/assignments', icon: ClipboardList, label: 'Tugas Anak' }
                ]
            }
        ]
    };

    const getMenu = () => menuItems[role] || menuItems.admin;

    const roleColors = {
        admin: 'bg-neo-accent',
        guru:  'bg-neo-muted',
        siswa: 'bg-neo-secondary',
        parent:'bg-neo-secondary',
    };

    return (
        <div className="flex h-screen overflow-hidden bg-neo-cream">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ===================== SIDEBAR ===================== */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-60 bg-neo-cream border-r-4 border-black flex flex-col
                transform transition-transform duration-200 ease-linear
                lg:static lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo / Brand */}
                <div className="p-4 border-b-4 border-black">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 flex items-center justify-center shrink-0 overflow-hidden">
                                {schoolLogo ? (
                                    <img src={schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                                ) : (
                                    <Zap size={18} strokeWidth={3} className="text-black" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-widest leading-none text-black truncate">
                                    {schoolName}
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-black/50 mt-0.5">
                                    Sistem Akademik
                                </p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden border-2 border-black p-1 hover:bg-neo-accent transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
                    {getMenu().map((group, groupIdx) => (
                        <div key={groupIdx}>
                            <h3 className="px-3 text-[9px] font-black text-black/40 uppercase tracking-[0.2em] mb-1.5 border-b border-black/10 pb-1">
                                {group.category}
                            </h3>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    item.isCollapsible ? (
                                        <SidebarCollapsible key={item.label} icon={item.icon} label={item.label} subItems={item.subItems} />
                                    ) : (
                                        <SidebarLink key={item.to + item.label} to={item.to} icon={item.icon}>
                                            {item.label}
                                        </SidebarLink>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t-4 border-black">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-4 border-black bg-white font-black text-[11px] uppercase tracking-widest text-black hover:bg-neo-accent shadow-[4px_4px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
                    >
                        <LogOut size={14} strokeWidth={3} />
                        <span>Keluar Sistem</span>
                    </button>
                </div>
            </aside>

            {/* ===================== MAIN CONTENT ===================== */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 bg-neo-cream border-b-4 border-black flex items-center justify-between px-4 shrink-0 neo-grid-bg">
                    {/* Hamburger */}
                    <button
                        className="lg:hidden border-4 border-black p-1.5 bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neo-secondary active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={18} strokeWidth={3} />
                    </button>

                    {/* Date */}
                    <div className="hidden lg:flex items-center">
                        <span className="text-[11px] font-black uppercase tracking-widest text-black/50 border-2 border-black px-3 py-1 bg-white">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 ml-auto">
                        <div className="hidden sm:block text-right">
                            <p className="text-[12px] font-black text-black uppercase tracking-tight leading-none">
                                {userName || 'Pengguna'}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-black/50 mt-0.5">
                                {role}{(role === 'siswa' && userClass) ? ` • ${userClass}` : ''}
                            </p>
                        </div>
                        <div className={`w-10 h-10 border-4 border-black ${roleColors[role] || 'bg-neo-muted'} shadow-[3px_3px_0px_0px_#000] flex items-center justify-center font-black text-black text-lg uppercase overflow-hidden`}>
                            {userPhoto ? (
                                <img src={userPhoto} alt="User Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (userName || role)[0].toUpperCase()
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-neo-cream neo-grid-bg">
                    <div className="max-w-screen-2xl mx-auto p-4 md:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
