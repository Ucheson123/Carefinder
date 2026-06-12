import { useState, useEffect } from 'react';
import { User, PlusSquare, LogOut, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  session: any;
  onOpenAuth: () => void;
}

export default function Header({ session, onOpenAuth }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if the current user is an admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!session) {
        setIsAdmin(false);
        return;
      }
      
      try {
        // We use the rpc call to hit the secure function you created in Supabase
        const { data, error } = await supabase.rpc('is_admin');
        if (error) throw error;
        
        setIsAdmin(data); // Will set true or false based on the database
      } catch (error) {
        console.error("Error verifying admin status:", error);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#d8dadc] z-20 shadow-sm shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <PlusSquare className="w-6 h-6 text-[#006a61]" />
        <span className="text-xl font-bold text-[#191c1e]">Carefinder</span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-8 text-[#45464d] font-medium text-sm justify-center">
        <Link to="/" className="text-[#006a61] border-b-2 border-[#006a61] pb-1 font-semibold justify-center items-center">
          Find Care
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {session ? (
          <>
            {/* CONDITIONAL ADMIN BUTTON */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-md transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Dashboard
              </Link>
            )}

            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-[#86f2e4] text-[#005049] rounded-full flex items-center justify-center font-bold text-sm">
                {session.user.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="text-[#45464d] hover:text-[#191c1e] transition-colors"><User className="w-5 h-5" /></button>
            <button onClick={onOpenAuth} className="px-4 py-2 bg-[#006a61] text-white text-sm font-semibold rounded-lg hover:bg-[#005049] transition-colors">
              Sign In
            </button>
          </>
        )}
      </div>
    </header>
  );
}