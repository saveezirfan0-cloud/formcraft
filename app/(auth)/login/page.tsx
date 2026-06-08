"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function Login() {
  const r = useRouter(); const sb = createClient();
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  async function submit(){
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) setErr(error.message); else r.push("/dashboard");
  }
  return (
    <main style={{maxWidth:380,margin:"6rem auto",padding:"0 1.5rem"}}>
      <h1 style={{fontSize:"2rem"}}>Welcome back</h1>
      <div style={{display:"grid",gap:".7rem",marginTop:"1.5rem"}}>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="input" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)}/>
        {err && <p style={{color:"var(--accent)",fontSize:".85rem"}} className="sans">{err}</p>}
        <button className="btn btn-accent" onClick={submit}>Log in</button>
        <p className="sans" style={{fontSize:".85rem",color:"var(--muted)"}}>
          No account? <Link href="/signup" style={{color:"var(--accent)"}}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
