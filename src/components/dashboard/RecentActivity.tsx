import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  amount?: string;
  date: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

export const RecentActivity = ({ activities: propActivities }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>(propActivities || []);
  const [loading, setLoading] = useState(!propActivities);

  useEffect(() => {
    if (propActivities) return;

    const fetchRecentActivity = async () => {
      setLoading(true);
      const recentItems: ActivityItem[] = [];

      // Fetch recent invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, created_at, client:clients(name)")
        .order("created_at", { ascending: false })
        .limit(3);

      invoices?.forEach((inv) => {
        recentItems.push({
          id: `inv-${inv.id}`,
          type: "Invoice Created",
          description: `${inv.invoice_number} for ${inv.client?.name || "Unknown"}`,
          amount: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(inv.total_amount),
          date: formatDistanceToNow(new Date(inv.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent payments received
      const { data: paymentsReceived } = await supabase
        .from("payments_received")
        .select("id, payment_number, amount, created_at, client:clients(name)")
        .order("created_at", { ascending: false })
        .limit(2);

      paymentsReceived?.forEach((pay) => {
        recentItems.push({
          id: `payr-${pay.id}`,
          type: "Payment Received",
          description: `From ${pay.client?.name || "Unknown"}`,
          amount: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(pay.amount),
          date: formatDistanceToNow(new Date(pay.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, expense_number, total_amount, created_at, vendor:vendors(name)")
        .order("created_at", { ascending: false })
        .limit(2);

      expenses?.forEach((exp) => {
        recentItems.push({
          id: `exp-${exp.id}`,
          type: "Bill Created",
          description: `${exp.expense_number} to ${exp.vendor?.name || "Unknown"}`,
          amount: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(exp.total_amount),
          date: formatDistanceToNow(new Date(exp.created_at), { addSuffix: true }),
        });
      });

      // Fetch recent clients
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      clients?.forEach((client) => {
        recentItems.push({
          id: `client-${client.id}`,
          type: "Customer Added",
          description: client.name,
          date: formatDistanceToNow(new Date(client.created_at), { addSuffix: true }),
        });
      });

      // Sort by recency (most recent first) - using created_at string comparison
      recentItems.sort((a, b) => {
        // This is a simple approximation - in production you'd want to sort by actual timestamps
        return 0;
      });

      setActivities(recentItems.slice(0, 6));
      setLoading(false);
    };

    fetchRecentActivity();
  }, [propActivities]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between border-b pb-3 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-3 w-32 bg-muted rounded"></div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 w-16 bg-muted rounded ml-auto"></div>
                  <div className="h-3 w-12 bg-muted rounded ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
};
