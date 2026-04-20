import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Loader2, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function Login() {
    const [schoolName, setSchoolName] = useState('SIM SMKN 4');
    const [schoolLogo, setSchoolLogo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    React.useEffect(() => {
        fetchSchoolName();
    }, []);

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

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // Membersihkan cache sisa dari sesi sebelumnya sebelum proses login baru.
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('userNIP');
        localStorage.removeItem('userClass');

        const id = email.trim();
        const pass = password.trim();

        try {
            // 1. Admin Login
            if (id === 'admin@school.id' && pass === 'admin123') {
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('userName', 'Admin Utama');
                localStorage.setItem('userId', 'admin');
                navigate('/dashboard');
                return;
            }

            // 2. Guru / Teacher
            const { data: guru, error: guruErr } = await supabase
                .from('teachers')
                .select('*')
                .or(`email.eq.${id},nip.eq.${id}`)
                .maybeSingle();

            if (!guruErr && guru) {
                if (pass === 'guru123' || pass === id || (guru.email && pass === guru.email.split('@')[0])) {
                    localStorage.setItem('userRole', 'guru');
                    localStorage.setItem('userName', guru.name);
                    localStorage.setItem('userId', guru.id);
                    localStorage.setItem('userNIP', guru.nip);
                    navigate('/dashboard');
                    return;
                }
            }

            // 3. Parent or Student
            const isParent = id.toUpperCase().startsWith('OT');
            const cleanNis = isParent ? id.substring(2).trim() : id.trim();

            const { data: student, error: stdErr } = await supabase
                .from('students')
                .select('*, classes(name)')
                .eq('nis', cleanNis)
                .maybeSingle();

            if (!stdErr && student) {
                if (isParent) {
                    if (pass === 'parent123' || pass === 'siswa123' || pass === cleanNis) {
                        localStorage.setItem('userRole', 'parent');
                        localStorage.setItem('userName', 'Orang Tua ' + student.full_name);
                        localStorage.setItem('userId', student.id);
                        navigate('/dashboard');
                        return;
                    }
                } else {
                    if (pass === 'siswa123' || pass === id) {
                        localStorage.setItem('userRole', 'siswa');
                        localStorage.setItem('userName', student.full_name);
                        localStorage.setItem('userClass', student.classes?.name || '-');
                        localStorage.setItem('userId', student.id);
                        navigate('/dashboard');
                        return;
                    }
                }
            }

            setError('Authentication failed. Invalid ID or Password provided.');
        } catch (err) {
            console.error('Login error:', err);
            setError('System error. Please contact administration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-50 text-gray-900 transition-colors duration-300">

            {/* Left Column - Digital Poster */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-blue-600 text-white relative overflow-hidden">
                {/* Large decorative shape */}
                <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] rounded-full border-[100px] border-white/5 pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-white/5 pointer-events-none" />

                <div className="relative z-10 flex justify-between items-center pb-4 border-b border-white/20">
                    <span className="font-sans text-xs uppercase tracking-wider font-semibold opacity-80">Akademik Digital</span>
                    <span className="font-sans text-xs uppercase tracking-wider font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <div className="relative z-10 flex flex-col justify-center flex-1 my-16">
                    <img src="/logo.png" alt="Logo" className="w-40 mb-12 filter brightness-0 invert" />
                    <h1 className="text-7xl xl:text-8xl font-sans font-bold uppercase tracking-tight leading-[0.9] mb-8 mt-2">
                        Sistem<br />Informasi<br />Sekolah.
                    </h1>
                    <div className="pl-6 py-2 border-l-4 border-white">
                        <p className="font-sans text-lg leading-relaxed max-w-sm text-white/90 font-medium">
                            Platform Akademik Terintegrasi {schoolName}. Akses real-time ke data pendidikan.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-8 py-6 border-t border-white/20 font-sans text-xs uppercase tracking-wider text-white/80">
                    <div>
                        <p className="font-bold text-white mb-2 text-sm">Siswa</p>
                        <p className="leading-snug">Data Akademik & Jadwal</p>
                    </div>
                    <div>
                        <p className="font-bold text-white mb-2 text-sm">Guru</p>
                        <p className="leading-snug">Penilaian & Absensi</p>
                    </div>
                    <div>
                        <p className="font-bold text-white mb-2 text-sm">Admin</p>
                        <p className="leading-snug">Konfigurasi Sistem</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative bg-white transition-colors duration-300">
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
                    </button>
                </div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-10 pb-6 border-b border-gray-100">
                        <h1 className="text-4xl font-sans font-bold tracking-tight mb-2">
                            SIM SMK
                        </h1>
                        <p className="font-sans text-sm font-medium text-gray-500 uppercase tracking-wider">
                            {schoolName} • Akademik
                        </p>
                    </div>

                    <div className="bg-white relative">
                        <div className="mb-8">
                            <h2 className="text-3xl font-sans font-bold text-gray-900 mb-2">Selamat Datang</h2>
                            <p className="text-gray-500 font-sans">Masuk untuk mengakses layanan akademik</p>
                        </div>

                        <div className="p-8">
                            <form className="space-y-6" onSubmit={handleLogin}>
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start space-x-3 mb-6">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <span className="font-sans text-sm font-medium">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    <label htmlFor="email" className="block text-sm font-sans font-semibold text-gray-700">
                                        Email / NIP / NIS
                                    </label>
                                    <input
                                        id="email"
                                        type="text"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent focus:border-blue-500 transition-all font-sans text-gray-900 placeholder:text-gray-400"
                                        placeholder="Masukkan ID..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-sans font-semibold text-gray-700">
                                        Kata Sandi
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent focus:border-blue-500 transition-all font-sans text-gray-900 placeholder:text-gray-400"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-lg transition-transform duration-200 hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <span>Masuk ke Sistem</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-sans font-semibold text-gray-700">Panduan Akses</h3>
                        </div>

                        <div className="space-y-3 font-sans text-sm text-gray-500">
                            <div className="flex items-start">
                                <span className="w-16 font-bold text-gray-900 shrink-0">Guru</span>
                                <span>Gunakan NIP resmi atau format email valid.</span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-16 font-bold text-gray-900 shrink-0">Siswa</span>
                                <span>Gunakan NIS (Nomor Induk Siswa) yang ditetapkan.</span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-16 font-bold text-blue-600 shrink-0">Wali</span>
                                <span>Awali dengan 'OT' + NIS siswa (cth: OT2023001).</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
