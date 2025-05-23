import type { TeamWithStandings } from "@shared/schema";

interface TeamOverviewProps {
  teams: TeamWithStandings[];
}

export default function TeamOverview({ teams }: TeamOverviewProps) {
  return (
    <section className="px-4 mb-6">
      <div className="grid grid-cols-2 gap-3">
        {teams.map((team, index) => {
          const teamPoints = parseFloat(team.standings?.totalPoints || "0");
          const isFirstTeam = index === 0;
          
          return (
            <div 
              key={team.id}
              className={`${
                team.color === '#1E40AF' ? 'bg-team-aviator' : 'bg-team-producer'
              } rounded-xl p-4 ${isFirstTeam ? 'team-card-glow' : ''}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {team.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{team.name}</h3>
                <p className={`text-sm mb-3 ${
                  team.color === '#1E40AF' ? 'text-blue-100' : 'text-red-100'
                }`}>
                  {team.captain}
                </p>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-mono font-bold">{teamPoints.toFixed(1)}</div>
                  <div className={`text-xs ${
                    team.color === '#1E40AF' ? 'text-blue-100' : 'text-red-100'
                  }`}>
                    Points
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
