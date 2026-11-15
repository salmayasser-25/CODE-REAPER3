import React from 'react';
import { Outlet } from 'react-router-dom';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { SpaceBackground } from './SpaceBackground.js';
import { TopNav } from './TopNav.js';
import { Sidebar } from './Sidebar.js';
import { EditProfileModal } from './EditProfileModal.js';
import { ClinicalContextModal } from './ClinicalContextModal.js';
import { RoleModal } from './RoleModal.js';
import { AstronautProfile } from '../types/astronaut.js';

interface LayoutProps {
  profile: AstronautProfile;
  isEditingInline: boolean;
  onToggleEdit: () => void;
  onSaveProfile: (updatesToSave?: Partial<AstronautProfile>) => Promise<void>;
  isModalOpen: boolean;
  onCloseModal: () => void;
  isContextModalOpen: boolean;
  onCloseContextModal: () => void;
  isRoleModalOpen: boolean;
  onOpenRoleModal: () => void;
  onCloseRoleModal: () => void;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
}

export const Layout: React.FC<LayoutProps> = ({
  profile,
  isEditingInline,
  onToggleEdit,
  onSaveProfile,
  isModalOpen,
  onCloseModal,
  isContextModalOpen,
  onCloseContextModal,
  isRoleModalOpen,
  onOpenRoleModal,
  onCloseRoleModal,
  toastMessage,
}) => {
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
      {/* Transparent Dark Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(5, 8, 16, 0.35)' }}
      />

      {/* Dynamic Animated Canvas Space Background */}
      <SpaceBackground />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <TopNav
          isEditing={isEditingInline}
          onToggleEdit={onToggleEdit}
          onOpenRoleModal={onOpenRoleModal}
        />

        {/* Content Layout: Sticky Left Sidebar + Independently Scrollable Main Content */}
        <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
          <Sidebar
            astronautName={profile.name}
            callsign={profile.callsign}
          />

          <main className="flex-1 min-w-0 h-full overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-7xl mx-auto w-full space-y-7">
              <Outlet />

              {/* Footer with NASA Space Apps Challenge Accreditation */}
              <footer className="pt-8 pb-12 border-t border-slate-800/80 text-xs sm:text-sm font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
                  <span className="text-white font-bold">ASTROCARE // NASA SPACE APPS CHALLENGE</span>
                  <span>— Phase 1: Astronaut Health Foundation</span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <span className="text-[#FF8C00] font-semibold">SIMULATED DEMONSTRATION DATA</span>
                  <span>·</span>
                  <span className="text-white">JSC FLIGHT MEDICINE REGISTRY</span>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        profile={profile}
        onSave={onSaveProfile}
      />

      <ClinicalContextModal
        isOpen={isContextModalOpen}
        onClose={onCloseContextModal}
        spineElongation={profile.spineElongation}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={onCloseRoleModal}
      />

      {/* Floating Sci-Fi HUD Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#080e22]/95 border-2 border-[#00E5FF]/60 text-white shadow-[0_0_35px_rgba(0,229,255,0.45)] backdrop-blur-xl font-mono text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5 text-[#10b981] shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Sparkles className="w-5 h-5 text-[#00E5FF] shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
