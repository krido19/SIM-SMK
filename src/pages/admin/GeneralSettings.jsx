import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFeedback } from '../../context/FeedbackContext';
import { Save, Settings, Info, Loader2, GraduationCap } from 'lucide-react';

export default function GeneralSettings() {
    const [schoolName, setSchoolName] = useState('');
    const [schoolLogo, setSchoolLogo] = useState('');
    const [currentWeekType, setCurrentWeekType] = useState('Minggu Ganjil');
    const [currentSemester, setCurrentSemester] = useState('Semester Ganjil');
    const [currentAcademicYear, setCurrentAcademicYear] = useState('23/24');
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
            .select('*');

        if (settings) {
            const name = settings.find(s => s.key === 'school_name')?.value;
            const logo = settings.find(s => s.key === 'school_logo')?.value;
            const week = settings.find(s => s.key === 'current_week_type')?.value;
            const sem = settings.find(s => s.key === 'current_semester')?.value;
            const year = settings.find(s => s.key === 'current_academic_year')?.value;
            
            if (name) setSchoolName(name);
            if (logo) {
                setSchoolLogo(logo);
                setLogoPreview(logo);
            }
            if (week) setCurrentWeekType(week);
            if (sem) setCurrentSemester(sem);
            if (year) setCurrentAcademicYear(year);
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
            { key: 'school_logo', value: schoolLogo, updated_at: new Date() },
            { key: 'current_week_type', value: currentWeekType, updated_at: new Date() },
            { key: 'current_semester', value: currentSemester, updated_at: new Date() },
            { key: 'current_academic_year', value: currentAcademicYear, updated_at: new Date() }
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
                <Loader2 className="animate-spin text-ink" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4 border-b-2 border-ink pb-6">
                <div className="h-16 w-16 bg-paper border-2 border-ink flex items-center justify-center text-ink shadow-[4px_4px_0px_0px_#111111] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-ink font-serif uppercase tracking-tight">PENGATURAN UMUM</h1>
                    <p className="text-sm text-gray-600 font-mono uppercase tracking-widest mt-2 block">Konfigurasi Identitas Aplikasi.</p>
                </div>
            </div>

            <div className="bg-paper border-2 border-ink shadow-[8px_8px_0px_0px_#111111]">
                <div className="p-8">
                    <div className="bg-gray-50 border-2 border-ink p-4 flex items-start space-x-3 mb-8 shadow-[4px_4px_0px_0px_#111111]">
                        <Info className="text-editorial mt-1 shrink-0" size={20} />
                        <p className="text-sm text-ink font-mono font-bold leading-relaxed uppercase">
                            NAMA DAN LOGO INI AKAN MUNCUL DI SIDEBAR DASHBOARD, HALAMAN CETAK, DAN HALAMAN LOGIN.
                        </p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">
                                <GraduationCap size={16} />
                                <span>LOGO SEKOLAH</span>
                            </label>
                            <div className="relative group">
                                {logoPreview ? (
                                    <div className="relative h-40 w-40 border-4 border-ink shadow-[8px_8px_0px_0px_#111111] mx-auto bg-gray-50 flex items-center justify-center p-4">
                                        <img src={logoPreview} className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => { setLogoPreview(null); setSchoolLogo('') }}
                                            className="absolute -top-3 -right-3 p-2 bg-editorial text-paper border-2 border-ink shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                                        >
                                            <Settings size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-40 w-40 border-2 border-dashed border-ink bg-gray-50 hover:bg-paper hover:shadow-[4px_4px_0px_0px_#111111] transition-all cursor-pointer group mx-auto">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="p-3 bg-paper border-2 border-ink shadow-[2px_2px_0px_0px_#111111] mb-3 group-hover:scale-110 transition-transform">
                                                {isUploading ? <Loader2 className="animate-spin text-ink" size={20} /> : <Settings className="text-ink" size={20} />}
                                            </div>
                                            <p className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest">
                                                {isUploading ? 'PROSES...' : 'UNGGAH LOGO'}
                                            </p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">
                                <GraduationCap size={16} />
                                <span>NAMA SEKOLAH / APLIKASI</span>
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-6 py-5 font-mono font-bold text-ink text-lg uppercase outline-none transition-all"
                                placeholder="CONTOH: SIM SMKN 4"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t-2 border-ink border-dashed">
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">
                                    <GraduationCap size={16} />
                                    <span>SIKLUS MINGGU</span>
                                </label>
                                <select
                                    value={currentWeekType}
                                    onChange={(e) => setCurrentWeekType(e.target.value)}
                                    className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Minggu Ganjil">MINGGU GANJIL</option>
                                    <option value="Minggu Genap">MINGGU GENAP</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">
                                    <GraduationCap size={16} />
                                    <span>SEMESTER</span>
                                </label>
                                <select
                                    value={currentSemester}
                                    onChange={(e) => setCurrentSemester(e.target.value)}
                                    className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Semester Ganjil">SEMESTER GANJIL</option>
                                    <option value="Semester Genap">SEMESTER GENAP</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">
                                    <GraduationCap size={16} />
                                    <span>TAHUN AJARAN</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-paper border-2 border-ink focus:bg-gray-50 focus:shadow-[4px_4px_0px_0px_#111111] px-4 py-3 font-mono font-bold text-ink uppercase outline-none transition-all"
                                    placeholder="CTH: 23/24 ATAU 2023-2024"
                                    value={currentAcademicYear}
                                    onChange={(e) => setCurrentAcademicYear(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-ink hover:bg-paper text-paper hover:text-ink font-mono font-bold py-5 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            <span className="uppercase tracking-widest text-sm">SIMPAN PERUBAHAN</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
