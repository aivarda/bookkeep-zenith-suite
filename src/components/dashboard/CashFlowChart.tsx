
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Apr', amount: 240000 },
  { month: 'May', amount: 150000 },
  { month: 'Jun', amount: 100000 },
  { month: 'Jul', amount: 120000 },
  { month: 'Aug', amount: 130000 },
  { month: 'Sep', amount: 150000 },
  { month: 'Oct', amount: 170000 },
  { month: 'Nov', amount: 190000 },
  { month: 'Dec', amount: 210000 },
  { month: 'Jan', amount: 230000 },
  { month: 'Feb', amount: 250000 },
  { month: 'Mar', amount: 270000 },
];

export const CashFlowChart = () => {
  const formatter = (value: number) => `₹${(value / 1000)}k`;
  
  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cash Flow</CardTitle>
          <select className="text-sm border rounded px-2 py-1">
            <option>Previous Fiscal Year</option>
            <option>Current Fiscal Year</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatter} />
              <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#0057FF"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
