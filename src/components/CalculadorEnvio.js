'use client';
import { useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

export default function CalculadorEnvio() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [datosEnvio, setDatosEnvio] = useState(null);

  const onLoad = (autoC) => setAutocomplete(autoC);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.formatted_address) return;

      const destino = place.formatted_address;
      
      // ⚠️ ACÁ TENÉS QUE PONER LA DIRECCIÓN EXACTA DE TU DEPÓSITO/LOCAL
      const origen = "Miñones 2061 Belgrano CABA"; 

      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [origen],
          destinations: [destino],
          travelMode: 'DRIVING',
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const distanciaMetros = response.rows[0].elements[0].distance.value;
            const distanciaKm = distanciaMetros / 1000;
            
            // 🧠 TU LÓGICA DE PRECIOS ACÁ
            let precioPorKm = 1000;
            if (distanciaKm >= 11) {
              precioPorKm = 900;
            }
            
            const costoTotal = Math.round(distanciaKm * precioPorKm);
            
            setDatosEnvio({
              km: distanciaKm.toFixed(1),
              precio: costoTotal,
              direccion: destino
            });

          } else {
            alert("Uy, no pudimos calcular la distancia a esa dirección. Revisá que esté bien escrita.");
          }
        }
      );
    }
  };

  if (!isLoaded) return <div className="p-4 text-center text-black font-bold">Cargando mapa de envíos... 🛵</div>;

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 mt-4 text-black shadow-sm">
      <h3 className="font-bold text-lg mb-2 text-green-700">🏍️ Motomensajería (CABA / GBA)</h3>
      <p className="text-sm text-gray-700 mb-3">
        Ingresá tu calle y altura para calcular el envío en el acto.
      </p>
      
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: "ar" },
        }}
      >
        <input
          type="text"
          placeholder="Ej: Avenida Santa Fe 1234, CABA"
          className="w-full p-3 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
        />
      </Autocomplete>

      {/* RESULTADO DEL CÁLCULO */}
      {datosEnvio && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
          <p className="text-sm text-green-800">📍 <strong>Destino:</strong> {datosEnvio.direccion}</p>
          <p className="text-sm text-green-800">📏 <strong>Distancia:</strong> {datosEnvio.km} km</p>
          <div className="mt-2 text-xl font-black text-green-900">
            Costo de envío: ${datosEnvio.precio.toLocaleString("es-AR")}
          </div>
        </div>
      )}
    </div>
  );
}s