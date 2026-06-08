"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Field } from "@/lib/field-types";

export default function PublicForm(){
  const { id } = useParams<{id:string}>(); const sb = createClient();
  const [form,setForm]=useState<any>(null); const [vals,setVals]=useState<Record<string,any>>({});
  const [done,setDone]=useState(false); const [err,setErr]=useState(""); const [notfound,setNotfound]=useState(false);

  useEffect(()=>{(async()=>{
    const { data } = await sb.from("forms").select("*").eq("id",id).eq("published",true).single();
    if(data) setForm(data); else setNotfound(true);
  })();},[id]);

  async function submit(){
    setErr("");
    for(const f of form.schema as Field[]){
      if(f.required && !vals[f.id]){ setErr(`"${f.label}" is required`); return; }
    }
    const { error } = await sb.from("entries").insert({ form_id:id, data:vals });
    if(error) setErr(error.message); else setDone(true);
  }

  if(notfound) return <main style={{maxWidth:560,margin:"6rem auto",padding:"0 1.5rem"}}><h1>Form not found</h1><p className="sans" style={{color:"var(--muted)"}}>This form may be unpublished.</p></main>;
  if(!form) return <main style={{maxWidth:560,margin:"6rem auto",padding:"0 1.5rem"}} className="sans">Loading…</main>;
  if(done) return <main style={{maxWidth:560,margin:"6rem auto",padding:"0 1.5rem"}}><h1>Thank you</h1><p className="sans" style={{color:"var(--muted)"}}>Your response was recorded.</p></main>;

  return (
    <main style={{maxWidth:560,margin:"3.5rem auto",padding:"0 1.5rem"}}>
      <h1 style={{fontSize:"2.2rem"}}>{form.name}</h1>
      {form.description && <p className="sans" style={{color:"var(--muted)"}}>{form.description}</p>}
      <div style={{display:"grid",gap:"1.1rem",marginTop:"1.5rem"}}>
        {(form.schema as Field[]).map(f=>(
          <div key={f.id}>
            <label className="sans" style={{display:"block",marginBottom:".35rem",fontSize:".9rem"}}>
              {f.label}{f.required && <span style={{color:"var(--accent)"}}> *</span>}
            </label>
            {f.type==="textarea" ? <textarea className="input" rows={4} onChange={e=>setVals(v=>({...v,[f.id]:e.target.value}))}/>
            : f.type==="select" ? <select className="input" onChange={e=>setVals(v=>({...v,[f.id]:e.target.value}))}>
                <option value="">Select…</option>{(f.options||[]).map(o=><option key={o}>{o}</option>)}</select>
            : f.type==="checkbox" ? <label className="sans" style={{display:"flex",gap:".5rem"}}>
                <input type="checkbox" onChange={e=>setVals(v=>({...v,[f.id]:e.target.checked}))}/> Yes</label>
            : <input className="input" type={f.type==="number"?"number":f.type==="date"?"date":f.type==="email"?"email":"text"}
                onChange={e=>setVals(v=>({...v,[f.id]:e.target.value}))}/>}
          </div>
        ))}
        {err && <p className="sans" style={{color:"var(--accent)",fontSize:".85rem"}}>{err}</p>}
        <button className="btn btn-accent" onClick={submit}>Submit</button>
      </div>
    </main>
  );
}
