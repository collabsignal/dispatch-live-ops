import { useEffect } from "react";
import type { Courier, LocationUpdate } from "../shared/types";

export function useLiveLocations(onUpdate: (updates: LocationUpdate[]) => void) {
  useEffect(() => {
    const source = new EventSource("/api/location-stream");

    source.addEventListener("locations", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { updates: LocationUpdate[] };
      onUpdate(payload.updates);
    });

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [onUpdate]);
}

export function applyLocationUpdates(couriers: Courier[], updates: LocationUpdate[]): Courier[] {
  if (updates.length === 0) {
    return couriers;
  }

  const updateById = new Map(updates.map((update) => [update.courierId, update]));
  return couriers.map((courier) => {
    const update = updateById.get(courier.id);
    if (!update) {
      return courier;
    }

    return {
      ...courier,
      location: {
        lat: update.lat,
        lng: update.lng,
        heading: update.heading,
        lastUpdated: update.timestamp
      }
    };
  });
}
