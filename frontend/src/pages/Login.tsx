import {FormEvent,useEffect,useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {Sparkles,UserPlus,LogIn,CheckCircle2} from "lucide-react";
import {api} from "../api/client";

type AuthMode = "login" | "register";

export default function Login(){
  const[mode,setMode]=useState<AuthMode>("login");
  const[login,setLogin]=useState("");
  const[password,setPassword]=useState("");
  const[regUsername,setRegUsername]=useState("");
  const[regEmail,setRegEmail]=useState("");
  const[regPassword,setRegPassword]=useState("");
  const[error,setError]=useState("");
  const[successMsg,setSuccessMsg]=useState("");
  const[loading,setLoading]=useState(false);
  const qc=useQueryClient();

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if(token){
      api.get(`/auth/verify-email?token=${token}`)
        .then(()=>{
          setSuccessMsg("E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.");
          setMode("login");
        })
        .catch(()=>{
          setError("E-posta doğrulama bağlantısı geçersiz veya süresi dolmuş.");
        });
    }
  },[]);

  async function handleLogin(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try{
      await api.post("/auth/login",{login,password});
      await qc.invalidateQueries({queryKey:["me"]});
    }catch(err:any){
      const detail = err?.response?.data?.detail;
      setError(detail || "Giriş bilgileri doğrulanamadı.");
    }finally{
      setLoading(false);
    }
  }

  async function handleRegister(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try{
      await api.post("/auth/register",{
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword
      });
      setSuccessMsg("Kayıt başarılı! Mailpit (http://localhost:8025) üzerinden gönderilen doğrulama bağlantısına tıklayarak hesabınızı onaylayın.");
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
    }catch(err:any){
      const detail = err?.response?.data?.detail;
      setError(detail || "Kayıt işlemi tamamlanamadı. Bilgilerinizi kontrol edin.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand">
          <Sparkles size={19}/> My Mirror
        </div>
        <h1>{mode === "login" ? "Kişisel stil alanına hoş geldin" : "Yeni hesap oluştur"}</h1>
        <p>{mode === "login" ? "Fotoğrafını yükle, kıyafet seç ve görünümünü sanal aynada dene." : "Aynanı kişiselleştirmek ve sanal denemelere başlamak için kaydol."}</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={()=>{setMode("login");setError("");setSuccessMsg("");}}
          >
            <LogIn size={15} style={{verticalAlign:"middle",marginRight:6}}/>
            Giriş Yap
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={()=>{setMode("register");setError("");setSuccessMsg("");}}
          >
            <UserPlus size={15} style={{verticalAlign:"middle",marginRight:6}}/>
            Kayıt Ol
          </button>
        </div>

        {successMsg && (
          <div className="form-success" style={{marginBottom:14}}>
            <CheckCircle2 size={16} style={{verticalAlign:"middle",marginRight:6}}/>
            {successMsg}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <label>
              Kullanıcı adı veya e-posta
              <input
                value={login}
                onChange={e=>setLogin(e.target.value)}
                placeholder="admin veya ornek@mail.com"
                required
              />
            </label>
            <label>
              Parola
              <input
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="Parolanız"
                required
              />
            </label>
            <button disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
            {error && <div className="form-error">{error}</div>}
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <label>
              Kullanıcı Adı
              <input
                value={regUsername}
                onChange={e=>setRegUsername(e.target.value)}
                placeholder="en az 3 karakter"
                minLength={3}
                maxLength={40}
                required
              />
            </label>
            <label>
              E-posta
              <input
                type="email"
                value={regEmail}
                onChange={e=>setRegEmail(e.target.value)}
                placeholder="ornek@alan.com"
                required
              />
            </label>
            <label>
              Parola
              <input
                type="password"
                value={regPassword}
                onChange={e=>setRegPassword(e.target.value)}
                placeholder="en az 10 karakter"
                minLength={10}
                maxLength={128}
                required
              />
              <span className="auth-hint">En az 10 karakter olmalıdır.</span>
            </label>
            <button disabled={loading}>
              {loading ? "Kaydediliyor…" : "Kayıt Ol"}
            </button>
            {error && <div className="form-error">{error}</div>}
          </form>
        )}
      </section>
    </main>
  );
}

