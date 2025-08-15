import { Line, LineChart, ResponsiveContainer } from "recharts";

interface TrendLineProps {
  data: number[];
  color: string;
}

export const TrendLine: React.FC<TrendLineProps> = ({ data, color }) => {
  const chartData = data.map((v, i) => ({ index: i, value: v }));
  return (
    <ResponsiveContainer width="100%" height={30}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};
