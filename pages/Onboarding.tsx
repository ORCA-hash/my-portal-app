import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../services/mockDb';
import { OnboardingSubmission } from '../types';
import { useNavigate } from 'react-router-dom';

// --- Components ---

const DynamicVideo = ({ embedCode, placeholderTitle, height = "h-64" }: { embedCode: string, placeholderTitle: string, height?: string }) => {
    const code = embedCode ? embedCode.trim() : '';

    // 1. WISTIA SPECIFIC HANDLING (Priority)
    // We extract the ID and force an iframe. This solves the "blurry/not loading" script issues in React.
    // Supports: Raw URLs, Script Embeds, Wistia Player, and Async Divs.
    const wistiaId = (() => {
        const match = code.match(/(?:wistia\.com|wi-st\.com)\/(?:medias|embed\/iframe)\/([a-zA-Z0-9]+)/) ||
                      code.match(/wistia_async_([a-zA-Z0-9]+)/) ||
                      code.match(/media-id=["']?([a-zA-Z0-9]+)["']?/);
        return match ? match[1] : null;
    })();

    if (wistiaId) {
         return (
            <div className={`w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl mb-8 border border-slate-800 relative`}>
                 <iframe 
                    src={`https://fast.wistia.net/embed/iframe/${wistiaId}?seo=false&videoFoam=true`}
                    title={placeholderTitle} 
                    allow="autoplay; fullscreen" 
                    allowFullScreen 
                    className="w-full h-full absolute inset-0"
                    frameBorder="0"
                ></iframe>
            </div>
        );
    }

    // 2. Raw URL Handling (Non-Wistia)
    // User pasted a direct link (e.g. https://youtube.com/...) instead of an <iframe> code
    const isRawUrl = code.startsWith('http') && !code.includes('<');
    if (isRawUrl) {
         return (
            <div className={`w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl mb-8 border border-slate-800 relative`}>
                <iframe 
                    src={code} 
                    className="w-full h-full absolute inset-0" 
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    // 3. Generic Embed Code (<iframe> or <script>)
    // Fallback for YouTube/Vimeo embeds pasted as raw HTML
    if (code.length > 0) {
        return (
            <div className={`w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl mb-8 border border-slate-800 relative`}>
                {/* Force iframe to fill container using Tailwind arbitrary variants */}
                <div 
                    className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0" 
                    dangerouslySetInnerHTML={{ __html: code }} 
                />
            </div>
        );
    }

    // 4. Placeholder (No Video Configured)
    return (
        <div className={`w-full ${height} bg-slate-900 rounded-2xl flex flex-col items-center justify-center shadow-2xl mb-8 relative overflow-hidden group border border-slate-800`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 opacity-90 group-hover:opacity-80 transition-all duration-500"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            <div className="z-10 flex flex-col items-center transform group-hover:scale-105 transition-transform duration-300">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20 cursor-pointer shadow-lg hover:bg-brand-600 hover:border-transparent transition-all">
                    <i className="fa-solid fa-play text-white text-3xl ml-2"></i>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">{placeholderTitle}</span>
                <span className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Video Coming Soon</span>
            </div>
        </div>
    );
};

const ConfettiEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const particles: any[] = [];
    const particleCount = 150;
    const colors = ['#0ea5e9', '#22c55e', '#eab308', '#f43f5e', '#8b5cf6'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.2 - 0.1,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: 0
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speed;
        p.rotation += p.spin;
        p.x += Math.sin(p.rotation) * 0.5;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

// --- Lemcal Widget ---
const BookingWidget = ({ configString }: { configString: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Check if it's a Lemcal Embed HTML snippet
    const lemcalMatch = configString.match(/data-user="([^"]+)"/);
    const lemcalMeetingMatch = configString.match(/data-meeting-type="([^"]+)"/);

    const isLemcalEmbed = lemcalMatch && lemcalMeetingMatch;
    
    useEffect(() => {
        if (isLemcalEmbed) {
            // Clean up any existing script first to ensure re-init
            const existingScript = document.querySelector('script[src*="lemcal-integrations"]');
            if (existingScript) {
                existingScript.remove();
            }

            const script = document.createElement('script');
            script.src = "https://cdn.lemcal.com/lemcal-integrations.min.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            return () => {
                // Cleanup on unmount
                const s = document.querySelector('script[src*="lemcal-integrations"]');
                if (s) s.remove();
            };
        }
    }, [configString, isLemcalEmbed]);

    if (isLemcalEmbed && lemcalMatch && lemcalMeetingMatch) {
        return (
            <div 
                className="lemcal-embed-booking-calendar w-full h-full min-h-[600px]" 
                data-user={lemcalMatch[1]} 
                data-meeting-type={lemcalMeetingMatch[1]}
            ></div>
        );
    }

    // Fallback to generic Iframe logic if it's just a URL
    if (configString) {
        return (
            <iframe 
                src={configString} 
                width="100%" 
                height="100%" 
                frameBorder="0"
                title="Booking Calendar"
                className="w-full h-full"
            ></iframe>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-8">
            <i className="fa-regular fa-calendar-times text-5xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-700">Calendar Link Not Configured</h3>
            <p className="text-slate-500 mt-2">Please contact admin to set up the booking link.</p>
        </div>
    );
};

// --- Constants ---

// The 12 Deep Dive Questions for Step 4
const FORM_QUESTIONS = [
  {
    id: 'companyName',
    question: "What is your company name?",
    subtext: "We'll use this for all official documentation and ad account setups.",
    type: 'text',
    placeholder: "e.g. Acme Corp"
  },
  {
    id: 'systemPasswords',
    question: "Provide username plus password below for your landing page or final system.",
    subtext: "We need access to install tracking pixels (ClickFunnels, GoHighLevel, WordPress, etc).",
    type: 'textarea',
    placeholder: "URL: \nUsername: \nPassword: "
  },
  {
    id: 'emailSystem',
    question: "Provide username plus password below for your email system.",
    subtext: "ActiveCampaign, ConvertKit, Klaviyo, etc. We need this to sync leads.",
    type: 'textarea',
    placeholder: "Platform: \nUsername: \nPassword: "
  },
  {
    id: 'facebookBmLink',
    question: "Just in case we need it later, please add your Facebook Business Manager ad link below.",
    subtext: "Go to Business Settings > Ad Accounts and copy the URL.",
    type: 'text',
    placeholder: "https://business.facebook.com/settings/..."
  },
  {
    id: 'assetsFolder',
    question: "Please provide URL link with any marketing image to use for ads.",
    subtext: "Please throw as much as possible into this folder, whether it looks professional or not — we can make an advertising angle from it. Google Drive or Dropbox works best.",
    type: 'text',
    placeholder: "https://drive.google.com/..."
  },
  {
    id: 'brandingInfo',
    question: "Provide any branding guidelines or preferences.",
    subtext: "Hex codes, fonts, or a link to your brand book. If you have a specific tone of voice, let us know.",
    type: 'textarea',
    placeholder: "Our primary color is #FF0000..."
  },
  {
    id: 'socialLinks',
    question: "What are your social media links?",
    subtext: "YouTube, Instagram, Facebook, TikTok, LinkedIn, etc.",
    type: 'textarea',
    placeholder: "IG: @username\nFB: /page"
  },
  {
    id: 'contentLink',
    question: "Do you have a piece of content that our team could watch describing your company?",
    subtext: "Provide the URL link to a VSL, webinar, or 'About Us' video.",
    type: 'text',
    placeholder: "https://youtube.com/watch?v=..."
  },
  {
    id: 'idealCustomerProfile',
    question: "What does your ideal customer look like?",
    subtext: "What do they act like? What do they spend their money on? What do they get up to in their free time? The more detailed you are, the better our targeting.",
    type: 'textarea',
    placeholder: "They are 35-50 year old business owners who love golf..."
  },
  {
    id: 'idealCustomerNegative',
    question: "What does your ideal customer NOT look like?",
    subtext: "What are the characteristics that make them not a good fit for you? Be as detailed as possible.",
    type: 'textarea',
    placeholder: "We don't want people looking for freebies..."
  },
  {
    id: 'existingCustomerPatterns',
    question: "If you look at your existing customer, what is the common thread between them?",
    subtext: "Are there patterns you have noticed? (e.g. 'They all just got divorced', 'They all own dogs').",
    type: 'textarea',
    placeholder: "Most of them seem to be..."
  },
  {
    id: 'homeAddress',
    question: "What's your personal home address?",
    subtext: "I'm going to send you a care package as a welcome to the agency. (Residential only please).",
    type: 'text',
    placeholder: "123 Main St, City, State, Zip"
  }
];

// --- Main Component ---

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  
  // Step 4 specific state (Question Index 0-11)
  const [formQuestionIndex, setFormQuestionIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  
  // Config Data (Videos & Links)
  const [config, setConfig] = useState({
      step1Video: '',
      step2Video: '',
      step3Video: '',
      step4Video: '',
      step5Video: '',
      step6Video: '',
      bookingLink: ''
  });
  
  // Form Data
  const [formData, setFormData] = useState<Partial<OnboardingSubmission>>({
      currentStep: 1,
      isComplete: false
  });

  // Load existing progress & config
  useEffect(() => {
      const init = async () => {
          if (!user) return;
          
          // Parallel fetch
          const [savedProgress, savedConfig] = await Promise.all([
              mockDb.getOnboarding(user.id),
              mockDb.getOnboardingConfig()
          ]);

          setConfig(savedConfig);

          if (savedProgress) {
              setFormData(savedProgress);
              setStep(savedProgress.currentStep);
              if (savedProgress.isComplete) {
                setIsFinished(true);
              }
          }
          setLoading(false);
      };
      init();
  }, [user]);

  // Save progress helper
  const saveProgress = async (overrideStep?: number, overrideData?: Partial<OnboardingSubmission>, markComplete: boolean = false) => {
      if (!user) return;
      
      const stepToSave = overrideStep || step;
      const dataToSave = { ...formData, ...overrideData };

      const updatedData: OnboardingSubmission = {
          userId: user.id,
          clientName: user.name,
          currentStep: stepToSave,
          isComplete: markComplete,
          lastUpdated: new Date().toISOString(),
          ...dataToSave
      };

      await mockDb.saveOnboarding(updatedData);
      setFormData(updatedData);
  };

  // Navigation Handlers
  const handleNext = async () => {
      setTransitioning(true);
      setTimeout(async () => {
          const nextStep = step + 1;
          setStep(nextStep);
          await saveProgress(nextStep);
          setTransitioning(false);
          window.scrollTo(0,0);
      }, 300); // Delay for animation
  };

  const handleFinish = async () => {
      await saveProgress(6, {}, true);
      setIsFinished(true);
  };

  const updateField = (field: keyof OnboardingSubmission, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Special Handler for Step 4 Questions
  const handleFormNext = async () => {
      if (formQuestionIndex < FORM_QUESTIONS.length - 1) {
          // Move to next question
          setTransitioning(true);
          setTimeout(() => {
             setFormQuestionIndex(prev => prev + 1);
             saveProgress(step); // Save data but stay on step 4
             setTransitioning(false);
          }, 300);
      } else {
          // Finished all questions, move to Step 5
          handleNext();
      }
  };

  const handleFormBack = () => {
      if (formQuestionIndex > 0) {
          setTransitioning(true);
          setTimeout(() => {
            setFormQuestionIndex(prev => prev - 1);
            setTransitioning(false);
          }, 300);
      } else {
          // Go back to Step 3
          setStep(3);
      }
  };

  // Key press handler for Step 4
  const handleKeyPress = (e: React.KeyboardEvent) => {
      const q = FORM_QUESTIONS[formQuestionIndex];
      // Critical fix: Safety check if q is undefined
      if (!q) return; 
      const fieldKey = q.id as keyof OnboardingSubmission;
      const hasValue = !!formData[fieldKey];

      if (e.key === 'Enter' && !e.shiftKey && step === 4 && hasValue) {
          e.preventDefault();
          handleFormNext();
      }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  // --- Render Helpers ---

  const renderProgressBar = () => {
      // Calculate total progress including sub-steps of Step 4
      let totalSteps = 6 + FORM_QUESTIONS.length; 
      let currentProgress = 0;

      if (step < 4) {
          currentProgress = step;
      } else if (step === 4) {
          currentProgress = 3 + formQuestionIndex + 1;
      } else {
          currentProgress = 3 + FORM_QUESTIONS.length + (step - 4);
      }

      const percentage = Math.min(100, Math.round((currentProgress / totalSteps) * 100));

      return (
        <div className="fixed top-0 left-0 w-full z-50">
            <div className="h-1.5 bg-slate-200 w-full">
                <div 
                    className="h-full bg-brand-600 transition-all duration-700 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                {percentage}% Completed
            </div>
        </div>
      );
  };

  // --- Step Content Renders ---

  const renderStep1 = () => (
      <div className="max-w-5xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
             <div className="inline-block p-2 px-4 bg-blue-50 text-blue-700 rounded-full text-sm font-bold mb-6 animate-fade-in-up">
                  Step 1 of 6
             </div>
             <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight animate-fade-in-up">
                  What to Expect
             </h1>
             <p className="text-xl text-slate-500 mb-10 animate-fade-in-up delay-100">
                  Welcome to the agency! Watch this short video to understand exactly how we'll scale your business.
             </p>
          </div>
          
          <div className="animate-fade-in-up delay-200 mb-12">
             <DynamicVideo embedCode={config.step1Video} placeholderTitle="Welcome to Nexus" />
          </div>

          <button onClick={handleNext} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-brand-600 font-lg rounded-xl hover:bg-brand-700 hover:shadow-lg hover:-translate-y-1 focus:outline-none ring-offset-2 focus:ring-2 animate-fade-in-up delay-300">
              Let's Get Started 
              <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </button>
      </div>
  );

  const renderStep2 = () => (
      <div className="max-w-5xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
              <div className="inline-block p-2 px-4 bg-amber-50 text-amber-700 rounded-full text-sm font-bold mb-6">
                  Step 2 of 6
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  Contract & Invoice
              </h1>
              <p className="text-xl text-slate-500 mb-10">
                  Review the administrative details in the video below.
              </p>
          </div>

          <div className="mb-12">
            <DynamicVideo embedCode={config.step2Video} placeholderTitle="Administrative Walkthrough" />
          </div>

          <button onClick={handleNext} className="w-full md:w-auto px-10 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              I've Completed This <i className="fa-solid fa-check ml-2"></i>
          </button>
      </div>
  );

  const renderStep3 = () => (
      <div className="max-w-5xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
              <div className="inline-block p-2 px-4 bg-purple-50 text-purple-700 rounded-full text-sm font-bold mb-6">
                  Step 3 of 6
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  Partner Access
              </h1>
              <p className="text-xl text-slate-500 mb-10">
                  Please add our agency as a partner in your Business Manager settings.
              </p>
          </div>

          <div className="mb-12">
            <DynamicVideo embedCode={config.step3Video} placeholderTitle="How to Add Partners" />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 mb-10 text-center max-w-2xl mx-auto">
              <p className="text-sm font-bold text-slate-500 uppercase mb-3">Our Business Manager ID</p>
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-center mb-2 group cursor-pointer relative">
                 <span className="text-3xl font-mono font-bold text-slate-800 tracking-wider select-all">940446703802402</span>
              </div>
              <p className="text-xs text-slate-400">Copy this ID and paste it into the "Partners" section of your settings.</p>
          </div>

          <button onClick={handleNext} className="w-full md:w-auto px-12 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">
              I've Added You <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
      </div>
  );

  // --- Step 4: The 12 Question Deep Dive (Typeform Style) ---
  const renderStep4 = () => {
      const q = FORM_QUESTIONS[formQuestionIndex];
      // Critical fix: Safety check if q is undefined
      if (!q) return null; 

      const isLastQuestion = formQuestionIndex === FORM_QUESTIONS.length - 1;
      const fieldKey = q.id as keyof OnboardingSubmission;
      const rawValue = formData[fieldKey];
      const value = typeof rawValue === 'string' ? rawValue : '';
      const hasValue = value.trim().length > 0;

      // Show video only on the first question of Step 4 (Intro to the form)
      const showVideo = formQuestionIndex === 0;

      return (
        <div className="max-w-3xl mx-auto min-h-[60vh] flex flex-col justify-center">
            {/* Question Counter */}
            <div className="mb-8 flex items-center text-sm font-bold text-brand-600 uppercase tracking-widest animate-fade-in">
                <span>Question {formQuestionIndex + 1} of {FORM_QUESTIONS.length}</span>
                <div className="ml-4 h-px flex-1 bg-brand-100"></div>
            </div>
            
            {showVideo && config.step4Video && (
                <div className="mb-8 animate-fade-in-up">
                     <DynamicVideo embedCode={config.step4Video} placeholderTitle="About This Form" height="h-48" />
                </div>
            )}

            {/* Question Text */}
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight animate-fade-in-up">
                {q.question}
            </h2>

            {/* Subtext / Description */}
            {q.subtext && (
                <p className="text-xl text-slate-500 mb-10 leading-relaxed animate-fade-in-up delay-100">
                    {q.subtext}
                </p>
            )}

            {/* Input Field */}
            <div className="animate-fade-in-up delay-200 mb-10">
                {q.type === 'textarea' ? (
                    <textarea 
                        autoFocus
                        className="w-full p-0 text-2xl md:text-3xl text-brand-600 placeholder-brand-200 bg-transparent border-b-2 border-slate-200 focus:border-brand-500 outline-none transition-all resize-none leading-normal"
                        placeholder={q.placeholder || "Type your answer here..."}
                        rows={3}
                        value={value}
                        onChange={(e) => updateField(fieldKey, e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                ) : (
                    <input 
                        autoFocus
                        type="text"
                        className="w-full p-0 pb-4 text-2xl md:text-4xl text-brand-600 placeholder-brand-200 bg-transparent border-b-2 border-slate-200 focus:border-brand-500 outline-none transition-all"
                        placeholder={q.placeholder || "Type your answer here..."}
                        value={value}
                        onChange={(e) => updateField(fieldKey, e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                )}
                {!hasValue && (
                    <p className="text-red-400 text-sm mt-2 animate-pulse">Please fill this out to continue.</p>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 animate-fade-in-up delay-300">
                <button 
                    onClick={handleFormNext} 
                    disabled={!hasValue}
                    className={`px-8 py-4 text-lg font-bold rounded-xl transition-all flex items-center
                        ${hasValue 
                            ? 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                >
                    {isLastQuestion ? 'Finish This Section' : 'Next'} 
                    <i className={`fa-solid ${isLastQuestion ? 'fa-check' : 'fa-arrow-right'} ml-3`}></i>
                </button>
                
                <button 
                    onClick={handleFormBack} 
                    className="px-6 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                    Back
                </button>
                
                <span className="ml-4 text-xs text-slate-300 hidden md:inline-block">
                    press <span className="font-bold border border-slate-300 rounded px-1 mx-1">Enter ↵</span>
                </span>
            </div>
        </div>
      );
  };

  const renderStep5 = () => (
      <div className="max-w-5xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
              <div className="inline-block p-2 px-4 bg-pink-50 text-pink-700 rounded-full text-sm font-bold mb-6">
                  Step 5 of 6
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  Strategy Session
              </h1>
              <p className="text-xl text-slate-500 mb-8">
                  Watch the video below, then book a time for our kickoff call.
              </p>
          </div>
          
          {/* 1. Video Section (Above Calendar) */}
          <div className="mb-12">
             <DynamicVideo embedCode={config.step5Video} placeholderTitle="Strategy Session Prep" />
          </div>

          {/* 2. Calendar Section */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-8 h-[600px] relative">
              <BookingWidget configString={config.bookingLink} />
          </div>

          <button onClick={handleNext} className="w-full md:w-auto px-12 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg">
              I've Booked It <i className="fa-solid fa-check ml-2"></i>
          </button>
      </div>
  );

  const renderStep6 = () => (
      <div className="max-w-5xl mx-auto text-center">
           <div className="max-w-3xl mx-auto">
               <div className="inline-block p-2 px-4 bg-green-50 text-green-700 rounded-full text-sm font-bold mb-6">
                  Step 6 of 6
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  Just Final Words
              </h1>
              <p className="text-xl text-slate-500 mb-10">
                  A quick parting message from the team before we get to work.
              </p>
           </div>
          
          <div className="mb-12">
             <DynamicVideo embedCode={config.step6Video} placeholderTitle="Final Message" />
          </div>

          <button 
            onClick={handleFinish} 
            className="px-10 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/30 hover:-translate-y-1"
          >
              Finish Onboarding
          </button>
      </div>
  );

  const renderSuccessScreen = () => (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center relative z-10">
          <ConfettiEffect />
          
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-[bounce_1s_ease-in-out_infinite]">
              <i className="fa-solid fa-check text-6xl text-green-500"></i>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
              You're All Set!
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Thank you for completing the onboarding. Our team has received your details and is already reviewing your account.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-md mx-auto">
              <button 
                onClick={() => navigate('/client/dashboard')} 
                className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                  Go to Dashboard
              </button>
              <button 
                onClick={() => navigate('/chat')} 
                className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-xl shadow-brand-500/30 transition-all hover:-translate-y-1"
              >
                  Message Team
              </button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 relative">
       {/* Progress Bar (Hide on completion) */}
       {!isFinished && renderProgressBar()}

       <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 min-h-screen flex items-center justify-center">
           <div className={`w-full transition-opacity duration-300 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
               {!isFinished ? (
                   <>
                       {step === 1 && renderStep1()}
                       {step === 2 && renderStep2()}
                       {step === 3 && renderStep3()}
                       {step === 4 && renderStep4()}
                       {step === 5 && renderStep5()}
                       {step === 6 && renderStep6()}
                   </>
               ) : (
                   renderSuccessScreen()
               )}
           </div>
       </div>
    </div>
  );
};

export default Onboarding;