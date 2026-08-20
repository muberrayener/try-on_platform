import {FormEvent,useEffect,useMemo,useRef,useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  CloudMoon,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Eye,
  Heart,
  Loader2,
  LogOut,
  Mic,
  MoreVertical,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Upload,
  UserRound,
  X,
  Aperture,
  Gem,
  Trash2
} from "lucide-react";
import {api} from "../api/client";

type User={username:string;role:string;email?:string};
type ImageStatus="uploaded"|"background_removal"|"ready"|"failed"|"deleted";
type ImageItem={id:string;width:number;height:number;status:ImageStatus;background_removed:boolean;has_preview:boolean;error_code?:string|null;created_at:string};
type Garment={id:string;name:string;category:string;image_key?:string;image_url?:string|null;active?:boolean};
type AccessoryItem={id:string; name:string; category?:string; imageUrl?:string; image_url?:string | null};
type Job={id:string;status:string;progress:number;has_result:boolean;garment_id:string};
type MirrorView="base"|"result";
type WeatherInfo={temp:number;code:number;isDay:number};

const categoryName:Record<string,string>={
  upper_body:"Üst giyim",
  lower_body:"Alt giyim",
  dress:"Elbise",
  kombin:"Kombin"
};

const accessoryCategoryName:Record<string,string>={
  earrings:"Küpe",
  necklace:"Kolye",
  bracelet:"Bileklik",
  watch:"Saat",
  ring:"Yüzük",
  other:"Diğer"
};

const lipstickShades = [
  {id:"1", name:"Vişne", color:"#8B2635"},
  {id:"2", name:"Klasik Kırmızı", color:"#C81D25"},
  {id:"3", name:"Gül Kurusu", color:"#B83B5E", selected:true},
  {id:"4", name:"Gül Pembesi", color:"#E27B8A"},
  {id:"5", name:"Nude Şeftali", color:"#F4B3A8"},
];

function WeatherIcon({code, isDay}:{code:number; isDay:number}){
  if(code === 0) return isDay ? <Sun className="weather-icon" size={24}/> : <Moon className="weather-icon" size={24}/>;
  if(code >= 1 && code <= 3) return isDay ? <CloudSun className="weather-icon" size={24}/> : <CloudMoon className="weather-icon" size={24}/>;
  if(code >= 45 && code <= 48) return <Cloud className="weather-icon" size={24}/>;
  if(code >= 51 && code <= 67) return <CloudRain className="weather-icon" size={24}/>;
  if(code >= 71 && code <= 77) return <CloudSnow className="weather-icon" size={24}/>;
  if(code >= 95) return <CloudLightning className="weather-icon" size={24}/>;
  return isDay ? <CloudSun className="weather-icon" size={24}/> : <CloudMoon className="weather-icon" size={24}/>;
}

export default function MirrorDashboard({user}:{user:User}){
  const qc=useQueryClient();
  const personInput=useRef<HTMLInputElement>(null);
  const garmentInput=useRef<HTMLInputElement>(null);
  
  const[person,setPerson]=useState<File>();
  const[garmentFile,setGarmentFile]=useState<File>();
  const[garmentPreviewUrl,setGarmentPreviewUrl]=useState<string | null>(null);
  const[garmentUploading,setGarmentUploading]=useState(false);
  const[garmentName,setGarmentName]=useState("Yeni parça");
  const[category,setCategory]=useState("upper_body");
  const[selectedGarment,setSelectedGarment]=useState("");
  const[adminOpen,setAdminOpen]=useState(false);
  const[wardrobeTab,setWardrobeTab]=useState<"list"|"add">("list");
  const[accessoryOpen,setAccessoryOpen]=useState(false);
  const[accessoryTab,setAccessoryTab]=useState<"list"|"add">("list");
  const[accessoryItems,setAccessoryItems]=useState<AccessoryItem[]>([]);
  const[accessoryName,setAccessoryName]=useState("Yeni aksesuar");
  const[accessoryCategory,setAccessoryCategory]=useState("other");
  const[accessoryFile,setAccessoryFile]=useState<File>();
  const[accessoryPreviewUrl,setAccessoryPreviewUrl]=useState<string | null>(null);
  const[accessoryInput,setAccessoryInput]=useState<HTMLInputElement | null>(null);
  const[profileOpen,setProfileOpen]=useState(false);
  const[uiError,setUiError]=useState("");
  const[uiSuccess,setUiSuccess]=useState("");
  const[mirrorView,setMirrorView]=useState<MirrorView>("base");
  const[selectedShade,setSelectedShade]=useState("3");
  const[appliedShade,setAppliedShade]=useState<string|null>(null);

  function normalizeAccessory(item: AccessoryItem): AccessoryItem {
    return {
      ...item,
      category: item.category ?? "other",
      imageUrl: item.imageUrl ?? item.image_url ?? ""
    };
  }

  // Canlı Saat & Tarih
  const[currentTime,setCurrentTime]=useState(new Date());
  useEffect(()=>{
    const clock = setInterval(()=>setCurrentTime(new Date()), 1000);
    return ()=>clearInterval(clock);
  },[]);

  useEffect(()=>{
    return () => {
      if(garmentPreviewUrl){
        URL.revokeObjectURL(garmentPreviewUrl);
      }
      if(accessoryPreviewUrl){
        URL.revokeObjectURL(accessoryPreviewUrl);
      }
    };
  }, [garmentPreviewUrl, accessoryPreviewUrl]);

  // Canlı Hava Durumu (Open-Meteo)
  const[weather,setWeather]=useState<WeatherInfo>({temp:22, code:1, isDay:1});
  useEffect(()=>{
    async function loadWeather(lat:number, lon:number){
      try{
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`);
        const d = await r.json();
        if(d?.current){
          setWeather({
            temp: Math.round(d.current.temperature_2m),
            code: d.current.weather_code,
            isDay: d.current.is_day
          });
        }
      }catch{
        // Varsayılan değer kalır
      }
    }

    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos => loadWeather(pos.coords.latitude, pos.coords.longitude),
        () => loadWeather(41.0082, 28.9784)
      );
    } else {
      loadWeather(41.0082, 28.9784);
    }
  },[]);

  const formattedTime = currentTime.toLocaleTimeString("tr-TR", {hour:"2-digit", minute:"2-digit"});
  const formattedDate = currentTime.toLocaleDateString("tr-TR", {day:"numeric", month:"long", weekday:"long"});

  const images=useQuery({
    queryKey:["images"],
    queryFn:()=>api.get<ImageItem[]>("/person-images").then(r=>r.data),
    refetchInterval:q=>q.state.data?.some(i=>i.status==="uploaded"||i.status==="background_removal")?1500:false
  });
  
  const garments=useQuery({
    queryKey:["garments"],
    queryFn:()=>api.get<Garment[]>("/garments").then(r=>r.data)
  });
  
  const accessories=useQuery({
    queryKey:["accessories"],
    queryFn:()=>api.get<AccessoryItem[]>("/accessories").then(r=>r.data.map(normalizeAccessory))
  });

  useEffect(()=>{
    if(accessories.data){
      setAccessoryItems(accessories.data);
    }
  }, [accessories.data]);

  const jobs=useQuery({
    queryKey:["jobs"],
    queryFn:()=>api.get<Job[]>("/tryons").then(r=>r.data),
    refetchInterval:2000
  });

  const readyImages=useMemo(
    ()=>[...(images.data??[])].filter(i=>i.status==="ready"&&i.background_removed&&i.has_preview).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()),
    [images.data]
  );

  const visibleGarments=useMemo(
    ()=>[...(garments.data ?? [])].filter(g => !!g.image_url),
    [garments.data]
  );
  
  const basePersonImage=readyImages[0];
  const processingImage=images.data?.find(i=>i.status==="uploaded"||i.status==="background_removal");
  const failedImage=images.data?.find(i=>i.status==="failed");
  const activeJob=jobs.data?.[0];

  useEffect(()=>{
    if(!visibleGarments.length){
      setSelectedGarment("");
      return;
    }

    const hasSelected = visibleGarments.some(g => g.id === selectedGarment);
    if(!selectedGarment || !hasSelected){
      setSelectedGarment(visibleGarments[0].id);
    }
  },[visibleGarments,selectedGarment]);

  useEffect(()=>{
    if(activeJob?.status==="completed"&&activeJob.has_result){
      setMirrorView("result");
    }
  },[activeJob?.id,activeJob?.status,activeJob?.has_result]);

  async function uploadPerson(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!person)return;
    setUiError("");
    const f=new FormData();
    f.append("image",person);
    try{
      await api.post("/person-images",f);
      setPerson(undefined);
      if(personInput.current)personInput.current.value="";
      await qc.invalidateQueries({queryKey:["images"]});
      setUiSuccess("Fotoğraf başarıyla yüklendi, arka plan hazırlanıyor.");
      setTimeout(()=>setUiSuccess(""), 4000);
    }catch{
      setUiError("Fotoğraf yüklenemedi.");
    }
  }

  async function addGarment(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!garmentFile){
      setUiError("Ürün görseli seçmeden kıyafet eklenemez.");
      setTimeout(()=>setUiError(""), 3500);
      return;
    }
    setGarmentUploading(true);
    const f=new FormData();
    f.append("name",garmentName);
    f.append("category",category);
    f.append("image",garmentFile);
    try{
      await api.post("/garments",f);
      setAdminOpen(false);
      setGarmentFile(undefined);
      setGarmentPreviewUrl(null);
      if(garmentInput.current)garmentInput.current.value="";
      await qc.invalidateQueries({queryKey:["garments"]});
      setUiSuccess("Yeni kıyafet gardıroba eklendi.");
      setTimeout(()=>setUiSuccess(""), 4000);
    }catch{
      setUiError("Kıyafet eklenemedi.");
    } finally {
      setGarmentUploading(false);
    }
  }

  async function deleteGarment(id:string){
    try{
      await api.delete(`/garments/${id}`);
      if(selectedGarment===id){
        setSelectedGarment("");
      }
      await qc.invalidateQueries({queryKey:["garments"]});
      setUiSuccess("Kıyafet gardıroptan kaldırıldı.");
      setTimeout(()=>setUiSuccess(""), 3500);
    }catch{
      setUiError("Kıyafet silinemedi.");
    }
  }

  async function addAccessoryItem(){
    if(!accessoryFile){
      setUiError("Aksesuar görseli seçmeden eklenemez.");
      setTimeout(()=>setUiError(""), 3500);
      return;
    }

    const form = new FormData();
    form.append("name", accessoryName.trim() || "Yeni aksesuar");
    form.append("category", accessoryCategory);
    form.append("image", accessoryFile);

    try{
      const response = await api.post<AccessoryItem>("/accessories", form);
      setAccessoryItems(prev => [normalizeAccessory(response.data), ...prev]);
      setAccessoryName("Yeni aksesuar");
      setAccessoryCategory("other");
      setAccessoryFile(undefined);
      setAccessoryPreviewUrl(null);
      if(accessoryInput) accessoryInput.value="";
      setUiSuccess("Aksesuar eklendi.");
      setTimeout(()=>setUiSuccess(""), 2500);
    }catch{
      setUiError("Aksesuar eklenemedi.");
    }
  }

  async function removeAccessoryItem(id:string){
    try{
      await api.delete(`/accessories/${id}`);
      setAccessoryItems(prev => prev.filter(item => item.id !== id));
      setUiSuccess("Aksesuar kaldırıldı.");
      setTimeout(()=>setUiSuccess(""), 2500);
    }catch{
      setUiError("Aksesuar silinemedi.");
    }
  }

  const createTryOn=useMutation({
    mutationFn:async()=>{
      if(!basePersonImage)throw new Error("Temel fotoğraf yok");
      setMirrorView("base");
      return api.post("/tryons",{person_image_id:basePersonImage.id,garment_id:selectedGarment});
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:["jobs"]}),
    onError:()=>setUiError("Try-on işlemi başlatılamadı.")
  });

  async function logout(){
    await api.post("/auth/logout");
    location.reload();
  }

  const currentShadeObj = lipstickShades.find(s=>s.id===selectedShade) || lipstickShades[2];

  return (
    <main className="mirror-room">
      <div className="room-backdrop" />
      <div className="ambient-glow glow-top" />
      <div className="ambient-glow glow-bottom" />

      <section className="smart-mirror">
        <div className="mirror-led-border" />
        
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
            <button
              className="circle-btn"
              type="button"
              title="Profil"
              onClick={()=>setProfileOpen(!profileOpen)}
            >
              <UserRound size={18} />
            </button>
            <button
              className="circle-btn"
              type="button"
              title="Ayarlar / Çıkış"
              onClick={()=>setProfileOpen(!profileOpen)}
            >
              <Settings size={18} />
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <b>{user.username}</b>
                  <small>{user.role === "admin" ? "Yönetici" : "Kullanıcı"}</small>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={()=>{personInput.current?.click();setProfileOpen(false);}}
                >
                  <Upload size={14} /> Yeni Fotoğraf Yükle
                </button>
                {user.role === "admin" && (
                  <button
                    className="dropdown-item"
                    onClick={()=>{setAdminOpen(true);setProfileOpen(false);}}
                  >
                    <Plus size={14} /> Kıyafet Ekle (Admin)
                  </button>
                )}
                <button className="dropdown-item logout" onClick={logout}>
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </header>

        {uiError && <div className="floating-toast error-toast">{uiError}</div>}
        {uiSuccess && <div className="floating-toast success-toast">{uiSuccess}</div>}

        <div className="mirror-grid">
          
          {/* SOL SÜTUN */}
          <aside className="mirror-col-left">
            
            {/* Widget 1: Makyaj Önerisi */}
            <article className="glass-panel widget-makeup">
              <div className="panel-header">
                <span>Makyaj önerisi</span>
                <Aperture size={15} className="header-icon" />
              </div>
              <div
                className="makeup-portrait-box"
                onClick={()=>personInput.current?.click()}
                title="Fotoğraf değiştirmek veya yüklemek için tıklayın"
              >
                {basePersonImage ? (
                  <img
                    className="makeup-portrait-img"
                    src={`/api/v1/person-images/${basePersonImage.id}/cutout`}
                    alt="Makyaj Görünümü (Yüz)"
                  />
                ) : processingImage ? (
                  <div className="portrait-state state-loading">
                    <Sparkles className="spin-slow" size={24} />
                    <small>Yüz taranıyor…</small>
                  </div>
                ) : (
                  <div className="default-face-portrait">
                    <img
                      className="makeup-portrait-img default-face-img"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                      alt="Model Yüz Portresi"
                      onError={(e)=>{
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="portrait-upload-badge">
                      <Camera size={13} />
                      <span>Değiştir</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="panel-footer-text">
                <b>Doğal ışıltı</b>
                <p>Günlük ve taze bir görünüm</p>
              </div>
            </article>

            {/* Widget 2: Ruj Tonu */}
            <article className="glass-panel widget-lipstick">
              <div className="panel-header">
                <span>Ruj tonu</span>
                <MoreVertical size={14} className="header-icon" />
              </div>
              <div className="lipstick-swatches">
                {lipstickShades.map(s=>(
                  <button
                    key={s.id}
                    type="button"
                    className={`lipstick-swatch ${selectedShade===s.id?"active":""}`}
                    style={{backgroundColor: s.color}}
                    onClick={()=>setSelectedShade(s.id)}
                    title={s.name}
                  />
                ))}
              </div>
              <div className="panel-footer-text">
                <b>{currentShadeObj.name}</b>
                <p>Yumuşak & Doğal</p>
              </div>
              <button
                type="button"
                className={`glass-action-btn ${appliedShade===selectedShade?"applied":""}`}
                onClick={()=>setAppliedShade(selectedShade)}
              >
                {appliedShade===selectedShade?"Uygulandı":"Uygula"}
              </button>
            </article>

            {/* Widget 3: Aksesuar Önerisi */}
            <article className="glass-panel widget-accessories">
              <div className="panel-header">
                <span>Aksesuar önerisi</span>
                <button
                  type="button"
                  className="diamond-open-btn"
                  title="Aksesuar Galerisi"
                  onClick={()=>{setAccessoryTab("list");setAccessoryOpen(true)}}
                >
                  <Gem size={14} className="header-icon" />
                </button>
              </div>
              <div className="accessories-row">
                {accessoryItems.slice(0, 3).map(item => (
                  <div key={item.id} className="accessory-chip" title={item.name}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="accessory-thumb" /> : <Gem size={18} />}
                  </div>
                ))}
              </div>
            </article>

            {/* Widget 4: Günün Planı */}
            <article className="glass-panel widget-timeline">
              <div className="panel-header">
                <span>Günün planı</span>
                <Sparkles size={14} className="header-icon" />
              </div>
              <ul className="mirror-timeline-list">
                <li><span className="time">09:00</span> <span className="dot">•</span> <span className="event">Toplantı</span></li>
                <li><span className="time">12:30</span> <span className="dot">•</span> <span className="event">Öğle Yemeği</span></li>
                <li><span className="time">15:00</span> <span className="dot">•</span> <span className="event">Sunum</span></li>
                <li><span className="time">18:30</span> <span className="dot">•</span> <span className="event">Pilates</span></li>
              </ul>
            </article>

          </aside>

          {/* ORTA SAHNE */}
          <section className="mirror-stage-center">
            <input
              ref={personInput}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e=>setPerson(e.target.files?.[0])}
            />
            {person && (
              <form className="pending-upload-bar" onSubmit={uploadPerson}>
                <span>Seçilen: {person.name}</span>
                <button type="submit" className="confirm-btn">Yükle</button>
                <button type="button" className="cancel-btn" onClick={()=>setPerson(undefined)}>İptal</button>
              </form>
            )}

            <div className="person-reflection-layer">
              {mirrorView==="result" && activeJob?.has_result ? (
                <img
                  className="reflection-figure result-anim"
                  src={`/api/v1/tryons/${activeJob.id}/result`}
                  alt="Try-on Sonucu"
                />
              ) : basePersonImage ? (
                <img
                  className="reflection-figure"
                  src={`/api/v1/person-images/${basePersonImage.id}/cutout`}
                  alt="Kişi Yansıması"
                />
              ) : (
                <div
                  className="empty-reflection-prompt"
                  onClick={()=>personInput.current?.click()}
                >
                  <div className="reflection-silhouette" />
                  <div className="upload-cta">
                    <Camera size={28} />
                    <span>Aynaya geçmek için tam boy fotoğrafını yükle</span>
                  </div>
                </div>
              )}
            </div>

            {activeJob && !activeJob.has_result && activeJob.status !== "failed" && (
              <div className="mirror-progress-badge">
                <Sparkles size={16} className="spin-slow" />
                <span>Kombin hazırlanıyor…</span>
                <b>%{activeJob.progress}</b>
                <div className="bar-track">
                  <div className="bar-fill" style={{width:`${activeJob.progress}%`}} />
                </div>
              </div>
            )}

            <div className="mirror-bottom-bar">
              {activeJob?.has_result && (
                <button
                  type="button"
                  className="glass-pill-toggle"
                  onClick={()=>setMirrorView(mirrorView==="result"?"base":"result")}
                >
                  {mirrorView==="result" ? (
                    <><RotateCcw size={14}/> Orijinale dön</>
                  ) : (
                    <><Eye size={14}/> Sonucu göster</>
                  )}
                </button>
              )}

              <div className="mic-controls-cluster">
                <button
                  type="button"
                  className="sub-ctrl-btn"
                  title="Fotoğraf Yükle"
                  onClick={()=>personInput.current?.click()}
                >
                  <Camera size={18} />
                </button>

                <button
                  type="button"
                  className="master-mic-btn"
                  title="Sesli Asistan"
                >
                  <div className="mic-outer-ring" />
                  <div className="mic-inner-core">
                    <Mic size={24} />
                  </div>
                </button>

                <button
                  type="button"
                  className="sub-ctrl-btn"
                  title="Stil Önerisi"
                  onClick={()=>setSelectedShade(String((Number(selectedShade)%5)+1))}
                >
                  <Sparkles size={18} />
                </button>
              </div>
            </div>
          </section>

          {/* SAĞ SÜTUN */}
          <aside className="mirror-col-right">
            <article className="glass-panel wardrobe-panel">
              <div className="wardrobe-header">
                <div>
                  <h2>Bugün ne giysem?</h2>
                  <p>Sana özel kombin önerileri</p>
                </div>
              </div>

              <div className="outfit-cards-list">
                {visibleGarments.length > 0 ? (
                  visibleGarments.map((g, idx) => {
                    const isSelected = selectedGarment === g.id;
                    return (
                      <div
                        key={g.id}
                        className={`outfit-card ${isSelected ? "selected" : ""}`}
                        onClick={()=>setSelectedGarment(g.id)}
                      >
                        <div className="outfit-badge">
                          {isSelected ? (
                            <div className="check-badge">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="heart-badge"
                              onClick={(e)=>{e.stopPropagation();}}
                            >
                              <Heart size={14} />
                            </button>
                          )}
                        </div>

                        <div className={`outfit-art-box theme-${idx % 3}`}>
                          {g.image_url ? (
                            <img
                              src={g.image_url}
                              alt={g.name}
                              className="outfit-wardrobe-image"
                            />
                          ) : (
                            <div className="outfit-mannequin">
                              <span className="outfit-initial">{g.name.slice(0, 1)}</span>
                            </div>
                          )}
                        </div>

                        <div className="outfit-info-overlay">
                          <b>{g.name}</b>
                          <small>{categoryName[g.category] || g.category}</small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="outfit-empty">
                    <p>Henüz kayıtlı kombin bulunamadı.</p>
                  </div>
                )}
              </div>

              <div className="wardrobe-actions">
                <button
                  type="button"
                  className="try-outfit-btn"
                  disabled={!basePersonImage || !selectedGarment || createTryOn.isPending}
                  onClick={()=>createTryOn.mutate()}
                >
                  <span>{createTryOn.isPending ? "Kombinleniyor…" : "Üzerimde dene"}</span>
                  <ChevronRight size={16} />
                </button>

                <div
                  className="more-link-btn"
                  onClick={()=>{setWardrobeTab("list");setAdminOpen(true);}}
                  title="Gardırobu Aç & Yönet"
                >
                  <span>Daha fazla</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </article>
          </aside>

        </div>
      </section>

      {/* Gardırop Yönetim Modalı (Kıyafet Ekleme & Çıkarma) */}
      {accessoryOpen && (
        <div className="modal-backdrop" onClick={()=>setAccessoryOpen(false)}>
          <div className="admin-modal-card accessory-mgmt-modal" onClick={e=>e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={()=>setAccessoryOpen(false)}
            >
              <X size={18} />
            </button>
            <span className="modal-eyebrow">AKSESUAR</span>
            <h2>Aksesuar Galerisi</h2>

            <div className="auth-tabs" style={{marginBottom: 16}}>
              <button
                type="button"
                className={`auth-tab ${accessoryTab === "list" ? "active" : ""}`}
                onClick={()=>setAccessoryTab("list")}
              >
                Listem ({accessoryItems.length})
              </button>
              <button
                type="button"
                className={`auth-tab ${accessoryTab === "add" ? "active" : ""}`}
                onClick={()=>{
                  setAccessoryTab("add");
                  setAccessoryName("Yeni aksesuar");
                  setAccessoryCategory("other");
                  setAccessoryFile(undefined);
                  setAccessoryPreviewUrl(null);
                  if(accessoryInput) accessoryInput.value = "";
                }}
              >
                <Plus size={14} style={{verticalAlign:"middle", marginRight: 4}}/>
                Yeni Ekle
              </button>
            </div>

            {accessoryTab === "list" && accessoryItems.length > 0 ? (
              <div className="wardrobe-items-manager">
                <div className="wardrobe-mgmt-list">
                  {accessoryItems.map(item => (
                    <div key={item.id} className="wardrobe-mgmt-item accessory-mgmt-item">
                      <div className="mgmt-item-visual">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="mgmt-item-thumb accessory-mgmt-thumb" /> : <Gem size={24} />}
                      </div>

                      <div className="mgmt-item-info">
                        <b>{item.name}</b>
                        <small>{accessoryCategoryName[item.category ?? "other"] || "Diğer"}</small>
                      </div>

                      <button
                        type="button"
                        className="mgmt-delete-btn"
                        title="Aksesuarı Kaldır"
                        onClick={()=>removeAccessoryItem(item.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : accessoryTab === "list" ? (
              <div className="wardrobe-mgmt-empty">
                <p>Henüz aksesuarınız yok.</p>
                <button
                  type="button"
                  className="glass-action-btn"
                  style={{marginTop: 10}}
                  onClick={()=>{
                    setAccessoryTab("add");
                    setAccessoryName("Yeni aksesuar");
                    setAccessoryFile(undefined);
                    setAccessoryPreviewUrl(null);
                    if(accessoryInput) accessoryInput.value = "";
                  }}
                >
                  İlk Aksesuarını Ekle
                </button>
              </div>
            ) : (
              <div className="accessory-add-form" style={{marginTop: 12}}>
              <label>
                Aksesuar Adı
                <input
                  value={accessoryName}
                  onChange={e=>setAccessoryName(e.target.value)}
                  placeholder="Örn: Altın Küpe"
                  required
                />

                <label>
                  Kategori
                  <select
                    value={accessoryCategory}
                    onChange={e=>setAccessoryCategory(e.target.value)}
                  >
                    <option value="earrings">Küpe</option>
                    <option value="necklace">Kolye</option>
                    <option value="bracelet">Bileklik</option>
                    <option value="watch">Saat</option>
                    <option value="ring">Yüzük</option>
                    <option value="other">Diğer</option>
                  </select>
                </label>
              </label>

              <input
                ref={node => setAccessoryInput(node)}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e=>{
                  const nextFile = e.target.files?.[0];
                  if(nextFile){
                    if(accessoryPreviewUrl){
                      URL.revokeObjectURL(accessoryPreviewUrl);
                    }
                    setAccessoryFile(nextFile);
                    setAccessoryPreviewUrl(URL.createObjectURL(nextFile));
                  } else {
                    setAccessoryFile(undefined);
                    setAccessoryPreviewUrl(null);
                  }
                }}
              />

              <button
                type="button"
                className="file-picker-btn"
                onClick={()=>accessoryInput?.click()}
              >
                <Upload size={16} />
                <span>{accessoryFile ? accessoryFile.name : "Aksesuar Görseli Seç"}</span>
              </button>

              {accessoryPreviewUrl && (
                <div className="garment-preview-box">
                  <img src={accessoryPreviewUrl} alt="Seçilen aksesuar önizlemesi" className="garment-preview-image" />
                </div>
              )}

              <button
                type="button"
                className="modal-submit-btn"
                disabled={!accessoryFile}
                onClick={addAccessoryItem}
              >
                Aksesuarı Ekle
              </button>
              </div>
            )}
          </div>
        </div>
      )}

      {adminOpen && (
        <div className="modal-backdrop" onClick={()=>setAdminOpen(false)}>
          <div className="admin-modal-card wardrobe-mgmt-modal" onClick={e=>e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={()=>setAdminOpen(false)}
            >
              <X size={18} />
            </button>
            <span className="modal-eyebrow">KİŞİSEL GARDIROP</span>
            <h2>Gardırop Yönetimi</h2>

            <div className="auth-tabs" style={{marginBottom: 16}}>
              <button
                type="button"
                className={`auth-tab ${wardrobeTab === "list" ? "active" : ""}`}
                onClick={()=>setWardrobeTab("list")}
              >
                Kıyafetlerim ({garments.data?.length || 0})
              </button>
              <button
                type="button"
                className={`auth-tab ${wardrobeTab === "add" ? "active" : ""}`}
                onClick={()=>setWardrobeTab("add")}
              >
                <Plus size={14} style={{verticalAlign:"middle", marginRight: 4}}/>
                Yeni Ekle
              </button>
            </div>

            {wardrobeTab === "list" ? (
              <div className="wardrobe-items-manager">
                {visibleGarments.length > 0 ? (
                  <div className="wardrobe-mgmt-list">
                    {visibleGarments.map(g => {
                      const selected = selectedGarment === g.id;

                      return (
                        <div
                          key={g.id}
                          className={`wardrobe-mgmt-item ${selected ? "selected" : ""}`}
                          onClick={()=>setSelectedGarment(g.id)}
                        >
                          <div className="mgmt-item-visual">
                            {g.image_url ? (
                              <img src={g.image_url} alt={g.name} className="mgmt-item-thumb" />
                            ) : (
                              <div className="mgmt-item-fallback">{g.name.slice(0, 1)}</div>
                            )}
                          </div>

                          <div className="mgmt-item-info">
                            <b>{g.name}</b>
                            <small>{categoryName[g.category] || g.category}</small>
                          </div>

                          <button
                            type="button"
                            className="mgmt-delete-btn"
                            title="Gardıroptan Çıkar"
                            onClick={(e)=>{e.stopPropagation(); deleteGarment(g.id);}}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="wardrobe-mgmt-empty">
                    <p>Gardırobunuzda henüz kıyafet yok.</p>
                    <button
                      type="button"
                      className="glass-action-btn"
                      style={{marginTop: 10}}
                      onClick={()=>setWardrobeTab("add")}
                    >
                      İlk Kıyafetini Ekle
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={addGarment} style={{display:"grid", gap: 12}}>
                <label>
                  Ürün Adı
                  <input
                    value={garmentName}
                    onChange={e=>setGarmentName(e.target.value)}
                    placeholder="Örn: Bej Keten Pantolon"
                    required
                  />
                </label>

                <label>
                  Kategori
                  <select
                    value={category}
                    onChange={e=>setCategory(e.target.value)}
                  >
                    <option value="upper_body">Üst Giyim</option>
                    <option value="lower_body">Alt Giyim</option>
                    <option value="dress">Elbise</option>
                    <option value="kombin">Kombin</option>
                  </select>
                </label>

                <input
                  ref={garmentInput}
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e=>{
                    const nextFile = e.target.files?.[0];
                    if(nextFile){
                      if(garmentPreviewUrl){
                        URL.revokeObjectURL(garmentPreviewUrl);
                      }
                      setGarmentFile(nextFile);
                      setGarmentPreviewUrl(URL.createObjectURL(nextFile));
                    } else {
                      setGarmentFile(undefined);
                      setGarmentPreviewUrl(null);
                    }
                  }}
                />

                <button
                  type="button"
                  className="file-picker-btn"
                  disabled={garmentUploading}
                  onClick={()=>garmentInput.current?.click()}
                >
                  {garmentUploading ? <Loader2 size={16} className="upload-spinner" /> : <Upload size={16} />}
                  <span>{garmentFile ? garmentFile.name : "Kıyafet Görseli Seç"}</span>
                </button>

                {garmentPreviewUrl && (
                  <div className="garment-preview-box">
                    <img
                      src={garmentPreviewUrl}
                      alt="Seçilen kıyafet önizlemesi"
                      className="garment-preview-image"
                    />
                  </div>
                )}

                {!garmentFile && (
                  <small className="form-helper-text">Ürün görseli zorunludur.</small>
                )}

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={!garmentFile || garmentUploading}
                >
                  {garmentUploading ? (
                    <span style={{display:"inline-flex", alignItems:"center", gap: 8}}>
                      <Loader2 size={16} className="upload-spinner" />
                      Yüklüyor...
                    </span>
                  ) : "Gardıroba Ekle"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

