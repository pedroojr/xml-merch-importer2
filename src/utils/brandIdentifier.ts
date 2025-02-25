
export type BrandInfo = {
  brand: string;
  confidence: number;
};

export const extractReferencePattern = (text: string): string | null => {
  // Padrões comuns de referência
  const patterns = [
    // Letra seguida de números (ex: K12345, M1234)
    /[A-Z][0-9]{4,5}/i,
    // Duas letras seguidas de números (ex: BR123, EL123)
    /[A-Z]{2}[0-9]{3,4}/i,
    // Apenas números com 5 dígitos
    /^[0-9]{5}$/,
    // Referência com hífen (ex: AB-1234)
    /[A-Z]{1,2}-[0-9]{3,4}/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  return null;
};

export const identifyBrand = (reference: string, name: string): BrandInfo => {
  // Tenta encontrar um padrão de referência tanto no código quanto no nome
  const refPattern = extractReferencePattern(reference) || extractReferencePattern(name);
  
  if (!refPattern) {
    return { brand: 'OUTROS', confidence: 0.3 };
  }

  // Extrai o prefixo da referência (letras iniciais)
  const prefix = refPattern.match(/^[A-Z]+/);
  if (prefix) {
    // Se encontrou um prefixo, usa ele como identificador da marca
    const brandPrefix = prefix[0];
    let confidence = 0.8; // Alta confiança para referências com prefixo

    // Verifica se o prefixo aparece no nome do produto também
    if (name.toUpperCase().includes(brandPrefix)) {
      confidence = 0.9; // Aumenta a confiança se o prefixo também está no nome
    }

    return {
      brand: `REF-${brandPrefix}`,
      confidence
    };
  }

  // Para referências apenas numéricas
  if (/^[0-9]+$/.test(refPattern)) {
    return {
      brand: 'REF-NUM',
      confidence: 0.6
    };
  }

  // Para outros padrões de referência
  return {
    brand: `REF-${refPattern.substring(0, 2)}`,
    confidence: 0.7
  };
};

// Função auxiliar para ajudar no debug
export const analyzeReference = (reference: string, name: string) => {
  console.log('Analisando referência:', {
    reference,
    name,
    extractedPattern: extractReferencePattern(reference),
    namePattern: extractReferencePattern(name),
    result: identifyBrand(reference, name)
  });
};
