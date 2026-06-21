import { assignOrder, getState } from "./data";
import type { Courier, GeoPoint, Order, Priority } from "../shared/types";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  standard: 1,
  rush: 2,
  vip: 3
};

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const radiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const x = Math.sin(dLat / 2) ** 2
    + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * radiusKm * Math.asin(Math.sqrt(x));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function chooseCourierForOrder(order: Order, couriers: Courier[]): Courier | null {
  const candidates = couriers
    .filter((courier) => courier.status !== "break" && courier.currentLoad < courier.capacity)
    .map((courier) => {
      const distanceKm = haversineKm(courier.location, order.pickup);
      const loadPenalty = courier.currentLoad * 2;
      const priorityBoost = PRIORITY_WEIGHT[order.priority] * 0.25;
      return { courier, score: distanceKm + loadPenalty - priorityBoost };
    })
    .sort((a, b) => a.score - b.score);

  return candidates[0]?.courier ?? null;
}

export function autoAssignNextOrder() {
  const { couriers, orders } = getState();
  const nextOrder = orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => {
      const priorityDelta = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      return priorityDelta || Date.parse(a.createdAt) - Date.parse(b.createdAt);
    })[0];

  if (!nextOrder) {
    return { assigned: false, reason: "no_pending_orders" as const };
  }

  const courier = chooseCourierForOrder(nextOrder, couriers);
  if (!courier) {
    return { assigned: false, reason: "no_available_courier" as const, order: nextOrder };
  }

  return assignOrder(nextOrder.id, courier.id);
}
