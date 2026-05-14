"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, setDoc, serverTimestamp 
} from "firebase/firestore";

const CONFIG = {
  brandName: "028", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png",
};

// Íconos para las Secciones de la Vidriera
const AVAILABLE_ICONS = [
  { id: 'fa-star', prefix: 'fas', color: 'text-[#fcdb00]' },     
  { id: 'fa-fire', prefix: 'fas', color: 'text-red-500' },       
  { id: 'fa-bolt', prefix: 'fas', color: 'text-yellow-400' },    
  { id: 'fa-crown', prefix: 'fas', color: 'text-amber-500' },    
  { id: 'fa-gem', prefix: 'fas', color: 'text-purple-500' },     
  { id: 'fa-heart', prefix: 'fas', color: 'text-pink-500' },     
  { id: 'fa-tag', prefix: 'fas', color: 'text-green-500' },      
  { id: 'fa-gift', prefix: 'fas', color: 'text-blue-500' },      
  { id: 'fa-rocket', prefix: 'fas', color: 'text-orange-500' },  
  { id: 'fa-award', prefix: 'fas', color: 'text-indigo-500' },
  { id: 'fa-apple', prefix: 'fab', color: 'text-gray-800' }
];

// Íconos EXCLUSIVOS para los Departamentos
const DEPT_ICONS = [
  { id: 'fa-box', prefix: 'fas' },
  { id: 'fa-wind', prefix: 'fas' },
  { id: 'fa-leaf', prefix: 'fas' },
  { id: 'fa-microchip', prefix: 'fas' },
  { id: 'fa-star', prefix: 'fas' },
  { id: 'fa-fire', prefix: 'fas' },
  { id: 'fa-apple', prefix: 'fab' }, 
  { id: 'fa-mobile-alt', prefix: 'fas' },
  { id: 'fa-laptop', prefix: 'fas' },
  { id: 'fa-gamepad', prefix: 'fas' },
  { id: 'fa-headphones', prefix: 'fas' },
  { id: 'fa-gem', prefix: 'fas' },
  { id: 'fa-tag', prefix: 'fas' },
  { id: 'fa-cannabis', prefix: 'fas' },
  { id: 'fa-smoking', prefix: 'fas' },
];

const initialProducts = [
  { id: 1, name: "BAJA SPLASH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/76QxH9kQ/BAJA-SPLASH.png", description: "Vapeador desechable premium con una mezcla tropical y refrescante.", cardSize: "normal" },
  { id: 2, name: "BLUE RAZZ ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/s2Tmw67w/BLUE-RAZZ-ICE.webp", description: "El clásico e intenso sabor a frambuesa azul combinado con un golpe helado perfecto.", cardSize: "normal" },
  { id: 3, name: "CHERRY FUSE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/yd5PzDfx/CHERRY-FUSE.png", description: "Fusión explosiva de cerezas dulces y jugosas.", cardSize: "normal" },
  { id: 4, name: "CHERRY STRAZZ", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Destacado", image: "https://i.postimg.cc/7PFVsTG2/CHERRY-STRAZZ.jpg", description: "Una deliciosa combinación de cereza y fresa con sutiles notas cítricas.", cardSize: "medium" },
  { id: 5, name: "DOUBLE APPLE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QN9mJqtk/DOUBLE-APPLE-ICE.webp", description: "Intenso sabor a doble manzana, dulce y ácida.", cardSize: "normal" },
  { id: 6, name: "DRAGON STRAWNANA", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/9X6p8qRB/DRAGON-STRAWNANA.png", description: "Exótico mix de pitahaya, fresa y plátano.", cardSize: "normal" },
  { id: 7, name: "GRAPE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/hPV0HPTw/GRAPE-ICE.webp", description: "Auténtico sabor a uva dulce.", cardSize: "normal" },
  { id: 8, name: "MANGO MAGIC", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Best Seller", image: "https://i.postimg.cc/tCFzLCFC/MANGO-MAGIC.png", description: "La magia del mango maduro y jugoso.", cardSize: "normal" },
  { id: 9, name: "PEACH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/4xZ1Zk1f/PEACH.webp", description: "Puro sabor a durazno aterciopelado y dulce.", cardSize: "normal" },
  { id: 10, name: "SCARY BERRY", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/K8F5FS5D/SCARY-BERRY.png", description: "Misteriosa y atrapante mezcla de bayas silvestres oscuras.", cardSize: "normal" },
  { id: 11, name: "SOUR LUSH GUMMY", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/P54Q536R/SOUR-LUSH-GUMMY.png", description: "El divertido sabor de las gomitas dulces con un toque ácido.", cardSize: "normal" },
  { id: 12, name: "STRAWBERRY DRAGON FRUIT", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/QMdk9QwW/STRAWBERRY-DRAGON-FRUIT.png", description: "Combinación vibrante de fresas maduras y exótica fruta del dragón.", cardSize: "normal" },
  { id: 13, name: "STRAWBERRY ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/7Lt1gCrC/STRAWBERRY-ICE.png", description: "Fresas recién recolectadas bañadas en una brisa helada.", cardSize: "normal" },
  { id: 14, name: "STRAWBERRY WATERMELON", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/MG30ycJD/STRAWBERRY-WATERMELON.webp", description: "La clásica e infalible mezcla de fresa y sandía.", cardSize: "normal" },
  { id: 15, name: "SUMMER SPLASH", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/LXqtvHmV/SUMMER-SPLASH.png", description: "Un cóctel frutal que captura la esencia del verano en cada calada.", cardSize: "normal" },
  { id: 16, name: "TIGERS BLOOD", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/3RyX9K3P/TIGERS-BLOOD.jpg", description: "Famosa mezcla de sandía y fresa con un exótico y suave toque de coco.", cardSize: "normal" },
  { id: 17, name: "WATERMELON ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "Refrescante", image: "https://i.postimg.cc/63DdmD3s/WATERMELON-ICE.webp", description: "Todo el jugo y la dulzura de la sandía con un impacto extra helado.", cardSize: "normal" },
  { id: 25, name: "SOUR APPLE ICE", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/X7QqQDGS/SOUR-APPLE-ICE.jpg", description: "Manzana verde crujiente y ácida envuelta en una ráfaga de frío.", cardSize: "normal" },
  { id: 26, name: "MIAMI MINT", price: 26000, department: "VAPES", category: "Elfbar Ice King", tag: "", image: "https://i.postimg.cc/bJhqzQDS/MIAMI-MINT.jpg", description: "Menta sofisticada estilo Miami: fresca, dulce pero con presencia.", cardSize: "normal" },
  { id: 30, name: "BLUE RAZZ LEMON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Jh48hT4x/ignite-v400-BLUE-RAZZ-LEMON.jpg", description: "Dispositivo ultracompacto y premium de Ignite.", cardSize: "normal" },
  { id: 31, name: "CHERRY WATERMELON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/nLRJ9vCd/ignite-v400-cherry-watermelon.jpg", description: "Diseño elegante característico de Ignite.", cardSize: "normal" },
  { id: 32, name: "GRAPE", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/0QzqYbSv/ignite-v400-GRAPE.jpg", description: "Sabor a uva puro y directo.", cardSize: "normal" },
  { id: 33, name: "MIAMI MINT", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/gJ1bNmyJ/ignite-v400-miami-mint.jpg", description: "Menta premium y refrescante en el formato más cómodo.", cardSize: "normal" },
  { id: 34, name: "PASSION FRUIT", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/vT9FKkXt/Ignite-v400-PASSION-FRUIT.jpg", description: "El toque ácido y exótico del maracuyá en cada calada.", cardSize: "normal" },
  { id: 35, name: "STRAWBERRY WATERMELON", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/FFJ41kmG/Ignite-v400-STRAWBERR-WATERMELON.jpg", description: "Dulce, frutal y perfectamente balanceado.", cardSize: "normal" },
  { id: 36, name: "STRAWBERRY KIWI", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/Hsw19GrJ/ignite-v400-STRAWBERRY-KIWI.jpg", description: "Fresa dulce combinada con el toque tropical del kiwi.", cardSize: "normal" },
  { id: 37, name: "STRAWBERRY", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/cLdyDD35/ignite-v400-strawberry.jpg", description: "Auténtico sabor a fresa de principio a fin.", cardSize: "normal" },
  { id: 38, name: "TUTTI FRUTI", price: 28000, department: "VAPES", category: "Ignite v400", tag: "", image: "https://i.postimg.cc/mgVxKQ3v/ignite-v400-TUTI-FRUTI.jpg", description: "Explosión de golosinas frutales en un vaporizador compacto.", cardSize: "normal" },
  { id: 39, name: "BLUE RAZZ ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yYk7mpF9/Lost-mary-20000-BLUE-RAZZ-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 40, name: "GRAPE ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05VC/Lost-mary-20000-GRAPE-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 41, name: "ICE MINT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/wTZg05V5/lost-mary-20000-ICE-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 42, name: "LIME GRAPE FRUIT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/7LqcVbpW/Lost-mary-20000-LIME-GRAPE-FRUIT.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 43, name: "MANGO TWIST", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/8CwYnNGc/Lost-mary-20000-MANGO-TWIST.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 44, name: "MEXICAN MANGO", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/bvL5FpPx/Lost-mary-20000-MEXICAN-MANGO.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 45, name: "MIAMI MINT", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/yWqpSNmv/Lost-mary-20000-MIAMI-MINT.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 46, name: "STRAWBERRY ICE", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/zDLJWPw3/Lost-mary-20000-STRAWBERRY-ICE.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 47, name: "STRAWBERRY KIWI", price: 23000, department: "VAPES", category: "Lost Mary 20000", tag: "", image: "https://i.postimg.cc/59Hxvk5q/Lost-mary-20000-STRAWBERRY-KIWI.jpg", description: "El dispositivo Lost Mary con 20000 caladas.", cardSize: "normal" },
  { id: 18, name: "BLOW THC", price: 55000, department: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/x1WJwWsR/Blow-THC.webp", description: "Dispositivo de alta pureza con extracciones premium.", cardSize: "medium" },
  { id: 19, name: "TORCH 7.5G", price: 53000, department: "THC", category: "Vapes THC", tag: "", image: "https://i.postimg.cc/hvdP1jnd/TORCH-7-5G.png", description: "Capacidad extrema de 7.5G de extracto premium.", cardSize: "normal" },
  { id: 29, name: "TORCH 4.5G", price: 52500, department: "THC", category: "Vapes THC", tag: "Nuevo", image: "https://i.postimg.cc/vmFK42hC/TORCH-4-5G.jpg", description: "4.5G de puro rendimiento.", cardSize: "normal" },
  { id: 20, name: "PHENOM 6G", price: 56000, department: "THC", category: "Vapes THC", tag: "Destacado", image: "https://i.postimg.cc/QMGwnJ7B/PHENOM-6G.jpg", description: "Dispositivo de grado premium cargado con 6G.", cardSize: "large" },
  { id: 27, name: "PLAYSTATION 5", price: 550, department: "TECNOLOGÍA", category: "PlayStation", tag: "USD", image: "https://i.postimg.cc/RFGS0Wzt/PLAY-5.jpg", description: "PlayStation 5 original en caja sellada.", cardSize: "large" },
  { id: 28, name: "AIRPODS PRO", price: 35000, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Nuevo", image: "https://i.postimg.cc/X7gzDt0p/AIRPODS-PRO.jpg", description: "Auriculares inalámbricos originales con cancelación activa.", cardSize: "normal" },
  { id: 21, name: "CARGADOR 20W", price: 16500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/zvy6LthF/power-adapter-20w.jpg", description: "Adaptador de corriente USB-C de 20W original Apple.", cardSize: "normal" },
  { id: 22, name: "CARGADOR 35W", price: 20500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "Potente", image: "https://i.postimg.cc/NFKSyJXZ/power-adapter-35w.jpg", description: "Adaptador de corriente dual USB-C de 35W original Apple.", cardSize: "normal" },
  { id: 23, name: "CABLE USB-C A USB-C", price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/V6WZJy5B/usb-c-cable.jpg", description: "Cable original Apple de USB-C a USB-C.", cardSize: "normal" },
  { id: 24, name: "CABLE USB-C A LIGHTNING 2M", price: 13500, department: "TECNOLOGÍA", category: "PRODUCTOS APPLE", tag: "", image: "https://i.postimg.cc/QCvPcQkg/usb-c-to-lightning-cable.jpg", description: "Cable original Apple USB-C a Lightning de 2 metros.", cardSize: "normal" }
];

const initialHomeSections = [
  { id: 'sec_mas_buscados', title: "MÁS BUSCADOS", icon: 'fa-fire', iconColor: 'text-red-500', productIds: [4, 8, 20], order: 1, layout: 'horizontal' },
  { id: 'sec_nuevos_ingresos', title: "NUEVOS INGRESOS", icon: 'fa-bolt', iconColor: 'text-[#fcdb00]', productIds: [18, 28, 29], order: 2, layout: 'horizontal' }
];

const initialCommunityVideos = [
  {
    id: 'community_video_1',
    title: 'Review real 028',
    creator: '028 Community',
    type: 'Review',
    description: 'Contenido real de la comunidad 028 para generar confianza antes de comprar.',
    videoUrl: 'https://res.cloudinary.com/dcdwnayy2/video/upload/v1778708315/WhatsApp_Video_2026-05-13_at_17.48.35_fwssvz.mp4',
    productId: 17,
    productsShown: [17, 26, 33],
    ctaText: 'Ver productos del video',
    featured: true,
    order: 1,
    isHidden: false,
    views: 0,
    clicks: 0
  },
  {
    id: 'community_video_2',
    title: 'Martu Lali x 028',
    creator: '@martulali',
    type: 'Influencer',
    description: 'Contenido real de nuestra comunidad con productos destacados de la tienda.',
    videoUrl: 'https://res.cloudinary.com/dcdwnayy2/video/upload/v1778713679/Martulali_028_ldzttb.mp4',
    productId: 17,
    productsShown: [17, 25, 39],
    ctaText: 'Ver productos del video',
    featured: false,
    order: 2,
    isHidden: false,
    views: 0,
    clicks: 0
  },
  {
    id: 'community_video_3',
    title: 'Alelali x 028',
    creator: '@alelali',
    type: 'Referencia',
    description: 'Más referencias reales para mostrar productos vistos en el video y generar confianza.',
    videoUrl: 'https://res.cloudinary.com/dcdwnayy2/video/upload/v1778713678/alelali_028_ginzna.mp4',
    productId: 33,
    productsShown: [33, 31, 45],
    ctaText: 'Ver productos del video',
    featured: false,
    order: 3,
    isHidden: false,
    views: 0,
    clicks: 0
  }
];

const buildDefaultHomeLayout = (sections = []) => {
  const orderedSections = [...sections].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  if (!orderedSections.length) {
    return [{ id: 'community', label: '028 Community', order: 1, active: true, type: 'community' }];
  }
  const [firstSection, ...restSections] = orderedSections;
  return [
    { id: firstSection.id, label: firstSection.title || 'Vidriera', order: 1, active: true, type: 'section' },
    { id: 'community', label: '028 Community', order: 2, active: true, type: 'community' },
    ...restSections.map((section, index) => ({ id: section.id, label: section.title || 'Vidriera', order: index + 3, active: true, type: 'section' })),
  ];
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('historial'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [promos, setPromos] = useState([]);
  const [spins, setSpins] = useState([]); // --- NUEVO ESTADO PARA LA RULETA ---
  const [communityVideos, setCommunityVideos] = useState([]);
  const [newCommunityVideo, setNewCommunityVideo] = useState({
    title: '',
    creator: '',
    type: 'Review',
    description: '',
    videoUrl: '',
    productId: '',
    productsShownText: '',
    ctaText: 'Ver productos del video',
    featured: false,
    order: ''
  });
  
  // --- ESTADOS PARA CUPONES, USUARIOS Y OFERTAS (UPSELLS) ---
  const [coupons, setCoupons] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '' });
  
  const [upsellsList, setUpsellsList] = useState([]);
  const [newUpsell, setNewUpsell] = useState({ productId: '', price: '' });

  const [homeSections, setHomeSections] = useState([]);
  const [homeLayout, setHomeLayout] = useState([]);
  const [newPromo, setNewPromo] = useState({ category: '', minQty: 2, totalPrice: '' });
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState(AVAILABLE_ICONS[0]); 
  const [newSectionLayout, setNewSectionLayout] = useState('horizontal'); 
  
  const [deptIcons, setDeptIcons] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false); 
  const [newProduct, setNewProduct] = useState({ name: '', price: '', department: 'VAPES', category: '', image: '', tag: '', description: '', cardSize: 'normal' });
  const [isAdding, setIsAdding] = useState(false);

  const uniqueCategories = useMemo(() => [...new Set(products.filter(p => !p.isDeleted).map(p => p.category))], [products]);
  const PREDEFINED_DEPARTMENTS = ["VAPES", "THC", "TECNOLOGÍA", "APPLE"];
  const availableDepartments = useMemo(() => Array.from(new Set([...PREDEFINED_DEPARTMENTS, ...products.filter(p => !p.isDeleted).map(p => p.department).filter(Boolean)])), [products]);
  const availableCommunityProducts = useMemo(() => products.filter(p => !p.isDeleted && !p.isHidden).sort((a, b) => String(a.name).localeCompare(String(b.name))), [products]);
  const normalizedHomeLayout = useMemo(() => {
    const fallback = buildDefaultHomeLayout(homeSections);
    const incoming = Array.isArray(homeLayout) && homeLayout.length ? homeLayout : fallback;
    const mergedMap = new Map();
    fallback.forEach(item => mergedMap.set(item.id, { ...item }));
    incoming.forEach(item => {
      const base = mergedMap.get(item.id) || {
        id: item.id,
        label: item.label || homeSections.find(section => section.id === item.id)?.title || 'Bloque',
        type: item.id === 'community' ? 'community' : 'section',
      };
      mergedMap.set(item.id, { ...base, ...item, active: item.active !== false });
    });
    return Array.from(mergedMap.values()).sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  }, [homeLayout, homeSections]);

  const clientsList = useMemo(() => {
    const clientsMap = new Map();
    orders.forEach(o => {
      if (o.clientPhone && o.clientName) {
        if (!clientsMap.has(o.clientPhone)) { clientsMap.set(o.clientPhone, { name: o.clientName, phone: o.clientPhone, orderCount: 1, lastOrder: o.createdAt }); } 
        else { const ex = clientsMap.get(o.clientPhone); ex.orderCount += 1; if (o.createdAt > ex.lastOrder) ex.lastOrder = o.createdAt; }
      }
    });
    return Array.from(clientsMap.values()).sort((a, b) => b.lastOrder - a.lastOrder);
  }, [orders]);

  useEffect(() => {
    document.title = `${CONFIG.brandName} - Admin`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.getElementsByTagName('head')[0].appendChild(link); }
    link.href = CONFIG.logoImage;
  }, []);

  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };
    try {
      const config = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
      const app = !getApps().length ? initializeApp(config) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (err) { return { auth: null, db: null, err: err.message }; }
  }, []);

  useEffect(() => {
    if (!firebaseRefs.auth || !firebaseRefs.db) return;
    signInAnonymously(firebaseRefs.auth).catch(console.error);
    onAuthStateChanged(firebaseRefs.auth, (user) => {
      if (!user) return;
      onSnapshot(query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc')), (snap) => { setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
      
      onSnapshot(collection(firebaseRefs.db, 'products'), (snap) => {
        if (!snap.empty) {
          const dbProducts = snap.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          setProducts(prev => {
             const updatedInitial = initialProducts.map(p => { 
               const match = dbProducts.find(dbP => dbP.id === p.id); 
               if (match && match.isDeleted) return null; 
               return match ? { ...p, ...match } : { ...p, inStock: true, order: 99, isHidden: false, cardSize: 'normal', clicks: 0 }; 
             }).filter(Boolean); 
             const newFromDb = dbProducts.filter(dbP => !initialProducts.find(p => p.id === dbP.id) && !dbP.isDeleted).map(dbP => ({...dbP, isHidden: dbP.isHidden || false, cardSize: dbP.cardSize || 'normal', clicks: dbP.clicks || 0})); 
             return [...updatedInitial, ...newFromDb].sort((a, b) => (a.order || 99) - (b.order || 99));
          });
        }
      });
      
      onSnapshot(collection(firebaseRefs.db, 'promos'), (snap) => setPromos(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []));
      onSnapshot(collection(firebaseRefs.db, 'home_sections'), (snap) => setHomeSections(!snap.empty ? snap.docs.map(d => ({ dbId: d.id, ...d.data() })).sort((a, b) => a.order - b.order) : []));
      
      onSnapshot(collection(firebaseRefs.db, 'coupons'), (snap) => setCoupons(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []));
      onSnapshot(collection(firebaseRefs.db, 'users'), (snap) => setUsersList(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) : []));

      // LECTURA DE LISTA DE OFERTAS
      onSnapshot(collection(firebaseRefs.db, 'upsells'), (snap) => {
        setUpsellsList(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []);
      });

      // --- LECTURA DE TIROS DE LA RULETA ---
      onSnapshot(query(collection(firebaseRefs.db, 'spins'), orderBy('createdAt', 'desc')), (snap) => {
        setSpins(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []);
      });

      // --- LECTURA DE VIDEOS 028 COMMUNITY ---
      onSnapshot(query(collection(firebaseRefs.db, 'community_videos'), orderBy('order', 'asc')), (snap) => {
        setCommunityVideos(!snap.empty ? snap.docs.map(d => ({ dbId: d.id, ...d.data() })).sort((a, b) => (a.order || 99) - (b.order || 99)) : []);
      });

      onSnapshot(doc(firebaseRefs.db, 'settings', 'home_layout'), (snap) => {
        const sections = snap.exists() ? snap.data()?.sections : null;
        setHomeLayout(Array.isArray(sections) ? sections : []);
      });

      onSnapshot(doc(firebaseRefs.db, 'settings', 'departments'), (snap) => {
        if (snap.exists()) { setDeptIcons(snap.data().icons || {}); }
      });
    });
  }, [firebaseRefs]);
  
  const updatePrice = async (product, newPrice) => { const price = parseInt(newPrice); if(isNaN(price) || price < 0) return; try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, price: price }, { merge: true }); } catch(err) { alert("Error: " + err.message); } }
  const updateName = async (product, newName) => { const name = newName.trim().toUpperCase(); if(!name) return; try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, name: name }, { merge: true }); } catch(err) { alert("Error: " + err.message); } }
  const updateImage = async (product, newImageUrl) => { const url = newImageUrl.trim(); if(!url) return; try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, image: url }, { merge: true }); } catch(err) { alert("Error al actualizar la imagen: " + err.message); } }
  const updateOrder = async (product, newOrder) => { try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, order: parseInt(newOrder) }, { merge: true }); } catch(err) { alert("Error: " + err.message); } }
  const updateDescription = async (product, newDesc) => { try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, description: newDesc.trim() }, { merge: true }); } catch(err) { alert("Error: " + err.message); } }
  const updateCardSize = async (product, newSize) => { try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, cardSize: newSize }, { merge: true }); } catch (err) { alert("Error: " + err.message); } };
  const updateCategoryDepartment = async (categoryName, newDept) => { const dept = newDept.trim().toUpperCase(); if (!dept) return; try { const prods = products.filter(p => p.category === categoryName); await Promise.all(prods.map(p => setDoc(doc(firebaseRefs.db, 'products', `prod_${p.id}`), { id: p.id, department: dept }, { merge: true }))); } catch (err) { alert("Error: " + err.message); } }
  const updateProductDepartment = async (product, newDept) => { const dept = newDept.trim().toUpperCase(); if (!dept || dept === product.department) return; try { await setDoc(doc(firebaseRefs.db, 'products', product.dbId || `prod_${product.id}`), { id: product.id, department: dept }, { merge: true }); } catch(err) { alert("Error al actualizar departamento: " + err.message); } };
  const toggleStock = async (product) => { try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, inStock: product.inStock === false }, { merge: true }); } catch (err) { alert("Error: " + err.message); } };
  const toggleVisibility = async (product) => { try { await setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { id: product.id, isHidden: !product.isHidden }, { merge: true }); } catch (err) { alert("Error: " + err.message); } };
  const handleDeleteProduct = async (product) => { if(!confirm(`Eliminar "${product.name}"?`)) return; try { const isHardcoded = initialProducts.some(p => p.id === product.id); const docRef = doc(firebaseRefs.db, 'products', product.dbId || `prod_${product.id}`); if (isHardcoded) { await setDoc(docRef, { isDeleted: true }, { merge: true }); } else { await deleteDoc(docRef); } } catch (err) { alert("Error: " + err.message); } };

  // --- FUNCIONES PARA CREAR Y BORRAR CUPONES ---
  const handleAddCoupon = async (e) => { 
    e.preventDefault(); 
    const codeStr = newCoupon.code.trim().toUpperCase(); 
    if (!codeStr || !newCoupon.discount) return alert("Faltan datos para el cupón"); 
    try { 
      await setDoc(doc(firebaseRefs.db, 'coupons', codeStr), { id: codeStr, code: codeStr, discount: Number(newCoupon.discount), active: true, createdAt: serverTimestamp() }); 
      setNewCoupon({ code: '', discount: '' }); 
      alert("¡Cupón guardado con éxito!"); 
    } catch(err) { alert("Error al guardar cupón: " + err.message); } 
  };
  const handleDeleteCoupon = async (id) => { 
    if(confirm("¿Eliminar cupón definitivamente?")) { 
      try { await deleteDoc(doc(firebaseRefs.db, 'coupons', id)); } 
      catch(err) { alert("Error al borrar cupón: " + err.message); } 
    } 
  };

  // --- FUNCIONES PARA CREAR Y BORRAR OFERTAS (UPSELLS) MULTIPLES ---
  const handleAddUpsell = async (e) => {
    e.preventDefault();
    if (!newUpsell.productId || !newUpsell.price) return;
    try {
      await setDoc(doc(firebaseRefs.db, 'upsells', String(newUpsell.productId)), {
        id: String(newUpsell.productId),
        productId: Number(newUpsell.productId),
        price: Number(newUpsell.price),
        active: true,
        createdAt: serverTimestamp()
      });
      setNewUpsell({ productId: '', price: '' });
      alert("¡Oferta agregada a la lista!");
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDeleteUpsell = async (id) => {
    if(confirm("¿Eliminar esta oferta?")) {
      try { await deleteDoc(doc(firebaseRefs.db, 'upsells', id)); }
      catch (err) { alert(err.message); }
    }
  };

  // --- FUNCIONES PARA 028 COMMUNITY ---
  const resetCommunityForm = () => setNewCommunityVideo({
    title: '',
    creator: '',
    type: 'Review',
    description: '',
    videoUrl: '',
    productId: '',
    productsShownText: '',
    ctaText: 'Ver productos del video',
    featured: false,
    order: ''
  });

  const parseCommunityProductsInput = (value) => {
    return String(value || '')
      .split(',')
      .map(v => Number(String(v).trim()))
      .filter((id, index, arr) => Number.isFinite(id) && arr.indexOf(id) === index);
  };

  const resolveCommunityProducts = (video) => {
    const ids = Array.isArray(video?.productsShown) && video.productsShown.length
      ? video.productsShown
      : (video?.productId ? [video.productId] : []);
    return ids
      .map(id => Number(id))
      .filter((id, index, arr) => Number.isFinite(id) && arr.indexOf(id) === index)
      .map(id => products.find(p => Number(p.id) === id))
      .filter(Boolean);
  };

  const getCommunityProductName = (productId) => {
    const prod = products.find(p => String(p.id) === String(productId));
    return prod ? prod.name : 'Sin producto vinculado';
  };

  const getCommunityProductsSummary = (video) => {
    const prods = resolveCommunityProducts(video);
    return prods.length ? prods.map(p => `${p.id} - ${p.name}`).join(' • ') : 'Sin productos vinculados';
  };

  const getCommunityProductsInputValue = (video) => {
    const ids = Array.isArray(video?.productsShown) && video.productsShown.length
      ? video.productsShown
      : (video?.productId ? [video.productId] : []);
    return ids.join(', ');
  };

  const normalizeCommunityField = (field, value) => {
    if (field === 'order') return Number(value) || 99;
    if (field === 'productId') return value ? Number(value) : null;
    return String(value || '').trim();
  };

  const updateCommunityProductsShown = async (video, value) => {
    try {
      const parsed = parseCommunityProductsInput(value);
      await setDoc(doc(firebaseRefs.db, 'community_videos', video.dbId || video.id), {
        productsShown: parsed,
        productId: parsed[0] || null,
      }, { merge: true });
    } catch(err) { alert('Error al actualizar productos mostrados: ' + err.message); }
  };

  const handleAddCommunityVideo = async (e) => {
    e.preventDefault();
    const videoUrl = newCommunityVideo.videoUrl.trim();
    if (!videoUrl) return alert("Pegá el link directo del video");
    try {
      const newId = `community_${Date.now()}`;

      if (newCommunityVideo.featured) {
        await Promise.all(communityVideos.map(v => setDoc(doc(firebaseRefs.db, 'community_videos', v.dbId || v.id), { featured: false }, { merge: true })));
      }

      const parsedProducts = parseCommunityProductsInput(newCommunityVideo.productsShownText);
      const primaryProductId = parsedProducts[0] || (newCommunityVideo.productId ? Number(newCommunityVideo.productId) : null);

      await setDoc(doc(firebaseRefs.db, 'community_videos', newId), {
        id: newId,
        title: (newCommunityVideo.title || 'Contenido real 028').trim(),
        creator: (newCommunityVideo.creator || '028 Community').trim(),
        type: (newCommunityVideo.type || 'Review').trim(),
        description: (newCommunityVideo.description || 'Referencias reales, experiencias y contenido de nuestra comunidad.').trim(),
        videoUrl,
        productId: primaryProductId,
        productsShown: parsedProducts.length ? parsedProducts : (primaryProductId ? [primaryProductId] : []),
        ctaText: (newCommunityVideo.ctaText || 'Ver productos del video').trim(),
        featured: !!newCommunityVideo.featured,
        order: Number(newCommunityVideo.order) || (communityVideos.length + 1),
        isHidden: false,
        views: 0,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      resetCommunityForm();
      alert("Video agregado a 028 Community");
    } catch(err) { alert("Error al guardar video: " + err.message); }
  };

  const updateCommunityVideo = async (video, field, value) => {
    try {
      const cleanValue = normalizeCommunityField(field, value);
      await setDoc(doc(firebaseRefs.db, 'community_videos', video.dbId || video.id), { [field]: cleanValue }, { merge: true });
    } catch(err) { alert("Error al actualizar video: " + err.message); }
  };

  const toggleCommunityVideo = async (video) => {
    try {
      await setDoc(doc(firebaseRefs.db, 'community_videos', video.dbId || video.id), { isHidden: !video.isHidden }, { merge: true });
    } catch(err) { alert("Error al cambiar visibilidad: " + err.message); }
  };

  const setFeaturedCommunityVideo = async (video) => {
    try {
      await Promise.all(communityVideos.map(v => setDoc(doc(firebaseRefs.db, 'community_videos', v.dbId || v.id), { featured: (v.dbId || v.id) === (video.dbId || video.id) }, { merge: true })));
    } catch(err) { alert("Error al destacar video: " + err.message); }
  };

  const deleteCommunityVideo = async (video) => {
    if(!confirm(`¿Eliminar el video "${video.title || video.creator || '028 Community'}"?`)) return;
    try {
      await deleteDoc(doc(firebaseRefs.db, 'community_videos', video.dbId || video.id));
    } catch(err) { alert("Error al borrar video: " + err.message); }
  };

  const seedCommunityVideos = async () => {
    if(!confirm("¿Crear el video inicial de 028 Community en Firebase?")) return;
    try {
      for (const video of initialCommunityVideos) {
        await setDoc(doc(firebaseRefs.db, 'community_videos', video.id), { ...video, createdAt: serverTimestamp() }, { merge: true });
      }
      alert("Community sincronizado correctamente.");
    } catch(err) { alert("Error al sincronizar Community: " + err.message); }
  };

  const saveHomeLayout = async (sections) => {
    try {
      const normalized = sections
        .map((item, index) => ({ ...item, order: index + 1, active: item.active !== false }))
        .filter(item => item && item.id);
      await setDoc(doc(firebaseRefs.db, 'settings', 'home_layout'), {
        sections: normalized,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setHomeLayout(normalized);
    } catch(err) { alert('Error al guardar el orden del inicio: ' + err.message); }
  };

  const moveHomeBlock = (blockId, direction) => {
    const current = [...normalizedHomeLayout];
    const index = current.findIndex(item => item.id === blockId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    const next = [...current];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    saveHomeLayout(next);
  };

  const toggleHomeBlock = (blockId) => {
    const next = normalizedHomeLayout.map(item => item.id === blockId ? { ...item, active: item.active === false } : item);
    saveHomeLayout(next);
  };

  const resetHomeLayout = () => {
    saveHomeLayout(buildDefaultHomeLayout(homeSections));
  };

  const renderHomeOrderControls = () => (
    <div className={`${theme.card} p-6 rounded-[2rem] mb-8 shadow-sm border`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h3 className={`text-2xl font-bebas uppercase tracking-wide ${theme.text}`}>Orden del inicio</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Armá el orden real del inicio: podés poner una sección de vidriera, después Community, y abajo el resto. Por defecto queda: primera sección de vidriera, luego Community y después las demás.</p>
        </div>
        <button type="button" onClick={resetHomeLayout} className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-[#111111] hover:text-[#fcdb00] text-[10px] font-bold uppercase tracking-widest transition-all">Restaurar default</button>
      </div>
      <div className="grid gap-3">
        {normalizedHomeLayout.map((block, index) => (
          <div key={block.id} className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bebas text-xl ${block.active === false ? 'bg-gray-200 text-gray-400' : 'bg-[#111111] text-[#fcdb00]'}`}>{index + 1}</div>
              <div>
                <p className={`font-bebas text-2xl uppercase tracking-wide leading-none ${theme.text}`}>{block.label}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{block.id === 'community' ? 'Bloque 028 Community' : 'Sección de vidriera específica'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => moveHomeBlock(block.id, -1)} disabled={index === 0} className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${index === 0 ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-[#111111] hover:bg-[#fcdb00]'}`}>Subir</button>
              <button type="button" onClick={() => moveHomeBlock(block.id, 1)} disabled={index === normalizedHomeLayout.length - 1} className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${index === normalizedHomeLayout.length - 1 ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-[#111111] hover:bg-[#fcdb00]'}`}>Bajar</button>
              <button type="button" onClick={() => toggleHomeBlock(block.id)} className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${block.active === false ? 'bg-amber-100 text-amber-700 hover:bg-[#fcdb00] hover:text-[#111111]' : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white'}`}>{block.active === false ? 'Mostrar' : 'Visible'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const updateDeptIcon = async (dept, iconId) => {
    try {
        await setDoc(doc(firebaseRefs.db, 'settings', 'departments'), { icons: { ...deptIcons, [dept]: iconId } }, { merge: true });
    } catch(err) { alert("Error al guardar ícono: " + err.message); }
  };
  const createHomeSection = async () => { if(!newSectionTitle.trim()) return; try { const newId = `sec_${Date.now()}`; await setDoc(doc(firebaseRefs.db, 'home_sections', newId), { id: newId, title: newSectionTitle.toUpperCase(), icon: newSectionIcon.id, iconColor: newSectionIcon.color, layout: newSectionLayout, productIds: [], order: homeSections.length + 1, createdAt: serverTimestamp() }); setNewSectionTitle(''); } catch(err) { alert("Error al crear sección: " + err.message); } };
  const deleteHomeSection = async (id) => { if(confirm("¿Borrar?")) { try { await deleteDoc(doc(firebaseRefs.db, 'home_sections', id)); } catch(err) { alert("Error al borrar sección: " + err.message); } } };
  const addProductToSection = async (sectionId, productId) => { try { const section = homeSections.find(s => s.dbId === sectionId); const current = section.productIds || []; if(current.includes(productId)) return; await setDoc(doc(firebaseRefs.db, 'home_sections', sectionId), { productIds: [...current, productId] }, { merge: true }); } catch(err) { alert("Error al agregar producto: " + err.message); } };
  const removeProductFromSection = async (sectionId, productId) => { try { const section = homeSections.find(s => s.dbId === sectionId); await setDoc(doc(firebaseRefs.db, 'home_sections', sectionId), { productIds: (section.productIds || []).filter(id => id !== productId) }, { merge: true }); } catch(err) { alert("Error al quitar producto: " + err.message); } };
  const toggleSectionLayout = async (section) => { try { await setDoc(doc(firebaseRefs.db, 'home_sections', section.dbId), { layout: section.layout === 'vertical' ? 'horizontal' : 'vertical' }, { merge: true }); } catch(err) { alert("Error al cambiar formato: " + err.message); } };

  // --- NUEVA LÓGICA DE AUTOCOMPLETADO (Nuevos, +Clickeados, -Clickeados) ---
  const autoFillSection = async (sectionId, type) => {
    const typeLabels = {
        least_clicked: "10 menos clickeados",
        most_clicked: "10 más clickeados",
        newest: "10 productos más nuevos"
    };
    if(!confirm(`¿Autocompletar con los ${typeLabels[type]}?`)) return;
    try {
        const available = products.filter(p => p.inStock !== false && !p.isHidden && !p.isDeleted);
        let sorted = [];
        
        if (type === 'least_clicked') {
            sorted = available.sort((a, b) => (a.clicks || 0) - (b.clicks || 0));
        } else if (type === 'most_clicked') {
            sorted = available.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        } else if (type === 'newest') {
            sorted = available.sort((a, b) => {
                const timeA = a.createdAt?.seconds || a.id;
                const timeB = b.createdAt?.seconds || b.id;
                return timeB - timeA;
            });
        }

        await setDoc(doc(firebaseRefs.db, 'home_sections', sectionId), { productIds: sorted.slice(0, 10).map(p => p.id) }, { merge: true });
        alert(`¡Sección actualizada con éxito con los ${typeLabels[type]}! 🚀`);
    } catch(err) { alert("Error al autocompletar: " + err.message); }
  };

  const handleAddProduct = async (e) => { e.preventDefault(); if (!newProduct.category || !newProduct.department) return alert("Faltan datos"); setIsAdding(true); try { const newId = Date.now(); await setDoc(doc(firebaseRefs.db, 'products', `prod_${newId}`), { id: newId, name: newProduct.name.toUpperCase(), price: Number(newProduct.price), department: newProduct.department.toUpperCase(), category: newProduct.category, image: newProduct.image, tag: newProduct.tag, description: newProduct.description, cardSize: newProduct.cardSize, inStock: true, order: 99, clicks: 0, createdAt: serverTimestamp(), isHidden: false, isDeleted: false }); setNewProduct({ name: '', price: '', department: 'VAPES', category: '', image: '', tag: '', description: '', cardSize: 'normal' }); alert("¡Producto agregado!"); } catch (error) { alert("Error al agregar producto: " + error.message); } setIsAdding(false); };
  const handleAddPromo = async (e) => { e.preventDefault(); try { const promoId = newPromo.category.toLowerCase().replace(/\s+/g, '-'); await setDoc(doc(firebaseRefs.db, 'promos', promoId), { category: newPromo.category, minQty: Number(newPromo.minQty), totalPrice: Number(newPromo.totalPrice), createdAt: serverTimestamp() }); setNewPromo({ category: '', minQty: 2, totalPrice: '' }); alert("¡Promo guardada!"); } catch(err) { alert("Error al guardar promo: " + err.message); } };
  const handleDeletePromo = async (id) => { if(confirm("¿Eliminar?")) { try { await deleteDoc(doc(firebaseRefs.db, 'promos', id)); } catch(err) { alert("Error al borrar promo: " + err.message); } } };
  const handleDeleteCategory = async (categoryName) => { 
    if(!confirm(`⚠️ ¿ELIMINAR categoría "${categoryName}" y todos sus productos?`)) return; 
    try { 
      const productsToDelete = products.filter(p => p.category === categoryName); 
      for (const p of productsToDelete) { 
        const isHardcoded = initialProducts.some(initP => initP.id === p.id);
        const docRef = doc(firebaseRefs.db, 'products', p.dbId || `prod_${p.id}`);
        if (isHardcoded) { await setDoc(docRef, { isDeleted: true }, { merge: true }); } else { await deleteDoc(docRef); }
      } 
      try { await deleteDoc(doc(firebaseRefs.db, 'promos', categoryName.toLowerCase().replace(/\s+/g, '-'))); } catch (e) {} 
      alert(`Categoría eliminada.`); 
    } catch (err) { alert("Error al eliminar la categoría: " + err.message); } 
  };

  const syncAllProducts = async () => { 
      if (confirm("¿Sincronizar Catálogo y Restaurar Secciones?")) { 
          setLoading(true); 
          try { 
              for (const p of initialProducts) { 
                  await setDoc(doc(firebaseRefs.db, 'products', `prod_${p.id}`), { id: p.id, name: p.name, department: p.department || "OTROS", category: p.category, image: p.image, description: p.description || "", cardSize: p.cardSize || "normal", order: 99, isHidden: false, isDeleted: false, clicks: 0 }, { merge: true }); 
              } 
              for (const sec of initialHomeSections) { 
                  await setDoc(doc(firebaseRefs.db, 'home_sections', sec.id), { ...sec, createdAt: serverTimestamp() }, { merge: true }); 
              } 
              alert("Catálogo sincronizado perfectamente."); 
          } catch (err) { alert("Error al sincronizar: " + err.message); } 
          setLoading(false); 
      } 
  };

  const deleteOrder = async (id) => { if (confirm("¿Eliminar pedido permanentemente?")) { try { await deleteDoc(doc(firebaseRefs.db, 'orders', id)); } catch (err) { alert("Error: " + err.message); } } };
  
  // --- BRANDBOOK COLORS FOR ADMIN ---
  const theme = {
    bg: darkMode ? 'bg-[#111111]' : 'bg-[#f2f2f2]',
    text: darkMode ? 'text-gray-100' : 'text-[#111111]',
    card: darkMode ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-white border-[#e5e5e5]',
    cardHover: darkMode ? 'hover:border-[#fcdb00]/40' : 'hover:border-[#fcdb00]',
    subText: darkMode ? 'text-gray-400' : 'text-gray-500',
    nav: 'bg-[#111111]',
    input: darkMode ? 'bg-[#222222] border-[#333333] text-white' : 'bg-[#f2f2f2] border-transparent text-[#111111]',
    tabActive: 'border-[#fcdb00]',
    tabActiveText: darkMode ? 'text-[#fcdb00]' : 'text-[#111111]',
    tabInactive: 'border-transparent text-gray-400',
    stickyHeader: darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-[#e5e5e5]'
  };

  const renderStockGroup = (categoryFilter) => {
    const group = products.filter(p => p.category === categoryFilter && !p.isDeleted);
    if (group.length === 0) return null;
    const currentDept = group[0]?.department || "SIN DEPTO";
    return (
        <div className="mb-10" key={categoryFilter}>
            <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b pb-3 mb-4 ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
               <div className="flex items-center gap-4">
                   <h3 className={`text-2xl font-bebas uppercase tracking-wide ${theme.subText}`}>{categoryFilter}</h3>
                   <div className="flex items-center gap-2 bg-[#fcdb00]/10 px-3 py-1.5 rounded-lg border border-[#fcdb00]/30">
                       <span className="text-[10px] font-bold uppercase text-[#b8952a] tracking-widest font-poppins">Depto:</span>
                       <input list="dept-suggestions-stock" defaultValue={currentDept} onBlur={(e) => { if(e.target.value.toUpperCase() !== currentDept.toUpperCase()) { updateCategoryDepartment(categoryFilter, e.target.value); } }} onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }} className={`bg-transparent text-[10px] font-bold uppercase outline-none w-28 md:w-32 border-b border-transparent hover:border-[#fcdb00] focus:border-[#fcdb00] transition-colors font-poppins ${darkMode ? 'text-white' : 'text-[#111111]'}`} placeholder="Escribí..." title="Cambiá el departamento de toda esta categoría" />
                       <datalist id="dept-suggestions-stock">{availableDepartments.map(d => <option key={d} value={d} />)}</datalist>
                   </div>
               </div>
               <button onClick={() => handleDeleteCategory(categoryFilter)} className="w-fit text-red-500 hover:text-red-700 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase font-poppins"><i className="fas fa-trash"></i> Borrar Categoría</button>
            </div>
            <div className="grid gap-4">
                {group.map(p => (
                    <div key={p.id} className={`${theme.card} p-5 rounded-[1.5rem] flex justify-between items-start shadow-sm border ${theme.cardHover} transition-all ${p.isHidden ? 'opacity-60 bg-gray-50/50' : ''}`}>
                        <div className="flex items-start gap-4 w-3/4">
                            <div className="relative w-16 h-16 flex-shrink-0 mt-1 bg-[#f2f2f2] rounded-xl p-1">
                                <img src={p.image} className={`w-full h-full object-contain mix-blend-multiply ${(p.inStock === false || p.isHidden) ? 'grayscale opacity-50' : ''}`} alt="" />
                                {p.inStock === false && !p.isHidden && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-times text-red-500 text-lg"></i></div>}
                                {p.isHidden && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-eye-slash text-amber-500 text-lg"></i></div>}
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                                <input type="text" defaultValue={p.name} className={`font-bebas text-xl md:text-2xl tracking-wide uppercase w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#fcdb00] outline-none transition-colors pb-0.5 ${darkMode ? 'text-gray-200' : 'text-[#111111]'}`} onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} onBlur={(e) => { if (e.target.value.toUpperCase() !== p.name.toUpperCase()) { updateName(p, e.target.value); } }} title="Haz clic para editar el nombre" />
                                <div className="flex items-center gap-2 mt-1">
                                     <span className="text-gray-400 text-[12px] font-bebas">$</span>
                                     <input type="number" key={`price-${p.price}`} defaultValue={p.price} className={`w-24 rounded-md px-2 py-1 text-sm font-poppins font-bold focus:ring-1 focus:ring-[#fcdb00] outline-none transition-colors ${theme.input}`} onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} onBlur={(e) => { if (parseInt(e.target.value) !== p.price) updatePrice(p, e.target.value); }} />
                                     <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300 dark:border-[#333333]">
                                        <span className="text-gray-400 text-[10px] font-poppins">Pos:</span>
                                        <input type="number" key={`order-${p.order}`} defaultValue={p.order || 99} className={`w-12 rounded-md px-1 py-1 text-[10px] font-bold text-center focus:ring-1 focus:ring-[#fcdb00] outline-none transition-colors font-poppins ${theme.input}`} onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} onBlur={(e) => { updateOrder(p, e.target.value); }} title="Posición/Orden" />
                                     </div>
                                     <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300 dark:border-[#333333]">
                                        <span className="text-gray-400 text-[10px] font-poppins">Tamaño:</span>
                                        <select value={p.cardSize || 'normal'} onChange={(e) => updateCardSize(p, e.target.value)} className={`rounded-md px-1 py-1 text-[10px] font-bold outline-none cursor-pointer font-poppins ${theme.input}`}>
                                            <option value="normal">📏 Normal</option><option value="medium">🔲 Mediano</option><option value="large">⬜ Grande</option>
                                        </select>
                                     </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`w-fit text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm font-poppins ${p.isHidden ? 'bg-amber-100 text-amber-700' : (p.inStock === false ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700')}`}>{p.isHidden ? 'Oculto' : (p.inStock === false ? 'Agotado' : 'Disponible')}</span>
                                  <input type="text" list="dept-suggestions-stock" defaultValue={p.department || ''} placeholder="SIN DEPTO" onBlur={(e) => updateProductDepartment(p, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} className={`w-24 text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border font-poppins outline-none focus:border-[#fcdb00] transition-colors ${darkMode ? 'bg-transparent border-[#333333] text-gray-400 focus:text-white' : 'bg-transparent border-gray-300 text-gray-500 focus:text-[#111111]'}`} title="Editar departamento de este producto" />
                                  <span className={`w-fit text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border font-poppins flex items-center gap-1 ${darkMode ? 'bg-[#222] border-[#444] text-[#fcdb00]' : 'bg-gray-100 border-gray-200 text-[#b8952a]'}`} title="Cantidad de veces que intentaron añadirlo al carrito"><i className="fas fa-mouse-pointer"></i> Clicks: {p.clicks || 0}</span>
                                </div>
                                <textarea defaultValue={p.description || ""} placeholder="Escribe la biografía o descripción del producto aquí..." className={`w-full mt-3 text-[11px] p-3 rounded-xl outline-none transition-colors border focus:border-[#fcdb00] focus:ring-1 focus:ring-[#fcdb00] resize-none font-poppins ${darkMode ? 'bg-[#222222] border-[#333333] text-gray-300 placeholder-gray-500' : 'bg-[#f2f2f2] border-transparent text-gray-600 placeholder-gray-400'}`} rows="2" onBlur={(e) => { if (e.target.value !== (p.description || "")) { updateDescription(p, e.target.value); } }} title="Haz clic para editar la biografía" />
                                <div className="flex items-center gap-2 mt-2 w-full">
                                    <i className="fas fa-link text-gray-400 text-[10px]"></i>
                                    <input type="url" defaultValue={p.image} placeholder="URL de la imagen (Ej: https://i.ibb.co/...)" className={`w-full text-[10px] p-2 rounded-lg outline-none transition-colors border focus:border-[#fcdb00] focus:ring-1 focus:ring-[#fcdb00] font-poppins ${darkMode ? 'bg-[#222222] border-[#333333] text-gray-300 placeholder-gray-500' : 'bg-[#f2f2f2] border-transparent text-gray-600 placeholder-gray-400'}`} onBlur={(e) => { if (e.target.value !== p.image) { updateImage(p, e.target.value); } }} onKeyDown={(e) => { if(e.key === 'Enter') { e.target.blur(); } }} title="Pegá acá el link directo de ImgBB y tocá afuera para guardar" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row items-center gap-2 flex-shrink-0 mt-1">
                             <button onClick={() => toggleStock(p)} className={`w-full lg:w-auto px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm font-poppins ${p.inStock === false ? 'bg-green-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>{p.inStock === false ? 'Habilitar' : 'Agotar'}</button>
                             <button onClick={() => toggleVisibility(p)} title={p.isHidden ? 'Mostrar en tienda' : 'Ocultar de la tienda'} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${p.isHidden ? 'bg-amber-100 text-amber-600 hover:bg-[#fcdb00] hover:text-[#111111]' : 'bg-gray-200 text-gray-600 hover:bg-[#fcdb00] hover:text-[#111111]'}`}><i className={`fas ${p.isHidden ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i></button>
                             <button onClick={() => handleDeleteProduct(p)} title="Eliminar definitivamente" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-red-600 hover:text-white transition-all text-gray-600 shadow-sm"><i className="fas fa-trash text-sm"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-[#111111]' : 'bg-[#f2f2f2]'}`}>
      <div className="w-12 h-12 border-4 border-[#f2f2f2] border-t-[#fcdb00] rounded-full animate-spin mb-6"></div>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-poppins">Cargando...</p>
    </div>
  );

  return (
    <div className={`min-h-screen font-poppins pb-10 transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;700;900&display=swap'); .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; } .font-poppins { font-family: 'Poppins', sans-serif; }`}} />
      <nav className={`${theme.nav} py-4 px-6 text-white flex justify-between items-center shadow-lg border-b border-white/10 sticky top-0 z-50`}><div className="flex items-center gap-4"><img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain" /><h1 className="text-2xl font-bebas tracking-wide uppercase pt-1">028<span className="text-[#fcdb00]">Control</span></h1></div><div className="flex items-center gap-4"><button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#fcdb00] hover:text-[#111111] transition-all text-xs">{darkMode ? '☀️' : '🌙'}</button><a href="/?admin=true" target="_blank" className="text-[11px] text-[#fcdb00] font-bold uppercase hover:text-white transition-all tracking-widest bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">Ver Web</a></div></nav>
      <div className={`${theme.stickyHeader} border-b sticky top-[72px] z-40 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto flex overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('historial')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'historial' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Historial</button>
          <button onClick={() => setActiveTab('stock')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'stock' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Stock</button>
          <button onClick={() => setActiveTab('vidriera')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'vidriera' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Vidriera</button>
          <button onClick={() => setActiveTab('community')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'community' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Community 🎥</button>
          <button onClick={() => setActiveTab('crear')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'crear' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Crear +</button>
          <button onClick={() => setActiveTab('clientes')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'clientes' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Clientes</button>
          <button onClick={() => setActiveTab('promos')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'promos' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Promos %</button>
          <button onClick={() => setActiveTab('cupones')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'cupones' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Cupones</button>
          <button onClick={() => setActiveTab('usuarios')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'usuarios' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Usuarios</button>
          <button onClick={() => setActiveTab('ofertas')} className={`flex-shrink-0 flex-1 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'ofertas' ? `${theme.tabActive} ${theme.tabActiveText}` : theme.tabInactive}`}>Ofertas 🔥</button>
        </div>
      </div>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        
        {activeTab === 'stock' && (<div className="animate-in fade-in duration-500"><div className="flex justify-between items-center mb-8"><h2 className="text-4xl font-bebas uppercase tracking-wide">Gestión de Stock</h2><button onClick={syncAllProducts} className="text-[10px] bg-[#111111] text-[#fcdb00] px-4 py-2.5 rounded-lg font-bold uppercase tracking-widest shadow-md hover:bg-[#fcdb00] hover:text-[#111111] transition-all">Sincronizar DB</button></div>{uniqueCategories.map(cat => renderStockGroup(cat))}</div>)}

        {activeTab === 'vidriera' && (<div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-8"><div><h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Vidriera</h2><p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Armá las secciones del Inicio</p></div></div>
          {renderHomeOrderControls()}
          
          <div className={`${theme.card} p-6 rounded-[2rem] mb-8 shadow-sm border`}>
            <div className="mb-4">
                <h3 className={`text-2xl font-bebas uppercase tracking-wide ${theme.text}`}>Íconos de Departamentos</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Elegí un ícono para que se vea en el inicio de tus clientes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDepartments.map(dept => {
                const currentIconId = deptIcons[dept] || 'fa-box';
                return (
                <div key={dept} className={`flex items-center justify-between p-4 border rounded-2xl ${darkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
                   <span className={`font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 ${theme.text}`}>
                     <i className={`${DEPT_ICONS.find(i => i.id === currentIconId)?.prefix || 'fas'} ${currentIconId} text-[#fcdb00] text-lg w-6`}></i> {dept}
                   </span>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[160px] mask-image-gradient pr-4">
                     {DEPT_ICONS.map(icon => (
                       <button
                         key={icon.id}
                         onClick={() => updateDeptIcon(dept, icon.id)}
                         className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors shadow-sm ${deptIcons[dept] === icon.id ? 'bg-[#111111] text-[#fcdb00] border-2 border-[#fcdb00]' : (darkMode ? 'bg-[#333] text-gray-400 hover:bg-[#444]' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-200')}`}
                       >
                         <i className={`${icon.prefix} ${icon.id}`}></i>
                       </button>
                     ))}
                   </div>
                </div>
              )})}
            </div>
          </div>

          <div className={`${theme.card} p-6 rounded-[2rem] mb-8 flex flex-col gap-4 shadow-sm border`}><div className="flex flex-col md:flex-row gap-4 items-end w-full"><div className="flex-1 w-full"><label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Título de la nueva sección</label><input type="text" value={newSectionTitle} onChange={e=>setNewSectionTitle(e.target.value)} placeholder="Ej: Ofertas Relámpago..." className={`w-full mt-2 p-4 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#fcdb00] border-transparent ${theme.input}`}/></div><button onClick={createHomeSection} className="w-full md:w-auto bg-[#fcdb00] text-[#111111] font-bebas text-lg uppercase px-8 py-3.5 rounded-xl hover:bg-[#111111] hover:text-[#fcdb00] hover:shadow-xl transition-all">Crear Sección</button></div><div className="mt-2"><label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block tracking-wider">Ícono</label><div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">{AVAILABLE_ICONS.map(iconObj => (<button key={iconObj.id} onClick={() => setNewSectionIcon(iconObj)} className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-xl transition-all ${newSectionIcon.id === iconObj.id ? 'bg-[#111111] shadow-md scale-110' : (darkMode ? 'bg-[#222] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200')}`}><i className={`${iconObj.prefix} ${iconObj.id} ${newSectionIcon.id === iconObj.id ? 'text-[#fcdb00]' : 'text-gray-400'}`}></i></button>))}</div></div><div className="mt-2 border-t border-gray-200 dark:border-[#333333] pt-4"><label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block tracking-wider">Formato</label><div className="flex gap-2"><button onClick={() => setNewSectionLayout('horizontal')} className={`flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${newSectionLayout === 'horizontal' ? 'bg-[#111111] text-[#fcdb00] shadow-md' : (darkMode ? 'bg-[#222] text-gray-400 hover:bg-[#333]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}><i className="fas fa-arrows-alt-h mr-2"></i> Carrusel</button><button onClick={() => setNewSectionLayout('vertical')} className={`flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${newSectionLayout === 'vertical' ? 'bg-[#111111] text-[#fcdb00] shadow-md' : (darkMode ? 'bg-[#222] text-gray-400 hover:bg-[#333]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}><i className="fas fa-th-large mr-2"></i> Grilla</button></div></div></div>{homeSections.length === 0 && (<div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-[#333333] rounded-[2rem]"><i className="fas fa-magic text-4xl text-gray-300 mb-4"></i><p className="text-[11px] font-bold uppercase text-gray-500 tracking-widest">No hay secciones.</p></div>)}<div className="space-y-6">{homeSections.map(sec => (<div key={sec.id} className={`${theme.card} p-6 rounded-[2rem] shadow-sm border`}><div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-[#333333] pb-4"><h3 className={`text-3xl font-bebas uppercase tracking-wide flex items-center gap-2 ${theme.text}`}><i className={`${AVAILABLE_ICONS.find(i => i.id === sec.icon)?.prefix || 'fas'} ${sec.icon || 'fa-star'} ${sec.iconColor || 'text-[#fcdb00]'}`}></i> {sec.title}</h3><div className="flex items-center gap-2"><button onClick={()=>toggleSectionLayout(sec)} className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-[#333] text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Cambiar el formato"><i className={`fas ${sec.layout === 'vertical' ? 'fa-th-large' : 'fa-arrows-alt-h'} mr-1.5`}></i> {sec.layout === 'vertical' ? 'Grilla' : 'Carrusel'}</button><button onClick={()=>deleteHomeSection(sec.dbId)} className="text-red-500 hover:text-white hover:bg-red-600 w-9 h-9 rounded-lg flex items-center justify-center transition-all bg-red-50 dark:bg-red-900/20"><i className="fas fa-trash text-sm"></i></button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">{sec.productIds?.map(pid => { const prod = products.find(p => p.id === pid && !p.isDeleted); if(!prod) return null; return (<div key={pid} className={`relative rounded-xl p-4 flex flex-col gap-3 border ${darkMode ? 'bg-[#222] border-[#444]' : 'bg-[#f2f2f2] border-transparent shadow-sm'}`}><div className="flex items-center gap-3"><div className="w-12 h-12 bg-white rounded-lg p-1 shadow-sm"><img src={prod.image} className="w-full h-full object-contain mix-blend-multiply" alt=""/></div><div className="flex-1 min-w-0"><p className={`text-[12px] font-bebas text-xl uppercase truncate tracking-wide ${theme.text}`}>{prod.name}</p><p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest truncate mt-0.5">{prod.category}</p></div><button onClick={()=>removeProductFromSection(sec.dbId, pid)} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg text-sm flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors shadow-sm"><i className="fas fa-times"></i></button></div><div className="flex items-center justify-between border-t border-gray-200 dark:border-[#444] pt-3 mt-1"><span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Tamaño en Vidriera:</span><select value={prod.cardSize || 'normal'} onChange={(e) => updateCardSize(prod, e.target.value)} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-md border outline-none cursor-pointer ${darkMode ? 'bg-[#111] border-[#555] text-gray-300 focus:ring-1 focus:ring-[#fcdb00]' : 'bg-white border-gray-300 text-[#111111] focus:ring-1 focus:ring-[#fcdb00]'}`}><option value="normal">📏 Normal</option><option value="medium">🔲 Mediano</option><option value="large">⬜ Grande</option></select></div></div>) })} {(!sec.productIds || sec.productIds.length === 0) && (<p className="text-[11px] font-bold uppercase text-gray-400 italic col-span-full">Aún no agregaste productos a esta sección.</p>)} </div><div className="relative mb-3"><i className="fas fa-plus absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i><select onChange={(e) => { addProductToSection(sec.dbId, parseInt(e.target.value)); e.target.value = ''; }} className={`w-full p-4 pl-12 rounded-xl outline-none font-bold text-xs uppercase cursor-pointer appearance-none tracking-widest focus:ring-2 focus:ring-[#fcdb00] border-transparent ${theme.input}`}><option value="">AGREGAR PRODUCTO A "{sec.title}"...</option>{products.filter(p => !p.isDeleted && !sec.productIds?.includes(p.id)).map(p => (<option key={p.id} value={p.id}>{p.category} - {p.name} (${p.price})</option>))}</select></div><div className="flex flex-col gap-2 mt-3 border-t border-gray-200 dark:border-[#333333] pt-4"><p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1"><i className="fas fa-magic text-[#fcdb00]"></i> Autocompletar (10 Productos):</p><div className="flex flex-col sm:flex-row gap-2"><button onClick={() => autoFillSection(sec.dbId, 'newest')} className={`flex-1 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 border ${darkMode ? 'bg-[#222] border-[#fcdb00]/30 text-[#fcdb00] hover:bg-[#fcdb00] hover:text-[#111111]' : 'bg-[#111111] border-transparent text-[#fcdb00] hover:bg-[#fcdb00] hover:text-[#111111]'}`}><i className="fas fa-star"></i> + Nuevos</button><button onClick={() => autoFillSection(sec.dbId, 'most_clicked')} className={`flex-1 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 border ${darkMode ? 'bg-[#222] border-[#fcdb00]/30 text-[#fcdb00] hover:bg-[#fcdb00] hover:text-[#111111]' : 'bg-[#111111] border-transparent text-[#fcdb00] hover:bg-[#fcdb00] hover:text-[#111111]'}`}><i className="fas fa-fire"></i> + Clickeados</button><button onClick={() => autoFillSection(sec.dbId, 'least_clicked')} className={`flex-1 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 border ${darkMode ? 'bg-[#222] border-[#fcdb00]/30 text-[#fcdb00] hover:bg-[#fcdb00] hover:text-[#111111]' : 'bg-[#111111] border-transparent text-[#fcdb00] hover:bg-[#fcdb00] hover:text-[#111111]'}`}><i className="fas fa-arrow-down"></i> - Clickeados</button></div></div></div>))}</div></div>)}

        {/* --- PESTAÑA: 028 COMMUNITY --- */}

        {activeTab === 'community' && (
          <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-5 mb-8">
              <div>
                <h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>028 Community</h2>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Videos, cards con flip y productos editables por video</p>
              </div>
              <button type="button" onClick={seedCommunityVideos} className="bg-[#111111] text-[#fcdb00] px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#fcdb00] hover:text-[#111111] transition-all shadow-sm">Cargar videos base</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`${theme.card} border rounded-[1.75rem] p-5 shadow-sm`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Videos visibles</p>
                <p className="font-bebas text-4xl mt-1">{communityVideos.filter(v => !v.isHidden).length}</p>
              </div>
              <div className={`${theme.card} border rounded-[1.75rem] p-5 shadow-sm`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Reproducciones</p>
                <p className="font-bebas text-4xl mt-1">{communityVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0)}</p>
              </div>
              <div className={`${theme.card} border rounded-[1.75rem] p-5 shadow-sm`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Clicks a producto</p>
                <p className="font-bebas text-4xl mt-1">{communityVideos.reduce((acc, v) => acc + (Number(v.clicks) || 0), 0)}</p>
              </div>
            </div>

            <form onSubmit={handleAddCommunityVideo} className={`${theme.card} p-6 md:p-8 rounded-[2rem] shadow-sm border mb-8 grid grid-cols-1 md:grid-cols-2 gap-4`}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Título</label>
                <input type="text" placeholder="Ej: Review real 028" value={newCommunityVideo.title} onChange={e => setNewCommunityVideo({...newCommunityVideo, title: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Creador / referencia</label>
                <input type="text" placeholder="Ej: @martulali" value={newCommunityVideo.creator} onChange={e => setNewCommunityVideo({...newCommunityVideo, creator: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Link del video</label>
                <input type="url" required placeholder="https://res.cloudinary.com/.../video.mp4" value={newCommunityVideo.videoUrl} onChange={e => setNewCommunityVideo({...newCommunityVideo, videoUrl: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[11px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Tipo</label>
                <select value={newCommunityVideo.type} onChange={e => setNewCommunityVideo({...newCommunityVideo, type: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`}>
                  <option value="Review">Review</option>
                  <option value="Influencer">Influencer</option>
                  <option value="Cliente real">Cliente real</option>
                  <option value="Entrega">Entrega</option>
                  <option value="Referencia">Referencia</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Producto principal</label>
                <select value={newCommunityVideo.productId} onChange={e => setNewCommunityVideo({...newCommunityVideo, productId: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`}>
                  <option value="">Sin producto principal</option>
                  {availableCommunityProducts.map(product => (
                    <option key={`new-community-product-${product.id}`} value={product.id}>{product.id} - {product.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Productos mostrados (IDs separados por coma)</label>
                <input type="text" placeholder="Ej: 17, 26, 33" value={newCommunityVideo.productsShownText} onChange={e => setNewCommunityVideo({...newCommunityVideo, productsShownText: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Estos son los productos que se verán atrás de la tarjeta cuando el video se dé vuelta.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Texto CTA</label>
                <input type="text" placeholder="Ver productos del video" value={newCommunityVideo.ctaText} onChange={e => setNewCommunityVideo({...newCommunityVideo, ctaText: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Orden</label>
                <input type="number" min="1" placeholder="1" value={newCommunityVideo.order} onChange={e => setNewCommunityVideo({...newCommunityVideo, order: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción</label>
                <textarea rows="2" placeholder="Texto corto que aparece debajo del video" value={newCommunityVideo.description} onChange={e => setNewCommunityVideo({...newCommunityVideo, description: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all resize-none ${theme.input}`}></textarea>
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-4 bg-[#fcdb00]/10 border border-[#fcdb00]/20 rounded-2xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={newCommunityVideo.featured} onChange={e => setNewCommunityVideo({...newCommunityVideo, featured: e.target.checked})} className="w-5 h-5 accent-[#fcdb00]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8952a]">Marcar como destacado</span>
                </label>
                <button type="submit" className="bg-[#fcdb00] text-[#111111] font-bebas text-xl uppercase px-8 py-3 rounded-xl hover:bg-[#111111] hover:text-[#fcdb00] transition-all shadow-md">Agregar video</button>
              </div>
            </form>

            {communityVideos.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-[#333333] rounded-[2rem]">
                <i className="fas fa-video text-4xl text-gray-300 mb-4"></i>
                <p className="text-[11px] font-bold uppercase text-gray-500 tracking-widest">No hay videos cargados.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {communityVideos.map((video) => (
                  <div key={video.dbId || video.id} className={`${theme.card} border rounded-[2rem] p-5 md:p-6 shadow-sm`}>
                    <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-5">
                      <div className="rounded-[1.5rem] overflow-hidden bg-black border border-white/10 aspect-[9/16] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <video src={video.videoUrl} className="w-full h-full object-cover" controls preload="metadata" playsInline />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Título</label>
                          <input type="text" defaultValue={video.title || ''} onBlur={(e) => e.target.value !== (video.title || '') && updateCommunityVideo(video, 'title', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Creador</label>
                          <input type="text" defaultValue={video.creator || ''} onBlur={(e) => e.target.value !== (video.creator || '') && updateCommunityVideo(video, 'creator', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Link del video</label>
                          <input type="url" defaultValue={video.videoUrl || ''} onBlur={(e) => e.target.value !== (video.videoUrl || '') && updateCommunityVideo(video, 'videoUrl', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[11px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Tipo</label>
                          <select value={video.type || 'Review'} onChange={(e) => updateCommunityVideo(video, 'type', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`}>
                            <option value="Review">Review</option>
                            <option value="Influencer">Influencer</option>
                            <option value="Cliente real">Cliente real</option>
                            <option value="Entrega">Entrega</option>
                            <option value="Referencia">Referencia</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Orden</label>
                          <input type="number" defaultValue={video.order || 99} onBlur={(e) => Number(e.target.value) !== Number(video.order || 99) && updateCommunityVideo(video, 'order', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Producto principal</label>
                          <select value={video.productId || ''} onChange={(e) => updateCommunityVideo(video, 'productId', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`}>
                            <option value="">Sin producto principal</option>
                            {availableCommunityProducts.map(product => (
                              <option key={`community-product-${video.id}-${product.id}`} value={product.id}>{product.id} - {product.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Texto CTA</label>
                          <input type="text" defaultValue={video.ctaText || 'Ver productos del video'} onBlur={(e) => e.target.value !== (video.ctaText || 'Ver productos del video') && updateCommunityVideo(video, 'ctaText', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Productos mostrados (IDs separados por coma)</label>
                          <input type="text" defaultValue={getCommunityProductsInputValue(video)} onBlur={(e) => updateCommunityProductsShown(video, e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{getCommunityProductsSummary(video)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción</label>
                          <textarea rows="2" defaultValue={video.description || ''} onBlur={(e) => e.target.value !== (video.description || '') && updateCommunityVideo(video, 'description', e.target.value)} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all resize-none ${theme.input}`}></textarea>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className={`${darkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Principal</p>
                            <p className="text-[10px] font-black uppercase mt-1">{getCommunityProductName(video.productId)}</p>
                          </div>
                          <div className={`${darkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Views</p>
                            <p className="font-bebas text-2xl">{Number(video.views) || 0}</p>
                          </div>
                          <div className={`${darkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Clicks</p>
                            <p className="font-bebas text-2xl">{Number(video.clicks) || 0}</p>
                          </div>
                          <div className={`${darkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Estado</p>
                            <p className={`text-[10px] font-black uppercase mt-1 ${video.isHidden ? 'text-amber-600' : 'text-green-600'}`}>{video.isHidden ? 'Oculto' : 'Visible'}</p>
                          </div>
                        </div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center border-t border-gray-200 dark:border-[#333333] pt-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg text-center ${video.featured ? 'bg-[#fcdb00] text-[#111111]' : (video.isHidden ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}`}>{video.featured ? 'Video destacado' : (video.isHidden ? 'Oculto en la web' : 'Visible en la web')}</span>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setFeaturedCommunityVideo(video)} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${video.featured ? 'bg-[#111111] text-[#fcdb00]' : 'bg-gray-100 text-gray-600 hover:bg-[#fcdb00] hover:text-[#111111]'}`}>{video.featured ? 'Destacado' : 'Destacar'}</button>
                            <button type="button" onClick={() => toggleCommunityVideo(video)} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${video.isHidden ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>{video.isHidden ? 'Mostrar' : 'Ocultar'}</button>
                            <button type="button" onClick={() => deleteCommunityVideo(video)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all">Borrar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'promos' && (<div className="animate-in fade-in duration-500 max-w-lg mx-auto"><div className="flex justify-between items-end mb-8"><div><h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Promociones</h2><p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Descuentos automáticos</p></div></div><form onSubmit={handleAddPromo} className={`${theme.card} p-8 rounded-[2rem] shadow-sm border mb-8 flex flex-col gap-5`}><div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Categoría a bonificar</label><input list="promo-category-suggestions" placeholder="Ej: Ignite v400..." value={newPromo.category} onChange={e => setNewPromo({...newPromo, category: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all uppercase ${theme.input}`} required/><datalist id="promo-category-suggestions">{uniqueCategories.map(cat => <option key={cat} value={cat} />)}</datalist></div><div className="flex gap-4"><div className="flex-1"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Cantidad Mínima</label><input type="number" required min="2" placeholder="Ej: 2" value={newPromo.minQty} onChange={e => setNewPromo({...newPromo, minQty: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} /></div><div className="flex-1"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Precio Total</label><input type="number" required placeholder="Ej: 49000" value={newPromo.totalPrice} onChange={e => setNewPromo({...newPromo, totalPrice: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} /></div></div><p className="text-[11px] text-gray-500">Ejemplo: Llevando 2 o más, quedan a $24.500 c/u automáticamente.</p><button type="submit" className="bg-[#fcdb00] text-[#111111] font-bebas text-xl uppercase py-4 rounded-xl mt-2 hover:bg-[#111111] hover:text-[#fcdb00] shadow-md transition-all">Guardar Promoción</button></form><div className="grid gap-4">{promos.length === 0 ? (<p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-10">No hay promos activas</p>) : (promos.map(promo => (<div key={promo.id} className={`${theme.card} p-6 rounded-[1.5rem] flex justify-between items-center shadow-sm border`}><div><h4 className="font-bebas text-2xl uppercase tracking-wide mb-1">{promo.category}</h4><p className="text-gray-500 text-[11px] font-bold tracking-widest uppercase">Llevando {promo.minQty}+ : ${(promo.totalPrice / promo.minQty).toLocaleString('es-AR')} c/u</p></div><button onClick={() => handleDeletePromo(promo.id)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"><i className="fas fa-trash text-lg"></i></button></div>)))}</div></div>)}

        {/* --- PESTAÑA: CUPONES --- */}
        {activeTab === 'cupones' && (
          <div className="animate-in fade-in duration-500 max-w-lg mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Cupones</h2>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Códigos para Influencers</p>
              </div>
            </div>
            <form onSubmit={handleAddCoupon} className={`${theme.card} p-8 rounded-[2rem] shadow-sm border mb-8 flex flex-col gap-5`}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Código de Descuento</label>
                <input type="text" required placeholder="Ej: MARTU20" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all uppercase ${theme.input}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Porcentaje Off (%)</label>
                <input type="number" required min="1" max="99" placeholder="Ej: 15" value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />
              </div>
              <button type="submit" className="bg-[#fcdb00] text-[#111111] font-bebas text-xl uppercase py-4 rounded-xl mt-2 hover:bg-[#111111] hover:text-[#fcdb00] shadow-md transition-all">Crear Cupón</button>
            </form>
            <div className="grid gap-4">
              {coupons.length === 0 ? (
                <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-10">No hay cupones activos</p>
              ) : (
                coupons.map(coupon => (
                  <div key={coupon.id} className={`${theme.card} p-6 rounded-[1.5rem] flex justify-between items-center shadow-sm border`}>
                    <div>
                      <h4 className="font-bebas text-2xl uppercase tracking-wide mb-1">{coupon.code}</h4>
                      <p className="text-gray-500 text-[11px] font-bold tracking-widest uppercase">¡Aplica {coupon.discount}% al carrito!</p>
                    </div>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"><i className="fas fa-trash text-lg"></i></button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- PESTAÑA: USUARIOS --- */}
        {activeTab === 'usuarios' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Usuarios</h2>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Cuentas Registradas con Google</p>
              </div>
              <span className="bg-[#fcdb00] text-[#111111] text-[11px] font-bold px-4 py-2 rounded-lg shadow-sm">{usersList.length} Registros</span>
            </div>
            {usersList.length === 0 ? (
              <div className={`${theme.card} p-24 rounded-[3rem] border-2 border-dashed text-center flex flex-col items-center`}>
                <i className="fab fa-google text-gray-300 text-5xl mb-6"></i>
                <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Nadie se registró todavía</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usersList.map((usr, index) => (
                  <div key={usr.id || index} className={`${theme.card} p-6 rounded-[1.5rem] shadow-sm border flex flex-col gap-4 hover:border-[#fcdb00]/50 transition-all`}>
                    <div className="flex items-center gap-4">
                      {usr.photoURL ? (
                        <img src={usr.photoURL} alt="Perfil" className="w-14 h-14 rounded-full shadow-md object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#111111] text-[#fcdb00] flex items-center justify-center text-2xl font-bebas shadow-md uppercase pt-1">{usr.name ? usr.name.charAt(0) : 'U'}</div>
                      )}
                      <div className="overflow-hidden">
                        <h4 className="font-bebas tracking-wide text-2xl uppercase leading-none mb-1 truncate">{usr.name || 'Sin Nombre'}</h4>
                        <p className="text-gray-500 font-bold text-[10px] truncate"><i className="fas fa-envelope mr-1.5 text-[#fcdb00]"></i> {usr.email}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 border-t pt-4 dark:border-[#333333]">
                      
                      <span className="text-[9px] font-bold uppercase text-gray-400">{usr.createdAt?.seconds ? new Date(usr.createdAt.seconds * 1000).toLocaleDateString('es-AR') : 'Reciente'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- NUEVA PESTAÑA: OFERTAS (UPSELLS) MULTIPLES --- */}
        {activeTab === 'ofertas' && (
          <div className="animate-in fade-in duration-500 max-w-lg mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Ofertas Finales (Upsell)</h2>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Productos recomendados antes del pago</p>
              </div>
            </div>
            
            <form onSubmit={handleAddUpsell} className={`${theme.card} p-8 rounded-[2rem] shadow-sm border mb-8 flex flex-col gap-6`}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Producto a Ofrecer</label>
                <select value={newUpsell.productId} onChange={e => setNewUpsell({...newUpsell, productId: e.target.value})} className={`w-full p-4 rounded-xl font-bold text-xs outline-none uppercase appearance-none focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} required>
                  <option value="">Seleccioná un producto...</option>
                  {products.filter(p => !p.isDeleted).map(p => (<option key={p.id} value={p.id}>{p.category} - {p.name} (Lista: ${p.price})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Precio Especial de Oferta</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bebas text-xl text-gray-400">$</span>
                  <input type="number" step="0.01" required min="0" value={newUpsell.price} onChange={e => setNewUpsell({...newUpsell, price: e.target.value})} placeholder="Ej: 10999" className={`w-full p-4 pl-10 rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`}/>
                </div>
              </div>
              <button type="submit" className="bg-[#fcdb00] text-[#111111] font-bebas text-2xl uppercase py-4 rounded-xl mt-2 hover:bg-[#111111] hover:text-[#fcdb00] shadow-md transition-all">Agregar Oferta</button>
            </form>

            <div className="grid gap-4">
              {upsellsList.length === 0 ? (
                <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-10">No hay ofertas activas</p>
              ) : (
                upsellsList.map(upsell => {
                  const prod = products.find(p => p.id == upsell.productId);
                  return (
                    <div key={upsell.id} className={`${theme.card} p-6 rounded-[1.5rem] flex justify-between items-center shadow-sm border`}>
                      <div>
                        <h4 className="font-bebas text-xl uppercase tracking-wide mb-1">{prod?.name || 'Producto Eliminado'}</h4>
                        <p className="text-red-500 text-[11px] font-bold tracking-widest uppercase">Oferta: ${upsell.price.toLocaleString('es-AR')}</p>
                      </div>
                      <button onClick={() => handleDeleteUpsell(upsell.id)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"><i className="fas fa-trash text-lg"></i></button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}


        {activeTab === 'crear' && (<div className="animate-in fade-in duration-500 max-w-lg mx-auto"><h2 className="text-4xl font-bebas uppercase tracking-wide mb-6 text-center">Nuevo Producto</h2><form onSubmit={handleAddProduct} className={`${theme.card} p-8 rounded-[2rem] shadow-sm border flex flex-col gap-5`}><div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Nombre del Producto</label><input type="text" required placeholder="Ej: BLUE RAZZ ICE" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} /></div><div className="flex gap-4"><div className="flex-1"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Precio</label><input type="number" required placeholder="26000" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} /></div><div className="flex-1"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Categoría / Marca</label><input list="category-suggestions" placeholder="Ej: Ignite v400 o Crear Nueva..." value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all uppercase ${theme.input}`} /><datalist id="category-suggestions">{uniqueCategories.map(cat => <option key={cat} value={cat} />)}</datalist></div></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Departamento Principal</label><input list="dept-suggestions" placeholder="Elegí o escribí uno nuevo..." value={newProduct.department} onChange={e => setNewProduct({...newProduct, department: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[12px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all uppercase ${theme.input}`} /><datalist id="dept-suggestions">{availableDepartments.map(d => <option key={d} value={d} />)}</datalist></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Link de Imagen (URL)</label><input type="url" required placeholder="https://i.postimg.cc/..." value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-[11px] border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} />{newProduct.image && (<div className="mt-4 relative h-32 rounded-xl overflow-hidden border border-dashed border-gray-300 bg-[#f2f2f2]"><img src={newProduct.image} alt="Vista previa" className="w-full h-full object-contain mix-blend-multiply" /></div>)}</div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Etiqueta y Tamaño</label><div className="flex gap-4"><input type="text" placeholder="Ej: Destacado" value={newProduct.tag} onChange={e => setNewProduct({...newProduct, tag: e.target.value})} className={`flex-1 p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all ${theme.input}`} /><select value={newProduct.cardSize} onChange={e => setNewProduct({...newProduct, cardSize: e.target.value})} className={`flex-1 p-4 rounded-xl outline-none font-bold text-xs uppercase cursor-pointer border-transparent focus:ring-2 focus:ring-[#fcdb00] ${theme.input}`}><option value="normal">📏 Tamaño Normal</option><option value="medium">🔲 Tamaño Mediano</option><option value="large">⬜ Tamaño Grande</option></select></div></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción (Biografía)</label><textarea rows="2" placeholder="Escribe aquí..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border-transparent focus:ring-2 focus:ring-[#fcdb00] transition-all resize-none ${theme.input}`}></textarea></div><button type="submit" disabled={isAdding} className="bg-[#fcdb00] text-[#111111] font-bebas text-xl uppercase py-4 rounded-xl mt-2 hover:bg-[#111111] hover:text-[#fcdb00] shadow-md transition-all disabled:opacity-50">{isAdding ? 'Guardando...' : 'Guardar Producto'}</button></form></div>)}

        {activeTab === 'clientes' && (<div className="animate-in fade-in duration-500"><div className="flex justify-between items-end mb-8"><div><h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Tu Base</h2><p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Directorio CRM</p></div><span className="bg-[#fcdb00] text-[#111111] text-[11px] font-bold px-4 py-2 rounded-lg shadow-sm">{clientsList.length} Registros</span></div>{clientsList.length === 0 ? (<div className={`${theme.card} p-24 rounded-[3rem] border-2 border-dashed text-center flex flex-col items-center`}><i className="fas fa-users text-gray-300 text-5xl mb-6"></i><p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Aún no hay clientes registrados</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{clientsList.map((client, index) => (<div key={index} className={`${theme.card} p-6 rounded-[1.5rem] shadow-sm border flex flex-col gap-4 hover:border-[#fcdb00]/50 transition-all`}><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-[#111111] text-[#fcdb00] flex items-center justify-center text-2xl font-bebas shadow-md uppercase pt-1">{client.name.charAt(0)}</div><div><h4 className="font-bebas tracking-wide text-2xl uppercase leading-none mb-1">{client.name}</h4><p className="text-gray-500 font-bold text-xs"><i className="fas fa-phone text-[10px] mr-1.5 text-[#fcdb00]"></i> {client.phone}</p></div></div><div className="flex justify-between items-center mt-2 border-t pt-4 dark:border-[#333333]"><span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{client.orderCount} Pedido{client.orderCount > 1 ? 's' : ''}</span><a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white text-[11px] font-bold px-5 py-2.5 rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-[#1ebe5d] transition-all shadow-md"><i className="fab fa-whatsapp text-sm"></i> Escribir</a></div></div>))}</div>)}</div>)}

        {/* --- PESTAÑA HISTORIAL --- */}
        {activeTab === 'historial' && (<div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-[#333333] pb-6">
            <div>
              <h2 className={`text-4xl font-bebas uppercase tracking-wide leading-none ${theme.text}`}>Historial</h2>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">Todas las ventas registradas</p>
            </div>
            <span className="bg-[#111111] text-[#fcdb00] text-[11px] font-bold px-4 py-2 rounded-lg shadow-sm tracking-widest">{orders.length} PEDIDOS</span>
          </div>
          
          {orders.length === 0 ? (<div className={`${theme.card} p-24 rounded-[3rem] border-2 border-dashed text-center flex flex-col items-center`}><i className="fas fa-receipt text-gray-300 text-5xl mb-6"></i><p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">No hay pedidos en el historial</p></div>) : (<div className="grid gap-6">{orders.map((order) => (<div key={order.id} className={`${theme.card} rounded-[2rem] shadow-sm border p-6 md:p-8 hover:shadow-lg transition-all duration-300 ${theme.cardHover}`}><div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="bg-[#fcdb00] text-[#111111] w-14 h-14 rounded-2xl flex items-center justify-center font-bebas text-3xl shadow-sm pt-1">{order.items?.reduce((a, b) => a + b.qty, 0)}</div><div><span className="text-[10px] font-bold text-[#b8952a] uppercase tracking-widest block mb-0.5">ID: {order.id.slice(-6).toUpperCase()}</span><p className="text-gray-500 text-[11px] font-bold">{order.createdAt ? order.createdAt.toDate().toLocaleString('es-AR') : 'Procesando...'}</p></div></div><div className="flex gap-2"><button onClick={() => deleteOrder(order.id)} className={`${darkMode ? 'bg-[#333] text-white hover:bg-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'} w-12 h-12 rounded-xl transition-all flex items-center justify-center shadow-sm`}><i className="fas fa-trash text-lg"></i></button></div></div>{order.clientName && (<div className={`mb-5 pb-5 border-b ${darkMode ? 'border-[#333333]' : 'border-gray-200'} flex items-center gap-4`}><div className="w-10 h-10 bg-[#f2f2f2] rounded-full flex items-center justify-center text-gray-400"><i className="fas fa-user text-lg"></i></div><div><p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest leading-none mb-1">Cliente</p><p className="font-bebas text-xl tracking-wide uppercase text-[#111111] dark:text-white">{order.clientName} <span className="font-poppins font-normal text-sm text-gray-400 ml-2">({order.clientPhone})</span></p></div></div>)}<div className={`space-y-3 mb-6 p-5 rounded-2xl border ${darkMode ? 'bg-[#222] border-[#333333]' : 'bg-[#f2f2f2] border-transparent'}`}>{order.items?.map((item, idx) => (<div key={idx} className="flex justify-between items-center"><span className={`font-bold text-xs uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-[#111111]'}`}><span className={`${darkMode ? 'text-[#fcdb00]' : 'text-[#b8952a]'} font-black mr-2 bg-white dark:bg-[#111] px-2 py-0.5 rounded`}>{item.qty}x</span> {item.name}</span><span className="text-gray-500 font-bold text-sm">${item.price?.toLocaleString('es-AR')}</span></div>))}</div>{order.delivery === 'envio' && order.address && (<div className="mb-6 p-5 bg-[#111111] text-white rounded-2xl border-l-8 border-[#fcdb00] shadow-md"><p className="text-[#fcdb00] text-[9px] font-bold uppercase mb-2 tracking-widest"><i className="fas fa-truck mr-1.5"></i> Envío a Domicilio {order.shippingOption === 'flash' ? '🚀 (FLASH)' : order.shippingOption === 'moto' ? '🛵 (MOTO)' : ''}</p><p className="uppercase font-bold text-sm mb-1">{order.address}</p><p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{order.zone}</p></div>)}</div>))}</div>)}
        </div>)}
      </main>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}