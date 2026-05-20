import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, Eye, EyeOff, Zap, Star } from 'lucide-react';

export default function Login() {
    const [schoolName, setSchoolName] = useState('SIM SMK HAFIDZ');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
            if (name) setSchoolName(name);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
                const { data: pwdData } = await supabase.from('settings').select('value').eq('key', `pwd_${guru.id}`).maybeSingle();
                const customPwd = pwdData?.value;
                const isValid = customPwd 
                    ? pass === customPwd 
                    : (pass === 'guru123' || pass === id || (guru.email && pass === guru.email.split('@')[0]));

                if (isValid) {
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
                const { data: pwdData } = await supabase.from('settings').select('value').eq('key', `pwd_${student.id}`).maybeSingle();
                const customPwd = pwdData?.value;

                if (isParent) {
                    const isValid = customPwd ? pass === customPwd : (pass === 'parent123' || pass === 'siswa123' || pass === cleanNis);
                    if (isValid) {
                        localStorage.setItem('userRole', 'parent');
                        localStorage.setItem('userName', 'Orang Tua ' + student.full_name);
                        localStorage.setItem('userId', student.id);
                        navigate('/dashboard');
                        return;
                    }
                } else {
                    const isValid = customPwd ? pass === customPwd : (pass === 'siswa123' || pass === id);
                    if (isValid) {
                        localStorage.setItem('userRole', 'siswa');
                        localStorage.setItem('userName', student.full_name);
                        localStorage.setItem('userClass', student.classes?.name || '-');
                        localStorage.setItem('userId', student.id);
                        navigate('/dashboard');
                        return;
                    }
                }
            }

            setError('ID atau password salah. Periksa kembali kredensial Anda.');
        } catch (err) {
            console.error('Login error:', err);
            setError('Terjadi kesalahan sistem. Hubungi administrator.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-neo-cream">

            {/* ===== LEFT — Neo-Brutal Hero Panel ===== */}
            <div className="hidden lg:flex flex-col justify-between p-10 bg-black text-white relative overflow-hidden border-r-4 border-black">
                {/* Halftone pattern overlay */}
                <div className="absolute inset-0 neo-halftone-white opacity-20 pointer-events-none" />
                
                {/* Decorative squares */}
                <div className="absolute top-20 right-10 w-32 h-32 border-4 border-white/20 rotate-12 pointer-events-none" />
                <div className="absolute bottom-32 right-20 w-16 h-16 bg-neo-accent border-4 border-neo-accent/80 rotate-6 pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-8 h-40 bg-neo-secondary pointer-events-none" />

                {/* Top Bar */}
                <div className="relative z-10 flex justify-between items-center border-b-2 border-white/20 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Akademik Digital</span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-neo-secondary text-black px-2 py-1">
                        {new Date().getFullYear()}
                    </span>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col justify-center flex-1 my-12">
                    {/* Logo box */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 border-4 border-neo-accent bg-neo-accent shadow-[4px_4px_0px_0px_#FF6B6B] flex items-center justify-center">
                            <Zap size={28} strokeWidth={3} className="text-black" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">SELAMAT DATANG DI</p>
                            <p className="text-lg font-black uppercase tracking-tight text-white">{schoolName}</p>
                        </div>
                    </div>

                    {/* Big headline */}
                    <h1 className="text-7xl xl:text-8xl font-black uppercase tracking-tight leading-[0.85] mb-8">
                        <span className="text-neo-secondary">Sistem</span><br />
                        <span className="text-white">Informasi</span><br />
                        <span className="text-neo-accent">Sekolah</span><span className="text-white">.</span>
                    </h1>

                    <div className="border-l-4 border-neo-accent pl-5 py-2">
                        <p className="text-base font-bold text-white/80 max-w-sm leading-relaxed">
                            Platform Akademik Terintegrasi. Akses <span className="text-neo-secondary font-black">real-time</span> ke seluruh data pendidikan.
                        </p>
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="relative z-10 grid grid-cols-3 gap-0 border-t-2 border-white/20 pt-6">
                    {[
                        { label: 'Siswa', desc: 'Data Akademik & Jadwal' },
                        { label: 'Guru', desc: 'Penilaian & Absensi' },
                        { label: 'Admin', desc: 'Konfigurasi Sistem' },
                    ].map((item, i) => (
                        <div key={i} className={`px-4 ${i < 2 ? 'border-r border-white/20' : ''}`}>
                            <p className="font-black text-sm text-white uppercase mb-1">{item.label}</p>
                            <p className="text-[10px] uppercase tracking-wider text-white/50">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== RIGHT — Login Form ===== */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-neo-cream neo-grid-bg relative">

                {/* Decorative star */}
                <div className="absolute top-8 right-8 text-black/10 animate-spin-slow pointer-events-none">
                    <Star size={48} strokeWidth={1} fill="currentColor" />
                </div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    {/* Mobile title */}
                    <div className="lg:hidden text-center mb-8 pb-6 border-b-4 border-black">
                        <h1 className="text-4xl font-black uppercase tracking-tight text-black">SIM SMK</h1>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/50 mt-2">
                            {schoolName} • Akademik
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                        {/* Card Header */}
                        <div className="bg-neo-secondary border-b-4 border-black px-6 py-4">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-black">MASUK SISTEM</h2>
                            <p className="text-[11px] font-bold text-black/60 uppercase tracking-widest mt-0.5">
                                Akses layanan akademik digital
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Error */}
                            {error && (
                                <div className="bg-neo-accent border-4 border-black shadow-[4px_4px_0px_0px_#000] p-4 flex items-start space-x-3">
                                    <AlertCircle size={18} strokeWidth={3} className="shrink-0 mt-0.5 text-black" />
                                    <span className="text-sm font-bold text-black">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* ID Field */}
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-widest text-black">
                                        EMAIL / NIP / NIS
                                    </label>
                                    <input
                                        id="email"
                                        type="text"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-neo-cream border-4 border-black font-bold text-black placeholder:text-black/30 focus:bg-neo-secondary focus:shadow-[4px_4px_0px_0px_#000] transition-all duration-100"
                                        placeholder="Masukkan ID..."
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-1.5">
                                    <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-widest text-black">
                                        KATA SANDI
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-4 pr-12 py-3 bg-neo-cream border-4 border-black font-bold text-black placeholder:text-black/30 focus:bg-neo-secondary focus:shadow-[4px_4px_0px_0px_#000] transition-all duration-100"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-4 flex items-center text-black/50 hover:text-black transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-2 bg-black text-white border-4 border-black font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_0px_#FF6B6B] hover:bg-neo-accent hover:text-black hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <span>MASUK KE SISTEM →</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Access Guide */}
                    <div className="mt-6 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
                        <div className="bg-black px-4 py-2 border-b-4 border-black">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-neo-secondary">PANDUAN AKSES</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {[
                                { role: 'Guru', desc: 'Gunakan NIP resmi atau format email valid.' },
                                { role: 'Siswa', desc: 'Gunakan NIS (Nomor Induk Siswa) yang ditetapkan.' },
                                { role: 'Wali', desc: "Awali dengan 'OT' + NIS siswa (cth: OT2023001)." },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="shrink-0 bg-neo-secondary border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 w-14 text-center">
                                        {item.role}
                                    </span>
                                    <span className="text-xs font-bold text-black/70">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
