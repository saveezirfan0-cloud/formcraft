"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Field } from "@/lib/field-types";

export default function Entries(){
  const { formId } = useParams<{formId:string}>(); const sb = createClient();
  const [form,setForm]=useState<any>(null); const [rows,setRows]=useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const { data: f } = await sb.from("forms").select("*").eq("id",formId).single();
    setForm(f);
    const { data: e } = await sb.from("entries").select("*").eq("form_id",formId).order("created_at",{ascending:false});
    setRows(e||[]);
  })();},[formId]);

  if(!form) return <main style={{maxWidth:900,margin:"3rem auto",padding:"0 1.5rem"}} className="sans">Loading…</main>;
  const fields = form.schema as Field[];

  function renderCell(f:Field, val:any){
    if(val===undefined || val===null || val==="") return "";
    if(f.type==="content") return <span style={{color:"var(--muted)"}}>—</span>;
    if(f.type==="signature" && typeof val==="string" && val.startsWith("data:image"))
      return <img src={val} alt="signature" style={{height:32,border:"1px solid var(--line)",borderRadius:4}}/>;
    if(f.type==="file" && typeof val==="string" && val.startsWith("http"))
      return <a href={val} target="_blank" rel="noreferrer" style={{color:"var(--accent)"}}>file ↗</a>;
    if(f.type==="group" && Array.isArray(val))
      return <span style={{color:"var(--muted)"}}>{val.length} item{val.length===1?"":"s"}</span>;
    if(Array.isArray(val)) return val.join(", ");
    return String(val);
  }

  return (
    <main style={{maxWidth:1000,margin:"0 auto",padding:"2rem 1.5rem"}}>
      <Link href="/dashboard" className="sans" style={{color:"var(--muted)",fontSize:".85rem"}}>← Forms</Link>
      <h1 style={{fontSize:"2.2rem",marginTop:".8rem"}}>{form.name} — entries</h1>
      <p className="sans" style={{color:"var(--muted)"}}>{rows.length} total</p>
      {rows.length===0 ? <p className="sans" style={{color:"var(--muted)",marginTop:"1.5rem"}}>No entries yet.</p> :
      <div style={{overflowX:"auto",marginTop:"1.5rem"}}>
        <table className="sans" style={{borderCollapse:"collapse",width:"100%",fontSize:".88rem"}}>
          <thead><tr style={{textAlign:"left",borderBottom:"2px solid var(--line)"}}>
            <th style={{padding:".5rem"}}>Date</th>
            {fields.map(f=><th key={f.id} style={{padding:".5rem"}}>{f.label}</th>)}
          </tr></thead>
          <tbody>{rows.map(r=>(
            <tr key={r.id} style={{borderBottom:"1px solid var(--line)"}}>
              <td style={{padding:".5rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{new Date(r.created_at).toLocaleString()}</td>
              {fields.map(f=><td key={f.id} style={{padding:".5rem"}}>{renderCell(f, r.data?.[f.id])}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>}
    </main>
  );
}
