export type UserRole = 'alumno' | 'profesional' | 'admin';
export type DisabilityType = 'visual' | 'auditiva' | 'motriz' | 'intelectual' | 'tea' | 'multiple' | 'otra';
// 'acompanante_terapeutico' (sin tilde) — así está definido el CHECK constraint
// de la columna `profession` en la base (professionals_profession_check). No es
// un typo: cambiarlo acá sin migrar la base rompe cualquier insert/update real.
export type ProfessionType = 'acompanante_terapeutico' | 'enfermera' | 'docente_especial' | 'psicologo' | 'fonoaudiologo' | 'otro';
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
  avg_rating?: number;
  review_count?: number;
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

export type AccessibilityCategory = 'barrera' | 'acceso_positivo' | 'servicio';

export const ACCESSIBILITY_SUBTYPES: Record<AccessibilityCategory, { value: string; label: string }[]> = {
  barrera: [
    { value: 'vereda_rota',        label: 'Vereda rota o en mal estado' },
    { value: 'sin_rampa',          label: 'Sin rampa' },
    { value: 'escalon_sin_salvar', label: 'Escalón sin salvar' },
    { value: 'obra_bloquea_paso',  label: 'Obra que bloquea el paso' },
    { value: 'otro_barrera',       label: 'Otra barrera' },
  ],
  acceso_positivo: [
    { value: 'rampa_buen_estado',      label: 'Rampa en buen estado' },
    { value: 'entrada_sin_escalones',  label: 'Entrada sin escalones' },
    { value: 'bano_accesible',         label: 'Baño accesible' },
    { value: 'semaforo_sonoro',        label: 'Semáforo sonoro' },
    { value: 'piso_tactil',            label: 'Piso táctil / podotáctil' },
    { value: 'otro_positivo',          label: 'Otro acceso positivo' },
  ],
  servicio: [
    { value: 'estacionamiento_reservado',    label: 'Estacionamiento reservado' },
    { value: 'parada_transporte_accesible',  label: 'Parada de transporte accesible' },
    { value: 'ascensor',                     label: 'Ascensor' },
    { value: 'otro_servicio',                label: 'Otro servicio' },
  ],
};

export interface AccessibilityReport {
  id: string;
  reporter_id?: string | null;
  category: AccessibilityCategory;
  subtype: string;
  description?: string | null;
  photo_url?: string | null;
  location_text?: string | null;
  address?: string | null;
  upvotes: number;
  downvotes: number;
  is_active?: boolean;
  created_at?: string;
  my_vote?: 1 | -1 | null;
}

export const DISCIPLINA_OPTIONS = [
  'Básquet en silla de ruedas', 'Natación adaptada', 'Atletismo adaptado',
  'Goalball', 'Boccia', 'Ciclismo adaptado', 'Tenis adaptado', 'Esgrima en silla',
  'Fútbol para ciegos', 'Rugby en silla de ruedas', 'Otra',
] as const;

export interface Asociacion {
  id: string;
  ownerUserId?: string | null;
  nombre: string;
  descripcion?: string;
  disciplinas: string[];
  tiposDiscapacidad: DisabilityType[];
  domicilio: string;
  barrio?: string;
  localidad: string;
  provincia: string;
  location?: GeoPoint;
  telefono?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  logoUrl?: string;
  fotos: string[];
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
  isVerifiedOnly?: boolean;
  sector?: 'Estatal' | 'Privado';
  nivel?: 'temprana' | 'jardin' | 'primario' | 'secundario' | 'integracion';
  radiusKm?: number;
  lat?: number;
  lng?: number;
  nombreProfesional?: string;
  obraSocial?: string;
  disciplina?: string;
}