import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, MapPin, Bell, User, Home, Calendar, CheckCircle, XCircle, Camera, DollarSign, Star, Navigation, Phone, MessageSquare, ChevronRight, ChevronLeft, Settings, LogOut, AlertTriangle, Wrench, Zap, Droplets, Flame, Wind, Menu, X, Search, Filter, Plus, Edit3, Send, Image, FileText, TrendingUp, Award, Shield } from 'lucide-react';

// Elite 9 Team Contractor App - Complete Screen Layouts
// Combining expertise from Google, NVIDIA, Microsoft, Figma, Adobe, Uber, Folio, Anthropic, OpenAI

const ContractorAppShowcase = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(true);

  const screens = [
    { id: 'splash', name: 'Splash Screen' },
    { id: 'login', name: 'Login' },
    { id: 'onboarding', name: 'Onboarding' },
    { id: 'dashboard', name: 'Dashboard Home' },
    { id: 'jobs', name: 'Jobs List' },
    { id: 'job-detail', name: 'Job Detail' },
    { id: 'in-progress', name: 'Job In Progress' },
    { id: 'photo-capture', name: 'Photo Evidence' },
    { id: 'completion', name: 'Job Completion' },
    { id: 'schedule', name: 'Schedule' },
    { id: 'earnings', name: 'Earnings' },
    { id: 'profile', name: 'Profile' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'settings', name: 'Settings' },
  ];

  useEffect(() => {
    setAnimateIn(false);
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, [currentScreen]);

  // Color palette - Deep emerald contractor theme
  const colors = {
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#10B981',
    accent: '#F59E0B',
    accentLight: '#FBBF24',
    background: '#022c22',
    surface: '#064e3b',
    surfaceLight: '#065f46',
    text: '#f0fdf4',
    textMuted: '#a7f3d0',
    success: '#22c55e',
    warning: '#f97316',
    error: '#ef4444',
    border: '#047857',
  };

  // Phone frame component
  const PhoneFrame = ({ children }) => (
    <div className="relative mx-auto" style={{ width: '375px', height: '812px' }}>
      {/* Phone bezel */}
      <div 
        className="absolute inset-0 rounded-[3rem] shadow-2xl"
        style={{ 
          background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
          padding: '12px'
        }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-50 flex items-center justify-center">
          <div className="w-16 h-4 bg-gray-900 rounded-full"></div>
        </div>
        {/* Screen */}
        <div 
          className="w-full h-full rounded-[2.5rem] overflow-hidden relative"
          style={{ backgroundColor: colors.background }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Status bar component
  const StatusBar = ({ light = false }) => (
    <div className={`flex justify-between items-center px-8 pt-4 pb-2 ${light ? 'text-gray-800' : 'text-white'}`}>
      <span className="text-sm font-semibold">9:41</span>
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[1,2,3,4].map(i => (
            <div key={i} className={`w-1 rounded-sm ${light ? 'bg-gray-800' : 'bg-white'}`} style={{height: `${8 + i*2}px`}}></div>
          ))}
        </div>
        <span className="text-xs ml-1">5G</span>
        <div className="ml-1 w-6 h-3 border rounded-sm relative">
          <div className="absolute inset-0.5 bg-current rounded-xs" style={{width: '75%'}}></div>
        </div>
      </div>
    </div>
  );

  // Bottom navigation
  const BottomNav = ({ active }) => (
    <div 
      className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 px-6"
      style={{ 
        backgroundColor: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        paddingBottom: '2rem'
      }}
    >
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'jobs', icon: Briefcase, label: 'Jobs' },
        { id: 'schedule', icon: Calendar, label: 'Schedule' },
        { id: 'earnings', icon: DollarSign, label: 'Earnings' },
        { id: 'profile', icon: User, label: 'Profile' },
      ].map(item => (
        <button 
          key={item.id}
          className="flex flex-col items-center gap-1 transition-all duration-200"
          style={{ 
            color: active === item.id ? colors.primaryLight : colors.textMuted,
            transform: active === item.id ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <item.icon size={22} strokeWidth={active === item.id ? 2.5 : 2} />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );

  // Screen components
  const SplashScreen = () => (
    <div 
      className="h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${colors.background} 0%, ${colors.surface} 100%)` }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${colors.primaryLight} 0%, transparent 70%)`,
              animation: `pulse ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div 
          className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: `0 20px 60px ${colors.primary}40`
          }}
        >
          <Wrench size={56} color={colors.text} strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.text }}>
          RentFix
        </h1>
        <p className="text-lg mt-2" style={{ color: colors.textMuted }}>
          Contractor
        </p>
      </div>
      
      {/* Loading indicator */}
      <div className="absolute bottom-32 flex gap-2">
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: colors.primaryLight,
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: `${i * 0.16}s`
            }}
          />
        ))}
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header graphic */}
      <div 
        className="h-48 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.surfaceLight} 100%)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Wrench size={80} color="rgba(255,255,255,0.2)" strokeWidth={1} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16" 
          style={{ background: `linear-gradient(to top, ${colors.background}, transparent)` }}
        />
      </div>
      
      <div className="flex-1 px-6 pt-4">
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Welcome back</h1>
        <p className="mt-2 mb-8" style={{ color: colors.textMuted }}>
          Sign in to manage your jobs and earnings
        </p>
        
        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: colors.textMuted }}>Email</label>
            <div 
              className="mt-1 flex items-center px-4 py-3.5 rounded-xl border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <User size={20} style={{ color: colors.textMuted }} />
              <input 
                type="email" 
                placeholder="contractor@example.com"
                className="flex-1 ml-3 bg-transparent outline-none text-base"
                style={{ color: colors.text }}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium" style={{ color: colors.textMuted }}>Password</label>
            <div 
              className="mt-1 flex items-center px-4 py-3.5 rounded-xl border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Shield size={20} style={{ color: colors.textMuted }} />
              <input 
                type="password" 
                placeholder="••••••••"
                className="flex-1 ml-3 bg-transparent outline-none text-base"
                style={{ color: colors.text }}
              />
            </div>
          </div>
          
          <button className="text-sm text-right w-full" style={{ color: colors.primaryLight }}>
            Forgot password?
          </button>
          
          <button 
            className="w-full py-4 rounded-xl font-semibold text-base shadow-lg transition-all duration-200 hover:scale-[1.02]"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              color: colors.text,
              boxShadow: `0 8px 30px ${colors.primary}50`
            }}
          >
            Sign In
          </button>
          
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: colors.border }}></div>
            <span className="text-sm" style={{ color: colors.textMuted }}>or continue with</span>
            <div className="flex-1 h-px" style={{ backgroundColor: colors.border }}></div>
          </div>
          
          <div className="flex gap-4">
            {['Google', 'Apple'].map(provider => (
              <button 
                key={provider}
                className="flex-1 py-3.5 rounded-xl border font-medium"
                style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-center mt-8 text-sm" style={{ color: colors.textMuted }}>
          New contractor? <span style={{ color: colors.primaryLight, fontWeight: 600 }}>Apply now</span>
        </p>
      </div>
    </div>
  );

  const OnboardingScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      <div className="flex-1 px-6 pt-8 flex flex-col">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(step => (
            <div 
              key={step}
              className="flex-1 h-1.5 rounded-full"
              style={{ backgroundColor: step === 1 ? colors.primaryLight : colors.surface }}
            />
          ))}
        </div>
        
        {/* Illustration */}
        <div 
          className="w-full h-56 rounded-2xl flex items-center justify-center mb-8"
          style={{ background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceLight} 100%)` }}
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary + '30' }}>
              <MapPin size={48} style={{ color: colors.primaryLight }} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.accent }}>
              <Navigation size={16} style={{ color: colors.background }} />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-3" style={{ color: colors.text }}>
          Set your service area
        </h1>
        <p className="text-base mb-8" style={{ color: colors.textMuted }}>
          We'll match you with jobs in your preferred locations. You can update this anytime.
        </p>
        
        {/* Location input */}
        <div 
          className="flex items-center px-4 py-3.5 rounded-xl border mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <MapPin size={20} style={{ color: colors.primaryLight }} />
          <input 
            type="text" 
            placeholder="Enter postcode or city"
            className="flex-1 ml-3 bg-transparent outline-none"
            style={{ color: colors.text }}
          />
        </div>
        
        {/* Radius slider */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: colors.textMuted }}>Service radius</span>
            <span className="text-sm font-semibold" style={{ color: colors.primaryLight }}>15 km</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: colors.surface }}>
            <div className="h-full w-3/5 rounded-full" style={{ backgroundColor: colors.primaryLight }}></div>
          </div>
        </div>
        
        <div className="mt-auto pb-8">
          <button 
            className="w-full py-4 rounded-xl font-semibold shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              color: colors.text
            }}
          >
            Continue
          </button>
          <button className="w-full py-3 mt-3 font-medium" style={{ color: colors.textMuted }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );

  const DashboardScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: colors.textMuted }}>Good morning</p>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>Mike Johnson</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="relative p-2.5 rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <Bell size={22} style={{ color: colors.text }} />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.accent }}></div>
            </button>
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: colors.primary, color: colors.text }}
            >
              MJ
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-24">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Today\'s Jobs', value: '3', icon: Briefcase, color: colors.primary },
            { label: 'This Week', value: '£1,240', icon: DollarSign, color: colors.accent },
            { label: 'Rating', value: '4.9', icon: Star, color: colors.warning },
            { label: 'Completed', value: '127', icon: CheckCircle, color: colors.success },
          ].map((stat, i) => (
            <div 
              key={i}
              className="p-4 rounded-2xl"
              style={{ backgroundColor: colors.surface }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: stat.color + '20' }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>{stat.value}</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Next job card */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Next Job</h2>
          <div 
            className="p-4 rounded-2xl border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.primary + '20' }}
                >
                  <Droplets size={24} style={{ color: colors.primaryLight }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: colors.text }}>Leaking Tap</h3>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Plumbing • Kitchen</p>
                </div>
              </div>
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.warning + '20', color: colors.warning }}
              >
                In 2 hours
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} style={{ color: colors.textMuted }} />
              <span className="text-sm" style={{ color: colors.textMuted }}>42 Baker Street, NW1 6XE</span>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: colors.textMuted }} />
                <span className="text-sm" style={{ color: colors.textMuted }}>10:30 AM - 11:30 AM</span>
              </div>
              <button 
                className="px-4 py-2 rounded-lg font-medium text-sm"
                style={{ backgroundColor: colors.primary, color: colors.text }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Calendar, label: 'Schedule', color: colors.primary },
              { icon: MapPin, label: 'Navigate', color: colors.accent },
              { icon: Phone, label: 'Support', color: colors.success },
              { icon: FileText, label: 'Invoices', color: colors.warning },
            ].map((action, i) => (
              <button 
                key={i}
                className="flex flex-col items-center gap-2 p-3 rounded-xl"
                style={{ backgroundColor: colors.surface }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  <action.icon size={20} style={{ color: action.color }} />
                </div>
                <span className="text-xs" style={{ color: colors.textMuted }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <BottomNav active="home" />
    </div>
  );

  const JobsListScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>My Jobs</h1>
        
        {/* Tabs */}
        <div className="flex gap-2">
          {['Assigned', 'Available', 'Completed'].map((tab, i) => (
            <button 
              key={tab}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ 
                backgroundColor: i === 0 ? colors.primary : colors.surface,
                color: i === 0 ? colors.text : colors.textMuted
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="px-6 flex gap-3 mb-4">
        <div 
          className="flex-1 flex items-center px-4 py-3 rounded-xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Search size={18} style={{ color: colors.textMuted }} />
          <input 
            placeholder="Search jobs..."
            className="flex-1 ml-2 bg-transparent outline-none text-sm"
            style={{ color: colors.text }}
          />
        </div>
        <button 
          className="p-3 rounded-xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Filter size={18} style={{ color: colors.textMuted }} />
        </button>
      </div>
      
      {/* Jobs list */}
      <div className="flex-1 overflow-auto px-6 pb-24">
        {[
          { title: 'Leaking Tap', type: 'Plumbing', address: '42 Baker St', time: '10:30 AM', priority: 'high', price: '£85' },
          { title: 'Broken Thermostat', type: 'Heating', address: '15 Oxford Rd', time: '1:00 PM', priority: 'medium', price: '£120' },
          { title: 'Electrical Socket', type: 'Electrical', address: '8 Kings Ave', time: '3:30 PM', priority: 'low', price: '£65' },
          { title: 'Boiler Service', type: 'Heating', address: '23 Park Lane', time: 'Tomorrow', priority: 'medium', price: '£150' },
        ].map((job, i) => (
          <div 
            key={i}
            className="p-4 rounded-2xl mb-3 border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: job.type === 'Plumbing' ? colors.primary + '20' : 
                                     job.type === 'Heating' ? colors.warning + '20' : colors.accent + '20'
                  }}
                >
                  {job.type === 'Plumbing' ? <Droplets size={22} style={{ color: colors.primaryLight }} /> :
                   job.type === 'Heating' ? <Flame size={22} style={{ color: colors.warning }} /> :
                   <Zap size={22} style={{ color: colors.accent }} />}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: colors.text }}>{job.title}</h3>
                  <p className="text-sm" style={{ color: colors.textMuted }}>{job.type}</p>
                </div>
              </div>
              <span 
                className="text-lg font-bold"
                style={{ color: colors.primaryLight }}
              >
                {job.price}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin size={14} style={{ color: colors.textMuted }} />
                  <span style={{ color: colors.textMuted }}>{job.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} style={{ color: colors.textMuted }} />
                  <span style={{ color: colors.textMuted }}>{job.time}</span>
                </div>
              </div>
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ 
                  backgroundColor: job.priority === 'high' ? colors.error : 
                                   job.priority === 'medium' ? colors.warning : colors.success
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <BottomNav active="jobs" />
    </div>
  );

  const JobDetailScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <button className="p-2 -ml-2">
          <ChevronLeft size={24} style={{ color: colors.text }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: colors.text }}>Job Details</h1>
        <button className="p-2 -mr-2">
          <Phone size={20} style={{ color: colors.primaryLight }} />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-32">
        {/* Job header */}
        <div 
          className="p-5 rounded-2xl mb-4"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20" style={{ color: colors.text }}>
              Plumbing
            </span>
            <span className="text-2xl font-bold" style={{ color: colors.text }}>£85</span>
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>Leaking Kitchen Tap</h2>
          <p className="text-sm opacity-80" style={{ color: colors.text }}>Ticket #RF-2024-1847</p>
        </div>
        
        {/* Tenant info */}
        <div 
          className="p-4 rounded-2xl mb-4 flex items-center gap-4"
          style={{ backgroundColor: colors.surface }}
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ backgroundColor: colors.primary + '30', color: colors.primaryLight }}
          >
            SB
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: colors.text }}>Sarah Brown</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>Tenant since Jan 2023</p>
          </div>
          <button 
            className="p-3 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <MessageSquare size={20} style={{ color: colors.primaryLight }} />
          </button>
        </div>
        
        {/* Location */}
        <div 
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
            <MapPin size={18} style={{ color: colors.primaryLight }} />
            Location
          </h3>
          <p className="mb-2" style={{ color: colors.textMuted }}>42 Baker Street, Flat 3</p>
          <p className="text-sm mb-3" style={{ color: colors.textMuted }}>London NW1 6XE</p>
          <div 
            className="w-full h-32 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.background }}
          >
            <MapPin size={32} style={{ color: colors.textMuted }} />
          </div>
          <button 
            className="w-full mt-3 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.primary + '20', color: colors.primaryLight }}
          >
            <Navigation size={18} />
            Get Directions
          </button>
        </div>
        
        {/* Schedule */}
        <div 
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
            <Clock size={18} style={{ color: colors.primaryLight }} />
            Scheduled Time
          </h3>
          <p className="text-lg font-semibold" style={{ color: colors.text }}>Today, 10:30 AM - 11:30 AM</p>
          <p className="text-sm" style={{ color: colors.textMuted }}>1 hour estimated</p>
        </div>
        
        {/* Description */}
        <div 
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 className="font-semibold mb-3" style={{ color: colors.text }}>Issue Description</h3>
          <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            Kitchen tap has been dripping constantly for 2 days. Water is collecting under the sink. 
            Tenant mentioned the tap handle feels loose. May need washer replacement or full tap replacement.
          </p>
        </div>
        
        {/* Access notes */}
        <div 
          className="p-4 rounded-2xl mb-4 border"
          style={{ backgroundColor: colors.surface, borderColor: colors.warning + '50' }}
        >
          <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: colors.warning }}>
            <AlertTriangle size={18} />
            Access Notes
          </h3>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Doorman name: James. Code: 4521. Small dog in flat (friendly).
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{ 
          background: `linear-gradient(to top, ${colors.background} 80%, transparent)`,
          paddingBottom: '2rem'
        }}
      >
        <div className="flex gap-3">
          <button 
            className="flex-1 py-4 rounded-xl font-semibold border"
            style={{ borderColor: colors.error, color: colors.error }}
          >
            Decline
          </button>
          <button 
            className="flex-1 py-4 rounded-xl font-semibold shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              color: colors.text
            }}
          >
            Start Job
          </button>
        </div>
      </div>
    </div>
  );

  const InProgressScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button className="p-2 -ml-2">
            <ChevronLeft size={24} style={{ color: colors.text }} />
          </button>
          <span 
            className="px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: colors.success + '20', color: colors.success }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.success }}></div>
            In Progress
          </span>
          <div className="w-10"></div>
        </div>
        
        {/* Timer */}
        <div className="text-center">
          <p className="text-sm mb-1" style={{ color: colors.textMuted }}>Time Elapsed</p>
          <p className="text-5xl font-bold tracking-tight" style={{ color: colors.text }}>00:34:12</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-32">
        {/* Job summary */}
        <div 
          className="p-4 rounded-2xl mb-4 flex items-center gap-4"
          style={{ backgroundColor: colors.surface }}
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Droplets size={24} style={{ color: colors.primaryLight }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: colors.text }}>Leaking Kitchen Tap</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>42 Baker Street, Flat 3</p>
          </div>
        </div>
        
        {/* Progress checklist */}
        <div 
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 className="font-semibold mb-4" style={{ color: colors.text }}>Progress Checklist</h3>
          {[
            { label: 'Arrived on site', done: true },
            { label: 'Assessed the issue', done: true },
            { label: 'Work in progress', done: false, current: true },
            { label: 'Take completion photos', done: false },
            { label: 'Get tenant signature', done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${item.current ? 'border-2' : ''}`}
                style={{ 
                  backgroundColor: item.done ? colors.success : 'transparent',
                  borderColor: item.current ? colors.primaryLight : colors.border,
                  ...((!item.done && !item.current) && { border: `1px solid ${colors.border}` })
                }}
              >
                {item.done && <CheckCircle size={14} style={{ color: colors.text }} />}
              </div>
              <span style={{ color: item.done ? colors.text : colors.textMuted }}>{item.label}</span>
            </div>
          ))}
        </div>
        
        {/* Materials used */}
        <div 
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: colors.text }}>Materials Used</h3>
            <button 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Plus size={18} style={{ color: colors.primaryLight }} />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: colors.border }}>
              <span style={{ color: colors.textMuted }}>Tap washer (15mm)</span>
              <span style={{ color: colors.text }}>£2.50</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span style={{ color: colors.textMuted }}>PTFE tape</span>
              <span style={{ color: colors.text }}>£1.20</span>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div 
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 className="font-semibold mb-3" style={{ color: colors.text }}>Work Notes</h3>
          <textarea 
            placeholder="Add notes about the repair..."
            className="w-full h-24 bg-transparent outline-none resize-none text-sm"
            style={{ color: colors.text }}
          />
        </div>
      </div>
      
      {/* Action buttons */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{ 
          background: `linear-gradient(to top, ${colors.background} 80%, transparent)`,
          paddingBottom: '2rem'
        }}
      >
        <div className="flex gap-3">
          <button 
            className="flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.surface, color: colors.text }}
          >
            <Camera size={20} />
            Add Photos
          </button>
          <button 
            className="flex-1 py-4 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
            style={{ 
              background: `linear-gradient(135deg, ${colors.success} 0%, #16a34a 100%)`,
              color: colors.text
            }}
          >
            <CheckCircle size={20} />
            Complete Job
          </button>
        </div>
      </div>
    </div>
  );

  const PhotoCaptureScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#000' }}>
      <StatusBar light={false} />
      
      {/* Camera view placeholder */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Camera size={64} style={{ color: '#333' }} />
        </div>
        
        {/* Guide overlay */}
        <div className="absolute inset-8 border-2 border-white/30 rounded-2xl"></div>
        
        {/* Top info */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button className="p-2 rounded-full bg-black/50">
            <X size={24} style={{ color: '#fff' }} />
          </button>
          <span className="px-4 py-2 rounded-full bg-black/50 text-white text-sm font-medium">
            Before Photo • 1 of 2
          </span>
          <button className="p-2 rounded-full bg-black/50">
            <Zap size={24} style={{ color: '#fff' }} />
          </button>
        </div>
        
        {/* Photo thumbnails */}
        <div className="absolute bottom-32 left-4 flex gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className="w-14 h-14 rounded-lg border-2 border-white/50 flex items-center justify-center"
              style={{ backgroundColor: i === 1 ? colors.surface : 'transparent' }}
            >
              {i === 1 && <Image size={20} style={{ color: colors.textMuted }} />}
            </div>
          ))}
        </div>
      </div>
      
      {/* Camera controls */}
      <div 
        className="py-8 px-6 flex items-center justify-around"
        style={{ backgroundColor: '#000' }}
      >
        <button className="p-3 rounded-full" style={{ backgroundColor: '#222' }}>
          <Image size={24} style={{ color: '#fff' }} />
        </button>
        <button 
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full" style={{ backgroundColor: colors.primary }}></div>
        </button>
        <button className="p-3 rounded-full" style={{ backgroundColor: '#222' }}>
          <Edit3 size={24} style={{ color: '#fff' }} />
        </button>
      </div>
    </div>
  );

  const CompletionScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      <div className="flex-1 px-6 pt-8 flex flex-col items-center justify-center">
        {/* Success animation */}
        <div 
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{ 
            background: `linear-gradient(135deg, ${colors.success}30 0%, ${colors.success}10 100%)`,
            boxShadow: `0 0 60px ${colors.success}30`
          }}
        >
          <CheckCircle size={56} style={{ color: colors.success }} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: colors.text }}>
          Job Completed!
        </h1>
        <p className="text-center mb-8" style={{ color: colors.textMuted }}>
          Great work! The tenant has been notified.
        </p>
        
        {/* Summary card */}
        <div 
          className="w-full p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: colors.border }}>
            <span style={{ color: colors.textMuted }}>Job Duration</span>
            <span className="font-semibold" style={{ color: colors.text }}>47 minutes</span>
          </div>
          <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: colors.border }}>
            <span style={{ color: colors.textMuted }}>Labour</span>
            <span className="font-semibold" style={{ color: colors.text }}>£85.00</span>
          </div>
          <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: colors.border }}>
            <span style={{ color: colors.textMuted }}>Materials</span>
            <span className="font-semibold" style={{ color: colors.text }}>£3.70</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: colors.text }}>Total Earnings</span>
            <span className="text-2xl font-bold" style={{ color: colors.primaryLight }}>£88.70</span>
          </div>
        </div>
        
        {/* Rating prompt */}
        <div 
          className="w-full p-4 rounded-2xl flex items-center gap-4"
          style={{ backgroundColor: colors.surface }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.accent + '20' }}
          >
            <Star size={24} style={{ color: colors.accent }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: colors.text }}>Rate this job</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Help us improve matching</p>
          </div>
          <ChevronRight size={20} style={{ color: colors.textMuted }} />
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-6" style={{ paddingBottom: '2rem' }}>
        <button 
          className="w-full py-4 rounded-xl font-semibold shadow-lg mb-3"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            color: colors.text
          }}
        >
          View Next Job
        </button>
        <button 
          className="w-full py-4 rounded-xl font-medium"
          style={{ color: colors.textMuted }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  const ScheduleScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>Schedule</h1>
          <button 
            className="p-2.5 rounded-full"
            style={{ backgroundColor: colors.surface }}
          >
            <Plus size={20} style={{ color: colors.primaryLight }} />
          </button>
        </div>
        
        {/* Week selector */}
        <div className="flex items-center justify-between mb-4">
          <button className="p-2">
            <ChevronLeft size={20} style={{ color: colors.textMuted }} />
          </button>
          <span className="font-semibold" style={{ color: colors.text }}>December 2024</span>
          <button className="p-2">
            <ChevronRight size={20} style={{ color: colors.textMuted }} />
          </button>
        </div>
        
        {/* Days */}
        <div className="flex justify-between">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-xs mb-2" style={{ color: colors.textMuted }}>{day}</span>
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${i === 2 ? 'shadow-lg' : ''}`}
                style={{ 
                  backgroundColor: i === 2 ? colors.primary : 'transparent',
                  color: i === 2 ? colors.text : colors.textMuted
                }}
              >
                {9 + i}
              </div>
              {i === 2 && (
                <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: colors.accent }}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline */}
      <div className="flex-1 overflow-auto px-6 pb-24">
        <p className="text-sm font-medium mb-4" style={{ color: colors.textMuted }}>Wednesday, Dec 11</p>
        
        <div className="relative pl-6 border-l-2" style={{ borderColor: colors.border }}>
          {[
            { time: '09:00', title: 'Boiler Service', address: '15 Oxford Rd', duration: '2h', type: 'Heating' },
            { time: '11:30', title: 'Free Slot', isFree: true },
            { time: '14:00', title: 'Electrical Socket', address: '8 Kings Ave', duration: '1h', type: 'Electrical' },
            { time: '16:00', title: 'Pipe Leak', address: '23 Park Lane', duration: '1.5h', type: 'Plumbing' },
          ].map((slot, i) => (
            <div key={i} className="mb-6 relative">
              <div 
                className="absolute -left-8 w-3 h-3 rounded-full border-2"
                style={{ 
                  backgroundColor: slot.isFree ? colors.background : colors.primary,
                  borderColor: slot.isFree ? colors.border : colors.primary
                }}
              ></div>
              <span className="text-sm font-medium" style={{ color: colors.textMuted }}>{slot.time}</span>
              {slot.isFree ? (
                <div 
                  className="mt-2 p-4 rounded-xl border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: colors.border }}
                >
                  <span style={{ color: colors.textMuted }}>Available for booking</span>
                </div>
              ) : (
                <div 
                  className="mt-2 p-4 rounded-xl"
                  style={{ backgroundColor: colors.surface }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" style={{ color: colors.text }}>{slot.title}</h3>
                    <span className="text-sm" style={{ color: colors.textMuted }}>{slot.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: colors.textMuted }} />
                    <span className="text-sm" style={{ color: colors.textMuted }}>{slot.address}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav active="schedule" />
    </div>
  );

  const EarningsScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>Earnings</h1>
        
        {/* Period selector */}
        <div className="flex gap-2">
          {['Week', 'Month', 'Year'].map((period, i) => (
            <button 
              key={period}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: i === 1 ? colors.primary : colors.surface,
                color: i === 1 ? colors.text : colors.textMuted
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-24">
        {/* Total earnings card */}
        <div 
          className="p-6 rounded-2xl mb-6"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <p className="text-sm opacity-80 mb-1" style={{ color: colors.text }}>December 2024</p>
          <p className="text-4xl font-bold mb-4" style={{ color: colors.text }}>£3,847.50</p>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: colors.text }} />
            <span className="text-sm" style={{ color: colors.text }}>+12% from last month</span>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Jobs Completed', value: '23', icon: Briefcase },
            { label: 'Total Hours', value: '67h', icon: Clock },
            { label: 'Avg per Job', value: '£167', icon: DollarSign },
            { label: 'Rating', value: '4.9', icon: Star },
          ].map((stat, i) => (
            <div 
              key={i}
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <stat.icon size={20} style={{ color: colors.primaryLight }} className="mb-2" />
              <p className="text-xl font-bold" style={{ color: colors.text }}>{stat.value}</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Recent payments */}
        <h2 className="font-semibold mb-3" style={{ color: colors.text }}>Recent Payments</h2>
        {[
          { title: 'Boiler Repair', date: 'Dec 10', amount: '£180.00', status: 'Paid' },
          { title: 'Electrical Work', date: 'Dec 8', amount: '£95.00', status: 'Paid' },
          { title: 'Plumbing Fix', date: 'Dec 5', amount: '£88.70', status: 'Pending' },
        ].map((payment, i) => (
          <div 
            key={i}
            className="p-4 rounded-xl mb-3 flex items-center justify-between"
            style={{ backgroundColor: colors.surface }}
          >
            <div>
              <p className="font-medium" style={{ color: colors.text }}>{payment.title}</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>{payment.date}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold" style={{ color: colors.text }}>{payment.amount}</p>
              <p 
                className="text-sm"
                style={{ color: payment.status === 'Paid' ? colors.success : colors.warning }}
              >
                {payment.status}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <BottomNav active="earnings" />
    </div>
  );

  const ProfileScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      <div className="flex-1 overflow-auto pb-24">
        {/* Profile header */}
        <div 
          className="px-6 pt-4 pb-8 text-center"
          style={{ background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.background} 100%)` }}
        >
          <div 
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-3xl"
            style={{ backgroundColor: colors.primary, color: colors.text }}
          >
            MJ
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>Mike Johnson</h1>
          <p className="text-sm mb-3" style={{ color: colors.textMuted }}>SwiftFix Plumbing & Heating</p>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Star size={16} style={{ color: colors.accent }} fill={colors.accent} />
              <span className="font-semibold" style={{ color: colors.text }}>4.9</span>
              <span className="text-sm" style={{ color: colors.textMuted }}>(127 reviews)</span>
            </div>
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: colors.success + '20', color: colors.success }}
            >
              Verified
            </span>
          </div>
        </div>
        
        <div className="px-6">
          {/* Stats */}
          <div className="flex justify-around py-4 mb-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            {[
              { label: 'Jobs', value: '127' },
              { label: 'Years', value: '5' },
              { label: 'Response', value: '< 1hr' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-bold" style={{ color: colors.text }}>{stat.value}</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>{stat.label}</p>
              </div>
            ))}
          </div>
          
          {/* Specialties */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3" style={{ color: colors.text }}>Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {['Plumbing', 'Heating', 'Boilers', 'Emergency Repairs', 'Bathrooms'].map(skill => (
                <span 
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: colors.primary + '20', color: colors.primaryLight }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {/* Menu items */}
          <div className="space-y-2">
            {[
              { icon: FileText, label: 'Documents & Certificates', badge: '3 expiring' },
              { icon: Award, label: 'Reviews & Ratings' },
              { icon: DollarSign, label: 'Payment Details' },
              { icon: MapPin, label: 'Service Area' },
              { icon: Bell, label: 'Notification Settings' },
              { icon: Settings, label: 'App Settings' },
            ].map((item, i) => (
              <button 
                key={i}
                className="w-full p-4 rounded-xl flex items-center justify-between"
                style={{ backgroundColor: colors.surface }}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} style={{ color: colors.primaryLight }} />
                  <span style={{ color: colors.text }}>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={18} style={{ color: colors.textMuted }} />
                </div>
              </button>
            ))}
          </div>
          
          {/* Logout */}
          <button 
            className="w-full mt-6 p-4 rounded-xl flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.error + '15' }}
          >
            <LogOut size={20} style={{ color: colors.error }} />
            <span style={{ color: colors.error }}>Sign Out</span>
          </button>
        </div>
      </div>
      
      <BottomNav active="profile" />
    </div>
  );

  const NotificationsScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <button className="p-2 -ml-2">
          <ChevronLeft size={24} style={{ color: colors.text }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: colors.text }}>Notifications</h1>
        <button className="text-sm" style={{ color: colors.primaryLight }}>Mark all read</button>
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-8">
        {[
          { type: 'job', title: 'New job available', desc: 'Plumbing repair in NW1 - £120', time: '5 min ago', unread: true },
          { type: 'payment', title: 'Payment received', desc: '£180.00 for Boiler Repair', time: '2 hours ago', unread: true },
          { type: 'review', title: 'New 5-star review', desc: '"Excellent work, very professional!"', time: '1 day ago', unread: false },
          { type: 'reminder', title: 'Job reminder', desc: 'Electrical Socket at 8 Kings Ave tomorrow', time: '1 day ago', unread: false },
          { type: 'system', title: 'Insurance expiring soon', desc: 'Your liability insurance expires in 30 days', time: '3 days ago', unread: false },
        ].map((notif, i) => (
          <div 
            key={i}
            className={`p-4 rounded-xl mb-3 flex gap-4 ${notif.unread ? 'border-l-4' : ''}`}
            style={{ 
              backgroundColor: colors.surface,
              borderColor: notif.unread ? colors.primaryLight : 'transparent'
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: notif.type === 'job' ? colors.primary + '20' :
                                 notif.type === 'payment' ? colors.success + '20' :
                                 notif.type === 'review' ? colors.accent + '20' :
                                 notif.type === 'reminder' ? colors.warning + '20' : colors.error + '20'
              }}
            >
              {notif.type === 'job' && <Briefcase size={18} style={{ color: colors.primaryLight }} />}
              {notif.type === 'payment' && <DollarSign size={18} style={{ color: colors.success }} />}
              {notif.type === 'review' && <Star size={18} style={{ color: colors.accent }} />}
              {notif.type === 'reminder' && <Clock size={18} style={{ color: colors.warning }} />}
              {notif.type === 'system' && <AlertTriangle size={18} style={{ color: colors.error }} />}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold" style={{ color: colors.text }}>{notif.title}</h3>
                {notif.unread && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primaryLight }}></div>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{notif.desc}</p>
              <p className="text-xs mt-2" style={{ color: colors.textMuted }}>{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      <StatusBar />
      
      {/* Header */}
      <div className="px-6 pt-2 pb-4 flex items-center">
        <button className="p-2 -ml-2">
          <ChevronLeft size={24} style={{ color: colors.text }} />
        </button>
        <h1 className="text-lg font-semibold ml-2" style={{ color: colors.text }}>Settings</h1>
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-8">
        {/* Sections */}
        {[
          {
            title: 'Availability',
            items: [
              { label: 'Online Status', type: 'toggle', value: true },
              { label: 'Auto-accept jobs', type: 'toggle', value: false },
              { label: 'Working Hours', type: 'link', value: '8 AM - 6 PM' },
            ]
          },
          {
            title: 'Notifications',
            items: [
              { label: 'Push Notifications', type: 'toggle', value: true },
              { label: 'Email Updates', type: 'toggle', value: true },
              { label: 'SMS Alerts', type: 'toggle', value: false },
            ]
          },
          {
            title: 'App',
            items: [
              { label: 'Dark Mode', type: 'toggle', value: true },
              { label: 'Language', type: 'link', value: 'English' },
              { label: 'Units', type: 'link', value: 'Metric' },
            ]
          },
          {
            title: 'Support',
            items: [
              { label: 'Help Center', type: 'link' },
              { label: 'Contact Support', type: 'link' },
              { label: 'Report a Problem', type: 'link' },
            ]
          },
        ].map((section, i) => (
          <div key={i} className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textMuted }}>{section.title}</h2>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
              {section.items.map((item, j) => (
                <div 
                  key={j}
                  className="px-4 py-3.5 flex items-center justify-between border-b last:border-b-0"
                  style={{ borderColor: colors.border }}
                >
                  <span style={{ color: colors.text }}>{item.label}</span>
                  {item.type === 'toggle' ? (
                    <div 
                      className="w-12 h-7 rounded-full relative"
                      style={{ backgroundColor: item.value ? colors.primary : colors.border }}
                    >
                      <div 
                        className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                        style={{ left: item.value ? '26px' : '4px' }}
                      ></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {item.value && <span style={{ color: colors.textMuted }}>{item.value}</span>}
                      <ChevronRight size={18} style={{ color: colors.textMuted }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>
          RentFix Contractor v2.1.0
        </p>
      </div>
    </div>
  );

  // Render current screen
  const renderScreen = () => {
    const screenComponents = {
      'splash': SplashScreen,
      'login': LoginScreen,
      'onboarding': OnboardingScreen,
      'dashboard': DashboardScreen,
      'jobs': JobsListScreen,
      'job-detail': JobDetailScreen,
      'in-progress': InProgressScreen,
      'photo-capture': PhotoCaptureScreen,
      'completion': CompletionScreen,
      'schedule': ScheduleScreen,
      'earnings': EarningsScreen,
      'profile': ProfileScreen,
      'notifications': NotificationsScreen,
      'settings': SettingsScreen,
    };
    
    const ScreenComponent = screenComponents[screens[currentScreen].id];
    return <ScreenComponent />;
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-medium text-emerald-400">Elite 9 Team Design Review</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          RentFix Contractor App
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Complete screen layouts designed with expertise from Google, NVIDIA, Microsoft, Figma, Adobe, Uber, Folio, Anthropic & OpenAI
        </p>
      </div>
      
      {/* Screen navigator */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {screens.map((screen, i) => (
            <button
              key={screen.id}
              onClick={() => setCurrentScreen(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentScreen === i 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Phone display */}
      <div className="flex justify-center">
        <div 
          className={`transition-all duration-300 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <PhoneFrame>
            {renderScreen()}
          </PhoneFrame>
        </div>
      </div>
      
      {/* Navigation arrows */}
      <div className="flex justify-center items-center gap-8 mt-8">
        <button
          onClick={() => setCurrentScreen(prev => prev > 0 ? prev - 1 : screens.length - 1)}
          className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold">{screens[currentScreen].name}</p>
          <p className="text-slate-500 text-sm">{currentScreen + 1} of {screens.length}</p>
        </div>
        <button
          onClick={() => setCurrentScreen(prev => prev < screens.length - 1 ? prev + 1 : 0)}
          className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Design notes */}
      <div className="max-w-4xl mx-auto mt-12 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wrench size={20} className="text-emerald-400" />
          Design System Notes
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="text-emerald-400 font-medium mb-2">Color Palette</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Primary: Deep Emerald (#059669)</li>
              <li>• Background: Forest Dark (#022c22)</li>
              <li>• Surface: Emerald Shadow (#064e3b)</li>
              <li>• Accent: Amber (#F59E0B)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-emerald-400 font-medium mb-2">Typography</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• SF Pro Display for headings</li>
              <li>• SF Pro Text for body</li>
              <li>• Consistent 8px spacing grid</li>
              <li>• WCAG AA accessibility</li>
            </ul>
          </div>
          <div>
            <h3 className="text-emerald-400 font-medium mb-2">Key Features</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Real-time job tracking</li>
              <li>• Offline-first architecture</li>
              <li>• Photo evidence capture</li>
              <li>• Earnings dashboard</li>
            </ul>
          </div>
          <div>
            <h3 className="text-emerald-400 font-medium mb-2">UX Patterns</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Card-based job display</li>
              <li>• Progressive disclosure</li>
              <li>• Contextual navigation</li>
              <li>• Micro-interactions</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center mt-8 text-slate-500 text-sm">
        <p>Built with React Native + Expo | Based on existing Rentfix codebase</p>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default ContractorAppShowcase;
