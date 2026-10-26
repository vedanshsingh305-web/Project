import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Film, Sparkles, Loader2, Check } from 'lucide-react';
import { Theatre } from '../types';
import { api } from '../services/api';

export const TheatresPage: React.FC = () => {
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getTheatres()
      .then((res) => {
        if (res.success && res.data) {
          setTheatres(res.data);
        }
      })
      .catch((err) => console.error('Failed to load theatres:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Cinema Locations</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Explore our premier flagship auditoriums equipped with cutting-edge audiovisual systems
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-sm text-neutral-400 gap-3 items-center">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          <span>Locating cinema theatres...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {theatres.map((th) => (
            <div
              key={th._id}
              className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-5 hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-white">{th.name}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 uppercase">
                    {th.city}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{th.address}</span>
                  </div>
                  {th.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{th.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Screens */}
                {th.screens && th.screens.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                      Auditoriums ({th.screens.length})
                    </span>
                    <div className="space-y-1 text-xs">
                      {th.screens.map((scr) => (
                        <div
                          key={scr._id}
                          className="flex items-center justify-between py-1 px-2.5 rounded bg-neutral-950 border border-neutral-850"
                        >
                          <span className="text-neutral-300 font-medium">{scr.name}</span>
                          <span className="text-[10px] text-amber-400 font-bold">{scr.screenType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Facilities */}
              <div className="border-t border-neutral-800/80 pt-4">
                <span className="text-[11px] font-bold text-neutral-400 block mb-2 uppercase tracking-wider">
                  Cinema Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {th.facilities?.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300"
                    >
                      <Check className="w-3 h-3 text-red-500" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
