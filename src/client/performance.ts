import type { Courier, CourierDashboardRow, GeoPoint, Order } from "../shared/types";

export function buildCourierDashboardRows(couriers: Courier[], orders: Order[]): CourierDashboardRow[] {
  return couriers.map((courier) => {
    // Candidate task: this repeats full-order scans for every courier.
    // With 500 couriers and frequent location updates, the dashboard render path becomes the bottleneck.
    const activeOrders = orders.filter((order) =>
      order.assignedCourierId === courier.id
      && (order.status === "assigned" || order.status === "picked_up")
    ).length;

    const nearbyPendingOrders = orders.filter((order) =>
      order.status === "pending" && distanceKm(courier.location, order.pickup) < 3
    ).length;

    return {
      courierId: courier.id,
      name: courier.name,
      status: courier.status,
      activeOrders,
      nearbyPendingOrders,
      loadLabel: `${courier.currentLoad}/${courier.capacity}`,
      lastUpdated: courier.location.lastUpdated
    };
  });
}

function distanceKm(a: GeoPoint, b: GeoPoint): number {
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
