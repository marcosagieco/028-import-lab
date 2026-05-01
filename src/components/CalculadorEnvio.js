'use client';
import { useState, useCallback } from 'react';
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px',
  marginTop: '15px'
};

// Coordenadas de tu local (Miñones 2061, Belgrano)
const centerLocal = { lat: -34.5562, lng: -58.4445 };

export default function CalculadorEnvio() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [datosEnvio, setDatosEnvio] = useState(null);
  const [map, setMap] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);

  const onLoad = (autoC) => setAutocomplete(autoC);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.formatted_address) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const destinoCoords = { lat, lng };
      const destinoDireccion = place.formatted_address;

      const origen = "Miñones 2061, Belgrano, CABA"; 

      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [origen],
          destinations: [destinoCoords],
          travelMode: 'DRIVING',
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const distanciaMetros = response.rows[0].elements[0].distance.value;
            const distanciaKm = distanciaMetros / 1000;
            
            let precioPorKm = 1000;
            if (distanciaKm >= 11) {
              precioPorKm = 900;
            }
            
            const costoTotal = Math.round(distanciaKm * precioPorKm);
            
            setMarkerPos(destinoCoords);
            setDatosEnvio({
              km: distanciaKm.toFixed(1),
              precio: costoTotal,
              direccion: destinoDireccion
            });

            if (map) {
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend(centerLocal);
              bounds.extend(destinoCoords);
              map.fitBounds(bounds);
            }

          } else {
            alert("No pudimos calcular la distancia. Intentá con una dirección más precisa.");
          }
        }
      );
    }
  };

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // DISEÑO DE CARGA PROFESIONAL (SKELETON)
  if (!isLoaded) return (
    <div className="p-5 border border-gray-200 rounded-2xl bg-white mt-4 text-[#111111] shadow-sm">
      <h3 className="font-bebas text-2xl mb-1 uppercase tracking-wide flex items-center gap-2 text-gray-300">
        <i className="fas fa-motorcycle"></i> Calculá tu envío
      </h3>
      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">
        Conectando con el satélite...
      </p>
      <div className="w-full pl-4 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold text-gray-400 flex items-center gap-3">
        <i className="fas fa-circle-notch fa-spin text-[#fcdb00]"></i> Cargando mapa seguro...
      </div>
    </div>
  );

  return (
    <div className="p-5 border border-gray-200 rounded-2xl bg-white mt-4 text-[#111111] shadow-sm">
      <h3 className="font-bebas text-2xl mb-1 uppercase tracking-wide flex items-center gap-2">
        <i className="fas fa-motorcycle text-[#fcdb00]"></i> Calculá tu envío
      </h3>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
        Ingresá tu dirección para conocer el costo exacto
      </p>
      
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: "ar" } }}
      >
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Ej: Avenida Santa Fe 1234, CABA"
            className="w-full pl-10 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400"
          />
        </div>
      </Autocomplete>

      {/* MAPA GOOGLE */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={centerLocal}
        zoom={13}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        }}
      >
        <Marker position={centerLocal} />
        {markerPos && <Marker position={markerPos} />}
      </GoogleMap>

      {datosEnvio && (
        <div className="mt-4 p-4 bg-[#fcdb00]/10 border border-[#fcdb00] rounded-xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter mb-1">
                <i className="fas fa-route mr-1"></i> Distancia: {datosEnvio.km} km
              </p>
              <p className="font-bebas text-3xl text-[#111111] leading-none">
                Costo: ${datosEnvio.precio.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] shadow-md">
              <i className="fas fa-check"></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}