
import { toast } from "sonner";

export interface ImageSearchParams {
  ean: string;
  code: string;
  description: string;
}

export const searchProductImage = async ({ ean, code, description }: ImageSearchParams): Promise<void> => {
  try {
    const searchTerms = `${ean} ${code} ${description}`.trim();
    console.log('Termos de busca:', searchTerms);
    
    // Abre o Google Images em uma nova aba com os termos de busca
    const googleImagesUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerms)}&tbm=isch`;
    window.open(googleImagesUrl, '_blank');
    
  } catch (error) {
    console.error('Erro ao abrir busca de imagens:', error);
    toast.error('Erro ao abrir busca de imagens');
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
