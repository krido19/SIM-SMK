/**
 * Utility to send WhatsApp messages using Fonnte API or fallback to direct link
 */
import { supabase } from '../lib/supabase';

const FONNTE_TOKEN_ENV = import.meta.env.VITE_FONNTE_TOKEN;

export const sendWhatsApp = async (target, message) => {
    if (!target || target === '-') {
        alert('Nomor WhatsApp tidak valid atau kosong.');
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
            .single();

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
            alert('Pesan berhasil dikirim via Fonnte!');
        } else {
            console.error('Fonnte Error:', result);
            alert('Gagal mengirim via Fonnte. Mencoba via WhatsApp Web...');
            window.open(`https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`, '_blank');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        window.open(`https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`, '_blank');
    }
};
