import { useEffect, useState } from 'react';
import type { GateFeedService } from '../types';
import { getGateFeedService } from '@/shared/services/mock';
import type { GateEvent } from '@/shared/types';

const MAX_VISIBLE = 20;

interface UseGateFeedResult {
  events: GateEvent[];
  error: Error | null;
}

interface ServiceOrError {
  service: GateFeedService | null;
  error: Error | null;
}

function createService(): ServiceOrError {
  try {
    return { service: getGateFeedService(), error: null };
  } catch (err) {
    // Proves the mock/real seam is real: flipping VITE_USE_MOCK_GATE_FEED
    // to false with no real implementation fails predictably here rather
    // than silently doing nothing.
    return {
      service: null,
      error: err instanceof Error ? err : new Error('Failed to start the gate feed.'),
    };
  }
}

export function useGateFeed(): UseGateFeedResult {
  const [events, setEvents] = useState<GateEvent[]>([]);
  const [{ service, error }] = useState(createService);

  useEffect(() => {
    if (!service) return;

    return service.subscribe((event) => {
      setEvents((current) => [event, ...current].slice(0, MAX_VISIBLE));
    });
  }, [service]);

  return { events, error };
}
