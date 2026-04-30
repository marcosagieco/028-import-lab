import './globals.css'; 
import Script from 'next/script';

const CONFIG = {
  brandName: "028", 
  logoImage: "https://i.postimg.cc/jS33XBZm/028logo-convertido-de-jpeg-removebg-preview.png", 
  whatsappNumber: "5491153412358",
};

export const metadata = {
  title: '028 IMPORT',
  description: 'Tienda de productos premium',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href={CONFIG.logoImage} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className="bg-[#fafafa] text-[#1a1a1a] font-sans flex flex-col relative min-h-screen">
        
        {/* === GOOGLE ANALYTICS === */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-ZY044XNNSC" 
          strategy="afterInteractive" 
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZY044XNNSC');
          `}
        </Script>
        
        {/* === CONTENIDO PRINCIPAL === */}
        {/* Al sacar el <nav> de acá, la ÚNICA barra que va a aparecer es la nueva que armamos en tu página principal */}
        <div className="flex-grow">
          {children}
        </div>

      </body>
    </html>
  );
}