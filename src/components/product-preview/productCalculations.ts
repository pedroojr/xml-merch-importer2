
import { Product } from '../../types/nfe';

export const calculateSalePrice = (product: Product, markup: number): number => {
  const markupMultiplier = 1 + markup / 100;
  return product.netPrice * markupMultiplier;
};

export const roundPrice = (price: number, type: '90' | '50'): number => {
  const integer = Math.floor(price);
  return type === '90' ? integer + 0.90 : Math.round(price / 0.5) * 0.5;
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
