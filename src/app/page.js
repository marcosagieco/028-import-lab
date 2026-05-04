"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import CalculadorEnvio from '@/components/CalculadorEnvio';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, doc, setDoc, getDoc, increment, query, orderBy, limit } from "firebase/firestore";

const CONFIG = {
  brandName: "028", 
  whatsappNumber: "5491153412358", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", 
  bannerImage: "https://i.ibb.co/2Yg9wM6x/image.png", 
  currencySymbol: "$",
  shippingText: "Pedime te llega en 30'⏰",
  paymentAlias: "028import.bell", // <-- ACORDATE DE PONER TU ALIAS REAL ACÁ
  paymentName: "Lucio Bunge", // <-- NOMBRE DEL TITULAR
};

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

const DEPT_ICONS = [
  { id: 'fa-box', prefix: 'fas' }, { id: 'fa-wind', prefix: 'fas' }, { id: 'fa-leaf', prefix: 'fas' }, { id: 'fa-microchip', prefix: 'fas' }, { id: 'fa-star', prefix: 'fas' }, { id: 'fa-fire', prefix: 'fas' }, { id: 'fa-apple', prefix: 'fab' }, { id: 'fa-mobile-alt', prefix: 'fas' }, { id: 'fa-laptop', prefix: 'fas' }, { id: 'fa-gamepad', prefix: 'fas' }, { id: 'fa-headphones', prefix: 'fas' }, { id: 'fa-gem', prefix: 'fas' }, { id: 'fa-tag', prefix: 'fas' }, { id: 'fa-cannabis', prefix: 'fas' }, { id: 'fa-smoking', prefix: 'fas' },
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

const PAGE_CONTENT = {
  terminos: { title: "Términos y Condiciones", subtitle: "Políticas Legales", body: (<div className="space-y-6 leading-relaxed text-sm md:text-base font-poppins"><p><strong>1. Naturaleza del Servicio:</strong> 028 IMPORT opera como intermediario e importador directo de productos tecnológicos y artículos de vapeo de primera línea.</p><p><strong>2. Precios y Disponibilidad:</strong> Los valores publicados y el stock se encuentran sujetos a modificaciones sin previo aviso, derivado de la dinámica propia de la importación y las fluctuaciones cambiarias del mercado.</p><p><strong>3. Proceso y Confirmación de Compra:</strong> La selección de artículos a través de esta plataforma web representa una solicitud o intención de reserva. La transacción únicamente se considerará perfeccionada y confirmada tras la comunicación directa con nuestro equipo comercial vía WhatsApp y la posterior acreditación del pago.</p><p><strong>4. Garantías y Responsabilidad:</strong> Garantizamos la originalidad y autenticidad del 100% de nuestro catálogo. Se contempla garantía exclusiva por defectos de fabricación de origen. 028 IMPORT no asume responsabilidad alguna por daños derivados del mal uso, manipulación incorrecta o desgaste natural de los dispositivos adquiridos.</p></div>) },
  privacidad: { title: "Política de Privacidad", subtitle: "Protección de Datos", body: (<div className="space-y-6 leading-relaxed text-sm md:text-base font-poppins"><p>En 028 IMPORT, la salvaguarda y confidencialidad de su información personal es una absoluta prioridad. Los datos recopilados durante el proceso de reserva son utilizados estrictamente para fines logísticos y de facturación.</p></div>) },
  pagos: { title: "Medios de Pago", subtitle: "Transacciones Seguras", body: (<div className="space-y-6 leading-relaxed text-sm md:text-base font-poppins"><p>En <strong>028 IMPORT</strong> priorizamos la seguridad, agilidad y transparencia en cada operación financiera. Con el objetivo de proteger su integridad crediticia, todas las transacciones de pago se procesan de manera externa a nuestro sitio web.</p><div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-4"><h3 className="font-bebas text-2xl uppercase tracking-wide mb-4 text-[#111111]">Opciones Habilitadas:</h3><ul className="space-y-4"><li><strong><i className="fas fa-university text-[#b8952a] mr-2"></i> Transferencia Bancaria (ARS/USD):</strong> Acreditación inmediata. Las coordenadas bancarias (CBU/Alias) se suministrarán exclusivamente vía WhatsApp al validar su pedido.</li><li><strong><i className="fas fa-money-bill-wave text-[#b8952a] mr-2"></i> Efectivo Contra Entrega:</strong> Modalidad disponible únicamente para logística vía Motomensajería dentro de CABA y GBA, o retiros de forma presencial en nuestro showroom.</li><li><strong><i className="fab fa-bitcoin text-[#b8952a] mr-2"></i> Criptomonedas (USDT):</strong> Operamos a través de la red TRC-20 u otras a convenir. Consulte la cotización del momento con su asesor comercial.</li></ul></div><p className="mt-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm"><strong>⚠️ Importante:</strong> Bajo ninguna circunstancia el personal de 028 IMPORT le solicitará los dígitos de su tarjeta de crédito, claves de seguridad o contraseñas bancarias a través de esta plataforma ni por canales no oficiales.</p></div>) },
  arrepentimiento: { title: "Botón de Arrepentimiento", subtitle: "Devoluciones", body: (<div className="space-y-6 leading-relaxed text-sm md:text-base font-poppins"><p>Usted tiene el derecho irrevocable de cancelar su compra dentro de un plazo máximo de 10 días corridos.</p></div>) }
};

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [promos, setPromos] = useState([]);
  const [homeSections, setHomeSections] = useState([]); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home'); 
  const [activeFilter, setActiveFilter] = useState({ dept: 'all', cat: 'all' });
  const [expandedDept, setExpandedDept] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [shippingType, setShippingType] = useState('flash'); 
  const [paymentMethod, setPaymentMethod] = useState('transferencia'); 
  const [shippingCost, setShippingCost] = useState(0); 
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [aptDetails, setAptDetails] = useState(''); 
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('13:00');

  const [deptIcons, setDeptIcons] = useState({});
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); 
  const [fomoData, setFomoData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [upsellsList, setUpsellsList] = useState([]);

  const next7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
      const formatted = dateString.charAt(0).toUpperCase() + dateString.slice(1);
      days.push({
         value: date.toISOString().split('T')[0],
         label: i === 0 ? `Hoy (${formatted})` : i === 1 ? `Mañana (${formatted})` : formatted
      });
    }
    return days;
  }, []);

  useEffect(() => {
    if (next7Days.length > 0 && !deliveryDate) {
        setDeliveryDate(next7Days[0].value);
    }
  }, [next7Days, deliveryDate]);

  const departments = useMemo(() => [...new Set(products.map(p => p.department).filter(Boolean))], [products]);
  const uniqueCategories = useMemo(() => {
    if (activeFilter.dept !== 'all') return [...new Set(products.filter(p => p.department === activeFilter.dept).map(p => p.category))];
    return [...new Set(products.map(p => p.category))];
  }, [products, activeFilter.dept]);

  const slugify = (text) => text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');            

  const firebaseRefs = useMemo(() => {
    if (typeof window === "undefined") return { auth: null, db: null };
    try {
      const firebaseConfig = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      return { auth: getAuth(app), db: getFirestore(app) };
    } catch (error) { return { auth: null, db: null }; }
  }, []);

  useEffect(() => {
    const showTimer = setTimeout(() => setShowTooltip(true), 2500);
    const hideTimer = setTimeout(() => setShowTooltip(false), 9000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" } 
    );
    const timeoutId = setTimeout(() => {
        const elements = document.querySelectorAll('.reveal-on-scroll');
        elements.forEach((el) => observer.observe(el));
    }, 100);
    return () => { clearTimeout(timeoutId); observer.disconnect(); }
  }, [currentView, activeFilter, products, searchTerm, homeSections]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!firebaseRefs.db) return;
    const qFomo = query(collection(firebaseRefs.db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribeFomo = onSnapshot(qFomo, (snap) => {
        if (isFirstLoad.current) { isFirstLoad.current = false; return; }
        snap.docChanges().forEach((change) => {
            if (change.type === "added") {
                const o = change.doc.data();
                if (o.clientName && o.items?.length > 0) {
                    const firstName = o.clientName.split(' ')[0]; 
                    setFomoData({ name: firstName, product: o.items[0].name });
                    setTimeout(() => setFomoData(null), 6000);
                }
            }
        });
    });
    return () => unsubscribeFomo();
  }, [firebaseRefs.db]);

  useEffect(() => {
    const handleFocus = () => setIsSending(false);
    window.addEventListener('focus', handleFocus); window.addEventListener('pageshow', handleFocus);
    if (firebaseRefs.auth && firebaseRefs.db) {
      const unsubscribeAuth = onAuthStateChanged(firebaseRefs.auth, (u) => {
        setUser(u);
        if (!u) { signInAnonymously(firebaseRefs.auth).catch(console.error); }
      });
      const unsubscribeStock = onSnapshot(collection(firebaseRefs.db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const dbProducts = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() }));
          setProducts(prev => {
             const combined = [...initialProducts];
             dbProducts.forEach(dbItem => {
                const index = combined.findIndex(p => p.id == dbItem.id);
                if (dbItem.isHidden || dbItem.isDeleted) { if (index > -1) combined.splice(index, 1); }
                else { if (index > -1) combined[index] = { ...combined[index], ...dbItem }; else combined.push(dbItem); }
             });
             return combined.sort((a, b) => (a.order || 99) - (b.order || 99));
          });
        }
      });
      const unsubscribePromos = onSnapshot(collection(firebaseRefs.db, 'promos'), (s) => setPromos(!s.empty ? s.docs.map(d => ({ id: d.id, ...d.data() })) : []));
      const unsubscribeHomeSections = onSnapshot(collection(firebaseRefs.db, 'home_sections'), (s) => setHomeSections(!s.empty ? s.docs.map(d => ({ dbId: d.id, ...d.data() })).sort((a, b) => a.order - b.order) : []));
      const unsubscribeDeptIcons = onSnapshot(doc(firebaseRefs.db, 'settings', 'departments'), (snap) => {
        if (snap.exists()) { setDeptIcons(snap.data().icons || {}); }
      });
      const unsubscribeUpsells = onSnapshot(collection(firebaseRefs.db, 'upsells'), (snap) => {
        setUpsellsList(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []);
      });

      return () => { unsubscribeAuth(); unsubscribeStock(); unsubscribePromos(); unsubscribeHomeSections(); unsubscribeDeptIcons(); unsubscribeUpsells(); window.removeEventListener('focus', handleFocus); window.removeEventListener('pageshow', handleFocus); };
    }
  }, [firebaseRefs]);

  useEffect(() => {
      if (!user || user.isAnonymous || !firebaseRefs.db) return;
      const unsubscribe = onSnapshot(doc(firebaseRefs.db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              setDbUser(data);
              if(data.name) setClientName(data.name);
          }
      });
      return () => unsubscribe();
  }, [user, firebaseRefs.db]);

  const handleGoogleLogin = async () => {
      if (!firebaseRefs.auth || !firebaseRefs.db) return;
      try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(firebaseRefs.auth, provider);
          const u = result.user;
          const userRef = doc(firebaseRefs.db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
              await setDoc(userRef, { name: u.displayName, email: u.email, photoURL: u.photoURL, createdAt: serverTimestamp() });
          }
          showToast("¡Sesión iniciada con éxito! 🎉");
      } catch (error) { console.error(error); showToast("Error al iniciar con Google"); }
  };

  const showToast = (message) => { setToastMessage(message); setTimeout(() => { setToastMessage(null); }, 3000); };
  const navigateTo = (view, dept = null) => { setCurrentView(view); if(dept) setActiveFilter({dept, cat: 'all'}); setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  const formatPrice = (n) => n ? n.toLocaleString('es-AR') : '0';
  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);
  const getUnitPromoPrice = (item) => { const promo = promos.find(p => p.category === item.category); if (promo) { const catCount = cart.filter(i => i.category === item.category).reduce((acc, curr) => acc + curr.qty, 0); if (catCount >= promo.minQty) return promo.totalPrice / promo.minQty; } return item.price; };
  
  const calculateTotal = (cartData = cart) => {
      let subtotal = cartData.reduce((acc, item) => acc + (item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item))), 0);
      let envio = (deliveryMethod === 'envio' && shippingType === 'moto') ? shippingCost : 0;
      return subtotal + envio;
  };

  const addToCart = async (product, e) => { 
    if(e) e.stopPropagation(); 
    if (product.inStock === false) return; 

    setCart(prev => { 
        const existing = prev.find(item => item.id === product.id); 
        if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item); 
        return [...prev, { ...product, qty: 1 }]; 
    }); 
    showToast(`✅ Añadido: ${product.name}`); 
    if(selectedProduct) setSelectedProduct(null); 

    if (firebaseRefs.db) {
      try { 
          setDoc(doc(firebaseRefs.db, 'products', `prod_${product.id}`), { clicks: increment(1) }, { merge: true }).catch(e => console.error(e)); 
      } catch (err) { console.error(err); }
    }
  };
  
  const changeQty = (id, delta) => { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)); };

  const handleAddUpsellToCart = (upsell) => {
      const prod = products.find(p => p.id == upsell.productId);
      if (!prod) return;
      setCart(prev => {
          const existing = prev.find(item => item.id === prod.id);
          if (existing) return prev.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1, isUpsell: true, upsellPrice: Number(upsell.price) } : item);
          return [...prev, { ...prod, qty: 1, isUpsell: true, upsellPrice: Number(upsell.price) }];
      });
      showToast(`✅ Oferta agregada: ${prod.name}`);
  };

  const handleCheckout = () => {
    if (!clientName.trim() || !clientPhone.trim()) { showToast("⚠️ Completá tu Nombre y Teléfono."); return; }
    
    if (deliveryMethod === 'envio') {
        if (!address.trim() || !zone.trim()) { showToast("⚠️ Completá dirección y localidad."); return; }
        
        if (shippingType === 'moto' && paymentMethod === 'transferencia') {
            setShowPaymentModal(true);
            return;
        }
    }
    
    executeOrder();
  };

  const executeOrder = async () => {
    setShowPaymentModal(false);
    setIsSending(true);
    let currentCart = [...cart];
    const finalTotal = calculateTotal(currentCart);

    let msg = `Hola *${CONFIG.brandName}*, mi pedido:\n\n`;
    
    if (deliveryMethod === 'retiro') {
        msg = `Hola *${CONFIG.brandName}*, quiero hacer un pedido para *RETIRAR LOCAL*:\n\n`;
    } else if (deliveryMethod === 'envio' && shippingType === 'flash') {
        msg = `Hola *${CONFIG.brandName}*, quiero hacer un pedido con *ENVÍO FLASH*. ¿Me pasás los datos para transferir?\n\n`;
    } else if (deliveryMethod === 'envio' && shippingType === 'moto') {
        if (paymentMethod === 'transferencia') {
            msg = `Hola *${CONFIG.brandName}*, acabo de transferir por mi pedido:\n\n`;
        } else {
            msg = `Hola *${CONFIG.brandName}*, quiero hacer un pedido y *pago en efectivo* al recibir:\n\n`;
        }
    }
    
    msg += `*Resumen de Productos:*\n`;
    let subtotalCalc = 0;
    currentCart.forEach(i => { 
        const price = i.isUpsell ? i.upsellPrice : getUnitPromoPrice(i);
        subtotalCalc += (i.qty * price);
        if (i.isUpsell) { msg += `- ${i.qty}x ${i.name} (OFERTA: $${formatPrice(price)})\n`; } 
        else { msg += `- ${i.qty}x ${i.name} ($${formatPrice(price)} c/u)\n`; }
    });
    
    let subtotalFinal = subtotalCalc;

    msg += `\n*Subtotal:* ${CONFIG.currencySymbol}${formatPrice(subtotalFinal)}`;
    
    let costoEnvioAgregado = (deliveryMethod === 'envio' && shippingType === 'moto') ? shippingCost : 0;
    if (costoEnvioAgregado > 0) {
        msg += `\n*Costo de Envío (Moto):* ${CONFIG.currencySymbol}${formatPrice(costoEnvioAgregado)}`;
    }
    
    msg += `\n*TOTAL A PAGAR: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    
    if (deliveryMethod === 'retiro') {
        msg += `\n*LOGÍSTICA:* 🏪 Retiro (Miñones & Juramento)\n`;
    } else {
        msg += `\n*ENTREGA:* ${address}, ${zone}\n`;
        if (aptDetails.trim()) msg += `*DEPTO/PISO:* ${aptDetails.trim()}\n`; 
        
        if (shippingType === 'flash') {
            msg += `*LOGÍSTICA:* 🚀 Flash (30 mins)\n`;
        } else {
            msg += `*LOGÍSTICA:* 🛵 Motomensajería\n`;
            
            const selectedLabel = next7Days.find(d => d.value === deliveryDate)?.label || deliveryDate;
            msg += `📅 *Día:* ${selectedLabel}\n`;
            msg += `⏰ *Turno:* ${deliveryTime} hs\n`;

            if (paymentMethod === 'transferencia') {
                msg += `🏦 *Transferido al Alias:* ${CONFIG.paymentAlias}\n`;
                msg += `\nAdjunto mi comprobante de pago a continuación 👇`;
            } else {
                msg += `💵 *Método de pago:* Efectivo contra entrega\n`;
            }
        }
    }
    
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    try { 
        if (firebaseRefs.db) { 
            addDoc(collection(firebaseRefs.db, 'orders'), { 
                userId: user?.uid || "anon", clientName, clientPhone, 
                items: currentCart.map(i => ({ name: i.name, qty: i.qty, price: i.isUpsell ? i.upsellPrice : getUnitPromoPrice(i) })), 
                total: finalTotal, delivery: deliveryMethod, 
                address: deliveryMethod === 'envio' ? address : '', 
                zone: deliveryMethod === 'envio' ? zone : '', 
                aptDetails: deliveryMethod === 'envio' ? aptDetails.trim() : '', 
                shippingOption: deliveryMethod === 'envio' ? shippingType : null,
                paymentMethod: deliveryMethod === 'envio' && shippingType === 'moto' ? paymentMethod : null,
                deliveryDate: deliveryMethod === 'envio' && shippingType === 'moto' ? deliveryDate : null,
                deliveryTime: deliveryMethod === 'envio' && shippingType === 'moto' ? deliveryTime : null,
                shippingCost: costoEnvioAgregado,
                couponUsed: null,
                status: (deliveryMethod === 'envio' && shippingType === 'moto' && paymentMethod === 'transferencia') ? 'pending_verification' : 'pending', 
                createdAt: serverTimestamp() 
            }).catch(e => console.error(e)); 
        } 
        setTimeout(() => { window.location.href = whatsappUrl; setIsSending(false); }, 400); 
    } catch (e) { window.location.href = whatsappUrl; setIsSending(false); }
  };

  const copyAliasToClipboard = () => {
    navigator.clipboard.writeText(CONFIG.paymentAlias);
    showToast("✅ ALIAS copiado al portapapeles");
  };

  const renderProductCard = (p, index, isVidriera = false, layout = 'horizontal') => {
    const inCart = cart.find(i => i.id === p.id);
    const isOutOfStock = p.inStock === false;
    const effectiveSize = isVidriera ? (p.cardSize || 'normal') : 'normal';

    let cardStyle = {}; let sizeClasses = ''; let aspectClass = 'aspect-[4/5]'; let titleClass = 'text-[13px] md:text-[16px] leading-tight'; let priceClass = 'text-xl md:text-2xl';

    if (layout === 'vertical') {
        if (effectiveSize === 'normal') { sizeClasses = 'flex-grow max-w-full'; cardStyle = { flexBasis: '38%' }; } 
        else if (effectiveSize === 'medium') { sizeClasses = 'flex-grow max-w-full'; cardStyle = { flexBasis: '58%' }; titleClass = 'text-[15px] md:text-lg leading-tight'; priceClass = 'text-2xl md:text-3xl'; } 
        else if (effectiveSize === 'large') { sizeClasses = 'w-full'; cardStyle = { flexBasis: '100%' }; aspectClass = 'aspect-[16/9] md:aspect-[21/9]'; titleClass = 'text-xl md:text-3xl leading-tight'; priceClass = 'text-3xl md:text-4xl'; }
    } else {
        if (effectiveSize === 'normal') { sizeClasses = 'w-[160px] md:w-[200px] flex-shrink-0'; } 
        else if (effectiveSize === 'medium') { sizeClasses = 'w-[230px] md:w-[280px] flex-shrink-0'; titleClass = 'text-[15px] md:text-lg leading-tight'; priceClass = 'text-2xl md:text-3xl'; } 
        else if (effectiveSize === 'large') { sizeClasses = 'w-[320px] md:w-[480px] flex-shrink-0'; aspectClass = 'aspect-[16/9]'; titleClass = 'text-xl md:text-3xl leading-tight'; priceClass = 'text-3xl md:text-4xl'; }
    }

    return (
      <div key={p.id} style={{ transitionDelay: `${(index % 4) * 75}ms`, ...cardStyle }} className={`reveal-on-scroll bg-white border border-[#f2f2f2] shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[1.5rem] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] snap-start group ${isOutOfStock ? 'opacity-70 grayscale' : ''} ${sizeClasses}`}>
        <div className={`relative ${aspectClass} overflow-hidden bg-[#f2f2f2]/50 cursor-pointer rounded-t-[1.5rem]`} onClick={() => setSelectedProduct(p)}>
          <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out" />
          {isOutOfStock ? ( <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center"><span className="bg-red-600 text-white font-bebas text-sm px-4 py-1.5 rounded-sm uppercase tracking-wider shadow-lg">SIN STOCK</span></div> ) : p.tag && ( <span className="absolute top-3 left-3 bg-[#111111] text-[#fcdb00] font-bebas text-[11px] px-3 py-1 uppercase rounded-sm shadow-md tracking-wider">{p.tag}</span> )}
        </div>
        <div className="p-4 flex-grow flex flex-col"><p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-poppins">{p.category}</p><h3 className={`font-bebas ${titleClass} uppercase mb-1 text-[#111111] line-clamp-2 tracking-wide`}>{p.name}</h3>
          <div className="mt-auto pt-3"><p className={`text-[#fcdb00] font-bebas ${priceClass} mb-4 tracking-wide drop-shadow-sm`}>{CONFIG.currencySymbol}{formatPrice(p.price)}</p>
            {isOutOfStock ? ( <button disabled className="w-full bg-[#f2f2f2] text-gray-400 py-3 font-bebas text-[14px] uppercase tracking-wider rounded-xl cursor-not-allowed">Agotado</button> ) : inCart ? (
              <div className="flex items-center justify-between bg-[#fcdb00] text-[#111111] h-11 rounded-xl font-bold px-1.5 shadow-md"><button className="w-12 h-full flex items-center justify-center hover:text-black transition-colors" onClick={() => changeQty(p.id, -1)}><i className="fas fa-minus text-xs"></i></button><span className="font-bebas text-lg pt-1">{inCart.qty}</span><button className="w-12 h-full flex items-center justify-center hover:text-black transition-colors" onClick={() => addToCart(p)}><i className="fas fa-plus text-xs"></i></button></div>
            ) : ( <button onClick={(e) => addToCart(p, e)} className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-3 font-bebas text-[16px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-shopping-bag text-xs mb-0.5"></i> comprar ahora</button> )}
          </div>
        </div>
      </div>
    );
  }

  const renderProductSection = (category) => {
    let sectionProducts = products.filter(p => p.category === category);
    if (activeFilter.dept !== 'all') sectionProducts = sectionProducts.filter(p => p.department === activeFilter.dept);
    if (searchTerm) sectionProducts = sectionProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sectionProducts.length === 0) return null;
    const promo = promos.find(p => p.category === category); let promoText = null;
    if (promo) promoText = `${promo.minQty}+ un: $${formatPrice(promo.totalPrice / promo.minQty)} c/u`;
    return (
      <section key={category} id={slugify(category)} className="mb-20 scroll-mt-40 reveal-on-scroll">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-3 border-b-2 border-[#f2f2f2] pb-4"><h2 className="text-3xl md:text-5xl font-bebas text-[#111111] tracking-wide uppercase relative">{category} <span className="absolute -bottom-[18px] left-0 w-16 h-1 bg-[#fcdb00] rounded-full"></span></h2>{promoText && <div className="bg-[#fcdb00]/20 text-[#111111] px-4 py-2 font-bebas text-lg rounded-full uppercase tracking-wider flex items-center gap-2"><i className="fas fa-tag text-[#fcdb00] mb-0.5"></i> {promoText}</div>}</div>
        <div className="flex flex-wrap gap-3 md:gap-5">{sectionProducts.map((p, index) => renderProductCard(p, index, false, 'vertical'))}</div>
      </section>
    );
  };

  const renderLegalPage = () => {
    const pageData = PAGE_CONTENT[currentView]; if (!pageData) return null;
    return (<div className="min-h-screen py-16 px-4 md:py-24"><div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-2xl p-8 md:p-16 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white animate-in fade-in slide-in-from-bottom-8 duration-700"><button onClick={() => navigateTo('home')} className="mb-10 text-[#111111] hover:text-[#fcdb00] transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest font-poppins"><i className="fas fa-arrow-left"></i> Volver a la Tienda</button><div className="text-center mb-16"><span className="text-[#fcdb00] font-bebas uppercase tracking-widest text-lg mb-2 block drop-shadow-sm">{pageData.subtitle}</span><h1 className="text-5xl md:text-6xl font-bebas text-[#111111] uppercase tracking-wide">{pageData.title}</h1><div className="w-24 h-1.5 bg-[#fcdb00] mx-auto mt-6 rounded-full"></div></div><div className="prose prose-gray max-w-none font-poppins">{pageData.body}</div></div></div>);
  };

  return (
    <div className="bg-[#f2f2f2] text-[#111111] font-poppins flex flex-col relative pb-20 md:pb-0 min-h-screen selection:bg-[#fcdb00] selection:text-[#111111]">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;700;900&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          will-change: opacity, transform;
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 60s linear infinite;
          will-change: transform;
        }

        /* --- SOLUCIÓN AL ZOOM MOLESTO EN CELULARES --- */
        @media screen and (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}} />
      {toastMessage && (<div className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] bg-[#111111]/90 backdrop-blur-xl text-white px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(252,219,0,0.2)] border border-[#fcdb00]/30 font-bold text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">{toastMessage}</div>)}
      
      {fomoData && (
        <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[100] bg-[#111111]/95 backdrop-blur-md text-white p-3 md:p-4 rounded-2xl shadow-2xl border border-[#fcdb00]/30 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-500 hover:scale-105 transition-transform cursor-default">
          <div className="w-10 h-10 bg-[#fcdb00] rounded-full flex items-center justify-center text-[#111111] text-lg shadow-inner"><i className="fas fa-fire"></i></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-poppins">¡Venta en Vivo!</span>
            <span className="font-bebas text-lg md:text-xl tracking-wide uppercase leading-none mt-0.5 text-[#fcdb00]"><span className="text-white">{fomoData.name}</span> compró {fomoData.product}</span>
          </div>
        </div>
      )}

      <header className="bg-[#111111] text-white h-[72px] sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 shadow-lg border-b border-white/5 transition-all duration-300">
        <button onClick={() => setIsMenuOpen(true)} className="text-2xl hover:text-[#fcdb00] transition-colors p-2"><i className="fas fa-bars"></i></button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 cursor-pointer group" onClick={() => {setActiveFilter({dept: 'all', cat: 'all'}); setCurrentView('home'); window.scrollTo(0,0);}}>
          <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {!user || user.isAnonymous ? (
            <button onClick={handleGoogleLogin} className="hidden md:flex bg-white/10 hover:bg-white hover:text-[#111111] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full items-center gap-2 transition-all border border-white/20">
                <i className="fab fa-google"></i> Iniciar Sesión
            </button>
          ) : (
            <span className="hidden md:flex text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full items-center gap-2 border border-white/10 bg-white/5 text-gray-300">
                <i className="fas fa-user text-sm text-[#fcdb00]"></i> Hola, {dbUser?.name?.split(' ')[0] || 'Cliente'}
            </span>
          )}
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:text-[#fcdb00] transition-colors"><i className="fas fa-shopping-bag text-2xl"></i>{getTotalItems() > 0 && (<span className="absolute top-1.5 -right-1 bg-[#fcdb00] text-[#111111] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-[#111111]">{getTotalItems()}</span>)}</button>
        </div>
      </header>

      {currentView === 'home' && (
        <div className="w-full bg-[#111111] py-2 overflow-hidden m-0 p-0 border-b border-white/10 relative z-30 flex">
          <div className="animate-marquee whitespace-nowrap flex items-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 px-4 text-[#fcdb00] font-poppins font-bold text-[10px] md:text-xs tracking-widest uppercase">
                <span> ENVIOS 24HS CABA/AMBA </span><span className="text-white/30">•</span>
                 <span> 028 IMPORT </span><span className="text-white/30">•</span>
                  <span> ATENCION PERSONALIZADA POR WHATSAPP </span><span className="text-white/30">•</span>
                 <span> PEDIME TE LLEGA EN 30'</span><span className="text-white/30">•</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMenuOpen && (<div className="fixed inset-0 z-[90] flex"><div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-md transition-opacity" onClick={() => setIsMenuOpen(false)}></div><div className="w-[85%] max-w-[380px] bg-[#f2f2f2] h-full relative z-10 animate-in slide-in-from-left duration-500 flex flex-col shadow-2xl rounded-r-[2rem] overflow-hidden"><div className="p-8 bg-[#111111] flex justify-between items-center text-white border-b border-white/10"><span className="font-bebas text-3xl tracking-wide uppercase">028<span className="text-[#fcdb00]">MENU</span></span><button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times text-lg"></i></button></div><div className="flex-1 overflow-y-auto pb-8"><div className="flex flex-col p-4 space-y-2">
        <div className="md:hidden mb-4">
            {!user || user.isAnonymous ? (
                <button onClick={handleGoogleLogin} className="w-full bg-[#111111] text-white p-4 rounded-2xl shadow-md font-black uppercase text-xs hover:bg-[#fcdb00] hover:text-[#111111] transition-all flex justify-center items-center gap-3"><i className="fab fa-google text-lg"></i> Iniciar sesión con Google</button>
            ) : (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center gap-3">
                    <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest text-center">Hola, {dbUser?.name?.split(' ')[0] || 'Cliente'}</p>
                </div>
            )}
        </div>
        <button onClick={() => { setActiveFilter({dept:'all', cat:'all'}); navigateTo('catalog'); }} className="text-left p-5 bg-white rounded-2xl shadow-sm border border-[#f2f2f2] font-black uppercase text-sm hover:border-[#fcdb00] hover:shadow-md flex justify-between items-center transition-all">Catálogo Completo <i className="fas fa-arrow-right text-[#fcdb00]"></i></button><div className="pt-6 pb-2 px-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest font-poppins">Departamentos</p></div>{departments.map(dept => { const isExpanded = expandedDept === dept; const deptCats = Array.from(new Set(products.filter(p => p.department === dept).map(p => p.category))); return (<div key={dept} className="bg-white rounded-2xl shadow-sm border border-[#f2f2f2] overflow-hidden transition-all"><button onClick={() => setExpandedDept(isExpanded ? null : dept)} className="w-full text-left p-5 font-black uppercase text-sm flex justify-between items-center transition-colors group">{dept} <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-300 group-hover:text-[#fcdb00] transition-colors`}></i></button><div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}><div className="bg-gray-50 flex flex-col pb-4 pt-2 border-t border-gray-100"><button onClick={() => { setActiveFilter({dept, cat: 'all'}); navigateTo('catalog'); }} className="text-left px-6 py-3 font-black text-xs text-[#111111] uppercase hover:text-[#fcdb00] transition-colors flex items-center gap-2"><i className="fas fa-layer-group text-gray-400"></i> Ver todo en {dept}</button>{deptCats.map(cat => (<button key={cat} onClick={() => { setActiveFilter({dept, cat}); navigateTo('catalog'); setTimeout(() => { const target = document.getElementById(slugify(cat)); if(target) target.scrollIntoView({behavior: 'smooth'}); }, 300); }} className="text-left px-6 py-3 font-bold text-xs text-gray-500 uppercase hover:text-[#111111] transition-colors pl-12 relative before:content-[''] before:w-1.5 before:h-1.5 before:bg-gray-300 before:rounded-full before:absolute before:left-7 before:top-1/2 before:-translate-y-1/2 hover:before:bg-[#fcdb00]">{cat}</button>))}</div></div></div>); })}<div className="pt-8 pb-2 px-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest font-poppins">Información Útil</p></div><div className="bg-white rounded-2xl shadow-sm border border-[#f2f2f2] p-2 space-y-1">
          <button onClick={() => { window.location.href = 'https://028import.com/nosotros'; }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-[#fcdb00]"><i className="fas fa-users"></i></div> Quiénes Somos</button>
          <button onClick={() => { window.location.href = 'https://028import.com/envios'; }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-[#fcdb00]"><i className="fas fa-truck"></i></div> Envíos y Logística</button>
          <button onClick={() => {setCurrentView('pagos'); setIsMenuOpen(false); window.scrollTo(0,0);}} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-[#fcdb00]"><i className="fas fa-credit-card"></i></div> Medios de Pago</button>
          <button onClick={() => {setCurrentView('terminos'); setIsMenuOpen(false); window.scrollTo(0,0);}} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-gray-400"><i className="fas fa-file-contract"></i></div> Legales y Términos</button>
        </div></div></div></div></div>)}

      {currentView === 'home' ? (
        <>
          <header className="relative w-full h-[35vh] md:h-[55vh] flex items-center justify-center bg-[#111111] overflow-hidden border-b border-[#111111]">
            <img src={CONFIG.bannerImage} alt="Banner 028" className="absolute inset-0 w-full h-full object-cover object-center" />
          </header>
          <main className="flex-grow px-4 md:px-8 pt-10 max-w-7xl mx-auto min-h-[50vh] pb-32 w-full">
            <div className="md:hidden relative mb-12 reveal-on-scroll"><i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Buscar productos, marcas..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentView('catalog');}} className="w-full bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] pl-12 pr-6 py-4 rounded-2xl text-sm font-bold outline-none focus:border-[#fcdb00] focus:bg-white transition-all placeholder:text-gray-400 font-poppins" /></div>
            <div className="mb-16 reveal-on-scroll">
              <h3 className="font-bebas text-2xl text-[#111111] mb-4 pl-2">Explorar la tienda</h3>
              <div className="flex overflow-x-auto gap-4 md:gap-6 no-scrollbar pb-6 snap-x mask-image-gradient pr-8">
                {departments.map(dept => {
                  const iconId = deptIcons[dept] || 'fa-box';
                  const iconObj = DEPT_ICONS.find(i => i.id === iconId) || { id: 'fa-box', prefix: 'fas' };
                  return (
                  <div key={dept} onClick={() => navigateTo('catalog', dept)} className="snap-start flex-shrink-0 w-32 h-32 md:w-44 md:h-44 bg-white/70 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#fcdb00] transition-all duration-500 group">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-[#f2f2f2] rounded-full flex items-center justify-center text-[#111111] text-2xl md:text-3xl group-hover:bg-[#fcdb00] transition-colors"><i className={`${iconObj.prefix} ${iconObj.id}`}></i></div>
                    <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-center px-2 text-[#111111] group-hover:text-black transition-colors font-poppins">{dept}</span>
                  </div>
                )})}
              </div>
            </div>
             {homeSections.length === 0 ? (<div className="text-center py-20"><div className="w-12 h-12 border-4 border-[#f2f2f2] border-t-[#fcdb00] rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-poppins">Preparando vidriera...</p></div>) : (
                 homeSections.map((sec, sectionIndex) => {
                     const secProducts = sec.productIds?.map(pid => products.find(p => p.id === pid)).filter(Boolean) || [];
                     if(secProducts.length === 0) return null;
                     return (<div key={sec.id} className="mb-20 reveal-on-scroll"><div className="flex justify-between items-end mb-6 pl-2 border-b-2 border-[#f2f2f2] pb-3"><h2 className="text-4xl md:text-6xl font-bebas text-[#111111] tracking-wide uppercase"><i className={`${AVAILABLE_ICONS.find(i => i.id === sec.icon)?.prefix || 'fas'} ${sec.icon || 'fa-star'} ${sec.iconColor || 'text-[#fcdb00]'} mr-3 drop-shadow-sm`}></i>{sec.title}</h2><button onClick={() => navigateTo('catalog')} className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#fcdb00] transition-colors bg-white/50 px-5 py-2.5 rounded-full border border-white hover:border-[#f2f2f2]">Ver Catálogo <i className="fas fa-arrow-right"></i></button></div>
                     <div className={sec.layout === 'vertical' ? "flex flex-wrap gap-3 md:gap-5" : "flex overflow-x-auto gap-4 md:gap-6 no-scrollbar pb-8 snap-x mask-image-gradient pr-8"}>{secProducts.map((p, index) => renderProductCard(p, index, true, sec.layout))}</div>
                     <button onClick={() => navigateTo('catalog')} className="md:hidden w-full mt-2 bg-white/70 backdrop-blur-xl border border-white shadow-sm text-[#111111] py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform font-poppins">ver todos los modelos <i className="fas fa-arrow-right text-[#fcdb00]"></i></button></div>)
                 })
             )}
          </main>
        </>
      ) : currentView === 'catalog' ? (
        <>
          <div className="bg-white/80 backdrop-blur-2xl sticky top-[72px] z-40 border-b border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-3 pb-3 transition-all duration-300"><div className="max-w-7xl mx-auto px-4 md:px-8"><div className="flex items-center gap-3 mb-3"><button onClick={() => navigateTo('home')} className="text-gray-400 hover:text-[#111111] text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"><i className="fas fa-home"></i> Inicio</button><span className="text-gray-300 text-[10px]"><i className="fas fa-chevron-right"></i></span><span className="text-[#111111] font-bold uppercase tracking-widest text-[10px]">{activeFilter.dept !== 'all' ? activeFilter.dept : 'CATÁLOGO COMPLETO'}</span></div>{uniqueCategories.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2 mask-image-gradient pr-8">
              <button onClick={() => {setActiveFilter({...activeFilter, cat: 'all'}); window.scrollTo({top: 0, behavior: 'smooth'});}} className={`whitespace-nowrap px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeFilter.cat === 'all' ? 'bg-[#111111] text-[#fcdb00] shadow-md' : 'bg-white border border-[#f2f2f2] text-gray-500 hover:bg-gray-50'}`}>Todos</button>
              {uniqueCategories.map(cat => (
                <button key={cat} onClick={() => { setActiveFilter({...activeFilter, cat: cat}); const target = document.getElementById(slugify(cat)); if(target) target.scrollIntoView({behavior: 'smooth'}); }} className={`whitespace-nowrap px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex-shrink-0 ${activeFilter.cat === cat ? 'bg-[#111111] text-[#fcdb00] shadow-md' : 'bg-white border border-[#f2f2f2] text-gray-500 hover:bg-gray-50'}`}>{cat}</button>
              ))}
            </div>
          )}</div></div>
          <main className="flex-grow px-4 md:px-8 py-10 max-w-7xl mx-auto min-h-[50vh] pb-32 w-full">{searchTerm && products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (<div className="text-center py-24 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white shadow-sm"><div className="w-20 h-20 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-6"><i className="fas fa-ghost text-3xl text-gray-400"></i></div><h3 className="text-3xl font-bebas uppercase tracking-wide text-[#111111] mb-2">No encontramos nada</h3><p className="text-xs uppercase tracking-widest text-gray-500 font-poppins">Intenta buscar otro sabor o marca.</p></div>)}{uniqueCategories.map(cat => renderProductSection(cat))}</main>
        </>
      ) : ( <main className="flex-grow">{renderLegalPage()}</main> )}

      <nav className="md:hidden fixed bottom-0 w-full bg-[#f2f2f2]/90 backdrop-blur-3xl border-t border-white shadow-[0_-20px_40px_rgba(0,0,0,0.06)] z-40 pb-safe pt-2 px-2"><div className="flex justify-around items-center h-16 max-w-md mx-auto"><button onClick={() => navigateTo('home')} className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl transition-all ${currentView==='home' ? 'text-[#111111]' : 'text-gray-400 hover:text-gray-600'}`}><i className="fas fa-home text-xl mb-0.5"></i><span className="text-[9px] font-bebas uppercase tracking-wider">Inicio</span></button><button onClick={() => navigateTo('catalog')} className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl transition-all ${currentView==='catalog' ? 'text-[#111111]' : 'text-gray-400 hover:text-gray-600'}`}><i className="fas fa-th-large text-xl mb-0.5"></i><span className="text-[9px] font-bebas uppercase tracking-wider">Catálogo</span></button><button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center justify-center gap-1 w-full h-full text-[#111111] relative active:scale-95 transition-transform"><div className="relative bg-[#111111] w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-shopping-bag text-lg text-white"></i>{getTotalItems() > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#fcdb00] text-[#111111] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-[#111111]">{getTotalItems()}</span>}</div><span className="text-[9px] font-bebas uppercase tracking-wider mt-0.5">Bolsa</span></button></div></nav>

      <footer className="hidden md:block bg-[#111111] text-white pt-20 pb-10 mt-auto relative z-30 rounded-t-[3rem] overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#fcdb00] to-transparent opacity-50"></div><div className="max-w-7xl mx-auto px-8"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 text-xs md:text-sm"><div className="space-y-6"><div className="flex items-center gap-3"><img src={CONFIG.logoImage} alt="028Import Logo" className="h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(252,219,0,0.4)]" /></div><p className="text-gray-400 font-medium leading-relaxed pr-4 font-poppins">Redefinimos la experiencia de compra priorizando tu tiempo y confianza.</p></div><div><h4 className="font-bebas text-[#fcdb00] text-2xl uppercase tracking-wider mb-6">Contacto</h4><ul className="space-y-5 text-gray-300 font-poppins"><li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#fcdb00]"><i className="fab fa-whatsapp text-lg"></i></div><span className="text-base font-bold tracking-wider">11 5341 2358</span></li><li className="flex items-start gap-4 mt-2"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#fcdb00] flex-shrink-0"><i className="fas fa-location-dot text-lg"></i></div><span className="pt-1">Miñones y Juramento,<br/>Belgrano, CABA.</span></li></ul></div><div><h4 className="font-bebas text-[#fcdb00] text-2xl uppercase tracking-wider mb-6">Información Legal</h4>
              <ul className="space-y-4 text-gray-400 font-poppins font-medium">
                <li><a href="https://028import.com/nosotros" className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Quiénes Somos</a></li>
                <li><a href="https://028import.com/envios" className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Logística de Envío</a></li>
                <li><button onClick={() => navigateTo('pagos')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Medios de Pago</button></li>
                <li><button onClick={() => navigateTo('terminos')} className="hover:text-white transition-colors flex items-center gap-2 mt-4 pt-4 border-t border-white/10"><i className="fas fa-file-contract text-gray-600 text-[10px]"></i> Términos y Condiciones</button></li>
                <li><button onClick={() => navigateTo('privacidad')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-shield-alt text-gray-600 text-[10px]"></i> Política de Privacidad</button></li>
              </ul></div><div><h4 className="font-bebas text-[#fcdb00] text-2xl uppercase tracking-wider mb-6">Nuestras Redes</h4><div className="flex gap-4"><a href="https://www.instagram.com/028.import" target="_blank" rel="noreferrer" className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(252,219,0,0.3)]"><i className="fab fa-instagram text-2xl"></i></a><a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#25D366] hover:text-white transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,211,102,0.3)]"><i className="fab fa-whatsapp text-2xl"></i></a></div></div></div><div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center md:text-left gap-4 font-poppins"><p>© {new Date().getFullYear()} 028IMPORT. Todos los derechos reservados.</p><div className="flex gap-4"><button onClick={() => navigateTo('arrepentimiento')} className="hover:text-white transition-colors underline underline-offset-4">Botón de Arrepentimiento</button></div></div></div></footer>

      {selectedProduct && (<div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-4 sm:p-6"><div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-xl transition-opacity" onClick={() => setSelectedProduct(null)}></div><div className="relative bg-[#f2f2f2] w-full max-w-4xl rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[90vh] border border-white/20"><button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-2xl border border-white text-[#111111] rounded-full flex items-center justify-center hover:bg-[#fcdb00] hover:text-[#111111] transition-colors shadow-lg"><i className="fas fa-times text-lg"></i></button><div className="w-full md:w-1/2 bg-white p-8 flex items-center justify-center relative min-h-[350px] border-r border-[#f2f2f2]">{selectedProduct.tag && <span className="absolute top-8 left-8 bg-[#111111] text-[#fcdb00] font-bebas text-sm px-4 py-1.5 uppercase tracking-wider rounded-sm shadow-lg z-10">{selectedProduct.tag}</span>}<img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full max-h-[450px] object-contain drop-shadow-2xl animate-in scale-95 duration-700 ease-out mix-blend-multiply" /></div><div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto bg-[#f2f2f2]"><p className="text-[#fcdb00] font-bebas uppercase tracking-wider text-xl mb-1 drop-shadow-sm">{selectedProduct.category}</p><h2 className="text-5xl md:text-6xl font-bebas uppercase tracking-wide text-[#111111] leading-none mb-6">{selectedProduct.name}</h2><p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed whitespace-pre-line font-poppins">{selectedProduct.description || "Experimenta la mejor calidad con nuestra selección de productos premium."}</p><div className="mt-auto border-t border-gray-300 pt-8"><p className="text-[#111111] font-bebas text-5xl md:text-6xl tracking-wide mb-8 drop-shadow-sm">{CONFIG.currencySymbol}{formatPrice(selectedProduct.price)}</p>{selectedProduct.inStock === false ? ( <button disabled className="w-full bg-gray-300 text-gray-500 py-4 text-lg font-bebas uppercase tracking-wider rounded-xl cursor-not-allowed border border-gray-400">Producto Agotado</button> ) : ( <button onClick={(e) => addToCart(selectedProduct, e)} className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-4 text-xl font-bebas uppercase tracking-wider rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(252,219,0,0.4)] transition-all duration-300 flex justify-center items-center gap-3 active:scale-95"><i className="fas fa-shopping-cart text-lg mb-0.5"></i> Agregar a la bolsa</button> )}</div></div></div></div>)}

      {isCartOpen && (<div className="fixed inset-0 z-[60] flex flex-col justify-end items-center sm:justify-center p-0 md:p-4"><div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} /><div className="relative bg-[#f2f2f2] w-full max-w-lg md:mx-auto rounded-t-[2rem] md:rounded-[2rem] h-[90vh] md:max-h-[85vh] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20 animate-in slide-in-from-bottom duration-500 flex flex-col pb-safe"><div className="p-6 border-b border-gray-300 flex justify-between items-center bg-white sticky top-0 z-10"><div><h2 className="text-4xl font-bebas uppercase tracking-wide text-[#111111] leading-none mb-1">Tu Bolsa</h2><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-poppins">{getTotalItems()} artículos seleccionados</p></div><button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-[#f2f2f2] rounded-full text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors flex items-center justify-center shadow-sm border border-gray-200"><i className="fas fa-times text-lg"></i></button></div><div className="overflow-y-auto p-4 md:p-6 flex-grow no-scrollbar"><div className="space-y-3 mb-10">{cart.length === 0 && (<div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-gray-300"><div className="w-16 h-16 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><i className="fas fa-shopping-bag text-2xl text-gray-400"></i></div><p className="text-gray-400 font-bold text-xs uppercase tracking-widest font-poppins">Tu bolsa está vacía</p></div>)}{cart.map(item => (<div key={item.id} className="flex justify-between items-center bg-[#f9f9f9] p-3 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-200"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-1"><img src={item.image} className="w-full h-full object-contain mix-blend-multiply" alt=""/></div><div className="flex flex-col"><p className="font-bebas text-lg uppercase tracking-wide max-w-[130px] md:max-w-[180px] line-clamp-1 text-[#111111]">{item.name}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 bg-white border border-gray-100 w-fit px-2 py-0.5 rounded-md font-poppins">{item.qty} un.</p></div></div><div className="flex items-center gap-4 pr-2"><p className="font-bebas text-[#fcdb00] text-2xl tracking-wide drop-shadow-sm">${formatPrice(item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item)))}</p><div className="flex flex-col items-center gap-1.5 bg-white rounded-md p-1.5 border border-gray-200 shadow-sm"><button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-[#111111] bg-gray-50 rounded-md hover:bg-[#fcdb00] transition-colors"><i className="fas fa-plus text-[10px]"></i></button><button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-[#111111] bg-gray-50 rounded-md hover:bg-[#fcdb00] transition-colors"><i className="fas fa-minus text-[10px]"></i></button></div></div></div>))}
        
        {upsellsList.length > 0 && upsellsList.some(u => u.active && !cart.find(c => c.id == u.productId)) && (
            <div className="mt-8 mb-2 animate-in slide-in-from-bottom duration-500">
                <p className="font-bebas text-xl mb-3 uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <i className="fas fa-fire text-[#fcdb00]"></i> Agregá a tu pedido
                </p>
                <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x mask-image-gradient pr-4">
                    {upsellsList.filter(u => u.active && !cart.find(c => c.id == u.productId)).map(upsell => {
                        const prod = products.find(p => p.id == upsell.productId);
                        if (!prod || prod.inStock === false || prod.isDeleted) return null;
                        return (
                            <div key={upsell.id} className="snap-start flex-shrink-0 w-[260px] bg-[#f9f9f9] p-3 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 relative transition-all hover:border-[#fcdb00]">
                                <div className="relative w-16 h-16 bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                                    <span className="absolute top-0 left-0 bg-[#111111] text-[#fcdb00] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-br-lg shadow-sm z-10 font-poppins">Oferta</span>
                                    <img src={prod.image} className="w-full h-full object-contain mix-blend-multiply" alt=""/>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="font-bebas text-sm uppercase truncate text-[#111111] leading-tight">{prod.name}</p>
                                    <p className="text-[#111111] font-bebas text-xl leading-none mt-1.5 drop-shadow-sm">${formatPrice(upsell.price)} <span className="line-through text-gray-400 text-[10px] font-poppins ml-1">${formatPrice(prod.price)}</span></p>
                                </div>
                                <button onClick={() => handleAddUpsellToCart(upsell)} className="w-10 h-10 flex-shrink-0 bg-[#111111] text-[#fcdb00] rounded-full flex items-center justify-center hover:bg-[#fcdb00] hover:text-[#111111] transition-colors shadow-md active:scale-90">
                                    <i className="fas fa-plus text-sm"></i>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        
        </div>{cart.length > 0 && (<div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"><div className="bg-white p-6 rounded-[1.5rem] border border-[#f2f2f2] shadow-[0_4px_15px_rgba(0,0,0,0.02)]"><p className="font-bebas text-xl mb-4 uppercase tracking-wider text-[#111111] flex items-center gap-2"><i className="fas fa-user-circle text-[#fcdb00] text-xl"></i> Tus Datos</p><div className="flex flex-col gap-3 font-poppins"><input type="text" placeholder="Nombre completo" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" /><input type="tel" placeholder="Número de WhatsApp" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full p-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" /></div></div><div className="bg-white p-6 rounded-[1.5rem] border border-[#f2f2f2] shadow-[0_4px_15px_rgba(0,0,0,0.02)]"><p className="font-bebas text-xl mb-4 uppercase tracking-wider text-[#111111] flex items-center gap-2"><i className="fas fa-map-marked-alt text-[#fcdb00] text-xl"></i> Entrega</p><div className="flex gap-2 mb-5 bg-[#f2f2f2] p-1.5 rounded-xl border border-gray-200 font-poppins"><button onClick={() => setDeliveryMethod('retiro')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryMethod === 'retiro' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Retiro Local</button><button onClick={() => setDeliveryMethod('envio')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryMethod === 'envio' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Envío Domicilio</button></div>
              
              {deliveryMethod === 'retiro' && (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 mt-4">
                  <div className="w-full h-[200px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative bg-[#f2f2f2] flex items-center justify-center">
                    <div className="absolute flex flex-col items-center justify-center text-gray-400 gap-2">
                      <i className="fas fa-circle-notch fa-spin text-[#fcdb00] text-2xl"></i>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Cargando mapa...</span>
                    </div>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0, position: 'relative', zIndex: 10 }}
                      src="https://maps.google.com/maps?q=Mi%C3%B1ones%202061,%20Belgrano,%20CABA&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="bg-[#fcdb00]/10 border border-[#fcdb00] p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] flex-shrink-0"><i className="fas fa-store text-lg"></i></div>
                    <div className="flex flex-col">
                      <span className="font-bebas text-lg tracking-wide leading-none mb-1 text-[#111111]">Miñones 2061</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Belgrano, CABA.<br/>Te enviaremos el depto exacto al confirmar.</span>
                    </div>
                  </div>
                </div>
              )}

              {deliveryMethod === 'envio' && (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 font-poppins">
                  <div className="flex flex-col gap-3 mb-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Elegí tu opción de envío:</label>
                    <div onClick={() => setShippingType('flash')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex gap-4 items-center ${shippingType === 'flash' ? 'border-[#fcdb00] bg-[#fcdb00]/10' : 'border-gray-200 bg-white hover:border-[#fcdb00]/50'}`}>
                      <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] shadow-md flex-shrink-0"><i className="fas fa-bolt text-lg"></i></div>
                      <div className="flex flex-col"><span className={`font-bebas text-xl tracking-wide leading-none mb-1.5 ${shippingType === 'flash' ? 'text-[#111111]' : 'text-gray-700'}`}>Envío Flash</span><span className="text-[10px] font-bold text-gray-500 leading-relaxed">⏱️ Te llega en menos de 30 minutos.<br/>💳 Abonando solo por transferencia.</span></div>
                      {shippingType === 'flash' && <div className="ml-auto text-[#fcdb00]"><i className="fas fa-check-circle text-xl"></i></div>}
                    </div>
                    <div onClick={() => setShippingType('moto')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex gap-4 items-center ${shippingType === 'moto' ? 'border-[#fcdb00] bg-[#fcdb00]/10' : 'border-gray-200 bg-white hover:border-[#fcdb00]/50'}`}>
                      <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] shadow-md flex-shrink-0"><i className="fas fa-motorcycle text-lg"></i></div>
                      <div className="flex flex-col"><span className={`font-bebas text-xl tracking-wide leading-none mb-1.5 ${shippingType === 'moto' ? 'text-[#111111]' : 'text-gray-700'}`}>Vía Motomensajería</span><span className="text-[10px] font-bold text-gray-500 leading-relaxed">⏲️ Horarios fijos de recorrido: 13:00 y 18:00hs.</span></div>
                      {shippingType === 'moto' && <div className="ml-auto text-[#fcdb00]"><i className="fas fa-check-circle text-xl"></i></div>}
                    </div>
                  </div>
                  
                  {shippingType === 'flash' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                      <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#fcdb00]"></i>
                        <input type="text" placeholder="Dirección completa" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                      </div>
                      <div className="relative">
                        <i className="fas fa-city absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Barrio / Localidad / CP" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                      </div>
                    </div>
                  )}

                  {shippingType === 'moto' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                      <CalculadorEnvio 
                        address={address} setAddress={setAddress}
                        zone={zone} setZone={setZone}
                        shippingType={shippingType}
                        setShippingCost={setShippingCost}
                      />
                      
                      <div className="flex flex-col gap-3 mt-2">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">¿Cuándo querés recibirlo?</label>
                        
                        {/* SELECTOR DE FECHA (PRÓXIMOS 7 DÍAS) */}
                        <div className="relative">
                          <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                          <select 
                            value={deliveryDate} 
                            onChange={(e) => setDeliveryDate(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#fcdb00] transition-all appearance-none cursor-pointer text-[#111111]"
                          >
                            {next7Days.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]"></i>
                        </div>

                        {/* SELECTOR DE HORARIO (13HS O 18HS) */}
                        <div className="flex gap-2 bg-[#f2f2f2] p-1.5 rounded-xl border border-gray-200">
                          <button onClick={() => setDeliveryTime('13:00')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryTime === '13:00' ? 'bg-white text-[#111111] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                            <i className="fas fa-sun"></i> Turno 13:00
                          </button>
                          <button onClick={() => setDeliveryTime('18:00')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryTime === '18:00' ? 'bg-white text-[#111111] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                            <i className="fas fa-moon"></i> Turno 18:00
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">¿Cómo querés abonar?</label>
                        <div className="flex gap-2 bg-[#f2f2f2] p-1.5 rounded-xl border border-gray-200">
                          <button onClick={() => setPaymentMethod('transferencia')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${paymentMethod === 'transferencia' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <i className="fas fa-university"></i> Transferencia
                          </button>
                          <button onClick={() => setPaymentMethod('efectivo')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${paymentMethod === 'efectivo' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <i className="fas fa-money-bill-wave"></i> Efectivo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="relative mt-1">
                    <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Piso / Depto / Torre (Opcional)" value={aptDetails} onChange={(e) => setAptDetails(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                  </div>

                </div>
              )}
              </div>
              </div>)}</div>{cart.length > 0 && (<div className="p-6 bg-white border-t border-gray-200 sticky bottom-0 z-20"><div className="flex justify-between items-end mb-4"><span className="font-bold text-gray-500 text-[10px] uppercase tracking-widest font-poppins">Total a Pagar</span><span className="font-bebas text-5xl text-[#111111] tracking-wide leading-none drop-shadow-sm"><span className="text-[#fcdb00] text-3xl mr-1.5">{CONFIG.currencySymbol}</span>{formatPrice(calculateTotal())}</span></div><button onClick={handleCheckout} className={`w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(252,219,0,0.4)] active:scale-95 font-bebas py-4 rounded-xl uppercase tracking-wider text-xl flex justify-center items-center gap-3 transition-all duration-300`}><i className="fas fa-check-circle text-2xl mb-0.5"></i> Confirmar Pedido</button></div>)}</div></div>)}
      
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[100] flex flex-col items-end gap-3 group">
        <div className={`bg-white text-[#111111] p-3 md:p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200 max-w-[180px] md:max-w-[200px] text-center transform transition-all duration-700 ease-out origin-bottom-right relative ${showTooltip ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-90 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100'}`}>
          <p className="font-poppins font-bold text-[10px] md:text-xs">¿No sabés cuál elegir? Te ayudamos</p>
          <div className="absolute bottom-[-6px] right-6 w-3 h-3 md:w-4 md:h-4 bg-white transform rotate-45 border-r border-b border-gray-200"></div>
        </div>
        <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white text-3xl shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform duration-300"><i className="fab fa-whatsapp"></i></a>
      </div>

      {/* --- MODAL DE PAGO OFFLINE --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-[#111111] p-6 text-center relative border-b border-white/10">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times"></i></button>
              <div className="w-16 h-16 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"><i className="fas fa-university text-3xl text-[#111111]"></i></div>
              <h2 className="text-3xl font-bebas text-white uppercase tracking-wide">¡Pedido Reservado!</h2>
              <p className="text-[#fcdb00] text-[11px] font-bold uppercase tracking-widest font-poppins">Falta 1 paso para despacharlo</p>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1 font-poppins">Total a transferir</p>
                <p className="text-5xl font-bebas text-[#111111] leading-none tracking-wide"><span className="text-[#fcdb00] text-3xl mr-1">$</span>{formatPrice(calculateTotal())}</p>
              </div>
              <div className="bg-[#f2f2f2] p-5 rounded-2xl border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#fcdb00]"></div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 font-poppins"><i className="fas fa-university text-[#fcdb00] mr-1"></i> Transferir a:</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <span className="font-bebas text-2xl text-[#111111] tracking-wider truncate">{CONFIG.paymentAlias}</span>
                    <button onClick={copyAliasToClipboard} className="w-10 h-10 bg-[#f2f2f2] rounded-lg flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors flex-shrink-0"><i className="fas fa-copy"></i></button>
                  </div>
                  <div className="bg-gray-200/50 p-2.5 rounded-lg border border-gray-200 text-center">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-poppins">TITULAR: {CONFIG.paymentName}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button onClick={executeOrder} disabled={isSending} className={`w-full ${isSending ? 'bg-gray-300 text-gray-500' : 'bg-[#25D366] text-white hover:scale-[1.02] shadow-lg shadow-[#25D366]/30'} py-4 rounded-xl font-bebas text-xl uppercase tracking-wider transition-all flex items-center justify-center gap-3`}>
                  {isSending ? <><i className="fas fa-circle-notch fa-spin text-lg"></i> Procesando...</> : <><i className="fab fa-whatsapp text-2xl mb-0.5"></i> Enviar Comprobante</>}
                </button>
                <p className="text-[9px] text-gray-400 font-medium text-center font-poppins uppercase tracking-widest leading-relaxed">
                  Realizá la transferencia y envianos la captura por WhatsApp tocando el botón verde.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}