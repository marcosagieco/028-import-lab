import React from 'react';

export const metadata = {
  title: 'Nuestra Esencia | 028 IMPORT',
  description: 'Conocé 028 IMPORT. Brindamos una experiencia de exclusividad, confianza y absoluta prioridad al tiempo de nuestros clientes.',
};

export default function NosotrosPage() {
  return (
    <main className="min-h-screen py-16 px-4 md:py-24 bg-[#fafafa]">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
        
        <a href="/" className="mb-10 text-gray-400 hover:text-[#d4af37] transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
          <i className="fas fa-arrow-left"></i> Volver a la Tienda
        </a>

        <div className="text-center mb-16">
          <span className="text-[#d4af37] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs mb-4 block">Acerca de 028 IMPORT</span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">Nuestra Esencia</h1>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto mt-8"></div>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base">
            <p className="text-xl font-medium text-black leading-snug">En 028 IMPORT no solo entregamos productos; brindamos una experiencia de exclusividad, confianza y absoluta prioridad al tiempo de nuestros clientes.</p>
            <p>Nacimos con el firme propósito de establecer un nuevo estándar en la importación y distribución de artículos premium. Entendemos que el lujo moderno no se trata únicamente de lo que adquieres, sino de cómo lo adquieres. Por ello, hemos diseñado un ecosistema de atención al cliente meticuloso, donde la amabilidad, la inmediatez y la transparencia son nuestros pilares innegociables.</p>
            <p>Nuestro catálogo es el resultado de una curaduría exhaustiva. Cada marca y cada modelo que ofrecemos ha sido seleccionado bajo los más estrictos controles de calidad e idoneidad, garantizando a nuestros usuarios el acceso a lo mejor del mercado global sin intermediarios innecesarios y con la certeza de un origen 100% legítimo.</p>
            
            <div className="border-l-4 border-[#d4af37] pl-6 py-4 my-10 bg-gray-50 rounded-r-2xl">
              <p className="italic text-gray-800 text-lg font-medium m-0">"Creemos firmemente que el tiempo de nuestro cliente es su activo más valioso. Por eso, nuestro compromiso es la excelencia y la velocidad en cada entrega."</p>
            </div>
            
            <p>Agradecemos tu confianza y te damos la bienvenida a la experiencia 028.</p>
          </div>
        </div>

      </div>
    </main>
  );
}