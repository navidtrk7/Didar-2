"use client";

import React, { useState } from "react";
import { SectionHeader, Panel, Button, Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Image as ImageIcon, Upload, Sparkles, CheckCircle } from "lucide-react";

export default function ProductGalleryPage() {
  const { toast } = useToast();

  const [images, setImages] = useState([
    { id: "img-1", title: "انگشتر زمرد کلکسیون نور", sku: "SKU-18K-RING-01", url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60", verified: true },
    { id: "img-2", title: "دستبند کارتیه کلاسیک", sku: "SKU-18K-BRAC-02", url: "https://images.unsplash.com/photo-1611591475140-13b9426c11d0?w=500&auto=format&fit=crop&q=60", verified: true },
    { id: "img-3", title: "گردنبند طلا طرح مروارید", sku: "SKU-18K-NECK-03", url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60", verified: true },
    { id: "img-4", title: "گوشواره طلا طرح خورشید", sku: "SKU-18K-EAR-04", url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&auto=format&fit=crop&q=60", verified: true },
  ]);

  const handleUpload = () => {
    toast("تصویر جدید با موفقیت بارگذاری و پردازش شد");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مدیریت تصاویر و گالری کاتالوگ (Image Management)"
        description="بارگذاری تصاویر باکیفیت، کادربندی استاندارد کاتالوگ و اتچ تصاویر به SKUهای طلا."
        action={
          <Button onClick={handleUpload} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Upload className="w-4 h-4" />
            <span>بارگذاری تصویر جدید</span>
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((img) => (
          <Panel key={img.id} className="overflow-hidden p-0 flex flex-col group">
            <div className="relative aspect-square bg-slate-900 overflow-hidden">
              <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <Badge tone="ok" className="absolute top-3 right-3 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                کاتالوگ رسمی
              </Badge>
            </div>
            <div className="p-4 space-y-1">
              <p className="font-bold text-sm text-[var(--ink)]">{img.title}</p>
              <p className="font-mono text-xs text-amber-600" data-ltr>{img.sku}</p>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
