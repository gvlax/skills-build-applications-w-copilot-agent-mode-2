import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!cancelled) {
          setLeaderboard(data.leaderboard ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
          setLeaderboard([]);
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
      title="Leaderboard"
      description="Compare team point totals."
      isLoading={isLoading}
      isEmpty={leaderboard.length === 0 && !isLoading}
      emptyText="No leaderboard rankings yet."
      error={error}
    >
      <ol className="list-group list-group-numbered">
        {leaderboard.map((entry) => (
          <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 'unknown'}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.rank ?? '#'} · {entry.teamName ?? 'Unknown team'}</span>
            <span>{entry.totalPoints ?? 0} pts</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
