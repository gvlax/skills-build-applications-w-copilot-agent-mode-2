import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
  minutes?: number;
  difficulty?: string;
};

const defaultUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(defaultUserEmail)}`);
        if (!cancelled) {
          setSuggestions(data.suggestions ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
          setSuggestions([]);
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      isLoading={isLoading}
      isEmpty={suggestions.length === 0 && !isLoading}
      emptyText="No workout suggestions available."
      error={error}
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
            <div className="fw-semibold">{suggestion.title ?? 'Workout'}</div>
            <div className="small text-muted">{suggestion.focus ?? 'General'} · {suggestion.minutes ?? 0} min · {suggestion.difficulty ?? 'moderate'}</div>
            <div className="small">{suggestion.reason ?? 'Personalized plan recommendation.'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
