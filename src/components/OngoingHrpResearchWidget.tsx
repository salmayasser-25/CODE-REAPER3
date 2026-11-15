import React from 'react';
import { FlaskConical, ExternalLink, Info, Moon, Activity, Sprout } from 'lucide-react';

const HRP_STUDIES = [
  {
    id: 'archer',
    code: 'ARCHeR',
    title: 'Monitoring sleep and well-being on Artemis II',
    summary:
      'Investigates crew sleep architecture, circadian alignment, and cognitive resilience during deep-space lunar transit.',
    icon: Moon,
    accent: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
  },
  {
    id: 'cipher',
    code: 'CIPHER',
    title: 'Understanding how the body changes in orbit',
    summary:
      'Integrated multi-system protocol tracking bone mineral density, muscle performance, cardiovascular, and neuro-ocular adaptation across mission durations.',
    icon: Activity,
    accent: 'text-[#00E5FF] border-[#00E5FF]/40 bg-[#00E5FF]/10',
  },
  {
    id: 'space-gardening',
    code: 'Space Gardening',
    title: 'Easing isolation & supporting crew morale',
    summary:
      'Studies how cultivating living plants aboard orbital habitats provides sensory variety, psychological restoration, and fresh dietary supplementation.',
    icon: Sprout,
    accent: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  },
];

export const OngoingHrpResearchWidget: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-[#00E5FF]/30 bg-[#070d20]/85 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF]">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Chakra_Petch',sans-serif] tracking-wider uppercase">
              Ongoing HRP Research
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Active NASA Human Research Program Flight Investigations
            </p>
          </div>
        </div>

        <a
          href="https://www.nasa.gov/hrp/ongoing-hrp-research/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] text-[11px] font-mono font-bold transition-colors shrink-0"
        >
          <span>Learn More</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {HRP_STUDIES.map((study) => {
          const Icon = study.icon;
          return (
            <div
              key={study.id}
              className="p-3.5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${study.accent}`}
                  >
                    <Icon className="w-3 h-3" />
                    {study.code}
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-sans leading-snug">
                  {study.title}
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {study.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <a
          href="https://www.nasa.gov/hrp/ongoing-hrp-research/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[#00E5FF] hover:underline font-bold"
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Source: NASA Ongoing HRP Research</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
        <span className="text-slate-500">NASA Human Research Program</span>
      </div>
    </div>
  );
};
