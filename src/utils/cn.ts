import { clsx, type ClassValue } from "clsx";

/** Joins class names, skipping falsy values. */
export const cn = (...classes: ClassValue[]) => clsx(classes);
