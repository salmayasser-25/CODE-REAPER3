import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Dumbbell,
  Edit3,
  FileCheck,
  FileText,
  Heart,
  Lock,
  MessagesSquare,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Unlock,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { SpaceBackground } from '../components/SpaceBackground.tsx';
import { FlightSurgeonHeader } from '../components/FlightSurgeonHeader.tsx';
import { FlightSurgeonSidebar } from '../components/FlightSurgeonSidebar.tsx';
import { DashboardOverviewPage } from '../components/DashboardOverviewPage.tsx';
import { IndividualAstronautProfile } from '../components/IndividualAstronautProfile.tsx';
import { MedicalAssistantPage } from '../components/MedicalAssistantPage.tsx';
import { MedicalReportsPage } from '../components/MedicalReportsPage.tsx';
import { OngoingHrpResearchWidget } from '../components/OngoingHrpResearchWidget.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  AstronautProfile,
  CrewMemberSummary,
  DoctorNote,
  ExchangedMedicalReport,
  MedicalAlert,
  MedicalConversation,
  MedicalMessage,
  MedicalRestriction,
  SpaceExercise,
  SurgeonOrder,
  SymptomReport,
  TimelineEvent,
  VitalsData,
} from '../types/astronaut.ts';

interface SurgeonDashboardProps {
  defaultTab?: string;
}

const VALID_TABS = new Set([
  'overview',
  'monitoring',
  'alerts',
  'analytics',
  'records',
  'restrictions',
  'reports',
  'communications',
  'assistant',
  'profile',
]);

export const SurgeonDashboard: React.FC<SurgeonDashboardProps> = ({ defaultTab = 'overview' }) => {
  const { tab: routeTab, astronautId: routeAstronautId } = useParams<{ tab?: string; astronautId?: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const currentTab = routeAstronautId
    ? 'profile'
    : routeTab && VALID_TABS.has(routeTab)
    ? routeTab
    : VALID_TABS.has(defaultTab)
    ? defaultTab
    : 'overview';

  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(routeAstronautId || 'ASTRO-74-SJ');
  const [crew, setCrew] = useState<CrewMemberSummary[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AstronautProfile | null>(null);
  const [selectedVitals, setSelectedVitals] = useState<VitalsData | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomReport[]>([]);
  const [allRestrictions, setAllRestrictions] = useState<MedicalRestriction[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<DoctorNote[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineEvent[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SpaceExercise[]>([]);
  const [approvedExerciseIds, setApprovedExerciseIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<SurgeonOrder[]>([]);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [exchangedReports, setExchangedReports] = useState<ExchangedMedicalReport[]>([]);

  // Shared Comms Hub state
  const [conversations, setConversations] = useState<MedicalConversation[]>([]);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, MedicalMessage[]>>({});
  const [activeConvId, setActiveConvId] = useState<string>('conv-astro-salma');
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

  // Forms & feedback state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // New restriction inline form
  const [showNewRestrictionForm, setShowNewRestrictionForm] = useState<boolean>(false);
  const [resName, setResName] = useState<string>('');
  const [resRegion, setResRegion] = useState<string>('Lumbar Spine (L3-L5)');
  const [resDesc, setResDesc] = useState<string>('');
  const [resExercises, setResExercises] = useState<string>('ARED Squat');
  const [resSeverity, setResSeverity] = useState<'High' | 'Moderate' | 'Low'>('Moderate');

  // New doctor note inline form
  const [showNewNoteForm, setShowNewNoteForm] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteCategory, setNoteCategory] = useState<DoctorNote['category']>('Routine Assessment');
  const [noteContent, setNoteContent] = useState<string>('');

  const commsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (routeAstronautId && routeAstronautId !== selectedAstronautId) {
      setSelectedAstronautId(routeAstronautId);
    }
  }, [routeAstronautId, selectedAstronautId]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const fetchAllSurgeonData = useCallback(async (markActiveConvRead = false) => {
    try {
      const [crewRes, dossierRes, resRes, alertsRes, ordersRes, msgRes, reportsRes] = await Promise.all([
        fetch('/api/surgeon/crew'),
        fetch(`/api/surgeon/crew/${encodeURIComponent(selectedAstronautId)}`),
        fetch('/api/restrictions'),
        fetch('/api/surgeon/alerts'),
        fetch('/api/surgeon/orders'),
        fetch('/api/surgeon/messages'),
        fetch('/api/reports/exchanged'),
      ]);

      const [crewJ, dossierJ, resJ, alertsJ, ordersJ, msgJ, reportsJ] = await Promise.all([
        crewRes.json(),
        dossierRes.json(),
        resRes.json(),
        alertsRes.json(),
        ordersRes.json(),
        msgRes.json(),
        reportsRes.json(),
      ]);

      if (crewJ.success && Array.isArray(crewJ.data)) setCrew(crewJ.data);
      if (dossierJ.success && dossierJ.data) {
        const d = dossierJ.data;
        if (d.profile) setSelectedProfile(d.profile);
        if (d.vitals) setSelectedVitals(d.vitals);
        if (Array.isArray(d.symptoms)) setSelectedSymptoms(d.symptoms);
        if (Array.isArray(d.notes)) setSelectedNotes(d.notes);
        if (Array.isArray(d.timeline)) setSelectedTimeline(d.timeline);
        if (Array.isArray(d.exercises)) setSelectedExercises(d.exercises);
        if (Array.isArray(d.approvedExerciseIds)) setApprovedExerciseIds(d.approvedExerciseIds);
      }
      if (resJ.success && Array.isArray(resJ.data)) setAllRestrictions(resJ.data);
      if (alertsJ.success && Array.isArray(alertsJ.data)) setAlerts(alertsJ.data);
      if (ordersJ.success && Array.isArray(ordersJ.data)) setOrders(ordersJ.data);
      if (msgJ.success && msgJ.data) {
        setConversations(msgJ.data.conversations || []);
        setMessagesByConv(msgJ.data.messagesByConversation || {});
      }
      if (reportsJ.success && Array.isArray(reportsJ.data)) setExchangedReports(reportsJ.data);

      if (markActiveConvRead && currentTab === 'communications' && activeConvId) {
        fetch(`/api/surgeon/messages?conversationId=${encodeURIComponent(activeConvId)}&markRead=true`).catch(() => {});
      }
    } catch {
      // Keep last known snapshot on transient network issue
    }
  }, [selectedAstronautId, currentTab, activeConvId]);

  useEffect(() => {
    fetchAllSurgeonData(currentTab === 'communications');
    const interval = setInterval(() => {
      fetchAllSurgeonData(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchAllSurgeonData, currentTab]);

  const activeCommsMessages = messagesByConv[activeConvId] || [];
  const activeCommsCount = activeCommsMessages.length;
  const lastCommsMessageId = activeCommsMessages[activeCommsCount - 1]?.id;

  useEffect(() => {
    if (currentTab === 'communications') {
      commsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCommsCount, lastCommsMessageId, activeConvId, currentTab]);

  const handleSelectTab = (tab: string) => {
    if (tab === 'profile') {
      navigate(`/surgeon/profile/${encodeURIComponent(selectedAstronautId)}`);
      return;
    }
    navigate(`/surgeon/${tab}`);
  };

  const handleSelectAstronaut = (astronautId: string) => {
    setSelectedAstronautId(astronautId);
    navigate(`/surgeon/profile/${encodeURIComponent(astronautId)}`);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllSurgeonData(currentTab === 'communications');
    setIsRefreshing(false);
    showToast('Mission telemetry synchronized from Ground Core', 'info');
  };

  // ── Alert Actions ──────────────────────────────────────────────────────────
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surgeonName: 'Dr. Marcus Vance, M.D.' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAllSurgeonData();
        showToast('Alert acknowledged by Flight Surgeon', 'success');
      }
    } catch {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAllSurgeonData();
        showToast('Alert resolved and archived', 'info');
      }
    } catch {
      showToast('Failed to clear alert', 'error');
    }
  };

  // ── Restriction & Exercise Approval Orders ─────────────────────────────────
  const handleLiftRestriction = async (restrictionId: string) => {
    try {
      const res = await fetch(`/api/restrictions/${encodeURIComponent(restrictionId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Lifted' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAllSurgeonData();
        showToast('Medical restriction lifted — cleared exercises unlocked for astronaut', 'success');
      }
    } catch {
      showToast('Failed to lift restriction', 'error');
    }
  };

  const handleReactivateRestriction = async (restrictionId: string) => {
    try {
      const res = await fetch(`/api/restrictions/${encodeURIComponent(restrictionId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      });
      if (res.ok) {
        await fetchAllSurgeonData();
        showToast('Medical restriction re-activated', 'info');
      }
    } catch {
      showToast('Failed to update restriction', 'error');
    }
  };

  const handleApproveExercise = async (exercise: SpaceExercise) => {
    try {
      const res = await fetch('/api/surgeon/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronautId: selectedAstronautId,
          type: 'approve_exercise',
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          title: `Exercise Clearance Approved: ${exercise.name}`,
          notes: `Dr. Marcus Vance cleared ${exercise.name} for ${selectedProfile?.name || selectedAstronautId}. Astronaut Space Fitness console unblocked.`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAllSurgeonData();
        showToast(`${exercise.name} approved & unlocked on Astronaut Fitness Console`, 'success');
      } else {
        showToast(json.error || 'Failed to issue clearance order', 'error');
      }
    } catch {
      showToast('Failed to issue exercise clearance', 'error');
    }
  };

  const handleRevokeExerciseApproval = async (exercise: SpaceExercise) => {
    try {
      const res = await fetch('/api/surgeon/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronautId: selectedAstronautId,
          type: 'revoke_exercise',
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          title: `Exercise Clearance Revoked: ${exercise.name}`,
          notes: `Safety lock restored for ${exercise.name}.`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAllSurgeonData();
        showToast(`Clearance revoked for ${exercise.name}`, 'info');
      }
    } catch {
      showToast('Failed to revoke clearance', 'error');
    }
  };

  const handleCreateRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim() || !resDesc.trim()) return;
    try {
      const exList = resExercises
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronautId: selectedAstronautId,
          astronautName: selectedProfile?.name,
          name: resName.trim(),
          description: resDesc.trim(),
          affectedRegion: resRegion.trim() || 'Lumbar Spine (L3-L5)',
          restrictedExercises: exList,
          severity: resSeverity,
          status: 'Active',
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResName('');
        setResDesc('');
        setShowNewRestrictionForm(false);
        await fetchAllSurgeonData();
        showToast('New medical restriction prescribed and synced', 'success');
      }
    } catch {
      showToast('Failed to create restriction', 'error');
    }
  };

  // ── Symptoms & Doctor Notes ────────────────────────────────────────────────
  const handleUpdateSymptomStatus = async (
    symptomId: string,
    newStatus: 'active' | 'monitoring' | 'resolved'
  ) => {
    try {
      const res = await fetch(`/api/symptoms/${encodeURIComponent(symptomId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ astronautId: selectedAstronautId, status: newStatus }),
      });
      if (res.ok) {
        await fetchAllSurgeonData();
        showToast(`Symptom status updated to ${newStatus.toUpperCase()}`, 'success');
      }
    } catch {
      showToast('Failed to update symptom status', 'error');
    }
  };

  const handleAddDoctorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    try {
      const res = await fetch('/api/doctor-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronautId: selectedAstronautId,
          astronautName: selectedProfile?.name,
          category: noteCategory,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          vitalsSnapshot: selectedVitals
            ? {
                hr: selectedVitals.heartRate,
                bp: `${selectedVitals.bloodPressureSys}/${selectedVitals.bloodPressureDia}`,
                spo2: selectedVitals.spO2,
                temp: selectedVitals.temperature,
              }
            : undefined,
        }),
      });
      if (res.ok) {
        setNoteTitle('');
        setNoteContent('');
        setShowNewNoteForm(false);
        await fetchAllSurgeonData();
        showToast('Flight Surgeon clinical note saved', 'success');
      }
    } catch {
      showToast('Failed to save clinical note', 'error');
    }
  };

  // ── Surgeon Comms Reply ────────────────────────────────────────────────────
  const handleSendSurgeonReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = replyText.trim();
    if (!content || isSendingReply) return;
    setIsSendingReply(true);
    setReplyText('');
    try {
      const res = await fetch('/api/surgeon/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          content,
          astronautId: selectedAstronautId,
          messageType: 'clinical_directive',
          priority: 'normal',
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAllSurgeonData(true);
        showToast('Message transmitted to Astronaut Comms Hub', 'success');
      } else {
        showToast(json.error || 'Failed to send reply', 'error');
      }
    } catch {
      showToast('Failed to transmit message', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleEndorseReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/exchanged/${encodeURIComponent(reportId)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'endorsed',
          feedbackNotes: 'Reviewed and endorsed by Dr. Marcus Vance (Lead Flight Surgeon). Bio-telemetry logged.',
        }),
      });
      if (res.ok) {
        await fetchAllSurgeonData();
        showToast('Medical report endorsed by Flight Surgeon', 'success');
      }
    } catch {
      showToast('Failed to endorse report', 'error');
    }
  };

  // Fallback baseline profile while initial fetch completes
  const activeProfile: AstronautProfile = selectedProfile || {
    id: selectedAstronautId,
    name: 'Dr. Salma Johnson',
    callsign: 'Nova',
    age: 21,
    role: 'Mission Specialist / Payload Bio-Engineer',
    missionId: 'EXP-74 / ARTEMIS BIO-LAB',
    healthStatus: 'nominal',
    photoUrl: '/images/astronaut_salma_portrait.jpg',
    totalEvaHours: 28.5,
    bloodType: 'O-Positive (O+)',
    spineElongation: 4.2,
    allergies: ['Penicillin', 'Sulfa-based Antiseptics'],
    conditions: ['Microgravity Spinal Elongation (+4.2 cm observed)'],
    assignedSurgeon: {
      name: 'Dr. Marcus Vance, M.D., FACEP',
      credentialId: 'NASA-FS-9842',
      certificationStatus: 'Active Board Certified Aerospace Medicine (JSC/DOD-ST)',
      callsignOrFreq: 'MCC-Houston / MedCom Alpha (248.500 MHz SAT-Uplink)',
      contactDirective: 'Immediate Secure Telemedicine Patch via TDRS-East Relay',
    },
    heightCm: 168,
    weightKg: 59.2,
    restingHeartRate: 58,
    spO2Baseline: 99,
    radiationDoseMsv: 14.8,
    missionElapsedDays: 84,
    updatedAt: new Date().toISOString(),
  };

  const activeRestrictionsCount = allRestrictions.filter((r) => r.status === 'Active').length;
  const pendingAlertsCount = alerts.filter((a) => !a.isAcknowledged).length;
  const unreadCommsCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div
      className="min-h-screen text-slate-100 relative selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]"
      style={{
        backgroundImage: "url('/assets/aistudio/3d-rendering-dark-earth-space_2c80c4c8.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050810',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundColor: 'rgba(5, 8, 16, 0.42)' }}
      />
      <SpaceBackground />

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <FlightSurgeonHeader
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          profile={activeProfile}
          unreadCount={pendingAlertsCount + unreadCommsCount}
          onLogout={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        />

        <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
          <FlightSurgeonSidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            activeRestrictionsCount={activeRestrictionsCount}
            unreadCommsCount={unreadCommsCount}
            pendingAlertsCount={pendingAlertsCount}
          />

          <main className="flex-1 min-w-0 h-full overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
            {/* Crew Switcher & Sync Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                  ACTIVE DOSSIER:
                </span>
                {(crew.length > 0 ? crew : [{ id: 'ASTRO-74-SJ', name: 'Dr. Salma Johnson', callsign: 'Nova', healthStatus: 'nominal' }]).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedAstronautId(m.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      selectedAstronautId === m.id
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                        : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {m.callsign} ({m.name.split(' ').slice(-1)[0]})
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-[#00E5FF]/50 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00E5FF] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>SYNC TELEMETRY</span>
              </button>
            </div>

            {/* OVERVIEW & MONITORING */}
            {(currentTab === 'overview' || currentTab === 'monitoring') && (
              <DashboardOverviewPage
                crew={crew}
                profile={activeProfile}
                vitals={selectedVitals}
                restrictions={allRestrictions}
                timeline={selectedTimeline}
                alerts={alerts}
                onSelectAstronaut={handleSelectAstronaut}
                onNavigateTab={handleSelectTab}
              />
            )}

            {/* INDIVIDUAL ASTRONAUT DOSSIER */}
            {currentTab === 'profile' && (
              <IndividualAstronautProfile
                profile={activeProfile}
                vitals={selectedVitals}
                symptoms={selectedSymptoms}
                restrictions={allRestrictions.filter((r) => r.astronautId === selectedAstronautId)}
                timeline={selectedTimeline}
                exercises={selectedExercises}
                notes={selectedNotes}
                onBackToCrew={() => handleSelectTab('overview')}
                onOpenRestrictionModal={() => handleSelectTab('restrictions')}
                onOpenNoteModal={() => {
                  setShowNewNoteForm(true);
                  handleSelectTab('records');
                }}
                onUpdateSymptomStatus={handleUpdateSymptomStatus}
                onLiftRestriction={handleLiftRestriction}
                onNavigateTab={handleSelectTab}
              />
            )}

            {/* ALERTS & INCOMING BIO-METRIC PINGS */}
            {currentTab === 'alerts' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="glass-panel rounded-2xl p-6 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      <span>FLIGHT SURGEON ALERTS & BIO-METRIC PINGS</span>
                    </div>
                    <h2 className="text-2xl font-black text-white font-['Chakra_Petch',sans-serif] mt-1">
                      Incoming Crew Alerts & Bio-Telemetry Pings
                    </h2>
                    <p className="text-xs text-slate-300 font-sans mt-1">
                      Live queue of astronaut bio-metric pings, digital twin warnings, and triage escalations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold">
                      {pendingAlertsCount} UNACKNOWLEDGED
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 font-mono text-sm">
                      All orbital medical alert queues are nominal.
                    </div>
                  ) : (
                    alerts.map((alert) => {
                      const isCritical = alert.severity === 'critical';
                      const isWarning = alert.severity === 'warning';
                      return (
                        <div
                          key={alert.id}
                          className={`glass-panel rounded-2xl p-5 border transition-all ${
                            !alert.isAcknowledged
                              ? isCritical
                                ? 'border-rose-500/70 bg-rose-950/20'
                                : isWarning
                                ? 'border-[#FF8C00]/60 bg-[#FF8C00]/10'
                                : 'border-[#00E5FF]/50'
                              : 'border-slate-800 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold uppercase border ${
                                    isCritical
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                      : isWarning
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                      : 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                                  }`}
                                >
                                  {alert.severity}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                  {alert.source === 'ping'
                                    ? 'BIO-METRIC PING'
                                    : alert.source === 'digital_twin'
                                    ? 'DIGITAL TWIN SIM'
                                    : alert.category}
                                </span>
                                <span className="text-slate-400">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </span>
                                {alert.isAcknowledged && (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    ACKED {alert.reviewedBy ? `by ${alert.reviewedBy}` : ''}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-bold text-white font-['Chakra_Petch',sans-serif]">
                                {alert.title}
                              </h3>
                              <p className="text-sm text-slate-200 font-sans leading-relaxed">
                                {alert.description}
                              </p>

                              {alert.telemetrySnapshot && (
                                <div className="flex flex-wrap gap-2 pt-1 text-xs font-mono">
                                  {alert.telemetrySnapshot.heartRate !== undefined && (
                                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[#00E5FF]">
                                      HR: {alert.telemetrySnapshot.heartRate} bpm
                                    </span>
                                  )}
                                  {alert.telemetrySnapshot.bloodPressure && (
                                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white">
                                      BP: {alert.telemetrySnapshot.bloodPressure}
                                    </span>
                                  )}
                                  {alert.telemetrySnapshot.spO2 !== undefined && (
                                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                                      SpO2: {alert.telemetrySnapshot.spO2}%
                                    </span>
                                  )}
                                  {alert.telemetrySnapshot.spineElongation !== undefined && (
                                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300">
                                      Spine: +{alert.telemetrySnapshot.spineElongation} cm
                                    </span>
                                  )}
                                </div>
                              )}

                              {alert.recommendedAction && (
                                <div className="text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                                  <span className="text-[#00E5FF] font-bold">ACTION DIRECTIVE: </span>
                                  {alert.recommendedAction}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                              {!alert.isAcknowledged && (
                                <button
                                  type="button"
                                  onClick={() => handleAcknowledgeAlert(alert.id)}
                                  className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-black font-mono font-bold text-xs hover:bg-[#00E5FF]/90 cursor-pointer"
                                >
                                  ACKNOWLEDGE PING
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSelectAstronaut(alert.astronautId)}
                                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#00E5FF]/50 text-slate-200 font-mono text-xs cursor-pointer"
                              >
                                INSPECT DOSSIER
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResolveAlert(alert.id)}
                                className="px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/50 text-rose-300 font-mono text-xs cursor-pointer"
                              >
                                DISMISS
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* MEDICAL RESTRICTIONS & EXERCISE APPROVAL ORDERS */}
            {currentTab === 'restrictions' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="glass-panel rounded-2xl p-6 border border-[#FF8C00]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#FFB347] font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-[#FF8C00]" />
                      <span>MEDICAL ORDERS & SAFETY PROTOCOL OVERRIDES</span>
                    </div>
                    <h2 className="text-2xl font-black text-white font-['Chakra_Petch',sans-serif] mt-1">
                      Medical Restrictions & Exercise Clearances ({activeProfile.name})
                    </h2>
                    <p className="text-xs text-slate-300 font-sans mt-1">
                      Approving a restricted exercise or lifting a restriction immediately unlocks it on the Astronaut&apos;s Space Fitness Console.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewRestrictionForm((prev) => !prev)}
                    className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>PRESCRIBE RESTRICTION</span>
                  </button>
                </div>

                {showNewRestrictionForm && (
                  <form
                    onSubmit={handleCreateRestriction}
                    className="glass-panel rounded-2xl p-5 border border-[#FF8C00]/50 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Restriction Name</label>
                        <input
                          type="text"
                          required
                          value={resName}
                          onChange={(e) => setResName(e.target.value)}
                          placeholder="e.g. Heavy Axial Spine Load Hold"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Affected Region</label>
                        <input
                          type="text"
                          required
                          value={resRegion}
                          onChange={(e) => setResRegion(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Severity</label>
                        <select
                          value={resSeverity}
                          onChange={(e) => setResSeverity(e.target.value as 'High' | 'Moderate' | 'Low')}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        >
                          <option value="High">High</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Restricted Exercises (comma-separated)</label>
                        <input
                          type="text"
                          value={resExercises}
                          onChange={(e) => setResExercises(e.target.value)}
                          placeholder="ARED Squat, ARED Deadlift"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Clinical Description</label>
                        <input
                          type="text"
                          required
                          value={resDesc}
                          onChange={(e) => setResDesc(e.target.value)}
                          placeholder="Reason for hold or countermeasure modification"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewRestrictionForm(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono cursor-pointer"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#FF8C00] text-black font-bold text-xs font-mono cursor-pointer"
                      >
                        ISSUE RESTRICTION
                      </button>
                    </div>
                  </form>
                )}

                {/* Exercise Countermeasure Clearance Grid */}
                <div className="glass-panel rounded-2xl p-6 border border-[#00E5FF]/35 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#00E5FF]" />
                      <h3 className="text-lg font-bold text-white font-['Chakra_Petch',sans-serif]">
                        Countermeasure Exercise Clearance Controls ({activeProfile.callsign})
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">
                      {approvedExerciseIds.length} SURGEON-APPROVED OVERRIDE(S)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedExercises.map((ex) => {
                      const isRestricted = ex.status === 'restricted';
                      const isApproved = Boolean(ex.surgeonApproved) || approvedExerciseIds.includes(ex.id);
                      return (
                        <div
                          key={ex.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                            isRestricted
                              ? 'bg-rose-950/25 border-rose-500/50'
                              : isApproved
                              ? 'bg-emerald-950/25 border-emerald-500/50'
                              : 'bg-slate-900/70 border-slate-800'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-sm font-['Chakra_Petch',sans-serif]">
                                {ex.name}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                                  isRestricted
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                    : isApproved
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40'
                                }`}
                              >
                                {isRestricted ? 'LOCKED' : isApproved ? 'SURGEON CLEARED' : ex.status}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {ex.equipment} · {ex.category} · {ex.intensity}
                            </div>
                            {(ex.warningMessage || ex.restrictionReason) && (
                              <div className="text-xs text-slate-300 leading-snug pt-1">
                                {ex.warningMessage || ex.restrictionReason}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                            {isRestricted ? (
                              <button
                                type="button"
                                onClick={() => handleApproveExercise(ex)}
                                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>APPROVE & UNLOCK EXERCISE</span>
                              </button>
                            ) : isApproved ? (
                              <button
                                type="button"
                                onClick={() => handleRevokeExerciseApproval(ex)}
                                className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-rose-500/15 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>REVOKE CLEARANCE / LOCK</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">
                                Standard Protocol Cleared
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active & Lifted Restrictions List */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-white font-['Chakra_Petch',sans-serif]">
                    Medical Restrictions Registry ({allRestrictions.length})
                  </h3>
                  <div className="space-y-3">
                    {allRestrictions.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-slate-900/75 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span
                              className={`px-2 py-0.5 rounded font-bold border ${
                                r.status === 'Active'
                                  ? 'bg-[#FF8C00]/20 text-[#FFB347] border-[#FF8C00]/50'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {r.status}
                            </span>
                            <span className="text-[#00E5FF] font-bold">{r.astronautName}</span>
                            <span className="text-slate-400">· {r.affectedRegion}</span>
                          </div>
                          <div className="font-bold text-white text-base">{r.name}</div>
                          <div className="text-xs text-slate-300">{r.description}</div>
                          {r.restrictedExercises.length > 0 && (
                            <div className="text-[11px] font-mono text-rose-300">
                              Exercises: {r.restrictedExercises.join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {r.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => handleLiftRestriction(r.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs cursor-pointer"
                            >
                              LIFT RESTRICTION
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivateRestriction(r.id)}
                              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs cursor-pointer"
                            >
                              RE-ACTIVATE HOLD
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Medical Orders Audit Log */}
                {orders.length > 0 && (
                  <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
                      Issued Flight Surgeon Orders Audit Log
                    </h3>
                    <div className="space-y-2">
                      {orders.slice(0, 8).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                        >
                          <div>
                            <span className="text-white font-bold">{ord.title}</span>
                            <span className="text-slate-400 ml-2">({ord.astronautName})</span>
                            <div className="text-slate-400 text-[11px] mt-0.5">{ord.notes}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[#00E5FF]">
                            {ord.status} · {new Date(ord.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SHARED TWO-WAY COMMUNICATIONS HUB */}
            {currentTab === 'communications' && (
              <div className="glass-panel rounded-2xl border border-[#00E5FF]/35 overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[660px] animate-in fade-in duration-200">
                {/* Channels List */}
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#070d1e]/90 p-4 space-y-3 overflow-y-auto min-h-0">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-wider px-1">
                    <MessagesSquare className="w-4 h-4" />
                    <span>MEDCOM TELEMEDICINE CHANNELS</span>
                  </div>
                  <div className="space-y-2">
                    {conversations.map((conv) => {
                      const active = conv.id === activeConvId;
                      return (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => {
                            setActiveConvId(conv.id);
                            fetch(`/api/surgeon/messages?conversationId=${encodeURIComponent(conv.id)}&markRead=true`)
                              .then(() => fetchAllSurgeonData(false))
                              .catch(() => {});
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#00E5FF]/15 border-[#00E5FF]/60 shadow-[0_0_16px_rgba(0,229,255,0.2)]'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-white truncate font-['Chakra_Petch',sans-serif]">
                              {conv.title}
                            </span>
                            {(conv.unreadCount || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#00E5FF] text-black text-[10px] font-mono font-black">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate mt-1">
                            {conv.lastMessage}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Conversation Thread */}
                <div className="lg:col-span-8 flex flex-col min-h-0 bg-[#050810]/70 overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#091129]/80 shrink-0">
                    <div>
                      <div className="font-bold text-white font-['Chakra_Petch',sans-serif]">
                        {conversations.find((c) => c.id === activeConvId)?.title || 'MedCom Direct Channel'}
                      </div>
                      <div className="text-xs font-mono text-[#00E5FF]">
                        LIVE SHARED TELEMETRY UPLINK · 248.500 MHz
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold">
                      SYNCED WITH ASTRONAUT COMMS
                    </span>
                  </div>

                  <div className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto">
                    {(messagesByConv[activeConvId] || []).map((msg) => {
                      const isSurgeon = msg.isSurgeon;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSurgeon ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3.5 border text-sm ${
                              msg.isEmergency
                                ? 'bg-rose-950/60 border-rose-500/70 text-rose-100'
                                : isSurgeon
                                ? 'bg-[#00E5FF]/15 border-[#00E5FF]/50 text-white'
                                : 'bg-slate-900/90 border-slate-700 text-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 text-[11px] font-mono mb-1">
                              <span className={isSurgeon ? 'text-[#00E5FF] font-bold' : 'text-amber-300 font-bold'}>
                                {msg.senderName} {msg.senderRole ? `· ${msg.senderRole}` : ''}
                              </span>
                              <span className="text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                            {msg.hasTelemetry && msg.telemetryData && (
                              <div className="mt-2 pt-2 border-t border-slate-700/70 flex flex-wrap gap-2 text-[11px] font-mono text-[#00E5FF]">
                                <span>HR: {msg.telemetryData.hr} bpm</span>
                                <span>· BP: {msg.telemetryData.bp}</span>
                                <span>· SpO2: {msg.telemetryData.spO2}%</span>
                                <span>· Spine: +{msg.telemetryData.spineDelta} cm</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={commsEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendSurgeonReply}
                    className="sticky bottom-0 z-10 p-4 border-t border-slate-800 bg-[#091129]/90 backdrop-blur-xl flex items-center gap-3 shrink-0"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Transmit Flight Surgeon medical reply to Astronaut Comms Hub..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-[#00E5FF] focus:outline-none text-sm text-white"
                    />
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 disabled:opacity-50 text-black font-mono font-extrabold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>TRANSMIT</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* MEDICAL RECORDS (SYMPTOMS, DOCTOR NOTES & TIMELINE) */}
            {currentTab === 'records' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="glass-panel rounded-2xl p-6 border border-[#00E5FF]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] font-bold uppercase">
                      <FileText className="w-4 h-4" />
                      <span>CLINICAL RECORDS · {activeProfile.name}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white font-['Chakra_Petch',sans-serif] mt-1">
                      Symptoms Registry & Flight Surgeon Notes
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewNoteForm((prev) => !prev)}
                    className="px-4 py-2 rounded-xl bg-[#00E5FF] text-black font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>RECORD DOCTOR NOTE</span>
                  </button>
                </div>

                {showNewNoteForm && (
                  <form
                    onSubmit={handleAddDoctorNote}
                    className="glass-panel rounded-2xl p-5 border border-[#00E5FF]/50 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Clinical Note Title</label>
                        <input
                          type="text"
                          required
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="e.g. Post-EVA Lumbar Assessment"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                        <select
                          value={noteCategory}
                          onChange={(e) => setNoteCategory(e.target.value as DoctorNote['category'])}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        >
                          <option value="Routine Assessment">Routine Assessment</option>
                          <option value="Adaptation Review">Adaptation Review</option>
                          <option value="Countermeasure Directive">Countermeasure Directive</option>
                          <option value="Pre-EVA Medical Clearance">Pre-EVA Medical Clearance</option>
                          <option value="Clinical Anomaly">Clinical Anomaly</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Clinical Findings & Plan</label>
                      <textarea
                        rows={3}
                        required
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewNoteForm(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono cursor-pointer"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#00E5FF] text-black font-bold text-xs font-mono cursor-pointer"
                      >
                        SAVE CLINICAL NOTE
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Symptoms List */}
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                    <h3 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                      Logged Symptoms ({selectedSymptoms.length})
                    </h3>
                    {selectedSymptoms.length === 0 ? (
                      <div className="text-xs font-mono text-slate-400">No symptoms logged for this crew member.</div>
                    ) : (
                      selectedSymptoms.map((sym) => (
                        <div key={sym.id} className="p-3.5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-white">{sym.bodyPart}</span>
                            <select
                              value={sym.status}
                              onChange={(e) =>
                                handleUpdateSymptomStatus(
                                  sym.id,
                                  e.target.value as 'active' | 'monitoring' | 'resolved'
                                )
                              }
                              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-[#00E5FF]"
                            >
                              <option value="active">ACTIVE</option>
                              <option value="monitoring">MONITORING</option>
                              <option value="resolved">RESOLVED</option>
                            </select>
                          </div>
                          <div className="text-xs text-slate-300">
                            {sym.painType} · Intensity {sym.intensity}/10 — {sym.notes}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Doctor Notes */}
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                    <h3 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                      Flight Surgeon Clinical Notes ({selectedNotes.length})
                    </h3>
                    {selectedNotes.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#00E5FF] font-bold">{n.category}</span>
                          <span className="text-slate-400">{new Date(n.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold text-sm text-white">{n.title}</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HEALTH ANALYTICS */}
            {currentTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="glass-panel rounded-2xl p-6 border border-[#00E5FF]/35">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] font-bold uppercase">
                    <Activity className="w-4 h-4" />
                    <span>7-DAY TELEMETRY & ADAPTATION ANALYTICS · {activeProfile.name}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white font-['Chakra_Petch',sans-serif] mt-1">
                    Cardiovascular Baseline & Microgravity Adaptation
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">HEART RATE</div>
                      <div className="text-2xl font-black text-[#00E5FF] mt-1">
                        {selectedVitals?.heartRate ?? 72} <span className="text-xs font-normal">bpm</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">BLOOD PRESSURE</div>
                      <div className="text-2xl font-black text-white mt-1">
                        {selectedVitals?.bloodPressureSys ?? 118}/{selectedVitals?.bloodPressureDia ?? 76}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">SPINE ELONGATION</div>
                      <div className="text-2xl font-black text-amber-300 mt-1">
                        +{activeProfile.spineElongation} <span className="text-xs font-normal">cm</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">SPO2 / RADIATION</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {selectedVitals?.spO2 ?? 99}% · {activeProfile.radiationDoseMsv} mSv
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedVitals?.historicalHeartRate || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#091129',
                            borderColor: '#00E5FF',
                            borderRadius: '12px',
                          }}
                        />
                        <ReferenceLine y={activeProfile.restingHeartRate} stroke="#10b981" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="hr" name="Heart Rate (bpm)" stroke="#00E5FF" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="max" name="Peak HR" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ongoing NASA HRP Research Widget */}
                <OngoingHrpResearchWidget />
              </div>
            )}

            {/* MEDICAL REPORTS & INCOMING TELEMETRY DOSSIERS */}
            {currentTab === 'reports' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="glass-panel rounded-2xl p-6 border border-[#00E5FF]/35 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-mono font-bold text-[#00E5FF] uppercase">
                      <FileCheck className="w-4 h-4" />
                      <span>EXCHANGED MEDICAL REPORTS & TELEMETRY PINGS ({exchangedReports.length})</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {exchangedReports.slice(0, 6).map((rep) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-xl bg-slate-900/75 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 font-bold">
                              {rep.reportNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                              {rep.status}
                            </span>
                            <span className="text-slate-400">{rep.astronautName}</span>
                          </div>
                          <div className="font-bold text-white text-sm">{rep.title}</div>
                          <p className="text-xs text-slate-300">{rep.clinicalSummary}</p>
                        </div>
                        {rep.status !== 'reviewed' && (
                          <button
                            type="button"
                            onClick={() => handleEndorseReport(rep.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs shrink-0 cursor-pointer"
                          >
                            ENDORSE REPORT
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <MedicalReportsPage
                  profile={activeProfile}
                  onSendToast={showToast}
                />
              </div>
            )}

            {/* AI MEDICAL ASSISTANT */}
            {currentTab === 'assistant' && (
              <MedicalAssistantPage
                crew={crew}
                initialAstronautId={selectedAstronautId}
                onDataSyncNeeded={() => fetchAllSurgeonData(false)}
                onNavigateTab={handleSelectTab}
                onOpenAstronautProfile={handleSelectAstronaut}
              />
            )}
            </div>
          </main>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl font-mono text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200'
              : toast.type === 'info'
              ? 'bg-[#091129]/95 border-[#00E5FF] text-[#00E5FF]'
              : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
};
