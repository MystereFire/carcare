import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeriesPoint } from "../../types";

interface Props {
  data: SeriesPoint[];
}

export const MonthlyBar: React.FC<Props> = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip cursor={{ fill: "transparent" }} />
      <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
