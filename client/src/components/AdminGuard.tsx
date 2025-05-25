import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard component that redirects admin profiles to the admin page
 * and shows a loading state while checking authentication
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect admin profiles to admin page
  useEffect(() => {
    if (!loading && isAdmin) {
      setLocation("/admin");
    }
  }, [isAdmin, loading, setLocation]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  // If admin, don't render content (redirect is happening)
  if (isAdmin) {
    return null;
  }

  // Render regular content for non-admin profiles
  return <>{children}</>;
}
