import type { AssignmentResponse, DashboardSnapshot, OrderCountResponse } from "../shared/types";

export async function fetchDashboard(latencyMs = 500): Promise<DashboardSnapshot> {
  const response = await fetch(`/api/dashboard?latencyMs=${latencyMs}`);
  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchOrderCount(from: string, to: string): Promise<OrderCountResponse> {
  const params = new URLSearchParams({ from, to });
  const response = await fetch(`/api/orders/count?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Order count request failed: ${response.status}`);
  }
  return response.json();
}

export async function assignNextOrder(): Promise<AssignmentResponse> {
  const response = await fetch("/api/dispatch/assign-next", { method: "POST" });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Assignment request failed: ${response.status}`);
  }
  return response.json();
}
