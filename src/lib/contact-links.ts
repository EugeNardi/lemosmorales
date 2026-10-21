export const whatsappMessage =
  "Hola, quisiera consultar por la administración de mi consorcio.";
export function whatsappUrl(number: string | null) {
  if (!number || !/^\d{8,15}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage)}`;
}
