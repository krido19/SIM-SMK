import React from 'react';
import { Trash2, AlertCircle, HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-ink/60 backdrop-blur-none animate-in fade-in duration-200">
            <div className="bg-paper w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 border-2 border-ink relative">
                {/* Decorative dots in corners */}
                <div className="absolute top-2 left-2 w-1 h-1 bg-ink opacity-20" />
                <div className="absolute top-2 right-2 w-1 h-1 bg-ink opacity-20" />
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-ink opacity-20" />
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-ink opacity-20" />

                <div className="p-8 text-center border-b-2 border-ink/10">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 border-2 border-ink bg-white shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                            {type === 'danger' ? (
                                <Trash2 size={32} className="text-newsprint-red" strokeWidth={1.5} />
                            ) : (
                                <HelpCircle size={32} className="text-ink" strokeWidth={1.5} />
                            )}
                        </div>
                    </div>

                    <h3 className="text-2xl font-serif font-black text-ink mb-4 leading-tight">
                        {title}
                    </h3>
                    <p className="text-ink/70 font-body leading-relaxed px-2">
                        {message}
                    </p>
                </div>

                <div className="flex p-4 gap-4 bg-muted/30">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 border border-ink font-sans font-bold text-xs uppercase tracking-widest hover:bg-ink hover:text-white transition-all"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 font-sans font-bold text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-95 ${type === 'danger'
                                ? 'bg-newsprint-red text-white'
                                : 'bg-ink text-white'
                            }`}
                    >
                        {type === 'danger' ? 'Confirm Action' : 'Continue'}
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 hover:bg-ink hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmModal;
