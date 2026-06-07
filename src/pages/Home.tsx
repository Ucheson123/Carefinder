import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import type { Hospital } from '../types';

interface HomeProps {
  session: any;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  specialtyFilter: string;
  setSpecialtyFilter: (s: string) => void;
  filteredHospitals: Hospital[];
  selectedHospital: Hospital | null;
  setSelectedHospital: (h: Hospital | null) => void;
  userLocation: {lat: number, lng: number} | null;
  setUserLocation: (loc: {lat: number, lng: number} | null) => void;
}

export default function Home(props: HomeProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar 
        isLoading={props.isLoading}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        activeFilter={props.activeFilter}
        setActiveFilter={props.setActiveFilter}
        specialtyFilter={props.specialtyFilter}
        setSpecialtyFilter={props.setSpecialtyFilter}
        filteredHospitals={props.filteredHospitals}
        selectedHospital={props.selectedHospital}
        setSelectedHospital={props.setSelectedHospital}
        setUserLocation={props.setUserLocation}
        session={props.session}
      />
      <MapView 
        filteredHospitals={props.filteredHospitals}
        selectedHospital={props.selectedHospital}
        userLocation={props.userLocation}
      />
    </div>
  );
}