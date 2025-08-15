import {
  fuelSeries,
  monthlyExpenses,
  consumptionSeries,
  kpis,
} from "../data/mock";
import { formatCurrency } from "../lib/utils";
import { Card, CardContent } from "./ui/card";
import { TrendLine } from "./Charts/TrendLine";
import { MonthlyBar } from "./Charts/MonthlyBar";
import { PieDistribution } from "./Charts/PieDistribution";
import { LineConsumption } from "./Charts/LineConsumption";

export const FuelAndServiceStats: React.FC = () => {
  const cumulative = monthlyExpenses.reduce((s, p) => s + p.value, 0);
  const cumulativeSeries = monthlyExpenses.map((p, i) => ({
    date: p.date,
    value: monthlyExpenses
      .slice(0, i + 1)
      .reduce((sum, q) => sum + q.value, 0),
  }));

  return (
    <section className="p-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Coût au litre</span>
              <span className="font-bold">{fuelSeries.at(-1)?.value.toFixed(2)} €</span>
            </div>
            <TrendLine data={fuelSeries.map((p) => p.value)} color="#6366f1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Coût moyen 100km</span>
              <span className="font-bold">{kpis[0].value}</span>
            </div>
            <TrendLine data={kpis[0].trend} color="#22c55e" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dépenses cumulées</span>
              <span className="font-bold">{formatCurrency(cumulative)}</span>
            </div>
            <TrendLine data={cumulativeSeries.map((p) => p.value)} color="#8b5cf6" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <MonthlyBar data={monthlyExpenses} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <PieDistribution data={monthlyExpenses} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <LineConsumption data={consumptionSeries} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
