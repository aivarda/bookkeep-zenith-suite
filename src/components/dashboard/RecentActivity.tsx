
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  amount?: string;
  date: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex justify-between border-b pb-3">
              <div>
                <div className="font-medium">{activity.type}</div>
                <div className="text-sm text-muted-foreground">{activity.description}</div>
              </div>
              <div className="text-right">
                {activity.amount && <div className="font-medium">{activity.amount}</div>}
                <div className="text-sm text-muted-foreground">{activity.date}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
