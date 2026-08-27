import { useEffect, useState } from "react";
import { WeatherInfo } from "../types/mirror.types";

const DEFAULT_WEATHER: WeatherInfo = { temp: 22, code: 1, isDay: 1 };
const FALLBACK_LOCATION = { lat: 41.0082, lon: 28.9784 };

export function useWeather() {
  const [weather, setWeather] = useState<WeatherInfo>(DEFAULT_WEATHER);

  useEffect(() => {
    async function loadWeather(lat: number, lon: number) {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`
        );
        const data = await response.json();
        if (data?.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            isDay: data.current.is_day,
          });
        }
      } catch {
        // Keep default weather.
      }
    }

    if (!navigator.geolocation) {
      loadWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadWeather(coords.latitude, coords.longitude),
      () => loadWeather(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lon)
    );
  }, []);

  return weather;
}
