"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function Dashboard() {
  const sb = createClient(); const r = useRouter();
  const [forms,setForms]=useState<any[]>([]); const [loading,setLoading]=useState(true);

  async function load(){
    const { data } = await sb.from("forms").select("*").order("created_at",{ascending:false});
    setForms(data||[]); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function createForm(){
    const { data: { user } } = await sb.auth.getUser();
    if(!user) return r.push("/login");
    const { data } = await sb.from("forms")
      .insert({ owner_id:user.id, name:"Untitled form", schema:[] }).select().single();
    if(data) r.push(`/build/${data.id}`);
  }
  async function logout(){ await sb.auth.signOut(); r.push("/login"); }

  return (
    <main style={{maxWidth:860,margin:"0 auto",padding:"2.5rem 1.5rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <p className="label">FormCraft</p>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:"1rem"}}>
        <h1 style={{fontSize:"2.4rem"}}>Your forms</h1>
        <button className="btn btn-accent" onClick={createForm}>New form</button>
      </div>
      {loading ? <p className="sans" style={{color:"var(--muted)"}}>Loading…</p> :
        forms.length===0 ? <p className="sans" style={{color:"var(--muted)",marginTop:"2rem"}}>No forms yet. Create your first.</p> :
        <div style={{display:"grid",gap:".8rem",marginTop:"1.5rem"}}>
          {forms.map(f=>(
            <div key={f.id} className="card" style={{padding:"1.1rem 1.3rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h3 style={{margin:0,fontSize:"1.25rem"}}>{f.name}</h3>
                <p className="sans" style={{margin:".2rem 0 0",fontSize:".8rem",color:"var(--muted)"}}>
                  {(f.schema?.length||0)} fields · {f.published?"Published":"Draft"}
                </p>
              </div>
              <div style={{display:"flex",gap:".5rem"}} className="sans">
                <Link href={`/entries/${f.id}`} className="btn btn-ghost">Entries</Link>
                <Link href={`/build/${f.id}`} className="btn">Edit</Link>
              </div>
            </div>
          ))}
        </div>}
    </main>
  );
}
