import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, MessageCircle, Shield, Info, CheckCircle2, Loader2 } from 'lucide-react';

export default function FonnteSettings() {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'fonnte_token')
            .maybeSingle();

        if (data) {
            setToken(data.value);
        }
        setIsLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'fonnte_token', value: token, updated_at: new Date() }, { onConflict: 'key' });

        if (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-white dark:border-indigo-900/40 shadow-sm transition-transform hover:scale-110">
                    <MessageCircle size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengaturan WhatsApp</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Konfigurasi API Gateway Fonnte.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-black/20 overflow-hidden">
                <div className="p-8">
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-4 flex items-start space-x-3 mb-8 border border-indigo-100/50 dark:border-indigo-900/20">
                        <Info className="text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" size={20} />
                        <p className="text-sm text-indigo-600 dark:text-indigo-300 font-medium leading-relaxed">
                            Hubungkan sistem dengan Fonnte untuk mengirim notifikasi WhatsApp otomatis ke guru dan siswa.
                            Anda bisa mendapatkan API Key dari dashboard Fonnte Anda.
                        </p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-1">
                                <Shield size={12} />
                                <span>API Key (Fonnte Token)</span>
                            </label>
                            <input
                                required
                                type="password"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 rounded-3xl px-6 py-5 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all border-2"
                                placeholder="Masukkan token fonnte Anda..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>

                        {message && (
                            <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/40'
                                }`}>
                                <CheckCircle2 size={20} className="shrink-0" />
                                <span className="text-sm font-bold">{message.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-black/20 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span className="uppercase tracking-widest text-xs">Simpan Konfigurasi</span>
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm uppercase tracking-widest mb-4">Informasi Tambahan</h3>
                <ul className="space-y-3">
                    <li className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-bold">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 mr-3" />
                        Pastikan device Anda di Fonnte dalam status "Connected"
                    </li>
                    <li className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-bold">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 mr-3" />
                        Token ini aman dan terenkripsi dalam database Anda
                    </li>
                    <li className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-bold">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 mr-3" />
                        Semua nomor akan otomatis ditambahkan kode negara 62
                    </li>
                </ul>
            </div>
        </div>
    );
}
