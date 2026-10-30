"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
export default function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const router = useRouter();
  async function go(mode: "in" | "up") {
    setBusy(true); const sb = createClient();
    const { error, data } = mode === "in" ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up" && !data.session) return toast.success("Conta criada. Confirma o teu email para entrar.");
    router.replace("/dashboard"); router.refresh();
  }
  const f = "w-full rounded-lg border border-edge bg-ink px-3 py-2.5 text-sm placeholder:text-mute";
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-edge bg-panel p-6">
        <h1 className="text-2xl font-semibold">Entrar na plataforma</h1>
        <p className="mt-1 text-sm text-mute">Cada conta tem os seus próprios agentes e conversas.</p>
        <div className="mt-5 space-y-3">
          <input className={f} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={f} type="password" placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} onClick={() => go("in")} className="w-full rounded-lg bg-lime py-2.5 text-sm font-semibold text-black transition hover:bg-lime-dim disabled:opacity-50">{busy ? "A entrar…" : "Entrar"}</button>
          <button disabled={busy} onClick={() => go("up")} className="w-full rounded-lg border border-edge py-2.5 text-sm transition hover:border-lime">Criar conta</button>
        </div>
      </div>
    </main>);
}
