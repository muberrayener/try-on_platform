import axios from "axios";
function cookie(name:string){return document.cookie.split("; ").find(x=>x.startsWith(`${name}=`))?.split("=").slice(1).join("=")}
export const api=axios.create({baseURL:"/api/v1",withCredentials:true});
api.interceptors.request.use(config=>{const method=(config.method??"get").toUpperCase();if(["POST","PUT","PATCH","DELETE"].includes(method)){config.headers["X-CSRF-Token"]=decodeURIComponent(cookie("csrf_token")??"")}return config});
