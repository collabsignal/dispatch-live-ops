import request from "supertest";
import { createApp } from "./app";
import { getState, resetState } from "./data";

describe("DispatchLive API", () => {
  beforeEach(() => {
    resetState();
  });

  it("starts with 500 active couriers and seeded orders", async () => {
    const response = await request(createApp()).get("/api/health").expect(200);

    expect(response.body).toEqual({
      ok: true,
      activeCouriers: 500,
      orders: 2500
    });
  });

  it("returns dashboard data without waiting when latency is disabled", async () => {
    const response = await request(createApp()).get("/api/dashboard?latencyMs=0&ordersLimit=25").expect(200);

    expect(response.body.couriers).toHaveLength(500);
    expect(response.body.orders).toHaveLength(25);
    expect(response.body.generatedAt).toEqual(expect.any(String));
  });

  it("counts orders in a half-open ISO timestamp window", async () => {
    const to = new Date("2026-06-20T12:00:00.000Z");
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    const expected = getState().orders.filter((order) => {
      const created = Date.parse(order.createdAt);
      return created >= from.getTime() && created < to.getTime();
    }).length;

    const response = await request(createApp())
      .get(`/api/orders/count?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
      .expect(200);

    expect(response.body.count).toBe(expected);
  });

  it("rejects invalid order count windows", async () => {
    const response = await request(createApp())
      .get("/api/orders/count?from=bad-date&to=2026-06-20T12:00:00.000Z")
      .expect(400);

    expect(response.body.error).toContain("valid ISO");
  });

  it("assigns the next pending order to an available courier", async () => {
    const response = await request(createApp()).post("/api/dispatch/assign-next").expect(200);

    expect(response.body.assigned).toBe(true);
    expect(response.body.order.status).toBe("assigned");
    expect(response.body.order.assignedCourierId).toEqual(response.body.courier.id);
  });
});
