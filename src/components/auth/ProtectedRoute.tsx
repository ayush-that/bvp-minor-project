// Authentication removed - all routes are now public
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
