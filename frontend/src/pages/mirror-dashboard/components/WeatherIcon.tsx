import {
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";

export default function WeatherIcon({
  code,
  isDay,
}: {
  code: number;
  isDay: number;
}) {
  if (code === 0) {
    return isDay ? (
      <Sun className="weather-icon" size={24} />
    ) : (
      <Moon className="weather-icon" size={24} />
    );
  }

  if (code >= 1 && code <= 3) {
    return isDay ? (
      <CloudSun className="weather-icon" size={24} />
    ) : (
      <CloudMoon className="weather-icon" size={24} />
    );
  }

  if (code >= 45 && code <= 48) {
    return (
      <Cloud
        className="weather-icon"
        size={24}
      />
    );
  }

  if (code >= 51 && code <= 67) {
    return (
      <CloudRain
        className="weather-icon"
        size={24}
      />
    );
  }

  if (code >= 71 && code <= 77) {
    return (
      <CloudSnow
        className="weather-icon"
        size={24}
      />
    );
  }

  if (code >= 95) {
    return (
      <CloudLightning
        className="weather-icon"
        size={24}
      />
    );
  }

  return isDay ? (
    <CloudSun
      className="weather-icon"
      size={24}
    />
  ) : (
    <CloudMoon
      className="weather-icon"
      size={24}
    />
  );
}