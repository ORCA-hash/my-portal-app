import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { analyzeReportData } from '../services/geminiService';
import { ReportMetric } from '../types';

const Reports: React.FC = () => {
  const [data, setData] = useState<ReportMetric[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Mock Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    // Simulate reading file
    setTimeout(() => {
      // Generate some dummy consistent data to simulate a parsed CSV
      const dummyData: ReportMetric[] = Array.from({ length: 15 }, (_, i) => ({
        date: `2023-10-${i + 1}`,
        impressions: Math.floor(Math.random() * 5000) + 1000,
        clicks: Math.floor(Math.random() * 300) + 50,
        conversions: Math.floor(Math.random() * 20),
        spend: Math.floor(Math.random() * 500) + 100
      }));
      setData(dummyData);
      setLoading(false);
      setInsights(null); // Reset insights on new upload
    }, 1500);
  };

  const generateInsights = async () => {
    if (data.length === 0) return;
    setAnalyzing(true);
    const result = await analyzeReportData(data);
    setInsights(result);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Campaign Reports</h2>
        <div className="relative overflow-hidden group">
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center cursor-pointer">
                <i className="fa-solid fa-upload mr-2"></i> Upload CSV
            </button>
            <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
        </div>
      </div>

      {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-100">
             <i className="fa-solid fa-circle-notch fa-spin text-4xl text-brand-500 mb-4"></i>
             <p className="text-slate-500 animate-pulse">Parsing file data...</p>
          </div>
      )}

      {data.length > 0 && !loading && (
        <>
            {/* Metric Cards Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold">Total Spend</p>
                    <p className="text-xl font-bold text-slate-800">${data.reduce((a,b) => a + b.spend, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold">Total Clicks</p>
                    <p className="text-xl font-bold text-slate-800">{data.reduce((a,b) => a + b.clicks, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold">Avg. CTR</p>
                    <p className="text-xl font-bold text-slate-800">
                        {((data.reduce((a,b) => a + b.clicks, 0) / data.reduce((a,b) => a + b.impressions, 0)) * 100).toFixed(2)}%
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold">ROAS (Est)</p>
                    <p className="text-xl font-bold text-green-600">3.2x</p>
                </div>
            </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Spend vs Clicks</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" hide/>
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" hide/>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="spend" fill="#8884d8" name="Spend ($)" radius={[4,4,0,0]} />
                    <Bar yAxisId="right" dataKey="clicks" fill="#82ca9d" name="Clicks" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Impressions Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="impressions" stroke="#ff7300" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fa-solid fa-brain text-9xl"></i>
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold flex items-center">
                        <i className="fa-solid fa-sparkles text-yellow-400 mr-2"></i>
                        AI Strategic Insights
                    </h3>
                    {!insights && !analyzing && (
                        <button 
                            onClick={generateInsights}
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors shadow-lg"
                        >
                            Generate Analysis
                        </button>
                    )}
                </div>

                {analyzing && (
                    <div className="flex items-center space-x-3 py-4">
                         <i className="fa-solid fa-circle-notch fa-spin"></i>
                         <span>Analyzing data patterns with Gemini 2.5...</span>
                    </div>
                )}

                {insights && (
                    <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                        {insights}
                    </div>
                )}
                
                {!insights && !analyzing && (
                    <p className="text-slate-400 text-sm">Click "Generate Analysis" to let AI identify trends and optimization opportunities from your data.</p>
                )}
            </div>
          </div>
        </>
      )}

        {!loading && data.length === 0 && (
             <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                <i className="fa-solid fa-file-csv text-4xl text-slate-300 mb-4"></i>
                <h3 className="text-lg font-medium text-slate-800">Upload Report Data</h3>
                <p className="text-slate-500 mb-4">Upload a Facebook Ads CSV export to see analytics</p>
                <div className="relative inline-block">
                     <button className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors">Select File</button>
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv" />
                </div>
            </div>
        )}
    </div>
  );
};

export default Reports;
