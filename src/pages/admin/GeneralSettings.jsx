import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import { Save, Settings, Info, Loader2, GraduationCap } from 'lucide-react';

export default function GeneralSettings() {
    const [schoolName, setSchoolName] = useState('');
    const [schoolLogo, setSchoolLogo] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const { showToast } = useFeedback();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        const { data: settings } = await supabase
            .from('settings')
            .select('*')
            .or('key.eq.school_name,key.eq.school_logo');

        if (settings) {
            const name = settings.find(s => s.key === 'school_name')?.value;
            const logo = settings.find(s => s.key === 'school_logo')?.value;
            if (name) setSchoolName(name);
            if (logo) {
                setSchoolLogo(logo);
                setLogoPreview(logo);
            }
        }
        setIsLoading(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result);
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const fileName = `logo_${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('announcements')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('announcements')
                .getPublicUrl(fileName);

            setSchoolLogo(publicUrl);
            showToast('Logo berhasil diunggah. Klik Simpan untuk menerapkan.', 'info');
        } catch (err) {
            console.error('Upload error:', err);
            showToast('Gagal mengunggah logo. Pastikan bucket "announcements" tersedia.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const settingsToUpsert = [
            { key: 'school_name', value: schoolName, updated_at: new Date() },
            { key: 'school_logo', value: schoolLogo, updated_at: new Date() }
        ];

        const { error } = await supabase
            .from('settings')
            .upsert(settingsToUpsert, { onConflict: 'key' });

        if (error) {
            showToast('Gagal menyimpan pengaturan: ' + error.message, 'error');
        } else {
            showToast('Pengaturan berhasil diperbarui!', 'success');
            // Force a reload or update global state if needed, 
            // but for now, the user can just refresh to see changes globally.
            window.location.reload();
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border-2 border-white shadow-sm transition-transform hover:scale-110">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan Umum</h1>
                    <p className="text-sm text-gray-500 font-medium">Konfigurasi identitas aplikasi.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="bg-blue-50/50 rounded-2xl p-4 flex items-start space-x-3 mb-8 border border-blue-100/50">
                        <Info className="text-blue-600 mt-1 shrink-0" size={20} />
                        <p className="text-sm text-blue-600 font-medium leading-relaxed">
                            Nama dan Logo ini akan muncul di Sidebar Dashboard dan Halaman Login.
                        </p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                                <GraduationCap size={12} />
                                <span>Logo Sekolah</span>
                            </label>
                            <div className="relative group">
                                {logoPreview ? (
                                    <div className="relative h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mx-auto">
                                        <img src={logoPreview} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setLogoPreview(null); setSchoolLogo('') }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 w-32 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-500 transition-all cursor-pointer group mx-auto">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="p-2 bg-white rounded-xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                {isUploading ? <Loader2 className="animate-spin text-blue-600" size={16} /> : <Settings className="text-gray-400 group-hover:text-blue-600" size={16} />}
                                            </div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                {isUploading ? '...' : 'Upload Logo'}
                                            </p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                                <GraduationCap size={12} />
                                <span>Nama Sekolah / Aplikasi</span>
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-3xl px-6 py-5 font-bold text-gray-700 outline-none transition-all border-2"
                                placeholder="Contoh: SIM SMKN 4"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span className="uppercase tracking-widest text-xs">Simpan Perubahan</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
