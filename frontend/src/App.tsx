import {useQuery} from "@tanstack/react-query";
import {api} from "./api/client";
import Login from "./pages/Login";
import MirrorDashboard from "./pages/MirrorDashboard";
export default function App(){const me=useQuery({queryKey:["me"],queryFn:()=>api.get("/auth/me").then(r=>r.data),retry:false});if(me.isLoading)return <div className="boot">Ayna hazırlanıyor…</div>;return me.data?<MirrorDashboard user={me.data}/>:<Login/>}
