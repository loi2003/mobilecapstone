import {
  parse,
  format,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns'
import { enUS, vi } from 'date-fns/locale'

/**
 * Converts a date and time string to ISO string using date-fns
 * @param {Date} date - The selected date
 * @param {string} timeString - Time string in format "HH:MM" (e.g., "08:00", "15:30")
 * @returns {string} ISO string
 */
export const convertToISOString = (date, timeString) => {
  const timeFormat = 'HH:mm'
  let parsedTime

  try {
    parsedTime = parse(timeString, timeFormat, new Date())
  } catch {
    throw new Error('Invalid time format. Expected format: "HH:mm"')
  }

  const hours = parsedTime.getHours()
  const minutes = parsedTime.getMinutes()

  const appointmentDate = setMilliseconds(
    setSeconds(setMinutes(setHours(date, hours), minutes), 0),
    0
  )

  return format(appointmentDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
}

/**
 * Formats a date for display using date-fns
 * @param {Date} date
 * @returns {string}
 */
export const formatDateForDisplay = (date) => {
  return format(date, 'EEEE, d MMMM yyyy', { locale: enUS })
}

/**
 * Formats a date for input field (YYYY-MM-DD format)
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateForInput = (date) => {
  if (typeof date === 'string') {
    const parsedDate = new Date(date)
    return format(parsedDate, 'yyyy-MM-dd')
  }
  return format(date, 'yyyy-MM-dd')
}

/**
 * Legacy display (just return the string)
 * @param {string} timeString
 * @returns {string}
 */
export const formatTimeForDisplayLegacy = (timeString) => {
  return timeString
}

/**
 * Formats time for display (handles Date or string)
 * @param {Date|string} time
 * @returns {string}
 */
export const formatTimeForDisplay = (time) => {
  if (typeof time === 'string') {
    return time
  }
  return format(time, 'HH:mm')
}

/**
 * Formats a date and time for display
 * @param {Date} date
 * @returns {string}
 */
export const formatDateTimeForDisplay = (date) => {
  return format(date, 'EEEE, d MMMM yyyy HH:mm', { locale: vi })
}

/**
 * Formats time in 24-hour format
 * @param {Date} date
 * @returns {string}
 */
export const formatTime24Hour = (date) => {
  return format(date, 'HH:mm')
}

/**
 * Formats time in 12-hour format with AM/PM
 * @param {Date} date
 * @returns {string}
 */
export const formatTime12Hour = (date) => {
  return format(date, 'hh:mm a', { locale: vi })
}

/**
 * Format time slot in 24h format (HH:mm)
 * @param {Date} date
 * @returns {string}
 */
export const formatTimeSlot24h = (date) => {
  return format(date, 'HH:mm')
}

/**
 * Format ISO date string in UTC, in dd/MM/yyyy format
 * @param {string} isoString
 * @returns {string}
 */
export const formatDateForDisplayUTC = (isoString) => {
  const date = new Date(isoString)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
  
}
/**
 * Format a date in "yyyy/MM/dd" format (for API)
 * @param {Date | string} date
 * @returns {string}
 */
export const formatDateForApi = (date) => {
  return format(new Date(date), 'yyyy/MM/dd')
}

