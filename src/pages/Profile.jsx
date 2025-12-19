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

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pengaturan Profil</h1>
                <p className="text-gray-500 font-medium mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Col: Avatar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl shadow-blue-100">
                                <div className="h-full w-full bg-white rounded-[1.8rem] overflow-hidden flex items-center justify-center">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="avatar" />
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-xl border border-gray-50 text-blue-600 hover:scale-110 active:scale-95 transition-all">
                                <Camera size={18} />
                            </button>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mt-6">Admin Sistem</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Administrator</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <button className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-50 text-gray-600 font-bold text-sm transition-all group">
                            <Shield size={18} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                            <span>Keamanan Akun</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-50 text-gray-600 font-bold text-sm transition-all group">
                            <Key size={18} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                            <span>Ganti Password</span>
                        </button>
                    </div>
                </div>

                {/* Right Col: Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
                        {isSaved && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center animate-in slide-in-from-top-2">
                                <CheckCircle2 size={16} className="mr-3" />
                                Profil berhasil diperbarui!
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="text"
                                        defaultValue="Admin Sistem"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Sekolah</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="email"
                                        defaultValue="admin@smkn4.sch.id"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nomor Telepon</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="text"
                                        defaultValue="+62 812 3456 7890"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">NIP / ID</label>
                                <input
                                    type="text"
                                    disabled
                                    defaultValue="198501012010011001"
                                    className="w-full px-4 py-3 bg-gray-100 border-transparent rounded-2xl font-bold text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Alamat Domisili</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-4 text-gray-300" />
                                <textarea
                                    rows="3"
                                    defaultValue="Jl. Pendidikan No. 123, Kota Bandung, Jawa Barat"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl outline-none transition-all font-bold text-gray-700 resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-3xl font-black shadow-xl shadow-blue-100 transition-all flex items-center space-x-2 active:scale-95"
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
