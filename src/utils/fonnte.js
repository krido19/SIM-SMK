/**
 * Utility to send WhatsApp messages using Fonnte API or fallback to direct link
 */
import { supabase } from '../lib/supabase';

const FONNTE_TOKEN_ENV = import.meta.env.VITE_FONNTE_TOKEN;

export const sendWhatsApp = async (target, message, showToast) => {
    if (!target || target === '-') {
        if (showToast) showToast('Nomor WhatsApp tidak valid atau kosong.', 'warning');
        else alert('Nomor WhatsApp tidak valid atau kosong.');
        return;
    }

    // Basic cleaning of phone number
    let cleanTarget = target.replace(/[^0-9]/g, '');
    if (cleanTarget.startsWith('0')) {
        cleanTarget = '62' + cleanTarget.slice(1);
    }

    // Fetch token from Supabase settings table
    let fonnteToken = FONNTE_TOKEN_ENV;

    try {
        const { data: settingData } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'fonnte_token')
            .maybeSingle();

        if (settingData && settingData.value) {
            fonnteToken = settingData.value;
        }
    } catch (e) {
        console.warn('Error fetching fonnte_token from db:', e);
    }

    if (!fonnteToken) {
        console.warn('Fonnte token not found in database or .env. Falling back to direct WhatsApp link.');
        window.open(`https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`, '_blank');
        return;
    }

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': fonnteToken,
            },
            body: new URLSearchParams({
                target: cleanTarget,
                message: message,
            }),
        });

        const result = await response.json();
        if (result.status) {
            if (showToast) showToast('Pesan berhasil dikirim via Fonnte!', 'success');
            else alert('Pesan berhasil dikirim via Fonnte!');
        } else {
            console.error('Fonnte Error:', result);
            if (showToast) showToast('Gagal mengirim via Fonnte. Mencoba via WhatsApp Web...', 'warning');
            else alert('Gagal mengirim via Fonnte. Mencoba via WhatsApp Web...');
            window.open(`https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`, '_blank');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        window.open(`https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`, '_blank');
    }
};
