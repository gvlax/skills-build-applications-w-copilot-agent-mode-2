import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { toString(): string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!cancelled) {
          setTeams(data.teams ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
          setTeams([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      isLoading={isLoading}
      isEmpty={teams.length === 0 && !isLoading}
      emptyText="No teams yet."
      error={error}
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <div className="fw-semibold">{team.name ?? 'Untitled team'}</div>
            <div className="small text-muted">Mascot: {team.mascot ?? 'Unknown'}</div>
            <div className="small">Members: {(team.members ?? []).map((member) => String(member)).join(', ') || 'No members'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
