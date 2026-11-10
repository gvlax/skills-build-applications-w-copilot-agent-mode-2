import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!cancelled) {
          setActivities(data.activities ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
          setActivities([]);
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
      title="Activities"
      description="Track student activity minutes and points."
      isLoading={isLoading}
      isEmpty={activities.length === 0 && !isLoading}
      emptyText="No activities yet."
      error={error}
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${activity.occurredAt ?? index}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{activity.type ?? 'Activity'}</span>
            <span className="text-muted">{activity.minutes ?? 0} min · {activity.points ?? 0} pts</span>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
