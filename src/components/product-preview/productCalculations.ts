
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
      return Math.round(price / 0.5) * 0.5;
    case 'none':
      return price;
    default:
      return price;
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
