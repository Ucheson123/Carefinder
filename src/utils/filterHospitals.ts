import type { Hospital } from '../types';

export function filterHospitals(
  hospitals: Hospital[],
  searchQuery: string,
  activeFilter: string,
  specialtyFilter: string
): Hospital[] {
  return hospitals.filter((hospital) => {
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      (hospital.name || '').toLowerCase().includes(searchLower) ||
      (hospital.address || '').toLowerCase().includes(searchLower) ||
      (hospital.city || '').toLowerCase().includes(searchLower) ||
      (hospital.lga || '').toLowerCase().includes(searchLower);

    const matchesOwnership = activeFilter === 'All' || 
      (hospital.ownership_type || 'public').toLowerCase() === activeFilter.toLowerCase();

    const matchesSpecialty = specialtyFilter === 'All' || 
      (hospital.specialties && hospital.specialties.some(s => 
        s.toLowerCase().includes(specialtyFilter.toLowerCase())
      ));

    return matchesSearch && matchesOwnership && matchesSpecialty;
  });
}