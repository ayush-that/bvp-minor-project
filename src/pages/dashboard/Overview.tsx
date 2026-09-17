import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Mail,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { MOCK_USER } from "@/utils/mockUser";

const stats = [
  {
    title: "Saved Internships",
    value: "12",
    description: "3 new this week",
    icon: Briefcase,
  },
  {
    title: "Saved Startups",
    value: "8",
    description: "2 are hiring",
    icon: Building2,
  },
  {
    title: "Emails Sent",
    value: "24",
    description: "65% response rate",
    icon: Mail,
  },
  {
    title: "Profile Views",
    value: "156",
    description: "↑ 23% this month",
    icon: TrendingUp,
  },
];

export function DashboardOverview() {
  // Using mock user for development
  const user = MOCK_USER;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || "Guest"}`}
        description="Here's what's happening with your job search"
        icon={LayoutDashboard}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                New internship matches
              </CardTitle>
              <CardDescription>
                3 new internships match your preferences
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Email response received
              </CardTitle>
              <CardDescription>
                TechCo PM responded to your outreach
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Startup started hiring
              </CardTitle>
              <CardDescription>
                InnovateAI opened 2 new internship positions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
