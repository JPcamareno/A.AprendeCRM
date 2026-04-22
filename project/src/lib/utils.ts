import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('CRC', '₡');
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₡,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
}

export function validatePhone(phone: string): boolean {
  const pattern = /^\d{4}-\d{4}$/;
  return pattern.test(phone);
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'd MMM yyyy', { locale: es });
  } catch {
    return dateString;
  }
}

export function formatDateLong(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateString;
  }
}

export function getWeekDayName(dayIndex: number): string {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return days[dayIndex] || '';
}

export function calculateROI(income: number, expense: number): number {
  if (expense === 0) return 0;
  return ((income - expense) / expense) * 100;
}

export function calculateCPA(expense: number, personCount: number): number {
  if (personCount === 0) return 0;
  return expense / personCount;
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}