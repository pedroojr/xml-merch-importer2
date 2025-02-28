
import React from 'react';
import { Product } from '../../../types/nfe';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '../../../utils/formatters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

interface PricingAnalysisProps {
  products: Product[];
  xapuriMarkup: number;
  epitaMarkup: number;
  monthlyFixedCosts: number;
  taxRate: number;
  freightCostPercentage: number;
}

export const PricingAnalysis: React.FC<PricingAnalysisProps> = ({
  products,
  xapuriMarkup,
  epitaMarkup,
  monthlyFixedCosts,
  taxRate,
  freightCostPercentage
}) => {
  // Calculando os totais e médias
  const totalCost = products.reduce((sum, product) => sum + product.netPrice, 0);
  const freightCost = totalCost * (freightCostPercentage / 100);
  const taxCost = totalCost * (taxRate / 100);
  
  // Custo total incluindo frete e impostos
  const totalCostWithFreightAndTax = totalCost + freightCost + taxCost;
  const avgUnitCost = totalCostWithFreightAndTax / Math.max(1, products.length);
  
  // Calculando preços sugeridos com base nos custos adicionais
  const suggestedXapuriMarkup = xapuriMarkup;
  const suggestedEpitaMarkup = epitaMarkup;
  
  const avgXapuriPrice = avgUnitCost * (1 + suggestedXapuriMarkup / 100);
  const avgEpitaPrice = avgUnitCost * (1 + suggestedEpitaMarkup / 100);
  
  // Calculando margens
  const xapuriMargin = ((avgXapuriPrice - avgUnitCost) / avgXapuriPrice) * 100;
  const epitaMargin = ((avgEpitaPrice - avgUnitCost) / avgEpitaPrice) * 100;
  
  // Estimativa de ponto de equilíbrio
  const avgProfit = (avgXapuriPrice + avgEpitaPrice) / 2 - avgUnitCost;
  const breakEvenUnits = Math.ceil(monthlyFixedCosts / avgProfit);
  
  // Distribuição de preços (agrupando produtos por faixas de preço)
  const priceRanges = [0, 50, 100, 200, 500, 1000, Infinity];
  const priceDistribution = priceRanges.slice(0, -1).map((min, index) => {
    const max = priceRanges[index + 1];
    const count = products.filter(p => {
      const productCostWithFreightAndTax = p.netPrice * (1 + freightCostPercentage / 100) + (p.netPrice * (taxRate / 100));
      const avgPrice = (
        productCostWithFreightAndTax * (1 + suggestedXapuriMarkup / 100) + 
        productCostWithFreightAndTax * (1 + suggestedEpitaMarkup / 100)
      ) / 2;
      return avgPrice >= min && avgPrice < max;
    }).length;
    const label = max === Infinity 
      ? `Acima de ${formatCurrency(min)}` 
      : `${formatCurrency(min)} - ${formatCurrency(max)}`;
    return { label, count };
  }).filter(range => range.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Custo Médio por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgUnitCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Inclui frete e impostos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Margem Média (Xapuri)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{xapuriMargin.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Valor: {formatCurrency(avgXapuriPrice - avgUnitCost)} por unidade
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Margem Média (Epitaciolândia)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{epitaMargin.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Valor: {formatCurrency(avgEpitaPrice - avgUnitCost)} por unidade
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ponto de Equilíbrio Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{breakEvenUnits} unidades</div>
            <p className="text-sm text-muted-foreground mt-1">
              Para cobrir custos fixos mensais
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise de Distribuição de Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceDistribution.map((range, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{range.label}</span>
                    <span className="text-sm text-muted-foreground">{range.count} produto(s)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(range.count / products.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Insights Estratégicos de Precificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Percepção de Valor</AlertTitle>
              <AlertDescription>
                A sua margem média está em {((xapuriMargin + epitaMargin) / 2).toFixed(1)}%. Com os custos adicionais considerados, essa margem reflete melhor o valor real dos produtos.
              </AlertDescription>
            </Alert>
            
            <Alert variant="default" className="bg-emerald-50 border-emerald-200">
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Sugestão de Ajuste</AlertTitle>
              <AlertDescription>
                Com a inclusão de {formatCurrency(freightCost)} de frete e {formatCurrency(taxCost)} de impostos, o preço sugerido já considera custos operacionais importantes para sua rentabilidade.
              </AlertDescription>
            </Alert>
            
            <div className="pt-2">
              <h4 className="font-medium text-sm mb-2">Impacto de Ajustes de Preço:</h4>
              <p className="text-sm text-slate-600">
                Um aumento de 5% no markup resultaria em uma margem de {((xapuriMargin * 1.05 + epitaMargin * 1.05) / 2).toFixed(1)}% e reduziria o ponto de equilíbrio para aproximadamente {Math.ceil(monthlyFixedCosts / (avgProfit * 1.05))} unidades.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
