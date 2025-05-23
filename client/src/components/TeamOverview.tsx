import type { TeamWithStandings } from "@shared/schema";

interface TeamOverviewProps {
  teams: TeamWithStandings[];
}

export default function TeamOverview({ teams }: TeamOverviewProps) {
  const aviators = teams.find(t => t.name === 'Aviators');
  const producers = teams.find(t => t.name === 'Producers');

  const aviatorsPoints = parseFloat(aviators?.standings?.totalPoints || "0");
  const producersPoints = parseFloat(producers?.standings?.totalPoints || "0");

  return (
    <section className="px-4 mb-6">
      <div className="grid grid-cols-2 gap-3">
        {/* Aviators Team Card */}
        <div className="bg-team-aviator rounded-xl p-4 team-card-glow">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h3 className="font-bold text-lg">Aviators</h3>
            <p className="text-sm text-blue-100 mb-3">{aviators?.captain || 'Captain'}</p>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-2xl font-mono font-bold">{aviatorsPoints.toFixed(1)}</div>
              <div className="text-xs text-blue-100">Points</div>
            </div>
          </div>
        </div>

        {/* Producers Team Card */}
        <div className="bg-team-producer rounded-xl p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h3 className="font-bold text-lg">Producers</h3>
            <p className="text-sm text-red-100 mb-3">{producers?.captain || 'Captain'}</p>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-2xl font-mono font-bold">{producersPoints.toFixed(1)}</div>
              <div className="text-xs text-red-100">Points</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
