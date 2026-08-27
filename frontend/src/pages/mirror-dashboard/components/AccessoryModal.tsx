import {ChangeEvent,useRef} from "react";
import {Gem,Plus,Trash2,Upload,X} from "lucide-react";
import {AccessoryItem} from "../types/mirror.types";
import {accessoryCategoryName} from "../constants/mirror.constants";

type AccessoryModalProps={
  items:AccessoryItem[];
  tab:"list"|"add";
  name:string;
  category:string;
  file?:File;
  previewUrl:string|null;
  onTabChange:(tab:"list"|"add")=>void;
  onNameChange:(value:string)=>void;
  onCategoryChange:(value:string)=>void;
  onFileChange:(event:ChangeEvent<HTMLInputElement>)=>void;
  onAdd:()=>void;
  onRemove:(id:string)=>void;
  onResetAdd:()=>void;
  onClose:()=>void;
};

export default function AccessoryModal({items,tab,name,category,file,previewUrl,onTabChange,onNameChange,onCategoryChange,onFileChange,onAdd,onRemove,onResetAdd,onClose}:AccessoryModalProps){
  const inputRef=useRef<HTMLInputElement>(null);
  return(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card accessory-mgmt-modal" onClick={event=>event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        <span className="modal-eyebrow">AKSESUAR</span>
        <h2>Aksesuar Galerisi</h2>

        <div className="auth-tabs" style={{marginBottom:16}}>
          <button type="button" className={`auth-tab ${tab==="list"?"active":""}`} onClick={()=>onTabChange("list")}>
            Listem ({items.length})
          </button>
          <button type="button" className={`auth-tab ${tab==="add"?"active":""}`} onClick={()=>{onTabChange("add");onResetAdd();}}>
            <Plus size={14} style={{verticalAlign:"middle",marginRight:4}} /> Yeni Ekle
          </button>
        </div>

        {tab==="list"&&items.length>0&&(
          <div className="wardrobe-items-manager"><div className="wardrobe-mgmt-list">
            {items.map(item=>(
              <div key={item.id} className="wardrobe-mgmt-item accessory-mgmt-item">
                <div className="mgmt-item-visual">
                  {item.imageUrl?<img src={item.imageUrl} alt={item.name} className="mgmt-item-thumb accessory-mgmt-thumb" />:<Gem size={24} />}
                </div>
                <div className="mgmt-item-info"><b>{item.name}</b><small>{accessoryCategoryName[item.category??"other"]||"Diğer"}</small></div>
                <button type="button" className="mgmt-delete-btn" title="Aksesuarı Kaldır" onClick={()=>onRemove(item.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div></div>
        )}

        {tab==="list"&&!items.length&&(
          <div className="wardrobe-mgmt-empty">
            <p>Henüz aksesuarınız yok.</p>
            <button type="button" className="glass-action-btn" style={{marginTop:10}} onClick={()=>{onTabChange("add");onResetAdd();}}>İlk Aksesuarını Ekle</button>
          </div>
        )}

        {tab==="add"&&(
          <div className="accessory-add-form" style={{marginTop:12}}>
            <label>Aksesuar Adı<input value={name} onChange={event=>onNameChange(event.target.value)} placeholder="Örn: Altın Küpe" required /></label>
            <label>Kategori
              <select value={category} onChange={event=>onCategoryChange(event.target.value)}>
                <option value="earrings">Küpe</option><option value="necklace">Kolye</option><option value="bracelet">Bileklik</option><option value="watch">Saat</option><option value="ring">Yüzük</option><option value="other">Diğer</option>
              </select>
            </label>
            <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} />
            <button type="button" className="file-picker-btn" onClick={()=>inputRef.current?.click()}><Upload size={16} /><span>{file?file.name:"Aksesuar Görseli Seç"}</span></button>
            {previewUrl&&<div className="garment-preview-box"><img src={previewUrl} alt="Seçilen aksesuar önizlemesi" className="garment-preview-image" /></div>}
            <button type="button" className="modal-submit-btn" disabled={!file} onClick={onAdd}>Aksesuarı Ekle</button>
          </div>
        )}
      </div>
    </div>
  );
}
