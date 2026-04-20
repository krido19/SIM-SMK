import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, Search, Settings2 } from 'lucide-react';

// === A4 Print Template Component ===
const ReportDocumentRef = React.forwardRef(({ studentData, docType, customTitle, customContent, headmasterName, headmasterNip }, ref) => {
    // Determine title based on type
    const getDocTitle = () => {
        if (docType === 'rapor') return 'KUTIPAN PENILAIAN AKADEMIK (RAPOR)';
        if (docType === 'sp') return 'SURAT PERINGATAN (SP)';
        if (docType === 'aktif') return 'SURAT KETERANGAN AKTIF BELAJAR';
        if (docType === 'custom') return customTitle || 'SURAT RESMI';
        return 'DOKUMEN RESMI';
    };

    return (
        <div ref={ref} className="bg-white text-black p-8 print:p-12 w-full h-full text-sm font-serif max-w-[210mm] mx-auto min-h-[297mm]">
            {/* Header / Kop Surat (Berdasarkan Referensi Logo) */}
            <div className="flex items-center justify-between pb-3 mb-1 border-b-4 border-black relative">
                <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-white">
                    <img 
                        src="/logo-jateng.png" 
                        onError={(e) => { e.target.onerror = null; e.target.src='/logo-jateng.jpg?v=2'; }}
                        alt="Logo Pemprov" 
                        className="w-full h-full object-contain" 
                        style={{ mixBlendMode: 'darken' }}
                    />
                </div>
                <div className="flex-1 text-center px-4 font-sans text-black">
                    <h2 className="text-lg font-normal uppercase tracking-wide leading-tight">Pemerintah Provinsi Jawa Tengah</h2>
                    <h1 className="text-xl font-bold uppercase tracking-wider leading-tight mt-0.5">Dinas Pendidikan</h1>
                    <h3 className="text-2xl font-bold uppercase tracking-wide leading-tight mt-0.5">Sekolah Menengah Kejuruan Negeri 1<br/>Magelang</h3>
                    <p className="text-xs mt-1.5 font-medium">Jalan Cawang Nomor 2., Jurangombo Selatan, Kec. Magelang Selatan, Kota Magelang</p>
                    <p className="text-xs font-medium">Kode Pos 56123, Telepon 0293-362172 - 365543, Faksimile 0293-368821, Laman https://smknegeri1magelang.sch.id</p>
                </div>
                <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-white">
                    <img 
                        src="/logo-smk.png" 
                        onError={(e) => { e.target.onerror = null; e.target.src='/logo-smk.jpg?v=2'; }}
                        alt="Logo SMK" 
                        className="w-full h-full object-contain"
                        style={{ mixBlendMode: 'darken' }}
                    />
                </div>
                {/* Thin double line simulation via absolute positioning */}
                <div className="absolute -bottom-1.5 left-0 right-0 border-b border-black"></div>
            </div>
            
            {/* Body */}
            <div className="mt-8">
                <h4 className="text-center font-bold text-lg decoration-solid underline underline-offset-4 mb-8">
                    {getDocTitle()}
                </h4>

                {!studentData && docType !== 'custom' ? (
                    <div className="text-center py-20 text-gray-400">Silakan pilih siswa terlebih dahulu.</div>
                ) : (
                    <div>
                        {/* Identitas Siswa - Optional untuk Custom Surat */}
                        {studentData && (
                            <table className="w-full mb-8 text-sm">
                                <tbody>
                                    <tr>
                                        <td className="py-1 w-48">Nama Peserta Didik</td>
                                        <td className="py-1 w-4">:</td>
                                        <td className="py-1 font-bold">{studentData.full_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1">Nomor Induk Siswa (NIS)</td>
                                        <td className="py-1">:</td>
                                        <td className="py-1">{studentData.nis || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1">Kelas</td>
                                        <td className="py-1">:</td>
                                        <td className="py-1">{studentData.classes?.name || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}

                        {/* Konten Dokumen Berdasarkan Tipe */}
                        {docType === 'rapor' && studentData && (
                            <div>
                                <table className="w-full border-collapse border border-black mb-8">
                                    <thead>
                                        <tr>
                                            <th className="border border-black p-2 bg-gray-100 w-12 text-center">No</th>
                                            <th className="border border-black p-2 bg-gray-100 text-left">Mata Pelajaran</th>
                                            <th className="border border-black p-2 bg-gray-100 w-24 text-center">KKM</th>
                                            <th className="border border-black p-2 bg-gray-100 w-32 text-center">Nilai Akhir</th>
                                            <th className="border border-black p-2 bg-gray-100 w-32 text-center">Predikat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentData.grades && studentData.grades.length > 0 ? (
                                            studentData.grades.map((grade, idx) => {
                                                const kkm = grade.subjects?.kkm || 75;
                                                const val = grade.score;
                                                let predikat = 'D';
                                                if(val >= 90) predikat = 'A';
                                                else if(val >= 80) predikat = 'B';
                                                else if(val >= kkm) predikat = 'C';
                                                
                                                return (
                                                <tr key={grade.id}>
                                                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                                                    <td className="border border-black p-2 pl-4">{grade.subjects?.name || '-'}</td>
                                                    <td className="border border-black p-2 text-center">{kkm}</td>
                                                    <td className="border border-black p-2 text-center font-bold">{val}</td>
                                                    <td className="border border-black p-2 text-center">{predikat}</td>
                                                </tr>
                                            )})
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="border border-black p-4 text-center italic">Belum ada data nilai tersedia untuk semester ini.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {docType === 'aktif' && (
                            <div className="leading-relaxed text-justify space-y-4">
                                <p>Yang bertanda tangan di bawah ini Kepala SMK Negeri 1 Magelang menerangkan dengan sesungguhnya bahwa siswa tersebut di atas:</p>
                                <p>Adalah benar tercatat sebagai peserta didik aktif pada SMK Negeri 1 Magelang pada Tahun Ajaran berjalan. Surat keterangan ini diterbitkan sebagai syarat administrasi yang diperlukan oleh yang bersangkutan.</p>
                                <p>Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>
                            </div>
                        )}

                        {docType === 'sp' && (
                            <div className="leading-relaxed text-justify space-y-4">
                                <p>Menunjuk catatan absensi kehadiran sekolah, dengan ini kami sampaikan bahwa siswa yang bersangkutan telah mencapai batas akumulasi ketidakhadiran (Alpa) yang tidak dapat ditoleransi sesuai peraturan akademik sekolah.</p>
                                <p className="font-bold border border-black p-4 bg-gray-50 my-6 text-center">PERINGATAN AKADEMIK: Alpa melampaui batas wajar.</p>
                                <p>Kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali Murid ke sekolah pada hari dan jam kerja untuk memberikan klarifikasi serta koordinasi lebih lanjut.</p>
                            </div>
                        )}

                        {docType === 'custom' && (
                            <div className="leading-relaxed text-justify whitespace-pre-wrap font-serif">
                                {customContent || (
                                    <span className="text-gray-400 italic">Silakan tuliskan isi surat di panel pengaturan di sebelah kiri...</span>
                                )}
                            </div>
                        )}

                        {/* Footer Tanda Tangan */}
                        <div className="mt-20 flex justify-end">
                            <div className="text-center">
                                <p>Ditetapkan di Magelang</p>
                                <p>Tanggal, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                <p className="mt-2 mb-20 font-bold">Kepala Sekolah,</p>
                                <p className="font-bold underline">{headmasterName || 'H. Contoh Nama, S.Pd., M.Si.'}</p>
                                <p>NIP. {headmasterNip || '19800101 200501 1 001'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// === Main Module UI ===
export default function DocumentGenerator() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [docType, setDocType] = useState('rapor');
    const [isLoading, setIsLoading] = useState(true);
    
    // Custom letter states
    const [customTitle, setCustomTitle] = useState('BEBAS TANGGUNGAN SEKOLAH');
    const [customContent, setCustomContent] = useState('Yang bertanda tangan di bawah ini menerangkan bahwa...\n\nSiswa tersebut telah melengkapi seluruh tanggungan persyaratan akademik dan perpustakaan.');
    
    // Headmaster states
    const [headmasterName, setHeadmasterName] = useState('Drs. H. Ahmad Fulan, M.Si.');
    const [headmasterNip, setHeadmasterNip] = useState('19750512 200112 1 003');

    const componentRef = useRef(null);
    
    const handlePrint = useReactToPrint({
        documentTitle: `Cetak_${docType}_${selectedStudent?.full_name || 'Dokumen'}`,
        contentRef: componentRef,
        pageStyle: `
            @page {
                size: A4;
                margin: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
            }
        `
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select(`
                id, full_name, nis,
                classes(name)
            `)
            .order('full_name', { ascending: true });
        
        if (!error && data) setStudents(data);
        setIsLoading(false);
    };

    const fetchStudentDetails = async (studentId) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select(`
                id, full_name, nis,
                classes(name),
                grades(id, score, subjects(name, kkm))
            `)
            .eq('id', studentId)
            .single();
            
        if (!error && data) {
            setSelectedStudent(data);
        }
        setIsLoading(false);
    };

    const filteredStudents = students.filter(s => 
        s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        s.nis?.toLowerCase().includes(search.toLowerCase())
    );

    const isPrintDisabled = isLoading || (!selectedStudent && docType !== 'custom');

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <div className="inline-flex items-center gap-2 mb-4 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <FileText size={14} className="text-indigo-600" />
                        <span className="bg-indigo-600 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Administrasi
                        </span>
                    </div>
                    <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tight leading-none mb-2">Cetak Dokumen Resmi</h1>
                    <p className="font-sans text-sm text-gray-500 font-medium mt-2">Generate PDF rapor dan surat keterangan standar A4 dengan Kop Sekolah.</p>
                </div>
                
                <button
                    onClick={() => handlePrint()}
                    disabled={isPrintDisabled}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 text-white rounded-xl font-sans font-bold shadow-md transition-all ${isPrintDisabled ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                    <Printer size={18} strokeWidth={2.5} />
                    <span>Cetak {docType.toUpperCase()} Sekarang</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Panel Sidebar Config */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Tipe Dokumen */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-sans font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">Pilih Tipe Dokumen</h3>
                        <div className="space-y-2">
                            {[
                                { id: 'rapor', label: 'Nilai Rapor' },
                                { id: 'aktif', label: 'Surat Ketenangan Aktif' },
                                { id: 'sp', label: 'Surat Peringatan' },
                                { id: 'custom', label: 'Tulis Surat Baru' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setDocType(type.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-sans text-sm font-bold transition-all ${docType === type.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 border border-transparent'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Konfigurasi Tanda Tangan */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-sans font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">Atur Tanda Tangan</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-left">Nama Kepala Sekolah</label>
                                <input
                                    type="text"
                                    value={headmasterName}
                                    onChange={(e) => setHeadmasterName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-left">NIP Kepala Sekolah</label>
                                <input
                                    type="text"
                                    value={headmasterNip}
                                    onChange={(e) => setHeadmasterNip(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Custom Letter Editor */}
                    {docType === 'custom' && (
                         <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm animate-in slide-in-from-left duration-300">
                             <div className="flex items-center gap-2 mb-4">
                                <Settings2 size={16} className="text-blue-600" />
                                <h3 className="font-sans font-bold text-gray-900 uppercase tracking-wider text-xs">Editor Surat Custom</h3>
                             </div>

                             <div className="space-y-4">
                                 <div>
                                     <label className="block text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-left">Judul Dokumen</label>
                                     <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-sans text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-left">Isi Paragraf Surat</label>
                                     <textarea
                                        value={customContent}
                                        onChange={(e) => setCustomContent(e.target.value)}
                                        className="w-full px-3 py-2 h-32 bg-gray-50 border border-gray-200 rounded-lg font-sans text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                                        placeholder="Ketik isi surat di sini..."
                                     />
                                 </div>
                             </div>
                         </div>
                    )}

                    {/* Pilih Siswa */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[500px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-sans font-bold text-gray-900 uppercase tracking-wider text-xs">Sasaran Siswa</h3>
                            {docType === 'custom' && (
                                <span className="text-[9px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Opsional</span>
                            )}
                        </div>
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama / NIS..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {docType === 'custom' && selectedStudent && (
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="w-full text-center px-4 py-2 text-xs text-rose-500 font-bold hover:bg-rose-50 rounded-lg transition-colors border border-dashed border-rose-200 mb-2"
                                >
                                    Hapus Pilihan Siswa
                                </button>
                            )}
                            
                            {filteredStudents.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => fetchStudentDetails(s.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedStudent?.id === s.id ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <p className={`font-sans font-bold text-sm truncate ${selectedStudent?.id === s.id ? 'text-emerald-700' : 'text-gray-900'}`}>{s.full_name}</p>
                                    <p className={`font-sans text-[10px] uppercase tracking-widest mt-1 ${selectedStudent?.id === s.id ? 'text-emerald-600/80' : 'text-gray-400'}`}>{s.nis || 'Non-NIS'} • {s.classes?.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Print Preview Panel */}
                <div className="lg:col-span-3">
                    <div className="bg-gray-200 rounded-3xl p-4 md:p-8 overflow-x-auto shadow-inner min-h-[800px] flex justify-center items-start">
                        {/* Wrapper specifically for printing scale visibility in UI */}
                        <div className="shadow-2xl overflow-hidden bg-white w-[210mm] origin-top scale-[0.85] md:scale-100 transition-transform">
                             <ReportDocumentRef 
                                ref={componentRef} 
                                studentData={selectedStudent} 
                                docType={docType}
                                customTitle={customTitle}
                                customContent={customContent}
                                headmasterName={headmasterName}
                                headmasterNip={headmasterNip}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
