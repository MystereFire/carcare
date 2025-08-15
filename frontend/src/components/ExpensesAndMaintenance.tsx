import { lastExpense, nextMaintenance, vehicle } from "../data/mock";
import { formatCurrency, formatKm } from "../lib/utils";
import { Card, CardContent } from "./ui/card";

export const ExpensesAndMaintenance: React.FC = () => {
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(nextMaintenance.dueDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const kmLeft = nextMaintenance.dueKm - vehicle.currentKm;

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Dernière dépense</span>
          <span className="font-bold">
            {lastExpense.label} - {formatCurrency(lastExpense.amount)}
          </span>
          <span className="text-xs text-muted-foreground">
            {lastExpense.date} · {formatKm(lastExpense.km)}
          </span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Prochain entretien</span>
          <span className="font-bold">{nextMaintenance.label}</span>
          <span className="text-xs text-muted-foreground">
            {formatKm(kmLeft)} ou {daysLeft} jours restants
          </span>
        </CardContent>
      </Card>
    </div>
  );
};
