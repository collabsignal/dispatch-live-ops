export type CourierStatus = "available" | "assigned" | "break";
export type VehicleType = "bike" | "scooter" | "car";
export type OrderStatus = "pending" | "assigned" | "picked_up" | "delivered" | "cancelled";
export type Priority = "standard" | "rush" | "vip";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Courier {
  id: string;
  name: string;
  status: CourierStatus;
  vehicle: VehicleType;
  capacity: number;
  currentLoad: number;
  location: GeoPoint & {
    heading: number;
    lastUpdated: string;
  };
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  priority: Priority;
  pickup: GeoPoint & {
    address: string;
  };
  dropoff: GeoPoint & {
    address: string;
  };
  promisedBy: string;
  assignedCourierId?: string;
}

export interface LocationUpdate {
  courierId: string;
  lat: number;
  lng: number;
  heading: number;
  timestamp: string;
}

export interface DashboardSnapshot {
  couriers: Courier[];
  orders: Order[];
  generatedAt: string;
}

export interface OrderCountResponse {
  from: string;
  to: string;
  count: number;
}

export interface AssignmentResponse {
  assigned: boolean;
  reason?: string;
  order?: Order;
  courier?: Courier;
}

export interface CourierDashboardRow {
  courierId: string;
  name: string;
  status: CourierStatus;
  activeOrders: number;
  nearbyPendingOrders: number;
  loadLabel: string;
  lastUpdated: string;
}
