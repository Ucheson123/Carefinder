import { Home, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fb] px-6 text-center font-sans animate-in fade-in duration-500">
      
      {/* Gentle Icon Graphic */}
      <div className="w-24 h-24 bg-[#e6f7f5] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#b2e5df]">
        <Heart className="w-10 h-10 text-[#006a61]" fill="#006a61" fillOpacity={0.2} />
      </div>

      {/* Comforting Copy */}
      <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-3 tracking-tight">
        Looks like you took a wrong turn.
      </h1>
      <p className="text-[#45464d] max-w-md mx-auto mb-8 text-base md:text-lg leading-relaxed">
        We couldn't find the page you're looking for, but don't worry—we're still right here to help you find the care you need.
      </p>

      {/* Action Button */}
      <Link 
        to="/" 
        className="flex items-center gap-2 px-6 py-3 bg-[#006a61] text-white font-semibold rounded-lg hover:bg-[#005049] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
      >
        <Home className="w-5 h-5" />
        Back to Carefinder
      </Link>

    </div>
  );
}