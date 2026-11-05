'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Layers,
  Users,
  Power,
  RefreshCw,
  Cpu,
  Database,
  Lock,
  DollarSign,
  AlertTriangle,
  Play,
  Pause,
  Server
} from 'lucide-react';
import { ApiClient, SystemHealthResponse } from '@/lib/api';
import { DEPARTMENTS, SPECIALIST_PROFILES, CEO_ORCHESTRATOR } from '@ai-command-center/shared';

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CEO_VISUALIZER' | 'DEPARTMENTS' | 'SPECIALISTS' | 'OWNER_CONTROLS'
  >('OVERVIEW');
  const [killSwitchReason, setKillSwitchReason] = useState('');
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState(false);

  // Load Real Operational Health from Backend
  const refreshHealth = async () => {
    setLoading(true);
    const data = await ApiClient.getHealth();
    setHealth(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleToggleKillSwitch = async (activate: boolean) => {
    setIsTogglingKillSwitch(true);
    if (activate) {
      await ApiClient.activateKillSwitch(killSwitchReason || 'Owner Manual Trigger from Dashboard');
    } else {
      await ApiClient.deactivateKillSwitch();
    }
    await refreshHealth();
    setIsTogglingKillSwitch(false);
  };

  return (
    <div className="flex min-h-screen bg-graphite-950 text-graphite-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-graphite-700 bg-graphite-900 flex flex-col">
        <div className="p-5 border-b border-graphite-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-orange-accent animate-pulse" />
            <h1 className="text-base font-semibold tracking-wider text-white uppercase">
              AI COMMAND
            </h1>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-graphite-800 text-orange-accent font-mono border border-graphite-700">
            v1.0
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'bg-orange-subtle text-orange-accent border border-orange-accent/20'
                : 'text-graphite-400 hover:text-white hover:bg-graphite-850'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Master Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('CEO_VISUALIZER')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'CEO_VISUALIZER'
                ? 'bg-orange-subtle text-orange-accent border border-orange-accent/20'
                : 'text-graphite-400 hover:text-white hover:bg-graphite-850'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>CEO Orchestrator</span>
          </button>

          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-orange-subtle text-orange-accent border border-orange-accent/20'
                : 'text-graphite-400 hover:text-white hover:bg-graphite-850'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>7 Departments</span>
          </button>

          <button
            onClick={() => setActiveTab('SPECIALISTS')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'SPECIALISTS'
                ? 'bg-orange-subtle text-orange-accent border border-orange-accent/20'
                : 'text-graphite-400 hover:text-white hover:bg-graphite-850'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>55 Specialists</span>
          </button>

          <button
            onClick={() => setActiveTab('OWNER_CONTROLS')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'OWNER_CONTROLS'
                ? 'bg-orange-subtle text-orange-accent border border-orange-accent/20'
                : 'text-graphite-400 hover:text-white hover:bg-graphite-850'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Owner Control Center</span>
          </button>
        </nav>

        {/* Operational System Guard Status */}
        <div className="p-4 border-t border-graphite-700 bg-graphite-950/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-graphite-400">Zero-Cost Guard:</span>
            <span className="text-emerald-400 font-mono font-medium">ENFORCED ($0.00)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-graphite-400">DB Status:</span>
            <span
              className={`font-mono ${health?.database === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {health?.database || 'CHECKING...'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-graphite-700 bg-graphite-900/90 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-white">
              {activeTab === 'OVERVIEW' && 'Enterprise Dashboard Overview'}
              {activeTab === 'CEO_VISUALIZER' && 'Autonomous CEO Orchestrator State Machine'}
              {activeTab === 'DEPARTMENTS' && 'Organizational Department Registry'}
              {activeTab === 'SPECIALISTS' && 'Specialist Directory (55 Dedicated Roles)'}
              {activeTab === 'OWNER_CONTROLS' && 'Owner Control Center & Kill Switch'}
            </h2>
            {health?.killSwitch.isHalted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                EMERGENCY HALT ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={refreshHealth}
              disabled={loading}
              className="p-2 rounded-lg border border-graphite-700 bg-graphite-850 text-graphite-400 hover:text-white transition-colors"
              title="Refresh operational health"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {health?.killSwitch.isHalted ? (
              <button
                onClick={() => handleToggleKillSwitch(false)}
                disabled={isTogglingKillSwitch}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wider flex items-center space-x-2 shadow-lg transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>RESUME AUTOMATION</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleKillSwitch(true)}
                disabled={isTogglingKillSwitch}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs tracking-wider flex items-center space-x-2 shadow-lg transition-colors"
              >
                <Power className="h-3.5 w-3.5" />
                <span>EMERGENCY KILL SWITCH</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Content Display */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-graphite-700 bg-graphite-850">
                  <div className="text-xs text-graphite-400 uppercase font-semibold mb-1">
                    CEO State
                  </div>
                  <div className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>{health?.killSwitch.isHalted ? 'EMERGENCY_HALTED' : 'IDLE / READY'}</span>
                  </div>
                  <div className="text-xs text-graphite-400 mt-2">14 Autonomous States</div>
                </div>

                <div className="p-5 rounded-xl border border-graphite-700 bg-graphite-850">
                  <div className="text-xs text-graphite-400 uppercase font-semibold mb-1">
                    Organization
                  </div>
                  <div className="text-xl font-bold text-white">7 Departments</div>
                  <div className="text-xs text-graphite-400 mt-2">
                    55 Dedicated Specialist Roles
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-graphite-700 bg-graphite-850">
                  <div className="text-xs text-graphite-400 uppercase font-semibold mb-1">
                    Zero-Cost Policy
                  </div>
                  <div className="text-xl font-bold text-emerald-400">$0.00 Spent</div>
                  <div className="text-xs text-graphite-400 mt-2">
                    Strict Quota Interceptor Active
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-graphite-700 bg-graphite-850">
                  <div className="text-xs text-graphite-400 uppercase font-semibold mb-1">
                    System Health
                  </div>
                  <div className="text-xl font-bold text-white">
                    {health?.status === 'HEALTHY' ? (
                      <span className="text-emerald-400">HEALTHY</span>
                    ) : (
                      <span className="text-red-400">HALTED</span>
                    )}
                  </div>
                  <div className="text-xs text-graphite-400 mt-2">
                    Database: {health?.database || 'DISCONNECTED'}
                  </div>
                </div>
              </div>

              {/* Infrastructure & Queues Status */}
              <div className="p-6 rounded-xl border border-graphite-700 bg-graphite-850">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Server className="h-4 w-4 text-orange-accent" />
                  <span>Command Queues & Background Workers (10 BullMQ Topologies)</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                      className="p-3 rounded-lg border border-graphite-700 bg-graphite-900 flex flex-col"
                    >
                      <span className="text-xs text-graphite-400 truncate">{queue}</span>
                      <span className="text-sm font-mono font-bold text-white mt-1">READY</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CEO_VISUALIZER' && (
            <div className="p-6 rounded-xl border border-graphite-700 bg-graphite-850 space-y-6">
              <div className="flex items-center justify-between border-b border-graphite-700 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    CEO Orchestrator State Visualizer
                  </h3>
                  <p className="text-xs text-graphite-400 mt-1">
                    Continuous feedback cycle: Objective → BI Screening → Department Dispatcher →
                    Specialist → Result
                  </p>
                </div>
                <span className="px-3 py-1 rounded bg-orange-subtle text-orange-accent text-xs font-mono font-medium border border-orange-accent/30">
                  14 States Active
                </span>
              </div>

              {/* 14 State Flow */}
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                {[
                  'IDLE',
                  'OBJECTIVE_RECEIVED',
                  'ANALYZING',
                  'PLANNING',
                  'TASK_DECOMPOSITION',
                  'DEPARTMENT_ASSIGNMENT',
                  'SPECIALIST_ASSIGNMENT',
                  'EXECUTION',
                  'RESULT_EVALUATION',
                  'RETRY_OR_REASSIGN',
                  'OWNER_APPROVAL_REQUIRED',
                  'COMPLETED',
                  'FAILED',
                  'EMERGENCY_HALTED'
                ].map((st, i) => (
                  <div
                    key={st}
                    className={`p-3 rounded-lg border text-xs font-mono flex flex-col items-center justify-center text-center ${
                      health?.killSwitch.isHalted && st === 'EMERGENCY_HALTED'
                        ? 'border-red-600 bg-red-950/60 text-red-400 font-bold'
                        : i === 0 && !health?.killSwitch.isHalted
                          ? 'border-orange-accent bg-orange-subtle text-orange-accent font-bold'
                          : 'border-graphite-700 bg-graphite-900 text-graphite-400'
                    }`}
                  >
                    <span>
                      {i + 1}. {st}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'DEPARTMENTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(DEPARTMENTS).map((dept) => (
                <div
                  key={dept.id}
                  className="p-5 rounded-xl border border-graphite-700 bg-graphite-850 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-graphite-800 text-orange-accent border border-graphite-700">
                        {dept.code}
                      </span>
                      <span className="text-xs text-graphite-400 font-mono">
                        {dept.specialistCount} Specialists
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-white">{dept.name}</h4>
                    <p className="text-xs text-graphite-400 mt-2 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'SPECIALISTS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-graphite-700 bg-graphite-850 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  Central Specialist Directory (Exactly 55 Specialist Profiles)
                </span>
                <span className="text-xs text-graphite-400">Separate from 1 CEO Orchestrator</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SPECIALIST_PROFILES.map((spec) => (
                  <div
                    key={spec.id}
                    className="p-4 rounded-xl border border-graphite-700 bg-graphite-900 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-orange-accent font-bold">
                          Role #{spec.roleNumber}
                        </span>
                        <span className="text-xs font-mono text-graphite-400 px-1.5 py-0.5 rounded bg-graphite-800">
                          {spec.departmentId}
                        </span>
                      </div>
                      <h5 className="text-sm font-semibold text-white">{spec.title}</h5>
                      <p className="text-xs text-graphite-400 mt-2 line-clamp-2">
                        {spec.responsibilities.join(', ')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-graphite-700 flex items-center justify-between text-xs">
                      <span className="text-graphite-400">Level: {spec.permissionLevel}</span>
                      {spec.approvalRequired && (
                        <span className="text-amber-400 font-medium">Requires Approval</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'OWNER_CONTROLS' && (
            <div className="p-6 rounded-xl border border-graphite-700 bg-graphite-850 space-y-6">
              <div className="flex items-center space-x-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold">Owner Emergency Control Center</h3>
              </div>

              <div className="p-5 rounded-lg border border-red-900/50 bg-red-950/20 space-y-4">
                <p className="text-xs text-red-300">
                  Activating the Emergency Kill Switch triggers an immediate distributed halt across
                  all worker nodes, pauses BullMQ queues, stops autonomous task assignment, and
                  records a cryptographically signed audit event.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-graphite-400">
                    Reason for Shutdown / Audit Log Note:
                  </label>
                  <input
                    type="text"
                    value={killSwitchReason}
                    onChange={(e) => setKillSwitchReason(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance or Anomaly Investigation"
                    className="w-full px-3 py-2 rounded-lg border border-graphite-700 bg-graphite-900 text-sm text-white focus:outline-none focus:border-orange-accent"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleKillSwitch(true)}
                    disabled={isTogglingKillSwitch}
                    className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs tracking-wider transition-colors shadow-lg"
                  >
                    TRIGGER EMERGENCY KILL SWITCH
                  </button>

                  <button
                    onClick={() => handleToggleKillSwitch(false)}
                    disabled={isTogglingKillSwitch}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wider transition-colors"
                  >
                    RESUME NORMAL OPERATIONS
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-graphite-700 bg-graphite-900">
                  <h4 className="text-xs font-semibold text-white uppercase mb-2">
                    Kill-Switch State Details
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div>State: {health?.killSwitch.isHalted ? 'HALTED' : 'OPERATIONAL'}</div>
                    <div>Version: v{health?.killSwitch.version || 1}</div>
                    <div>Responsible: {health?.killSwitch.haltedBy || 'NONE'}</div>
                    <div>Reason: {health?.killSwitch.reason || 'N/A'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-graphite-700 bg-graphite-900">
                  <h4 className="text-xs font-semibold text-white uppercase mb-2">
                    WhatsApp Notification Bridge
                  </h4>
                  <p className="text-xs text-graphite-400 mb-2">
                    Emergency alerts and sensitive approvals dispatch directly to the verified owner
                    contact without third-party fees.
                  </p>
                  <div className="text-xs font-mono text-emerald-400">
                    Configured via Backend Environment
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
