import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { supabase } from '../lib/supabase';
import { Loader2, Send, Building2, MessageSquareWarning, UserPlus, Trash2, Eye, EyeOff, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod'; // <-- IMPORT ZOD

// --- ZOD SCHEMA DEFINITION ---
const hospitalSchema = z.object({
  name: z.string().min(3, "Hospital Name must be at least 3 characters"),
  address: z.string().min(5, "Please provide a more detailed address"),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,15}$/, "Invalid phone number format").optional().or(z.literal('')),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
});

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'add' | 'moderate' | 'invite'>('add');
  
  // --- ADD HOSPITAL STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null); // NEW: Image State
  const [formData, setFormData] = useState({
    name: '', address: '', lga: '', city: '', state: '', 
    latitude: '', longitude: '', ownership_type: 'public', phone: '', email: '', specialties: ''
  });
  const [description, setDescription] = useState<string | undefined>('### Facility Overview\nWrite a detailed description here...\n\n### Visiting Hours\n* **Morning:** 8:00 AM - 12:00 PM\n* **Evening:** 4:00 PM - 8:00 PM');

  // --- MODERATION & INVITE STATE ---
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; reviewId: string | null }>({ isOpen: false, reviewId: null });
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => { if (activeTab === 'moderate') fetchReviews(); }, [activeTab]);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    const { data, error } = await supabase.from('reviews').select('*, hospitals(name)').order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to load reviews");
    } else if (data) {
      setReviews(data);
    }
    
    setIsLoadingReviews(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. ZOD VALIDATION
    try {
      hospitalSchema.parse({
        name: formData.name, address: formData.address, phone: formData.phone,
        latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude)
      });
    } catch (err: any) {
      toast.error(err.errors[0].message); // Show the first Zod error in a toast
      return;
    }

    setIsSubmitting(true);
    try {
      let image_url = null;

      // 2. SUPABASE STORAGE UPLOAD
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('hospital-images').upload(fileName, imageFile);
        
        if (uploadError) throw new Error("Image upload failed");
        
        const { data: { publicUrl } } = supabase.storage.from('hospital-images').getPublicUrl(fileName);
        image_url = publicUrl;
      }

      // 3. DATABASE INSERT
      const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const newHospital = {
        name: formData.name, address: formData.address, lga: formData.lga, city: formData.city, state: formData.state,
        latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude),
        ownership_type: formData.ownership_type, phone: formData.phone, email: formData.email,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : ['General'],
        description: description, rating: 0, image_url: image_url // <-- Added image_url
      };

      const { error } = await supabase.from('hospitals').insert([newHospital]);
      if (error) throw error;

      toast.success('Hospital successfully added!');
      setFormData({ name: '', address: '', lga: '', city: '', state: '', latitude: '', longitude: '', ownership_type: 'public', phone: '', email: '', specialties: '' });
      setDescription('');
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add hospital.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (Keep existing handleToggleApproval, triggerDelete, confirmDelete, and handleInviteAdmin exactly as they are)
  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase.from('reviews').update({ is_approved: !currentStatus }).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission denied. You do not have admin rights.");
      toast.success(currentStatus ? "Review hidden" : "Review approved");
      fetchReviews(); 
    } catch (error: any) { toast.error(error.message || "Failed to update review status"); }
  };

  const triggerDelete = (id: string) => setDeleteModal({ isOpen: true, reviewId: id });
  const confirmDelete = async () => {
    if (!deleteModal.reviewId) return;
    try {
      const { data, error } = await supabase.from('reviews').delete().eq('id', deleteModal.reviewId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission denied. You do not have admin rights.");
      toast.success("Review deleted permanently");
      fetchReviews();
    } catch (error: any) { toast.error(error.message || "Failed to delete review");
    } finally { setDeleteModal({ isOpen: false, reviewId: null }); }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-admin', { body: { newAdminEmail: inviteEmail }});
      if (error) throw error;
      toast.success("Admin invitation sent successfully!");
      setInviteEmail('');
    } catch (error: any) { toast.error("Failed to send invitation."); } finally { setIsInviting(false); }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f7f9fb] relative">
      {/* ADMIN SIDEBAR */}
      <div className="w-64 bg-white border-r border-[#E2E8F0] p-6 flex flex-col gap-2 shadow-sm z-10">
        <h2 className="text-xl font-bold text-[#0F172A] mb-6 px-3">Admin Panel</h2>
        <button onClick={() => setActiveTab('add')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'add' ? 'bg-[#e0f2f1] text-[#0D9488]' : 'text-[#45464d] hover:bg-gray-50'}`}><Building2 className="w-5 h-5" /> Add Hospital</button>
        <button onClick={() => setActiveTab('moderate')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'moderate' ? 'bg-[#e0f2f1] text-[#0D9488]' : 'text-[#45464d] hover:bg-gray-50'}`}><MessageSquareWarning className="w-5 h-5" /> Moderate Reviews</button>
        <button onClick={() => setActiveTab('invite')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'invite' ? 'bg-[#e0f2f1] text-[#0D9488]' : 'text-[#45464d] hover:bg-gray-50'}`}><UserPlus className="w-5 h-5" /> Invite Admin</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          
          {/* TAB 1: ADD HOSPITAL */}
          {activeTab === 'add' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Registry</h1>
              <p className="text-[#45464d] mb-8">Add a new healthcare facility to the public directory.</p>
              
              <form onSubmit={handleAddHospital} className="space-y-6 bg-white border border-[#E2E8F0] p-6 md:p-8 rounded-2xl shadow-sm">
                
                {/* NEW: IMAGE UPLOAD UI */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                  <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <label className="block text-sm font-semibold text-[#0D9488] cursor-pointer">
                    Upload Facility Photo
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">{imageFile ? imageFile.name : "PNG, JPG up to 5MB"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Hospital Name *</label><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Ownership Type</label>
                    <select name="ownership_type" value={formData.ownership_type} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none bg-white">
                      <option value="public">Public / Government</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Full Address *</label><input required name="address" value={formData.address} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">LGA *</label><input required name="lga" value={formData.lga} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">City</label><input name="city" value={formData.city} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">State</label><input name="state" value={formData.state} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                </div>

                <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Specialties (Comma Separated)</label><input name="specialties" value={formData.specialties} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Latitude (Map Y) *</label><input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Longitude (Map X) *</label><input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Phone Contact</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" placeholder="+234..." /></div>
                  <div><label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Email Contact</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" /></div>
                </div>

                <div data-color-mode="light">
                  <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Detailed Description (Markdown)</label>
                  <MDEditor value={description} onChange={setDescription} height={300} className="border border-[#E2E8F0] shadow-none rounded-lg overflow-hidden" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-[#0D9488] text-white font-bold rounded-xl hover:bg-[#0b7a70] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Hospital Entry'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MODERATE REVIEWS */}
          {activeTab === 'moderate' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Content Moderation</h1>
              {isLoadingReviews ? ( <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" /></div>
              ) : reviews.length === 0 ? ( <div className="bg-white border border-[#E2E8F0] p-10 rounded-2xl text-center text-gray-500">No reviews found.</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className={`p-5 border rounded-2xl transition-colors ${review.is_approved ? 'bg-white border-[#E2E8F0]' : 'bg-red-50 border-red-100'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md mb-2 inline-block ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-800'}`}>{review.is_approved ? 'Public' : 'Hidden'}</span>
                          <h3 className="font-semibold text-[#0F172A]">{review.hospitals?.name || 'Unknown Hospital'}</h3>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleApproval(review.id, review.is_approved)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600">{review.is_approved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                          <button onClick={() => triggerDelete(review.id)} className="p-2 bg-white border border-red-200 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-[#45464d] bg-gray-50 p-3 rounded-lg border border-gray-100">{review.comment || <i>No comment.</i>}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVITE ADMIN */}
          {activeTab === 'invite' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h1 className="text-3xl font-bold text-[#0F172A] mb-6">Role Management</h1>
              <div className="bg-white border border-[#E2E8F0] p-6 md:p-8 rounded-2xl shadow-sm">
                <form onSubmit={handleInviteAdmin}>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">New Admin Email</label>
                  <input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full h-11 px-4 mb-6 rounded-lg border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] outline-none" />
                  <button type="submit" disabled={isInviting} className="w-full h-11 bg-[#0F172A] text-white font-bold rounded-xl disabled:opacity-70 flex items-center justify-center">
                    {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send Invitation Link</>}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center">
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Delete Review?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, reviewId: null })} className="flex-1 h-11 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 h-11 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}