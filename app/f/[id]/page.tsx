"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Field } from "@/lib/field-types";
import SignaturePad from "@/components/SignaturePad";

export default function PublicForm(){
  const { id } = useParams<{id:string}>(); const sb = createClient();
  const [form,setForm]=useState<any>(null); const [vals,setVals]=useState<Record<string,any>>({});
  const [done,setDone]=useState(false); const [err,setErr]=useState(""); const [notfound,setNotfound]=useState(false);
  const [uploading,setUploading]=useState(false);

  useEffect(()=>{(async()=>{
    const { data } = await sb.from("forms").select("*").eq("id",id).eq("published",true).single();
    if(data) setForm(data); else setNotfound(true);
  })();},[id]);

  async function uploadFile(file:File|undefined):Promise<string|null>{
    if(!file) return null;
    setUploading(true); setErr("");
    const path = `${id}/${Date.now()}_${file.name.replace(/[^\w.\-]/g,"_")}`;
    const { error } = await sb.storage.from("form-uploads").upload(path, file);
    setUploading(false);
    if(error){ setErr("Upload failed: "+error.message); return null; }
    return sb.storage.from("form-uploads").getPublicUrl(path).data.publicUrl;
  }

  // Generic value setter that works for top-level fields and group rows.
  // For a group child: scope = {gid, rowIdx}; otherwise undefined.
  function setVal(fid:string, value:any, scope?:{gid:string,rowIdx:number}){
    setVals(v=>{
      if(!scope) return { ...v, [fid]: value };
      const rows = Array.isArray(v[scope.gid]) ? [...v[scope.gid]] : [];
      rows[scope.rowIdx] = { ...(rows[scope.rowIdx]||{}), [fid]: value };
      return { ...v, [scope.gid]: rows };
    });
  }
  function getVal(fid:string, scope?:{gid:string,rowIdx:number}){
    if(!scope) return vals[fid];
    return vals[scope.gid]?.[scope.rowIdx]?.[fid];
  }

  function addRow(g:Field){
    setVals(v=>({ ...v, [g.id]: [...(Array.isArray(v[g.id])?v[g.id]:[]), {}] }));
  }
  function removeRow(g:Field, i:number){
    setVals(v=>({ ...v, [g.id]: (v[g.id]||[]).filter((_:any,j:number)=>j!==i) }));
  }

  function toggleOption(fid:string, opt:string, on:boolean, scope?:{gid:string,rowIdx:number}){
    const cur:string[] = Array.isArray(getVal(fid,scope)) ? getVal(fid,scope) : [];
    setVal(fid, on ? [...cur,opt] : cur.filter(x=>x!==opt), scope);
  }

  // Render a single input field (used both top-level and inside group rows)
  function renderInput(f:Field, scope?:{gid:string,rowIdx:number}){
    const val = getVal(f.id, scope);
    switch(f.type){
      case "content":
        return <div className="sans" style={{whiteSpace:"pre-wrap",fontSize:".82rem",color:"var(--muted)",lineHeight:1.5}}>{f.content}</div>;
      case "textarea":
        return <textarea className="input" rows={4} value={val||""} onChange={e=>setVal(f.id,e.target.value,scope)}/>;
      case "select":
        return <select className="input" value={val||""} onChange={e=>setVal(f.id,e.target.value,scope)}>
          <option value="">Select…</option>{(f.options||[]).map(o=><option key={o}>{o}</option>)}</select>;
      case "checkbox":
        return (f.options&&f.options.length>0)
          ? <div className="sans" style={{display:"flex",flexWrap:"wrap",gap:"1rem"}}>
              {f.options.map(o=><label key={o} style={{display:"flex",gap:".4rem",alignItems:"center"}}>
                <input type="checkbox" checked={Array.isArray(val)&&val.includes(o)}
                  onChange={e=>toggleOption(f.id,o,e.target.checked,scope)}/> {o}</label>)}
            </div>
          : <label className="sans" style={{display:"flex",gap:".5rem"}}>
              <input type="checkbox" checked={!!val} onChange={e=>setVal(f.id,e.target.checked,scope)}/> Yes</label>;
      case "file":
        return <div>
          <input type="file" onChange={async e=>{const u=await uploadFile(e.target.files?.[0]); if(u) setVal(f.id,u,scope);}}/>
          {val && <a href={val} target="_blank" rel="noreferrer" className="sans" style={{display:"block",fontSize:".8rem",color:"var(--accent)",marginTop:".3rem"}}>file attached ✓</a>}
        </div>;
      case "signature":
        return <SignaturePad onChange={d=>setVal(f.id,d,scope)}/>;
      default:
        return <input className="input" type={f.type==="number"?"number":f.type==="date"?"date":f.type==="email"?"email":"text"}
          value={val||""} onChange={e=>setVal(f.id,e.target.value,scope)}/>;
    }
  }

  function renderField(f:Field){
    if(f.type==="group"){
      const rows:any[] = Array.isArray(vals[f.id]) ? vals[f.id] : [];
      return (
        <div className="card" style={{padding:"1rem"}}>
          <div className="label" style={{marginBottom:".5rem"}}>{f.label}</div>
          {rows.map((_,i)=>(
            <div key={i} style={{borderTop:i?"1px solid var(--line)":"none",paddingTop:i?".8rem":0,marginTop:i?".8rem":0,display:"grid",gap:".7rem"}}>
              {(f.fields||[]).map(cf=>(
                <div key={cf.id}>
                  <label className="sans" style={{display:"block",marginBottom:".3rem",fontSize:".85rem"}}>{cf.label}{cf.required&&<span style={{color:"var(--accent)"}}> *</span>}</label>
                  {renderInput(cf,{gid:f.id,rowIdx:i})}
                </div>
              ))}
              <button type="button" className="btn btn-ghost" style={{justifySelf:"start",fontSize:".8rem"}} onClick={()=>removeRow(f,i)}>✕ Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" style={{marginTop:".8rem"}} onClick={()=>addRow(f)}>+ Add Item</button>
        </div>
      );
    }
    if(f.type==="content"){
      return renderInput(f); // display block, no label wrapper
    }
    return (
      <div>
        <label className="sans" style={{display:"block",marginBottom:".35rem",fontSize:".9rem"}}>
          {f.label}{f.required && <span style={{color:"var(--accent)"}}> *</span>}
        </label>
        {renderInput(f)}
      </div>
    );
  }

  async function submit(){
    setErr("");
    for(const f of form.schema as Field[]){
      if(f.type==="content"||f.type==="group") continue;
      const val = vals[f.id];
      const empty = val===undefined || val==="" || (Array.isArray(val)&&val.length===0);
      if(f.required && empty){ setErr(`"${f.label}" is required`); return; }
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
        {(form.schema as Field[]).map(f=><div key={f.id}>{renderField(f)}</div>)}
        {err && <p className="sans" style={{color:"var(--accent)",fontSize:".85rem"}}>{err}</p>}
        <button className="btn btn-accent" onClick={submit} disabled={uploading}>Submit</button>
      </div>
    </main>
  );
}
