export type BrazilState = {
  uf: string;
  name: string;
  amchartsId: string;
};

export const BRAZIL_STATES: BrazilState[] = [
  { uf: "AC", name: "Acre", amchartsId: "BR-AC" },
  { uf: "AL", name: "Alagoas", amchartsId: "BR-AL" },
  { uf: "AP", name: "Amapá", amchartsId: "BR-AP" },
  { uf: "AM", name: "Amazonas", amchartsId: "BR-AM" },
  { uf: "BA", name: "Bahia", amchartsId: "BR-BA" },
  { uf: "CE", name: "Ceará", amchartsId: "BR-CE" },
  { uf: "DF", name: "Distrito Federal", amchartsId: "BR-DF" },
  { uf: "ES", name: "Espírito Santo", amchartsId: "BR-ES" },
  { uf: "GO", name: "Goiás", amchartsId: "BR-GO" },
  { uf: "MA", name: "Maranhão", amchartsId: "BR-MA" },
  { uf: "MT", name: "Mato Grosso", amchartsId: "BR-MT" },
  { uf: "MS", name: "Mato Grosso do Sul", amchartsId: "BR-MS" },
  { uf: "MG", name: "Minas Gerais", amchartsId: "BR-MG" },
  { uf: "PA", name: "Pará", amchartsId: "BR-PA" },
  { uf: "PB", name: "Paraíba", amchartsId: "BR-PB" },
  { uf: "PR", name: "Paraná", amchartsId: "BR-PR" },
  { uf: "PE", name: "Pernambuco", amchartsId: "BR-PE" },
  { uf: "PI", name: "Piauí", amchartsId: "BR-PI" },
  { uf: "RJ", name: "Rio de Janeiro", amchartsId: "BR-RJ" },
  { uf: "RN", name: "Rio Grande do Norte", amchartsId: "BR-RN" },
  { uf: "RS", name: "Rio Grande do Sul", amchartsId: "BR-RS" },
  { uf: "RO", name: "Rondônia", amchartsId: "BR-RO" },
  { uf: "RR", name: "Roraima", amchartsId: "BR-RR" },
  { uf: "SC", name: "Santa Catarina", amchartsId: "BR-SC" },
  { uf: "SP", name: "São Paulo", amchartsId: "BR-SP" },
  { uf: "SE", name: "Sergipe", amchartsId: "BR-SE" },
  { uf: "TO", name: "Tocantins", amchartsId: "BR-TO" },
];

export function getStateByUF(uf: string): BrazilState | undefined {
  const key = uf.trim().toUpperCase();
  return BRAZIL_STATES.find((s) => s.uf === key);
}

export function normalizeStateUF(raw: string | null | undefined): string | null {
  const text = String(raw ?? "").trim().toUpperCase();
  if (!text) return null;

  if (/^BR-[A-Z]{2}$/.test(text)) {
    const uf = text.slice(3);
    return getStateByUF(uf) ? uf : null;
  }

  if (/^[A-Z]{2}$/.test(text)) {
    return getStateByUF(text) ? text : null;
  }

  return null;
}
