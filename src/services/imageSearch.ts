
import { toast } from "sonner";

export interface ImageSearchParams {
  ean: string;
  code: string;
  description: string;
}

export const searchProductImage = async ({ ean, code, description }: ImageSearchParams): Promise<string> => {
  try {
    const searchTerms = `${ean} ${code} ${description}`.trim();
    console.log('Buscando imagem com os termos:', searchTerms);
    
    // Usando DuckDuckGo para buscar imagens, que não requer API key
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(searchTerms)}&iax=images&ia=images`;
    
    // Por enquanto, vamos usar uma imagem de placeholder enquanto implementamos a busca real
    // Em produção, você deve implementar a busca real de imagens
    console.warn('Termos de busca usados:', searchTerms);
    return "https://placehold.co/400x400/png?text=Aguardando+Integração";

  } catch (error) {
    console.error('Erro ao buscar imagem do produto:', error);
    return "https://placehold.co/400x400/png?text=Erro+na+busca";
  }
};

export const downloadImage = async (imageUrl: string, fileName: string) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Falha ao baixar imagem');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Imagem baixada com sucesso!');
  } catch (error) {
    console.error('Erro ao fazer download da imagem:', error);
    toast.error('Erro ao fazer download da imagem');
  }
};
