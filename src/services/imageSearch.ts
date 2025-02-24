
import { toast } from "sonner";

export interface ImageSearchParams {
  ean: string;
  code: string;
  description: string;
}

export const searchProductImage = async ({ ean, code, description }: ImageSearchParams): Promise<string> => {
  try {
    // Use Google Custom Search API to find product images
    // Note: You'll need to add your Google Custom Search API key and Search Engine ID
    const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // This should be stored in environment variables
    const SEARCH_ENGINE_ID = "YOUR_SEARCH_ENGINE_ID"; // This should be stored in environment variables
    
    const searchTerms = `${ean} ${code} ${description}`.trim();
    console.log('Searching image with terms:', searchTerms);
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchTerms)}&searchType=image&num=1`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Falha na busca de imagem');
    }

    const data = await response.json();
    
    // Check if we have search results
    if (data.items && data.items.length > 0) {
      return data.items[0].link; // Return the URL of the first image
    }

    // If no results found, use a fallback image
    console.warn('No image found for search terms:', searchTerms);
    return "https://placehold.co/400x400/png?text=Imagem+não+encontrada";

  } catch (error) {
    console.error('Error searching for product image:', error);
    
    // Use a fallback image in case of errors
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
    toast.success('Imagem baixada com sucesso');
  } catch (error) {
    console.error('Error downloading image:', error);
    toast.error('Erro ao fazer download da imagem');
  }
};
