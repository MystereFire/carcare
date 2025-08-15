import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SeriesPoint } from "../../types";

interface Props {
  data: SeriesPoint[];
}

export const PieDistribution: React.FC<Props> = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="type"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#6366f1"
        label
      />
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);
