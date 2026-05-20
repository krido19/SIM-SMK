import React, { useState } from 'react';
import { Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChangePassword() {
    const userId = localStorage.getItem('userId');
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState(null);
    const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (passwordForm.new !== passwordForm.confirm) {
            setError("Password baru dan konfirmasi tidak cocok!");
            return;
        }

        if (userId && userId !== 'guest' && userId !== 'admin') {
            try {
                await supabase
                    .from('settings')
                    .upsert({ key: `pwd_${userId}`, value: passwordForm.new });
                
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
                setPasswordForm({ old: '', new: '', confirm: '' });
            } catch (err) {
                console.error(err);
                setError("Gagal menyimpan password.");
            }
        } else {
            setError("Anda tidak dapat mengganti password untuk akun ini.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="border-b-4 border-ink pb-6">
                <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">GANTI PASSWORD</h1>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-2">Perbarui kata sandi akun Anda secara berkala untuk keamanan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Col: Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] space-y-2 p-4">
                        <div className="w-full flex items-center space-x-3 p-3 border-2 border-ink font-mono font-bold text-[10px] uppercase tracking-widest bg-ink text-paper">
                            <Key size={16} />
                            <span>Keamanan Akun</span>
                        </div>
                    </div>
                    
                    <div className="bg-neo-cream p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111111]">
                        <h4 className="font-bold text-ink uppercase tracking-tight mb-2 text-sm">Tips Keamanan</h4>
                        <ul className="text-xs space-y-2 font-mono text-ink/80 list-disc list-inside">
                            <li>Gunakan minimal 8 karakter</li>
                            <li>Kombinasi huruf besar, kecil, dan angka</li>
                            <li>Jangan gunakan password yang sama dengan akun lain</li>
                        </ul>
                    </div>
                </div>

                {/* Right Col: Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handlePasswordSubmit} className="bg-paper p-8 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] space-y-6">
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 text-[10px] font-mono font-bold flex items-center uppercase tracking-widest shadow-[4px_4px_0px_0px_#111111] mb-4">
                                <AlertCircle size={16} className="mr-3" />
                                {error}
                            </div>
                        )}
                        {isSaved && (
                            <div className="bg-green-100 border-2 border-ink text-ink p-4 text-[10px] font-mono font-bold flex items-center uppercase tracking-widest animate-in slide-in-from-top-2 shadow-[4px_4px_0px_0px_#111111] mb-4">
                                <CheckCircle2 size={16} className="mr-3" />
                                Password berhasil diperbarui!
                            </div>
                        )}

                        <div className="space-y-6 max-w-md">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">Password Lama</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.old}
                                    onChange={e => setPasswordForm({...passwordForm, old: e.target.value})}
                                    className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">Password Baru</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                    className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.confirm}
                                    onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                    className="w-full bg-paper border-2 border-ink px-4 py-3 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t-4 border-ink flex justify-start">
                            <button
                                type="submit"
                                className="bg-ink hover:bg-paper text-paper hover:text-ink px-10 py-4 font-mono font-bold border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center space-x-2 uppercase tracking-widest text-xs"
                            >
                                <Key size={20} />
                                <span>Simpan Password</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
