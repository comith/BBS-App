"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPreviewUrl, isGoogleDriveUrl } from "../utils/fileHelpers";

interface Props {
  image: string | null;
  onClose: () => void;
}

export function ImageViewer({ image, onClose }: Props) {
  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex justify-between items-center">
            <span>รูปภาพแนบ</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            แสดงรูปภาพที่แนบมากับรายงาน
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-black/5 flex items-center justify-center p-4">
          {image && (
            <div className="relative w-full h-full flex items-center justify-center">
              {isGoogleDriveUrl(image) ? (
                <iframe
                  src={getPreviewUrl(image)}
                  className="w-full h-full rounded shadow-sm border-0"
                  allow="autoplay"
                  title="File Preview"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="ไฟล์แนบ"
                  className="max-w-full max-h-full object-contain rounded shadow-sm"
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
