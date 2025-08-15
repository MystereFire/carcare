import { kpis } from "../data/mock";
import { Card, CardContent } from "./ui/card";
import { TrendLine } from "./Charts/TrendLine";

export const QuickKPIs: React.FC = () => (
  <div className="grid gap-4 p-4 sm:grid-cols-3">
    {kpis.map((kpi) => (
      <Card
        key={kpi.id}
        style={{ borderLeftColor: kpi.color, borderLeftWidth: 4 }}
      >
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">{kpi.label}</span>
            <span className="font-bold">{kpi.value}</span>
          </div>
          <TrendLine data={kpi.trend} color={kpi.color} />
        </CardContent>
      </Card>
    ))}
  </div>
);
