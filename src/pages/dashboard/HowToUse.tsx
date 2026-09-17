import {
  Building2,
  Mail,
  FileText,
  Settings,
  Users,
  BadgeIndianRupee,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet";

const HowToUse = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <Helmet>
        <title>Pathfinder | How to Use</title>
        <meta
          name="description"
          content="Learn how to navigate and make the most of Pathfinder, your ultimate platform for startup discovery and career growth."
        />
        <link rel="canonical" href={`${window.location.origin}/how-to-use`} />
        <meta property="og:title" content="Pathfinder | How to Use" />
        <meta
          property="og:description"
          content="Learn how to navigate and make the most of Pathfinder."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${window.location.origin}/how-to-use`}
        />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | How to Use" />
        <meta
          name="twitter:description"
          content="Learn how to navigate and make the most of Pathfinder."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
      </Helmet>

      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">How to Use Pathfinder 🚀</h1>
        <p className="text-lg text-muted-foreground">
          Your all-in-one platform for startup discovery and career growth
        </p>
      </div>

      {/* Welcome Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Sparkles className="h-12 w-12 mx-auto text-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Welcome to Pathfinder!</h2>
            <p className="text-lg text-muted-foreground">
              We're excited to help you discover amazing startups and land your
              dream internship!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Explore Startups */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <ArrowRight className="h-6 w-6" />
            Explore Startups 🚀
          </h2>
          <p className="text-muted-foreground mb-6">
            Discover innovative companies and their opportunities
          </p>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-6 w-6 text-foreground mt-1" />
                  <div>
                    <h4 className="font-medium">Startup Directory</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Browse through curated startups, view their details, and
                      save the ones you're interested in
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Save Favorites</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bookmark startups and track your applications in one place
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <ArrowRight className="h-6 w-6" />
            Email Templates 📧
          </h2>
          <p className="text-muted-foreground mb-6">
            Professional templates to reach out to startups
          </p>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Ready-to-use Templates</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Access professional email templates for cold outreach,
                      follow-ups, and applications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Customize & Track</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Personalize templates and keep track of your email
                      outreach
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tools & Resources */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <ArrowRight className="h-6 w-6" />
            Tools & Resources 🛠️
          </h2>
          <p className="text-muted-foreground mb-6">
            Everything you need for your job search
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto text-foreground mb-2" />
                  <h4 className="font-medium text-sm">Resume Templates</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Professional resume formats
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Settings className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <h4 className="font-medium text-sm">Profile Settings</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Customize your experience
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <h4 className="font-medium text-sm">Meet the Team</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Learn about Pathfinder creators
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <BadgeIndianRupee className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <h4 className="font-medium text-sm">Support Us</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Help keep Pathfinder free
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground">
              Explore the sidebar navigation to access all features and start
              your journey with Pathfinder!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HowToUse;
