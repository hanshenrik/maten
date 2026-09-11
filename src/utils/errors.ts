/** A readable message from whatever was thrown: Error, Supabase error or unknown. */
export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Ukjent feil";
};
