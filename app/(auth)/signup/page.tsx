"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function Signup() {
  const r = useRouter(); const sb = createClient();
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState(""); const [msg,setMsg]=useState("");
  async function submit(){
    const { error } = await sb.auth.signUp({ email, password: pw });
    if (error) setErr(error.message);
    else setMsg("Check your email to confirm, then log in.");
  }
  return (
    <main style={{maxWidth:380,margin:"6rem auto",padding:"0 1.5rem"}}>
      <h1 style={{fontSize:"2rem"}}>Create account</h1>
      <div style={{display:"grid",gap:".7rem",marginTop:"1.5rem"}}>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="input" type="password" placeholder="Password (6+ chars)" value={pw} onChange={e=>setPw(e.target.value)}/>
        {err && <p style={{color:"var(--accent)",fontSize:".85rem"}} className="sans">{err}</p>}
        {msg && <p style={{color:"green",fontSize:".85rem"}} className="sans">{msg}</p>}
        <button className="btn btn-accent" onClick={submit}>Sign up</button>
        <p className="sans" style={{fontSize:".85rem",color:"var(--muted)"}}>
          Have an account? <Link href="/login" style={{color:"var(--accent)"}}>Log in</Link>
        </p>
      </div>
    </main>
  );
}
