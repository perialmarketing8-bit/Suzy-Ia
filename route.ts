import { NextRequest, NextResponse, after } from "next/server";
import { autoReply } from "@/lib/ai/reply";
import { createHmac, timingSafeEqual } from "crypto";
import { admin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN)
    return new NextResponse(q.get("hub.challenge"), { status: 200 });
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", process.env.WHATSAPP_APP_SECRET!).update(raw).digest("hex");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return new NextResponse("invalid signature", { status: 401 });

  const db = admin();
  for (const entry of JSON.parse(raw).entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value; const pid = v?.metadata?.phone_number_id;
    const { data: conn } = await db.from("whatsapp_connections").select("id,user_id,agent_id").eq("phone_number_id", pid).maybeSingle();
    if (!conn) continue;
    for (const m of v.messages ?? []) {
      const name = v.contacts?.find((c: any) => c.wa_id === m.from)?.profile?.name ?? null;
      const { data: contact } = await db.from("contacts").upsert({ user_id: conn.user_id, phone: m.from, name }, { onConflict: "user_id,phone" }).select("id").single();
      let { data: conv } = await db.from("conversations").select("id,status").eq("contact_id", contact!.id).eq("connection_id", conn.id).maybeSingle();
      if (!conv) ({ data: conv } = await db.from("conversations").insert({ user_id: conn.user_id, contact_id: contact!.id, connection_id: conn.id }).select("id,status").single());
      await db.from("messages").upsert({ user_id: conn.user_id, conversation_id: conv!.id, direction: "in", body: m.text?.body ?? `[${m.type}]`, wa_message_id: m.id }, { onConflict: "wa_message_id", ignoreDuplicates: true });
      await db.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv!.id);
      if (conv!.status === "ai") after(() => autoReply({ userId: conn.user_id, agentId: conn.agent_id, conversationId: conv!.id, to: m.from, phoneNumberId: pid }));
    }
  }
  return NextResponse.json({ ok: true });
}
