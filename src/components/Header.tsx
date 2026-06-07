import { Bell, User, PlusSquare, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  session: any;
  onOpenAuth: () => void;
}

export default function Header({ session, onOpenAuth }: HeaderProps) {
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#d8dadc] z-20 shadow-sm shrink-0">
      <div className="flex items-center gap-2">
        <PlusSquare className="w-6 h-6 text-[#006a61]" />
        <span className="text-xl font-bold text-[#191c1e]">Carefinder</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 text-[#45464d] font-medium text-sm justify-center">
        <a href="#" className="text-[#006a61] border-b-2 border-[#006a61] pb-1 font-semibold justify-center items center">Find Care</a>
      </nav>

      <div className="flex items-center gap-4">
        {session ? (
          <>
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