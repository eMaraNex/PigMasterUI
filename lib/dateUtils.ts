/**
 * Date Helper Utilities for Frontend
 * Provides dynamic date calculations and year handling for React/Next.js
 * Ensures the application works correctly in any year without hardcoded values
 */

/**
 * Get the current year
 * @returns {number} Current year
 */
export const getCurrentYear = (): number => new Date().getFullYear();

/**
 * Get the current month (1-12)
 * @returns {number} Current month
 */
export const getCurrentMonth = (): number => new Date().getMonth() + 1;

/**
 * Get the current date
 * @returns {Date} Current date
 */
export const getCurrentDate = (): Date => new Date();

/**
 * Calculate age in months
 * @param {string|Date} birthDate - Birth date of the pig
 * @returns {number} Age in months
 */
export const calculateAge = (birthDate: string | Date): number => {
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + 
                 (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
};

/**
 * Calculate age in years
 * @param {string|Date} birthDate - Birth date of the pig
 * @returns {number} Age in years
 */
export const calculateAgeInYears = (birthDate: string | Date): number => {
  return Math.floor(calculateAge(birthDate) / 12);
};

/**
 * Get the current fiscal year
 * Defaults to calendar year, can be configured via environment variable
 * @param {Date} date - Date to calculate fiscal year for (defaults to current date)
 * @returns {number} Fiscal year
 */
export const getCurrentFiscalYear = (date: Date = new Date()): number => {
  // Get fiscal year start month from environment or default to January (1)
  const fiscalYearStartMonth = parseInt(process.env.NEXT_PUBLIC_FISCAL_YEAR_START_MONTH || '1');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // If current month is before fiscal year start, we're in previous fiscal year
  return month < fiscalYearStartMonth ? year - 1 : year;
};

/**
 * Get the fiscal year date range
 * @param {number} fiscalYear - The fiscal year (e.g., 2024)
 * @returns {object} Object with start and end dates
 */
export const getFiscalYearRange = (fiscalYear: number) => {
  const fiscalYearStartMonth = parseInt(process.env.NEXT_PUBLIC_FISCAL_YEAR_START_MONTH || '1');
  const startDate = new Date(fiscalYear, fiscalYearStartMonth - 1, 1);
  const endDate = new Date(fiscalYear + 1, fiscalYearStartMonth - 1, 0);
  
  return {
    start: startDate,
    end: endDate,
    startISO: startDate.toISOString().split('T')[0],
    endISO: endDate.toISOString().split('T')[0]
  };
};

/**
 * Get the start date of the current year
 * @returns {Date} January 1st of current year
 */
export const getYearStartDate = (): Date => {
  const year = getCurrentYear();
  return new Date(year, 0, 1);
};

/**
 * Get the end date of the current year
 * @returns {Date} December 31st of current year
 */
export const getYearEndDate = (): Date => {
  const year = getCurrentYear();
  return new Date(year, 11, 31);
};

/**
 * Check if a date is in the current year
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in current year
 */
export const isCurrentYear = (date: string | Date): boolean => {
  const checkDate = new Date(date);
  return checkDate.getFullYear() === getCurrentYear();
};

/**
 * Check if a date is in the current fiscal year
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in current fiscal year
 */
export const isCurrentFiscalYear = (date: string | Date): boolean => {
  const checkDate = new Date(date);
  return getCurrentFiscalYear(checkDate) === getCurrentFiscalYear();
};

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date for database queries
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateForDatabase = (date: string | Date): string => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

/**
 * Get the beginning of the day
 * @param {Date} date - Date to get the beginning of
 * @returns {Date} Start of day (00:00:00)
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the day
 * @param {Date} date - Date to get the end of
 * @returns {Date} End of day (23:59:59)
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get date range for reports
 * @param {string} rangeType - Type of range ('week', 'month', 'quarter', 'year', 'all')
 * @returns {object} Object with startDate and endDate
 */
export const getDateRangeForReport = (rangeType: string = 'month') => {
  const now = new Date();
  let startDate: Date;
  
  switch (rangeType) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'all':
    default:
      startDate = new Date(0); // Unix epoch
      break;
  }
  
  return {
    startDate,
    endDate: now,
    startISO: formatDateForDatabase(startDate),
    endISO: formatDateForDatabase(now)
  };
};

/**
 * Check if a pig is ready for breeding based on age
 * @param {string|Date} birthDate - Birth date of the pig
 * @param {number} minimumAgeMonths - Minimum age in months (default: 9)
 * @returns {boolean} True if pig is old enough for breeding
 */
export const isBreedingAge = (birthDate: string | Date, minimumAgeMonths: number = 9): boolean => {
  const ageInMonths = calculateAge(birthDate);
  return ageInMonths >= minimumAgeMonths;
};

/**
 * Calculate expected birth date from mating date
 * Pig gestation period is approximately 114 days
 * @param {string|Date} matingDate - Date of mating
 * @returns {Date} Expected birth date
 */
export const calculateExpectedBirthDate = (matingDate: string | Date): Date => {
  const mating = new Date(matingDate);
  const expectedBirth = new Date(mating);
  expectedBirth.setDate(expectedBirth.getDate() + 114);
  return expectedBirth;
};

/**
 * Check if a breeding date is overdue
 * @param {string|Date} matingDate - Date of mating
 * @param {number} daysOverdue - Number of days to consider overdue (default: 5)
 * @returns {boolean} True if breeding is overdue
 */
export const isBreedingOverdue = (matingDate: string | Date, daysOverdue: number = 5): boolean => {
  const expectedDate = calculateExpectedBirthDate(matingDate);
  const overdueDate = new Date(expectedDate);
  overdueDate.setDate(overdueDate.getDate() + daysOverdue);
  return new Date() > overdueDate;
};

/**
 * Get age label for display
 * @param {string|Date} birthDate - Birth date of the pig
 * @returns {string} Age label (e.g., "2 years 3 months")
 */
export const getAgeLabel = (birthDate: string | Date): string => {
  const ageMonths = calculateAge(birthDate);
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  }
};

export default {
  getCurrentYear,
  getCurrentMonth,
  getCurrentDate,
  calculateAge,
  calculateAgeInYears,
  getCurrentFiscalYear,
  getFiscalYearRange,
  getYearStartDate,
  getYearEndDate,
  isCurrentYear,
  isCurrentFiscalYear,
  formatDateForDisplay,
  formatDateForDatabase,
  getStartOfDay,
  getEndOfDay,
  getDateRangeForReport,
  isBreedingAge,
  calculateExpectedBirthDate,
  isBreedingOverdue,
  getAgeLabel,
};
