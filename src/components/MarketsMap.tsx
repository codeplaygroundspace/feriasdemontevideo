'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { markets, dayNames, dayColors } from '../data/markets';
import { Market } from '../data/types';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different days
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#fff" cx="12.5" cy="12.5" r="6"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface MarketsMapProps {
  selectedDay?: string;
  selectedNeighborhood?: string;
}

const MarketsMap: React.FC<MarketsMapProps> = ({ selectedDay = 'all', selectedNeighborhood = 'all' }) => {

  // Get all unique markets with their days
  const allMarketsWithDays = useMemo(() => {
    const marketMap = new Map<string, { market: Market; days: string[] }>();
    
    Object.entries(markets).forEach(([day, dayMarkets]) => {
      dayMarkets.forEach(market => {
        const key = `${market.lat}-${market.lng}`;
        if (marketMap.has(key)) {
          marketMap.get(key)!.days.push(day);
        } else {
          marketMap.set(key, { market, days: [day] });
        }
      });
    });
    
    return Array.from(marketMap.values());
  }, []);

  // Filter markets based on selected day and neighborhood
  const filteredMarkets = useMemo(() => {
    return allMarketsWithDays.filter(({ market, days }) => {
      const dayMatch = days.includes(selectedDay);
      const neighborhoodMatch = selectedNeighborhood === 'all' || market.neighborhood === selectedNeighborhood;
      return dayMatch && neighborhoodMatch;
    });
  }, [allMarketsWithDays, selectedDay, selectedNeighborhood]);

  // Get the most common color for a market (if it appears on multiple days)
  const getMarketColor = (days: string[]) => {
    if (days.length === 1) {
      return dayColors[days[0]];
    }
    // For markets on multiple days, use the first day's color
    return dayColors[days[0]];
  };

  return (
    <div className="w-full h-full">
      {/* Map */}
      <div className="h-full w-full">
        <MapContainer
          center={[-34.9011, -56.1645]} // Montevideo center
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredMarkets.map(({ market, days }, index) => {
            const color = getMarketColor(days);
            const icon = createCustomIcon(color.replace('bg-', '#').replace('-400', ''));
            
            return (
              <Marker
                key={`${market.lat}-${market.lng}-${index}`}
                position={[market.lat, market.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {market.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      📍 {market.location}
                    </p>
                    <p className="text-sm text-blue-600 mb-3">
                      🏘️ {market.neighborhood.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Días disponibles:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {days.map(day => (
                          <span
                            key={day}
                            className={`px-2 py-1 rounded text-xs font-medium text-white ${dayColors[day]}`}
                          >
                            {dayNames[day]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MarketsMap;
