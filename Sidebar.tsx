"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [["Dashboard","/dashboard"],["Onboarding","/onboarding"],["Conversas","/conversas"],["Agente","/agente"],["Tools / RAG","/tools"],["Configurações","/configuracoes"]];
export default function Sidebar() {
  const p = usePathname();
  return (
    <aside className="border-b border-edge bg-panel md:fixed md:inset-y-0 md:w-60 md:border-b-0 md:border-r">
      <div className="px-5 py-4 text-lg font-semibold"><span className="text-lime">●</span> Agentes WhatsApp</div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
        {items.map(([n, h]) => (
          <Link key={h} href={h} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${p.startsWith(h) ? "bg-lime text-black font-medium" : "text-mute hover:bg-edge hover:text-white"}`}>{n}</Link>))}
      </nav>
    </aside>);
}
