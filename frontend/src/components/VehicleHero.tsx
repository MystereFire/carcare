import { motion } from "framer-motion";
import { Plus, Edit, Notebook, FileText } from "lucide-react";
import { vehicle } from "../data/mock";
import { formatKm } from "../lib/utils";
import { Button } from "./ui/button";
import { useToast } from "./ToastProvider";

export const VehicleHero: React.FC = () => {
  const toast = useToast();
  return (
    <motion.section
      className="flex flex-col items-center gap-4 p-4 md:flex-row"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <img
        src={vehicle.image}
        alt={vehicle.name}
        className="h-40 w-full max-w-sm rounded-2xl object-cover shadow"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{vehicle.name}</h1>
        <p className="text-sm text-muted-foreground">
          {formatKm(vehicle.initialKm)} → {formatKm(vehicle.currentKm)}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={() => toast({ title: "Ajout dépense" })}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter dépense
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
          <Button variant="outline">
            <Notebook className="mr-2 h-4 w-4" /> Carnet
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Relevé
          </Button>
        </div>
      </div>
    </motion.section>
  );
};
