
import { toast } from "sonner";

export interface ImageSearchParams {
  ean: string;
  code: string;
  description: string;
}

export const searchProductImage = async ({ ean, code, description }: ImageSearchParams): Promise<string> => {
  try {
    const searchTerms = `${ean} ${code} ${description}`.trim();
    console.log('Termos de busca:', searchTerms);
    
    // Em vez de abrir uma nova aba, retornamos a URL de busca
    // que será usada no modal
    return `https://www.google.com/search?q=${encodeURIComponent(searchTerms)}&tbm=isch`;
  } catch (error) {
    console.error('Erro ao gerar URL de busca:', error);
    toast.error('Erro ao preparar busca de imagens');
    throw error;
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
    // Adiciona o EAN ao nome do arquivo
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    link.download = `${fileName}.${extension}`;
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
