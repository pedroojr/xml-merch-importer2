
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  productName: string;
  onSearchNew: () => void;
  onDownload: () => void;
}

export const ProductImageModal: React.FC<ProductImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  productName,
  onSearchNew,
  onDownload,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{productName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {imageUrl ? (
            <>
              <div className="relative w-full max-h-[400px] overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt={productName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={onSearchNew} variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Pesquisar Outra Imagem
                </Button>
                <Button onClick={onDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 w-full bg-slate-100 rounded-lg">
              <p className="text-slate-500">Buscando imagem...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
