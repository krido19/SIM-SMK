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
                <Loader2 className="animate-spin text-ink" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4 border-b-2 border-ink pb-6">
                <div className="h-16 w-16 bg-paper border-2 border-ink flex items-center justify-center text-ink shadow-[4px_4px_0px_0px_#111111] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    <MessageCircle size={28} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">PENGATURAN WHATSAPP</h1>
                    <p className="text-sm text-gray-600 font-mono uppercase tracking-widest mt-2 block">Konfigurasi API Gateway Fonnte.</p>
                </div>
            </div>

            <div className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111]">
                <div className="p-8">
                    <div className="bg-gray-50 border-2 border-ink p-4 flex items-start space-x-3 mb-8 shadow-[4px_4px_0px_0px_#111111]">
                        <Info className="text-editorial mt-1 shrink-0" size={20} />
                        <p className="text-sm text-ink font-mono font-bold leading-relaxed uppercase">
                            HUBUNGKAN SISTEM DENGAN FONNTE UNTUK MENGIRIM NOTIFIKASI WHATSAPP OTOMATIS KE GURU DAN SISWA. ANDA BISA MENDAPATKAN API KEY DARI DASHBOARD FONNTE ANDA.
                        </p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">
                                <Shield size={16} />
                                <span>API KEY (FONNTE TOKEN)</span>
                            </label>
                            <input
                                required
                                type="password"
                                className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-6 py-5 font-mono font-bold text-ink text-lg outline-none transition-all"
                                placeholder="MASUKKAN TOKEN FONNTE ANDA..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>

                        {message && (
                            <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_#111111] flex items-center space-x-3 animate-in fade-in duration-300 ${message.type === 'success' ? 'bg-paper border-ink text-ink' : 'bg-editorial border-ink text-paper'
                                }`}>
                                <CheckCircle2 size={24} className="shrink-0" />
                                <span className="font-mono font-bold uppercase tracking-widest text-xs">{message.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-5 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            <span className="uppercase tracking-widest text-sm">SIMPAN KONFIGURASI</span>
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-gray-50 p-6 border-2 border-ink shadow-[4px_4px_0px_0px_#111111]">
                <h3 className="font-mono font-black text-ink text-sm uppercase tracking-widest mb-4">INFORMASI TAMBAHAN</h3>
                <ul className="space-y-4">
                    <li className="flex items-center text-xs text-ink font-mono font-bold uppercase tracking-widest">
                        <div className="h-2 w-2 bg-ink border border-ink mr-3" />
                        PASTIKAN DEVICE ANDA DI FONNTE DALAM STATUS "CONNECTED"
                    </li>
                    <li className="flex items-center text-xs text-ink font-mono font-bold uppercase tracking-widest">
                        <div className="h-2 w-2 bg-ink border border-ink mr-3" />
                        TOKEN INI AMAN DAN TERENKRIPSI DALAM DATABASE ANDA
                    </li>
                    <li className="flex items-center text-xs text-ink font-mono font-bold uppercase tracking-widest">
                        <div className="h-2 w-2 bg-ink border border-ink mr-3" />
                        SEMUA NOMOR AKAN OTOMATIS DITAMBAHKAN KODE NEGARA 62
                    </li>
                </ul>
            </div>
        </div>
    );
}
