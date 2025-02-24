
import React from 'react';
import { Product } from '../../../types/nfe';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '../../../utils/formatters';

interface ProfitabilityAnalysisProps {
  products: Product[];
  xapuriMarkup: number;
  epitaMarkup: number;
}

export const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({
  products,
  xapuriMarkup,
  epitaMarkup
}) => {
  const totalCost = products.reduce((sum, product) => sum + product.netPrice, 0);
  const avgMarkup = (xapuriMarkup + epitaMarkup) / 2;
  const projectedRevenue = totalCost * (1 + avgMarkup / 100);
  const grossProfit = projectedRevenue - totalCost;
  const grossMargin = (grossProfit / totalCost) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Custo Total (CPV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Faturamento Projetado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(projectedRevenue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lucro Bruto Projetado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margem Bruta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{grossMargin.toFixed(2)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};
