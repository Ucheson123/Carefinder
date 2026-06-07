import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportModal from './ExportModal';
import type { Hospital } from '../types';

// Create fake data to feed the component
const mockHospitals: Hospital[] = [
  { id: '1', name: 'Test Hospital 1', address: '123 Test St', latitude: 0, longitude: 0, ownership_type: 'Public' },
  { id: '2', name: 'Test Hospital 2', address: '456 Test Ave', latitude: 0, longitude: 0, ownership_type: 'Private' },
];

describe('ExportModal Component', () => {
  
  // Test 1: Should hide itself
  it('does not render when isOpen is false', () => {
    render(<ExportModal isOpen={false} onClose={() => {}} hospitals={mockHospitals} searchQuery="" />);
    expect(screen.queryByText('Export to CSV')).not.toBeInTheDocument();
  });

  // Test 2: Should show itself
  it('renders correctly when isOpen is true', () => {
    render(<ExportModal isOpen={true} onClose={() => {}} hospitals={mockHospitals} searchQuery="" />);
    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
  });

  // Test 3: Should accurately count the data passed into it
  it('displays the correct number of records passed to it', () => {
    render(<ExportModal isOpen={true} onClose={() => {}} hospitals={mockHospitals} searchQuery="" />);
    expect(screen.getByText(/2 records found/i)).toBeInTheDocument();
  });

  // Test 4: Should trigger the close function
  it('calls the onClose function when the close button is clicked', () => {
    const handleClose = vi.fn(); // Create a mock function
    render(<ExportModal isOpen={true} onClose={handleClose} hospitals={mockHospitals} searchQuery="" />);
    
    // Grab all buttons and click the first one (which is our top-right 'X' button)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); 
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

});