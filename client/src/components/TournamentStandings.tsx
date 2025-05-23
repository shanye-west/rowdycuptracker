import type { TeamWithStandings } from "@shared/schema";

interface TournamentStandingsProps {
  teams: TeamWithStandings[];
}

export default function TournamentStandings({ teams }: TournamentStandingsProps) {
  return (
    <section className="px-4 mb-6">
      <h3 className="font-semibold text-lg mb-4">Tournament Standings</h3>
      
      <div className="glass-effect rounded-xl p-4">
        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-300 mb-3 pb-2 border-b border-white/10">
          <span>Round</span>
          <span className="text-center">R1</span>
          <span className="text-center">R2</span>
          <span className="text-center">R3</span>
          <span className="text-center">Total</span>
        </div>
        
        {teams.map((team) => {
          const isAviators = team.name === 'Aviators';
          return (
            <div 
              key={team.id}
              className={`grid grid-cols-5 gap-2 text-sm mb-3 p-2 rounded-lg ${
                isAviators ? 'bg-blue-600/20' : 'bg-red-600/20'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${
                  isAviators ? 'bg-blue-600' : 'bg-red-600'
                }`}></div>
                <span className="font-medium">{team.name}</span>
              </div>
              <span className="text-center font-mono">
                {team.standings?.round1Points || '-'}
              </span>
              <span className="text-center font-mono text-gray-400">
                {team.standings?.round2Points || '-'}
              </span>
              <span className="text-center font-mono text-gray-400">
                {team.standings?.round3Points || '-'}
              </span>
              <span className="text-center font-mono font-bold">
                {parseFloat(team.standings?.totalPoints || "0").toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
