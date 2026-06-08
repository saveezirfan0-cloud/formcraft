"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Field, FieldType, FIELD_LABELS, newField } from "@/lib/field-types";

const TYPES: FieldType[] = ["text","email","number","textarea","select","checkbox","date","phone","file","signature","content","group","fieldset"];
// child types allowed inside a repeating group (no nested groups)
const CHILD_TYPES: FieldType[] = ["text","email","number","textarea","select","checkbox","date","phone","file","signature"];

export default function Builder(){
  const { id } = useParams<{id:string}>(); const sb = createClient();
  const [name,setName]=useState(""); const [desc,setDesc]=useState("");
  const [fields,setFields]=useState<Field[]>([]); const [published,setPublished]=useState(false);
  const [saved,setSaved]=useState(""); const [origin,setOrigin]=useState("");

  useEffect(()=>{ setOrigin(window.location.origin);
    (async()=>{
      const { data } = await sb.from("forms").select("*").eq("id",id).single();
      if(data){ setName(data.name); setDesc(data.description||""); setFields(data.schema||[]); setPublished(data.published);}
    })();
  },[id]);

  function add(t:FieldType){ setFields(f=>[...f,newField(t)]); }
  function update(i:number,patch:Partial<Field>){ setFields(f=>f.map((x,j)=>j===i?{...x,...patch}:x)); }
  function remove(i:number){ setFields(f=>f.filter((_,j)=>j!==i)); }
  function move(i:number,d:number){ setFields(f=>{const a=[...f];const j=i+d;if(j<0||j>=a.length)return a;[a[i],a[j]]=[a[j],a[i]];return a;}); }

  // child-field operations within a group
  function addChild(i:number,t:FieldType){ update(i,{fields:[...(fields[i].fields||[]),newField(t)]}); }
  function updateChild(i:number,ci:number,patch:Partial<Field>){
    update(i,{fields:(fields[i].fields||[]).map((c,k)=>k===ci?{...c,...patch}:c)});
  }
  function removeChild(i:number,ci:number){ update(i,{fields:(fields[i].fields||[]).filter((_,k)=>k!==ci)}); }

  async function save(pub?:boolean){
    const p = pub===undefined?published:pub;
    await sb.from("forms").update({name,description:desc,schema:fields,published:p}).eq("id",id);
    setPublished(p); setSaved("Saved "+new Date().toLocaleTimeString()); setTimeout(()=>setSaved(""),2500);
  }

  // shared editor for a field's options/content/required controls
  function FieldControls({f,onPatch}:{f:Field,onPatch:(p:Partial<Field>)=>void}){
    return <>
      {(f.type==="select"||f.type==="checkbox") && <textarea className="input" style={{marginTop:".5rem"}}
        value={(f.options||[]).join("\n")} placeholder="One option per line"
        onChange={e=>onPatch({options:e.target.value.split("\n")})}/>}
      {f.type==="content" && <textarea className="input" style={{marginTop:".5rem"}} rows={4}
        value={f.content||""} placeholder="Display text (shown to respondents, not an input)"
        onChange={e=>onPatch({content:e.target.value})}/>}
      {f.type!=="content" && f.type!=="group" && <label className="sans" style={{display:"flex",gap:".4rem",alignItems:"center",marginTop:".5rem",fontSize:".85rem"}}>
        <input type="checkbox" checked={f.required} onChange={e=>onPatch({required:e.target.checked})}/> Required
      </label>}
    </>;
  }

  return (
    <main style={{maxWidth:1000,margin:"0 auto",padding:"2rem 1.5rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}} className="sans">
        <Link href="/dashboard" style={{color:"var(--muted)",fontSize:".85rem"}}>← Forms</Link>
        <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
          {saved && <span style={{fontSize:".8rem",color:"var(--muted)"}}>{saved}</span>}
          <button className="btn btn-ghost" onClick={()=>save()}>Save</button>
          <button className="btn btn-accent" onClick={()=>save(!published)}>{published?"Unpublish":"Publish"}</button>
        </div>
      </div>

      <input value={name} onChange={e=>setName(e.target.value)}
        style={{fontSize:"2.2rem",border:"none",background:"transparent",width:"100%",marginTop:"1rem",color:"var(--ink)",fontFamily:"Georgia,serif"}}/>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Add a description…" className="sans"
        style={{fontSize:"1rem",border:"none",background:"transparent",width:"100%",color:"var(--muted)",marginBottom:"1rem"}}/>

      {published && <div className="card sans" style={{padding:".7rem 1rem",marginBottom:"1rem",fontSize:".85rem"}}>
        Public link: <a href={`${origin}/f/${id}`} style={{color:"var(--accent)"}}>{origin}/f/{id}</a>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:"1.5rem"}}>
        <div style={{display:"grid",gap:".8rem"}}>
          {fields.length===0 && <p className="sans" style={{color:"var(--muted)"}}>Add fields from the right →</p>}
          {fields.map((f,i)=>(
            <div key={f.id} className="card" style={{padding:"1rem"}}>
              <div style={{display:"flex",gap:".5rem",alignItems:"center"}} className="sans">
                <span className="label">{FIELD_LABELS[f.type]}</span>
                <div style={{marginLeft:"auto",display:"flex",gap:".3rem"}}>
                  <button className="btn btn-ghost" onClick={()=>move(i,-1)} style={{padding:".2rem .5rem"}}>↑</button>
                  <button className="btn btn-ghost" onClick={()=>move(i,1)} style={{padding:".2rem .5rem"}}>↓</button>
                  <button className="btn btn-ghost" onClick={()=>remove(i)} style={{padding:".2rem .5rem"}}>✕</button>
                </div>
              </div>
              {f.type!=="content" && <input className="input" style={{marginTop:".5rem"}} value={f.label}
                placeholder="Field label" onChange={e=>update(i,{label:e.target.value})}/>}
              <FieldControls f={f} onPatch={p=>update(i,p)}/>

              {(f.type==="group"||f.type==="fieldset") && (
                <div style={{marginTop:".7rem",paddingLeft:".8rem",borderLeft:"2px solid var(--line)"}}>
                  <span className="label">{f.type==="group"?"Item fields (repeats)":"Section fields"}</span>
                  {(f.fields||[]).map((cf,ci)=>(
                    <div key={cf.id} className="card" style={{padding:".7rem",marginTop:".5rem"}}>
                      <div className="sans" style={{display:"flex",alignItems:"center"}}>
                        <span className="label">{FIELD_LABELS[cf.type]}</span>
                        <button className="btn btn-ghost" style={{marginLeft:"auto",padding:".2rem .5rem"}} onClick={()=>removeChild(i,ci)}>✕</button>
                      </div>
                      <input className="input" style={{marginTop:".4rem"}} value={cf.label} placeholder="Field label"
                        onChange={e=>updateChild(i,ci,{label:e.target.value})}/>
                      <FieldControls f={cf} onPatch={p=>updateChild(i,ci,p)}/>
                    </div>
                  ))}
                  <div style={{display:"flex",flexWrap:"wrap",gap:".3rem",marginTop:".5rem"}}>
                    {CHILD_TYPES.map(t=>(
                      <button key={t} className="btn btn-ghost" style={{fontSize:".75rem",padding:".2rem .5rem"}}
                        onClick={()=>addChild(i,t)}>+ {FIELD_LABELS[t]}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"grid",gap:".4rem",alignContent:"start"}} className="sans">
          <span className="label">Add field</span>
          {TYPES.map(t=>(
            <button key={t} className="btn btn-ghost" style={{justifySelf:"stretch",textAlign:"left"}}
              onClick={()=>add(t)}>+ {FIELD_LABELS[t]}</button>
          ))}
        </div>
      </div>
    </main>
  );
}
