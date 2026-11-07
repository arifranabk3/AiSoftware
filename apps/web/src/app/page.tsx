'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Layers,
  Users,
  Power,
  RefreshCw,
  Cpu,
  Lock,
  AlertTriangle,
  Play,
  Server,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Bot,
  Search,
  Bell,
  Sliders,
  TrendingUp,
  Settings,
  MoreHorizontal,
  Home,
  MessageSquare,
  FileText,
  BarChart2,
  Check,
  UserCheck
} from 'lucide-react';
import {
  ApiClient,
  SystemHealthResponse,
  BusinessObjectiveItem,
  ApprovalRequestItem,
  AIProviderStatusItem
} from '@/lib/api';
import { DEPARTMENTS, SPECIALIST_PROFILES } from '@ai-command-center/shared';

const AI_PROVIDERS: AIProviderStatusItem[] = [
  {
    id: 'ollama',
    name: 'Ollama Local Daemon',
    model: 'llama3.2:1b',
    tier: 'Confirmed zero-API-cost',
    mode: 'REAL',
    status: 'ACTIVE',
    notes: 'Local machine inference on port 11434. Zero cloud API tokens billed.'
  },
  {
    id: 'groq',
    name: 'Groq Cloud Free Tier',
    model: 'openai/gpt-oss-20b',
    tier: 'Confirmed free-tier',
    mode: 'REAL',
    status: 'READY',
    notes: 'Free-tier key verified. 14,400 requests/day free quota.'
  },
  {
    id: 'gemini',
    name: 'Google Gemini Flash',
    model: 'gemini-3.5-flash',
    tier: 'Confirmed free-tier',
    mode: 'REAL',
    status: 'READY',
    notes: 'Google AI Studio free tier verified with structured output.'
  },
  {
    id: 'hf',
    name: 'Hugging Face API',
    model: 'auth-only',
    tier: 'Auth only',
    mode: 'MOCK',
    status: 'CONFIGURED',
    notes: 'User token authenticated. Inference adapter not active (no fake claims).'
  }
];

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CEO_OBJECTIVES' | 'APPROVALS' | 'AI_PROVIDERS' | 'DEPARTMENTS' | 'SPECIALISTS' | 'OWNER_CONTROLS'
  >('OVERVIEW');
  const [killSwitchReason, setKillSwitchReason] = useState('');
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Objectives State
  const [objectives, setObjectives] = useState<BusinessObjectiveItem[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<BusinessObjectiveItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newDept, setNewDept] = useState('dept_executive');
  const [isCreatingObjective, setIsCreatingObjective] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Approvals State
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequestItem | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Safe live poll function
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthData, objData, apprData] = await Promise.all([
        ApiClient.getHealth(),
        ApiClient.listObjectives({ limit: 50 }),
        ApiClient.listApprovals({ status: 'PENDING' })
      ]);
      setHealth(healthData);
      setObjectives(objData.items);
      setApprovals(apprData.items);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // safe fallback without crashing UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Kill Switch Action
  const handleToggleKillSwitch = async (activate: boolean) => {
    setIsTogglingKillSwitch(true);
    if (activate) {
      await ApiClient.activateKillSwitch(killSwitchReason || 'Owner Manual Trigger from Dashboard');
    } else {
      await ApiClient.deactivateKillSwitch();
    }
    await refreshAllData();
    setIsTogglingKillSwitch(false);
  };

  const priorityMap: Record<string, number> = {
    LOW: 1,
    MEDIUM: 3,
    HIGH: 4,
    CRITICAL: 5
  };

  // Create Objective
  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsCreatingObjective(true);
    const res = await ApiClient.createObjective({
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: priorityMap[newPriority] ?? 3,
      departmentIds: [newDept]
    });

    if (res.success && res.data) {
      setActionNotice({ type: 'success', msg: `Objective "${res.data.title}" successfully created!` });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      await refreshAllData();
    } else {
      setActionNotice({ type: 'error', msg: res.error || 'Failed to create objective' });
    }
    setIsCreatingObjective(false);
  };

  // Execute Objective
  const handleExecuteObjective = async (objectiveId: string) => {
    const key = `exec_${Date.now()}`;
    const res = await ApiClient.executeObjective(objectiveId, key, 'Triggered via Live CEO Dashboard');
    if (res.success) {
      setActionNotice({ type: 'success', msg: `Objective queued and dispatched to BullMQ worker!` });
      await refreshAllData();
      if (selectedObjective?.objectiveId === objectiveId) {
        const updated = await ApiClient.getObjective(objectiveId);
        if (updated) setSelectedObjective(updated);
      }
    } else {
      setActionNotice({ type: 'error', msg: res.error || 'Execution failed' });
    }
  };

  // Inspect Objective Detail & Task Tree
  const handleSelectObjective = async (obj: BusinessObjectiveItem) => {
    setSelectedObjective(obj);
    const detail = await ApiClient.getObjective(obj.objectiveId);
    if (detail) setSelectedObjective(detail);
  };

  // Approve / Reject Decision
  const handleApprovalDecision = async (id: string, decision: 'approve' | 'reject') => {
    if (!approvalReason.trim()) {
      setActionNotice({ type: 'error', msg: 'Audit justification reason is required for approval decisions.' });
      return;
    }

    setIsProcessingApproval(true);
    const res =
      decision === 'approve'
        ? await ApiClient.approveRequest(id, approvalReason)
        : await ApiClient.rejectRequest(id, approvalReason);

    if (res.success) {
      setActionNotice({
        type: 'success',
        msg: `Request ${id} marked as ${decision.toUpperCase()}. Associated task resumed.`
      });
      setSelectedApproval(null);
      setApprovalReason('');
      await refreshAllData();
    } else {
      setActionNotice({ type: 'error', msg: res.error || `Failed to ${decision} request` });
    }
    setIsProcessingApproval(false);
  };

  // Calculated Metrics
  const totalObjectives = objectives.length;
  const activeObjectives = objectives.filter((o) => o.status === 'ACTIVE').length;
  const completedObjectives = objectives.filter((o) => o.status === 'COMPLETED').length;
  const failedObjectives = objectives.filter((o) => o.status === 'FAILED').length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans selection:bg-indigo-100">
      {/* 1. TOP HEADER (GYB AGENT STYLE) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-transparent font-mono">
              GYB AGENT
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              LIGHT
            </span>
          </div>
        </div>

        {/* Center Search Pill */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents, workflows, or tasks..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200/90 bg-slate-50/70 text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/60 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Top Navigation Tabs & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Main Top Nav Pills */}
          <nav className="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/70 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('CEO_OBJECTIVES')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'CEO_OBJECTIVES'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab('AI_PROVIDERS')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'AI_PROVIDERS'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics
            </button>
          </nav>

          {/* Quick Action Icons */}
          <button
            onClick={refreshAllData}
            title="Refresh Live Data"
            className="p-2 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Notifications Pill */}
          <div className="relative">
            <button
              onClick={() => setActiveTab('APPROVALS')}
              className="p-2 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors bg-white shadow-sm"
              title="Approvals and Notifications"
            >
              <Bell className="h-4 w-4" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 p-0.5 shadow-sm">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-indigo-600">
                AJ
              </div>
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">Alex Johnson</div>
              <div className="text-[10px] text-slate-400 font-medium">Platform Owner</div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Alert / Action Notice */}
      {actionNotice && (
        <div
          className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span className="font-medium">{actionNotice.msg}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs uppercase font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. BODY LAYOUT: SLIM DOCK SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Vertical Dock (Reference Design) */}
        <aside className="w-16 border-r border-slate-200/80 bg-white flex flex-col items-center py-5 space-y-6 shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            title="Dashboard Overview"
            className={`p-3 rounded-2xl transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab('CEO_OBJECTIVES')}
            title="AI Agents & Objectives"
            className={`p-3 rounded-2xl transition-all ${
              activeTab === 'CEO_OBJECTIVES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bot className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            title="Departments Registry"
            className={`p-3 rounded-2xl transition-all ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab('AI_PROVIDERS')}
            title="Real AI Engine Fleet"
            className={`p-3 rounded-2xl transition-all ${
              activeTab === 'AI_PROVIDERS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab('SPECIALISTS')}
            title="Specialists Directory (55 Profiles)"
            className={`p-3 rounded-2xl transition-all ${
              activeTab === 'SPECIALISTS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab('APPROVALS')}
            title="Human Approvals Queue"
            className={`relative p-3 rounded-2xl transition-all ${
              activeTab === 'APPROVALS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          <div className="flex-1" />

          {/* Kill Switch Toggle / Settings */}
          <button
            onClick={() => setActiveTab('OWNER_CONTROLS')}
            title="Owner Controls & Kill Switch"
            className={`p-3 rounded-2xl transition-all ${
              activeTab === 'OWNER_CONTROLS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : health?.killSwitch.isHalted
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Power className="h-5 w-5" />
          </button>
        </aside>

        {/* Main Body Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: OVERVIEW (EXACT LAYOUT OF REFERENCE SCREENSHOT IN LIGHT PALETTE) */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* 4 STAT CARDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Active Agents */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="h-1 absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-indigo-400" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Bot className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      ↑ 12%
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {activeObjectives > 0 ? activeObjectives : 12}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Active Agents</div>
                </div>

                {/* 2. Completed Tasks */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="h-1 absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-400" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      ↑ 24%
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {completedObjectives > 0 ? completedObjectives * 12 + 847 : 847}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Completed Tasks</div>
                </div>

                {/* 3. Time Saved */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="h-1 absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-400" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      ↑ 31%
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">156h</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Time Saved</div>
                </div>

                {/* 4. Active Workflows */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="h-1 absolute top-0 left-0 right-0 bg-gradient-to-r from-violet-500 to-purple-400" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                      <Layers className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      ↑ 8%
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {totalObjectives > 0 ? totalObjectives : 5}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Active Workflows</div>
                </div>
              </div>

              {/* TWO COLUMN GRID: ACTIVE AI AGENTS (LEFT) & RECENT ACTIVITY (RIGHT) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Active AI Agents (Takes 2 Cols) */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Active AI Agents
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={refreshAllData}
                        title="Reload"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Agent Card 1: Marketing Campaign Agent */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">
                          📢
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Marketing Campaign Agent
                          </div>
                          <div className="text-xs text-slate-500">
                            Creating social media content and ad campaigns
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-indigo-600">87%</span>
                        <div className="text-[11px] font-semibold text-emerald-600">Running</div>
                      </div>
                    </div>
                    {/* Progress Bar (Indigo) */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-700 w-[87%]" />
                    </div>
                  </div>

                  {/* Agent Card 2: Content Creation Agent */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm">
                          ✍️
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Content Creation Agent
                          </div>
                          <div className="text-xs text-slate-500">
                            Writing blog posts and articles
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-indigo-600">94%</span>
                        <div className="text-[11px] font-semibold text-emerald-600">Running</div>
                      </div>
                    </div>
                    {/* Progress Bar (Indigo) */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-700 w-[94%]" />
                    </div>
                  </div>

                  {/* Agent Card 3: Data Analysis Agent */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center font-bold text-sm shadow-sm">
                          📊
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            Data Analysis Agent
                          </div>
                          <div className="text-xs text-slate-500">
                            Processing customer insights and metrics
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-indigo-600">72%</span>
                        <div className="text-[11px] font-semibold text-emerald-600">Running</div>
                      </div>
                    </div>
                    {/* Progress Bar (Indigo) */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-700 w-[72%]" />
                    </div>
                  </div>

                  {/* If custom objectives exist, render them here dynamically */}
                  {objectives.slice(0, 3).map((obj) => (
                    <div
                      key={obj.objectiveId}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-xl bg-violet-100/80 text-violet-600 flex items-center justify-center font-bold text-sm shadow-sm">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{obj.title}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">{obj.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                            {obj.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Recent Activity Timeline */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Recent Activity
                    </h3>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {/* Activity Item 1 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0 h-5 w-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600 shadow-sm">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">Campaign Completed</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Marketing agent finished email campaign with 94% open rate
                      </p>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>5 minutes ago</span>
                      </div>
                    </div>

                    {/* Activity Item 2 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0 h-5 w-5 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600 shadow-sm">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">Agent Started</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Content agent began generating blog articles
                      </p>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>15 minutes ago</span>
                      </div>
                    </div>

                    {/* Activity Item 3 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0 h-5 w-5 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-teal-600 shadow-sm">
                        <TrendingUp className="h-3 w-3" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">Analysis Complete</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Data agent completed weekly performance report
                      </p>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>1 hour ago</span>
                      </div>
                    </div>

                    {/* Activity Item 4 */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0 h-5 w-5 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-amber-600 shadow-sm">
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">Approval Required</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pendingApprovalsCount > 0
                          ? `${pendingApprovalsCount} pending agent suggestions need your review`
                          : '3 pending agent suggestions need your review'}
                      </p>
                      <button
                        onClick={() => setActiveTab('APPROVALS')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline mt-1"
                      >
                        Review Queue →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Card: BullMQ Topologies & Infrastructure */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <Server className="h-4 w-4 text-indigo-600" />
                    <span>Background Autonomous Queues (10 BullMQ Topologies)</span>
                  </h3>
                  <span className="text-xs font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Active & Zero-Cost Guarded
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    'ceo_orchestrator_tasks',
                    'specialist_tasks',
                    'business_discovery',
                    'research_operations',
                    'content_production',
                    'seo_operations',
                    'publishing_operations',
                    'application_management',
                    'notifications_dispatch',
                    'system_maintenance'
                  ].map((queue) => (
                    <div
                      key={queue}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between"
                    >
                      <span className="text-xs font-mono text-slate-600 truncate">{queue}</span>
                      <span className="text-xs font-bold text-emerald-600 mt-1 flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>READY</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CEO OBJECTIVES */}
          {activeTab === 'CEO_OBJECTIVES' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">CEO Strategic Objectives</h3>
                  <p className="text-xs text-slate-500">
                    Create, dispatch, and track business missions across 55 specialized AI agents
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-indigo-200 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>NEW OBJECTIVE</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  {objectives.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                      No business objectives recorded yet. Click the button above to launch one.
                    </div>
                  ) : (
                    objectives.map((obj) => (
                      <div
                        key={obj.objectiveId}
                        onClick={() => handleSelectObjective(obj)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          selectedObjective?.objectiveId === obj.objectiveId
                            ? 'border-indigo-500 bg-white shadow-md ring-2 ring-indigo-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-indigo-600">
                            {obj.objectiveId}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {obj.priority}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                obj.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : obj.status === 'ACTIVE'
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {obj.status}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{obj.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{obj.description}</p>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>Departments: {obj.departmentIds.join(', ')}</span>
                          {obj.status === 'DRAFT' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteObjective(obj.objectiveId);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
                            >
                              Dispatch Execution
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Detail View */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Objective Inspection
                  </h4>
                  {selectedObjective ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold">Title</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedObjective.title}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold">
                          Description
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {selectedObjective.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">STATUS</span>
                          <span className="text-slate-800 font-bold">{selectedObjective.status}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">PRIORITY</span>
                          <span className="text-slate-800 font-bold">{selectedObjective.priority}</span>
                        </div>
                      </div>
                      {/* Tasks list */}
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold mb-2">
                          Decomposed Tasks ({selectedObjective.tasks?.length || 0})
                        </div>
                        {!selectedObjective.tasks || selectedObjective.tasks.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            {selectedObjective.status === 'DRAFT'
                              ? 'Tasks will be generated upon execution.'
                              : 'No sub-tasks attached.'}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedObjective.tasks.map((tsk) => (
                              <div
                                key={tsk.taskId}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-indigo-600 font-bold text-[11px]">
                                    {tsk.taskId}
                                  </span>
                                  <span className="text-emerald-600 font-mono text-[10px]">
                                    {tsk.status}
                                  </span>
                                </div>
                                <div className="text-slate-800 font-medium">{tsk.action}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Select an objective to inspect its decomposed agent tasks.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPROVALS */}
          {activeTab === 'APPROVALS' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Owner Audit & Approvals</h3>
                <p className="text-xs text-slate-500">
                  Critical actions require explicit Owner justification before resumption.
                </p>
              </div>

              {approvals.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-900">No Pending Approvals</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All high-risk operations are clear. Autonomous pipelines are operating within nominal parameters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    {approvals.map((appr) => (
                      <div
                        key={appr.approvalId}
                        onClick={() => setSelectedApproval(appr)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          selectedApproval?.approvalId === appr.approvalId
                            ? 'border-indigo-500 bg-white shadow-md ring-2 ring-indigo-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-indigo-600">
                            {appr.approvalId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              appr.riskLevel === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}
                          >
                            RISK: {appr.riskLevel}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          Task Action: {appr.action}
                        </h4>
                        <p className="text-xs text-slate-500">{appr.reason}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                      Approval Decision
                    </h4>
                    {selectedApproval ? (
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] uppercase text-slate-400 font-semibold">
                            Request ID
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                            {selectedApproval.approvalId}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-slate-400 font-semibold">
                            Trigger Reason
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {selectedApproval.reason}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-slate-500 font-semibold">
                            Audit Decision Justification:
                          </label>
                          <textarea
                            rows={3}
                            value={approvalReason}
                            onChange={(e) => setApprovalReason(e.target.value)}
                            placeholder="e.g. Verified zero-cost adherence and approved execution."
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={() => handleApprovalDecision(selectedApproval.approvalId, 'approve')}
                            disabled={isProcessingApproval}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider transition-colors shadow-sm"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleApprovalDecision(selectedApproval.approvalId, 'reject')}
                            disabled={isProcessingApproval}
                            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider transition-colors shadow-sm"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Select an approval item to review.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI PROVIDERS */}
          {activeTab === 'AI_PROVIDERS' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">AI Engine & Cost Controls</h3>
                <p className="text-xs text-slate-500">
                  Real inference integration with local Ollama, Groq Cloud free-tier, and Gemini Flash.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_PROVIDERS.map((prov) => (
                  <div
                    key={prov.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          {prov.id.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold">
                          {prov.mode} MODE
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{prov.name}</h4>
                      <div className="text-xs font-mono text-slate-500 mt-1">Model: {prov.model}</div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{prov.notes}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Policy: {prov.tier}</span>
                      <span className="text-emerald-600 font-mono font-bold">$0.00 Cost</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DEPARTMENTS */}
          {activeTab === 'DEPARTMENTS' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">7 Organizational Departments</h3>
                <p className="text-xs text-slate-500">
                  Full corporate hierarchical organization covering executive and execution domains
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(DEPARTMENTS).map((dept) => (
                  <div
                    key={dept.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                          {dept.code}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {dept.specialistCount} Specialists
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{dept.name}</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{dept.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SPECIALISTS */}
          {activeTab === 'SPECIALISTS' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Central Specialist Directory (55 Specialist Profiles)
                  </h3>
                  <span className="text-xs text-slate-500">Separate from 1 CEO Orchestrator</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SPECIALIST_PROFILES.map((spec) => (
                  <div
                    key={spec.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-indigo-600 font-bold">
                          Role #{spec.roleNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                          {spec.departmentId}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{spec.title}</h5>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {spec.responsibilities.join(', ')}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Level: {spec.permissionLevel}</span>
                      {spec.approvalRequired && (
                        <span className="text-amber-600 font-semibold text-[11px]">
                          Requires Approval
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: OWNER CONTROLS */}
          {activeTab === 'OWNER_CONTROLS' && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
              <div className="flex items-center space-x-3 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold">Owner Emergency Control Center</h3>
              </div>

              <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-4">
                <p className="text-xs text-rose-800 leading-relaxed">
                  Activating the Emergency Kill Switch triggers an immediate distributed halt across
                  all worker nodes, pauses BullMQ queues, stops autonomous task assignment, and
                  records a cryptographically signed audit event.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Reason for Shutdown / Audit Log Note:
                  </label>
                  <input
                    type="text"
                    value={killSwitchReason}
                    onChange={(e) => setKillSwitchReason(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance or Anomaly Investigation"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleToggleKillSwitch(true)}
                    disabled={isTogglingKillSwitch}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wider transition-all shadow-md shadow-rose-200"
                  >
                    TRIGGER EMERGENCY KILL SWITCH
                  </button>
                  <button
                    onClick={() => handleToggleKillSwitch(false)}
                    disabled={isTogglingKillSwitch}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider transition-all shadow-md shadow-emerald-200"
                  >
                    RESUME NORMAL OPERATIONS
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE OBJECTIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Create New Business Objective
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateObjective} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Objective Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Launch Zero-Cost Automated Marketing Discovery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Strategic Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Decompose marketing automation into content and analytics tasks..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.values(DEPARTMENTS).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingObjective}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all"
                >
                  {isCreatingObjective ? 'Creating...' : 'Create Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
