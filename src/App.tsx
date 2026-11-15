import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { AstronautHeader } from './components/AstronautHeader.js';
import { CrewDossierCard } from './components/CrewDossierCard.js';
import { ClinicalAdaptationsCard } from './components/ClinicalAdaptationsCard.js';
import { SurgeonLinkCard } from './components/SurgeonLinkCard.js';
import { VitalSignsPage } from './components/VitalSignsPage.tsx';
import { MentalWellnessPage } from './components/MentalWellnessPage.tsx';
import { InteractiveBodyPage } from './components/InteractiveBodyPage.tsx';
import { DailyCheckinPage } from './components/DailyCheckinPage.tsx';
import { FitnessPage } from './components/FitnessPage.tsx';
import { UnifiedTimelinePage } from './components/UnifiedTimelinePage.tsx';
import { CommsHubPage } from './components/CommsHubPage.tsx';
import { MedicalReportsPage } from './components/MedicalReportsPage.tsx';
import { MissionEnvironmentPage } from './components/MissionEnvironmentPage.tsx';
import { DigitalTwinPage } from './components/DigitalTwinPage.tsx';
import { SurgeonDashboard } from './pages/SurgeonDashboard.tsx';
import { AuthProvider, useAuth, UserRole } from './contexts/AuthContext.tsx';
import {
  AstronautProfile,
  FlightSurgeon,
  CrewMemberSummary,
  VitalsData,
  SymptomReport,
  MedicalRestriction,
  DoctorNote,
  SpaceExercise,
  TimelineEvent,
  MedicalAlert,
} from './types/astronaut.js';
import { Sliders, Edit3, BookOpen } from 'lucide-react';

const DEFAULT_INITIAL_PROFILE: AstronautProfile = {
  id: 'ASTRO-74-SJ',
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
  conditions: [
    'Microgravity Spinal Elongation (+4.2 cm observed)',
    'Cephalic Fluid Shift (Sub-clinical / Grade I)',
    'Space Motion Adaptation Syndrome (Resolved MET D+03)',
  ],
  assignedSurgeon: {
    name: 'Dr. Marcus Vance, M.D., FACEP',
    credentialId: 'NASA-FS-9842',
    certificationStatus: 'Active Board Certified Aerospace Medicine (JSC/DOD-ST)',
    callsignOrFreq: 'MCC-Houston / MedCom Alpha (248.500 MHz SAT-Uplink)',
    contactDirective: 'Immediate Secure Telemedicine Patch via TDRS-East Relay',
  },
  heightCm: 168.0,
  weightKg: 59.2,
  restingHeartRate: 58,
  spO2Baseline: 99,
  radiationDoseMsv: 14.8,
  missionElapsedDays: 84,
  updatedAt: new Date().toISOString(),
};

const TAB_TO_ROUTE: Record<string, string> = {
  profile: '/profile',
  vitals: '/vitals',
  checkin: '/checkin',
  fitness: '/fitness',
  mental: '/mental-wellness',
  'mental-wellness': '/mental-wellness',
  body3d: '/3d-body',
  symptoms: '/3d-body',
  '3d-body': '/3d-body',
  twin: '/digital-twin',
  'digital-twin': '/digital-twin',
  timeline: '/timeline',
  comms: '/comms',
  reports: '/reports',
  environment: '/environment',
  overview: '/surgeon-overview',
  monitoring: '/surgeon-overview',
  individual: '/surgeon-profile',
  assistant: '/medical-assistant',
};

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center gap-3 text-slate-200 font-mono text-xs">
      <div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin" />
      <span className="tracking-widest uppercase text-[#00E5FF]">VERIFYING SESSION...</span>
    </div>
  );
}

function RequireAuth({
  children,
  requiredRole,
}: {
  children: React.ReactElement;
  requiredRole?: UserRole;
}) {
  const { isAuthenticated, isLoading, isRoleLoading, role } = useAuth();
  if (isLoading || isRoleLoading) {
    return <AuthLoadingScreen />;
  }
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && role !== requiredRole) {
    return (
      <Navigate
        to={role === 'surgeon' ? '/surgeon/overview' : '/astronaut/profile'}
        replace
      />
    );
  }
  return children;
}

function LoginRoute() {
  const { isAuthenticated, isLoading, isRoleLoading, role } = useAuth();
  if (isLoading || (isAuthenticated && isRoleLoading)) {
    return <AuthLoadingScreen />;
  }
  if (isAuthenticated && role) {
    return <Navigate to={role === 'surgeon' ? '/surgeon/overview' : '/astronaut/profile'} replace />;
  }
  return <LoginScreen />;
}

function RoleHomeRedirect() {
  const { isAuthenticated, isLoading, isRoleLoading, role } = useAuth();
  if (isLoading || isRoleLoading) {
    return <AuthLoadingScreen />;
  }
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === 'surgeon' ? '/surgeon/overview' : '/astronaut/profile'} replace />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AstronautProfile>(DEFAULT_INITIAL_PROFILE);
  const [isEditingInline, setIsEditingInline] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState<boolean>(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Flight Surgeon / Crew Oversight stores (pulled from CODE-REABER)
  const [crew, setCrew] = useState<CrewMemberSummary[]>([]);
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomReport[]>([]);
  const [restrictions, setRestrictions] = useState<MedicalRestriction[]>([]);
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [exercises, setExercises] = useState<SpaceExercise[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>('ASTRO-74-SJ');

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const navigateByTab = (tab: string) => {
    const target = TAB_TO_ROUTE[tab] || (tab.startsWith('/') ? tab : `/${tab}`);
    navigate(target);
  };

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setProfile(json.data);
        }
      }
    } catch {
      // Fallback to baseline
    }
  };

  const fetchSurgeonData = async () => {
    try {
      const [cRes, vRes, sRes, rRes, nRes, eRes, tRes, aRes] = await Promise.all([
        fetch('/api/crew'),
        fetch('/api/vitals'),
        fetch('/api/symptoms'),
        fetch('/api/restrictions'),
        fetch('/api/doctor-notes'),
        fetch('/api/fitness/exercises'),
        fetch('/api/timeline'),
        fetch('/api/alerts'),
      ]);
      const [cJ, vJ, sJ, rJ, nJ, eJ, tJ, aJ] = await Promise.all([
        cRes.json(),
        vRes.json(),
        sRes.json(),
        rRes.json(),
        nRes.json(),
        eRes.json(),
        tRes.json(),
        aRes.json(),
      ]);
      if (cJ.success) setCrew(cJ.data);
      if (vJ.success) setVitals(vJ.data);
      if (sJ.success) setSymptoms(sJ.data);
      if (rJ.success) setRestrictions(rJ.data);
      if (nJ.success) setNotes(nJ.data);
      if (eJ.success) setExercises(eJ.data);
      if (tJ.success) setTimeline(tJ.data);
      if (aJ.success) setAlerts(aJ.data);
    } catch {
      // Silent fallback
    }
  };

  useEffect(() => {
    loadProfile();
    fetchSurgeonData();
  }, []);

  const handleSaveProfile = async (updatesToSave?: Partial<AstronautProfile>) => {
    setIsSaving(true);
    const dataToSend = updatesToSave || profile;

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setProfile(result.data);
        setIsEditingInline(false);
        triggerToast('Astronaut dossier synchronized to Ground Telemetry DB', 'success');
      } else {
        throw new Error(result.error || 'Server validation rejected updates');
      }
    } catch (_error: any) {
      setProfile((prev) => ({ ...prev, ...(updatesToSave || {}) }));
      setIsEditingInline(false);
      triggerToast('Local changes updated (Offline fallback active)', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetProfile = async () => {
    if (!window.confirm('Reset astronaut dossier back to Dr. Salma Johnson NASA baseline?')) {
      return;
    }

    try {
      const response = await fetch('/api/profile/reset', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setProfile(result.data);
        }
      } else {
        setProfile(DEFAULT_INITIAL_PROFILE);
      }
      setIsEditingInline(false);
      triggerToast('Profile successfully reset to Expedition-74 baseline', 'info');
    } catch (_e) {
      setProfile(DEFAULT_INITIAL_PROFILE);
      setIsEditingInline(false);
      triggerToast('Profile baseline reset locally', 'info');
    }
  };

  const handleFieldChange = (field: keyof AstronautProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSurgeonChange = (field: keyof FlightSurgeon, value: string) => {
    setProfile((prev) => ({
      ...prev,
      assignedSurgeon: {
        ...prev.assignedSurgeon,
        [field]: value,
      },
    }));
  };

  const handleAddAllergy = (allergy: string) => {
    if (!profile.allergies.includes(allergy)) {
      setProfile((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergy],
      }));
      triggerToast(`Registered allergy: ${allergy}`, 'info');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const handleAddCondition = (condition: string) => {
    if (!profile.conditions.includes(condition)) {
      setProfile((prev) => ({
        ...prev,
        conditions: [...prev.conditions, condition],
      }));
      triggerToast(`Added adaptation tracking: ${condition}`, 'info');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const handlePhotoUpload = (photoDataUrl: string) => {
    setProfile((prev) => ({ ...prev, photoUrl: photoDataUrl }));
    triggerToast('New astronaut photo preview loaded', 'success');
  };

  const profilePageContent = (
    <>
      {isEditingInline && (
        <div className="p-4 rounded-xl bg-[#FF8C00]/20 border border-[#FF8C00]/50 text-[#FFB347] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(255,140,0,0.3)] backdrop-blur-md">
          <div className="flex items-center gap-3 text-sm font-mono">
            <Sliders className="w-5 h-5 text-[#FF8C00] shrink-0" />
            <span className="text-white">
              <strong className="text-[#FF8C00]">INLINE EDIT MODE ENGAGED:</strong> Adjust sliders, type new values, or add allergies directly.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSaveProfile()}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#FF8C00] text-black font-mono font-extrabold text-xs sm:text-sm hover:bg-[#FF8C00]/90 transition-colors shadow-md cursor-pointer"
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button
              onClick={() => setIsEditingInline(false)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs sm:text-sm hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      <AstronautHeader
        profile={profile}
        isEditing={isEditingInline}
        onToggleEdit={() => setIsEditingInline((prev) => !prev)}
        onSave={() => handleSaveProfile()}
        onReset={handleResetProfile}
        onPhotoUpload={handlePhotoUpload}
        isSaving={isSaving}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 text-xs sm:text-sm font-mono text-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-[#00E5FF] font-bold">PAGE: ASTRONAUT PROFILE (PHASE 1)</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-200">TELEMETRY: 1-HZ REALTIME</span>
          <span className="text-slate-500 hidden md:inline">·</span>
          <span className="text-slate-300 hidden md:inline">
            LAST SYNC: {new Date(profile.updatedAt || Date.now()).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsContextModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 border border-[#00E5FF]/45 text-[#00E5FF] flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)] text-xs font-bold cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#00E5FF]" />
            <span>Clinical Briefing</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-[#00E5FF]/45 text-white flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)] text-xs font-bold cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-[#00E5FF]" />
            <span>Full Edit Dialog</span>
          </button>
        </div>
      </div>

      <CrewDossierCard
        profile={profile}
        isEditing={isEditingInline}
        onChange={handleFieldChange}
      />

      <ClinicalAdaptationsCard
        profile={profile}
        isEditing={isEditingInline}
        onSpineChange={(val) => handleFieldChange('spineElongation', val)}
        onBloodTypeChange={(val) => handleFieldChange('bloodType', val)}
        onAddAllergy={handleAddAllergy}
        onRemoveAllergy={handleRemoveAllergy}
        onAddCondition={handleAddCondition}
        onRemoveCondition={handleRemoveCondition}
        onOpenContextModal={() => setIsContextModalOpen(true)}
      />

      <SurgeonLinkCard
        astronautId={profile.id}
        surgeon={profile.assignedSurgeon}
        isEditing={isEditingInline}
        onSurgeonChange={handleSurgeonChange}
        onSendPingToast={(msg) => triggerToast(msg, 'success')}
        onOpenComms={() => navigate('/comms')}
      />
    </>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<RoleHomeRedirect />} />

      {/* Flight Surgeon Console Routes (/surgeon/*) */}
      <Route
        path="/surgeon"
        element={
          <RequireAuth requiredRole="surgeon">
            <Navigate to="/surgeon/overview" replace />
          </RequireAuth>
        }
      />
      <Route
        path="/surgeon/profile/:astronautId"
        element={
          <RequireAuth requiredRole="surgeon">
            <SurgeonDashboard defaultTab="profile" />
          </RequireAuth>
        }
      />
      <Route
        path="/surgeon/:tab"
        element={
          <RequireAuth requiredRole="surgeon">
            <SurgeonDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/surgeon-overview"
        element={
          <RequireAuth requiredRole="surgeon">
            <Navigate to="/surgeon/overview" replace />
          </RequireAuth>
        }
      />
      <Route
        path="/surgeon-profile"
        element={
          <RequireAuth requiredRole="surgeon">
            <Navigate to="/surgeon/profile/ASTRO-74-SJ" replace />
          </RequireAuth>
        }
      />
      <Route
        path="/medical-assistant"
        element={
          <RequireAuth requiredRole="surgeon">
            <Navigate to="/surgeon/assistant" replace />
          </RequireAuth>
        }
      />

      {/* Astronaut Console Routes (/astronaut/* + legacy tab aliases) */}
      <Route
        element={
          <RequireAuth requiredRole="astronaut">
            <Layout
              profile={profile}
              isEditingInline={isEditingInline}
              onToggleEdit={() => setIsEditingInline((prev) => !prev)}
              onSaveProfile={handleSaveProfile}
              isModalOpen={isModalOpen}
              onCloseModal={() => setIsModalOpen(false)}
              isContextModalOpen={isContextModalOpen}
              onCloseContextModal={() => setIsContextModalOpen(false)}
              isRoleModalOpen={isRoleModalOpen}
              onOpenRoleModal={() => setIsRoleModalOpen(true)}
              onCloseRoleModal={() => setIsRoleModalOpen(false)}
              toastMessage={toastMessage}
            />
          </RequireAuth>
        }
      >
        <Route path="/astronaut" element={<Navigate to="/astronaut/profile" replace />} />
        <Route path="/astronaut/profile" element={profilePageContent} />
        <Route path="/profile" element={profilePageContent} />

        <Route
          path="/astronaut/vitals"
          element={
            <VitalSignsPage
              profile={profile}
              onNavigateToCheckin={() => navigate('/checkin')}
            />
          }
        />
        <Route
          path="/vitals"
          element={
            <VitalSignsPage
              profile={profile}
              onNavigateToCheckin={() => navigate('/checkin')}
            />
          }
        />

        <Route
          path="/astronaut/checkin"
          element={
            <DailyCheckinPage
              profile={profile}
              onNavigateToTimeline={() => navigate('/timeline')}
            />
          }
        />
        <Route
          path="/checkin"
          element={
            <DailyCheckinPage
              profile={profile}
              onNavigateToTimeline={() => navigate('/timeline')}
            />
          }
        />

        <Route path="/astronaut/fitness" element={<FitnessPage profile={profile} />} />
        <Route path="/fitness" element={<FitnessPage profile={profile} />} />

        <Route path="/astronaut/mental-wellness" element={<MentalWellnessPage profile={profile} />} />
        <Route path="/mental-wellness" element={<MentalWellnessPage profile={profile} />} />

        <Route path="/astronaut/3d-body" element={<InteractiveBodyPage profile={profile} />} />
        <Route path="/3d-body" element={<InteractiveBodyPage profile={profile} />} />
        <Route path="/symptoms" element={<Navigate to="/3d-body" replace />} />

        <Route
          path="/astronaut/digital-twin"
          element={
            <DigitalTwinPage
              profile={profile}
              onSendToast={triggerToast}
              onNavigateToTab={navigateByTab}
            />
          }
        />
        <Route
          path="/digital-twin"
          element={
            <DigitalTwinPage
              profile={profile}
              onSendToast={triggerToast}
              onNavigateToTab={navigateByTab}
            />
          }
        />
        <Route path="/twin" element={<Navigate to="/digital-twin" replace />} />

        <Route
          path="/astronaut/timeline"
          element={
            <UnifiedTimelinePage
              profile={profile}
              onNavigateToTab={navigateByTab}
            />
          }
        />
        <Route
          path="/timeline"
          element={
            <UnifiedTimelinePage
              profile={profile}
              onNavigateToTab={navigateByTab}
            />
          }
        />

        <Route
          path="/astronaut/comms"
          element={
            <CommsHubPage
              profile={profile}
              onSendToast={triggerToast}
            />
          }
        />
        <Route
          path="/comms"
          element={
            <CommsHubPage
              profile={profile}
              onSendToast={triggerToast}
            />
          }
        />

        <Route
          path="/astronaut/reports"
          element={
            <MedicalReportsPage
              profile={profile}
              onSendToast={triggerToast}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <MedicalReportsPage
              profile={profile}
              onSendToast={triggerToast}
            />
          }
        />

        <Route
          path="/astronaut/environment"
          element={
            <MissionEnvironmentPage
              profile={profile}
              onSendToast={triggerToast}
            />
          }
        />
        <Route
          path="/environment"
          element={
            <MissionEnvironmentPage
              profile={profile}
              onSendToast={triggerToast}
            />
          }
        />
      </Route>

      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
