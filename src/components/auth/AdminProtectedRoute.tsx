// Authentication removed - all routes are now public
export function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
