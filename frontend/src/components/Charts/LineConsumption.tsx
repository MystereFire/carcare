import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeriesPoint } from "../../types";

interface Props {
  data: SeriesPoint[];
}

export const LineConsumption: React.FC<Props> = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);
