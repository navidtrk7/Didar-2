/** هویت برند از https://didargold.com */
export const brand = {
  nameFa: "دیدار گلد",
  nameEn: "Didar Gold",
  tagline: "طلا و جواهر لوکس، اصالت و اعتماد",
  description:
    "دیدار گلد؛ برند طلا و جواهر لوکس با تمرکز بر اصالت، طراحی اختصاصی و تجربه خصوصی انتخاب جواهر.",
  url: "https://didargold.com",
  email: "info@didargold.com",
  phone: "02152002050",
  phoneDisplay: "۰۲۱ ۵۲۰۰ ۲۰۵۰",
  address: "تهران، بازار بزرگ، سرای چیت‌ساز، واحد ۱۶",
  colors: {
    ink: "#041E42",
    gold: "#B08A57",
    goldText: "#835F26",
    surface: "#F7F3EE",
    surfaceSoft: "#F2F0EB",
    surfaceRaised: "#FFFAF3",
  },
  collections: [
    {
      id: "signature",
      name: "امضای دیدار",
      description:
        "کالکشن امضای دیدار؛ فرم‌های خالص، آرام و ماندگار برای تجربه‌ای معاصر از طلا و جواهر.",
      image: "/collections/collection-01.jpg",
    },
    {
      id: "heritage",
      name: "میراث",
      description:
        "کالکشن میراث دیدار؛ بازخوانی نقش‌ها و حافظه ایرانی در زبان طراحی معاصر طلا و جواهر.",
      image: "/collections/collection-02.jpg",
    },
    {
      id: "ceremony",
      name: "مراسم",
      description:
        "کالکشن مراسم دیدار؛ قطعاتی برای لحظه‌های خاص، هدیه‌های ماندگار و حضور رسمی.",
      image: "/collections/collection-03.jpg",
    },
  ],
  services: [
    "شناسنامه دیجیتال محصول",
    "اصالت دائمی",
    "گارانتی ساخت ۲ ساله",
    "بازخرید",
    "مشاوره خصوصی انتخاب جواهر",
  ],
} as const;
