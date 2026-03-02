import React from 'react';

const AnalyticsChart = ({ title, subtitle, data, labels, type = 'percentage' }) => {
    return (
        <div className="bg-paper p-8 border-2 border-ink shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] relative newsprint-texture">
            <div className="flex items-center justify-between mb-10 border-b-2 border-ink pb-4">
                <div>
                    <h3 className="text-3xl font-serif font-black text-ink uppercase tracking-tight">{title}</h3>
                    <p className="text-[10px] font-mono font-bold text-ink/60 uppercase tracking-widest mt-2">{subtitle}</p>
                </div>
                <div className="flex space-x-2">
                    <span className="w-3 h-3 bg-ink" />
                    <span className="w-3 h-3 bg-newsprint-red" />
                </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 mt-4 relative">
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="w-full h-px bg-ink border-b border-dashed border-ink/40"></div>
                    <div className="w-full h-px bg-ink border-b border-dashed border-ink/40"></div>
                    <div className="w-full h-px bg-ink border-b border-dashed border-ink/40"></div>
                    <div className="w-full h-px bg-ink border-b border-dashed border-ink/40"></div>
                </div>

                {data.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer h-full z-10 relative">
                        <div className="w-full h-full flex flex-col justify-end relative">
                            <div
                                className="w-full bg-ink group-hover:bg-newsprint-red transition-colors duration-300 relative border-x-2 border-t-2 border-ink"
                                style={{ height: `${Math.max(1, h)}%` }} /* Ensure at least 1% to show bar */
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-paper border-2 border-ink text-ink font-mono font-bold text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                                    {h}{type === 'percentage' ? '%' : ''}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono font-black text-ink mt-4 uppercase tracking-widest">
                            {labels[i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnalyticsChart;
