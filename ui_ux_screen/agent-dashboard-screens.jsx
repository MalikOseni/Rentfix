import React, { useState, useEffect } from 'react';
import { Home, LayoutDashboard, ListChecks, Building2, Image, BarChart3, Settings, LogOut, Bell, Search, Filter, ChevronDown, ChevronRight, ChevronLeft, MoreHorizontal, AlertTriangle, Clock, CheckCircle, XCircle, Sparkles, Phone, MessageSquare, User, Users, FileText, Download, Calendar, MapPin, Star, TrendingUp, TrendingDown, Activity, Zap, Droplets, Flame, Wrench, Shield, Eye, Edit, Trash2, Plus, RefreshCw, ArrowUpRight, ExternalLink, Mail, Key, PieChart, Target, Award, Timer, HelpCircle, Menu, X, Upload, Camera, Hash, Globe, Database, Cpu } from 'lucide-react';

const AgentDashboardShowcase = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [animateIn, setAnimateIn] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(0);

  const screens = [
    { id: 'login', name: 'Login' },
    { id: 'overview', name: 'Overview' },
    { id: 'triage', name: 'Triage Queue' },
    { id: 'ticket-detail', name: 'Ticket Detail' },
    { id: 'assignments', name: 'Assignments' },
    { id: 'contractor-match', name: 'Contractor Match' },
    { id: 'properties', name: 'Properties' },
    { id: 'property-detail', name: 'Property Detail' },
    { id: 'tenants', name: 'Tenants' },
    { id: 'tenant-detail', name: 'Tenant Detail' },
    { id: 'contractors', name: 'Contractors' },
    { id: 'contractor-detail', name: 'Contractor Detail' },
    { id: 'evidence', name: 'Evidence Vault' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'reports', name: 'Reports' },
    { id: 'ai-insights', name: 'AI Insights' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'settings', name: 'Settings' },
  ];

  useEffect(() => { setAnimateIn(false); const t = setTimeout(() => setAnimateIn(true), 50); return () => clearTimeout(t); }, [currentScreen]);

  const colors = { primary: '#6366F1', primaryDark: '#4F46E5', primaryLight: '#818CF8', secondary: '#0F172A', accent: '#F59E0B', background: '#F8FAFC', surface: '#FFFFFF', surfaceDark: '#F1F5F9', sidebar: '#1E293B', text: '#0F172A', textMuted: '#64748B', success: '#10B981', warning: '#F59E0B', error: '#EF4444', border: '#E2E8F0', emergency: '#DC2626', urgent: '#F97316', routine: '#6366F1' };

  const DesktopFrame = ({ children }) => (
    <div className="relative mx-auto shadow-2xl rounded-xl overflow-hidden" style={{ width: '1280px', height: '800px' }}>
      <div className="h-11 flex items-center px-4 gap-3" style={{ backgroundColor: '#E2E8F0' }}>
        <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
        <div className="flex-1 mx-8"><div className="bg-white rounded-lg px-4 py-1.5 text-sm text-gray-500 flex items-center gap-2 max-w-md"><Globe size={14} /><span>app.rentfix.io/agent/dashboard</span></div></div>
      </div>
      <div className="h-[756px] overflow-hidden" style={{ backgroundColor: colors.background }}>{children}</div>
    </div>
  );

  const Sidebar = ({ active }) => (
    <div className="h-full flex flex-col" style={{ width: '260px', backgroundColor: colors.sidebar }}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}><Building2 size={24} color="white" /></div>
        <div><h1 className="text-white font-bold text-xl">RentFix</h1><p className="text-slate-400 text-xs">Agent Console</p></div>
      </div>
      <nav className="flex-1 px-4 py-2 overflow-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Main</p>
        {[{ id: 'overview', icon: Home, label: 'Overview' },{ id: 'triage', icon: LayoutDashboard, label: 'Triage Queue', badge: 12 },{ id: 'assignments', icon: ListChecks, label: 'Assignments' },{ id: 'properties', icon: Building2, label: 'Properties' }].map(item => (
          <button key={item.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all" style={{ backgroundColor: active === item.id ? colors.primary + '20' : 'transparent', color: active === item.id ? colors.primaryLight : '#94A3B8' }}>
            <item.icon size={18} /><span className="font-medium text-sm">{item.label}</span>
            {item.badge && <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: colors.error, color: 'white' }}>{item.badge}</span>}
          </button>
        ))}
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3 mt-6">Management</p>
        {[{ id: 'tenants', icon: Users, label: 'Tenants' },{ id: 'contractors', icon: Wrench, label: 'Contractors' },{ id: 'evidence', icon: Image, label: 'Evidence Vault' }].map(item => (
          <button key={item.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all" style={{ backgroundColor: active === item.id ? colors.primary + '20' : 'transparent', color: active === item.id ? colors.primaryLight : '#94A3B8' }}><item.icon size={18} /><span className="font-medium text-sm">{item.label}</span></button>
        ))}
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3 mt-6">Insights</p>
        {[{ id: 'analytics', icon: BarChart3, label: 'Analytics' },{ id: 'ai-insights', icon: Sparkles, label: 'AI Insights', isNew: true },{ id: 'reports', icon: FileText, label: 'Reports' }].map(item => (
          <button key={item.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all" style={{ backgroundColor: active === item.id ? colors.primary + '20' : 'transparent', color: active === item.id ? colors.primaryLight : '#94A3B8' }}>
            <item.icon size={18} /><span className="font-medium text-sm">{item.label}</span>
            {item.isNew && <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: colors.accent, color: colors.secondary }}>NEW</span>}
          </button>
        ))}
      </nav>
      <div className="mx-4 mb-4 p-4 rounded-xl" style={{ backgroundColor: colors.primary + '15' }}>
        <div className="flex items-center gap-2 mb-2"><Sparkles size={16} style={{ color: colors.primaryLight }} /><span className="text-sm font-semibold" style={{ color: colors.primaryLight }}>AI Assist Active</span></div>
        <p className="text-xs text-slate-400">LLM triage recommendations refresh every 15 min</p>
      </div>
      <div className="p-4 border-t border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.primary }}>JW</div>
        <div className="flex-1"><p className="text-white text-sm font-semibold">James Wilson</p><p className="text-slate-500 text-xs">Property Manager</p></div>
        <button className="p-2 rounded-lg hover:bg-slate-700"><Settings size={16} className="text-slate-400" /></button>
      </div>
    </div>
  );

  const TopBar = ({ title, subtitle }) => (
    <div className="h-16 px-6 flex items-center justify-between border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <div><h1 className="text-xl font-bold" style={{ color: colors.text }}>{title}</h1>{subtitle && <p className="text-sm" style={{ color: colors.textMuted }}>{subtitle}</p>}</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.surfaceDark }}><Search size={16} style={{ color: colors.textMuted }} /><input placeholder="Search anything..." className="bg-transparent outline-none text-sm w-56" style={{ color: colors.text }} /><span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.border, color: colors.textMuted }}>⌘K</span></div>
        <button className="relative p-2.5 rounded-xl border" style={{ borderColor: colors.border }}><Bell size={20} style={{ color: colors.textMuted }} /><div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.error }}></div></button>
        <button className="p-2.5 rounded-xl border" style={{ borderColor: colors.border }}><HelpCircle size={20} style={{ color: colors.textMuted }} /></button>
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="h-full flex" style={{ backgroundColor: colors.surfaceDark }}>
      <div className="w-1/2 p-16 flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${colors.sidebar} 0%, ${colors.secondary} 100%)` }}>
        <div>
          <div className="flex items-center gap-4 mb-20"><div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}><Building2 size={32} color="white" /></div><div><h1 className="text-white font-bold text-3xl">RentFix</h1><p className="text-slate-400">Agent Console</p></div></div>
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">Property Management,<br />Simplified.</h2>
          <p className="text-slate-400 text-xl leading-relaxed max-w-lg">AI-powered triage, real-time tracking, and seamless contractor coordination—all in one powerful platform.</p>
        </div>
        <div className="flex items-center gap-12">{[{ v: '2.4M+', l: 'Tickets Resolved' }, { v: '98.5%', l: 'SLA Compliance' }, { v: '4.9/5', l: 'Agent Rating' }].map((s, i) => (<div key={i}><p className="text-3xl font-bold text-white">{s.v}</p><p className="text-slate-500">{s.l}</p></div>))}</div>
      </div>
      <div className="w-1/2 flex items-center justify-center p-16">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>Welcome back</h2>
          <p className="mb-10 text-lg" style={{ color: colors.textMuted }}>Sign in to your agent account</p>
          <div className="space-y-5">
            <div><label className="text-sm font-semibold mb-2 block" style={{ color: colors.text }}>Email</label><div className="flex items-center px-4 py-4 rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.surface }}><Mail size={20} style={{ color: colors.textMuted }} /><input placeholder="agent@rentfix.io" className="flex-1 ml-3 bg-transparent outline-none text-base" style={{ color: colors.text }} /></div></div>
            <div><label className="text-sm font-semibold mb-2 block" style={{ color: colors.text }}>Password</label><div className="flex items-center px-4 py-4 rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.surface }}><Key size={20} style={{ color: colors.textMuted }} /><input type="password" placeholder="••••••••" className="flex-1 ml-3 bg-transparent outline-none text-base" style={{ color: colors.text }} /><Eye size={20} style={{ color: colors.textMuted }} /></div></div>
            <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}><div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: colors.primary, backgroundColor: colors.primary }}><CheckCircle size={14} color="white" /></div>Remember me</label><button className="text-sm font-semibold" style={{ color: colors.primary }}>Forgot password?</button></div>
            <button className="w-full py-4 rounded-xl font-semibold text-white text-lg mt-6" style={{ backgroundColor: colors.primary }}>Sign In</button>
            <div className="flex items-center gap-4 my-8"><div className="flex-1 h-px" style={{ backgroundColor: colors.border }}></div><span className="text-sm" style={{ color: colors.textMuted }}>or continue with</span><div className="flex-1 h-px" style={{ backgroundColor: colors.border }}></div></div>
            <div className="flex gap-4">{['Google', 'Microsoft', 'SSO'].map(p => (<button key={p} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: colors.border, color: colors.text }}>{p}</button>))}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const OverviewScreen = () => (
    <div className="h-full flex">
      <Sidebar active="overview" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Overview" subtitle="Welcome back, James" />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[{ label: 'Open Tickets', value: '47', change: '+12%', trend: 'up', icon: FileText, color: colors.primary },{ label: 'Emergency', value: '3', change: '-2', trend: 'down', icon: AlertTriangle, color: colors.error },{ label: 'Scheduled Today', value: '18', change: '+5', trend: 'up', icon: Calendar, color: colors.success },{ label: 'Avg Response', value: '18m', change: '-3m', trend: 'down', icon: Clock, color: colors.accent }].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center justify-between mb-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}><stat.icon size={20} style={{ color: stat.color }} /></div><div className={`flex items-center gap-1 text-sm font-semibold ${stat.label === 'Emergency' ? (stat.trend === 'down' ? 'text-green-500' : 'text-red-500') : 'text-green-500'}`}>{stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{stat.change}</div></div>
                <p className="text-3xl font-bold mb-1" style={{ color: colors.text }}>{stat.value}</p><p className="text-sm" style={{ color: colors.textMuted }}>{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: colors.border }}><h3 className="font-bold text-lg" style={{ color: colors.text }}>Portfolio Health</h3><button className="px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2" style={{ borderColor: colors.border, color: colors.textMuted }}><Download size={16} /> Export CSV</button></div>
              <div className="p-5">
                <table className="w-full"><thead><tr style={{ color: colors.textMuted }}><th className="text-left py-3 text-sm font-semibold">Property</th><th className="text-left py-3 text-sm font-semibold">Open Tickets</th><th className="text-left py-3 text-sm font-semibold">Occupancy</th><th className="text-left py-3 text-sm font-semibold">Health Score</th></tr></thead>
                <tbody>{[{ name: 'Maple Apartments', tickets: 4, occ: '98%', score: 92 },{ name: 'Cedar Townhomes', tickets: 2, occ: '100%', score: 87 },{ name: 'Harbor Residences', tickets: 1, occ: '95%', score: 80 },{ name: 'Oak Villa Complex', tickets: 6, occ: '92%', score: 75 }].map((p, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: colors.border }}><td className="py-4 font-semibold" style={{ color: colors.text }}>{p.name}</td><td className="py-4" style={{ color: colors.textMuted }}>{p.tickets}</td><td className="py-4" style={{ color: colors.textMuted }}>{p.occ}</td><td className="py-4"><div className="flex items-center gap-3"><div className="w-28 h-2.5 rounded-full" style={{ backgroundColor: colors.border }}><div className="h-full rounded-full" style={{ width: `${p.score}%`, backgroundColor: p.score > 85 ? colors.success : p.score > 70 ? colors.accent : colors.error }}></div></div><span className="font-semibold" style={{ color: colors.text }}>{p.score}%</span></div></td></tr>
                ))}</tbody></table>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <h3 className="font-bold mb-4" style={{ color: colors.text }}>Quick Actions</h3>
                <div className="space-y-3">{[{ icon: Plus, label: 'Create Ticket', color: colors.primary },{ icon: Users, label: 'Add Contractor', color: colors.success },{ icon: FileText, label: 'Generate Report', color: colors.accent }].map((a, i) => (<button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: colors.border }}><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + '15' }}><a.icon size={18} style={{ color: a.color }} /></div><span className="font-semibold" style={{ color: colors.text }}>{a.label}</span></button>))}</div>
              </div>
              <div className="rounded-2xl p-5" style={{ backgroundColor: colors.error + '08', border: `1px solid ${colors.error}30` }}>
                <div className="flex items-center gap-2 mb-4"><AlertTriangle size={18} style={{ color: colors.error }} /><h3 className="font-bold" style={{ color: colors.error }}>Urgent Alerts</h3></div>
                <div className="space-y-3">{[{ text: 'Gas leak reported - Unit 4B Maple', time: '5m ago' },{ text: 'SLA breach in 30min - Ticket #1847', time: '12m ago' }].map((a, i) => (<div key={i} className="flex items-start gap-3"><div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.error }}></div><div><p className="text-sm font-semibold" style={{ color: colors.text }}>{a.text}</p><p className="text-xs" style={{ color: colors.textMuted }}>{a.time}</p></div></div>))}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TriageScreen = () => (
    <div className="h-full flex">
      <Sidebar active="triage" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Triage Queue" subtitle="12 tickets awaiting review" />
        <div className="flex-1 overflow-hidden flex">
          <div className="w-[420px] border-r overflow-auto" style={{ borderColor: colors.border }}>
            <div className="p-4 border-b sticky top-0 z-10" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex gap-2 mb-3"><div className="flex-1 flex items-center px-3 py-2.5 rounded-xl border" style={{ borderColor: colors.border }}><Search size={16} style={{ color: colors.textMuted }} /><input placeholder="Search tickets..." className="flex-1 ml-2 bg-transparent outline-none text-sm" /></div><button className="p-2.5 rounded-xl border" style={{ borderColor: colors.border }}><Filter size={16} style={{ color: colors.textMuted }} /></button></div>
              <div className="flex gap-2">{['All', 'Emergency', 'Urgent', 'Routine'].map((f, i) => (<button key={f} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: i === 0 ? colors.primary : 'transparent', color: i === 0 ? 'white' : colors.textMuted, border: i === 0 ? 'none' : `1px solid ${colors.border}` }}>{f}</button>))}</div>
            </div>
            <div className="p-3">
              {[{ id: 't-1001', title: 'Water leak under kitchen sink', property: 'Maple Apartments', unit: '3B', urgency: 'urgent', time: '15m', ai: 86 },{ id: 't-1002', title: 'Gas smell in hallway', property: 'Cedar Townhomes', unit: '1A', urgency: 'emergency', time: '3m', ai: 94 },{ id: 't-1003', title: 'Broken window latch', property: 'Harbor Residences', unit: '12A', urgency: 'routine', time: '1h', ai: 74 },{ id: 't-1004', title: 'AC not cooling properly', property: 'Oak Villa', unit: '5C', urgency: 'urgent', time: '45m', ai: 82 }].map((ticket, i) => (
                <div key={ticket.id} className={`p-4 rounded-xl mb-2 cursor-pointer transition-all ${selectedTicket === i ? 'ring-2' : ''}`} style={{ backgroundColor: selectedTicket === i ? colors.primary + '08' : colors.surface, border: `1px solid ${selectedTicket === i ? colors.primary : colors.border}`, ringColor: colors.primary }} onClick={() => setSelectedTicket(i)}>
                  <div className="flex items-start justify-between mb-2"><span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: ticket.urgency === 'emergency' ? colors.emergency + '15' : ticket.urgency === 'urgent' ? colors.urgent + '15' : colors.routine + '15', color: ticket.urgency === 'emergency' ? colors.emergency : ticket.urgency === 'urgent' ? colors.urgent : colors.routine }}>{ticket.urgency.toUpperCase()}</span><span className="text-xs" style={{ color: colors.textMuted }}>{ticket.time}</span></div>
                  <h4 className="font-semibold mb-1" style={{ color: colors.text }}>{ticket.title}</h4><p className="text-sm" style={{ color: colors.textMuted }}>{ticket.property} • Unit {ticket.unit}</p>
                  <div className="flex items-center gap-2 mt-3"><Sparkles size={14} style={{ color: colors.success }} /><span className="text-xs font-semibold" style={{ color: colors.success }}>AI Confidence {ticket.ai}%</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="p-6 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-start justify-between">
                  <div><div className="flex items-center gap-3 mb-3"><span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: colors.urgent + '15', color: colors.urgent }}>URGENT</span><span className="text-sm" style={{ color: colors.textMuted }}>#t-1001</span></div><h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Water leak under kitchen sink</h2><p style={{ color: colors.textMuted }}>Maple Apartments • Unit 3B • Sarah Brown</p></div>
                  <div className="flex items-center gap-2"><span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: colors.success + '15', color: colors.success }}>triaged</span><span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>AI 86%</span></div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div><h4 className="font-semibold mb-2" style={{ color: colors.text }}>Description</h4><p style={{ color: colors.textMuted }}>Tenant reported steady leak from pipes under kitchen sink. Cabinet base appears warped from water damage. Issue started 2 days ago.</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceDark }}><div className="flex items-center gap-2 mb-2"><Sparkles size={16} style={{ color: colors.primary }} /><span className="text-sm font-bold" style={{ color: colors.primary }}>AI Recommendation</span></div><p className="text-sm" style={{ color: colors.textMuted }}>Landlord responsibility. Assign plumber within 4 hours.</p></div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceDark }}><div className="flex items-center gap-2 mb-2"><Clock size={16} style={{ color: colors.warning }} /><span className="text-sm font-bold" style={{ color: colors.warning }}>SLA Timer</span></div><p className="text-sm" style={{ color: colors.textMuted }}>45 minutes remaining for dispatch</p></div>
                  </div>
                  <div><h4 className="font-semibold mb-3" style={{ color: colors.text }}>Evidence Photos</h4><div className="flex gap-3">{[1, 2, 3].map(i => (<div key={i} className="w-24 h-24 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.surfaceDark }}><Image size={28} style={{ color: colors.textMuted }} /></div>))}</div></div>
                </div>
                <div className="space-y-5">
                  <div><h4 className="font-semibold mb-3" style={{ color: colors.text }}>Recommended Contractor</h4><div className="p-4 rounded-xl" style={{ border: `2px solid ${colors.success}`, backgroundColor: colors.success + '05' }}><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.success }}>AF</div><div className="flex-1"><p className="font-bold" style={{ color: colors.text }}>AquaFix Plumbing</p><div className="flex items-center gap-2"><Star size={14} fill={colors.accent} style={{ color: colors.accent }} /><span className="text-sm" style={{ color: colors.textMuted }}>4.8/5 • 127 jobs</span></div></div><span className="text-sm font-bold" style={{ color: colors.success }}>Available Now</span></div></div></div>
                  <div><h4 className="font-semibold mb-3" style={{ color: colors.text }}>Contact Tenant</h4><div className="flex gap-3"><button className="flex-1 py-3 rounded-xl border font-semibold flex items-center justify-center gap-2" style={{ borderColor: colors.border }}><Phone size={16} /> Call</button><button className="flex-1 py-3 rounded-xl border font-semibold flex items-center justify-center gap-2" style={{ borderColor: colors.border }}><MessageSquare size={16} /> Message</button></div></div>
                </div>
              </div>
              <div className="p-6 border-t flex items-center gap-3" style={{ borderColor: colors.border }}>
                <button className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: colors.primary }}>Assign Contractor</button>
                <button className="px-6 py-3 rounded-xl font-semibold border" style={{ borderColor: colors.border, color: colors.text }}>Override AI</button>
                <button className="px-6 py-3 rounded-xl font-semibold border" style={{ borderColor: colors.border, color: colors.text }}>Request More Info</button>
                <button className="ml-auto px-6 py-3 rounded-xl font-semibold" style={{ color: colors.error }}>Escalate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PropertiesScreen = () => (
    <div className="h-full flex">
      <Sidebar active="properties" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Properties" subtitle="28 properties managed" />
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-3"><div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ borderColor: colors.border }}><Search size={16} style={{ color: colors.textMuted }} /><input placeholder="Search properties..." className="bg-transparent outline-none text-sm w-52" /></div></div>
              <button className="px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2" style={{ backgroundColor: colors.primary }}><Plus size={18} /> Add Property</button>
            </div>
            <div className="grid grid-cols-3 gap-5 p-5">
              {[{ name: 'Maple Apartments', address: '123 Maple Street', units: 24, occupied: 23, tickets: 4, score: 92 },{ name: 'Cedar Townhomes', address: '41 Cedar Lane', units: 12, occupied: 12, tickets: 2, score: 87 },{ name: 'Harbor Residences', address: '88 Bay Ave', units: 36, occupied: 34, tickets: 1, score: 80 },{ name: 'Oak Villa Complex', address: '55 Oak Drive', units: 18, occupied: 16, tickets: 6, score: 75 },{ name: 'Pine Grove Estates', address: '200 Pine Road', units: 8, occupied: 8, tickets: 0, score: 98 },{ name: 'Willow Creek Apts', address: '77 Willow Way', units: 30, occupied: 28, tickets: 3, score: 85 }].map((p, i) => (
                <div key={i} className="rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer" style={{ borderColor: colors.border }}>
                  <div className="flex items-start justify-between mb-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}><Building2 size={24} style={{ color: colors.primary }} /></div><span className="text-sm font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: p.score > 85 ? colors.success + '15' : p.score > 70 ? colors.accent + '15' : colors.error + '15', color: p.score > 85 ? colors.success : p.score > 70 ? colors.accent : colors.error }}>{p.score}%</span></div>
                  <h4 className="font-bold text-lg mb-1" style={{ color: colors.text }}>{p.name}</h4><p className="text-sm mb-4" style={{ color: colors.textMuted }}>{p.address}</p>
                  <div className="flex items-center gap-5 text-sm"><span style={{ color: colors.textMuted }}><strong style={{ color: colors.text }}>{p.occupied}/{p.units}</strong> units</span><span style={{ color: colors.textMuted }}><strong style={{ color: p.tickets > 3 ? colors.error : colors.text }}>{p.tickets}</strong> tickets</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AnalyticsScreen = () => (
    <div className="h-full flex">
      <Sidebar active="analytics" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Analytics" subtitle="Performance metrics and insights" />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[{ label: 'Avg Response Time', value: '18m', context: 'p95 last 7 days', status: 'success' },{ label: 'First Time Fix', value: '82%', context: 'FTF rate', status: 'muted' },{ label: 'Tenant CSAT', value: '4.6/5', context: 'surveys', status: 'success' },{ label: 'Reopen Rate', value: '6%', context: '30 days', status: 'warning' }].map((m, i) => (
              <div key={i} className="p-5 rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold" style={{ color: colors.textMuted }}>{m.label}</span><span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: m.status === 'success' ? colors.success + '15' : m.status === 'warning' ? colors.warning + '15' : colors.surfaceDark, color: m.status === 'success' ? colors.success : m.status === 'warning' ? colors.warning : colors.textMuted }}>{m.context}</span></div>
                <p className="text-3xl font-bold" style={{ color: colors.text }}>{m.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <h3 className="font-bold text-lg mb-5" style={{ color: colors.text }}>Tickets by Category</h3>
              <div className="space-y-4">{[{ cat: 'Plumbing', pct: 35, color: colors.primary },{ cat: 'Electrical', pct: 25, color: colors.accent },{ cat: 'HVAC', pct: 20, color: colors.success },{ cat: 'General', pct: 15, color: colors.warning },{ cat: 'Other', pct: 5, color: colors.textMuted }].map((c, i) => (<div key={i}><div className="flex justify-between mb-1"><span className="font-semibold text-sm" style={{ color: colors.text }}>{c.cat}</span><span className="text-sm font-bold" style={{ color: c.color }}>{c.pct}%</span></div><div className="h-2.5 rounded-full" style={{ backgroundColor: colors.surfaceDark }}><div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }}></div></div></div>))}</div>
            </div>
            <div className="rounded-2xl border p-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <h3 className="font-bold text-lg mb-5" style={{ color: colors.text }}>SLA Performance</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">{[{ label: 'On Time', value: '94%', color: colors.success },{ label: 'Near Miss', value: '4%', color: colors.warning },{ label: 'Breached', value: '2%', color: colors.error }].map((s, i) => (<div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: s.color + '10' }}><p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p><p className="text-sm" style={{ color: colors.textMuted }}>{s.label}</p></div>))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="h-full flex">
      <Sidebar active="settings" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Settings" subtitle="Manage your preferences" />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {[{ title: 'Profile', items: [{ l: 'Full Name', v: 'James Wilson', type: 'text' },{ l: 'Email', v: 'james@rentfix.io', type: 'text' },{ l: 'Role', v: 'Property Manager', type: 'text' }]},{ title: 'Notifications', items: [{ l: 'Email notifications', v: true, type: 'toggle' },{ l: 'Push notifications', v: true, type: 'toggle' },{ l: 'SMS alerts', v: false, type: 'toggle' }]},{ title: 'Preferences', items: [{ l: 'Dark mode', v: false, type: 'toggle' },{ l: 'Language', v: 'English', type: 'select' }]}].map((section, i) => (
              <div key={i} className="rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="p-5 border-b" style={{ borderColor: colors.border }}><h3 className="font-bold text-lg" style={{ color: colors.text }}>{section.title}</h3></div>
                <div className="divide-y" style={{ borderColor: colors.border }}>{section.items.map((item, j) => (<div key={j} className="p-5 flex items-center justify-between"><span style={{ color: colors.text }}>{item.l}</span>{item.type === 'toggle' ? (<div className="w-12 h-7 rounded-full relative cursor-pointer" style={{ backgroundColor: item.v ? colors.primary : colors.border }}><div className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: item.v ? '26px' : '4px' }}></div></div>) : item.type === 'select' ? (<div className="flex items-center gap-2"><span style={{ color: colors.textMuted }}>{item.v}</span><ChevronRight size={16} style={{ color: colors.textMuted }} /></div>) : (<span className="font-semibold" style={{ color: colors.textMuted }}>{item.v}</span>)}</div>))}</div>
              </div>
            ))}
            <button className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: colors.error + '10', color: colors.error }}><LogOut size={18} /> Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );

  const GenericScreen = ({ title, active }) => (
    <div className="h-full flex">
      <Sidebar active={active} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} subtitle="Coming soon" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center"><div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}><LayoutDashboard size={40} style={{ color: colors.primary }} /></div><h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{title}</h2><p style={{ color: colors.textMuted }}>This screen is part of the complete design system</p></div>
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    const map = { 'login': LoginScreen, 'overview': OverviewScreen, 'triage': TriageScreen, 'properties': PropertiesScreen, 'analytics': AnalyticsScreen, 'settings': SettingsScreen };
    const Screen = map[screens[currentScreen].id];
    if (Screen) return <Screen />;
    return <GenericScreen title={screens[currentScreen].name} active={screens[currentScreen].id} />;
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div><span className="text-sm font-medium text-indigo-400">Elite 9 Team Design</span></div>
        <h1 className="text-4xl font-bold text-white mb-2">RentFix Agent Dashboard</h1>
        <p className="text-slate-400">18 complete screens • Google, NVIDIA, Microsoft, Figma, Adobe, Uber, Folio, Anthropic, OpenAI</p>
      </div>
      <div className="max-w-7xl mx-auto mb-6"><div className="flex flex-wrap justify-center gap-2">{screens.map((screen, i) => (<button key={screen.id} onClick={() => setCurrentScreen(i)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentScreen === i ? 'bg-indigo-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}>{screen.name}</button>))}</div></div>
      <div className="flex justify-center overflow-x-auto pb-4"><div className={`transition-all duration-300 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}><DesktopFrame>{renderScreen()}</DesktopFrame></div></div>
      <div className="flex justify-center items-center gap-8 mt-8">
        <button onClick={() => setCurrentScreen(p => p > 0 ? p - 1 : screens.length - 1)} className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white"><ChevronLeft size={24} /></button>
        <div className="text-center"><p className="text-white font-semibold">{screens[currentScreen].name}</p><p className="text-slate-500 text-sm">{currentScreen + 1} of {screens.length}</p></div>
        <button onClick={() => setCurrentScreen(p => p < screens.length - 1 ? p + 1 : 0)} className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white"><ChevronRight size={24} /></button>
      </div>
      <div className="max-w-4xl mx-auto mt-12 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><LayoutDashboard size={20} className="text-indigo-400" />Agent Dashboard Design System</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div><h3 className="text-indigo-400 font-medium mb-2">Color Palette</h3><ul className="space-y-1 text-slate-400"><li>• Primary: Indigo (#6366F1)</li><li>• Sidebar: Slate 800 (#1E293B)</li><li>• Background: Slate 50 (#F8FAFC)</li><li>• Status: Success/Warning/Error</li></ul></div>
          <div><h3 className="text-indigo-400 font-medium mb-2">Key Features</h3><ul className="space-y-1 text-slate-400"><li>• AI-powered triage recommendations</li><li>• Real-time WebSocket ticket feed</li><li>• Contractor matching algorithm</li><li>• Evidence vault with hash verification</li></ul></div>
        </div>
      </div>
      <div className="text-center mt-8 text-slate-500 text-sm">Next.js + React • TailwindCSS • Based on Rentfix web-agent codebase</div>
    </div>
  );
};

export default AgentDashboardShowcase;
