import React, { useEffect, useState } from 'react';
import { mockDb } from '../../services/mockDb';
import { OnboardingSubmission } from '../../types';

const OnboardingReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await mockDb.getAllOnboardingSubmissions();
      // Sort by last updated
      data.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      setSubmissions(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading submissions...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Onboarding Submissions</h1>
          <p className="text-slate-500 mt-1">Review client intake forms and progress.</p>
        </div>
        <button onClick={() => setSelectedSubmission(null)} className={`text-sm font-bold text-brand-600 hover:underline ${!selectedSubmission ? 'hidden' : ''}`}>
             <i className="fa-solid fa-arrow-left mr-1"></i> Back to List
        </button>
      </div>

      {!selectedSubmission ? (
        // List View
        <div className="grid grid-cols-1 gap-4">
            {submissions.length === 0 && (
                <div className="p-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                    No onboarding submissions found yet.
                </div>
            )}
            {submissions.map((sub) => (
                <div 
                    key={sub.userId} 
                    onClick={() => setSelectedSubmission(sub)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-300 cursor-pointer transition-all flex justify-between items-center group"
                >
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-600 transition-colors">{sub.clientName || 'Unknown Client'}</h3>
                        <p className="text-sm text-slate-500">Last Updated: {new Date(sub.lastUpdated).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <span className="block text-xs font-bold text-slate-400 uppercase">Progress</span>
                            <span className={`font-bold ${sub.isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                                {sub.isComplete ? 'Completed' : `Step ${sub.currentStep} / 6`}
                            </span>
                        </div>
                        <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-brand-400"></i>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        // Detail View
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">{selectedSubmission.clientName} - Full Profile</h2>
                <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${selectedSubmission.isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {selectedSubmission.isComplete ? 'Onboarding Complete' : 'In Progress'}
                    </span>
                    <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded">
                        ID: {selectedSubmission.userId}
                    </span>
                </div>
            </div>
            
            <div className="p-8 space-y-8">
                {/* Step 3 Data */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Access & Credentials</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Business Manager Creds</p>
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">{selectedSubmission.bmCredentials || 'Not provided'}</pre>
                    </div>
                </div>

                {/* Step 4 Data - The 12 Questions */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Company Deep Dive</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { label: 'Company Name', val: selectedSubmission.companyName },
                            { label: 'Landing Page / Tech Login', val: selectedSubmission.systemPasswords },
                            { label: 'Email System Login', val: selectedSubmission.emailSystem },
                            { label: 'FB Business Manager Link', val: selectedSubmission.facebookBmLink },
                            { label: 'Marketing Assets Folder', val: selectedSubmission.assetsFolder },
                            { label: 'Branding Guidelines', val: selectedSubmission.brandingInfo },
                            { label: 'Social Media Links', val: selectedSubmission.socialLinks },
                            { label: 'Content / VSL Link', val: selectedSubmission.contentLink },
                            { label: 'Ideal Customer Profile', val: selectedSubmission.idealCustomerProfile },
                            { label: 'Negative Customer Profile', val: selectedSubmission.idealCustomerNegative },
                            { label: 'Existing Customer Patterns', val: selectedSubmission.existingCustomerPatterns },
                            { label: 'Personal Home Address', val: selectedSubmission.homeAddress },
                        ].map((item, i) => (
                             <div key={i} className="bg-white p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                                 <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">{item.label}</p>
                                 <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">{item.val || '-'}</p>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingReview;