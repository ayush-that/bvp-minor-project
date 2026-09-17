// Authentication removed - all content is now public
type PublicGateProps = {
  to: string;
  children: React.ReactNode;
};

export function PublicGate({ children }: PublicGateProps) {
  return <>{children}</>;
}
