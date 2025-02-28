
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
  // Cálculos base
  const totalCost = products.reduce((sum, product) => sum + product.netPrice, 0);
  const avgMarkup = (xapuriMarkup + epitaMarkup) / 2;
  const projectedRevenue = totalCost * (1 + avgMarkup / 100);
  const grossProfit = projectedRevenue - totalCost;
  const grossMargin = (grossProfit / projectedRevenue) * 100;

  // Custos operacionais estimados (exemplo)
  const operationalCosts = {
    impostos: totalCost * 0.0925, // 9.25% (PIS/COFINS)
  };

  const totalOperationalCosts = Object.values(operationalCosts).reduce((a, b) => a + b, 0);
  const netProfit = grossProfit - totalOperationalCosts;
  const netMargin = (netProfit / projectedRevenue) * 100;

  return (
    <div className="space-y-6">
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
              Margem Bruta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grossMargin.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(grossProfit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem Líquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netMargin.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(netProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Custos e Margens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Custos Operacionais Estimados</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Impostos (PIS/COFINS)</p>
                  <p className="font-medium">{formatCurrency(operationalCosts.impostos)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Resumo Financeiro</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markup Médio Aplicado</span>
                  <span className="font-medium">{avgMarkup.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Custos Operacionais</span>
                  <span className="font-medium">{formatCurrency(totalOperationalCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Líquido Projetado</span>
                  <span className="font-medium">{formatCurrency(netProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
