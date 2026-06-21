import { chooseCourierForOrder, haversineKm } from "./dispatch";
import type { Courier, Order } from "../shared/types";

const order: Order = {
  id: "order-test",
  createdAt: "2026-06-20T11:00:00.000Z",
  status: "pending",
  priority: "rush",
  pickup: { lat: 37.775, lng: -122.419, address: "Pickup" },
  dropoff: { lat: 37.78, lng: -122.41, address: "Dropoff" },
  promisedBy: "2026-06-20T11:45:00.000Z"
};

function courier(id: string, lat: number, lng: number): Courier {
  return {
    id,
    name: id,
    status: "available",
    vehicle: "bike",
    capacity: 2,
    currentLoad: 0,
    location: {
      lat,
      lng,
      heading: 0,
      lastUpdated: "2026-06-20T11:00:00.000Z"
    }
  };
}

describe("dispatch scoring", () => {
  it("calculates non-zero distance between points", () => {
    expect(haversineKm({ lat: 37.775, lng: -122.419 }, { lat: 37.785, lng: -122.409 })).toBeGreaterThan(1);
  });

  it("chooses the nearest courier with capacity", () => {
    const chosen = chooseCourierForOrder(order, [
      courier("far", 37.9, -122.5),
      courier("near", 37.7751, -122.4191)
    ]);

    expect(chosen?.id).toBe("near");
  });
});
