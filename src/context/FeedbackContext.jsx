import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [confirm, setConfirm] = useState({
        show: false,
        title: '',
        message: '',
        type: 'danger',
        resolve: null
    });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }, []);

    const showConfirm = useCallback((title, message, type = 'danger') => {
        return new Promise((resolve) => {
            setConfirm({ show: true, title, message, type, resolve });
        });
    }, []);

    const handleConfirm = () => {
        if (confirm.resolve) confirm.resolve(true);
        setConfirm(prev => ({ ...prev, show: false, resolve: null }));
    };

    const handleCancel = () => {
        if (confirm.resolve) confirm.resolve(false);
        setConfirm(prev => ({ ...prev, show: false, resolve: null }));
    };

    return (
        <FeedbackContext.Provider value={{ showToast, showConfirm }}>
            {children}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
            <ConfirmModal
                show={confirm.show}
                title={confirm.title}
                message={confirm.message}
                type={confirm.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </FeedbackContext.Provider>
    );
};

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
};
