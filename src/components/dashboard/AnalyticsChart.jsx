import React from 'react';

const AnalyticsChart = ({ title, subtitle, data, labels, type = 'percentage' }) => {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-400 font-bold mt-1">{subtitle}</p>
                </div>
                <div className="flex space-x-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="w-3 h-3 rounded-full bg-indigo-200" />
                </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 mt-4">
                {data.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                        <div
                            className="w-full bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-all relative overflow-hidden flex flex-col justify-end"
                            style={{ height: '100%' }}
                        >
                            <div
                                className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-100 transition-all duration-1000 ease-out"
                                style={{ height: `${h}%` }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}{type === 'percentage' ? '%' : ''}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">
                            {labels[i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnalyticsChart;
