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
  paymentAlias: "028import.bell", 
  paymentName: "Lucio Bunge", 
};


const INITIAL_COMMUNITY_VIDEOS = [
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
  },
  {
    id: 'community_video_4',
    title: 'GiuliAnny x 028',
    creator: '@giulianny',
    type: 'Influencer',
    description: 'Nuevo contenido real para sumar prueba social y mostrar productos destacados.',
    videoUrl: 'https://res.cloudinary.com/dcdwnayy2/video/upload/v1778713680/GiuliAnny_028_gjnrdz.mp4',
    productId: 17,
    productsShown: [17, 26, 33],
    ctaText: 'Ver productos del video',
    featured: false,
    order: 4,
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
  { id: 'fa-box', prefix: 'fas' }, { id: 'fa-wind', prefix: 'fas' }, { id: 'fa-leaf', prefix: 'fas' }, { id: 'fa-microchip', prefix: 'fas' }, { id: 'fa-star', prefix: 'fas' }, { id: 'fa-fire', prefix: 'fas' }, { id: 'fa-apple', prefix: 'fab' }, { id: 'fa-mobile-alt', prefix: 'fas' }, { id: 'fa-laptop', prefix: 'fas' }, { id: 'fa-gamepad', prefix: 'fas' }, { id: 'fa-headphones', prefix: 'fas' }, { id: 'fa-gem', prefix: 'fas' }, { id: 'fa-tag', prefix: 'fas' }, { id: 'fa-cannabis', prefix: 'fas' }, { id: 'fa-smoking', prefix: 'fas' }
];

const ROULETTE_PRIZES = [
  { id: 'off5', text: '5% OFF x MES', prob: 0.28, type: 'percent', value: 5, textC: '#fcdb00', description: '¡Activado! Tenés un 5% OFF extra y automático en CADA compra.' }, 
  { id: 'off10', text: '10% OFF', prob: 0.26, type: 'percent', value: 10, textC: '#fcdb00', description: '¡Felicidades! Ganaste un 10% de descuento DIRECTO en tu carrito para usar YA.' }, 
  { id: 'off15', text: ' 15% +30K COMPRA', prob: 0.20, type: 'percent', value: 15, textC: '#fcdb00', description: '¡Activado! Llená tu carrito hasta $30.000 o más y te regalamos un 15% OFF en el TOTAL.' }, 
  { id: 'labubu', text: 'LABUBU GRATIS', prob: 0.14, type: 'none', value: 0, textC: '#fcdb00', description: '¡Increíble! Te enviamos un muñeco/llavero Labubu de regalo totalmente gratis.' }, 
  { id: 'off20', text: '2DO VAPE -20%', prob: 0.09, type: 'percent', value: 20, textC: '#fcdb00', description: '¡Oferta activada! Llevate 2 Vapes y el segundo tiene un 20% OFF automático.' }, 
  { id: 'sorpresa', text: '🎁 SORPRESA', prob: 0.03, type: 'sorpresa', value: 0, textC: '#fcdb00', description: '¡NO LO PUEDO CREER! Te ganaste EL PREMIO GORDO: Un Vaso Stanley 100% GRATIS superando los $60.000.' }, 
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
  nosotros: {
    title: "Nuestra Esencia",
    subtitle: "Acerca de 028 IMPORT",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p className="text-xl font-medium text-[#111111] leading-snug">En 028 IMPORT no solo entregamos productos; brindamos una experiencia de exclusividad, confianza y absoluta prioridad al tiempo de nuestros clientes.</p>
        <p>Nacimos con el firme propósito de establecer un nuevo estándar en la importación y distribución de artículos premium. Entendemos que el lujo moderno no se trata únicamente de lo que adquieres, sino de cómo lo adquieres. Por ello, hemos diseñado un ecosistema de atención al cliente meticuloso, donde la amabilidad, la inmediatez y la transparencia son nuestros pilares innegociables.</p>
        <p>Nuestro catálogo es el resultado de una curaduría exhaustiva. Cada marca y cada modelo que ofrecemos ha sido seleccionado bajo los más estrictos controles de calidad e idoneidad, garantizando a nuestros usuarios el acceso a lo mejor del mercado global sin intermediarios innecesarios y con la certeza de un origen 100% legítimo.</p>
        <div className="border-l-4 border-[#fcdb00] pl-6 py-2 my-10 bg-gray-50 rounded-r-2xl">
          <p className="italic text-gray-800 text-lg font-medium">"Creemos firmemente que el tiempo de nuestro cliente es su activo más valioso. Por eso, nuestro compromiso es la excelencia y la velocidad en cada entrega."</p>
        </div>
        <p>Agradecemos tu confianza y te damos la bienvenida a la experiencia 028.</p>
      </div>
    )
  },
  terminos: {
    title: "Términos y Condiciones",
    subtitle: "Legal & Políticas Comerciales",
    body: (
      <div className="space-y-8 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p>El acceso y uso de la plataforma 028 IMPORT (en adelante, "la Tienda" o "Nosotros") se rige por los presentes Términos y Condiciones. Al utilizar nuestro sitio web, usted acepta íntegramente las políticas aquí detalladas.</p>
        
        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">1. Naturaleza del Servicio</h3>
          <p>028 IMPORT opera como un catálogo virtual interactivo. Los productos añadidos a la "Bolsa de Compras" no constituyen una reserva legal de inventario ni una transacción comercial finalizada. La confirmación del pedido, fijación del precio final y reserva de stock se perfecciona de manera exclusiva a través de nuestro canal oficial de WhatsApp, mediado por un asesor de ventas.</p>
        </div>

        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">2. Precios y Disponibilidad</h3>
          <p>Nos esforzamos por mantener nuestro catálogo actualizado en tiempo real. No obstante, debido a fluctuaciones arancelarias y dinámicas del mercado de importación, los precios publicados tienen carácter referencial. 028 IMPORT se reserva el derecho de modificar los precios sin previo aviso antes de la confirmación formal del pago.</p>
        </div>

        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">3. Garantía de Originalidad</h3>
          <p>Garantizamos de manera absoluta la autenticidad y el origen legítimo de todos los artículos comercializados. Todo producto es entregado en su embalaje original y con los sellos de seguridad correspondientes emitidos por el fabricante.</p>
        </div>

        <div>
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3">4. Política de Cambios y Garantías</h3>
          <p>Dado el carácter personal y consumible de gran parte de nuestro catálogo, no se aceptarán cambios ni devoluciones por motivos de "insatisfacción" o error en la elección del sabor/modelo una vez que el precinto de seguridad haya sido vulnerado. Solo se admitirán reclamos por defectos técnicos de fabricación, los cuales deberán ser notificados dentro de las 48 horas posteriores a la recepción, adjuntando evidencia visual.</p>
        </div>
      </div>
    )
  },
  privacidad: {
    title: "Política de Privacidad",
    subtitle: "Protección de Datos Personales",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p className="text-lg font-medium text-[#111111]">En 028 IMPORT, la salvaguarda y confidencialidad de su información personal es una absoluta prioridad.</p>
        <p>La presente Política de Privacidad describe cómo recopilamos, utilizamos y protegemos los datos que usted nos proporciona, en estricto cumplimiento con la Ley de Protección de los Datos Personales (Nº 25.326) de la República Argentina.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Recopilación de Información</h3>
        <p>A través de nuestra plataforma, podemos solicitar datos básicos como su nombre y datos de domicilio/ubicación (para envíos). No procesamos ni almacenamos datos financieros, bancarios ni tarjetas de crédito en nuestros servidores.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Uso Exclusivo de los Datos</h3>
        <p>La información recolectada se utiliza con los siguientes fines exclusivos:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Gestión logística y coordinación efectiva de las entregas.</li>
          <li>Comunicación directa vía WhatsApp para confirmación de pedidos.</li>
        </ul>

        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">No Divulgación a Terceros</h3>
        <p>028 IMPORT garantiza que bajo ninguna circunstancia comercializará, alquilará ni compartirá su base de datos de clientes con entidades externas, agencias de publicidad o terceros no involucrados en la cadena logística de su pedido.</p>
      </div>
    )
  },
  envios: {
    title: "Envíos y Entregas",
    subtitle: "Logística Premium",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p className="text-lg font-medium text-[#111111]">Sabemos que la inmediatez es fundamental. Por ello, hemos diseñado un esquema logístico ágil, seguro y adaptado a sus necesidades.</p>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-[#fcdb00] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-bolt"></i> Envío Flash</h3>
          <p className="text-sm">Para zonas seleccionadas, ofrecemos un servicio de entrega en menos de 30 minutos abonando mediante transferencia bancaria. Ideal para quienes necesitan sus productos de forma inmediata.</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-motorcycle"></i> Motomensajería Programada</h3>
          <p className="text-sm">Contamos con un servicio propio de motomensajería con salidas organizadas en dos turnos fijos (13:00hs y 18:00hs). Esto nos permite garantizar un tiempo de entrega predecible y seguro. Aboná con efectivo o transferencia.</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
          <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2"><i className="fas fa-store"></i> Retiro Local</h3>
          <p className="text-sm">Si prefiere gestionar el retiro de manera personal, lo esperamos en nuestro punto de entrega en Miñones & Juramento (Belgrano, CABA). Le informaremos por WhatsApp las instrucciones exactas al confirmar el pedido.</p>
        </div>
      </div>
    )
  },
  pagos: {
    title: "Medios de Pago",
    subtitle: "Transacciones Seguras",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p>Con el objetivo de garantizar su seguridad y ofrecerle flexibilidad, en 028 IMPORT procesamos los pagos por fuera de la plataforma web, evitando que usted deba ingresar datos sensibles en línea.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-4">Alternativas Disponibles:</h3>
        
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[#111111]"><i className="fas fa-university text-[#fcdb00]"></i></div>
            <div>
              <p className="font-bold text-[#111111]">Transferencia Bancaria (ARS)</p>
              <p className="text-sm mt-1">Acreditación rápida mediante CBU/CVU o Alias. La app le mostrará nuestro Alias oficial durante el proceso de compra (Titular: Lucio Bunge).</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[#111111]"><i className="fas fa-money-bill-wave text-[#fcdb00]"></i></div>
            <div>
              <p className="font-bold text-[#111111]">Efectivo</p>
              <p className="text-sm mt-1">Disponible para la modalidad de Retiro Local o envío mediante nuestra Motomensajería (Pago contra entrega).</p>
            </div>
          </li>
        </ul>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-xs uppercase tracking-widest font-black text-gray-400 mb-2">Aviso de Seguridad</p>
          <p className="text-sm">Bajo ninguna circunstancia el personal de 028 IMPORT le solicitará los dígitos de su tarjeta de crédito, claves de seguridad o contraseñas bancarias a través de esta plataforma ni por canales no oficiales.</p>
        </div>
      </div>
    )
  },
  arrepentimiento: {
    title: "Botón de Arrepentimiento",
    subtitle: "Marco Legal y Devoluciones",
    body: (
      <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base font-poppins">
        <p>En cumplimiento con las disposiciones de la Dirección Nacional de Defensa del Consumidor, 028 IMPORT pone a su disposición las directrices para la revocación de compra.</p>
        
        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Plazo Legal</h3>
        <p>Usted tiene el derecho irrevocable de cancelar su compra dentro de un plazo máximo de <strong>10 (diez) días corridos</strong> contados desde la fecha de recepción del producto en su domicilio o desde el retiro en sucursal.</p>

        <h3 className="text-[#111111] font-black uppercase tracking-widest text-sm mt-8 mb-2">Condiciones Innegociables para Aceptación</h3>
        <p>Dada la naturaleza de los productos comercializados en nuestro catálogo (artículos de consumo personal e higiene), la devolución será aceptada pura y exclusivamente si se cumplen los siguientes requisitos de manera estricta:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>El producto debe encontrarse en <strong>estado impecable, inmaculado y totalmente sin uso</strong>.</li>
          <li>Los sellos térmicos, precintos de fábrica y plásticos protectores deben estar <strong>intactos y sin alteraciones</strong>.</li>
          <li>El packaging o cajas no deben presentar roturas, marcas ni abolladuras.</li>
        </ul>

        <div className="bg-red-50 text-red-800 p-4 rounded-xl mt-6 border border-red-100 text-sm">
          <strong>IMPORTANTE:</strong> Por normativas sanitarias, si un dispositivo electrónico de consumo o esencia ha sido abierto, encendido o sus sellos han sido rotos, se perderá automáticamente el derecho a devolución por arrepentimiento.
        </div>

        <p className="mt-8">Para iniciar el trámite, le solicitamos contactarse inmediatamente a nuestra línea de WhatsApp informando su número de pedido y adjuntando fotografías del estado del producto.</p>
      </div>
    )
  }
};

// Banner Hot Sale removido
const CountdownBanner = () => null;

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [promos, setPromos] = useState([]);
  const [homeSections, setHomeSections] = useState([]); 
  const [homeLayout, setHomeLayout] = useState([]);
  const [communityVideos, setCommunityVideos] = useState(INITIAL_COMMUNITY_VIDEOS);
  const [activeCommunityVideoId, setActiveCommunityVideoId] = useState(null);
  const [flippedCommunityCards, setFlippedCommunityCards] = useState({});
  const [communityVideoFeedback, setCommunityVideoFeedback] = useState({});
  const communityVideoRefs = useRef({});
  const [communityProductsPanel, setCommunityProductsPanel] = useState(null);
  const [activeStoryVideo, setActiveStoryVideo] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home'); 
  const [activeFilter, setActiveFilter] = useState({ dept: 'all', cat: 'all' });
  const [expandedDept, setExpandedDept] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('retiro');
  const [shippingType, setShippingType] = useState('flash'); 
  useEffect(() => {
    const hideInlineVideoControls = () => {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (!fullscreenElement) {
        Object.values(communityVideoRefs.current || {}).forEach((videoEl) => {
          if (videoEl) videoEl.controls = false;
        });
      }
    };

    document.addEventListener('fullscreenchange', hideInlineVideoControls);
    document.addEventListener('webkitfullscreenchange', hideInlineVideoControls);

    return () => {
      document.removeEventListener('fullscreenchange', hideInlineVideoControls);
      document.removeEventListener('webkitfullscreenchange', hideInlineVideoControls);
    };
  }, []);

  const [paymentMethod, setPaymentMethod] = useState('transferencia'); 
  const [shippingCost, setShippingCost] = useState(0); 
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [aptDetails, setAptDetails] = useState(''); 
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShippingCalculatorModal, setShowShippingCalculatorModal] = useState(false);
  
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

  const [showRouletteModal, setShowRouletteModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(-30);
  const [showResultModal, setShowResultModal] = useState(false);
  const [wonPrizeData, setWonPrizeData] = useState(null);
  
  const [localRoulettePrize, setLocalRoulettePrize] = useState(null);
  const [hasSpunLocal, setHasSpunLocal] = useState(false);
  const communityViewedRef = useRef(new Set());

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
    setLocalRoulettePrize(null);
    setWonPrizeData(null);
    setHasSpunLocal(false);
    setShowRouletteModal(false);
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
  }, [currentView, activeFilter, products, searchTerm, homeSections, communityVideos, homeLayout]);

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
      const unsubscribeCommunityVideos = onSnapshot(query(collection(firebaseRefs.db, 'community_videos'), orderBy('order', 'asc')), (snap) => {
        const videosFromDb = !snap.empty
          ? snap.docs
              .map(d => ({ dbId: d.id, ...d.data() }))
              .filter(video => !video.isHidden && video.videoUrl)
              .sort((a, b) => (a.order || 99) - (b.order || 99))
          : [];
        setCommunityVideos(videosFromDb.length ? videosFromDb : INITIAL_COMMUNITY_VIDEOS);
      });
      const unsubscribeHomeLayout = onSnapshot(doc(firebaseRefs.db, 'settings', 'home_layout'), (snap) => {
        const sections = snap.exists() ? snap.data()?.sections : null;
        setHomeLayout(Array.isArray(sections) ? sections : []);
      });
      const unsubscribeDeptIcons = onSnapshot(doc(firebaseRefs.db, 'settings', 'departments'), (snap) => {
        if (snap.exists()) { setDeptIcons(snap.data().icons || {}); }
      });
      const unsubscribeUpsells = onSnapshot(collection(firebaseRefs.db, 'upsells'), (snap) => {
        setUpsellsList(!snap.empty ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : []);
      });

      return () => { unsubscribeAuth(); unsubscribeStock(); unsubscribePromos(); unsubscribeHomeSections(); unsubscribeCommunityVideos(); unsubscribeHomeLayout(); unsubscribeDeptIcons(); unsubscribeUpsells(); window.removeEventListener('focus', handleFocus); window.removeEventListener('pageshow', handleFocus); };
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

  const claimPrize = (prize) => {
    localStorage.removeItem('pendingPrize'); 
    localStorage.setItem('hotSalePrize', JSON.stringify(prize));
    setLocalRoulettePrize(prize);
    setShowResultModal(false);
    showToast(`¡PREMIO RECLAMADO! 🎉 ${prize.text}`);
    fireConfetti();
  };

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
          
          const pending = localStorage.getItem('pendingPrize');
          if (pending) {
              claimPrize(JSON.parse(pending));
          } else if (wonPrizeData && !localRoulettePrize) {
              claimPrize(wonPrizeData);
          }
      } catch (error) { console.error(error); showToast("Error al iniciar con Google"); }
  };
  const fireConfetti = () => {
    if (typeof window !== 'undefined' && window.confetti) {
      const defaults = { origin: { y: 0.7 }, colors: ['#fcdb00', '#ffffff', '#111111', '#eab308'], zIndex: 9999, gravity: 0.5, scalar: 1.1, ticks: 200 };
      window.confetti({ ...defaults, particleCount: 120, spread: 100, startVelocity: 35 });
      setTimeout(() => { window.confetti({ ...defaults, particleCount: 60, spread: 120, startVelocity: 25 }); }, 150);
    }
  };

  const handleSpinRoulette = async () => {
      if (!user || user.isAnonymous) {
          showToast("⚠️ Iniciá sesión para poder girar");
          handleGoogleLogin();
          return;
      }

      if (isSpinning) return;
      
      if (hasSpunLocal) {
        showToast("¡Ya utilizaste tu tiro de Hot Sale!");
        return;
      }
      
      setIsSpinning(true);
      const rand = Math.random();
      let sum = 0;
      let wonPrize = ROULETTE_PRIZES[0];
      
      for (let p of ROULETTE_PRIZES) {
          sum += p.prob;
          if (rand <= sum) { wonPrize = p; break; }
      }

      const extraSpins = 5 * 360; 
      const prizeIndex = ROULETTE_PRIZES.findIndex(p => p.id === wonPrize.id);
      const sliceAngle = 360 / ROULETTE_PRIZES.length; 
      const targetRotation = extraSpins + (360 - (prizeIndex * sliceAngle)) - (sliceAngle / 2);
      
      setRouletteRotation(-30 + targetRotation);

      setTimeout(async () => { // Agregamos el 'async' acá
          setIsSpinning(false);
          setWonPrizeData(wonPrize);
          setShowRouletteModal(false); 
          setShowResultModal(true);    
          
          localStorage.setItem('hotSaleSpun', 'true');
          localStorage.setItem('pendingPrize', JSON.stringify(wonPrize));
          setHasSpunLocal(true);

          // --- LOGICA PARA REGISTRAR EN EL ADMIN ---
          if (firebaseRefs.db && user) {
            try {
              await addDoc(collection(firebaseRefs.db, 'spins'), {
                userId: user.uid,
                userName: dbUser?.name || user.displayName || 'Anónimo',
                userEmail: user.email || '',
                prizeId: wonPrize.id,
                prizeText: wonPrize.text,
                createdAt: serverTimestamp()
              });
              
              // Opcional: También lo marcamos en su perfil de usuario
              await setDoc(doc(firebaseRefs.db, 'users', user.uid), {
                hasSpun: true,
                wonPrize: wonPrize.text
              }, { merge: true });

            } catch (error) {
              console.error("Error al guardar el tiro:", error);
            }
          }
      }, 4000);
  };

  const showToast = (message) => { setToastMessage(message); setTimeout(() => { setToastMessage(null); }, 3000); };

  const getCommunityDocId = (video) => video?.dbId || null;

  const trackCommunityView = (video) => {
    const docId = getCommunityDocId(video);
    if (!docId || !firebaseRefs.db || communityViewedRef.current.has(docId)) return;
    communityViewedRef.current.add(docId);
    setDoc(doc(firebaseRefs.db, 'community_videos', docId), { views: increment(1) }, { merge: true }).catch(console.error);
  };

  const handleCommunityProductClick = (video, product, e) => {
    if (e) e.stopPropagation();
    const docId = getCommunityDocId(video);
    if (docId && firebaseRefs.db) {
      setDoc(doc(firebaseRefs.db, 'community_videos', docId), { clicks: increment(1) }, { merge: true }).catch(console.error);
    }
    if (product) {
      addToCart(product, e);
    } else {
      navigateTo('catalog');
    }
  };

  const getProductsShownForVideo = (video) => {
    const rawIds = Array.isArray(video?.productsShown) && video.productsShown.length
      ? video.productsShown
      : (video?.productId ? [video.productId] : []);

    return rawIds
      .map(id => Number(id))
      .filter((id, index, arr) => Number.isFinite(id) && arr.indexOf(id) === index)
      .map(id => products.find(p => Number(p.id) === id && !p.isDeleted && p.inStock !== false && !p.isHidden))
      .filter(Boolean);
  };

  const toggleCommunityCardFlip = (cardId) => {
    setFlippedCommunityCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };


  const flashCommunityVideoIcon = (cardId, icon) => {
    setCommunityVideoFeedback(prev => ({ ...prev, [cardId]: icon }));
    setTimeout(() => {
      setCommunityVideoFeedback(prev => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
    }, 650);
  };

  const handleCommunityVideoTap = (cardId, videoData, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const videoEl = communityVideoRefs.current[cardId];
    if (!videoEl) return;

    if (videoEl.paused) {
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          trackCommunityView(videoData);
          flashCommunityVideoIcon(cardId, 'fa-pause');
        }).catch(() => flashCommunityVideoIcon(cardId, 'fa-play'));
      } else {
        trackCommunityView(videoData);
        flashCommunityVideoIcon(cardId, 'fa-pause');
      }
    } else {
      videoEl.pause();
      flashCommunityVideoIcon(cardId, 'fa-play');
    }
  };

  const handleCommunityFullscreen = async (cardId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const videoEl = communityVideoRefs.current[cardId];
    if (!videoEl) return;

    videoEl.controls = true;

    try {
      if (videoEl.requestFullscreen) {
        await videoEl.requestFullscreen();
      } else if (videoEl.webkitEnterFullscreen) {
        videoEl.webkitEnterFullscreen();
      } else if (videoEl.webkitRequestFullscreen) {
        await videoEl.webkitRequestFullscreen();
      }
    } catch (err) {
      videoEl.controls = true;
    }
  };

  const openCommunityFeaturedVideo = (video) => {
    setActiveCommunityVideoId(video.dbId || video.id);
    setFlippedCommunityCards(prev => ({ ...prev, featured: false }));
  };

  const navigateTo = (view, dept = null) => { setCurrentView(view); if(dept) setActiveFilter({dept, cat: 'all'}); setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  const formatPrice = (n) => n ? n.toLocaleString('es-AR') : '0';
  const getTotalItems = () => cart.reduce((acc, item) => acc + item.qty, 0);
  const getUnitPromoPrice = (item) => { const promo = promos.find(p => p.category === item.category); if (promo) { const catCount = cart.filter(i => i.category === item.category).reduce((acc, curr) => acc + curr.qty, 0); if (catCount >= promo.minQty) return promo.totalPrice / promo.minQty; } return item.price; };
  
  const calculateTotal = (cartData = cart) => {
      const subtotal = cartData.reduce((acc, item) => acc + (item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item))), 0);
      const envio = (deliveryMethod === 'envio' && shippingType === 'moto') ? shippingCost : 0;
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
  
  const changeQty = (id, delta) => { 
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)); 
  };

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
    if (!clientName.trim() || !clientPhone.trim()) { 
        showToast("⚠️ Completá tu Nombre y Teléfono."); 
        return; 
    }
    if (deliveryMethod === 'envio') {
        if (!address.trim() || !zone.trim()) { 
            showToast("⚠️ Completá dirección y localidad."); 
            return; 
        }
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
        if (i.isUpsell) { 
            msg += `- ${i.qty}x ${i.name} (OFERTA: $${formatPrice(price)})\n`; 
        } else { 
            msg += `- ${i.qty}x ${i.name} ($${formatPrice(price)} c/u)\n`; 
        }
    });
    
    let subtotalFinal = subtotalCalc;

    if (localRoulettePrize) {
        const totalItems = currentCart.reduce((acc, item) => acc + item.qty, 0);
        
        if (localRoulettePrize.id === 'off20') {
            if (totalItems >= 2) {
                msg += `\n🎁 *HOT SALE:* 20% OFF en 2do Vape aplicado.\n`;
            }
        } else if (localRoulettePrize.id === 'off15') {
            if (subtotalCalc >= 30000) {
                msg += `\n🎁 *HOT SALE:* 15% OFF (Superó $30.000) aplicado.\n`;
            }
        } else if (localRoulettePrize.type === 'percent') {
            msg += `\n🎰 *HOT SALE:* ${localRoulettePrize.text} aplicado al total.\n`;
        } else if (localRoulettePrize.type === 'shipping') {
            msg += `\n🔥 *HOT SALE:* ¡ENVÍO GRATIS GANADO! 🔥\n`;
        } else if (localRoulettePrize.id === 'sorpresa') {
            if (subtotalCalc >= 60000) {
                msg += `\n🎁 *HOT SALE:* ¡PREMIO SORPRESA! (Vaso Stanley ganado por compra +$60k)\n`;
            }
        } else if (localRoulettePrize.id === 'labubu') {
            msg += `\n🎁 *HOT SALE:* ¡LABUBU GRATIS EN TU COMPRA!\n`;
        }
    }

    msg += `\n*Subtotal:* ${CONFIG.currencySymbol}${formatPrice(subtotalFinal)}`;
    
    let costoEnvioAgregado = (deliveryMethod === 'envio' && shippingType === 'moto') ? shippingCost : 0;
    
    if (localRoulettePrize && localRoulettePrize.type === 'shipping' && deliveryMethod === 'envio' && shippingType === 'moto') {
        costoEnvioAgregado = 0;
    }
    
    if (costoEnvioAgregado > 0) {
        msg += `\n*Costo de Envío (Moto):* ${CONFIG.currencySymbol}${formatPrice(costoEnvioAgregado)}`;
    }
    
    msg += `\n*TOTAL A PAGAR: ${CONFIG.currencySymbol}${formatPrice(finalTotal)}*\n`;
    
    if (deliveryMethod === 'retiro') {
        msg += `\n*LOGÍSTICA:* 🏪 Retiro por deposito\n`;
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
                userId: user?.uid || "anon", 
                clientName, 
                clientPhone, 
                items: currentCart.map(i => ({ 
                    name: i.name, 
                    qty: i.qty, 
                    price: i.isUpsell ? i.upsellPrice : getUnitPromoPrice(i) 
                })), 
                total: finalTotal, 
                delivery: deliveryMethod, 
                address: deliveryMethod === 'envio' ? address : '', 
                zone: deliveryMethod === 'envio' ? zone : '', 
                aptDetails: deliveryMethod === 'envio' ? aptDetails.trim() : '', 
                shippingOption: deliveryMethod === 'envio' ? shippingType : null,
                paymentMethod: deliveryMethod === 'envio' && shippingType === 'moto' ? paymentMethod : null,
                deliveryDate: deliveryMethod === 'envio' && shippingType === 'moto' ? deliveryDate : null,
                deliveryTime: deliveryMethod === 'envio' && shippingType === 'moto' ? deliveryTime : null,
                shippingCost: costoEnvioAgregado,
                couponUsed: localRoulettePrize ? localRoulettePrize.text : null,
                status: (deliveryMethod === 'envio' && shippingType === 'moto' && paymentMethod === 'transferencia') ? 'pending_verification' : 'pending', 
                createdAt: serverTimestamp() 
            }).catch(e => console.error(e)); 
        } 
        setTimeout(() => { 
            window.location.href = whatsappUrl; 
            setIsSending(false); 
        }, 400); 
    } catch (e) { 
        window.location.href = whatsappUrl; 
        setIsSending(false); 
    }
  };

  const copyAliasToClipboard = () => {
    navigator.clipboard.writeText(CONFIG.paymentAlias);
    showToast("✅ ALIAS copiado al portapapeles");
  };

  const renderProductCard = (p, index, isVidriera = false, layout = 'horizontal') => {
    const inCart = cart.find(i => i.id === p.id);
    const isOutOfStock = p.inStock === false;
    const effectiveSize = isVidriera ? (p.cardSize || 'normal') : 'normal';

    let cardStyle = {}; 
    let sizeClasses = ''; 
    let aspectClass = 'aspect-[4/5]'; 
    let titleClass = 'text-[13px] md:text-[16px] leading-tight'; 
    let priceClass = 'text-xl md:text-2xl';

    if (layout === 'vertical') {
        if (effectiveSize === 'normal') { 
            sizeClasses = 'w-[calc(50%-6px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] flex-shrink-0'; 
        } else if (effectiveSize === 'medium') { 
            sizeClasses = 'w-full md:w-[calc(66.666%-14px)] lg:w-[calc(50%-10px)] flex-shrink-0'; 
            titleClass = 'text-[15px] md:text-lg leading-tight'; 
            priceClass = 'text-2xl md:text-3xl'; 
        } else if (effectiveSize === 'large') { 
            sizeClasses = 'w-full flex-shrink-0'; 
            aspectClass = 'aspect-[16/9] md:aspect-[21/9]'; 
            titleClass = 'text-xl md:text-3xl leading-tight'; 
            priceClass = 'text-3xl md:text-4xl'; 
        }
    } else {
        if (effectiveSize === 'normal') { 
            sizeClasses = 'w-[160px] md:w-[200px] flex-shrink-0'; 
        } else if (effectiveSize === 'medium') { 
            sizeClasses = 'w-[230px] md:w-[280px] flex-shrink-0'; 
            titleClass = 'text-[15px] md:text-lg leading-tight'; 
            priceClass = 'text-2xl md:text-3xl'; 
        } else if (effectiveSize === 'large') { 
            sizeClasses = 'w-[320px] md:w-[480px] flex-shrink-0'; 
            aspectClass = 'aspect-[16/9]'; 
            titleClass = 'text-xl md:text-3xl leading-tight'; 
            priceClass = 'text-3xl md:text-4xl'; 
        }
    }

    return (
      <div 
        key={p.id} 
        style={{ transitionDelay: `${(index % 4) * 75}ms`, ...cardStyle }} 
        className={`reveal-on-scroll bg-white border border-[#f2f2f2] shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[1.5rem] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] snap-start group ${isOutOfStock ? 'opacity-70 grayscale' : ''} ${sizeClasses}`}
      >
        <div 
            className={`relative ${aspectClass} overflow-hidden bg-[#f2f2f2]/50 cursor-pointer rounded-t-[1.5rem]`} 
            onClick={() => setSelectedProduct(p)}
        >
          <img 
            src={p.image} 
            alt={p.name} 
            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out" 
          />
          {isOutOfStock ? ( 
              <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-red-600 text-white font-bebas text-sm px-4 py-1.5 rounded-sm uppercase tracking-wider shadow-lg">SIN STOCK</span>
              </div> 
          ) : p.tag && ( 
              <span className="absolute top-3 left-3 bg-[#111111] text-[#fcdb00] font-bebas text-[11px] px-3 py-1 uppercase rounded-sm shadow-md tracking-wider">
                  {p.tag}
              </span> 
          )}
        </div>
        
        <div className="p-4 flex-grow flex flex-col">
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-poppins">
                {p.category}
            </p>
            <h3 className={`font-bebas ${titleClass} uppercase mb-1 text-[#111111] line-clamp-2 tracking-wide`}>
                {p.name}
            </h3>
            
            <div className="mt-auto pt-3">
                <p className={`text-[#fcdb00] font-bebas ${priceClass} mb-4 tracking-wide drop-shadow-sm`}>
                    {CONFIG.currencySymbol}{formatPrice(p.price)}
                </p>
                
                {isOutOfStock ? ( 
                    <button disabled className="w-full bg-[#f2f2f2] text-gray-400 py-3 font-bebas text-[14px] uppercase tracking-wider rounded-xl cursor-not-allowed">
                        Agotado
                    </button> 
                ) : inCart ? (
                    <div className="flex items-center justify-between bg-[#fcdb00] text-[#111111] h-11 rounded-xl font-bold px-1.5 shadow-md">
                        <button className="w-12 h-full flex items-center justify-center hover:text-black transition-colors" onClick={() => changeQty(p.id, -1)}>
                            <i className="fas fa-minus text-xs"></i>
                        </button>
                        <span className="font-bebas text-lg pt-1">{inCart.qty}</span>
                        <button className="w-12 h-full flex items-center justify-center hover:text-black transition-colors" onClick={() => addToCart(p)}>
                            <i className="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                ) : ( 
                    <button 
                        onClick={(e) => addToCart(p, e)} 
                        className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-3 font-bebas text-[16px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-shopping-bag text-xs mb-0.5"></i> comprar ahora
                    </button> 
                )}
            </div>
        </div>
      </div>
    );
  }

  const renderProductSection = (category) => {
    let sectionProducts = products.filter(p => p.category === category);
    
    if (activeFilter.dept !== 'all') {
        sectionProducts = sectionProducts.filter(p => p.department === activeFilter.dept);
    }
    
    if (searchTerm) {
        sectionProducts = sectionProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (sectionProducts.length === 0) return null;
    
    const promo = promos.find(p => p.category === category); 
    let promoText = null;
    
    if (promo) {
        promoText = `${promo.minQty}+ un: $${formatPrice(promo.totalPrice / promo.minQty)} c/u`;
    }
    
    return (
      <section key={category} id={slugify(category)} className="mb-20 scroll-mt-40 reveal-on-scroll">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 gap-3 border-b-2 border-[#f2f2f2] pb-4">
            <h2 className="text-3xl md:text-5xl font-bebas text-[#111111] tracking-wide uppercase relative">
                {category} 
                <span className="absolute -bottom-[18px] left-0 w-16 h-1 bg-[#fcdb00] rounded-full"></span>
            </h2>
            {promoText && (
                <div className="bg-[#fcdb00]/20 text-[#111111] px-4 py-2 font-bebas text-lg rounded-full uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-tag text-[#fcdb00] mb-0.5"></i> {promoText}
                </div>
            )}
        </div>
        <div className="flex flex-wrap gap-3 md:gap-5">
            {sectionProducts.map((p, index) => renderProductCard(p, index, false, 'vertical'))}
        </div>
      </section>
    );
  };




  const renderCommunitySection = () => {
    const visibleVideos = communityVideos
      .filter(video => !video.isHidden && video.videoUrl)
      .sort((a, b) => {
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
        return (a.order || 99) - (b.order || 99);
      });

    if (!visibleVideos.length) return null;

    const CommunityProductButton = ({ video, product, compact = false }) => (
      <button
        onClick={(e) => handleCommunityProductClick(video, product, e)}
        className={`${compact ? 'w-10 h-10 rounded-xl text-sm' : 'w-full py-3 rounded-xl text-[10px]'} bg-[#fcdb00] text-[#111111] font-black uppercase tracking-widest hover:bg-[#f5d300] active:scale-95 transition-all font-poppins flex items-center justify-center gap-2`}
        title={product ? `Agregar ${product.name}` : 'Ver catálogo'}
      >
        {compact ? <i className="fas fa-cart-plus"></i> : <>{product ? 'Agregar' : 'Catálogo'} <i className={`fas ${product ? 'fa-cart-plus' : 'fa-arrow-right'} text-[10px]`}></i></>}
      </button>
    );

    const renderEditorialFlipCard = (video, index) => {
      const productsInVideo = getProductsShownForVideo(video);
      const mainProduct = productsInVideo[0] || null;
      const cardId = video.dbId || video.id || `community-${index}`;
      const isFlipped = !!flippedCommunityCards[cardId];

      return (
        <article
          key={cardId}
          className="snap-center flex-shrink-0 w-[76vw] sm:w-[300px] md:w-[320px] community-card-enter"
          style={{ transitionDelay: `${index * 75}ms` }}
        >
          <div className="relative aspect-[9/16]" style={{ perspective: '1600px' }}>
            <div
              className="absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 720ms cubic-bezier(0.22, 0.82, 0.32, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* FRENTE: REEL */}
              <div
                className="absolute inset-0 rounded-[2rem] overflow-hidden bg-black border border-black/8 shadow-[0_12px_28px_rgba(0,0,0,0.10)] group"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <video
                  ref={(el) => { if (el) communityVideoRefs.current[cardId] = el; }}
                  src={video.videoUrl}
                  className="w-full h-full object-cover cursor-pointer"
                  playsInline
                  preload="metadata"
                  onPlay={() => trackCommunityView(video)}
                />

                <button
                  type="button"
                  onClick={(e) => handleCommunityVideoTap(cardId, video, e)}
                  className="absolute inset-0 z-[1] cursor-pointer touch-manipulation"
                  aria-label="Reproducir o pausar video"
                ></button>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent z-[2]"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/84 via-black/36 to-transparent z-[2]"></div>

                {communityVideoFeedback[cardId] && (
                  <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                      <i className={`fas ${communityVideoFeedback[cardId]} text-2xl`}></i>
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3 right-3 z-[6] flex items-start justify-between gap-2 pointer-events-none">
                  <div className="flex gap-2 flex-wrap">
                    {video.featured && <span className="bg-[#fcdb00] text-[#111111] px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest font-poppins">Destacado</span>}
                    <span className="bg-black/70 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest font-poppins border border-white/10">{video.type || 'Review'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCommunityFullscreen(cardId, e)}
                    className="pointer-events-auto w-9 h-9 rounded-full bg-black/62 hover:bg-black/78 border border-white/15 backdrop-blur-md text-white flex items-center justify-center transition-all"
                    aria-label="Ver video en pantalla completa"
                  >
                    <i className="fas fa-expand text-[12px]"></i>
                  </button>
                </div>

                <div className="absolute left-4 right-4 bottom-4 z-[6] pointer-events-none">
                  <h3 className="font-bebas text-3xl uppercase tracking-wide leading-none text-white drop-shadow-md mb-1 line-clamp-2">{video.title || 'Contenido real 028'}</h3>
                  <p className="text-[12px] md:text-[13px] text-white/60 font-poppins font-medium mb-3 line-clamp-1">{video.creator || '@influencer'}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCommunityCardFlip(cardId); }}
                    className="pointer-events-auto w-[92%] mx-auto bg-white/88 text-[#111111] rounded-2xl py-2.5 text-[10px] font-black uppercase tracking-widest font-poppins hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_10px_22px_rgba(0,0,0,0.14)] backdrop-blur-md border border-white/45"
                  >
                    <i className="fas fa-box-open"></i> Ver productos {productsInVideo.length > 0 ? `(${productsInVideo.length})` : ''}
                  </button>
                </div>
              </div>

              {/* DORSO: PRODUCTOS */}
              <div
                className="absolute inset-0 rounded-[2rem] overflow-hidden text-white border border-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <video
                  src={video.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35"
                  muted
                  loop
                  autoPlay
                  playsInline
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(252,219,0,0.10),transparent_28%)]"></div>
                <div className="absolute inset-0 bg-black/42"></div>
                <div className="absolute inset-0 backdrop-blur-[18px] bg-white/[0.07]"></div>
                <div className="absolute inset-[1px] rounded-[1.95rem] border border-white/10"></div>
                <div className="relative h-full p-4 md:p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-white/72 text-[10px] font-black uppercase tracking-[0.18em] font-poppins mb-2">Productos del video</p>
                      <h3 className="font-bebas text-3xl uppercase leading-none tracking-wide line-clamp-2 text-white">{video.title || '028 Community'}</h3>
                      <p className="text-[12px] text-white/58 font-poppins mt-1 line-clamp-1">{video.creator || '@influencer'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCommunityCardFlip(cardId); }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/16 border border-white/18 backdrop-blur-xl text-white flex items-center justify-center flex-shrink-0 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      title="Volver al video"
                    >
                      <i className="fas fa-undo text-sm"></i>
                    </button>
                  </div>

                  <div className="grid gap-3 overflow-y-auto no-scrollbar pr-1 flex-1 content-start">
                    {productsInVideo.length ? productsInVideo.slice(0, 4).map(product => (
                      <div key={`flip-${cardId}-${product.id}`} className="bg-white/[0.11] backdrop-blur-2xl rounded-[1.35rem] p-3 flex items-center gap-3 border border-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_22px_rgba(0,0,0,0.14)]">
                        <div className="w-14 h-14 bg-white/16 rounded-xl p-1.5 flex-shrink-0 backdrop-blur-xl border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                          <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bebas text-xl uppercase leading-none truncate text-white">{product.name}</p>
                          <p className="text-sm font-black mt-1 text-white">{CONFIG.currencySymbol}{formatPrice(product.price)}</p>
                        </div>
                        <CommunityProductButton video={video} product={product} compact />
                      </div>
                    )) : (
                      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/14 rounded-[1.35rem] p-5 text-center mt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <i className="fas fa-box-open text-[#fcdb00] text-2xl mb-3"></i>
                        <p className="text-sm font-black uppercase tracking-widest font-poppins">Sin productos cargados</p>
                        <p className="text-white/50 text-xs mt-2 font-poppins">Agregalos desde el admin usando productos mostrados.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCommunityCardFlip(cardId); }}
                      className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/16 backdrop-blur-xl border border-white/14 text-white text-[10px] font-black uppercase tracking-widest transition-all font-poppins shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCommunityProductClick(video, mainProduct, e)}
                      className="w-full py-3 rounded-xl bg-[#fcdb00] text-[#111111] text-[10px] font-black uppercase tracking-widest transition-all font-poppins hover:bg-[#f5d300]"
                    >
                      {mainProduct ? 'Agregar principal' : 'Catálogo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      );
    };

    return (
      <section id="community-section" className="mb-16 md:mb-20 reveal-on-scroll bg-transparent">
        <div className="flex items-end justify-between gap-4 mb-5 md:mb-7">
          <div>
            <span className="inline-flex items-center gap-2 bg-[#111111] text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] font-poppins mb-3 shadow-none">
              <i className="fas fa-users text-[#fcdb00]"></i> Comunidad real
            </span>
            <h2 className="font-bebas text-[44px] md:text-6xl uppercase tracking-wide leading-none text-[#111111]" style={{ WebkitTextStroke: '0.25px #111111' }}>028 Community</h2>
          </div>
          <p className="hidden md:block max-w-sm text-right text-xs font-bold uppercase tracking-widest text-gray-400 font-poppins">Reels reales con productos comprables</p>
        </div>

        <div className="flex overflow-x-auto gap-3 md:gap-5 no-scrollbar snap-x snap-mandatory pb-1 pr-8 bg-transparent">
          {visibleVideos.map((video, index) => renderEditorialFlipCard(video, index))}
        </div>
      </section>
    );
  };

  
const renderSingleHomeSection = (sec, sectionIndex = 0) => {
    const secProducts = sec.productIds?.map(pid => products.find(p => p.id === pid)).filter(Boolean) || [];
    if (secProducts.length === 0) return null;
    return (
      <div key={sec.id} className="mb-20 reveal-on-scroll">
        <div className="flex justify-between items-end mb-6 pl-2 border-b-2 border-[#f2f2f2] pb-3">
          <h2 className="text-4xl md:text-6xl font-bebas text-[#111111] tracking-wide uppercase">
            <i className={`${AVAILABLE_ICONS.find(i => i.id === sec.icon)?.prefix || 'fas'} ${sec.icon || 'fa-star'} ${sec.iconColor || 'text-[#fcdb00]'} mr-3 drop-shadow-sm`}></i>{sec.title}
          </h2>
          <button onClick={() => navigateTo('catalog')} className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#fcdb00] transition-colors bg-white/50 px-5 py-2.5 rounded-full border border-white hover:border-[#f2f2f2]">Ver Catálogo <i className="fas fa-arrow-right"></i></button>
        </div>
        <div className={sec.layout === 'vertical' ? "flex flex-wrap gap-3 md:gap-5" : "flex overflow-x-auto gap-4 md:gap-6 no-scrollbar pb-8 snap-x mask-image-gradient pr-8"}>{secProducts.map((p, index) => renderProductCard(p, index, true, sec.layout))}</div>
        <button onClick={() => navigateTo('catalog')} className="md:hidden w-full mt-2 bg-white/70 backdrop-blur-xl border border-white shadow-sm text-[#111111] py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform font-poppins">ver todos los modelos <i className="fas fa-arrow-right text-[#fcdb00]"></i></button>
      </div>
    );
  };

  const renderHomeVidrieraSections = (onlySectionIds = null) => {
    const idSet = Array.isArray(onlySectionIds) ? new Set(onlySectionIds) : null;
    const sectionsToRender = idSet ? homeSections.filter(sec => idSet.has(sec.id)) : homeSections;
    if (sectionsToRender.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-[#f2f2f2] border-t-[#fcdb00] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-poppins"></p>
        </div>
      );
    }
    return sectionsToRender.map((sec, sectionIndex) => renderSingleHomeSection(sec, sectionIndex));
  };

  const renderOrderedHomeBlocks = () => {
    return normalizedHomeLayout
      .filter(block => block.active !== false)
      .map((block) => {
        if (block.id === 'community') {
          return <React.Fragment key="home-block-community">{renderCommunitySection()}</React.Fragment>;
        }
        const sec = homeSections.find(section => section.id === block.id);
        if (!sec) return null;
        return <React.Fragment key={`home-block-${block.id}`}>{renderSingleHomeSection(sec)}</React.Fragment>;
      });
  };

  const renderLegalPage = () => {
    const pageData = PAGE_CONTENT[currentView]; 
    if (!pageData) return null;
    
    return (
        <div className="min-h-screen py-16 px-4 md:py-24">
            <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-2xl p-8 md:p-16 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white animate-in fade-in slide-in-from-bottom-8 duration-700">
                <button 
                    onClick={() => navigateTo('home')} 
                    className="mb-10 text-[#111111] hover:text-[#fcdb00] transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest font-poppins"
                >
                    <i className="fas fa-arrow-left"></i> Volver a la Tienda
                </button>
                <div className="text-center mb-16">
                    <span className="text-[#fcdb00] font-bebas uppercase tracking-widest text-lg mb-2 block drop-shadow-sm">
                        {pageData.subtitle}
                    </span>
                    <h1 className="text-5xl md:text-6xl font-bebas text-[#111111] uppercase tracking-wide">
                        {pageData.title}
                    </h1>
                    <div className="w-24 h-1.5 bg-[#fcdb00] mx-auto mt-6 rounded-full"></div>
                </div>
                <div className="prose prose-gray max-w-none font-poppins">
                    {pageData.body}
                </div>
            </div>
        </div>
    );
  };
  return (
    <div className="bg-[#f8f8f8] text-[#111111] font-poppins flex flex-col relative min-h-screen selection:bg-[#fcdb00] selection:text-[#111111]">
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
          animation: marquee 85s linear infinite;
          will-change: transform;
        }

        /* --- ANIMACIÓN SHIMMER MEJORADA --- */
        @keyframes shimmerFull {
          0% { transform: translateX(-200px) skewX(-20deg); }
          100% { transform: translateX(500px) skewX(-20deg); }
        }
        .animate-shimmer-sweep {
          animation: shimmerFull 3s infinite linear;
        }

        .community-section-bleed {
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
          background: transparent;
        }

        /* --- SOLUCIÓN AL ZOOM MOLESTO EN CELULARES --- */
        @media screen and (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}} />

      {/* --- HEADER PRINCIPAL (NEGRO PURO #050505) --- */}
      <header className="bg-[#050505] text-white h-[72px] sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 shadow-lg border-b border-white/[0.06] transition-all duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="text-2xl hover:text-[#fcdb00] transition-colors p-2 md:hidden">
              <i className="fas fa-bars"></i>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-3 cursor-pointer group" onClick={() => {setActiveFilter({dept: 'all', cat: 'all'}); setCurrentView('home'); window.scrollTo(0,0);}}>
            <img src={CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
          </div>

          <div className="hidden md:flex items-center gap-6 ml-8 font-poppins text-xs font-bold uppercase tracking-widest">
            <button onClick={() => navigateTo('home')} className={`transition-colors ${currentView === 'home' ? 'text-[#fcdb00]' : 'text-gray-300 hover:text-white'}`}>Inicio</button>
            <button onClick={() => {setActiveFilter({dept: 'all', cat: 'all'}); navigateTo('catalog');}} className={`transition-colors ${currentView === 'catalog' ? 'text-[#fcdb00]' : 'text-gray-300 hover:text-white'}`}>Catálogo</button>
            <button onClick={() => setShowShippingCalculatorModal(true)} className="bg-white/10 text-white px-4 py-2 rounded-full hover:bg-[#fcdb00] hover:text-[#111111] transition-all flex items-center gap-2"><i className="fas fa-motorcycle text-sm"></i> Calcular Envío</button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:text-[#fcdb00] transition-colors">
              <i className="fas fa-shopping-bag text-2xl"></i>
              {getTotalItems() > 0 && (
                  <span className="absolute top-1.5 -right-1 bg-[#fcdb00] text-[#111111] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-[#111111]">
                      {getTotalItems()}
                  </span>
              )}
          </button>
        </div>
      </header>

      {/* --- BARRA CONTADOR OPTIMIZADA --- */}
      <CountdownBanner />

      {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] bg-[#111111]/90 backdrop-blur-xl text-white px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(252,219,0,0.2)] border border-[#fcdb00]/30 font-bold text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
              {toastMessage}
          </div>
      )}
      
      {fomoData && (
        <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[100] bg-[#111111]/95 backdrop-blur-md text-white p-3 md:p-4 rounded-2xl shadow-2xl border border-[#fcdb00]/30 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-500 hover:scale-105 transition-transform cursor-default">
          <div className="w-10 h-10 bg-[#fcdb00] rounded-full flex items-center justify-center text-[#111111] text-lg shadow-inner"><i className="fas fa-fire"></i></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-poppins">¡Venta en Vivo!</span>
            <span className="font-bebas text-lg md:text-xl tracking-wide uppercase leading-none mt-0.5 text-[#fcdb00]">
                <span className="text-white">{fomoData.name}</span> compró {fomoData.product}
            </span>
          </div>
        </div>
      )}

      {/* --- MENÚ MÓVIL (3 RAYITAS) --- */}
      {isMenuOpen && (<div className="fixed inset-0 z-[90] flex"><div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-md transition-opacity" onClick={() => setIsMenuOpen(false)}></div><div className="w-[85%] max-w-[380px] bg-[#f2f2f2] h-full relative z-10 animate-in slide-in-from-left duration-500 flex flex-col shadow-2xl rounded-r-[2rem] overflow-hidden"><div className="p-8 bg-[#111111] flex justify-between items-center text-white border-b border-white/10"><span className="font-bebas text-3xl tracking-wide uppercase">028<span className="text-[#fcdb00]">MENU</span></span><button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times text-lg"></i></button></div><div className="flex-1 overflow-y-auto pb-8"><div className="flex flex-col p-4 space-y-2">
        
        <div className="md:hidden mb-2">
            {!user || user.isAnonymous ? (
                <button onClick={handleGoogleLogin} className="w-full bg-[#111111] text-white p-4 rounded-2xl shadow-md font-black uppercase text-xs hover:bg-[#fcdb00] hover:text-[#111111] transition-all flex justify-center items-center gap-3"><i className="fab fa-google text-lg"></i> Iniciar sesión con Google</button>
            ) : (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center gap-3">
                    <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest text-center">Hola, {dbUser?.name?.split(' ')[0] || 'Cliente'}</p>
                </div>
            )}
        </div>
        
        <button onClick={() => { setShowShippingCalculatorModal(true); setIsMenuOpen(false); }} className="w-full bg-[#fcdb00] text-[#111111] p-4 rounded-2xl shadow-md font-black uppercase text-xs hover:bg-[#111111] hover:text-[#fcdb00] transition-all flex justify-center items-center gap-3 mb-2"><i className="fas fa-motorcycle text-lg"></i> Calcular Envío</button>
        
        <button onClick={() => { setActiveFilter({dept:'all', cat:'all'}); navigateTo('catalog'); }} className="text-left p-5 bg-white rounded-2xl shadow-sm border border-[#f2f2f2] font-black uppercase text-sm hover:border-[#fcdb00] hover:shadow-md flex justify-between items-center transition-all">Catálogo Completo <i className="fas fa-arrow-right text-[#fcdb00]"></i></button><div className="pt-6 pb-2 px-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest font-poppins">Departamentos</p></div>{departments.map(dept => { const isExpanded = expandedDept === dept; const deptCats = Array.from(new Set(products.filter(p => p.department === dept).map(p => p.category))); return (<div key={dept} className="bg-white rounded-2xl shadow-sm border border-[#f2f2f2] overflow-hidden transition-all"><button onClick={() => setExpandedDept(isExpanded ? null : dept)} className="w-full text-left p-5 font-black uppercase text-sm flex justify-between items-center transition-colors group">{dept} <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-300 group-hover:text-[#fcdb00] transition-colors`}></i></button><div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}><div className="bg-gray-50 flex flex-col pb-4 pt-2 border-t border-gray-100"><button onClick={() => { setActiveFilter({dept, cat: 'all'}); navigateTo('catalog'); }} className="text-left px-6 py-3 font-black text-xs text-[#111111] uppercase hover:text-[#fcdb00] transition-colors flex items-center gap-2"><i className="fas fa-layer-group text-gray-400"></i> Ver todo en {dept}</button>{deptCats.map(cat => (<button key={cat} onClick={() => { setActiveFilter({dept, cat}); navigateTo('catalog'); setTimeout(() => { const target = document.getElementById(slugify(cat)); if(target) target.scrollIntoView({behavior: 'smooth'}); }, 300); }} className="text-left px-6 py-3 font-bold text-xs text-gray-500 uppercase hover:text-[#111111] transition-colors pl-12 relative before:content-[''] before:w-1.5 before:h-1.5 before:bg-gray-300 before:rounded-full before:absolute before:left-7 before:top-1/2 before:-translate-y-1/2 hover:before:bg-[#fcdb00]">{cat}</button>))}</div></div></div>); })}
        
        <div className="pt-8 pb-2 px-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest font-poppins">Información Útil</p></div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#f2f2f2] p-2 space-y-1">
          <button onClick={() => { navigateTo('nosotros'); }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-[#fcdb00]"><i className="fas fa-users"></i></div> Quiénes Somos</button>
          <button onClick={() => { navigateTo('envios'); }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-[#fcdb00]"><i className="fas fa-truck"></i></div> Envíos y Logística</button>
          <button onClick={() => { navigateTo('pagos'); }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-[#fcdb00]"><i className="fas fa-credit-card"></i></div> Medios de Pago</button>
          <button onClick={() => { navigateTo('terminos'); }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-gray-400"><i className="fas fa-file-contract"></i></div> Legales y Términos</button>
          <button onClick={() => { navigateTo('arrepentimiento'); }} className="w-full text-left p-4 font-bold text-xs text-gray-600 uppercase hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#f2f2f2] flex items-center justify-center text-gray-400"><i className="fas fa-undo"></i></div> Botón de Arrepentimiento</button>
        </div>

        <div className="pt-8 pb-2 px-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest font-poppins text-center">Nuestras Redes</p></div>
        <div className="flex gap-4 justify-center pb-4">
          <a href="https://www.tiktok.com/@028.import" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:border-[#fcdb00] transition-all"><i className="fab fa-tiktok text-xl"></i></a>
          <a href="https://www.instagram.com/028.import" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:border-[#fcdb00] transition-all"><i className="fab fa-instagram text-xl"></i></a>
          <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:border-[#fcdb00] transition-all"><i className="fab fa-whatsapp text-xl"></i></a>
        </div>

        </div></div></div></div>)}

      {/* --- INICIO CONTENIDO --- */}
      {currentView === 'home' ? (
        <>
          <header className="relative w-full h-[35vh] md:h-[55vh] flex items-center justify-center bg-[#111111] overflow-hidden border-b border-[#111111]">
            <img src={CONFIG.bannerImage} alt="Banner 028" className="absolute inset-0 w-full h-full object-cover object-center" />
          </header>
          <main className="flex-grow px-4 md:px-8 pt-10 max-w-7xl mx-auto min-h-[50vh] pb-8 md:pb-16 w-full">
            <div className="md:hidden relative mb-12 reveal-on-scroll">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" placeholder="Buscar productos, marcas..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentView('catalog');}} className="w-full bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] pl-12 pr-6 py-4 rounded-2xl text-sm font-bold outline-none focus:border-[#fcdb00] focus:bg-white transition-all placeholder:text-gray-400 font-poppins" />
            </div>
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
            {renderOrderedHomeBlocks()}
          </main>
        </>
      ) : currentView === 'catalog' ? (
        <>
          <div className="bg-white/80 backdrop-blur-2xl sticky top-[72px] z-40 border-b border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-3 pb-3 transition-all duration-300">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                  <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => navigateTo('home')} className="text-gray-400 hover:text-[#111111] text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"><i className="fas fa-home"></i> Inicio</button>
                      <span className="text-gray-300 text-[10px]"><i className="fas fa-chevron-right"></i></span>
                      <span className="text-[#111111] font-bold uppercase tracking-widest text-[10px]">{activeFilter.dept !== 'all' ? activeFilter.dept : 'CATÁLOGO COMPLETO'}</span>
                  </div>
                  {uniqueCategories.length > 0 && (
                    <div className="flex overflow-x-auto gap-2.5 py-3 no-scrollbar pr-6 pl-1 -ml-1 mask-image-gradient">
                      <button onClick={() => {setActiveFilter({...activeFilter, cat: 'all'}); window.scrollTo({top: 0, behavior: 'smooth'});}} className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeFilter.cat === 'all' ? 'bg-[#111111] text-[#fcdb00] shadow-md' : 'bg-white border border-[#f2f2f2] text-gray-500 hover:bg-gray-50 hover:border-[#fcdb00]'}`}>Todos</button>
                      {uniqueCategories.map(cat => (
                        <button key={cat} onClick={() => { setActiveFilter({...activeFilter, cat: cat}); const target = document.getElementById(slugify(cat)); if(target) target.scrollIntoView({behavior: 'smooth'}); }} className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeFilter.cat === cat ? 'bg-[#111111] text-[#fcdb00] shadow-md' : 'bg-white border border-[#f2f2f2] text-gray-500 hover:bg-gray-50 hover:border-[#fcdb00]'}`}>{cat}</button>
                      ))}
                    </div>
                  )}
              </div>
          </div>
          <main className="flex-grow px-4 md:px-8 py-10 max-w-7xl mx-auto min-h-[50vh] pb-8 md:pb-16 w-full">
              {searchTerm && products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="text-center py-24 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white shadow-sm"><div className="w-20 h-20 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-6"><i className="fas fa-ghost text-3xl text-gray-400"></i></div><h3 className="text-3xl font-bebas uppercase tracking-wide text-[#111111] mb-2">No encontramos nada</h3><p className="text-xs uppercase tracking-widest text-gray-500 font-poppins">Intenta buscar otro sabor o marca.</p></div>
              )}
              {uniqueCategories.map(cat => renderProductSection(cat))}
          </main>
        </>
      ) : ( 
          <main className="flex-grow">
              {renderLegalPage()}
          </main> 
      )}

      <footer className="block bg-[#111111] text-white pt-8 md:pt-12 pb-6 md:pb-8 mt-auto relative z-30 rounded-t-[2rem] overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 mb-6 md:mb-10 text-xs md:text-sm">
                  <div className="space-y-6"><div className="flex items-center gap-3"><img src={CONFIG.logoImage} alt="028Import Logo" className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(252,219,0,0.25)]" /></div><p className="text-gray-400 font-medium leading-relaxed md:pr-4 font-poppins max-w-sm">Compra rápida, referencias reales y atención directa por WhatsApp.</p></div>
                  <div><h4 className="font-bebas text-[#fcdb00] text-xl md:text-2xl uppercase tracking-wider mb-4 md:mb-6">Contacto</h4><ul className="space-y-3 md:space-y-5 text-gray-300 font-poppins"><li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#fcdb00]"><i className="fab fa-whatsapp text-lg"></i></div><span className="text-base font-bold tracking-wider">11 5341 2358</span></li><li className="flex items-start gap-4 mt-2"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#fcdb00] flex-shrink-0"><i className="fas fa-location-dot text-lg"></i></div><span className="pt-1">Miñones & Juramento,<br/>Belgrano, CABA.</span></li></ul></div>
                  <div>
                    <h4 className="font-bebas text-[#fcdb00] text-xl md:text-2xl uppercase tracking-wider mb-4 md:mb-6">Información Legal</h4>
                    <ul className="space-y-3 md:space-y-4 text-gray-400 font-poppins font-medium">
                      <li><button onClick={() => navigateTo('nosotros')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Quiénes Somos</button></li>
                      <li><button onClick={() => navigateTo('envios')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Logística de Envío</button></li>
                      <li><button onClick={() => navigateTo('pagos')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-angle-right text-[#fcdb00] text-[10px]"></i> Medios de Pago</button></li>
                      <li><button onClick={() => navigateTo('terminos')} className="hover:text-white transition-colors flex items-center gap-2 mt-4 pt-4 border-t border-white/10"><i className="fas fa-file-contract text-gray-600 text-[10px]"></i> Términos y Condiciones</button></li>
                      <li><button onClick={() => navigateTo('privacidad')} className="hover:text-white transition-colors flex items-center gap-2"><i className="fas fa-shield-alt text-gray-600 text-[10px]"></i> Política de Privacidad</button></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bebas text-[#fcdb00] text-xl md:text-2xl uppercase tracking-wider mb-4 md:mb-6">Nuestras Redes</h4>
                    <div className="flex gap-4">
                      <a href="https://www.tiktok.com/@028.import" target="_blank" rel="noreferrer" className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(252,219,0,0.3)]"><i className="fab fa-tiktok text-2xl"></i></a>
                      <a href="https://www.instagram.com/028.import" target="_blank" rel="noreferrer" className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(252,219,0,0.3)]"><i className="fab fa-instagram text-2xl"></i></a>
                      <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#25D366] hover:text-white transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,211,102,0.3)]"><i className="fab fa-whatsapp text-2xl"></i></a>
                    </div>
                  </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center md:text-left gap-4 font-poppins">
                  <p>© {new Date().getFullYear()} 028IMPORT. Todos los derechos reservados.</p>
                  <div className="flex gap-4"><button onClick={() => navigateTo('arrepentimiento')} className="hover:text-white transition-colors underline underline-offset-4">Botón de Arrepentimiento</button></div>
              </div>
          </div>
      </footer>

      {/* --- MODAL PRODUCTO --- */}
      {selectedProduct && (
          <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-4 sm:p-6">
              <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-xl transition-opacity" onClick={() => setSelectedProduct(null)}></div>
              <div className="relative bg-[#f2f2f2] w-full max-w-4xl rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[90vh] border border-white/20">
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-2xl border border-white text-[#111111] rounded-full flex items-center justify-center hover:bg-[#fcdb00] hover:text-[#111111] transition-colors shadow-lg">
                      <i className="fas fa-times text-lg"></i>
                  </button>
                  <div className="w-full md:w-1/2 bg-white p-8 flex items-center justify-center relative min-h-[350px] border-r border-[#f2f2f2]">
                      {selectedProduct.tag && <span className="absolute top-8 left-8 bg-[#111111] text-[#fcdb00] font-bebas text-sm px-4 py-1.5 uppercase tracking-wider rounded-sm shadow-lg z-10">{selectedProduct.tag}</span>}
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full max-h-[450px] object-contain drop-shadow-2xl animate-in scale-95 duration-700 ease-out mix-blend-multiply" />
                  </div>
                  <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto bg-[#f2f2f2]">
                      <p className="text-[#fcdb00] font-bebas uppercase tracking-wider text-xl mb-1 drop-shadow-sm">{selectedProduct.category}</p>
                      <h2 className="text-5xl md:text-6xl font-bebas uppercase tracking-wide text-[#111111] leading-none mb-6">{selectedProduct.name}</h2>
                      <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed whitespace-pre-line font-poppins">{selectedProduct.description || "Experimenta la mejor calidad con nuestra selección de productos premium."}</p>
                      <div className="mt-auto border-t border-gray-300 pt-8">
                          <p className="text-[#111111] font-bebas text-5xl md:text-6xl tracking-wide mb-8 drop-shadow-sm">{CONFIG.currencySymbol}{formatPrice(selectedProduct.price)}</p>
                          {selectedProduct.inStock === false ? ( 
                              <button disabled className="w-full bg-gray-300 text-gray-500 py-4 text-lg font-bebas uppercase tracking-wider rounded-xl cursor-not-allowed border border-gray-400">Producto Agotado</button> 
                          ) : ( 
                              <button onClick={(e) => addToCart(selectedProduct, e)} className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-4 text-xl font-bebas uppercase tracking-wider rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(252,219,0,0.4)] transition-all duration-300 flex justify-center items-center gap-3 active:scale-95"><i className="fas fa-shopping-cart text-lg mb-0.5"></i> Agregar a la bolsa</button> 
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- DRAWER DEL CARRITO (BLINDADO ANTI-INSTAGRAM Y ANTI-TECLADO iOS) --- */}
      {isCartOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end items-center sm:justify-center p-0 md:p-4">
              {/* Fondo oscuro para cerrar */}
              <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
              
              {/* CAJA PRINCIPAL RÍGIDA: Exactamente 85% de alto (dinámico), flex column estricto */}
              <div className="relative bg-[#f2f2f2] w-full max-w-lg md:mx-auto rounded-t-[2rem] md:rounded-[2rem] max-h-[85dvh] h-full flex flex-col overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20 animate-in slide-in-from-bottom duration-300">
                  
                  {/* HEADER (Fijo arriba, no se achica) */}
                  <div className="p-5 md:p-6 border-b border-gray-300 flex justify-between items-center bg-white flex-shrink-0 z-10 shadow-sm">
                      <div>
                          <h2 className="text-3xl md:text-4xl font-bebas uppercase tracking-wide text-[#111111] leading-none mb-1">Tu Bolsa</h2>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-poppins">{getTotalItems()} artículos seleccionados</p>
                      </div>
                      <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-[#f2f2f2] rounded-full text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors flex items-center justify-center shadow-sm border border-gray-200"><i className="fas fa-times text-lg"></i></button>
                  </div>
                  
                  {/* CUERPO (Acá es donde el usuario hace scroll, se estira para llenar el espacio medio) */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar relative">
                      <div className="space-y-3 mb-4">
                          {cart.length === 0 && (
                              <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                                  <div className="w-16 h-16 bg-[#f2f2f2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><i className="fas fa-shopping-bag text-2xl text-gray-400"></i></div>
                                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest font-poppins">Tu bolsa está vacía</p>
                              </div>
                          )}
                          
                          {/* PRODUCTOS */}
                          {cart.map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-[#f9f9f9] p-3 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-200">
                                  <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-1">
                                          <img src={item.image} className="w-full h-full object-contain mix-blend-multiply" alt=""/>
                                      </div>
                                      <div className="flex flex-col">
                                          <p className="font-bebas text-lg uppercase tracking-wide max-w-[130px] md:max-w-[180px] line-clamp-1 text-[#111111]">{item.name}</p>
                                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 bg-white border border-gray-100 w-fit px-2 py-0.5 rounded-md font-poppins">{item.qty} un.</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4 pr-2">
                                      <p className="font-bebas text-[#fcdb00] text-2xl tracking-wide drop-shadow-sm">
                                          ${formatPrice(item.qty * (item.isUpsell ? item.upsellPrice : getUnitPromoPrice(item)))}
                                      </p>
                                      <div className="flex flex-col items-center gap-1.5 bg-white rounded-md p-1.5 border border-gray-200 shadow-sm">
                                          <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-[#111111] bg-gray-50 rounded-md hover:bg-[#fcdb00] transition-colors"><i className="fas fa-plus text-[10px]"></i></button>
                                          <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-[#111111] bg-gray-50 rounded-md hover:bg-[#fcdb00] transition-colors"><i className="fas fa-minus text-[10px]"></i></button>
                                      </div>
                                  </div>
                              </div>
                          ))}
        
                          {/* UPSELLS */}
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
                      </div>
                      
                      {/* FORMULARIOS */}
                      {cart.length > 0 && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                              {localRoulettePrize && localRoulettePrize.type !== 'none' && (
                                <div className="bg-[#111111] text-[#fcdb00] p-4 rounded-xl flex items-center justify-between border border-[#fcdb00]/30 shadow-md">
                                  <div className="flex items-center gap-4">
                                      <i className="fas fa-gift text-2xl"></i>
                                      <div className="flex flex-col">
                                          <span className="font-bold text-[10px] uppercase text-white">Premio Hot Sale</span>
                                          <span className="font-bebas text-xl block leading-none mt-1">{localRoulettePrize.text}</span>
                                      </div>
                                  </div>
                                  <i className="fas fa-check-circle text-2xl text-[#25D366]"></i>
                                </div>
                              )}
                              
                              <div className="bg-white p-6 rounded-[1.5rem] border border-[#f2f2f2] shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                                  <p className="font-bebas text-xl mb-4 uppercase tracking-wider text-[#111111] flex items-center gap-2"><i className="fas fa-user-circle text-[#fcdb00] text-xl"></i> Tus Datos</p>
                                  <div className="flex flex-col gap-3 font-poppins">
                                      <input type="text" placeholder="Nombre completo" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                                      <input type="tel" placeholder="Número de WhatsApp" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full p-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                                  </div>
                              </div>
                              
                              <div className="bg-white p-6 rounded-[1.5rem] border border-[#f2f2f2] shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                                  <p className="font-bebas text-xl mb-4 uppercase tracking-wider text-[#111111] flex items-center gap-2"><i className="fas fa-map-marked-alt text-[#fcdb00] text-xl"></i> Entrega</p>
                                  <div className="flex gap-2 mb-5 bg-[#f2f2f2] p-1.5 rounded-xl border border-gray-200 font-poppins">
                                      <button onClick={() => setDeliveryMethod('retiro')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryMethod === 'retiro' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Retiro Local</button>
                                      <button onClick={() => setDeliveryMethod('envio')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryMethod === 'envio' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Envío Domicilio</button>
                                  </div>
                                  
                                  {deliveryMethod === 'retiro' && (
                                    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 mt-4">
                                      <div className="bg-[#fcdb00]/10 border border-[#fcdb00] p-4 rounded-xl flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] flex-shrink-0"><i className="fas fa-store text-lg"></i></div>
                                        <div className="flex flex-col">
                                          <span className="font-bebas text-lg tracking-wide leading-none mb-1 text-[#111111]">Miñones & Juramento</span>
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
                                          <div className="flex flex-col"><span className={`font-bebas text-xl tracking-wide leading-none mb-1.5 ${shippingType === 'moto' ? 'text-[#111111]' : 'text-gray-700'}`}>Vía Motomensajería</span><span className="text-[10px] font-bold text-gray-500 leading-relaxed">⏲️ Horarios fijos: 13:00 y 18:00hs.</span></div>
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
                                            <input type="text" placeholder="Barrio / CP" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
                                          </div>
                                          <div className="relative mt-1">
                                            <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input type="text" placeholder="Piso / Depto (Opcional)" value={aptDetails} onChange={(e) => setAptDetails(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" />
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
                                            aptDetails={aptDetails}
                                            setAptDetails={setAptDetails}
                                          />
                                          <div className="flex flex-col gap-3 mt-2">
                                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">¿Cuándo querés recibirlo?</label>
                                            <div className="relative">
                                              <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                              <select value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#fcdb00] transition-all appearance-none cursor-pointer text-[#111111]">
                                                {next7Days.map(d => ( <option key={d.value} value={d.value}>{d.label}</option> ))}
                                              </select>
                                              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]"></i>
                                            </div>
                                            <div className="flex gap-2 bg-[#f2f2f2] p-1.5 rounded-xl border border-gray-200">
                                              <button onClick={() => setDeliveryTime('13:00')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryTime === '13:00' ? 'bg-white text-[#111111] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><i className="fas fa-sun"></i> Turno 13:00</button>
                                              <button onClick={() => setDeliveryTime('18:00')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryTime === '18:00' ? 'bg-white text-[#111111] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><i className="fas fa-moon"></i> Turno 18:00</button>
                                            </div>
                                          </div>

                                          <div className="flex flex-col gap-2 mt-2">
                                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">¿Cómo querés abonar?</label>
                                            <div className="flex gap-2 bg-[#f2f2f2] p-1.5 rounded-xl border border-gray-200">
                                              <button onClick={() => setPaymentMethod('transferencia')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${paymentMethod === 'transferencia' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><i className="fas fa-university"></i> Transferencia</button>
                                              <button onClick={() => setPaymentMethod('efectivo')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${paymentMethod === 'efectivo' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><i className="fas fa-money-bill-wave"></i> Efectivo</button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* FOOTER (Fijo abajo, NO se empuja por el scroll ni desaparece por la barra) */}
                  {cart.length > 0 && (
                      <div className="bg-white border-t border-gray-200 flex-shrink-0 z-20 pb-8 md:pb-6 pt-5 px-5 md:px-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                          <div className="flex justify-between items-end mb-4">
                              <span className="font-bold text-gray-500 text-[10px] uppercase tracking-widest font-poppins">Total a Pagar</span>
                              <span className="font-bebas text-5xl text-[#111111] tracking-wide leading-none drop-shadow-sm"><span className="text-[#fcdb00] text-3xl mr-1.5">{CONFIG.currencySymbol}</span>{formatPrice(calculateTotal())}</span>
                          </div>
                          <button onClick={handleCheckout} className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-95 font-bebas py-4 rounded-xl uppercase tracking-wider text-xl flex justify-center items-center gap-3 transition-all duration-300">
                              <i className="fas fa-check-circle text-2xl mb-0.5"></i> Confirmar Pedido
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- BOTONES FLOTANTES INDEPENDIENTES (Se esconden si el carrito se abre) --- */}

      {/* --- MODAL DE PAGO OFFLINE --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-[#111111] p-6 text-center relative border-b border-white/10">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times"></i></button>
              <div className="w-16 h-16 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <i className="fas fa-university text-3xl text-[#111111]"></i>
              </div>
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
                          <button onClick={copyAliasToClipboard} className="w-10 h-10 bg-[#f2f2f2] rounded-lg flex items-center justify-center text-[#111111] hover:bg-[#fcdb00] hover:text-[#111111] transition-colors flex-shrink-0">
                              <i className="fas fa-copy"></i>
                          </button>
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

      {/* --- MODAL DE CALCULADORA DE ENVÍO INDEPENDIENTE --- */}
      {showShippingCalculatorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowShippingCalculatorModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-[#111111] p-6 text-center relative border-b border-white/10">
                <button onClick={() => setShowShippingCalculatorModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#fcdb00] hover:text-[#111111] transition-colors"><i className="fas fa-times"></i></button>
                <div className="w-16 h-16 bg-[#fcdb00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <i className="fas fa-motorcycle text-3xl text-[#111111]"></i>
                </div>
                <h2 className="text-3xl font-bebas text-white uppercase tracking-wide">Cotizar Envío</h2>
                <p className="text-[#fcdb00] text-[11px] font-bold uppercase tracking-widest font-poppins">Solo válido para Motomensajería</p>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <CalculadorEnvio 
                  address={address} 
                  setAddress={setAddress} 
                  zone={zone} 
                  setZone={setZone} 
                  shippingType="moto" 
                  setShippingCost={setShippingCost} 
                  aptDetails={aptDetails} 
                  setAptDetails={setAptDetails} 
              />
              <button 
                  onClick={() => setShowShippingCalculatorModal(false)} 
                  className="w-full bg-[#111111] text-white hover:bg-[#fcdb00] hover:text-[#111111] py-4 rounded-xl font-bebas text-xl uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                  Listo
              </button>
            </div>
          </div>
        </div>
      )}

      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
}