
export const calculateSalePrice = (product: any, markup: number) => {
  const basePrice = product.netPrice;
  return basePrice * (1 + markup / 100);
};

export const roundPrice = (price: number, type: '90' | '50') => {
  const roundedDown = Math.floor(price);
  const decimal = type === '90' ? 0.9 : 0.5;
  return roundedDown + decimal;
};

export const calculateTotals = (products: any[]) => {
  return products.reduce((acc, product) => ({
    totalBruto: acc.totalBruto + product.totalPrice,
    totalDesconto: acc.totalDesconto + product.discount,
    totalLiquido: acc.totalLiquido + product.netPrice,
  }), { totalBruto: 0, totalDesconto: 0, totalLiquido: 0 });
};
