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

        const id = email.trim();
        const pass = password.trim();

        try {
            // 1. Admin Hardcoded
            if (id === 'admin@school.id' && pass === 'admin123') {
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('userName', 'Admin Utama');
                localStorage.setItem('userId', 'admin'); // Hardcoded for admin
                navigate('/dashboard');
                return;
            }

            // 2. Guru / Teacher (Check by Email or NIP)
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
                    localStorage.setItem('userNIP', guru.nip); // Store NIP for robust lookup
                    navigate('/dashboard');
                    return;
                }
            }

            // 3. Student (Numeric NIS)
            if (/^\d+$/.test(id)) {
                const { data: student, error: stdErr } = await supabase
                    .from('students')
                    .select('*, classes(name)')
                    .eq('nis', id)
                    .maybeSingle();

                if (!stdErr && student) {
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

            // 4. Parent (OT + NIS)
            if (id.toUpperCase().startsWith('OT')) {
                const nis = id.substring(2).trim();
                const { data: student, error: stdErr } = await supabase
                    .from('students')
                    .select('*')
                    .eq('nis', nis)
                    .maybeSingle();

                if (!stdErr && student) {
                    if (pass === 'parent123' || pass === 'siswa123' || pass === nis) {
                        localStorage.setItem('userRole', 'parent');
                        localStorage.setItem('userName', 'Orang Tua ' + student.full_name);
                        localStorage.setItem('userId', student.id); // Parent views student data
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
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 text-ink bg-paper newsprint-texture selection:bg-ink selection:text-paper">

            {/* Left Column - Editorial Cover */}
            <div className="hidden lg:flex flex-col justify-between p-12 border-r-4 border-ink bg-ink text-paper relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 flex justify-between items-start border-b-2 border-paper/30 pb-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Volume I - Issue No. {new Date().getDate()}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <div className="relative z-10 flex flex-col justify-center flex-1 my-12">
                    <h1 className="text-8xl xl:text-9xl font-serif font-black uppercase tracking-tighter leading-[0.85] mb-8">
                        The<br />Daily<br />Ledger.
                    </h1>
                    <div className="border-l-4 border-newsprint-red pl-6 py-2">
                        <p className="font-mono text-sm uppercase tracking-widest leading-relaxed max-w-md text-paper/80 font-bold">
                            Official Academic Information System for {schoolName}. Authenticated access required for entry.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-8 py-6 border-t-2 border-paper/30 font-mono text-[10px] uppercase tracking-widest text-paper/60">
                    <div>
                        <p className="font-bold text-paper mb-1">Students</p>
                        <p>Academic Records & Schedules</p>
                    </div>
                    <div>
                        <p className="font-bold text-paper mb-1">Faculty</p>
                        <p>Grading & Attendance Management</p>
                    </div>
                    <div>
                        <p className="font-bold text-paper mb-1">Administration</p>
                        <p>System Oversight & Configurations</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative bg-paper transition-colors duration-300">
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={toggleTheme}
                        className="p-2 border-2 border-ink bg-white hover:bg-ink hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                    >
                        {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
                    </button>
                </div>

                <div className="w-full max-w-md mx-auto relative z-10">
                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-12 border-b-4 border-ink pb-6">
                        <h1 className="text-5xl font-serif font-black uppercase tracking-tighter leading-none mb-4">
                            The Ledger.
                        </h1>
                        <p className="font-mono text-[10px] uppercase tracking-widest font-bold">
                            {schoolName} • Information System
                        </p>
                    </div>

                    <div className="bg-white border-2 border-ink shadow-[12px_12px_0px_0px_rgba(17,17,17,1)] relative">
                        <div className="bg-ink text-paper p-4 flex justify-between items-center border-b-2 border-ink">
                            <h2 className="font-mono font-black uppercase tracking-widest text-sm">Authentication Portal</h2>
                            <div className="w-2 h-2 bg-newsprint-red rounded-full animate-pulse" />
                        </div>

                        <div className="p-8">
                            <form className="space-y-6" onSubmit={handleLogin}>
                                {error && (
                                    <div className="bg-newsprint-red text-white p-4 flex items-start space-x-3 border-2 border-ink shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold leading-tight">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-[10px] font-mono font-black text-ink uppercase tracking-[0.2em]">
                                        Identification (Email/NIS/NIP)
                                    </label>
                                    <input
                                        id="email"
                                        type="text"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 transition-all font-mono font-bold text-ink placeholder:text-ink/30"
                                        placeholder="Enter ID..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-[10px] font-mono font-black text-ink uppercase tracking-[0.2em]">
                                        Passcode
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-4 pr-12 py-3 bg-neutral-50 border-2 border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 transition-all font-mono font-bold text-ink placeholder:text-ink/30"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-4 flex items-center text-ink/50 hover:text-ink transition-colors border-l-2 border-ink bg-neutral-100 hover:bg-neutral-200"
                                        >
                                            {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-8 bg-ink hover:bg-newsprint-red text-paper font-mono font-black uppercase tracking-[0.2em] border-2 border-transparent transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <span>Authorize Access</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Guidelines */}
                    <div className="mt-12">
                        <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-6">
                            <h3 className="font-serif font-black text-ink uppercase text-sm tracking-tight">Access Guidelines</h3>
                            <span className="font-mono text-[8px] uppercase tracking-widest text-ink/60">Ref: IDX-001</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 font-mono text-[10px] uppercase tracking-widest text-ink/80">
                            <div className="flex border-l-2 border-ink pl-4 py-1">
                                <span className="w-16 font-black text-ink shrink-0">Faculty:</span>
                                <span>Use Official NIP or valid email format.</span>
                            </div>
                            <div className="flex border-l-2 border-ink pl-4 py-1">
                                <span className="w-16 font-black text-ink shrink-0">Student:</span>
                                <span>Use officially assigned numeric NIS.</span>
                            </div>
                            <div className="flex border-l-2 border-newsprint-red pl-4 py-1">
                                <span className="w-16 font-black text-newsprint-red shrink-0">Parent:</span>
                                <span>Prefix 'OT' to Student NIS (e.g. OT2023001).</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
