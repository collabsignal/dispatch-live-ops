import type { Courier, CourierStatus, GeoPoint, Order, OrderStatus, Priority } from "../shared/types";

export interface DispatchState {
  couriers: Courier[];
  orders: Order[];
  lastLocationTick: number;
}

const BASE_TIME = Date.parse("2026-06-20T12:00:00.000Z");
const CENTER: GeoPoint = { lat: 37.7749, lng: -122.4194 };
const ORDER_STATUSES: OrderStatus[] = ["pending", "assigned", "picked_up", "delivered", "cancelled"];
const PRIORITIES: Priority[] = ["standard", "rush", "vip"];
const VEHICLES = ["bike", "scooter", "car"] as const;
const FIRST_NAMES = ["Ari", "Blair", "Casey", "Dev", "Eli", "Fin", "Gray", "Harper", "Indra", "Jules"];
const LAST_NAMES = ["Patel", "Rivera", "Chen", "Morris", "Okafor", "Singh", "Kim", "Lopez", "Nguyen", "Bennett"];

let state = createSeedState();

function seededRandom(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, min: number, max: number): number {
  return min + (max - min) * random();
}

function courierName(index: number): string {
  return `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]}`;
}

function createCourier(index: number, random: () => number): Courier {
  const status: CourierStatus = index % 7 === 0 ? "assigned" : index % 19 === 0 ? "break" : "available";
  const capacity = index % 5 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
  const currentLoad = status === "assigned" ? Math.max(1, index % capacity) : 0;

  return {
    id: `courier-${String(index + 1).padStart(3, "0")}`,
    name: courierName(index),
    status,
    vehicle: VEHICLES[index % VEHICLES.length],
    capacity,
    currentLoad,
    location: {
      lat: CENTER.lat + between(random, -0.08, 0.08),
      lng: CENTER.lng + between(random, -0.08, 0.08),
      heading: Math.round(between(random, 0, 359)),
      lastUpdated: new Date(BASE_TIME).toISOString()
    }
  };
}

function createOrder(index: number, random: () => number, couriers: Courier[]): Order {
  const status = ORDER_STATUSES[index % ORDER_STATUSES.length];
  const createdOffsetMinutes = index * 4 + Math.floor(between(random, 0, 60));
  const createdAt = new Date(BASE_TIME - createdOffsetMinutes * 60_000).toISOString();
  const priority = PRIORITIES[index % PRIORITIES.length];
  const assignedCourierId = status === "pending" || status === "cancelled"
    ? undefined
    : couriers[index % couriers.length].id;

  return {
    id: `order-${String(index + 1).padStart(5, "0")}`,
    createdAt,
    status,
    priority,
    pickup: {
      lat: CENTER.lat + between(random, -0.1, 0.1),
      lng: CENTER.lng + between(random, -0.1, 0.1),
      address: `${100 + (index % 800)} Market St`
    },
    dropoff: {
      lat: CENTER.lat + between(random, -0.1, 0.1),
      lng: CENTER.lng + between(random, -0.1, 0.1),
      address: `${200 + (index % 700)} Mission St`
    },
    promisedBy: new Date(Date.parse(createdAt) + (30 + (index % 40)) * 60_000).toISOString(),
    assignedCourierId
  };
}

export function createSeedState(): DispatchState {
  const random = seededRandom(42);
  const couriers = Array.from({ length: 500 }, (_, index) => createCourier(index, random));
  const orders = Array.from({ length: 2500 }, (_, index) => createOrder(index, random, couriers));
  return { couriers, orders, lastLocationTick: -1 };
}

export function resetState(): DispatchState {
  state = createSeedState();
  return state;
}

export function getState(): DispatchState {
  return state;
}

export function advanceCourierLocations(now = Date.now()): Courier[] {
  const tick = Math.floor(now / 5000);
  if (tick === state.lastLocationTick) {
    return state.couriers;
  }

  state.lastLocationTick = tick;
  state.couriers = state.couriers.map((courier, index) => {
    if (courier.status === "break") {
      return courier;
    }

    const phase = tick / 8 + index;
    const lat = courier.location.lat + Math.sin(phase) * 0.00035;
    const lng = courier.location.lng + Math.cos(phase) * 0.00035;

    return {
      ...courier,
      location: {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        heading: Math.round((courier.location.heading + 13 + index) % 360),
        lastUpdated: new Date(now).toISOString()
      }
    };
  });

  return state.couriers;
}

export function listCouriers(status?: CourierStatus): Courier[] {
  advanceCourierLocations();
  return status ? state.couriers.filter((courier) => courier.status === status) : state.couriers;
}

export function listOrders(options: { status?: OrderStatus; limit?: number } = {}): Order[] {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 5000);
  const filtered = options.status
    ? state.orders.filter((order) => order.status === options.status)
    : state.orders;
  return filtered
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function countOrdersInWindow(from: Date, to: Date): number {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return state.orders.filter((order) => {
    const created = Date.parse(order.createdAt);
    return created >= fromMs && created < toMs;
  }).length;
}

export function assignOrder(orderId: string, courierId: string) {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!order) {
    return { assigned: false, reason: "order_not_found" as const };
  }

  const courier = state.couriers.find((candidate) => candidate.id === courierId);
  if (!courier) {
    return { assigned: false, reason: "courier_not_found" as const };
  }

  if (order.status !== "pending") {
    return { assigned: false, reason: "order_not_pending" as const, order, courier };
  }

  if (courier.status === "break" || courier.currentLoad >= courier.capacity) {
    return { assigned: false, reason: "courier_unavailable" as const, order, courier };
  }

  order.status = "assigned";
  order.assignedCourierId = courier.id;
  courier.currentLoad += 1;
  courier.status = "assigned";

  return { assigned: true, order, courier };
}

export function parseDateParam(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
