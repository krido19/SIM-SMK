import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle, UserCircle, Users } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        setTimeout(() => {
            setLoading(false);
            const userIdentifier = email.trim();
            const pass = password.trim();

            let role = '';
            if (userIdentifier === 'admin@school.id' && pass === 'admin123') {
                role = 'admin';
            } else if (userIdentifier === 'guru@school.id' && pass === 'guru123') {
                role = 'guru';
            } else if (userIdentifier.startsWith('OT') && pass === 'parent123') {
                role = 'parent';
            } else if ((userIdentifier === 'siswa123' || /^\d+$/.test(userIdentifier)) && (pass === 'siswa123')) {
                role = 'siswa';
            }

            if (role) {
                localStorage.setItem('userRole', role);
                navigate('/dashboard');
            } else {
                setError('ID atau Password salah. Gunakan: admin@school.id, guru@school.id, NIS, atau OT+NIS.');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-6">
                    <GraduationCap className="text-white" size={40} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    SIM SMKN 4
                </h2>
                <p className="mt-2 text-sm text-gray-600 font-medium">
                    Sistem Informasi Monitoring Nilai & Absensi
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
                <div className="bg-white py-8 px-6 shadow-2xl shadow-blue-100 sm:rounded-[2.5rem] sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                Email / NIS / ID OT
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl font-bold text-gray-700 outline-none transition-all border-2"
                                    placeholder="admin@school.id atau NIS"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl font-bold text-gray-700 outline-none transition-all border-2"
                                    placeholder="••••••••"
                                />
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
                                <span className="px-4 bg-white text-gray-300">
                                    Panduan Login
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-50 flex items-center space-x-4">
                                <Users size={20} className="text-blue-500" />
                                <p className="text-[10px] font-bold text-gray-500 leading-tight">
                                    Siswa: Gunakan <span className="text-blue-600">NIS</span> (Angka) atau `siswa123`
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-50 flex items-center space-x-4">
                                <UserCircle size={20} className="text-indigo-500" />
                                <p className="text-[10px] font-bold text-gray-500 leading-tight">
                                    Orang Tua: Gunakan <span className="text-indigo-600">OT + NIS</span> (Contoh: OT2023001)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
