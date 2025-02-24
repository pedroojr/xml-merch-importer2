
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  productName: string;
  productEan: string;
  onSearchNew: () => void;
  onDownload: () => void;
}

export const ProductImageModal: React.FC<ProductImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  productName,
  productEan,
  onSearchNew,
  onDownload,
}) => {
  const [searchUrl, setSearchUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);

  useEffect(() => {
    if (isOpen) {
      const searchTerms = encodeURIComponent(`${productEan} ${productName}`);
      setSearchUrl(`https://www.google.com/search?q=${searchTerms}&tbm=isch`);
    }
  }, [isOpen, productEan, productName]);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewUrl(e.target.value);
  };

  const handleDownloadWithUrl = () => {
    if (previewUrl) {
      onDownload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{productName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 h-full">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Cole a URL da imagem aqui"
              value={previewUrl || ''}
              onChange={handleImageUrlChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => window.open(searchUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Buscar Imagens
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            {previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center bg-slate-100 rounded-lg p-4">
                <img
                  src={previewUrl}
                  alt={productName}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setPreviewUrl(null)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
                <p className="text-slate-500">Nenhuma imagem selecionada</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onSearchNew} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Limpar e Buscar Nova
            </Button>
            <Button 
              onClick={handleDownloadWithUrl}
              disabled={!previewUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Imagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
