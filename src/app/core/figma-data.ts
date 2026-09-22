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
  },
  {
    id: 7,
    name: 'Vestido Midi Rojo',
    brand: 'Zara Studio',
    category: 'Mujer',
    price: 74.99,
    oldPrice: 99.99,
    discount: 25,
    image: `${U}1662532577856-e8ee8b138a8b${CARD}`,
    images: [`${U}1662532577856-e8ee8b138a8b${CARD}`],
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
const FALLBACK_IMAGE = `${U}1558618666-fcd25c85cd64?w=120&h=150&fit=crop&auto=format`;

/**
 * Imagen demo para las tablas del panel: busca la prenda del catálogo demo por
 * nombre (el backend no expone imágenes). Devuelve un placeholder si no hay coincidencia.
 */
export function demoImageFor(name: string, fallback = FALLBACK_IMAGE): string {
  const words = name
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);

  let bestScore = 0;
  let bestImage = fallback;

  for (const product of PRODUCTS) {
    const target = product.name.toLowerCase();
    const score = words.filter((word) => target.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestImage = product.image;
    }
  }

  return bestImage;
}

/* --------------------------------------------------------------- CU17 ----- */

/**
 * Modelo 3D de respaldo del Vestidor Virtual (Khronos glTF Sample Models):
 * una zapatilla con variantes de materiales en `.glb`. Se usa cuando el producto
 * no trae `model_3d_url`, para que la sesión AR siempre tenga algo real que proyectar.
 */
export const AR_FALLBACK_MODEL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb';

/** Componente estándar que renderiza el 3D/AR (`index.html` lo carga del CDN de Google). */
export const AR_VIEWER_TAG = 'model-viewer';

/** Modos de AR del componente: Scene Viewer (Android), WebXR y Quick Look (iOS). */
export const AR_MODES = 'scene-viewer webxr quick-look';

/** CU17: modelo 3D del producto — `model_3d_url` real o el de respaldo. */
export function arModelFor(product?: { model3dUrl?: string | null } | null): string {
  const url = product?.model3dUrl?.trim();
  return url ? url : AR_FALLBACK_MODEL;
}

/** CU17: origen del modelo que muestra el vestidor (trazabilidad del CU). */
export function arModelSourceFor(product?: { model3dUrl?: string | null } | null): string {
  return product?.model3dUrl?.trim()
    ? 'model_3d_url del producto'
    : 'modelo de respaldo del prototipo';
}
