import cors from "cors";
import express from "express";
import type { CourierStatus, OrderStatus } from "../shared/types";
import {
  advanceCourierLocations,
  countOrdersInWindow,
  getState,
  listCouriers,
  listOrders,
  parseDateParam
} from "./data";
import { autoAssignNextOrder } from "./dispatch";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    const { couriers, orders } = getState();
    res.json({
      ok: true,
      activeCouriers: couriers.length,
      orders: orders.length
    });
  });

  app.get("/api/dashboard", async (req, res) => {
    const latencyMs = Number(req.query.latencyMs ?? 500);
    if (Number.isFinite(latencyMs) && latencyMs > 0) {
      await delay(Math.min(latencyMs, 2000));
    }

    res.json({
      couriers: listCouriers(),
      orders: listOrders({ limit: Number(req.query.ordersLimit ?? 2500) }),
      generatedAt: new Date().toISOString()
    });
  });

  app.get("/api/couriers", (req, res) => {
    res.json({
      couriers: listCouriers(req.query.status as CourierStatus | undefined),
      generatedAt: new Date().toISOString()
    });
  });

  app.get("/api/orders", (req, res) => {
    res.json({
      orders: listOrders({
        status: req.query.status as OrderStatus | undefined,
        limit: Number(req.query.limit ?? 500)
      })
    });
  });

  app.get("/api/orders/count", (req, res) => {
    const from = parseDateParam(req.query.from);
    const to = parseDateParam(req.query.to);

    if (!from || !to) {
      res.status(400).json({ error: "from and to query params must be valid ISO timestamps" });
      return;
    }

    if (from >= to) {
      res.status(400).json({ error: "from must be before to" });
      return;
    }

    res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      count: countOrdersInWindow(from, to)
    });
  });

  app.post("/api/dispatch/assign-next", (_req, res) => {
    const result = autoAssignNextOrder();
    res.status(result.assigned ? 200 : 409).json(result);
  });

  app.get("/api/location-stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });

    const send = () => {
      const timestamp = new Date().toISOString();
      const updates = advanceCourierLocations().map((courier) => ({
        courierId: courier.id,
        lat: courier.location.lat,
        lng: courier.location.lng,
        heading: courier.location.heading,
        timestamp
      }));
      res.write(`event: locations\n`);
      res.write(`data: ${JSON.stringify({ updates, timestamp })}\n\n`);
    };

    send();
    const interval = setInterval(send, 5000);
    req.on("close", () => clearInterval(interval));
  });

  return app;
}
