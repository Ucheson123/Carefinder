import { useState, useEffect } from 'react';
import { X, Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Hospital } from '../types';
import toast from 'react-hot-toast';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
}

export default function EmailModal({ isOpen, onClose, hospitals }: EmailModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // State to track which hospitals are selected for the email
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>([]);

  // When the modal opens or hospitals change, select the first 5 by default
  useEffect(() => {
    if (isOpen) {
      setSelectedHospitalIds(hospitals.slice(0, 5).map(h => h.id));
    }
  }, [isOpen, hospitals]);

  if (!isOpen) return null;

  const toggleHospital = (id: string) => {
    setSelectedHospitalIds(prev => 
      prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedHospitalsData = hospitals.filter(h => selectedHospitalIds.includes(h.id));

    if (selectedHospitalsData.length === 0) {
      toast.error('Please select at least one hospital to share!');
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('super-function', {
        body: { email, hospitals: selectedHospitalsData } 
      });

      if (error) throw error;

      toast.success('Email sent successfully!');
      setTimeout(() => {
        onClose();
        setEmail('');
      }, 1000);
      
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
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
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Share via Email</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Select the facilities you want to send to the recipient.
          </p>

          <form onSubmit={handleSend}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#45464d] mb-1.5">Recipient Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-shadow text-sm"
                placeholder="colleague@example.com"
              />
            </div>

            {/* NEW: Scrollable list of checkboxes for hospitals */}
            <div className="mb-6 max-h-48 overflow-y-auto pr-2 space-y-2 border border-[#E2E8F0] p-3 rounded-lg bg-gray-50">
              {hospitals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No hospitals in current view.</p>
              ) : (
                hospitals.map(hospital => (
                  <div 
                    key={hospital.id} 
                    onClick={() => toggleHospital(hospital.id)}
                    className="flex items-start gap-3 cursor-pointer group p-1"
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedHospitalIds.includes(hospital.id) ? 'bg-[#0D9488] border-[#0D9488]' : 'border-gray-300 group-hover:border-[#0D9488]'}`}>
                      {selectedHospitalIds.includes(hospital.id) && <X className="w-3 h-3 text-white" style={{ transform: 'rotate(45deg)' }} />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#45464d] leading-none">{hospital.name || "Unnamed Clinic"}</span>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{hospital.address}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className="w-full h-11 bg-[#0D9488] text-white font-semibold rounded-lg hover:bg-[#0b7a70] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send {selectedHospitalIds.length} Hospitals</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}