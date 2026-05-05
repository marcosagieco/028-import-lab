'use client';
import { useState, useCallback } from 'react';
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '16px',
  marginTop: '15px'
};

const centerLocal = { lat: -34.5562, lng: -58.4445 };

export default function CalculadorEnvio({ address, setAddress, zone, setZone, aptDetails, setAptDetails, shippingType, setShippingCost }) {
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
      
      if (setAddress) setAddress(place.formatted_address);

      const components = place.address_components;
      let barrio = "CABA/GBA";
      if (components) {
        const subLocality = components.find(c => c.types.includes("sublocality_level_1") || c.types.includes("neighborhood"));
        const locality = components.find(c => c.types.includes("locality"));
        if (subLocality) barrio = subLocality.long_name;
        else if (locality) barrio = locality.long_name;
      }
      if (setZone) setZone(barrio);

      if (shippingType === 'moto') {
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: ["Miñones y juramento, Belgrano, CABA"],
            destinations: [destinoCoords],
            travelMode: 'DRIVING',
          },
          (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
              const distanciaKm = response.rows[0].elements[0].distance.value / 1000;
              let precioPorKm = 1000;
              if (distanciaKm >= 11) precioPorKm = 900;
              
              const costoTotalExacto = distanciaKm * precioPorKm;
              const costoTotalRedondeado = Math.ceil(costoTotalExacto / 100) * 100;
              
              setMarkerPos(destinoCoords);
              setDatosEnvio({ km: distanciaKm.toFixed(1), precio: costoTotalRedondeado });
              
              if (setShippingCost) setShippingCost(costoTotalRedondeado);

              if (map) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend(centerLocal);
                bounds.extend(destinoCoords);
                map.fitBounds(bounds);
              }
            }
          }
        );
      }
    }
  };

  const onMapLoad = useCallback((mapInstance) => setMap(mapInstance), []);

  if (!isLoaded) return (
    <div className="w-full p-4 bg-[#f2f2f2] rounded-xl text-xs font-bold text-gray-400 flex items-center gap-3">
      <i className="fas fa-circle-notch fa-spin text-[#fcdb00]"></i> Preparando sistema de envíos...
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: "ar" } }}
      >
        <div className="relative">
          <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#fcdb00]"></i>
          <input
            type="text"
            placeholder="Dirección completa (Calle y altura)"
            defaultValue={address}
            onChange={(e) => {
              if (setAddress) setAddress(e.target.value);
              if (e.target.value === '' && setShippingCost) setShippingCost(0);
            }}
            className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400"
          />
        </div>
      </Autocomplete>

      <div className="relative">
        <i className="fas fa-city absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          type="text"
          placeholder="Barrio / Localidad (Se autocompleta)"
          value={zone}
          onChange={(e) => setZone && setZone(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400"
        />
      </div>

      {/* --- EL INPUT DE DEPTO AHORA ESTÁ ACÁ ADENTRO, ANTES DEL MAPA --- */}
      <div className="relative">
        <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input 
          type="text" 
          placeholder="Piso / Depto / Torre (Opcional)" 
          value={aptDetails || ''} 
          onChange={(e) => setAptDetails && setAptDetails(e.target.value)} 
          className="w-full pl-11 pr-4 py-4 bg-[#f2f2f2] border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#fcdb00] transition-all placeholder:text-gray-400" 
        />
      </div>

      {shippingType === 'moto' && address && address.length > 5 && datosEnvio && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={centerLocal}
            zoom={13}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
            }}
          >
            <Marker position={centerLocal} />
            {markerPos && <Marker position={markerPos} />}
          </GoogleMap>

          <div className="mt-4 p-4 bg-[#fcdb00]/10 border border-[#fcdb00] rounded-xl flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">
                <i className="fas fa-route mr-1"></i> Recorrido: {datosEnvio.km} km
              </p>
              <p className="font-bebas text-2xl text-[#111111] leading-none">
                Costo de Envío: ${datosEnvio.precio.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center text-[#fcdb00] text-xs">
              <i className="fas fa-check"></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}