
import { Product } from '../../types/nfe';

export const generateProductDescription = (product: Product): string => {
  const parts: string[] = [];
  
  // Nome base do produto (primeira palavra em maiúscula)
  const baseName = product.name.split(' ')[0].toUpperCase();
  parts.push(baseName);

  // Adiciona detalhes específicos
  if (product.reference) {
    parts.push(`REF. ${product.reference}`);
  }

  // Adiciona cor se disponível
  if (product.color) {
    parts.push(`COR ${product.color.toUpperCase()}`);
  }

  // Adiciona tamanho se disponível
  if (product.size) {
    parts.push(`TAM ${product.size}`);
  }

  // Adiciona código e EAN
  if (product.code) {
    parts.push(`CÓD ${product.code}`);
  }
  if (product.ean) {
    parts.push(`EAN ${product.ean}`);
  }

  // Une todas as partes com separador
  return parts.join(' | ');
};
