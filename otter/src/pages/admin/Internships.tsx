import { useState } from "react";
import { Briefcase, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { PageHeader, PageHeaderAction } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data
const internships = [
  {
    id: "1",
    role: "Test",
    companyName: "Test",
    location: "Test",
    stipend: "Test",
    status: "active",
    postedDate: "2024-02-15",
    applications: 45,
    domain: ["Product", "Growth"],
  },
];

export function AdminInternships() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div>
      <PageHeader
        title="Manage Internships"
        description="Add and manage internship listings"
        icon={Briefcase}>
        <PageHeaderAction icon={Plus}>Add Internship</PageHeaderAction>
      </PageHeader>

      {/* Search and filters */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search internships..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      {/* Internship listings */}
      <div className="space-y-4">
        {internships.map((internship) => (
          <Card key={internship.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{internship.role}</CardTitle>
                  <CardDescription className="mt-1">
                    {internship.companyName}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    internship.status === "active" ? "success" : "secondary"
                  }>
                  {internship.status.charAt(0).toUpperCase() +
                    internship.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {internship.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Stipend</p>
                  <p className="text-sm text-muted-foreground">
                    {internship.stipend}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Applications</p>
                  <p className="text-sm text-muted-foreground">
                    {internship.applications || 0} received
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {internship.domain.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-end space-x-2">
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
