export type UserRole = 'alumno' | 'profesional' | 'admin';
export type DisabilityType = 'visual' | 'auditiva' | 'motriz' | 'intelectual' | 'tea' | 'multiple' | 'otra';
export type ProfessionType = 'acompañante_terapeutico' | 'enfermera' | 'docente_especial' | 'psicologo' | 'fonoaudiologo' | 'otro';
export type CenterType = 'escuela_especial' | 'centro_terapeutico' | 'rehabilitacion' | 'integracion' | 'otro';

export interface GeoPoint { lat: number; lng: number; }

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  user?: User;
  disabilityTypes: DisabilityType[];
  schoolName?: string;
  schoolZone?: string;
  needsCompanion: boolean;
  needsNurse: boolean;
  description?: string;
  location?: GeoPoint;
  address?: string;
  neighborhood?: string;
  city: string;
  province: string;
  contactPhone?: string;
  isVisible: boolean;
}

export interface Professional {
  id: string;
  userId: string;
  user?: User;
  profession: ProfessionType;
  licenseNumber?: string;
  licenseDocUrl?: string;
  isVerified: boolean;
  bio?: string;
  specialties: DisabilityType[];
  workZones: string[];
  location?: GeoPoint;
  address?: string;
  neighborhood?: string;
  city: string;
  province: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  availability?: Record<string, string[]>;
  isAvailable: boolean;
  location_text?: string; 
}

export interface Center {
  id: string;
  ownerUserId: string;
  name: string;
  centerType: CenterType;
  description?: string;
  services: string[];
  disabilityTypes: DisabilityType[];
  location?: GeoPoint;
  address: string;
  neighborhood?: string;
  city: string;
  province: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  photos: string[];
  isVerified: boolean;
  isActive: boolean;
  location_text?: string; 
}

export interface SearchFilters {
  zone?: string;
  city?: string;
  province?: string;
  school?: string;
  disabilityType?: DisabilityType;
  needsCompanion?: boolean;
  needsNurse?: boolean;
  profession?: ProfessionType;
  centerType?: CenterType;
  isVerified?: boolean;
  radiusKm?: number;
  lat?: number;
  lng?: number;
}