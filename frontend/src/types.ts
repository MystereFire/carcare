export interface Vehicle {
  id: string;
  name: string;
  image: string;
  initialKm: number;
  currentKm: number;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  date: string;
  km: number;
  type: "fuel" | "repair" | "maintenance";
}

export interface Maintenance {
  id: string;
  label: string;
  dueKm: number;
  dueDate: string;
}

export interface KPI {
  id: string;
  label: string;
  value: string;
  trend: number[];
  color: string;
}

export interface SeriesPoint {
  date: string;
  value: number;
  type?: string;
}
