import { buildCourierDashboardRows } from "./performance";
import type { Courier, Order } from "../shared/types";

const courier: Courier = {
  id: "courier-001",
  name: "Ari Patel",
  status: "assigned",
  vehicle: "bike",
  capacity: 2,
  currentLoad: 1,
  location: {
    lat: 37.775,
    lng: -122.419,
    heading: 90,
    lastUpdated: "2026-06-20T12:00:00.000Z"
  }
};

const orders: Order[] = [
  {
    id: "order-1",
    createdAt: "2026-06-20T11:00:00.000Z",
    status: "assigned",
    priority: "rush",
    pickup: { lat: 37.775, lng: -122.419, address: "A" },
    dropoff: { lat: 37.78, lng: -122.42, address: "B" },
    promisedBy: "2026-06-20T11:40:00.000Z",
    assignedCourierId: "courier-001"
  },
  {
    id: "order-2",
    createdAt: "2026-06-20T11:05:00.000Z",
    status: "pending",
    priority: "standard",
    pickup: { lat: 37.7752, lng: -122.4192, address: "C" },
    dropoff: { lat: 37.78, lng: -122.42, address: "D" },
    promisedBy: "2026-06-20T11:45:00.000Z"
  }
];

describe("dashboard row builder", () => {
  it("summarizes active and nearby orders for courier rows", () => {
    const rows = buildCourierDashboardRows([courier], orders);

    expect(rows).toEqual([
      {
        courierId: "courier-001",
        name: "Ari Patel",
        status: "assigned",
        activeOrders: 1,
        nearbyPendingOrders: 1,
        loadLabel: "1/2",
        lastUpdated: "2026-06-20T12:00:00.000Z"
      }
    ]);
  });
});
