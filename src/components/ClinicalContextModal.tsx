import React from 'react';
import { X, BookOpen, Ruler, Eye, Activity, ShieldCheck, Info, ExternalLink, Bone } from 'lucide-react';

interface ClinicalContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  spineElongation: number;
}

export const ClinicalContextModal: React.FC<ClinicalContextModalProps> = ({
  isOpen,
  onClose,
  spineElongation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#080e22] border border-[#00E5FF]/45 shadow-[0_0_50px_rgba(0,229,255,0.25)] max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between p-6 sm:px-8 sm:pt-7 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <BookOpen className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Chakra_Petch',sans-serif] tracking-wide">
                Clinical Context &amp; Spaceflight Adaptation Analysis
              </h2>
              <p className="text-sm font-mono text-[#00E5FF]">
                NASA Human Research Program · Biomechanical &amp; Microgravity Dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:px-8 space-y-5 text-slate-200 text-sm leading-relaxed">
          {/* Section 1: Spine Elongation */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-[#00E5FF]/25 space-y-2.5">
            <div className="flex items-center gap-2 text-[#FF8C00] font-mono font-bold text-base">
              <Ruler className="w-5 h-5 text-[#FF8C00]" />
              <span>1. Microgravity Spinal Elongation Delta (+{spineElongation.toFixed(1)} cm)</span>
            </div>
            <p className="text-slate-100 text-sm sm:text-base">
              In prolonged microgravity (10⁻⁶ g), the human body is freed from continuous 1G downward compressive force. As a result, the cartilaginous intervertebral discs absorb interstitial fluid and expand, increasing overall standing height by 2.0 to 7.0 centimeters.
            </p>
            <div className="mt-2 p-3 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div className="text-[#00E5FF] font-semibold uppercase">Clinical Implications &amp; Operational Risk:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong className="text-white">Lumbar Back Pain:</strong> Stretching of paraspinal ligaments and postural muscles causes dull to moderate back ache in ~70% of crew during early flight.</li>
                <li><strong className="text-white">EVA Extravehicular Suit Fit:</strong> Space suits (xEMU) must accommodate torso elongation without shoulder pinching or ring impingement.</li>
                <li><strong className="text-white">Re-entry Disc Herniation Risk:</strong> Sudden re-exposure to gravity upon splashdown puts decompressed, hydrated discs at elevated risk of herniation.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: NASA HRP Bone Changes & Musculoskeletal Fitness */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-[#FF8C00]/35 space-y-3">
            <div className="flex items-center gap-2 text-[#FFB347] font-mono font-bold text-base">
              <Bone className="w-5 h-5 text-[#FF8C00]" />
              <span>2. NASA HRP Musculoskeletal &amp; Bone Health Risks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3.5 rounded-lg bg-black/45 border border-slate-800 space-y-1.5">
                <div className="text-[#00E5FF] font-mono font-bold uppercase text-[11px]">
                  Risk of Spaceflight-Induced Bone Changes
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Without Earth&apos;s mechanical loading, weight-bearing bones (lumbar spine, pelvis, femoral neck) lose mineral density at ~1%–1.5% per month, increasing fracture risk and calcium excretion (renal stone risk).
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-black/45 border border-slate-800 space-y-1.5">
                <div className="text-[#FFB347] font-mono font-bold uppercase text-[11px]">
                  Risk of Reduced Musculoskeletal Fitness
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Reduced antigravity muscle activation leads to paraspinal and lower-limb muscle atrophy, decreased strength and endurance, and heightened vulnerability to spinal injury during high-load tasks or re-entry.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
              <a
                href="https://www.nasa.gov/hrp/hazards/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#00E5FF] hover:underline font-bold"
              >
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Source: NASA HRP — 5 Hazards of Human Spaceflight</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <a
                href="https://www.nasa.gov/hrp/risks/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-300 hover:underline font-bold"
              >
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Source: NASA HRP — Risks of Human Spaceflight</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Section 3: Cephalic Fluid Shift & SANS */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-[#00E5FF]/25 space-y-2.5">
            <div className="flex items-center gap-2 text-[#00E5FF] font-mono font-bold text-base">
              <Eye className="w-5 h-5 text-[#00E5FF]" />
              <span>3. Cephalic Fluid Shift &amp; SANS (Spaceflight Associated Neuro-ocular Syndrome)</span>
            </div>
            <p className="text-slate-100 text-sm sm:text-base">
              Without gravitational pooling of blood in the lower limbs, approximately 1.5 to 2.0 liters of blood and interstitial fluids shift upward toward the chest, neck, and cranium (&quot;puffy-face, bird-leg&quot; syndrome).
            </p>
            <div className="mt-2 p-3 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div className="text-[#00E5FF] font-semibold uppercase">Ocular Telemetry &amp; Assessment:</div>
              <p>
                Dr. Salma Johnson is monitored for optic nerve sheath diameter dilation, choroidal folds, and hyperopic refractive shift. Current optic coherence tomography (OCT) baseline remains Grade 0 (no papilledema detected).
              </p>
            </div>
          </div>

          {/* Section 4: Neurovestibular Motion Adaptation */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-[#00E5FF]/25 space-y-2.5">
            <div className="flex items-center gap-2 text-[#10b981] font-mono font-bold text-base">
              <Activity className="w-5 h-5 text-[#10b981]" />
              <span>4. Neurovestibular Adaptation &amp; Space Motion Sickness (SMS)</span>
            </div>
            <p className="text-slate-100 text-sm sm:text-base">
              In weightlessness, gravity sensors in the inner ear (otolith organs) no longer signal up versus down, conflicting with visual cues. Dr. Salma Johnson underwent transient mild spatial disorientation during Flight Days 1–3, successfully resolved with neuro-adaptation and oral antiemetics.
            </p>
          </div>

          {/* Section 5: Countermeasures Protocol */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-[#00E5FF]/25 space-y-2.5">
            <div className="flex items-center gap-2 text-[#00E5FF] font-mono font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
              <span>5. Prescribed Countermeasure Schedule (ARED &amp; SkinSuit)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="p-3 rounded bg-black/40 border border-slate-800">
                <div className="text-white font-bold mb-1">ARED Resistive Exercise:</div>
                <div className="text-slate-300">2.5 hours daily resistive squats &amp; deadlifts delivering up to 600 lbs of simulated axial load.</div>
              </div>
              <div className="p-3 rounded bg-black/40 border border-slate-800">
                <div className="text-white font-bold mb-1">Gravity Loading SkinSuit:</div>
                <div className="text-slate-300">Tailored elastic garment creating 1G equivalent gradient load from shoulders to feet during sleep cycles.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#080e22]">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <a
              href="https://www.nasa.gov/hrp/hazards/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-[#00E5FF]"
            >
              <Info className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>NASA HRP Hazards</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">·</span>
            <a
              href="https://www.nasa.gov/hrp/risks/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-[#00E5FF]"
            >
              <Info className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>NASA HRP Risks</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-bold text-sm font-mono tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer"
          >
            DISMISS BRIEFING
          </button>
        </div>
      </div>
    </div>
  );
};

