export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  ownership_type: string;
  phone?: string;
  email?: string;
  visiting_hours?: string;
  description?: string;
  rating?: number;
  review_count?: number;
  distance?: number;
 city?: string;
  lga?: string;
  specialties?: string[]
  image_url?: string;
}