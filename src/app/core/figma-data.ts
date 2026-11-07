/**
 * Datos demo del prototipo Figma Make (`design/figma-make/src/data.ts`).
 * Se usan en la web para el catálogo público, detalle, carrito y checkout,
 * porque `ProductResponse` del backend no expone imagen, marca, colores ni tallas.
 */

export interface FigmaColor {
  name: string;
  hex: string;
}

export interface FigmaProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  images: string[];
  colors: FigmaColor[];
  sizes: string[];
  description: string;
  stock: Record<string, number>;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isFeatured?: boolean;
  /** CU17: `model_3d_url` del producto cuando el panel lo carga (glb/gltf). */
  model3dUrl?: string | null;
  /** Audio requirements: precio mayorista, cantidad mínima, tela/material y liquidación */
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  material?: string | null;
  secondaryColor?: string | null;
  isClearance?: boolean;
}

export interface FigmaBanner {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  bg: string;
}

export interface FigmaStore {
  id: string;
  name: string;
  address: string;
  hours: string;
}

export interface FigmaCartItem {
  productId: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  isWholesaleApplied?: boolean;
}

export interface FigmaPurchase {
  id: string;
  date: string;
  status: 'entregado' | 'en_camino' | 'procesando' | 'cancelado';
  total: number;
  subtotal: number;
  shipping: number;
  paymentMethod: string;
  deliveryMethod: 'home' | 'pickup';
  store?: string;
  items: FigmaCartItem[];
}

const U = 'https://images.unsplash.com/photo-';
const CARD = '?w=400&h=520&fit=crop&auto=format';

/* ------------------------------------------------------------ CU17 ------ */

const AR_ASSETS =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

/** Calzado — `MaterialsVariantsShoe` (`.glb` autocontenido con variantes de material). */
export const AR_SHOE_MODEL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb';

/** Accesorios — `SunglassesKhronos` (`.glb` autocontenido de 371 KB). */
export const AR_SUNGLASSES_MODEL = `${AR_ASSETS}/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb`;

/** Accesorios / Smartwatch — `apple_watch.glb` (Modelo 3D de alta definición). */
export const AR_WATCH_MODEL = '/models/apple_watch.glb';

/** Accesorios / Gorras — `baseball_cap.glb` (Gorra urbana deportiva realista). */
export const AR_CAP_MODEL = '/models/baseball_cap.glb';

/** Accesorios / Sombreros — `hat.glb` (Sombrero elegante clásico). */
export const AR_HAT_MODEL = '/models/hat.glb';

/** Moda / Chaqueta — `denim_jacket.glb` (Chaqueta denim vaquera de alta fidelidad). */
export const AR_JACKET_MODEL = '/models/denim_jacket.glb';

/** Moda / Blazer — `blazer.glb` (Blazer estructurado clásico). */
export const AR_BLAZER_MODEL = '/models/blazer.glb';

/** Vistas oficiales de cada modelo (póster mientras carga el 3D). */
export const AR_PREVIEWS = {
  shoe: `${AR_ASSETS}/MaterialsVariantsShoe/screenshot/screenshot.jpg`,
  sunglasses: `${AR_ASSETS}/SunglassesKhronos/screenshot/SunglassesKhronos.png`,
  watch: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=520&fit=crop&auto=format',
  cap: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=520&fit=crop&auto=format',
  hat: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&h=520&fit=crop&auto=format',
  jacket: 'https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=400&h=520&fit=crop&auto=format',
  blazer: `${U}1613915617430-8ab0fd7c6baf${CARD}`,
} as const;

export const PRODUCTS: FigmaProduct[] = [
  {
    id: 1,
    name: 'Blazer Oversize Lana',
    brand: 'Massimo',
    category: 'Mujer',
    price: 89.99,
    oldPrice: 129.99,
    discount: 31,
    image: `${U}1613915617430-8ab0fd7c6baf${CARD}`,
    images: [
      `${U}1613915617430-8ab0fd7c6baf${CARD}`,
      `${U}1629511565591-a1d494ad6c58${CARD}`,
    ],
    colors: [
      { name: 'Negro', hex: '#111827' },
      { name: 'Beige', hex: '#D4C5A9' },
      { name: 'Terracota', hex: '#E05A47' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Blazer de corte relajado con hombros estructurados en mezcla de lana y poliéster. Cierre con botones de nácar y bolsillos con solapa.',
    stock: { Centro: 3, Norte: 1, Sur: 5 },
    rating: 4.7,
    reviews: 128,
    isFeatured: true,
    model3dUrl: AR_BLAZER_MODEL,
  },
  {
    id: 2,
    name: 'Vestido Midi Fluido',
    brand: 'Zara Studio',
    category: 'Mujer',
    price: 67.5,
    oldPrice: 95,
    discount: 29,
    image: `${U}1664076458686-3449062080ac${CARD}`,
    images: [
      `${U}1664076458686-3449062080ac${CARD}`,
      `${U}1616639943825-e0fbad20a3d3${CARD}`,
    ],
    colors: [
      { name: 'Terracota', hex: '#E05A47' },
      { name: 'Negro', hex: '#111827' },
      { name: 'Crudo', hex: '#F5F0E8' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    description:
      'Vestido de largo midi con escote en V y corte evasé en viscosa fluida. Ideal para ocasiones especiales o el día a día.',
    stock: { Centro: 0, Norte: 4, Sur: 2 },
    rating: 4.5,
    reviews: 87,
    isNew: true,
  },
  {
    id: 3,
    name: 'Conjunto Punto Acanalado',
    brand: 'COS',
    category: 'Mujer',
    price: 54,
    oldPrice: 72,
    discount: 25,
    image: `${U}1645996830718-127f7e4f74fc${CARD}`,
    images: [`${U}1645996830718-127f7e4f74fc${CARD}`],
    colors: [
      { name: 'Gris', hex: '#6B7280' },
      { name: 'Negro', hex: '#111827' },
      { name: 'Camel', hex: '#C4A882' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Conjunto de top y pantalón de tiro alto en tejido punto acanalado de alta densidad.',
    stock: { Centro: 7, Norte: 2, Sur: 0 },
    rating: 4.3,
    reviews: 64,
  },
  {
    id: 4,
    name: 'Blazer Estructurado',
    brand: 'Massimo',
    category: 'Mujer',
    price: 112,
    oldPrice: 148,
    discount: 24,
    image: `${U}1629511565591-a1d494ad6c58${CARD}`,
    images: [`${U}1629511565591-a1d494ad6c58${CARD}`],
    colors: [
      { name: 'Negro', hex: '#111827' },
      { name: 'Carbón', hex: '#374151' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Blazer con estructura marcada y solapas amplias en tejido técnico. Perfecto para looks de oficina modernos.',
    stock: { Centro: 2, Norte: 6, Sur: 1 },
    rating: 4.8,
    reviews: 211,
    isFeatured: true,
    model3dUrl: AR_BLAZER_MODEL,
  },
  {
    id: 5,
    name: 'Sneakers Clásicas',
    brand: 'Nike',
    category: 'Calzado',
    price: 79.99,
    oldPrice: 110,
    discount: 27,
    image: `${U}1605523741177-cd660595c2cf${CARD}`,
    images: [
      `${U}1605523741177-cd660595c2cf${CARD}`,
      `${U}1656164753657-8ff832063a71${CARD}`,
    ],
    colors: [
      { name: 'Blanco', hex: '#F8F9FA' },
      { name: 'Negro', hex: '#111827' },
      { name: 'Terracota', hex: '#E05A47' },
    ],
    sizes: ['36', '37', '38', '39', '40', '41', '42'],
    description:
      'Zapatillas de caña alta con upper en canvas y suela de goma vulcanizada con grip antideslizante.',
    stock: { Centro: 5, Norte: 3, Sur: 8 },
    rating: 4.6,
    reviews: 349,
    isFeatured: true,
    // CU17: `model_3d_url` explícito del producto (así lo cargaría el panel).
    model3dUrl: AR_SHOE_MODEL,
  },
  {
    id: 6,
    name: 'Chaqueta Denim',
    brand: 'Levis',
    category: 'Hombre',
    price: 95,
    oldPrice: 130,
    discount: 27,
    image: `${U}1603189343302-e603f7add05a${CARD}`,
    images: [`${U}1603189343302-e603f7add05a${CARD}`],
    colors: [
      { name: 'Índigo', hex: '#374151' },
      { name: 'Negro', hex: '#111827' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Chaqueta vaquera de corte recto con acabado desgastado. Dos bolsillos delanteros y traseros con botones metálicos.',
    stock: { Centro: 4, Norte: 0, Sur: 6 },
    rating: 4.4,
    reviews: 156,
    isNew: true,
    model3dUrl: AR_JACKET_MODEL,
  },
  {
    id: 7,
    name: 'Vestido Midi Rojo',
    brand: 'Zara Studio',
    category: 'Mujer',
    price: 74.99,
    oldPrice: 99.99,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'],
    colors: [
      { name: 'Rojo', hex: '#DC2626' },
      { name: 'Terracota', hex: '#E05A47' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    description:
      'Vestido fluido con cintura definida y escote cuadrado. Corte midi ideal para ocasiones.',
    stock: { Centro: 2, Norte: 5, Sur: 1 },
    rating: 4.9,
    reviews: 93,
    isNew: true,
  },
  {
    id: 8,
    name: 'Sneakers Blancas',
    brand: 'Adidas',
    category: 'Calzado',
    price: 59.99,
    oldPrice: 85,
    discount: 29,
    image: `${U}1656164753657-8ff832063a71${CARD}`,
    images: [`${U}1656164753657-8ff832063a71${CARD}`],
    colors: [
      { name: 'Blanco', hex: '#F8F9FA' },
      { name: 'Gris', hex: '#9CA3AF' },
    ],
    sizes: ['36', '37', '38', '39', '40', '41'],
    description:
      'Zapatillas minimalistas con upper de cuero sintético y suela de EVA ultraligera. El básico imprescindible.',
    stock: { Centro: 9, Norte: 4, Sur: 3 },
    rating: 4.5,
    reviews: 278,
    model3dUrl: AR_SHOE_MODEL,
  },
  {
    id: 9,
    name: 'Gafas Aviator Black Edition',
    brand: 'Ray-Studio',
    category: 'Accesorios',
    price: 49.99,
    oldPrice: 75.0,
    discount: 33,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=520&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=520&fit=crop&auto=format',
    ],
    colors: [
      { name: 'Negro', hex: '#111827' },
      { name: 'Dorado', hex: '#D4AF37' },
    ],
    sizes: ['Única'],
    description:
      'Gafas de sol polarizadas estilo aviador con montura metálica ultraligera y protección UV400. Pruébatelas en vivo en el espejo frontal o inspecciónalas en tu espacio.',
    stock: { Centro: 8, Norte: 6, Sur: 12 },
    rating: 4.9,
    reviews: 142,
    isFeatured: true,
    model3dUrl: AR_SUNGLASSES_MODEL,
  },
  {
    id: 10,
    name: 'Apple Watch Sport 44mm',
    brand: 'Apple',
    category: 'Accesorios',
    price: 139.99,
    oldPrice: 199.99,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=520&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=520&fit=crop&auto=format',
    ],
    colors: [
      { name: 'Space Grey', hex: '#374151' },
      { name: 'Negro', hex: '#111827' },
    ],
    sizes: ['44mm'],
    description:
      'Smartwatch deportivo con caja de aluminio Space Grey y correa deportiva negra. Inspección 3D en 360° y escala 1:1 en AR.',
    stock: { Centro: 4, Norte: 3, Sur: 7 },
    rating: 4.8,
    reviews: 89,
    isNew: true,
    model3dUrl: AR_WATCH_MODEL,
  },
  {
    id: 11,
    name: 'Gorra Urbana Baseball',
    brand: 'Nike',
    category: 'Accesorios',
    price: 34.99,
    oldPrice: 45.0,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=520&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=520&fit=crop&auto=format',
    ],
    colors: [
      { name: 'Negro', hex: '#111827' },
      { name: 'Azul', hex: '#1E3A5F' },
    ],
    sizes: ['Ajustable'],
    description:
      'Gorra de béisbol con visera curvada y diseño streetwear confeccionada en algodón premium. Modelo 3D disponible para probar en tu espacio.',
    stock: { Centro: 10, Norte: 8, Sur: 15 },
    rating: 4.8,
    reviews: 112,
    isNew: true,
    model3dUrl: AR_CAP_MODEL,
  },
  {
    id: 12,
    name: 'Collar Minimalista Eslabones',
    brand: 'Atelier Privé',
    category: 'Accesorios',
    price: 59.99,
    oldPrice: 85.0,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=520&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=520&fit=crop&auto=format',
    ],
    colors: [
      { name: 'Plata', hex: '#E5E7EB' },
      { name: 'Negro', hex: '#111827' },
    ],
    sizes: ['50cm'],
    description:
      'Collar con cadena de eslabones pulidos y acabado brillante en acero inoxidable de grado quirúrgico.',
    stock: { Centro: 6, Norte: 4, Sur: 9 },
    rating: 4.9,
    reviews: 88,
    isFeatured: true,
  },
  {
    id: 13,
    name: 'Sombrero Elegante Fedora',
    brand: 'Massimo',
    category: 'Accesorios',
    price: 49.99,
    oldPrice: 69.99,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&h=520&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&h=520&fit=crop&auto=format',
    ],
    colors: [
      { name: 'Negro', hex: '#111827' },
      { name: 'Camel', hex: '#C4A882' },
    ],
    sizes: ['M', 'L'],
    description:
      'Sombrero clásico estilo fedora en fieltro fino con cinta de contraste. Modelo 3D disponible para probar en tiempo real.',
    stock: { Centro: 5, Norte: 3, Sur: 4 },
    rating: 4.7,
    reviews: 54,
    isNew: true,
    model3dUrl: AR_HAT_MODEL,
  },
];

export const CATEGORIES = ['Todas', 'Mujer', 'Hombre', 'Calzado', 'Accesorios', 'Ofertas'];
export const BRANDS_LIST = ['Massimo', 'Zara Studio', 'COS', 'Nike', 'Adidas', 'Levis'];
export const COLORS_LIST = [
  'Negro', 'Blanco', 'Gris', 'Beige', 'Terracota', 'Azul', 'Rojo', 'Verde', 'Camel'
];
export const SIZES_LIST = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42'];

export const COLORS_HEX: Record<string, string> = {
  Negro: '#111827',
  Blanco: '#F8F9FA',
  Gris: '#9CA3AF',
  Beige: '#D4C5A9',
  Terracota: '#E05A47',
  Azul: '#1E3A5F',
  Rojo: '#DC2626',
  Verde: '#6B7C5C',
  Camel: '#C4A882',
};

export const STORES: FigmaStore[] = [
  { id: 'centro', name: 'Sucursal Centro', address: 'Av. Corrientes 1450, CABA', hours: '10:00 – 21:00' },
  { id: 'norte', name: 'Sucursal Norte', address: 'Av. del Libertador 3200, Buenos Aires', hours: '10:00 – 21:00' },
  { id: 'sur', name: 'Sucursal Sur', address: 'Av. Rivadavia 8900, Buenos Aires', hours: '10:00 – 20:00' },
];

export const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '17:00', '17:30', '18:00'
];

export const BANNERS: FigmaBanner[] = [
  {
    id: 1,
    tag: 'NUEVA TEMPORADA',
    title: 'Otoño · Invierno 2026',
    subtitle: 'Hasta 40% de descuento',
    image: `${U}1603189343302-e603f7add05a?w=900&h=420&fit=crop&auto=format`,
    bg: '#111827',
  },
  {
    id: 2,
    tag: 'COLECCIÓN EXCLUSIVA',
    title: 'Blazers Estructurados',
    subtitle: 'Estilo editorial, todo el año',
    image: `${U}1629511565591-a1d494ad6c58?w=900&h=420&fit=crop&auto=format`,
    bg: '#374151',
  },
  {
    id: 3,
    tag: 'ÚLTIMAS UNIDADES',
    title: 'Calzado Premium',
    subtitle: 'Nike, Adidas y más',
    image: `${U}1605523741177-cd660595c2cf?w=900&h=420&fit=crop&auto=format`,
    bg: '#1E293B',
  },
];

/** Cupón vigente del prototipo (10% de descuento). */
export const COUPON_CODE = 'FASHION10';
export const COUPON_RATE = 0.1;
export const SHIPPING_HOME = 4.99;

export const FAQ: { q: string; a: string }[] = [
  {
    q: '¿Cuánto tarda el envío?',
    a: 'El envío a domicilio tarda entre 3 y 5 días hábiles. El retiro en tienda está disponible en 24 horas.'
  },
  {
    q: '¿Puedo cambiar o devolver un producto?',
    a: 'Sí, aceptamos cambios y devoluciones dentro de los 30 días desde la compra, siempre que el producto esté sin uso y con sus etiquetas.'
  },
  {
    q: '¿Cómo funciona el Probador Virtual?',
    a: 'El Probador Virtual usa la cámara de tu dispositivo para superponer modelos 3D (.glb/.gltf) de nuestras prendas sobre tu imagen en tiempo real.'
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos tarjetas Visa, Mastercard y American Express, además de pagos seguros a través de Stripe.'
  },
  {
    q: '¿Cómo hago una reserva de probador?',
    a: 'Desde "Reservas" puedes elegir el producto, la sucursal y el horario disponible. Recibirás un código de confirmación.'
  },
  {
    q: '¿Las recomendaciones de IA son precisas?',
    a: 'Nuestro motor analiza tus preferencias de talla, marca, colores y rango de precio para sugerirte productos a tu medida.'
  },
];

export const INITIAL_PURCHASES: FigmaPurchase[] = [
  {
    id: 'ORD-4821',
    date: '15 sep 2026',
    status: 'entregado',
    total: 157.49,
    subtotal: 152.5,
    shipping: 4.99,
    paymentMethod: 'Visa •••• 4242',
    deliveryMethod: 'home',
    items: [
      {
        productId: 1,
        name: 'Blazer Oversize Lana',
        brand: 'Massimo',
        price: 89.99,
        image: `${U}1613915617430-8ab0fd7c6baf?w=120&h=150&fit=crop&auto=format`,
        size: 'M',
        color: 'Negro',
        qty: 1
      },
      {
        productId: 4,
        name: 'Blazer Estructurado',
        brand: 'Massimo',
        price: 62.51,
        image: `${U}1629511565591-a1d494ad6c58?w=120&h=150&fit=crop&auto=format`,
        size: 'M',
        color: 'Carbón',
        qty: 1
      }
    ]
  },
  {
    id: 'ORD-4765',
    date: '2 sep 2026',
    status: 'en_camino',
    total: 79.99,
    subtotal: 79.99,
    shipping: 0,
    paymentMethod: 'Mastercard •••• 8821',
    deliveryMethod: 'pickup',
    store: 'Sucursal Norte',
    items: [
      {
        productId: 5,
        name: 'Sneakers Clásicas',
        brand: 'Nike',
        price: 79.99,
        image: `${U}1605523741177-cd660595c2cf?w=120&h=150&fit=crop&auto=format`,
        size: '40',
        color: 'Blanco',
        qty: 1
      }
    ]
  },
  {
    id: 'ORD-4690',
    date: '18 ago 2026',
    status: 'cancelado',
    total: 54,
    subtotal: 54,
    shipping: 0,
    paymentMethod: 'Visa •••• 4242',
    deliveryMethod: 'home',
    items: [
      {
        productId: 3,
        name: 'Conjunto Punto Acanalado',
        brand: 'COS',
        price: 54,
        image: `${U}1645996830718-127f7e4f74fc?w=120&h=150&fit=crop&auto=format`,
        size: 'M',
        color: 'Gris',
        qty: 1
      }
    ]
  }
];

export const DEMO_DATES: { short: string; day: string; full: string }[] = [
  { short: 'Lun', day: '22', full: '22 sep 2026' },
  { short: 'Mar', day: '23', full: '23 sep 2026' },
  { short: 'Mié', day: '24', full: '24 sep 2026' },
  { short: 'Jue', day: '25', full: '25 sep 2026' },
  { short: 'Vie', day: '26', full: '26 sep 2026' },
  { short: 'Sáb', day: '27', full: '27 sep 2026' },
  { short: 'Dom', day: '28', full: '28 sep 2026' },
];

/** Imagen de reserva para prendas que no están en el catálogo demo. */
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80';

/**
 * Resuelve de forma inteligente y contextual la imagen de cualquier prenda según sus palabras clave.
 * Si se pasa una URL personalizada (ej. subida por el usuario o de base de datos), la respeta inmediatamente.
 */
export function resolveProductImage(name: string, customUrl?: string | null): string {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }

  const n = (name || '').toLowerCase();

  // ── 1. CALCETERÍA Y MEDIAS (Mundo Medias) ──────────────────────────
  if (n.includes('invisible') || n.includes('antideslizante')) {
    return 'https://images.unsplash.com/photo-1585499583264-491df5142e83?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('tobillera') || (n.includes('medias') && n.includes('deportiv'))) {
    return 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('térmica') || n.includes('termica') || n.includes('polar')) {
    return 'https://images.unsplash.com/photo-1646725582781-c09e1bcd431d?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('compresión') || n.includes('compresion')) {
    return 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('panti') || n.includes('pantis')) {
    return 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('ejecutiva') || n.includes('escocia')) {
    return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('merino') || n.includes('senderismo') || n.includes('calcetin') || n.includes('calcetín')) {
    return 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('bucanera') || n.includes('canalé') || n.includes('canale')) {
    return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('media') || n.includes('medias') || n.includes('sock')) {
    return 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&auto=format&fit=crop&q=80';
  }

  // ── 2. ALTA COSTURA & SASTRERÍA (Elegance Boutique) ────────────────
  if (n.includes('smoking') || n.includes('esmoquin') || n.includes('black tie')) {
    return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('traje') || n.includes('sartorial') || n.includes('sastreria') || n.includes('sastrería')) {
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('seda royale') || n.includes('gala') || n.includes('noche')) {
    return 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('sirena') || n.includes('corset')) {
    return 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('cachemira') || n.includes('abrigo') || n.includes('tapado')) {
    return 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('plisado') || n.includes('champagne')) {
    return 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('blusa') || n.includes('organza') || n.includes('crepe')) {
    return 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('doble botonadura')) {
    return 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80';
  }

  // ── 3. STREETWEAR & MODA URBANA (Moda Urbana) ─────────────────────
  if (n.includes('hoodie') || n.includes('sudadera')) {
    return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('cargo') || n.includes('pantalon') || n.includes('pantalón')) {
    return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('oxford') || n.includes('camisa')) {
    return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('remera') || n.includes('camiseta') || n.includes('t-shirt')) {
    return 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('chunky') || n.includes('sneakers blancas')) {
    return 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('sneaker') || n.includes('zapatilla') || n.includes('calzado')) {
    return 'https://images.unsplash.com/photo-1605523741177-cd660595c2cf?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('denim') || n.includes('vaquera') || n.includes('chaqueta')) {
    return 'https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('windbreaker') || n.includes('rompevientos') || n.includes('bomber')) {
    return 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('jogger') || n.includes('baggy')) {
    return 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('gorra') || n.includes('cap') || n.includes('trucker')) {
    return 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&auto=format&fit=crop&q=80';
  }

  // ── 4. VESTIDOS Y PRENDAS GENERALES ────────────────────────────────
  if (n.includes('rojo') && n.includes('vestido')) {
    return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('fluido') || (n.includes('vestido') && n.includes('midi'))) {
    return 'https://images.unsplash.com/photo-1664076458686-3449062080ac?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('vestido')) {
    return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('blazer oversize') || n.includes('blazer lana')) {
    return 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('blazer')) {
    return 'https://images.unsplash.com/photo-1629511565591-a1d494ad6c58?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('acanalado') || n.includes('punto')) {
    return 'https://images.unsplash.com/photo-1645996830718-127f7e4f74fc?w=800&auto=format&fit=crop&q=80';
  }

  // ── 5. ACCESORIOS EXPLÍCITOS ───────────────────────────────────────
  if (n.includes('gafas') || n.includes('lentes')) {
    return 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('collar') || n.includes('gargantilla')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('reloj') || n.includes('watch')) {
    return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('sombrero') || n.includes('fedora')) {
    return 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&auto=format&fit=crop&q=80';
  }

  return FALLBACK_IMAGE;
}

/**
 * Imagen demo para tablas y listas: prioriza el resolver contextual para que
 * cada categoría (medias, vestidos, trajes, etc.) reciba una imagen coherente.
 */
export function demoImageFor(name: string, fallback = FALLBACK_IMAGE): string {
  const resolved = resolveProductImage(name);
  if (resolved !== FALLBACK_IMAGE) {
    return resolved;
  }
  return fallback;
}

/* --------------------------------------------------------------- CU17 ----- */

// Los modelos 3D (`AR_SHOE_MODEL`, `AR_SUNGLASSES_MODEL`, `AR_WATCH_MODEL`)
// se declaran arriba junto a `PRODUCTS`.

/** Componente estándar que renderiza el 3D/AR (`index.html` lo carga del CDN de Google). */
export const AR_VIEWER_TAG = 'model-viewer';

/** Modos de AR del componente: Scene Viewer (Android), WebXR y Quick Look (iOS). */
export const AR_MODES = 'scene-viewer webxr quick-look';

/** Indica si un producto cuenta con un modelo 3D real disponible. */
export function hasAr(product?: { model3dUrl?: string | null } | null): boolean {
  return !!product?.model3dUrl?.trim();
}

/** Devuelve la URL del modelo 3D del producto o null si no tiene modelo propio. */
export function arModelFor(
  product?: { model3dUrl?: string | null } | null,
): string | null {
  const url = product?.model3dUrl?.trim();
  return url || null;
}

/** Clasificación del objeto 3D para el probador interactivo. */
export type ArModelKind = 'garment' | 'shoe' | 'sunglasses' | 'watch' | 'headwear' | 'necklace';

/** Clasifica el modelo del producto para cargarlo con el anclaje y escala correspondientes. */
export function arKindFor(modelUrl?: string | null): ArModelKind {
  if (!modelUrl) return 'garment';
  const value = modelUrl.toLowerCase();
  if (value.includes('sunglass')) return 'sunglasses';
  if (value.includes('shoe')) return 'shoe';
  if (value.includes('watch')) return 'watch';
  if (value.includes('cap') || value.includes('hat') || value.includes('baseball')) return 'headwear';
  if (value.includes('necklace')) return 'necklace';
  if (value.includes('jacket') || value.includes('denim') || value.includes('blazer')) return 'garment';
  return 'garment';
}

/** Póster oficial que corresponde al modelo mostrado mientras descarga el binario GLB. */
export function arPreviewFor(modelUrl?: string | null): string {
  if (!modelUrl) return '';
  const value = modelUrl.toLowerCase();
  if (value.includes('blazer')) return AR_PREVIEWS.blazer;
  if (value.includes('sunglass')) return AR_PREVIEWS.sunglasses;
  if (value.includes('watch')) return AR_PREVIEWS.watch;
  if (value.includes('cap') || value.includes('baseball')) return AR_PREVIEWS.cap;
  if (value.includes('hat')) return AR_PREVIEWS.hat;
  if (value.includes('jacket') || value.includes('denim')) return AR_PREVIEWS.jacket;
  if (value.includes('shoe')) return AR_PREVIEWS.shoe;
  return '';
}
