import { useEffect, useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase'; 
import type { Hospital } from './types';
import { Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import TestError from './pages/TestError';

// Components & Pages
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check for Email Verification Redirect
    if (window.location.href.includes('type=signup')) {
      setTimeout(() => {
        toast.success("Email verified successfully!");
        window.history.replaceState(null, '', window.location.pathname);
      }, 1000);
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchHospitals() {
      setIsLoading(true);
      try {
        if (userLocation) {
          const { data, error } = await supabase.rpc('get_hospitals_in_radius', {
            user_lat: userLocation.lat,
            user_lon: userLocation.lng,
            radius_km: 10 
          });
          if (error) throw error;
          const formattedData = data.map((h: any) => ({
            ...h, distance: Math.round(h.distance_km * 10) / 10
          }));
          setHospitals(formattedData);
        } else {
          const { data, error } = await supabase.from('hospitals').select('*');
          if (error) throw error;
          setHospitals(data);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        toast.error("Failed to load hospitals from the database."); // <-- NEW: User-facing error toast
      } finally {
        setIsLoading(false);
      }
    }
    fetchHospitals();
  }, [userLocation]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const searchLower = searchQuery.toLowerCase();
      
      // 1. Check Name, Address, City, AND LGA
      const matchesSearch = 
        (hospital.name || '').toLowerCase().includes(searchLower) ||
        (hospital.address || '').toLowerCase().includes(searchLower) ||
        (hospital.city || '').toLowerCase().includes(searchLower) ||
        (hospital.lga || '').toLowerCase().includes(searchLower);

      // 2. Check Ownership (Public/Private)
      const matchesOwnership = activeFilter === 'All' || 
        (hospital.ownership_type || 'public').toLowerCase() === activeFilter.toLowerCase();

      // 3. Check Specialty
      const matchesSpecialty = specialtyFilter === 'All' || 
        (hospital.specialties && hospital.specialties.some((s: string) => 
          s.toLowerCase().includes(specialtyFilter.toLowerCase())
        ));

      return matchesSearch && matchesOwnership && matchesSpecialty;
    });
  }, [hospitals, searchQuery, activeFilter, specialtyFilter]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#f7f9fb] font-sans">
      <Header session={session} onOpenAuth={() => setIsAuthModalOpen(true)} />
      
      {/* ROUTING ENGINE */}
      <Routes>
        <Route path="/" element={
          <Home 
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filteredHospitals={filteredHospitals}
            selectedHospital={selectedHospital}
            setSelectedHospital={setSelectedHospital}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            session={session}
            specialtyFilter={specialtyFilter}
            setSpecialtyFilter={setSpecialtyFilter}
          />
        } />

        <Route path="/admin" element={
          <ProtectedRoute session={session}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/test-error" element={<TestError />} />

        <Route path="*" element={<NotFound />} />

      </Routes>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* TOASTER COMPONENT */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500'
          },
        }} 
      />
    </div>
  );
}