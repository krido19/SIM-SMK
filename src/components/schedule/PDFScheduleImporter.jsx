import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    FileText, Upload, Download, X, Loader2, CheckCircle2,
    AlertCircle, Table2, RefreshCw, Info, Trash2, Save
} from 'lucide-react';

// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Prefix sekolah yang umum muncul di judul PDF aSc Timetables
const SCHOOL_PREFIXES = /^(smkn\s*\d*|sman\s*\d*|sma\s*n\s*\d*|smk\s*n\s*\d*|sma\s*\d*|smk\s*\d*|mts\s*\d*|ma\s*\d*)\s*/i;

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

/** Lazy load PDF.js dari CDN */
const loadPdfJs = () =>
    new Promise((resolve, reject) => {
        if (window.__pdfjsLib) return resolve(window.__pdfjsLib);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            window.__pdfjsLib = window.pdfjsLib;
            resolve(window.__pdfjsLib);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });

/** Render halaman PDF ke canvas → data URL */
const renderPageToCanvas = async (pdfDoc, pageNum, scale = 1.5) => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/png');
};

/** Ekstrak items teks lengkap dengan posisi x,y */
const extractTextItems = async (page) => {
    const content = await page.getTextContent();
    const vp = page.getViewport({ scale: 1 });
    return content.items.map(item => {
        const tx = item.transform;
        return {
            str: item.str.trim(),
            x: tx[4],
            y: vp.height - tx[5], // flip Y
            w: item.width,
            h: item.height,
        };
    }).filter(i => i.str.length > 0);
};

/**
 * Ekstrak nama-nama kelas dari judul halaman PDF aSc Timetables.
 * Contoh: "smkn1 X BA / X BB" → ["X BA", "X BB"]
 * Contoh: "X DPIB" → ["X DPIB"]
 */
const extractClassNamesFromTitle = (rawTitle) => {
    // Strip prefix sekolah (smkn1, dll)
    let stripped = rawTitle.replace(SCHOOL_PREFIXES, '').trim();

    // Bersihkan noise: ISTIRAHAT 1/2, ISHOMA, BREAK, tanggal (dd/mm/yyyy)
    stripped = stripped
        .replace(/\b(istirahat\s*\d*|ishoma|break)\b/gi, '')
        .replace(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    // Cek apakah ada pemisah "/" (kelas ganda)
    if (stripped.includes('/')) {
        // Split by "/" dan trim masing-masing
        const parts = stripped.split('/').map(p => p.trim()).filter(p => p.length > 0);
        return parts;
    }

    // Satu kelas saja
    return stripped.length > 0 ? [stripped] : [];
};

/**
 * Coba cocokkan nama kelas dari PDF ke daftar kelas di DB.
 * Strategi:
 * 1. Exact match (case-insensitive)
 * 2. DB contains PDF name
 * 3. PDF contains DB name
 * 4. Partial match (ignore spaces/case)
 */
const matchClassToDb = (className, dbClasses) => {
    if (!className || dbClasses.length === 0) return null;
    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const cn = norm(className);

    // 1. Exact
    let found = dbClasses.find(c => norm(c.name) === cn);
    if (found) return found;

    // 2. DB name contains PDF class name
    found = dbClasses.find(c => norm(c.name).includes(cn));
    if (found) return found;

    // 3. PDF class name contains DB name
    found = dbClasses.find(c => cn.includes(norm(c.name)));
    if (found) return found;

    // 4. Remove spaces and compare
    const nosp = s => s.toLowerCase().replace(/\s/g, '');
    found = dbClasses.find(c => nosp(c.name) === nosp(className));
    return found || null;
};

/**
 * Group text items into horizontal lines by Y proximity.
 */
const groupItemsByLine = (items, yTolerance = 4) => {
    const sorted = [...items].sort((a, b) => a.y - b.y);
    const lines = [];
    for (const item of sorted) {
        const existing = lines.find(line => Math.abs(line.y - item.y) <= yTolerance);
        if (existing) {
            existing.items.push(item);
        } else {
            lines.push({ y: item.y, items: [item] });
        }
    }
    lines.forEach(l => l.items.sort((a, b) => a.x - b.x));
    return lines.sort((a, b) => a.y - b.y);
};

/** Regex gelar lengkap (termasuk Drs/Dra/Dr) */
const GELAR_REGEX = /S\.(Pd|Ag|Si|T|Kom|Sos|E|Hum|Th|Farm|Tr)|M\.(Pd|Si|Ag|Kom|M|T|Hum|Kes)|Dr\.|Drs\.|Dra\./i;

/**
 * Parser utama jadwal aSc Timetables.
 * Returns: { classNames: string[], rows: Array<{hari, jam_ke, mata_pelajaran, guru, ruangan}> }
 */
const parseAscTimetable = (items, pageWidth) => {
    if (!items || items.length === 0) return { classNames: [], rows: [] };

    // ── 1. Judul halaman ──────────────────────────────────
    const sortedByY = [...items].sort((a, b) => a.y - b.y);
    const titleY = sortedByY[0].y;
    const titleItems = items.filter(i => i.y <= titleY + 40 && i.str.length > 1);
    const rawTitleCombined = titleItems
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    const classNames = extractClassNamesFromTitle(rawTitleCombined);
    // Set untuk exclude title items agar tidak bocor ke konten cell
    const titleItemSet = new Set(titleItems);

    // ── 2. Header jam (angka 1..12) ───────────────────────
    const numberItems = items.filter(i =>
        /^\d{1,2}$/.test(i.str) &&
        parseInt(i.str) >= 1 &&
        parseInt(i.str) <= 12
    );

    const jamCols = {};
    numberItems.forEach(ni => {
        const jam = parseInt(ni.str);
        if (!jamCols[jam] || ni.y < jamCols[jam].y) {
            jamCols[jam] = { x: ni.x + ni.w / 2, y: ni.y };
        }
    });

    const jamKeys = Object.keys(jamCols).map(Number).sort((a, b) => a - b);
    if (jamKeys.length === 0) return { classNames, rows: [] };

    const jamRanges = jamKeys.map((jam, idx) => {
        const x = jamCols[jam].x;
        const prevX = idx > 0 ? jamCols[jamKeys[idx - 1]].x : 0;
        const nextX = idx + 1 < jamKeys.length ? jamCols[jamKeys[idx + 1]].x : pageWidth;
        return {
            jam,
            xMin: x - (x - prevX) / 2,
            xMax: x + (nextX - x) / 2,
        };
    });

    // ── 3. Baris hari (midpoint Y agar guru di atas label hari ikut tertangkap) ──
    const hariFound = [];
    HARI_LIST.forEach(hari => {
        items
            .filter(i => i.str.toLowerCase() === hari.toLowerCase())
            .forEach(i => hariFound.push({ hari, y: i.y }));
    });

    hariFound.sort((a, b) => a.y - b.y);
    const uniqueHari = [];
    hariFound.forEach(h => {
        if (!uniqueHari.find(u => u.hari === h.hari)) uniqueHari.push(h);
    });

    if (uniqueHari.length === 0) return { classNames, rows: [] };

    const hariRanges = uniqueHari.map((h, idx) => {
        const prevY = idx > 0 ? uniqueHari[idx - 1].y : 0;
        const nextY = idx + 1 < uniqueHari.length ? uniqueHari[idx + 1].y : Infinity;
        return {
            hari: h.hari,
            // Gunakan midpoint sehingga nama guru di atas teks "Senin" tetap masuk range yang benar
            yMin: idx > 0 ? (prevY + h.y) / 2 : 0,
            yMax: nextY !== Infinity ? (h.y + nextY) / 2 : Infinity,
        };
    });

    // ── 4. Skip patterns (R.xx ditangani di dalam sel, bukan di sini) ──────────
    const skipWords = new Set([
        ...HARI_LIST.map(h => h.toLowerCase()),
        'istirahat', 'istirahat1', 'istirahat2', 'ishoma', 'break',
        'smk', 'sma', 'mts', 'asc', 'timetables',
        'menghasilkan', 'jadwal:', 'jadwal',
        ...jamKeys.map(String),
    ]);

    const isSkip = (str) => {
        const s = str.toLowerCase().replace(/[^a-z0-9:.\/]/g, '');
        if (skipWords.has(s)) return true;
        if (SCHOOL_PREFIXES.test(str)) return true;
        if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) return true;
        if (str.length <= 1) return true;
        return false;
    };

    // ── 5. Ekstrak konten tiap cell ───────────────────────
    const rows = [];

    hariRanges.forEach(({ hari, yMin, yMax }) => {
        jamRanges.forEach(({ jam, xMin, xMax }) => {
            const cellItems = items
                .filter(i => {
                    if (i.y < yMin || i.y >= yMax) return false;
                    if (titleItemSet.has(i)) return false;
                    if (isSkip(i.str)) return false;
                    // ── Merged cell overlap check ────────────────────────────
                    // aSc Timetables: 1 pelajaran bisa span 2+ jam (merged cell).
                    // Teks PDF diletakkan di CENTER merged area → mungkin berada
                    // di luar left-edge range salah satu jam.
                    // Fix: untuk item dengan lebar signifikan (w > 2px), gunakan
                    // RANGE OVERLAP [i.x, i.x+i.w] ∩ [xMin, xMax] ≠ ∅
                    // → otomatis captured di KEDUA jam yang overlapping.
                    if (i.w > 2) {
                        return i.x < xMax && (i.x + i.w) > xMin;
                    }
                    // Item sempit (single char, dll): gunakan left-edge check biasa
                    return i.x >= xMin && i.x < xMax;
                })
                .sort((a, b) => a.y - b.y);

            if (cellItems.length === 0) return;

            // Pisahkan ruangan (R.xx) lebih dulu
            const roomItems = cellItems.filter(i => /^[Rr]\.\d+$/i.test(i.str.trim()));
            const contentItems = cellItems.filter(i => !roomItems.includes(i));
            const ruangan = roomItems.map(i => i.str.trim()).join(', ');

            if (contentItems.length === 0) return;

            // Kelompokkan konten ke baris berdasarkan Y
            const lines = groupItemsByLine(contentItems);

            // Cari baris yang mengandung gelar → seluruh baris itu = guru
            // Bisa ada 2 guru (2 baris berbeda keduanya punya gelar)
            const guruLineIndices = new Set();
            lines.forEach((line, idx) => {
                if (line.items.some(i => GELAR_REGEX.test(i.str))) {
                    guruLineIndices.add(idx);
                }
            });

            let guru = '';
            let mapel = '';

            if (guruLineIndices.size > 0) {
                const guruLines = lines.filter((_, idx) => guruLineIndices.has(idx));
                const mapelLines = lines.filter((_, idx) => !guruLineIndices.has(idx));

                // Jika 2 guru, pisahkan dengan " / "
                guru = guruLines
                    .map(l => l.items.map(i => i.str).join(' '))
                    .join(' / ')
                    .replace(/\s+/g, ' ')
                    .trim();

                mapel = mapelLines
                    .map(l => l.items.map(i => i.str).join(' '))
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            } else if (lines.length >= 2) {
                // Tidak ada gelar: baris pertama = guru, sisanya = mapel
                guru = lines[0].items.map(i => i.str).join(' ').trim();
                mapel = lines.slice(1)
                    .map(l => l.items.map(i => i.str).join(' '))
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            } else {
                // Hanya 1 baris → anggap mapel
                mapel = lines[0]?.items.map(i => i.str).join(' ').trim() || '';
            }

            // ── FIX A: mapel kosong padahal guru terdeteksi ──────────
            // Terjadi saat subject & guru sangat berdekatan di Y (< 4px) sehingga
            // groupItemsByLine (tolerance=4) menggabungkan keduanya jadi 1 line.
            // Solusi: re-group ulang contentItems dengan tolerance KETAT (1.5px)
            // agar subject dan guru terpisah, lalu ekstrak mapel dari non-guru lines.
            if (!mapel && guruLineIndices.size > 0) {
                const tightLines = groupItemsByLine(contentItems, 1.5);
                const tightGuruIdx = new Set();
                tightLines.forEach((tl, idx) => {
                    if (tl.items.some(ti => GELAR_REGEX.test(ti.str))) tightGuruIdx.add(idx);
                });
                const tightMapelLines = tightLines.filter((_, idx) => !tightGuruIdx.has(idx));
                if (tightMapelLines.length > 0) {
                    mapel = tightMapelLines
                        .map(l => l.items.map(i => i.str).join(' '))
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            }

            // ── FIX B: Strip nama kelas di awal mapel ───────────────
            // Terjadi saat teks judul ("X BA / X BB") bocor masuk konten cell.
            // Hapus pola level kelas (X/XI/XII + kode jurusan) dari awal mapel.
            if (mapel) {
                mapel = mapel
                    .replace(/^(?:(?:XII|XI|X)\s+[A-Z]{2,5}(?:\s*\/\s*(?:XII|XI|X)\s+[A-Z]{2,5})*\s*)+/i, '')
                    .trim();
            }

            if (!mapel && !guru) return;

            rows.push({
                hari,
                jam_ke: jam,
                mata_pelajaran: mapel || '(cek manual)',
                guru: guru || '',
                ruangan: ruangan || '',
            });
        });
    });

    return { classNames, rows };
};

// ──────────────────────────────────────────────────────────
// Komponen Utama
// ──────────────────────────────────────────────────────────

export default function PDFScheduleImporter({
    dbClasses = [],
    dbTeachers = [],
    dbSubjects = [],
    currentWeekType = 'Minggu Ganjil',
    onImport,
    onClose
}) {
    const [step, setStep] = useState('upload');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');

    const [pdfPreviewUrls, setPdfPreviewUrls] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [editableRows, setEditableRows] = useState([]);
    const [weekType, setWeekType] = useState(currentWeekType);

    const fileRef = useRef(null);
    const pdfDocRef = useRef(null);

    // ── Load & parse PDF ──────────────────────────────────
    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('File harus berformat PDF (.pdf)');
            return;
        }

        setError('');
        setIsLoading(true);
        setStep('upload');

        try {
            const pdfjsLib = await loadPdfJs();
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            pdfDocRef.current = pdfDoc;

            const numPages = pdfDoc.numPages;
            setTotalPages(numPages);
            setCurrentPage(0);

            const previews = [];
            const allRows = [];

            for (let p = 1; p <= numPages; p++) {
                const page = await pdfDoc.getPage(p);
                const imgUrl = await renderPageToCanvas(pdfDocRef.current, p, 1.5);
                previews.push(imgUrl);

                const items = await extractTextItems(page);
                const vp = page.getViewport({ scale: 1 });
                const { classNames, rows } = parseAscTimetable(items, vp.width);

                // Duplikasi baris per kelas yang ditemukan
                // Contoh: "X BA / X BB" → duplikat semua baris untuk X BA dan X BB
                const resolvedClasses = classNames.length > 0
                    ? classNames
                    : ['(belum terdeteksi)'];

                resolvedClasses.forEach((cn, cnIdx) => {
                    // Cari match di DB
                    const matched = matchClassToDb(cn, dbClasses);

                    rows.forEach((row, rIdx) => {
                        allRows.push({
                            ...row,
                            id: `p${p}-c${cnIdx}-r${rIdx}`,
                            // Gunakan nama kelas dari DB jika ada, else gunakan hasil parse
                            kelas: matched?.name || cn,
                            kelas_id: matched?.id || null,
                            week_type: currentWeekType,
                            ruangan: row.ruangan || '',
                            deleted: false,
                        });
                    });
                });
            }

            setPdfPreviewUrls(previews);
            setEditableRows(allRows);
            setStep('preview');
        } catch (err) {
            console.error('PDF error:', err);
            setError('Gagal memuat PDF: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [dbClasses, currentWeekType]);

    // ── CRUD baris ────────────────────────────────────────
    const updateRow = (id, field, value) =>
        setEditableRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    const updateRowClass = (id, className) => {
        const matched = dbClasses.find(c => c.name === className);
        setEditableRows(prev => prev.map(r =>
            r.id === id ? { ...r, kelas: className, kelas_id: matched?.id || null } : r
        ));
    };

    const deleteRow = (id) =>
        setEditableRows(prev => prev.map(r => r.id === id ? { ...r, deleted: true } : r));

    const restoreRow = (id) =>
        setEditableRows(prev => prev.map(r => r.id === id ? { ...r, deleted: false } : r));

    const applyWeekTypeToAll = () =>
        setEditableRows(prev => prev.map(r => ({ ...r, week_type: weekType })));

    // ── Export Excel ──────────────────────────────────────
    const handleExportExcel = () => {
        const active = editableRows.filter(r => !r.deleted);
        if (active.length === 0) return;

        const sheetData = active.map(r => ({
            'Hari': r.hari,
            'Jam Ke': r.jam_ke,
            'Waktu Mulai': '',
            'Waktu Selesai': '',
            'Kelas': r.kelas,
            'Mata Pelajaran': r.mata_pelajaran,
            'Guru': r.guru,
            'Ruangan': r.ruangan || '',
            'Minggu': r.week_type,
        }));

        const ws = XLSX.utils.json_to_sheet(sheetData);
        ws['!cols'] = [
            { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
            { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 15 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');
        XLSX.writeFile(wb, 'Jadwal_dari_PDF.xlsx');
    };

    // ── Import ke DB ──────────────────────────────────────
    const handleImportToDB = async (forceAll = false) => {
        setError('');
        setWarning('');
        const active = editableRows.filter(r => !r.deleted);
        if (active.length === 0) return;

        // Build payload — semua baris, class_id dari kelas_id di state
        const schedules = active.map(r => {
            const matchedClass = r.kelas_id
                ? dbClasses.find(c => c.id === r.kelas_id)
                : matchClassToDb(r.kelas, dbClasses);

            const matchedTeacher = dbTeachers.find(t =>
                t.name.toLowerCase() === r.guru.toLowerCase()
            );

            return {
                class_id: matchedClass?.id || null,
                class_name: matchedClass?.name || r.kelas,
                subject_name: r.mata_pelajaran,
                teacher_id: matchedTeacher?.id || null,
                teacher_name: matchedTeacher?.name || r.guru,
                day: r.hari,
                week_type: r.week_type,
                jam_ke: parseInt(r.jam_ke) || 1,
                start_time: null,
                end_time: null,
                ruangan: r.ruangan || '',
            };
        });

        const withoutClassId = schedules.filter(s => !s.class_id);

        // Tampilkan warning (bukan error blocking) jika ada kelas yang belum cocok
        if (withoutClassId.length > 0) {
            const kelasNotFound = [...new Set(
                active.filter(r => !matchClassToDb(r.kelas, dbClasses)).map(r => r.kelas)
            )].join(', ');
            setWarning(`⚠ ${withoutClassId.length} baris kelas belum ada di DB: ${kelasNotFound}. Baris ini tetap diimport dengan kelas kosong.`);
        }

        // Import SEMUA baris (termasuk yang class_id null)
        if (onImport) {
            await onImport(schedules);
            setStep('done');
        }
    };

    const activeRows = editableRows.filter(r => !r.deleted);
    const deletedCount = editableRows.filter(r => r.deleted).length;
    const unmatchedCount = activeRows.filter(r => !r.kelas_id && !matchClassToDb(r.kelas, dbClasses)).length;

    // ──────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-paper border-4 border-ink shadow-[16px_16px_0px_0px_#111111] w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b-4 border-ink flex items-center justify-between bg-gray-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText size={24} strokeWidth={2.5} className="text-ink" />
                        <div>
                            <h2 className="text-xl font-black text-ink uppercase tracking-widest font-serif">
                                Import Jadwal dari PDF
                            </h2>
                            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                aSc Timetables → Preview → Verifikasi → Import / Export Excel
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 border-2 border-transparent hover:border-ink hover:text-red-500 transition-all text-ink">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Steps */}
                <div className="flex border-b-2 border-ink shrink-0">
                    {[
                        { id: 'upload', label: '1. Upload PDF' },
                        { id: 'preview', label: '2. Preview' },
                        { id: 'table', label: '3. Verifikasi Data' },
                        { id: 'done', label: '4. Selesai' },
                    ].map(s => (
                        <div key={s.id}
                            className={`flex-1 py-2 px-4 text-center text-[10px] font-mono font-black uppercase tracking-widest border-r-2 border-ink last:border-r-0 transition-colors ${step === s.id ? 'bg-ink text-paper' : 'bg-gray-50 text-gray-400'}`}>
                            {s.label}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-500">
                            <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                            <p className="text-sm font-mono font-bold text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Warning (non-blocking) */}
                    {warning && (
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-400">
                            <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                            <p className="text-xs font-mono text-yellow-700">{warning}</p>
                        </div>
                    )}

                    {/* STEP: UPLOAD */}
                    {step === 'upload' && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-6">
                            <div
                                className="border-4 border-dashed border-ink p-16 flex flex-col items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors group w-full max-w-md"
                                onClick={() => fileRef.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files.length > 0)
                                        handleFileChange({ target: { files: e.dataTransfer.files } });
                                }}
                            >
                                <div className="w-20 h-20 bg-ink flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                                    <FileText size={40} className="text-paper" strokeWidth={2} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-ink uppercase tracking-widest font-serif">Drag & Drop PDF Jadwal</p>
                                    <p className="text-sm font-mono font-bold text-gray-500 mt-1">atau klik untuk pilih file</p>
                                    <p className="text-[10px] font-mono text-gray-400 mt-2 uppercase tracking-widest">Format: aSc Timetables PDF (.pdf)</p>
                                </div>
                            </div>
                            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

                            <div className="flex gap-2 p-4 bg-blue-50 border-2 border-blue-400 max-w-lg w-full">
                                <Info size={16} className="text-blue-600 mr-2 mt-0.5 shrink-0" strokeWidth={2.5} />
                                <div>
                                    <p className="text-xs font-mono font-bold text-blue-700 uppercase tracking-widest">Tips:</p>
                                    <p className="text-xs font-mono text-blue-600 mt-1">
                                        Kelas ganda seperti <strong>"X BA / X BB"</strong> akan otomatis dibagi menjadi 2 set jadwal terpisah.
                                        Pastikan nama kelas di sistem sudah sesuai (contoh: "X BA", "X BB").
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={48} className="text-ink animate-spin" strokeWidth={2} />
                            <p className="text-sm font-mono font-bold text-ink uppercase tracking-widest">Memproses PDF...</p>
                        </div>
                    )}

                    {/* STEP: PREVIEW */}
                    {step === 'preview' && !isLoading && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-mono font-bold text-ink uppercase tracking-widest">
                                    Preview Halaman {currentPage + 1} dari {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                        className="px-3 py-1.5 border-2 border-ink text-ink text-xs font-mono font-black uppercase disabled:opacity-30 hover:bg-ink hover:text-paper transition-all">
                                        ◀ PREV
                                    </button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={currentPage === totalPages - 1}
                                        className="px-3 py-1.5 border-2 border-ink text-ink text-xs font-mono font-black uppercase disabled:opacity-30 hover:bg-ink hover:text-paper transition-all">
                                        NEXT ▶
                                    </button>
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {pdfPreviewUrls.map((url, idx) => (
                                        <button key={idx} onClick={() => setCurrentPage(idx)}
                                            className={`shrink-0 border-2 transition-all ${idx === currentPage ? 'border-ink shadow-[4px_4px_0px_0px_#111111]' : 'border-gray-300 opacity-60 hover:opacity-100'}`}>
                                            <img src={url} alt={`Hal ${idx + 1}`} className="w-24 h-auto" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="border-2 border-ink overflow-auto max-h-[45vh] bg-gray-100">
                                {pdfPreviewUrls[currentPage] && (
                                    <img src={pdfPreviewUrls[currentPage]} alt="Preview" className="w-full h-auto" />
                                )}
                            </div>

                            <div className={`p-4 border-2 ${unmatchedCount > 0 ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-500'}`}>
                                <p className={`text-xs font-mono font-bold uppercase tracking-widest ${unmatchedCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                                    ✓ Terdeteksi {activeRows.length} entri jadwal dari {totalPages} halaman PDF.
                                    {unmatchedCount > 0 && ` ⚠ ${unmatchedCount} baris perlu pemilihan kelas manual di langkah berikutnya.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP: TABLE (Verifikasi) */}
                    {step === 'table' && !isLoading && (
                        <div className="space-y-4">
                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border-2 border-ink">
                                <span className="text-[10px] font-mono font-black text-ink uppercase tracking-widest">Tipe Minggu:</span>
                                <select value={weekType} onChange={e => setWeekType(e.target.value)}
                                    className="border-2 border-ink px-3 py-1.5 font-mono font-bold text-ink text-xs bg-paper uppercase">
                                    <option>Minggu Ganjil</option>
                                    <option>Minggu Genap</option>
                                </select>
                                <button onClick={applyWeekTypeToAll}
                                    className="px-3 py-1.5 bg-ink text-paper text-[10px] font-mono font-black uppercase tracking-widest border-2 border-ink hover:opacity-80 transition-all">
                                    Terapkan ke Semua
                                </button>
                                <span className="ml-auto text-[10px] font-mono font-bold text-gray-500">
                                    {activeRows.length} aktif · {deletedCount} dihapus
                                    {unmatchedCount > 0 && (
                                        <span className="ml-2 text-yellow-600 font-bold">· {unmatchedCount} belum ada kelas</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border-2 border-yellow-400">
                                <AlertCircle size={14} className="text-yellow-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                                <p className="text-[10px] font-mono text-yellow-700">
                                    Periksa kolom <strong>Kelas</strong> — pilih dari dropdown sesuai data di sistem.
                                    Baris dengan kelas tidak cocok akan dilewati saat import.
                                </p>
                            </div>

                            {/* Table */}
                            <div className="border-2 border-ink overflow-auto max-h-[55vh]">
                                <table className="w-full border-collapse text-xs font-mono">
                                    <thead className="sticky top-0 bg-ink text-paper z-10">
                                        <tr>
                                            {['No', 'Hari', 'Jam', 'Mata Pelajaran', 'Guru', 'Ruangan', 'Kelas ↓ pilih dari DB', 'Minggu', 'Aksi'].map(h => (
                                                <th key={h} className="px-3 py-2 text-left font-black uppercase tracking-widest text-[10px] border-r border-paper/30 last:border-r-0 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editableRows.map((row, idx) => {
                                            const isUnmatched = !row.kelas_id && !matchClassToDb(row.kelas, dbClasses);
                                            return (
                                                <tr key={row.id}
                                                    className={`border-b border-gray-200 transition-colors ${row.deleted
                                                        ? 'opacity-30 line-through bg-red-50'
                                                        : isUnmatched
                                                            ? 'bg-yellow-50'
                                                            : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                        }`}>
                                                    <td className="px-3 py-1.5 text-gray-400 font-bold">{idx + 1}</td>
                                                    <td className="px-2 py-1">
                                                        <select value={row.hari} onChange={e => updateRow(row.id, 'hari', e.target.value)}
                                                            disabled={row.deleted}
                                                            className="border border-ink px-1 py-0.5 bg-transparent font-mono text-xs w-20 disabled:opacity-50">
                                                            {HARI_LIST.map(h => <option key={h}>{h}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input type="number" min={1} max={12} value={row.jam_ke}
                                                            onChange={e => updateRow(row.id, 'jam_ke', e.target.value)}
                                                            disabled={row.deleted}
                                                            className="border border-ink px-1 py-0.5 w-12 font-mono text-xs bg-transparent disabled:opacity-50" />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input value={row.mata_pelajaran}
                                                            onChange={e => updateRow(row.id, 'mata_pelajaran', e.target.value)}
                                                            disabled={row.deleted}
                                                            className="border border-ink px-1 py-0.5 w-40 font-mono text-xs bg-transparent disabled:opacity-50" />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input value={row.guru}
                                                            onChange={e => updateRow(row.id, 'guru', e.target.value)}
                                                            disabled={row.deleted}
                                                            className="border border-ink px-1 py-0.5 w-40 font-mono text-xs bg-transparent disabled:opacity-50" />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input value={row.ruangan || ''}
                                                            onChange={e => updateRow(row.id, 'ruangan', e.target.value)}
                                                            disabled={row.deleted}
                                                            placeholder="R.xx"
                                                            className="border border-ink px-1 py-0.5 w-16 font-mono text-xs bg-transparent disabled:opacity-50 placeholder:text-gray-300" />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        {/* Dropdown HANYA isi kelas dari DB */}
                                                        <select
                                                            value={row.kelas}
                                                            onChange={e => updateRowClass(row.id, e.target.value)}
                                                            disabled={row.deleted}
                                                            className={`border px-1 py-0.5 font-mono text-xs w-32 disabled:opacity-50 ${isUnmatched && !row.deleted ? 'border-yellow-500 bg-yellow-50' : 'border-ink bg-transparent'}`}>
                                                            {/* Opsi placeholder jika belum match */}
                                                            {isUnmatched && (
                                                                <option value={row.kelas} disabled>
                                                                    ⚠ {row.kelas.length > 12 ? row.kelas.substring(0, 12) + '...' : row.kelas}
                                                                </option>
                                                            )}
                                                            {dbClasses.map(c => (
                                                                <option key={c.id} value={c.name}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <select value={row.week_type}
                                                            onChange={e => updateRow(row.id, 'week_type', e.target.value)}
                                                            disabled={row.deleted}
                                                            className="border border-ink px-1 py-0.5 bg-transparent font-mono text-xs disabled:opacity-50">
                                                            <option>Minggu Ganjil</option>
                                                            <option>Minggu Genap</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        {row.deleted ? (
                                                            <button onClick={() => restoreRow(row.id)} title="Pulihkan"
                                                                className="p-1 text-green-600 hover:text-green-800">
                                                                <RefreshCw size={12} strokeWidth={2.5} />
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => deleteRow(row.id)} title="Hapus"
                                                                className="p-1 text-red-500 hover:text-red-700">
                                                                <Trash2 size={12} strokeWidth={2.5} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP: DONE */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-20 h-20 bg-green-500 flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-white" strokeWidth={2} />
                            </div>
                            <p className="text-xl font-black text-ink uppercase tracking-widest font-serif">Import Berhasil!</p>
                            <p className="text-sm font-mono text-gray-500">Jadwal dari PDF berhasil ditambahkan.</p>
                            <button onClick={onClose}
                                className="mt-4 px-8 py-3 bg-ink text-paper font-mono font-black uppercase tracking-widest border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                Tutup
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLoading && step !== 'done' && (
                    <div className="px-6 py-4 border-t-4 border-ink flex flex-wrap items-center gap-3 bg-gray-50 shrink-0">
                        <button onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-paper border-2 border-ink text-ink text-xs font-mono font-black uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">
                            <Upload size={16} strokeWidth={2.5} />
                            {step === 'upload' ? 'Pilih File' : 'Ganti PDF'}
                        </button>
                        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

                        {(step === 'preview' || step === 'table') && (
                            <>
                                <div className="h-6 w-px bg-ink mx-1" />
                                {step === 'preview' && (
                                    <button onClick={() => setStep('table')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-xs font-mono font-black uppercase tracking-widest border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Table2 size={16} strokeWidth={2.5} /> Verifikasi Data →
                                    </button>
                                )}
                                {step === 'table' && (
                                    <>
                                        <button onClick={handleExportExcel} disabled={activeRows.length === 0}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-paper border-2 border-ink text-ink text-xs font-mono font-black uppercase tracking-widest hover:bg-ink hover:text-paper transition-all disabled:opacity-40">
                                            <Download size={16} strokeWidth={2.5} /> Export Excel
                                        </button>
                                        <button onClick={handleImportToDB} disabled={activeRows.length === 0}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-xs font-mono font-black uppercase tracking-widest border-2 border-ink shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-40">
                                            <Save size={16} strokeWidth={2.5} /> Import ke Jadwal ({activeRows.length})
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        <button onClick={onClose} className="ml-auto text-xs font-mono font-bold text-gray-500 uppercase hover:text-ink transition-colors">
                            Batal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
