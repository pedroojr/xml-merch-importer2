
interface SizePattern {
  pattern: RegExp;
  sizes: string[];
  description: string;
}

const sizePatterns: SizePattern[] = [
  {
    pattern: /\b(PP|P|M|G|GG|XG|XXG)\b/i,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'],
    description: 'Tamanhos padrão de vestuário'
  },
  {
    pattern: /\b(\d{2}\/\d{2})\b/,
    sizes: [], // Dinâmico, ex: "34/35"
    description: 'Tamanhos de calçados com faixa'
  },
  {
    pattern: /\b(\d{2,3})(cm)?\b/,
    sizes: [], // Dinâmico, ex: "42" ou "42cm"
    description: 'Tamanhos numéricos'
  },
  {
    pattern: /\bTAM(?:ANHO)?[\s:.]-?\s*([A-Za-z0-9]{1,3})\b/i,
    sizes: [], // Dinâmico, ex: "TAM: G" ou "TAMANHO M"
    description: 'Indicador explícito de tamanho'
  },
  {
    pattern: /\b(INFANTIL|ADULTO|JUVENIL)\b/i,
    sizes: ['INFANTIL', 'ADULTO', 'JUVENIL'],
    description: 'Categorias de tamanho'
  }
];

const normalizarTamanho = (tamanho: string): string => {
  // Remove espaços extras e converte para maiúsculas
  const normalizado = tamanho.trim().toUpperCase();
  
  // Padroniza nomenclaturas específicas
  const padronizacoes: { [key: string]: string } = {
    'PEQUENO': 'P',
    'MEDIO': 'M',
    'MÉDIO': 'M',
    'GRANDE': 'G',
    'EXTRA GRANDE': 'XG',
    'EXTRA PEQUENO': 'PP'
  };

  return padronizacoes[normalizado] || normalizado;
};

const validarTamanho = (tamanho: string): boolean => {
  // Lista de tamanhos válidos conhecidos
  const tamanhosValidos = new Set([
    'PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG',
    'INFANTIL', 'ADULTO', 'JUVENIL'
  ]);

  // Padrões de tamanhos numéricos válidos
  const padraoNumerico = /^\d{2,3}$/;  // 2 ou 3 dígitos
  const padraoFaixa = /^\d{2}\/\d{2}$/;  // formato 00/00

  const tamanhoNormalizado = normalizarTamanho(tamanho);

  return tamanhosValidos.has(tamanhoNormalizado) ||
         padraoNumerico.test(tamanhoNormalizado) ||
         padraoFaixa.test(tamanhoNormalizado);
};

export const extrairTamanhoDaDescricao = (descricao: string): string => {
  if (!descricao) return '';

  // Converte para maiúsculas para facilitar a comparação
  const textoNormalizado = descricao.toUpperCase();
  
  for (const { pattern } of sizePatterns) {
    const match = textoNormalizado.match(pattern);
    if (match && match[1]) {
      const tamanhoEncontrado = normalizarTamanho(match[1]);
      if (validarTamanho(tamanhoEncontrado)) {
        return tamanhoEncontrado;
      }
    }
  }

  // Se não encontrou um tamanho válido nos padrões principais,
  // procura por palavras-chave específicas
  const palavrasChave = ['TAMANHO', 'TAM', 'SIZE'];
  for (const palavra of palavrasChave) {
    const index = textoNormalizado.indexOf(palavra);
    if (index !== -1) {
      // Pega até 5 caracteres após a palavra-chave
      const trecho = textoNormalizado.slice(index + palavra.length, index + palavra.length + 5);
      const match = trecho.match(/[A-Z0-9]+/);
      if (match) {
        const tamanhoEncontrado = normalizarTamanho(match[0]);
        if (validarTamanho(tamanhoEncontrado)) {
          return tamanhoEncontrado;
        }
      }
    }
  }

  return '';
};

// Função para debug e análise de padrões
export const analisarPadroesDetalhados = (descricao: string): { 
  tamanhoEncontrado: string;
  padraoUtilizado?: string;
  detalhes: string[];
} => {
  const detalhes: string[] = [];
  
  if (!descricao) {
    return { 
      tamanhoEncontrado: '', 
      detalhes: ['Descrição vazia']
    };
  }

  const textoNormalizado = descricao.toUpperCase();
  detalhes.push(`Texto normalizado: ${textoNormalizado}`);

  for (const { pattern, description } of sizePatterns) {
    const match = textoNormalizado.match(pattern);
    if (match) {
      detalhes.push(`Padrão encontrado: ${description}`);
      detalhes.push(`Match completo: ${match[0]}`);
      
      if (match[1]) {
        const tamanhoNormalizado = normalizarTamanho(match[1]);
        detalhes.push(`Tamanho normalizado: ${tamanhoNormalizado}`);
        
        if (validarTamanho(tamanhoNormalizado)) {
          return {
            tamanhoEncontrado: tamanhoNormalizado,
            padraoUtilizado: description,
            detalhes
          };
        } else {
          detalhes.push(`Tamanho "${tamanhoNormalizado}" não passou na validação`);
        }
      }
    }
  }

  return {
    tamanhoEncontrado: '',
    detalhes: [...detalhes, 'Nenhum tamanho válido encontrado']
  };
};
