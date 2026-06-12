import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  session: any;
  children: React.ReactNode;
}

export default function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      if (!session) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) throw error;
        setIsAdmin(data);
      } catch (error) {
        setIsAdmin(false);
      }
    }

    verifyAccess();
  }, [session]);

  // Wait while the database checks their status
  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="w-8 h-8 animate-spin text-[#006a61]" />
      </div>
    );
  }

  // Kick them back to home if they are not logged in OR not an admin
  if (!session || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}