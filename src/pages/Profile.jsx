import React, { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    Key,
    Camera,
    Save,
    CheckCircle2
} from 'lucide-react';

export default function Profile() {
    const [isSaved, setIsSaved] = useState(false);
    const role = localStorage.getItem('userRole') || 'admin';
    const userName = localStorage.getItem('userName') || 'User';

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="border-b-4 border-ink pb-6">
                <h1 className="text-4xl font-serif font-black text-ink uppercase tracking-tighter leading-none mb-1">PENGATURAN PROFIL</h1>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-2">Kelola informasi pribadi dan keamanan akun Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Col: Avatar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-paper p-8 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="h-32 w-32 border-4 border-ink bg-paper p-1 shadow-[4px_4px_0px_0px_#111111]">
                                <div className="h-full w-full bg-neutral-100 overflow-hidden flex items-center justify-center">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="avatar" />
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 bg-paper p-2 border-2 border-ink shadow-[2px_2px_0px_0px_#111111] text-ink hover:bg-ink hover:text-paper transition-colors">
                                <Camera size={16} />
                            </button>
                        </div>
                        <h2 className="text-xl font-serif font-black text-ink mt-6 uppercase tracking-tight">{userName}</h2>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest mt-2 bg-ink text-paper px-3 py-1">{role.toUpperCase()}</p>
                    </div>

                    <div className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#111111] space-y-2 p-4">
                        <button className="w-full flex items-center space-x-3 p-3 border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold text-[10px] uppercase tracking-widest transition-all">
                            <Shield size={16} />
                            <span>Keamanan Akun</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 p-3 border-2 border-ink hover:bg-ink hover:text-paper text-ink font-mono font-bold text-[10px] uppercase tracking-widest transition-all">
                            <Key size={16} />
                            <span>Ganti Password</span>
                        </button>
                    </div>
                </div>

                {/* Right Col: Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="bg-paper p-8 border-2 border-ink shadow-[8px_8px_0px_0px_#111111] space-y-6">
                        {isSaved && (
                            <div className="bg-green-100 border-2 border-ink text-ink p-4 text-[10px] font-mono font-bold flex items-center uppercase tracking-widest animate-in slide-in-from-top-2 shadow-[4px_4px_0px_0px_#111111]">
                                <CheckCircle2 size={16} className="mr-3" />
                                Profil berhasil diperbarui!
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NAMA LENGKAP</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink" />
                                    <input
                                        type="text"
                                        defaultValue={userName}
                                        className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink uppercase outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">EMAIL SEKOLAH</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink" />
                                    <input
                                        type="email"
                                        defaultValue={`${role}@smkn4.sch.id`}
                                        className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NOMOR TELEPON</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink" />
                                    <input
                                        type="text"
                                        defaultValue="+62 812 3456 7890"
                                        className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">NIP / ID</label>
                                <input
                                    type="text"
                                    disabled
                                    defaultValue="12345678"
                                    className="w-full bg-neutral-100 border-2 border-ink px-4 py-4 font-mono font-bold text-ink/40 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-ink uppercase tracking-widest px-1">ALAMAT DOMISILI</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-4 text-ink" />
                                <textarea
                                    rows="3"
                                    defaultValue="Jl. Pendidikan No. 123, Kota Bandung, Jawa Barat"
                                    className="w-full bg-paper border-2 border-ink pl-12 pr-4 py-4 font-mono font-bold text-ink outline-none focus:shadow-[4px_4px_0px_0px_#111111] transition-all resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="pt-6 border-t-4 border-ink flex justify-end">
                            <button
                                type="submit"
                                className="bg-ink hover:bg-paper text-paper hover:text-ink px-10 py-4 font-mono font-bold border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center space-x-2 uppercase tracking-widest text-xs"
                            >
                                <Save size={20} />
                                <span>Simpan Perubahan</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
