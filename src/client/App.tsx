import { useCallback, useEffect, useState } from "react";
import { assignNextOrder, fetchDashboard, fetchOrderCount } from "./api";
import { buildCourierDashboardRows } from "./performance";
import { applyLocationUpdates, useLiveLocations } from "./useLiveLocations";
import type { AssignmentResponse, Courier, Order } from "../shared/types";
import "./styles.css";

export function App() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [generatedAt, setGeneratedAt] = useState("");
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then((snapshot) => {
        setCouriers(snapshot.couriers);
        setOrders(snapshot.orders);
        setGeneratedAt(snapshot.generatedAt);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const handleLocationUpdates = useCallback((updates) => {
    setCouriers((current) => applyLocationUpdates(current, updates));
  }, []);

  useLiveLocations(handleLocationUpdates);

  const rows = buildCourierDashboardRows(couriers, orders);
  const assignedCouriers = couriers.filter((courier) => courier.status === "assigned").length;
  const pendingOrders = orders.filter((order) => order.status === "pending").length;

  const runOrderCount = async () => {
    const to = new Date("2026-06-20T12:00:00.000Z");
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    const result = await fetchOrderCount(from.toISOString(), to.toISOString());
    setOrderCount(result.count);
  };

  const runAssignment = async () => {
    const result = await assignNextOrder();
    setAssignment(result);
    const snapshot = await fetchDashboard(0);
    setCouriers(snapshot.couriers);
    setOrders(snapshot.orders);
    setGeneratedAt(snapshot.generatedAt);
  };

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <p className="eyebrow">DispatchLive Ops</p>
          <h1>Realtime rider and delivery tracking</h1>
        </div>
        <div className="live-pill">
          <span aria-hidden="true" />
          5s location stream
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="metrics-grid" aria-label="Dispatch metrics">
        <article>
          <span>Active couriers</span>
          <strong>{couriers.length}</strong>
        </article>
        <article>
          <span>Assigned couriers</span>
          <strong>{assignedCouriers}</strong>
        </article>
        <article>
          <span>Pending orders</span>
          <strong>{pendingOrders}</strong>
        </article>
        <article>
          <span>Last snapshot</span>
          <strong>{generatedAt ? new Date(generatedAt).toLocaleTimeString() : "--"}</strong>
        </article>
      </section>

      <section className="action-bar">
        <button type="button" onClick={runOrderCount}>Count last 24h orders</button>
        <button type="button" onClick={runAssignment}>Assign next order</button>
        <span>{orderCount === null ? "No count requested" : `${orderCount} orders in range`}</span>
        <span>{assignment?.assigned ? `Assigned ${assignment.order?.id}` : assignment?.reason ?? ""}</span>
      </section>

      <section className="dashboard-table" aria-label="Courier dashboard">
        <div className="table-head">
          <span>Courier</span>
          <span>Status</span>
          <span>Load</span>
          <span>Active orders</span>
          <span>Nearby pending</span>
          <span>Updated</span>
        </div>
        {rows.slice(0, 80).map((row) => (
          <div className="table-row" key={row.courierId}>
            <span>{row.name}</span>
            <span>{row.status}</span>
            <span>{row.loadLabel}</span>
            <span>{row.activeOrders}</span>
            <span>{row.nearbyPendingOrders}</span>
            <span>{new Date(row.lastUpdated).toLocaleTimeString()}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
