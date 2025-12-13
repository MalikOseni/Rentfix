import React, { useState, useEffect } from 'react';
import { Home, Camera, FileText, Clock, MapPin, Bell, User, CheckCircle, ChevronRight, ChevronLeft, Settings, LogOut, AlertTriangle, Wrench, Zap, Droplets, Flame, Search, Plus, Send, Image, Phone, MessageSquare, Star, Calendar, Shield, Key, CreditCard, HelpCircle, Mail, Eye, Building, Thermometer, Bug, Trash2, RefreshCw, Filter, MoreVertical, X } from 'lucide-react';

const TenantAppShowcase = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [animateIn, setAnimateIn] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Plumbing');
  const [isEmergency, setIsEmergency] = useState(false);

  const screens = [
    { id: 'splash', name: 'Splash' },
    { id: 'onboarding-1', name: 'Onboarding 1' },
    { id: 'onboarding-2', name: 'Onboarding 2' },
    { id: 'onboarding-3', name: 'Onboarding 3' },
    { id: 'login', name: 'Login' },
    { id: 'register', name: 'Register' },
    { id: 'home', name: 'Home' },
    { id: 'report-issue', name: 'Report Issue' },
    { id: 'category-confirm', name: 'Category' },
    { id: 'photo-capture', name: 'Photos' },
    { id: 'success', name: 'Success' },
    { id: 'timeline', name: 'Timeline' },
    { id: 'my-tickets', name: 'My Tickets' },
    { id: 'contractor', name: 'Contractor' },
    { id: 'chat', name: 'Chat' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'profile', name: 'Profile' },
    { id: 'property', name: 'Property' },
    { id: 'settings', name: 'Settings' },
  ];

  useEffect(() => {
    setAnimateIn(false);
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, [currentScreen]);

  const colors = {
    primary: '#0B66C3',
    primaryDark: '#0952A5',
    primaryLight: '#3B82F6',
    accent: '#F4D03F',
    background: '#F7F9FC',
    surface: '#FFFFFF',
    surfaceDark: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#475569',
    success: '#16A34A',
    warning: '#EA580C',
    error: '#DC2626',
    border: '#E2E8F0',
  };

  const PhoneFrame = ({ children }) => (
    <div className="relative mx-auto" style={{ width: '375px', height: '812px' }}>
      <div className="absolute inset-0 rounded-[3rem] shadow-2xl" style={{ background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', padding: '12px' }}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-50"></div>
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden" style={{ backgroundColor: colors.background }}>{children}</div>
      </div>
    </div>
  );

  const StatusBar = ({ dark = false }) => (
    <div className={`flex justify-between items-center px-8 pt-4 pb-2 ${dark ? 'text-white' : 'text-gray-800'}`}>
      <span className="text-sm font-semibold">9:41</span>
      <div className="flex items-center gap-1">
        <span className="text-xs">5G</span>
        <div className="w-6 h-3 border rounded-sm" style={{ borderColor: dark ? 'white' : '#374151' }}><div className="h-full rounded-xs" style={{width: '75%', backgroundColor: dark ? 'white' : '#374151'}}></div></div>
      </div>
    </div>
  );

  const BottomNav = ({ active }) => (
    <div className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 px-4 border-t bg-white" style={{ borderColor: colors.border, paddingBottom: '2rem' }}>
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'tickets', icon: FileText, label: 'Tickets' },
        { id: 'report', icon: Plus, label: '' },
        { id: 'notifications', icon: Bell, label: 'Alerts' },
        { id: 'profile', icon: User, label: 'Profile' },
      ].map(item => (
        <button key={item.id} className="flex flex-col items-center gap-1" style={{ color: active === item.id ? colors.primary : colors.textMuted }}>
          {item.id === 'report' ? (
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-6" style={{ backgroundColor: colors.primary }}><Plus size={24} color="white" /></div>
          ) : (<><item.icon size={22} /><span className="text-xs">{item.label}</span></>)}
        </button>
      ))}
    </div>
  );

  const SplashScreen = () => (
    <div className="h-full flex flex-col items-center justify-center" style={{ background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>
      <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 bg-white shadow-2xl"><Building size={56} color={colors.primary} /></div>
      <h1 className="text-4xl font-bold text-white">RentFix</h1>
      <p className="text-lg mt-2 text-white/80">Tenant Portal</p>
      <div className="absolute bottom-32 flex gap-2">{[0,1,2].map(i => (<div key={i} className="w-2.5 h-2.5 rounded-full bg-white" style={{ animation: 'pulse 1.5s infinite', animationDelay: `${i*0.2}s` }}/>))}</div>
    </div>
  );

  const OnboardingScreen1 = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-56 h-56 rounded-full flex items-center justify-center mb-8" style={{ backgroundColor: colors.primary + '15' }}>
          <Camera size={72} style={{ color: colors.primary }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-3" style={{ color: colors.text }}>Snap & Report Issues</h1>
        <p className="text-center" style={{ color: colors.textMuted }}>Take photos of maintenance issues. Our AI instantly classifies the problem.</p>
      </div>
      <div className="px-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">{[0,1,2].map(i => (<div key={i} className="h-1.5 rounded-full" style={{ width: i === 0 ? 24 : 8, backgroundColor: i === 0 ? colors.primary : colors.border }}/>))}</div>
        <button className="w-full py-4 rounded-2xl font-semibold text-white" style={{ backgroundColor: colors.primary }}>Next</button>
      </div>
    </div>
  );

  const OnboardingScreen2 = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-56 h-56 rounded-full flex items-center justify-center mb-8" style={{ backgroundColor: colors.success + '15' }}>
          <Clock size={72} style={{ color: colors.success }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-3" style={{ color: colors.text }}>Real-Time Updates</h1>
        <p className="text-center" style={{ color: colors.textMuted }}>Track your repair from submission to completion. Get notified every step.</p>
      </div>
      <div className="px-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">{[0,1,2].map(i => (<div key={i} className="h-1.5 rounded-full" style={{ width: i === 1 ? 24 : 8, backgroundColor: i === 1 ? colors.primary : colors.border }}/>))}</div>
        <button className="w-full py-4 rounded-2xl font-semibold text-white" style={{ backgroundColor: colors.primary }}>Next</button>
      </div>
    </div>
  );

  const OnboardingScreen3 = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-56 h-56 rounded-full flex items-center justify-center mb-8" style={{ backgroundColor: colors.warning + '15' }}>
          <Shield size={72} style={{ color: colors.warning }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-3" style={{ color: colors.text }}>Verified Contractors</h1>
        <p className="text-center" style={{ color: colors.textMuted }}>All contractors are background-checked and rated. Your home is safe.</p>
      </div>
      <div className="px-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">{[0,1,2].map(i => (<div key={i} className="h-1.5 rounded-full" style={{ width: i === 2 ? 24 : 8, backgroundColor: i === 2 ? colors.primary : colors.border }}/>))}</div>
        <button className="w-full py-4 rounded-2xl font-semibold text-white" style={{ backgroundColor: colors.primary }}>Get Started</button>
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="h-40 flex items-end pb-6 px-6" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>
        <div><h1 className="text-3xl font-bold text-white">Welcome back</h1><p className="text-white/80 mt-1">Sign in to your account</p></div>
      </div>
      <div className="flex-1 px-6 pt-8">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: colors.textMuted }}>Email</label>
            <div className="mt-2 flex items-center px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }}>
              <Mail size={20} style={{ color: colors.textMuted }} />
              <input placeholder="tenant@example.com" className="flex-1 ml-3 bg-transparent outline-none" style={{ color: colors.text }} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: colors.textMuted }}>Password</label>
            <div className="mt-2 flex items-center px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }}>
              <Key size={20} style={{ color: colors.textMuted }} />
              <input type="password" placeholder="••••••••" className="flex-1 ml-3 bg-transparent outline-none" style={{ color: colors.text }} />
              <Eye size={20} style={{ color: colors.textMuted }} />
            </div>
          </div>
          <button className="text-sm font-medium text-right w-full" style={{ color: colors.primary }}>Forgot password?</button>
          <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ backgroundColor: colors.primary }}>Sign In</button>
        </div>
        <p className="text-center mt-8 text-sm" style={{ color: colors.textMuted }}>Don't have an account? <span style={{ color: colors.primary }}>Sign up</span></p>
      </div>
    </div>
  );

  const RegisterScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-4 pb-4">
        <ChevronLeft size={24} style={{ color: colors.text }} />
        <h1 className="text-2xl font-bold mt-2" style={{ color: colors.text }}>Create Account</h1>
        <p style={{ color: colors.textMuted }}>Enter your invite code to get started</p>
      </div>
      <div className="flex-1 px-6 overflow-auto pb-8">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: colors.textMuted }}>Invite Code</label>
            <div className="mt-2 flex items-center px-4 py-3.5 rounded-xl border" style={{ borderColor: colors.success, backgroundColor: colors.success + '05' }}>
              <Key size={20} style={{ color: colors.success }} />
              <input placeholder="RENT-XXXX-XXXX" className="flex-1 ml-3 bg-transparent outline-none uppercase" style={{ color: colors.text }} />
              <CheckCircle size={20} style={{ color: colors.success }} />
            </div>
            <p className="text-xs mt-1" style={{ color: colors.success }}>✓ Valid - 42 Baker Street, Flat 3</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm" style={{ color: colors.textMuted }}>First Name</label><input placeholder="Sarah" className="mt-2 w-full px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }} /></div>
            <div><label className="text-sm" style={{ color: colors.textMuted }}>Last Name</label><input placeholder="Brown" className="mt-2 w-full px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }} /></div>
          </div>
          <div><label className="text-sm" style={{ color: colors.textMuted }}>Email</label><input placeholder="sarah@example.com" className="mt-2 w-full px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }} /></div>
          <div><label className="text-sm" style={{ color: colors.textMuted }}>Password</label><input type="password" placeholder="Min 8 characters" className="mt-2 w-full px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }} /></div>
          <button className="w-full py-4 rounded-xl font-semibold text-white" style={{ backgroundColor: colors.primary }}>Create Account</button>
        </div>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <div><p className="text-sm" style={{ color: colors.textMuted }}>Good morning</p><h1 className="text-2xl font-bold" style={{ color: colors.text }}>Sarah Brown</h1></div>
          <div className="flex gap-3">
            <div className="relative p-2.5 rounded-full bg-white shadow-sm"><Bell size={22} style={{ color: colors.text }} /><div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></div></div>
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.primary }}>SB</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-28">
        <div className="p-4 rounded-2xl mb-4 border bg-white" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '10' }}><Building size={24} style={{ color: colors.primary }} /></div>
            <div><h3 className="font-semibold" style={{ color: colors.text }}>42 Baker Street, Flat 3</h3><p className="text-sm" style={{ color: colors.textMuted }}>London NW1 6XE</p></div>
          </div>
        </div>
        <div className="p-5 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}>
          <h2 className="text-lg font-semibold text-white mb-2">Need something fixed?</h2>
          <p className="text-white/80 text-sm mb-4">Report issues and track repairs in real-time.</p>
          <button className="px-5 py-2.5 rounded-xl font-semibold bg-white flex items-center gap-2" style={{ color: colors.primary }}><Camera size={18} />Report Issue</button>
        </div>
        <h2 className="font-semibold mb-3" style={{ color: colors.text }}>Active Tickets</h2>
        {[{ title: 'Leaking Tap', status: 'In Progress', cat: 'Plumbing' },{ title: 'Broken Thermostat', status: 'Scheduled', cat: 'Heating' }].map((t, i) => (
          <div key={i} className="p-4 rounded-xl mb-3 border bg-white" style={{ borderColor: colors.border }}>
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.cat === 'Plumbing' ? colors.primary + '15' : colors.warning + '15' }}>
                  {t.cat === 'Plumbing' ? <Droplets size={20} style={{ color: colors.primary }} /> : <Thermometer size={20} style={{ color: colors.warning }} />}
                </div>
                <div><h3 className="font-medium" style={{ color: colors.text }}>{t.title}</h3><p className="text-sm" style={{ color: colors.textMuted }}>{t.cat}</p></div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium h-fit" style={{ backgroundColor: t.status === 'In Progress' ? colors.success + '15' : colors.accent + '30', color: t.status === 'In Progress' ? colors.success : colors.warning }}>{t.status}</span>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="home" />
    </div>
  );

  const ReportIssueScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex items-center"><ChevronLeft size={24} style={{ color: colors.text }} /><h1 className="text-lg font-semibold ml-3" style={{ color: colors.text }}>Report an Issue</h1></div>
      <div className="flex-1 overflow-auto px-6 pb-8">
        <div className="p-4 rounded-xl mb-4 border-l-4 bg-blue-50" style={{ borderColor: colors.primary }}>
          <div className="flex items-center gap-2 mb-1"><Zap size={16} style={{ color: colors.primary }} /><span className="text-sm font-semibold" style={{ color: colors.primary }}>AI Suggestion</span></div>
          <p className="text-sm" style={{ color: colors.text }}>This appears to be a <strong>Plumbing</strong> issue.</p>
        </div>
        <div className="space-y-5">
          <div><label className="text-sm font-semibold" style={{ color: colors.text }}>Description *</label><textarea placeholder="Describe the issue..." className="mt-2 w-full h-24 px-4 py-3 rounded-xl border bg-white resize-none" style={{ borderColor: colors.border }} /></div>
          <div><label className="text-sm font-semibold" style={{ color: colors.text }}>Category *</label><div className="mt-2 flex items-center justify-between px-4 py-3.5 rounded-xl border bg-white" style={{ borderColor: colors.border }}><div className="flex items-center gap-3"><Droplets size={20} style={{ color: colors.primary }} /><span>Plumbing</span></div><ChevronRight size={18} style={{ color: colors.textMuted }} /></div></div>
          <div className="flex items-center justify-between p-4 rounded-xl border bg-white" style={{ borderColor: colors.border }}>
            <div><p className="font-semibold" style={{ color: colors.text }}>Emergency?</p><p className="text-sm" style={{ color: colors.textMuted }}>Dispatches immediately</p></div>
            <div className="w-14 h-8 rounded-full relative cursor-pointer" style={{ backgroundColor: isEmergency ? colors.error : colors.border }} onClick={() => setIsEmergency(!isEmergency)}><div className="absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: isEmergency ? '30px' : '4px' }} /></div>
          </div>
          <div><label className="text-sm font-semibold" style={{ color: colors.text }}>Photos</label><button className="mt-2 w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2" style={{ borderColor: colors.primary }}><Camera size={28} style={{ color: colors.primary }} /><span style={{ color: colors.primary }}>Add Photos</span></button></div>
        </div>
      </div>
      <div className="p-6 bg-white border-t" style={{ borderColor: colors.border }}><button className="w-full py-4 rounded-xl font-semibold text-white" style={{ backgroundColor: colors.primary }}>Submit Report</button></div>
    </div>
  );

  const CategoryConfirmScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex items-center"><ChevronLeft size={24} style={{ color: colors.text }} /><h1 className="text-lg font-semibold ml-3" style={{ color: colors.text }}>Confirm Category</h1></div>
      <div className="flex-1 overflow-auto px-6 pb-8">
        <p className="mb-4" style={{ color: colors.textMuted }}>AI suggested a category. Override if needed.</p>
        <div className="p-4 rounded-xl mb-6 bg-white border" style={{ borderColor: colors.border }}>
          <p className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Suggested</p>
          <div className="flex gap-2"><span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>Plumbing</span><span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: colors.border }}>Routine</span></div>
        </div>
        {[{ name: 'Plumbing', icon: Droplets, color: colors.primary },{ name: 'Electrical', icon: Zap, color: colors.accent },{ name: 'Heating', icon: Flame, color: colors.warning },{ name: 'Appliance', icon: Wrench, color: colors.success },{ name: 'Pest Control', icon: Bug, color: colors.error }].map((c, i) => (
          <button key={i} className="w-full p-4 rounded-xl mb-3 flex items-center justify-between bg-white border" style={{ borderColor: selectedCategory === c.name ? colors.primary : colors.border, borderWidth: selectedCategory === c.name ? 2 : 1 }} onClick={() => setSelectedCategory(c.name)}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '15' }}><c.icon size={20} style={{ color: c.color }} /></div><span className="font-medium">{c.name}</span></div>
            {selectedCategory === c.name && <CheckCircle size={20} style={{ color: colors.primary }} />}
          </button>
        ))}
      </div>
      <div className="p-6 bg-white border-t flex gap-3" style={{ borderColor: colors.border }}><button className="flex-1 py-3.5 rounded-xl border" style={{ borderColor: colors.border }}>Back</button><button className="flex-1 py-3.5 rounded-xl text-white" style={{ backgroundColor: colors.primary }}>Continue</button></div>
    </div>
  );

  const PhotoCaptureScreen = () => (
    <div className="h-full flex flex-col bg-black">
      <StatusBar dark />
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center"><Camera size={64} style={{ color: '#333' }} /></div>
        <div className="absolute inset-8 border-2 border-white/30 rounded-2xl"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between"><button className="p-2.5 rounded-full bg-black/50"><X size={24} color="white" /></button><span className="px-4 py-2 rounded-full bg-black/50 text-white text-sm">1 of 5</span><button className="p-2.5 rounded-full bg-black/50"><Zap size={24} color="white" /></button></div>
      </div>
      <div className="py-8 px-6 flex items-center justify-around bg-black"><button className="p-3 rounded-full bg-gray-800"><Image size={24} color="white" /></button><button className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-16 h-16 rounded-full bg-white"></div></button><button className="p-3 rounded-full bg-gray-800"><RefreshCw size={24} color="white" /></button></div>
    </div>
  );

  const SuccessScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: colors.success + '20' }}><CheckCircle size={56} style={{ color: colors.success }} /></div>
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>Report Submitted!</h1>
        <p className="text-center mb-2" style={{ color: colors.textMuted }}>Your request has been received.</p>
        <p className="text-sm" style={{ color: colors.primary }}>Ticket #RF-2024-1847</p>
        <div className="w-full p-5 rounded-xl bg-white border mt-6" style={{ borderColor: colors.border }}>
          <p className="font-semibold mb-3" style={{ color: colors.text }}>What's next?</p>
          {['AI classifies issue', 'Agent reviews', 'Contractor matched', 'Real-time updates'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 mb-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: i === 0 ? colors.success : colors.surfaceDark, color: i === 0 ? 'white' : colors.textMuted }}>{i === 0 ? '✓' : i+1}</div><span style={{ color: i === 0 ? colors.text : colors.textMuted }}>{s}</span></div>
          ))}
        </div>
      </div>
      <div className="p-6"><button className="w-full py-4 rounded-xl font-semibold text-white mb-3" style={{ backgroundColor: colors.primary }}>Track Ticket</button><button className="w-full py-3" style={{ color: colors.textMuted }}>Return Home</button></div>
    </div>
  );

  const TimelineScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex items-center justify-between"><ChevronLeft size={24} style={{ color: colors.text }} /><h1 className="text-lg font-semibold" style={{ color: colors.text }}>Track Progress</h1><MoreVertical size={20} style={{ color: colors.textMuted }} /></div>
      <div className="flex-1 overflow-auto px-6 pb-8">
        <div className="p-4 rounded-xl mb-4 bg-white border" style={{ borderColor: colors.border }}>
          <div className="flex justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}><Droplets size={20} style={{ color: colors.primary }} /></div><div><h3 className="font-semibold" style={{ color: colors.text }}>Leaking Kitchen Tap</h3><p className="text-sm" style={{ color: colors.textMuted }}>#RF-2024-1847</p></div></div><span className="px-3 py-1 rounded-full text-xs font-semibold h-fit" style={{ backgroundColor: colors.success + '15', color: colors.success }}>In Progress</span></div>
        </div>
        <p className="font-semibold mb-4" style={{ color: colors.text }}>Timeline</p>
        <div className="relative pl-8">
          {[{ t: 'Ticket Created', s: 'done', time: '9:02 AM' },{ t: 'AI Triaged', s: 'done', time: '9:05 AM' },{ t: 'Contractor Assigned', s: 'done', time: '10:12 AM' },{ t: 'En Route', s: 'current', time: '10:45 AM' },{ t: 'In Progress', s: 'pending' },{ t: 'Completed', s: 'pending' }].map((item, i) => (
            <div key={i} className="mb-5 relative">
              {i < 5 && <div className="absolute left-[-20px] top-4 w-0.5 h-full" style={{ backgroundColor: item.s === 'done' ? colors.success : colors.border }} />}
              <div className="absolute left-[-24px] top-1 w-3 h-3 rounded-full" style={{ backgroundColor: item.s === 'done' ? colors.success : item.s === 'current' ? colors.primary : colors.background, border: `2px solid ${item.s === 'done' ? colors.success : item.s === 'current' ? colors.primary : colors.border}` }} />
              <div className="flex items-center gap-2"><span className="font-semibold" style={{ color: item.s === 'pending' ? colors.textMuted : colors.text }}>{item.t}</span>{item.s === 'current' && <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>Now</span>}</div>
              {item.time && <p className="text-sm" style={{ color: colors.textMuted }}>{item.time}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-white border-t" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.primary }}>MJ</div><div><h3 className="font-semibold" style={{ color: colors.text }}>Mike Johnson</h3><div className="flex items-center gap-1"><Star size={14} fill={colors.accent} style={{ color: colors.accent }} /><span className="text-sm">4.9</span></div></div></div>
        <div className="flex gap-3"><button className="flex-1 py-3 rounded-xl border flex items-center justify-center gap-2" style={{ borderColor: colors.border }}><Phone size={18} />Call</button><button className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2" style={{ backgroundColor: colors.primary }}><MessageSquare size={18} />Message</button></div>
      </div>
    </div>
  );

  const MyTicketsScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>My Tickets</h1>
        <div className="flex gap-2">{['Active', 'Scheduled', 'Done'].map((t, i) => (<button key={t} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: i === 0 ? colors.primary : 'transparent', color: i === 0 ? 'white' : colors.textMuted, border: i === 0 ? 'none' : `1px solid ${colors.border}` }}>{t}</button>))}</div>
      </div>
      <div className="px-6 flex gap-3 mb-4"><div className="flex-1 flex items-center px-4 py-3 rounded-xl bg-white border" style={{ borderColor: colors.border }}><Search size={18} style={{ color: colors.textMuted }} /><input placeholder="Search..." className="flex-1 ml-2 bg-transparent outline-none text-sm" /></div><button className="p-3 rounded-xl bg-white border" style={{ borderColor: colors.border }}><Filter size={18} style={{ color: colors.textMuted }} /></button></div>
      <div className="flex-1 overflow-auto px-6 pb-28">
        {[{ title: 'Leaking Tap', status: 'In Progress', cat: 'Plumbing', icon: Droplets, color: colors.primary },{ title: 'Thermostat', status: 'Scheduled', cat: 'Heating', icon: Thermometer, color: colors.warning },{ title: 'Light', status: 'Assigned', cat: 'Electrical', icon: Zap, color: colors.accent }].map((t, i) => (
          <div key={i} className="p-4 rounded-xl mb-3 bg-white border" style={{ borderColor: colors.border }}>
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.color + '15' }}><t.icon size={22} style={{ color: t.color }} /></div><div><h3 className="font-semibold" style={{ color: colors.text }}>{t.title}</h3><p className="text-sm" style={{ color: colors.textMuted }}>{t.cat}</p></div></div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium h-fit" style={{ backgroundColor: t.status === 'In Progress' ? colors.success + '15' : colors.primary + '15', color: t.status === 'In Progress' ? colors.success : colors.primary }}>{t.status}</span>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="tickets" />
    </div>
  );

  const ContractorScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex items-center"><ChevronLeft size={24} style={{ color: colors.text }} /><h1 className="text-lg font-semibold ml-3" style={{ color: colors.text }}>Contractor</h1></div>
      <div className="flex-1 overflow-auto pb-8">
        <div className="px-6 text-center mb-6"><div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-3xl text-white" style={{ backgroundColor: colors.primary }}>MJ</div><h2 className="text-xl font-bold" style={{ color: colors.text }}>Mike Johnson</h2><p className="text-sm" style={{ color: colors.textMuted }}>SwiftFix Plumbing</p><div className="flex items-center justify-center gap-2 mt-2"><Star size={16} fill={colors.accent} style={{ color: colors.accent }} /><span className="font-semibold">4.9</span><span style={{ color: colors.textMuted }}>• 127 reviews</span><span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: colors.success + '15', color: colors.success }}>Verified</span></div></div>
        <div className="px-6 mb-6"><div className="flex justify-around p-4 rounded-xl bg-white border" style={{ borderColor: colors.border }}>{[{ l: 'Jobs', v: '127' },{ l: 'Years', v: '5' },{ l: 'Response', v: '<1hr' }].map((s, i) => (<div key={i} className="text-center"><p className="text-xl font-bold" style={{ color: colors.text }}>{s.v}</p><p className="text-sm" style={{ color: colors.textMuted }}>{s.l}</p></div>))}</div></div>
        <div className="px-6"><h3 className="font-semibold mb-3" style={{ color: colors.text }}>Specialties</h3><div className="flex flex-wrap gap-2 mb-4">{['Plumbing', 'Heating', 'Boilers'].map(s => (<span key={s} className="px-3 py-1.5 rounded-full text-sm" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>{s}</span>))}</div></div>
      </div>
      <div className="p-6 bg-white border-t flex gap-3" style={{ borderColor: colors.border }}><button className="flex-1 py-3.5 rounded-xl border flex items-center justify-center gap-2" style={{ borderColor: colors.border }}><Phone size={18} />Call</button><button className="flex-1 py-3.5 rounded-xl text-white flex items-center justify-center gap-2" style={{ backgroundColor: colors.primary }}><MessageSquare size={18} />Message</button></div>
    </div>
  );

  const ChatScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 py-3 flex items-center gap-4 bg-white border-b" style={{ borderColor: colors.border }}><ChevronLeft size={24} style={{ color: colors.text }} /><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.primary }}>MJ</div><div className="flex-1"><h3 className="font-semibold" style={{ color: colors.text }}>Mike Johnson</h3><p className="text-xs" style={{ color: colors.success }}>● Online</p></div><Phone size={20} style={{ color: colors.primary }} /></div>
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="flex gap-3 mb-4"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>MJ</div><div><div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ backgroundColor: colors.surfaceDark }}><p className="text-sm">Hi! I'm on my way. ETA 15 mins.</p></div><p className="text-xs mt-1" style={{ color: colors.textMuted }}>10:45 AM</p></div></div>
        <div className="flex gap-3 mb-4 justify-end"><div><div className="px-4 py-3 rounded-2xl rounded-tr-sm text-white" style={{ backgroundColor: colors.primary }}><p className="text-sm">Great! Doorman name is James.</p></div><p className="text-xs mt-1 text-right" style={{ color: colors.textMuted }}>10:46 AM</p></div></div>
        <div className="flex gap-3 mb-4"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>MJ</div><div><div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ backgroundColor: colors.surfaceDark }}><p className="text-sm">Perfect, see you soon! 👋</p></div><p className="text-xs mt-1" style={{ color: colors.textMuted }}>10:47 AM</p></div></div>
      </div>
      <div className="p-4 bg-white border-t flex items-center gap-3" style={{ borderColor: colors.border }}><Camera size={22} style={{ color: colors.textMuted }} /><div className="flex-1 px-4 py-3 rounded-full" style={{ backgroundColor: colors.surfaceDark }}><input placeholder="Type a message..." className="w-full bg-transparent outline-none text-sm" /></div><button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}><Send size={18} color="white" /></button></div>
    </div>
  );

  const NotificationsScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex justify-between"><h1 className="text-2xl font-bold" style={{ color: colors.text }}>Notifications</h1><button className="text-sm" style={{ color: colors.primary }}>Mark all read</button></div>
      <div className="flex-1 overflow-auto px-6 pb-28">
        {[{ t: 'Contractor En Route', d: 'Mike is heading over. ETA 15 mins.', time: '5m', unread: true },{ t: 'Contractor Assigned', d: 'SwiftFix Plumbing accepted.', time: '1h', unread: true },{ t: 'Ticket Created', d: 'Request #RF-2024-1847 received.', time: '2h', unread: false }].map((n, i) => (
          <div key={i} className={`p-4 rounded-xl mb-3 bg-white border ${n.unread ? 'border-l-4' : ''}`} style={{ borderColor: n.unread ? colors.primary : colors.border }}>
            <div className="flex gap-4"><div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}><Bell size={18} style={{ color: colors.primary }} /></div><div className="flex-1"><div className="flex justify-between"><h3 className="font-semibold" style={{ color: colors.text }}>{n.t}</h3>{n.unread && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>}</div><p className="text-sm mt-1" style={{ color: colors.textMuted }}>{n.d}</p><p className="text-xs mt-2" style={{ color: colors.textMuted }}>{n.time} ago</p></div></div>
          </div>
        ))}
      </div>
      <BottomNav active="notifications" />
    </div>
  );

  const ProfileScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="flex-1 overflow-auto pb-28">
        <div className="px-6 pt-4 pb-8 text-center" style={{ background: `linear-gradient(180deg, ${colors.primary}10 0%, transparent 100%)` }}><div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-3xl text-white" style={{ backgroundColor: colors.primary }}>SB</div><h1 className="text-2xl font-bold" style={{ color: colors.text }}>Sarah Brown</h1><p className="text-sm" style={{ color: colors.textMuted }}>sarah.brown@email.com</p></div>
        <div className="px-6">
          <div className="bg-white rounded-xl p-4 border mb-6" style={{ borderColor: colors.border }}><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}><Building size={24} style={{ color: colors.primary }} /></div><div><h3 className="font-semibold" style={{ color: colors.text }}>42 Baker Street, Flat 3</h3><p className="text-sm" style={{ color: colors.textMuted }}>Since Jan 2023</p></div></div></div>
          {[{ i: User, l: 'Personal Info' },{ i: Building, l: 'My Property' },{ i: FileText, l: 'Documents' },{ i: Bell, l: 'Notifications' },{ i: Settings, l: 'Settings' }].map((m, i) => (<button key={i} className="w-full p-4 rounded-xl flex items-center justify-between bg-white border mb-2" style={{ borderColor: colors.border }}><div className="flex items-center gap-3"><m.i size={20} style={{ color: colors.primary }} /><span>{m.l}</span></div><ChevronRight size={18} style={{ color: colors.textMuted }} /></button>))}
          <button className="w-full mt-4 p-4 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: colors.error + '10' }}><LogOut size={20} style={{ color: colors.error }} /><span style={{ color: colors.error }}>Sign Out</span></button>
        </div>
      </div>
      <BottomNav active="profile" />
    </div>
  );

  const PropertyScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex items-center"><ChevronLeft size={24} style={{ color: colors.text }} /><h1 className="text-lg font-semibold ml-3" style={{ color: colors.text }}>Property Details</h1></div>
      <div className="flex-1 overflow-auto px-6 pb-8">
        <div className="w-full h-40 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: colors.surfaceDark }}><Building size={48} style={{ color: colors.textMuted }} /></div>
        <div className="bg-white rounded-xl p-4 border mb-4" style={{ borderColor: colors.border }}><h3 className="font-semibold mb-3" style={{ color: colors.text }}>Address</h3><p style={{ color: colors.text }}>42 Baker Street, Flat 3</p><p style={{ color: colors.textMuted }}>London NW1 6XE</p></div>
        <div className="bg-white rounded-xl p-4 border mb-4" style={{ borderColor: colors.border }}><h3 className="font-semibold mb-3" style={{ color: colors.text }}>Lease</h3>{[{ l: 'Start', v: 'Jan 15, 2023' },{ l: 'End', v: 'Jan 14, 2025' },{ l: 'Rent', v: '£1,850/mo' }].map((r, i) => (<div key={i} className="flex justify-between mb-2"><span style={{ color: colors.textMuted }}>{r.l}</span><span className="font-medium" style={{ color: colors.text }}>{r.v}</span></div>))}</div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: colors.border }}><h3 className="font-semibold mb-3" style={{ color: colors.text }}>Agent</h3><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.textMuted }}>JW</div><div><p className="font-medium" style={{ color: colors.text }}>James Wilson</p><p className="text-sm" style={{ color: colors.textMuted }}>Premier Property Mgmt</p></div></div></div>
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      <div className="px-6 pt-2 pb-4 flex items-center"><ChevronLeft size={24} style={{ color: colors.text }} /><h1 className="text-lg font-semibold ml-3" style={{ color: colors.text }}>Settings</h1></div>
      <div className="flex-1 overflow-auto px-6 pb-8">
        {[{ t: 'Notifications', items: [{ l: 'Push', v: true },{ l: 'Email', v: true },{ l: 'SMS', v: false }] },{ t: 'App', items: [{ l: 'Dark Mode', v: false },{ l: 'Language', v: 'English' }] },{ t: 'Support', items: [{ l: 'Help Center' },{ l: 'Contact' }] }].map((s, i) => (
          <div key={i} className="mb-6"><h2 className="text-sm font-semibold mb-3 uppercase" style={{ color: colors.textMuted }}>{s.t}</h2><div className="rounded-xl overflow-hidden bg-white border" style={{ borderColor: colors.border }}>{s.items.map((item, j) => (<div key={j} className="px-4 py-3.5 flex items-center justify-between border-b last:border-b-0" style={{ borderColor: colors.border }}><span>{item.l}</span>{typeof item.v === 'boolean' ? (<div className="w-12 h-7 rounded-full relative" style={{ backgroundColor: item.v ? colors.primary : colors.border }}><div className="absolute top-1 w-5 h-5 rounded-full bg-white shadow" style={{ left: item.v ? '26px' : '4px' }}></div></div>) : item.v ? (<div className="flex items-center gap-2"><span style={{ color: colors.textMuted }}>{item.v}</span><ChevronRight size={18} style={{ color: colors.textMuted }} /></div>) : <ChevronRight size={18} style={{ color: colors.textMuted }} />}</div>))}</div></div>
        ))}
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>RentFix Tenant v2.1.0</p>
      </div>
    </div>
  );

  const renderScreen = () => {
    const map = { 'splash': SplashScreen, 'onboarding-1': OnboardingScreen1, 'onboarding-2': OnboardingScreen2, 'onboarding-3': OnboardingScreen3, 'login': LoginScreen, 'register': RegisterScreen, 'home': HomeScreen, 'report-issue': ReportIssueScreen, 'category-confirm': CategoryConfirmScreen, 'photo-capture': PhotoCaptureScreen, 'success': SuccessScreen, 'timeline': TimelineScreen, 'my-tickets': MyTicketsScreen, 'contractor': ContractorScreen, 'chat': ChatScreen, 'notifications': NotificationsScreen, 'profile': ProfileScreen, 'property': PropertyScreen, 'settings': SettingsScreen };
    const Screen = map[screens[currentScreen].id];
    return <Screen />;
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div><span className="text-sm font-medium text-blue-400">Elite 9 Team Design</span></div>
        <h1 className="text-4xl font-bold text-white mb-2">RentFix Tenant App</h1>
        <p className="text-slate-400">19 complete screens • Google, NVIDIA, Microsoft, Figma, Adobe, Uber, Folio, Anthropic, OpenAI</p>
      </div>
      <div className="max-w-6xl mx-auto mb-6"><div className="flex flex-wrap justify-center gap-2">{screens.map((s, i) => (<button key={s.id} onClick={() => setCurrentScreen(i)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentScreen === i ? 'bg-blue-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}>{s.name}</button>))}</div></div>
      <div className="flex justify-center"><div className={`transition-all duration-300 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}><PhoneFrame>{renderScreen()}</PhoneFrame></div></div>
      <div className="flex justify-center items-center gap-8 mt-8">
        <button onClick={() => setCurrentScreen(p => p > 0 ? p - 1 : screens.length - 1)} className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white"><ChevronLeft size={24} /></button>
        <div className="text-center"><p className="text-white font-semibold">{screens[currentScreen].name}</p><p className="text-slate-500 text-sm">{currentScreen + 1} of {screens.length}</p></div>
        <button onClick={() => setCurrentScreen(p => p < screens.length - 1 ? p + 1 : 0)} className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white"><ChevronRight size={24} /></button>
      </div>
      <div className="max-w-4xl mx-auto mt-12 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Building size={20} className="text-blue-400" />Tenant App Design System</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div><h3 className="text-blue-400 font-medium mb-2">Color Palette</h3><ul className="space-y-1 text-slate-400"><li>• Primary: #0B66C3 (Professional Blue)</li><li>• Background: #F7F9FC (Light Gray)</li><li>• Surface: #FFFFFF (White)</li><li>• Success: #16A34A (Green)</li></ul></div>
          <div><h3 className="text-blue-400 font-medium mb-2">User Flows</h3><ul className="space-y-1 text-slate-400"><li>• Onboarding → Login → Home</li><li>• Report → Category → Photo → Submit</li><li>• Tickets → Timeline → Chat</li><li>• Profile → Property → Settings</li></ul></div>
        </div>
      </div>
      <div className="text-center mt-8 text-slate-500 text-sm">React Native + Expo • Based on Rentfix codebase</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

export default TenantAppShowcase;