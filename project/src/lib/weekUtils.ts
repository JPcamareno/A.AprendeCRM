import { format, parseISO, getMonth, getDate, addDays, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeekInfo {
  week: number;
  label: string;
  range: string;
  monthName: string;
  year: number;
  startDate: Date;
  endDate: Date;
  days: {
    dayNumber: number;
    dayName: string;
    fullDate: Date;
  }[];
}

/**
 * Calcula la fecha de inicio de una semana ISO para cualquier año
 * Semana 1 = Primera semana completa de enero (comenzando en lunes)
 */
function getWeekStartDate(weekNumber: number, year: number): Date {
  // Obtener el primer día del año
  const firstDayOfYear = startOfYear(new Date(year, 0, 1));
  
  // Encontrar el primer lunes del año
  let firstMonday = new Date(firstDayOfYear);
  const dayOfWeek = firstMonday.getDay(); // 0 = domingo, 1 = lunes
  
  if (dayOfWeek === 0) {
    // Si es domingo, el lunes es al día siguiente
    firstMonday = addDays(firstMonday, 1);
  } else if (dayOfWeek !== 1) {
    // Si no es lunes, avanzar hasta el próximo lunes
    firstMonday = addDays(firstMonday, 8 - dayOfWeek);
  }
  
  // Calcular la fecha de inicio de la semana solicitada
  // Semana 1 comienza en el primer lunes, semana 2 en el segundo lunes, etc.
  return addDays(firstMonday, (weekNumber - 1) * 7);
}

/**
 * Obtiene información completa de una semana específica
 * NUEVO: Basado en semanas del año calendario (Enero-Diciembre)
 */
export function getWeekInfo(weekNumber: number, year: number = new Date().getFullYear()): WeekInfo | null {
  try {
    // Validar que el número de semana sea válido (1-52)
    if (weekNumber < 1 || weekNumber > 52) {
      console.warn(`Número de semana inválido: ${weekNumber}`);
      return null;
    }

    // Calcular fechas de inicio y fin de la semana
    const startDate = getWeekStartDate(weekNumber, year);
    const endDate = addDays(startDate, 6); // 7 días: lunes a domingo
    
    const startMonth = getMonth(startDate);
    const endMonth = getMonth(endDate);
    
    let monthName: string;
    if (startMonth !== endMonth) {
      monthName = `${format(startDate, 'MMM', { locale: es })} - ${format(endDate, 'MMM', { locale: es })}`;
    } else {
      monthName = format(startDate, 'MMMM', { locale: es });
    }

    const days: WeekInfo['days'] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      days.push({
        dayNumber: getDate(currentDate),
        dayName: format(currentDate, 'EEE', { locale: es }).toUpperCase(),
        fullDate: new Date(currentDate)
      });
      currentDate = addDays(currentDate, 1);
    }

    return {
      week: weekNumber,
      label: `Semana ${weekNumber}`,
      range: `${getDate(startDate)}-${getDate(endDate)} ${format(startDate, 'MMM', { locale: es })}`,
      monthName,
      year,
      startDate,
      endDate,
      days
    };
  } catch (error) {
    console.error('Error getting week info:', error);
    return null;
  }
}

/**
 * Obtiene todas las semanas de un mes específico
 */
export function getWeeksInMonth(month: number, year: number = new Date().getFullYear()): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  
  for (let week = 1; week <= 52; week++) {
    const weekInfo = getWeekInfo(week, year);
    if (weekInfo) {
      const startMonth = getMonth(weekInfo.startDate);
      const endMonth = getMonth(weekInfo.endDate);
      
      if (startMonth === month || endMonth === month) {
        weeks.push(weekInfo);
      }
    }
  }
  
  return weeks;
}

/**
 * Obtiene el label inteligente para una semana
 */
export function getWeekLabel(weekNumber: number, year: number = new Date().getFullYear()): string {
  const weekInfo = getWeekInfo(weekNumber, year);
  if (!weekInfo) return `Semana ${weekNumber}`;
  
  const startMonth = getMonth(weekInfo.startDate);
  const endMonth = getMonth(weekInfo.endDate);
  
  if (startMonth !== endMonth) {
    return `Semana ${weekNumber} - ${format(weekInfo.startDate, 'MMM', { locale: es })}`;
  }
  
  return `Semana ${weekNumber}`;
}