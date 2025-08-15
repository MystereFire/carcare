import { Expense, KPI, Maintenance, SeriesPoint, Vehicle } from "../types";

export const vehicle: Vehicle = {
  id: "1",
  name: "Voiture 308 2011",
  image:
    "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  initialKm: 100000,
  currentKm: 135500,
};

export const kpis: KPI[] = [
  {
    id: "cost",
    label: "Coût/100km",
    value: "5 €",
    trend: [4, 5, 5, 6, 5],
    color: "#22c55e",
  },
  {
    id: "consumption",
    label: "Conso moyenne",
    value: "6.2 L",
    trend: [6.5, 6.3, 6.4, 6.1, 6.2],
    color: "#f97316",
  },
  {
    id: "budget",
    label: "Budget annuel",
    value: "1200 €",
    trend: [1000, 1100, 1150, 1200, 1200],
    color: "#8b5cf6",
  },
];

export const lastExpense: Expense = {
  id: "exp1",
  label: "Plein carburant",
  amount: 80,
  date: "2024-06-01",
  km: 135000,
  type: "fuel",
};

export const nextMaintenance: Maintenance = {
  id: "mnt1",
  label: "Vidange",
  dueKm: 140000,
  dueDate: "2024-09-01",
};

export const fuelSeries: SeriesPoint[] = [
  { date: "Jan", value: 1.9 },
  { date: "Feb", value: 2.0 },
  { date: "Mar", value: 1.95 },
  { date: "Apr", value: 2.1 },
  { date: "May", value: 2.05 },
];

export const monthlyExpenses: SeriesPoint[] = [
  { date: "Jan", value: 200, type: "fuel" },
  { date: "Feb", value: 150, type: "repair" },
  { date: "Mar", value: 220, type: "fuel" },
  { date: "Apr", value: 300, type: "maintenance" },
  { date: "May", value: 180, type: "fuel" },
];

export const consumptionSeries: SeriesPoint[] = [
  { date: "Jan", value: 6.5 },
  { date: "Feb", value: 6.3 },
  { date: "Mar", value: 6.4 },
  { date: "Apr", value: 6.1 },
  { date: "May", value: 6.2 },
];
