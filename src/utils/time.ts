export const duration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const roundedMinutes = Math.round(remainingMinutes / 15) * 15;
  if (roundedMinutes === 0) {
    return hours === 1 ? `${hours} time` : `${hours} timer`;
  }
  return `${hours} t ${roundedMinutes} min`;
};
