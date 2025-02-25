
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value);
};

// Função para converter número para formato brasileiro ao copiar
export const formatNumberForCopy = (value: number, decimalPlaces: number = 2): string => {
  return value.toFixed(decimalPlaces).replace('.', ',');
};
