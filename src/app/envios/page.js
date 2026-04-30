import React from 'react';

export const metadata = {
  title: 'Envíos y Entregas | 028 IMPORT',
  description: 'Logística Premium. Envío Flex en el día CABA/GBA y envíos a toda Argentina.',
};

export default function EnviosPage() {
  return (
    <main className="min-h-screen py-16 px-4 md:py-24 bg-[#fafafa]">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
        
        <a href="/" className="mb-10 text-gray-400 hover:text-[#d4af37] transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
          <i className="fas fa-arrow-left"></i> Volver a la Tienda
        </a>

        <div className="text-center mb-16">
          <span className="text-[#d4af37] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs mb-4 block">Logística Premium</span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">Envíos y Entregas</h1>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto mt-8"></div>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
            <p className="text-lg font-medium text-black">Sabemos que la inmediatez es fundamental. Por ello, hemos diseñado un esquema logístico ágil, seguro y adaptado a sus necesidades.</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
              <h3 className="text-[#d4af37] font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2 mt-0"><i className="fas fa-bolt"></i> Envío Flex (En el día)</h3>
              <p className="text-sm m-0">Para zonas seleccionadas de CABA y GBA, ofrecemos un servicio de motomensajería prioritaria. Concretando su pedido antes de nuestro horario de corte, recibirá sus productos en sus manos el mismo día de la compra, con total discreción y cuidado.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
              <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2 mt-0"><i className="fas fa-plane"></i> Envíos a Toda Argentina</h3>
              <p className="text-sm m-0">Llegamos a cada rincón del país. Todos nuestros despachos nacionales se realizan a través de empresas de correo de primera línea. Su paquete será embalado con estrictas medidas de protección y contará con un número de seguimiento (Tracking) en tiempo real.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 my-6">
              <h3 className="text-black font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2 mt-0"><i className="fas fa-store"></i> Retiro Pick-Up</h3>
              <p className="text-sm m-0">Si prefiere gestionar el retiro de manera personal o enviar a su propia mensajería de confianza, puede seleccionar esta opción. Una vez preparado el pedido, le informaremos por WhatsApp la dirección exacta (Zona Belgrano) y la franja horaria habilitada.</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}