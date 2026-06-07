import { useState } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import type { Hospital } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  searchQuery: string;
}

export default function ExportModal({ isOpen, onClose, hospitals, searchQuery }: ExportModalProps) {
  // Columns requested by the rubric
  const availableColumns = [
    { id: 'name', label: 'Hospital Name' },
    { id: 'address', label: 'Address' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'email', label: 'Email' },
    { id: 'specialties', label: 'Specialties' },
    { id: 'rating', label: 'Rating' },
    { id: 'ownership_type', label: 'Ownership Type' }
  ];

  // By default, select all columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.map(c => c.id)
  );

  if (!isOpen) return null;

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(col => col !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }

    // Filter the data to only include selected columns and format arrays (like specialties)
    const exportData = hospitals.map(hospital => {
      const row: any = {};
      selectedColumns.forEach(col => {
        let value = hospital[col as keyof Hospital];
        // Ensure arrays (specialties) are joined as strings so CSV doesn't break
        if (Array.isArray(value)) value = value.join(', ');
        row[col] = value || 'N/A'; // Provide fallback for empty fields
      });
      return row;
    });

    // Generate CSV string using PapaParse (Client-side only!)
    const csv = Papa.unparse(exportData);

    // Create a downloadable blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Generate Filename: hospitals-query-date.csv
    const dateStr = new Date().toISOString().split('T')[0];
    const safeQuery = searchQuery.trim() ? searchQuery.replace(/\s+/g, '-').toLowerCase() : 'all';
    const filename = `hospitals-${safeQuery}-${dateStr}.csv`;

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#e0f2f1] text-[#0D9488] rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Export to CSV</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Select the data columns you want to include in your export. ({hospitals.length} records found)
          </p>

          <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
            {availableColumns.map(col => (
              <div 
                key={col.id} 
                onClick={() => toggleColumn(col.id)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedColumns.includes(col.id) ? 'bg-[#0D9488] border-[#0D9488]' : 'border-gray-300 group-hover:border-[#0D9488]'}`}>
                  {selectedColumns.includes(col.id) && <X className="w-3.5 h-3.5 text-white" style={{ transform: 'rotate(45deg)' }} />}
                </div>
                <span className="text-sm font-medium text-[#45464d]">{col.label}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={handleExport}
            className="w-full h-11 bg-[#0D9488] text-white font-semibold rounded-lg hover:bg-[#0b7a70] transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download CSV File
          </button>
        </div>
      </div>
    </div>
  );
}