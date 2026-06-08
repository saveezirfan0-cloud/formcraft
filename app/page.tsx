import Link from "next/link";
export default function Home() {
  return (
    <main style={{maxWidth:760,margin:"0 auto",padding:"6rem 1.5rem"}}>
      <p className="label">FormCraft</p>
      <h1 style={{fontSize:"3rem",lineHeight:1.05,margin:"1rem 0"}}>
        Build forms. Collect entries.<br/>Pipe everything into Make.
      </h1>
      <p style={{fontSize:"1.15rem",color:"var(--muted)",maxWidth:560}}>
        A self-hosted form platform on Supabase + Vercel, with a REST API and
        webhooks designed for Make automation.
      </p>
      <div style={{display:"flex",gap:".8rem",marginTop:"2rem"}}>
        <Link href="/signup" className="btn btn-accent">Get started</Link>
        <Link href="/login" className="btn btn-ghost">Log in</Link>
      </div>
    </main>
  );
}
