import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { LineConsumption } from "./Charts/LineConsumption";
import { TrendLine } from "./Charts/TrendLine";
import {
  consumptionSeries,
  monthlyExpenses,
  vehicle,
} from "../data/mock";
import { formatCurrency, formatKm } from "../lib/utils";

const categories = ["fuel", "repair", "maintenance"] as const;

type Category = (typeof categories)[number];

export const AnalysisAndForecast: React.FC = () => {
  const [filter, setFilter] = useState<Category>("fuel");
  const filtered = monthlyExpenses.filter((p) => p.type === filter);
  const sum = filtered.reduce((s, p) => s + p.value, 0);
  const avgKmPerDay =
    (vehicle.currentKm - vehicle.initialKm) / 365;
  const kmSeries = [
    vehicle.initialKm,
    vehicle.initialKm + 10000,
    vehicle.initialKm + 20000,
    vehicle.currentKm,
  ];

  return (
    <section className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            variant={filter === c ? "default" : "outline"}
            onClick={() => setFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Conso moyenne</p>
            <p className="font-bold">6.2 L/100km</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Autonomie plein</p>
            <p className="font-bold">750 km</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Budget annuel</p>
            <p className="font-bold">{formatCurrency(sum)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <LineConsumption data={consumptionSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Moyenne km/jour</span>
              <span className="font-bold">{avgKmPerDay.toFixed(1)}</span>
            </div>
            <TrendLine data={kmSeries} color="#6366f1" />
            <span className="text-xs text-muted-foreground">
              {formatKm(vehicle.initialKm)} → {formatKm(vehicle.currentKm)}
            </span>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
