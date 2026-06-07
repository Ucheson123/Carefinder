import { describe, it, expect } from 'vitest';
import { filterHospitals } from './filterHospitals';
import type { Hospital } from '../types';

const mockHospitals: Hospital[] = [
  { id: '1', name: 'Lagos General', address: 'Main St', latitude: 0, longitude: 0, ownership_type: 'Public', specialties: ['General', 'Emergency'] },
  { id: '2', name: 'Abuja Private Clinic', address: 'Wuse', latitude: 0, longitude: 0, ownership_type: 'Private', specialties: ['Dental', 'Pediatric'] },
  { id: '3', name: 'Delta Maternity', address: 'Asaba', latitude: 0, longitude: 0, ownership_type: 'Private', specialties: ['Maternity'] }
];

describe('filterHospitals Logic', () => {
  it('should return all hospitals when filters are default', () => {
    const result = filterHospitals(mockHospitals, '', 'All', 'All');
    expect(result.length).toBe(3);
  });

  it('should filter by search query (name match)', () => {
    const result = filterHospitals(mockHospitals, 'Lagos', 'All', 'All');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Lagos General');
  });

  it('should filter by ownership type (Private)', () => {
    const result = filterHospitals(mockHospitals, '', 'Private', 'All');
    expect(result.length).toBe(2);
    expect(result.every(h => h.ownership_type === 'Private')).toBe(true);
  });

  it('should filter by specialty (Maternity)', () => {
    const result = filterHospitals(mockHospitals, '', 'All', 'Maternity');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Delta Maternity');
  });

  it('should combine multiple filters (Search + Ownership + Specialty)', () => {
    const result = filterHospitals(mockHospitals, 'Abuja', 'Private', 'Dental');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Abuja Private Clinic');
  });
});