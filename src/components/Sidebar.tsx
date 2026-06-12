import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Check, ArrowLeft, Clock, Phone, Mail, Star, Navigation, Download, Link as LinkIcon, User, Send, Loader2, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Hospital } from '../types';
import ExportModal from './ExportModal'; 
import EmailModal from './EmailModal';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface SidebarProps {
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
  setUserLocation: (loc: {lat: number, lng: number} | null) => void;
}

export default function Sidebar({
  session, isLoading, searchQuery, setSearchQuery, activeFilter, setActiveFilter,
  specialtyFilter, setSpecialtyFilter, filteredHospitals, selectedHospital, setSelectedHospital, setUserLocation
}: SidebarProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams(); 

  // --- REVIEWS STATE ---
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // --- EDIT REVIEW STATE ---
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Sync URL Params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (activeFilter !== 'All') params.set('type', activeFilter);
    if (specialtyFilter !== 'All') params.set('specialty', specialtyFilter);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeFilter, specialtyFilter, setSearchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');
    if (q && !searchQuery) setSearchQuery(q);
    if (type && activeFilter === 'All') setActiveFilter(type);
    if (specialty && specialtyFilter === 'All') setSpecialtyFilter(specialty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FETCH REVIEWS
  useEffect(() => {
    if (selectedHospital) {
      fetchReviewsAndStats();
    } else {
      setReviews([]);
      setNewComment('');
      setNewRating(5);
      setEditingReviewId(null);
    }
  }, [selectedHospital?.id]);

  const fetchReviewsAndStats = async () => {
    if (!selectedHospital) return;
    
    // 1. Fetch the reviews list
    const { data: reviewsData } = await supabase.from('reviews')
      .select('*').eq('hospital_id', selectedHospital.id)
      .eq('is_approved', true).order('created_at', { ascending: false });
    
    if (reviewsData) setReviews(reviewsData);

    // 2. Fetch fresh stats to update the UI pill
    const { data: freshStats } = await supabase.from('hospitals')
      .select('rating, review_count').eq('id', selectedHospital.id).single();
      
    if (freshStats && (freshStats.rating !== selectedHospital.rating || freshStats.review_count !== selectedHospital.review_count)) {
      setSelectedHospital({ ...selectedHospital, rating: freshStats.rating, review_count: freshStats.review_count });
    }
  };

  // SUBMIT NEW REVIEW
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedHospital) return;
    
    setIsSubmittingReview(true);
    try {
      // Extact name from metadata, or fallback to the part of the email before the @ symbol
      const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Anonymous User';

      const { error } = await supabase.from('reviews').insert([{
        hospital_id: selectedHospital.id,
        user_id: session.user.id,
        user_name: userName, // <-- SAVING THE NAME
        rating: newRating,
        comment: newComment
      }]);

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setNewComment('');
      setNewRating(5);
      await fetchReviewsAndStats();

    } catch (error: any) { toast.error("Error submitting review: " + error.message);
    } finally { setIsSubmittingReview(false); }
  };

  // START EDITING
  const handleStartEdit = (review: any) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  // SAVE EDITED REVIEW
  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId) return;

    try {
      const { data, error } = await supabase.from('reviews')
        .update({ rating: editRating, comment: editComment })
        .eq('id', editingReviewId)
        .eq('user_id', session.user.id) // Security check
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Could not update review.");

      toast.success("Review updated!");
      setEditingReviewId(null);
      await fetchReviewsAndStats();
    } catch (error: any) { toast.error(error.message); }
  };

  // DELETE OWN REVIEW
  const handleDeleteMyReview = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      const { error } = await supabase.from('reviews')
        .delete().eq('id', id).eq('user_id', session.user.id);

      if (error) throw error;
      toast.success("Review deleted!");
      await fetchReviewsAndStats();
    } catch (error: any) { toast.error("Failed to delete review."); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Shareable link copied!"); 
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your device.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
        toast.success("Location found!");
      },
      (error) => {
        console.warn("Geolocation Error:", error.message);
        let errorMessage = "Could not find your location.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Check your signal.";
            break;
          case error.TIMEOUT:
            // Often triggered if high accuracy fails
            errorMessage = "The location request timed out. Please try again.";
            break;
        }
        
        toast.error(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false, // Changed to false: Uses fast WiFi/Network location instead of waiting for a GPS satellite lock
        timeout: 10000,            // 10 seconds is plenty of time for network location
        maximumAge: 300000         // Allows the browser to use a location cached within the last 5 minutes to speed things up
      }
    );
  };

  const getChipClass = (filterName: string) => {
    return activeFilter === filterName 
      ? "flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#86f2e4] text-[#005049] text-xs font-semibold whitespace-nowrap shadow-sm shrink-0 transition-colors cursor-pointer"
      : "px-3 py-1.5 rounded-full border border-[#d8dadc] text-[#45464d] bg-white text-xs font-medium hover:bg-gray-50 whitespace-nowrap shrink-0 transition-colors cursor-pointer";
  };

  return (
    <div className="w-full md:w-105 h-full bg-[#f7f9fb] border-r border-[#d8dadc] z-10 flex flex-col shadow-lg">
      
      {selectedHospital ? (
        /* DETAILS VIEW */
        <div className="flex-1 overflow-y-auto bg-white flex flex-col animate-in slide-in-from-right-4 duration-300">
           <div className="p-6 pb-4 border-b border-[#E2E8F0] sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
            <button onClick={() => setSelectedHospital(null)} className="flex items-center gap-2 text-[#45464d] hover:text-[#0D9488] font-semibold transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleCopyLink} className="p-2 text-gray-500 hover:text-[#0D9488] hover:bg-gray-100 rounded-full transition-colors" title="Share Hospital">
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] leading-tight">{selectedHospital.name}</h2>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="px-3 py-1 bg-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-full capitalize">
                  {selectedHospital.ownership_type || "General"}
                </span>
                
                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-100 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold text-yellow-700">
                    {selectedHospital.rating && selectedHospital.rating > 0 
                      ? `${selectedHospital.rating.toFixed(1)} Overall (${selectedHospital.review_count || 0} Reviews)` 
                      : 'No ratings yet'}
                  </span>
                </div>
              </div>
            </div>

            {selectedHospital.image_url && (
              <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden mt-2">
                <img src={selectedHospital.image_url} alt={selectedHospital.name} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="prose prose-sm max-w-none text-[#45464d] prose-headings:text-[#0F172A] prose-a:text-[#0D9488] border-l-2 border-[#0D9488] pl-4 mt-2">
              <ReactMarkdown>{selectedHospital.description || "No detailed description available."}</ReactMarkdown>
            </div>

            <hr className="border-[#E2E8F0]" />
            <div className="space-y-5 mt-2">
              <div className="flex items-start gap-4"><MapPin className="w-5 h-5 text-[#0D9488]" /> <span className="text-[#191c1e] text-sm font-medium">{selectedHospital.address}</span></div>
              <div className="flex items-start gap-4"><Clock className="w-5 h-5 text-[#0D9488]" /> <span className="text-[#191c1e] text-sm font-medium">{selectedHospital.visiting_hours || "Contact for hours"}</span></div>
              <div className="flex items-start gap-4"><Phone className="w-5 h-5 text-[#0D9488]" /> <span className="text-[#191c1e] text-sm font-medium">{selectedHospital.phone || "Not provided"}</span></div>
              <div className="flex items-start gap-4"><Mail className="w-5 h-5 text-[#0D9488]" /> <span className="text-[#191c1e] text-sm font-medium">{selectedHospital.email || "Not provided"}</span></div>
            </div>

            <hr className="border-[#E2E8F0] my-2" />

            {/* REVIEWS SECTION */}
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">Patient Reviews</h3>
              
              {/* Review Submission Form */}
              {session ? (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-[#f7f9fb] border border-[#E2E8F0] rounded-xl">
                  <p className="text-sm font-semibold text-[#0F172A] mb-2">Leave a Rating</p>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        onClick={() => setNewRating(star)} 
                        className={`w-6 h-6 cursor-pointer transition-colors ${newRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} 
                      />
                    ))}
                  </div>
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] mb-3 resize-none"
                    rows={3}
                  />
                  <button type="submit" disabled={isSubmittingReview} className="w-full h-10 bg-[#0D9488] text-white text-sm font-semibold rounded-lg hover:bg-[#0b7a70] transition-colors flex items-center justify-center gap-2">
                    {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Review</>}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-sm text-[#45464d]">Please sign in to leave a review.</p>
                </div>
              )}

              {/* Review List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 border border-[#E2E8F0] rounded-xl bg-white shadow-sm">
                      
                      {/* IF EDITING THIS SPECIFIC REVIEW */}
                      {editingReviewId === review.id ? (
                        <form onSubmit={handleUpdateReview} className="animate-in fade-in">
                          <div className="flex justify-between mb-3">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} onClick={() => setEditRating(star)} className={`w-5 h-5 cursor-pointer ${editRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <button type="button" onClick={() => setEditingReviewId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </div>
                          <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className="w-full p-2 rounded-lg border border-[#E2E8F0] text-sm mb-2 focus:border-[#0D9488] outline-none" rows={2} />
                          <button type="submit" className="px-4 py-1.5 bg-[#0D9488] text-white text-xs font-semibold rounded-lg hover:bg-[#0b7a70]">Save Changes</button>
                        </form>
                      ) : (
                        /* NORMAL REVIEW DISPLAY */
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#0F172A] capitalize">{review.user_name || "Anonymous User"}</p>
                                <p className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                              
                              {/* SHOW EDIT/DELETE ICONS IF LOGGED IN USER WROTE THIS */}
                              {session?.user?.id === review.user_id && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleStartEdit(review)} className="text-gray-400 hover:text-[#0D9488] transition-colors" title="Edit your review"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteMyReview(review.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete your review"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </div>
                          </div>
                          {review.comment && <p className="text-sm text-[#45464d] mt-2">{review.comment}</p>}
                        </>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SEARCH & LIST VIEW */
        <>
          <div className="p-6 pb-4 flex flex-col gap-5 shrink-0">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Carefinder</h1>
              <div className="flex gap-2">
                <button onClick={handleCopyLink} className="p-2 text-gray-500 hover:text-[#0D9488] bg-white border border-[#E2E8F0] rounded-lg shadow-sm" title="Copy Shareable Link"><LinkIcon className="w-4 h-4" /></button>
                <button onClick={() => setIsExportModalOpen(true)} className="p-2 text-gray-500 hover:text-[#0D9488] bg-white border border-[#E2E8F0] rounded-lg shadow-sm" title="Export to CSV"><Download className="w-4 h-4" /></button>
                <button onClick={() => setIsEmailModalOpen(true)} className="p-2 text-gray-500 hover:text-[#0D9488] bg-white border border-[#E2E8F0] rounded-lg shadow-sm" title="Share via Email"><Mail className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search hospitals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-12 pl-10 pr-10 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-shadow" />
              </div>
              <button onClick={handleLocateMe} disabled={isLocating} className="flex items-center justify-center w-12 h-12 bg-white border border-[#E2E8F0] rounded-lg text-[#0D9488] hover:bg-gray-50 hover:border-[#0D9488] transition-all shrink-0 shadow-sm" title='Hospitals Within 10km Radius'>
                <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse text-gray-400' : ''}`} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setActiveFilter('All')} className={getChipClass('All')}>{activeFilter === 'All' && <Check className="w-3.5 h-3.5" />} All</button>
                <button onClick={() => setActiveFilter('Public')} className={getChipClass('Public')}>Public</button>
                <button onClick={() => setActiveFilter('Private')} className={getChipClass('Private')}>Private</button>
              </div>
              <select 
                value={specialtyFilter} 
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="text-xs font-medium text-[#45464d] bg-white border border-[#d8dadc] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] cursor-pointer shadow-sm shrink-0"
              >
                <option value="All">All Specialties</option>
                <option value="General">General</option>
                <option value="Maternity">Maternity</option>
                <option value="Emergency">Emergency</option>
                <option value="Pediatric">Pediatric</option>
                <option value="Dental">Dental</option>
                <option value="Surgical">Surgical</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            {isLoading ? (
              <div className="text-center text-gray-500 py-10 animate-pulse">Loading hospitals...</div>
            ) : filteredHospitals.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No hospitals found matching your criteria.</div>
            ) : (
              filteredHospitals.map((hospital) => (
                <div key={hospital.id} onClick={() => setSelectedHospital(hospital)} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:border-[#0D9488] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer group flex flex-col">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-lg text-[#0F172A] group-hover:text-[#0D9488] transition-colors leading-tight">
                      {hospital.name || "Unnamed Clinic"}
                    </h3>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-md shrink-0">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700">
                        {hospital.rating && hospital.rating > 0 ? hospital.rating.toFixed(1) : 'New'}
                      </span>
                      {hospital.review_count && hospital.review_count > 0 ? (
                        <span className="text-[10px] text-yellow-600 ml-0.5 opacity-80">({hospital.review_count})</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[#45464d] text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <p className="truncate">{hospital.address || "Address not provided"}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="px-2.5 py-1 bg-[#f2f4f6] text-[#45464d] text-[11px] font-semibold rounded-full tracking-wide capitalize">{hospital.ownership_type || "General"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} hospitals={filteredHospitals} searchQuery={searchQuery} />
      <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} hospitals={filteredHospitals} />
    </div>
  );
}