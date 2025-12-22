import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle, UserCircle, Users, Eye, EyeOff, Sun, Moon } from 'lucide-react';

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

            setError('ID atau Password salah. Gunakan: admin@school.id, guru@school.id, NIS, atau OT+NIS.');
        } catch (err) {
            console.error('Login error:', err);
            setError('Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${theme === 'dark' ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
            <div className="absolute top-6 right-6">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:scale-110 active:scale-95 transition-all"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className={`inline-flex items-center justify-center p-2 rounded-2xl mb-6 overflow-hidden w-24 h-24 ${!schoolLogo ? 'bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/20' : ''}`}>
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <GraduationCap className="text-white" size={48} />
                    )}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                    {schoolName}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Sistem Informasi Monitoring Nilai & Absensi
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
                <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-2xl shadow-blue-100 dark:shadow-black/20 sm:rounded-[2.5rem] sm:px-10 border border-gray-100 dark:border-gray-800">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                                Email / NIS / ID OT
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 dark:text-gray-600">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 rounded-2xl font-bold text-gray-700 dark:text-gray-200 outline-none transition-all border-2"
                                    placeholder="admin@school.id, NIP, atau NIS"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-600">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 rounded-2xl font-bold text-gray-700 dark:text-gray-200 outline-none transition-all border-2"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-500">
                                    Ingat saya
                                </label>
                            </div>

                            <div className="text-xs">
                                <a href="#" className="font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest">
                                    Lupa?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <span className="uppercase tracking-widest text-sm">Masuk Sekarang</span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="px-4 bg-white dark:bg-gray-900 text-gray-300 dark:text-gray-700">
                                    Panduan Login
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-50 dark:border-gray-800 flex items-center space-x-4">
                                <UserCircle size={20} className="text-indigo-500" />
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-tight">
                                    Guru: Gunakan <span className="text-indigo-600 dark:text-indigo-400">NIP</span> atau Email
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-50 dark:border-gray-800 flex items-center space-x-4">
                                <Users size={20} className="text-blue-500" />
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-tight">
                                    Siswa: Gunakan <span className="text-blue-600 dark:text-blue-400">NIS</span> (Angka)
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-50 dark:border-gray-800 flex items-center space-x-4">
                                <AlertCircle size={20} className="text-amber-500" />
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-tight">
                                    Orang Tua: Gunakan <span className="text-amber-600 dark:text-amber-400">OT + NIS</span> (Contoh: OT2023001)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
