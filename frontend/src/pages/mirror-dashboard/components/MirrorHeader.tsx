import { LogOut, Plus, Settings, Upload, UserRound } from "lucide-react";
import WeatherIcon from "./WeatherIcon";
import { User, WeatherInfo } from "../types/mirror.types";

interface Props {
  user: User;
  weather: WeatherInfo;
  formattedTime: string;
  formattedDate: string;
  profileOpen: boolean;
  onToggleProfile: () => void;
  onUploadPerson: () => void;
  onOpenWardrobe: () => void;
  onLogout: () => void;
}

export function MirrorHeader({ user, weather, formattedTime, formattedDate, profileOpen, onToggleProfile, onUploadPerson, onOpenWardrobe, onLogout }: Props) {
  return (
    <header className="mirror-header-exact">
      <div className="weather-widget">
        <WeatherIcon code={weather.code} isDay={weather.isDay} />
        <div className="weather-text">
          <span className="weather-temp">{weather.temp}°</span>
          <span className="weather-date">{formattedDate}</span>
          <span className="weather-time">{formattedTime}</span>
        </div>
      </div>

      <div className="greeting-widget">
        <h1>Merhaba, {user.username || "İpek"}</h1>
        <p>Günün güzel geçecek!</p>
      </div>

      <div className="header-controls">
        <button className="circle-btn" type="button" title="Profil" onClick={onToggleProfile}>
          <UserRound size={18} />
        </button>
        <button className="circle-btn" type="button" title="Ayarlar / Çıkış" onClick={onToggleProfile}>
          <Settings size={18} />
        </button>

        {profileOpen && (
          <div className="profile-dropdown">
            <div className="profile-info">
              <b>{user.username}</b>
              <small>{user.role === "admin" ? "Yönetici" : "Kullanıcı"}</small>
            </div>
            <div className="dropdown-divider" />
            <button className="dropdown-item" type="button" onClick={onUploadPerson}>
              <Upload size={14} /> Yeni Fotoğraf Yükle
            </button>
            {user.role === "admin" && (
              <button className="dropdown-item" type="button" onClick={onOpenWardrobe}>
                <Plus size={14} /> Kıyafet Ekle (Admin)
              </button>
            )}
            <button className="dropdown-item logout" type="button" onClick={onLogout}>
              <LogOut size={14} /> Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
