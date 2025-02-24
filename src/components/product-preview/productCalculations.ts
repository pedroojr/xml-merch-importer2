
import { Product } from '../../types/nfe';

export const calculateSalePrice = (product: Product, markup: number): number => {
  const markupMultiplier = 1 + markup / 100;
  return product.netPrice * markupMultiplier;
};

export type RoundingType = '90' | '50' | 'none';

export const roundPrice = (price: number, type: RoundingType): number => {
  switch (type) {
    case '90':
      return Math.floor(price) + 0.90;
    case '50':
      return Math.ceil(price * 2) / 2; // Rounds up to nearest 0.50
    case 'none':
      return Number(price.toFixed(2)); // Ensure we don't get floating point errors
    default:
      return Number(price.toFixed(2));
  }
};

export const calculateTotals = (products: Product[]) => {
  return products.reduce((acc, product) => ({
    totalBruto: acc.totalBruto + product.totalPrice,
    totalDesconto: acc.totalDesconto + product.discount,
    totalLiquido: acc.totalLiquido + product.netPrice,
  }), {
    totalBruto: 0,
    totalDesconto: 0,
    totalLiquido: 0,
  });
};
