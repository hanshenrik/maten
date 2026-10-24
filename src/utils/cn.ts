import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names, skipping falsy values. Conflicting Tailwind classes
 * (e.g. `relative` from a component's base and `absolute` from its
 * `className` prop) resolve to the last one, the way the call sites read.
 */
export const cn = (...classes: ClassValue[]) => twMerge(clsx(classes));
