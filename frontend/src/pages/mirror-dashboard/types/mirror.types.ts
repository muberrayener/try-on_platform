
export type User={username:string;role:string;email?:string};
export type ImageStatus="uploaded"|"background_removal"|"ready"|"failed"|"deleted";
export type ImageItem={id:string;width:number;height:number;status:ImageStatus;background_removed:boolean;has_preview:boolean;error_code?:string|null;created_at:string};
export type Garment={id:string;name:string;category:string;image_key?:string;image_url?:string|null;status?:string;background_removed?:boolean;active?:boolean};
export type AccessoryItem={id:string; name:string; category?:string; imageUrl?:string; image_url?:string | null};
export type DailyPlan={id:string;time:string;title:string;active?:boolean};
export type Job={id:string;status:string;progress:number;has_result:boolean;garment_id:string};
export type MirrorView="base"|"result";
export type WeatherInfo={temp:number;code:number;isDay:number};
export type MakeupStyle="natural"|"rose"|"soft-glam"|"night";

export interface Lipstick {
  id: string;
  name: string;
  color: string;
  active: boolean;
  is_selected: boolean;
}