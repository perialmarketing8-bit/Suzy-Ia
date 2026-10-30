import { admin } from "@/lib/supabase/admin";
import { CloudApiProvider } from "@/lib/whatsapp/provider";

type Args = { userId: string; agentId: string | null; conversationId: string; to: string; phoneNumberId: string };

export async function autoReply(a: Args) {
  const db = admin();
  try {
    if (!a.agentId) return;
    const { data: agent } = await db.from("agents").select("*").eq("id", a.agentId).single();
    if (!agent?.active) return;

    const { data: faqs } = await db.from("faqs").select("question,answer").eq("agent_id", a.agentId);
    const { data: hist } = await db.from("messages").select("direction,body")
      .eq("conversation_id", a.conversationId).order("created_at", { ascending: false }).limit(20);
    const msgs = (hist ?? []).reverse().map((m) => ({ role: m.direction === "in" ? "user" : "assistant", content: m.body }));
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length) return;

    const system = [
      `És ${agent.name}, assistente da empresa ${agent.company ?? ""} no WhatsApp.`,
      agent.business_description && `Sobre o negócio: ${agent.business_description}`,
      agent.personality && `Personalidade: ${agent.personality}`,
      agent.tone && `Tom: ${agent.tone}`,
      agent.goal && `Objetivo: ${agent.goal}`,
      agent.system_prompt,
      faqs?.length ? "Perguntas frequentes:\n" + faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`).join("\n\n") : "",
      `Idioma: ${agent.language ?? "pt"}. Respostas curtas, adequadas ao WhatsApp.`,
      "Usa apenas a informação acima. Se não souberes ou o cliente pedir uma pessoa, diz que vais passar a conversa à equipa e termina a mensagem com [[HUMANO]]. Nunca inventes preços, prazos ou factos.",
      agent.handoff_rules && `Passa para humano quando: ${agent.handoff_rules}`,
    ].filter(Boolean).join("\n\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 500, system, messages: msgs }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
    let text: string = (await r.json()).content?.find((c: any) => c.type === "text")?.text ?? "";
    const summary = text.match(/\[\[RESUMO\]\]([\s\S]*?)\[\[\/RESUMO\]\]/)?.[1].trim() ?? null;
    const handoff = !!summary || text.includes("[[HUMANO]]");
    text = text.replace(/\[\[RESUMO\]\][\s\S]*?\[\[\/RESUMO\]\]/, "").replace("[[HUMANO]]", "").trim();
    if (!text) return;

    await new CloudApiProvider(a.phoneNumberId, process.env.WHATSAPP_ACCESS_TOKEN!).sendText(a.to, text);
    await db.from("messages").insert({ user_id: a.userId, conversation_id: a.conversationId, direction: "out", sender: "ai", body: text });
    if (handoff) {
      await db.from("conversations").update({ status: "human", ...(summary ? { summary } : {}) }).eq("id", a.conversationId);
      if (summary) {
        const { data: c } = await db.from("conversations").select("contact_id").eq("id", a.conversationId).single();
        if (c) await db.from("contacts").update({ is_lead: true }).eq("id", c.contact_id);
        const team = process.env.TEAM_WHATSAPP_NUMBER; // opcional; a Meta só entrega se a equipa tiver falado com o número nas últimas 24h
        if (team) await new CloudApiProvider(a.phoneNumberId, process.env.WHATSAPP_ACCESS_TOKEN!).sendText(team, `Novo pedido (+${a.to}):\n${summary}`).catch((e) => console.error("aviso à equipa falhou:", e));
      }
    }
  } catch (e) {
    console.error("autoReply falhou:", e);
  }
}
