import { Scale, User, LogOut } from "lucide-react";
import { AnalysisAndForecast } from "./components/AnalysisAndForecast";
import { ExpensesAndMaintenance } from "./components/ExpensesAndMaintenance";
import { FuelAndServiceStats } from "./components/FuelAndServiceStats";
import { QuickKPIs } from "./components/QuickKPIs";
import { VehicleHero } from "./components/VehicleHero";
import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="font-bold text-xl">CarCare</h1>
        <div className="flex gap-2">
          <Button variant="ghost">
            <Scale className="mr-2 h-4 w-4" /> Comparer
          </Button>
          <Button variant="ghost">
            <User className="mr-2 h-4 w-4" /> Profil
          </Button>
          <Button variant="ghost">
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>
      <main className="space-y-4">
        <VehicleHero />
        <QuickKPIs />
        <ExpensesAndMaintenance />
        <FuelAndServiceStats />
        <AnalysisAndForecast />
      </main>
    </div>
  );
}

export default App;
