import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

/**
 * Base utility for formatting dates with Norwegian locale
 */
export const formatDate = ({
  date,
  formatStr = "d. MMM",
}: {
  date: Date | string | number;
  formatStr?: string;
}) => {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(d, formatStr, { locale: nb });
};

/**
 * Returns "mandag" (weekday name in lowercase)
 */
export const formatLongDay = (date: Date | string) => {
  return formatDate({ date, formatStr: "EEEE" });
};

/**
 * Returns "man." (short weekday name)
 */
export const formatShortDay = (date: Date | string) => {
  return formatDate({ date, formatStr: "eee" });
};

/**
 * Returns "28. mar."
 */
export const formatMonthDay = (date: Date | string) => {
  return formatDate({ date, formatStr: "d. MMM" });
};

/**
 * Returns "2026-03-28" (strictly for internal/input use)
 */
export const formatISODate = (date: Date | string) => {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(d, "yyyy-MM-dd");
};

/**
 * Returns "28. mar. – 3. apr."
 */
export const formatDateRange = ({
  start,
  end,
}: {
  start: string;
  end: string;
}) => {
  return `${formatDate({ date: start })} – ${formatDate({ date: end })}`;
};
