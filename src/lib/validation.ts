export const reasons = [
  "Administración de consorcios",
  "Consulta inmobiliaria",
  "Otra consulta",
] as const;
export type ContactData = {
  name: string;
  email: string;
  phone: string;
  building: string;
  reason: string;
  message: string;
  website: string;
  startedAt: number;
};
export type Errors = Partial<Record<keyof ContactData, string>>;
export const limits = {
  name: 100,
  email: 254,
  phone: 40,
  building: 200,
  reason: 50,
  message: 4000,
  website: 200,
};
export function validate(data: unknown): {
  data?: ContactData;
  errors: Errors;
} {
  if (!data || typeof data !== "object")
    return { errors: { message: "Revisá los datos de la consulta." } };
  const raw = data as Record<string, unknown>;
  const errors: Errors = {};
  const result = {} as Record<string, string | number>;
  for (const [key, max] of Object.entries(limits)) {
    const value = raw[key];
    if (typeof value !== "string") {
      errors[key as keyof ContactData] = "Revisá este campo.";
      result[key] = "";
    } else {
      result[key] = value.trim();
      if (value.length > max)
        errors[key as keyof ContactData] = `Usá hasta ${max} caracteres.`;
    }
  }
  if (!result.name) errors.name = "Ingresá tu nombre y apellido.";
  if (
    typeof result.email !== "string" ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result.email)
  )
    errors.email = "Ingresá un email válido.";
  if (!result.message) errors.message = "Contanos brevemente qué necesitás.";
  if (!reasons.includes(result.reason as (typeof reasons)[number]))
    errors.reason = "Elegí un motivo.";
  result.startedAt =
    typeof raw.startedAt === "number" && Number.isFinite(raw.startedAt)
      ? raw.startedAt
      : 0;
  return Object.keys(errors).length
    ? { errors }
    : { data: result as ContactData, errors };
}
