"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const images = [
  "/products/product-01.jpg",
  "/products/product-02.jpg",
  "/products/product-03.jpg",
  "/products/product-04.jpg",
];

export function VaultVisual() {
  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden sm:min-h-[78vh] sm:aspect-[16/11]">
      <Image
        src="/brand/world-hero.webp"
        alt="جهان دیدار گلد"
        fill
        priority
        className="object-cover object-[center_30%] sm:object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[rgba(4,30,66,0.5)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,30,66,0.25)_0%,rgba(4,30,66,0.15)_40%,rgba(4,30,66,0.92)_72%,rgba(4,30,66,0.98)_100%)]" />

      {/* Product strip: desktop/tablet only — keep mobile hero calm */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="absolute inset-x-0 top-[14%] hidden justify-center px-4 sm:flex"
      >
        <div className="grid w-full max-w-3xl grid-cols-4 gap-3">
          {images.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.5 }}
              className="relative aspect-square overflow-hidden rounded-2xl border border-white/25 bg-[#F7F3EE] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]"
            >
              <Image
                src={src}
                alt={`محصول دیدار گلد ${i + 1}`}
                fill
                className="object-cover"
                sizes="12vw"
                priority={i < 2}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
