# Agentes WhatsApp — fundações

1. `npm install`
2. Cria um projeto no Supabase e corre `supabase/migrations/001_schema.sql` no SQL Editor.
3. Copia `.env.example` para `.env.local` e preenche.
4. `npm run dev` → http://localhost:3000
5. Webhook: na Meta (WhatsApp > Configuration) aponta para `https://TEU-DOMINIO/api/whatsapp/webhook` com o mesmo `WHATSAPP_VERIFY_TOKEN`. Em local, usa um túnel (ngrok / cloudflared).

Feito: autenticação, esquema com RLS, layout, dashboard com dados reais, webhook assinado que guarda mensagens recebidas.
Falta: formulário de ligação do WhatsApp, agente, RAG, chat de teste, conversas, resposta automática da IA.

## Resposta automática (já incluída)
Quando chega uma mensagem e a conversa está em modo `ai`, o servidor chama o Claude e responde pelo WhatsApp.
Como a página Agente ainda não existe, cria o agente e liga-o à conexão por SQL (troca o UUID pelo teu id em Authentication > Users):

    with a as (insert into agents (user_id,name,company,business_description,tone,goal,active)
      values ('SEU-USER-ID','Ana','Nome da empresa','O que a empresa vende/faz','simpático e direto','Atender e recolher o pedido do cliente',true) returning id, user_id)
    insert into whatsapp_connections (user_id,agent_id,phone_number_id,status)
      select user_id,id,'PHONE_NUMBER_ID_DA_META','connected' from a;

Mensagens com [[HUMANO]] na resposta passam a conversa para atendimento humano e a IA deixa de responder.
