import { z } from 'zod';

export const professionalSchema = z.object({
  profession:      z.enum(['acompanante_terapeutico','enfermera','docente_especial','psicologo','fonoaudiologo','otro']),
  licenseNumber:   z.string().optional(),
  bio:             z.string().max(1000).optional(),
  specialties:     z.array(z.string()).min(1, 'Selecciona al menos una especialidad'),
  workZones:       z.array(z.string()).min(1, 'Indicá al menos una zona de trabajo'),
  city:            z.string().min(2),
  province:        z.string().min(2),
  address:         z.string().optional(),
  neighborhood:    z.string().optional(),
  contactPhone:    z.string().optional(),
  contactWhatsapp: z.string().optional(),
  lat:             z.number().optional(),
  lng:             z.number().optional(),
  isAvailable: z.boolean(),
});

export const studentSchema = z.object({
  disabilityTypes: z.array(z.string()).min(1),
  schoolName:      z.string().optional(),
  schoolZone:      z.string().optional(),
  needsCompanion:  z.boolean().default(false),
  needsNurse:      z.boolean().default(false),
  description:     z.string().max(500).optional(),
  city:            z.string().min(2),
  province:        z.string().min(2),
  address:         z.string().optional(),
  neighborhood:    z.string().optional(),
  contactPhone:    z.string().optional(),
  lat:             z.number().optional(),
  lng:             z.number().optional(),
  isVisible:       z.boolean().default(true),
});

export const centerSchema = z.object({
  name:            z.string().min(3),
  centerType:      z.enum(['escuela_especial','centro_terapeutico','rehabilitacion','integracion','otro']),
  description:     z.string().optional(),
  services:        z.array(z.string()),
  disabilityTypes: z.array(z.string()),
  address:         z.string().min(5),
  city:            z.string().min(2),
  province:        z.string().min(2),
  neighborhood:    z.string().optional(),
  phone:           z.string().optional(),
  email:           z.string().email().optional(),
  website:         z.string().url().optional(),
  lat:             z.number().optional(),
  lng:             z.number().optional(),
});
