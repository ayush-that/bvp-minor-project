import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Landing } from "./pages/Landing";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute";

// Dashboard Pages
import { Internships } from "./pages/dashboard/Internships";
import { Startups } from "./pages/dashboard/Startups";
import { EmailTracker } from "./pages/dashboard/EmailTracker";
import { Bookmarks } from "./pages/dashboard/Bookmarks";
import { Settings } from "./pages/dashboard/Settings";
import { StartupDetail } from "./pages/dashboard/StartupDetail";
import { Newsletter } from "./pages/dashboard/Newsletter";
import Donate from "./pages/dashboard/Donate";
import Team from "./pages/dashboard/Team";
import HowToUse from "./pages/dashboard/HowToUse";
import ATScore from "./pages/dashboard/ATScore";
import LinkedInAnalyzer from "./pages/dashboard/LinkedInAnalyzer";
import { Pathfinder } from "./pages/dashboard/Pathfinder";
// Public pages
import PublicStartups from "./pages/PublicStartups";
import PublicEmails from "./pages/PublicEmails";
import PublicResumes from "./pages/PublicResumes";
import PublicATS from "./pages/PublicATS";
import PublicHeadshot from "./pages/PublicHeadshot";
import { PublicGate } from "./components/auth/PublicGate";
// Guides removed

// App Pages (consolidated under dashboard)
import { Resumes } from "./pages/dashboard/Resumes";
import { Headshot } from "./pages/dashboard/Headshot";

// Admin Pages
import { AdminLayout } from "./components/layout/AdminLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminInternships } from "./pages/admin/Internships";
import { AdminStartups } from "./pages/admin/Startups";
import { AdminEmails } from "./pages/admin/Emails";

//
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import GAListener from "./components/GAListener";

function App() {
  return (
    <Router>
      {/* Send GA4 page_view on SPA route changes */}
      <GAListener />
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Landing />
            </PublicLayout>
          }
        />
        {/* Sign-in removed - authentication disabled */}
        {/* Public informational routes */}
        <Route
          path="/team"
          element={
            <PublicLayout>
              <PublicGate to="/app/team">
                <Team />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/support"
          element={
            <PublicLayout>
              <PublicGate to="/app/donate">
                <Donate />
              </PublicGate>
            </PublicLayout>
          }
        />
        {/* Backward compatibility */}
        <Route path="/donate" element={<Navigate to="/support" replace />} />
        {/* Public feature pages */}
        <Route
          path="/startups"
          element={
            <PublicLayout>
              <PublicGate to="/app/startups">
                <PublicStartups />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/emails"
          element={
            <PublicLayout>
              <PublicGate to="/app/emails">
                <PublicEmails />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/resumes"
          element={
            <PublicLayout>
              <PublicGate to="/app/resumes">
                <PublicResumes />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/ats"
          element={
            <PublicLayout>
              <PublicGate to="/app/ats">
                <PublicATS />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/headshot"
          element={
            <PublicLayout>
              <PublicGate to="/app/headshot">
                <PublicHeadshot />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/newsletter"
          element={
            <PublicLayout>
              <PublicGate to="/app/newsletter">
                <Newsletter />
              </PublicGate>
            </PublicLayout>
          }
        />
        <Route
          path="/how-to-use"
          element={
            <PublicLayout>
              <HowToUse />
            </PublicLayout>
          }
        />

        {/* Guides removed */}

        {/* Protected dashboard routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Startups />} />
          <Route path="internships" element={<Internships />} />
          <Route path="pathfinder" element={<Pathfinder />} />
          <Route path="startups" element={<Startups />} />
          <Route path="startups/:id" element={<StartupDetail />} />
          <Route path="emails" element={<EmailTracker />} />
          <Route path="resumes" element={<Resumes />} />
          <Route path="ats" element={<ATScore />} />
          <Route path="headshot" element={<Headshot />} />
          <Route path="linkedin" element={<LinkedInAnalyzer />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="settings" element={<Settings />} />
          {/* Keep legacy nested routes to avoid breaking existing links */}
          <Route path="how-to-use" element={<HowToUse />} />
          <Route path="donate" element={<Donate />} />
          <Route path="support" element={<Donate />} />
          <Route path="team" element={<Team />} />
        </Route>

        {/* Alias /dashboard to the same app shell */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Startups />} />
          <Route path="internships" element={<Internships />} />
          <Route path="pathfinder" element={<Pathfinder />} />
          <Route path="startups" element={<Startups />} />
          <Route path="startups/:id" element={<StartupDetail />} />
          <Route path="emails" element={<EmailTracker />} />
          <Route path="resumes" element={<Resumes />} />
          <Route path="ats" element={<ATScore />} />
          <Route path="headshot" element={<Headshot />} />
          <Route path="linkedin" element={<LinkedInAnalyzer />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="settings" element={<Settings />} />
          <Route path="how-to-use" element={<HowToUse />} />
          <Route path="donate" element={<Donate />} />
          <Route path="support" element={<Donate />} />
          <Route path="team" element={<Team />} />
        </Route>

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="internships" element={<AdminInternships />} />
          <Route path="startups" element={<AdminStartups />} />
          <Route path="emails" element={<AdminEmails />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;
