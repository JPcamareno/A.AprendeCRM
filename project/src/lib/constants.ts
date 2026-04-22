// Initial default values - these will be loaded from Supabase
export const DEFAULT_COURSES = [
  'LESCO ASINCRONICO',
  'LESCO SINCRONICO',
  'INGLES PARA NIÑOS - VIRTUAL',
  'INGLES PARA NIÑOS - PRESENCIAL',
  'TALLER DE 1 HORA',
  'TALLER DE 2 HORAS',
  'DICCIONARIO DIGITAL',
];

export const DEFAULT_SELLERS = ['Daniel Valverde', 'Steven Gamboa'];

export const SALE_TYPES = {
  COURSE: 'INGRESO CURSO',
  WORKSHOP: 'INGRESO TALLER',
} as const;

export const COURSE_TYPE_MAPPING: Record<string, string> = {
  'LESCO ASINCRONICO': SALE_TYPES.COURSE,
  'LESCO SINCRONICO': SALE_TYPES.COURSE,
  'INGLES PARA NIÑOS - VIRTUAL': SALE_TYPES.COURSE,
  'INGLES PARA NIÑOS - PRESENCIAL': SALE_TYPES.COURSE,
  'DICCIONARIO DIGITAL': SALE_TYPES.COURSE,
  'TALLER DE 1 HORA': SALE_TYPES.WORKSHOP,
  'TALLER DE 2 HORAS': SALE_TYPES.WORKSHOP,
};

export function getSaleType(course: string): string {
  return COURSE_TYPE_MAPPING[course] || SALE_TYPES.COURSE;
}

// Exports de compatibilidad (para archivos que aún usan los nombres antiguos)
export const COURSES = DEFAULT_COURSES;
export const SELLERS = DEFAULT_SELLERS;