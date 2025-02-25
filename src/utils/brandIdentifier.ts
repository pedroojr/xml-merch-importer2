
export type BrandInfo = {
  brand: string;
  confidence: number;
};

export const identifyBrand = (reference: string, name: string): BrandInfo => {
  // Converte para maiúsculas para comparação
  const ref = reference.toUpperCase();
  const productName = name.toUpperCase();

  // Padrões comuns de referência por marca
  const patterns = {
    KYLY: [
      /^[0-9]{5}$/, // 5 dígitos
      /^K[0-9]{4}$/, // K seguido de 4 dígitos
    ],
    ELIAN: [
      /^E[0-9]{4,5}$/, // E seguido de 4 ou 5 dígitos
      /^EL[0-9]{3,4}$/, // EL seguido de 3 ou 4 dígitos
    ],
    BRANDILI: [
      /^B[0-9]{4,5}$/, // B seguido de 4 ou 5 dígitos
      /^BR[0-9]{3,4}$/, // BR seguido de 3 ou 4 dígitos
    ],
    MARISOL: [
      /^M[0-9]{4,5}$/, // M seguido de 4 ou 5 dígitos
      /^MA[0-9]{3,4}$/, // MA seguido de 3 ou 4 dígitos
    ],
    FAKINI: [
      /^F[0-9]{4,5}$/, // F seguido de 4 ou 5 dígitos
      /^FK[0-9]{3,4}$/, // FK seguido de 3 ou 4 dígitos
    ],
  };

  // Verifica menções diretas da marca no nome do produto
  for (const [brand, _] of Object.entries(patterns)) {
    if (productName.includes(brand)) {
      return { brand, confidence: 0.9 };
    }
  }

  // Verifica padrões de referência
  for (const [brand, brandPatterns] of Object.entries(patterns)) {
    for (const pattern of brandPatterns) {
      if (pattern.test(ref)) {
        return { brand, confidence: 0.8 };
      }
    }
  }

  // Algumas heurísticas adicionais baseadas em características comuns
  if (ref.startsWith('K') || ref.length === 5) {
    return { brand: 'KYLY', confidence: 0.6 };
  }
  if (ref.startsWith('E') || ref.startsWith('EL')) {
    return { brand: 'ELIAN', confidence: 0.6 };
  }

  return { brand: 'OUTROS', confidence: 0.3 };
};
