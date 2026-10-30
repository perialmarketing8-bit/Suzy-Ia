// Contrato único: trocar de fornecedor (Cloud API, Evolution, etc.) = nova implementação desta interface.
export interface WhatsAppProvider {
  sendText(to: string, text: string): Promise<void>;
}
export class CloudApiProvider implements WhatsAppProvider {
  constructor(private phoneNumberId: string, private accessToken: string) {}
  async sendText(to: string, text: string) {
    const r = await fetch(`https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }) });
    if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${await r.text()}`);
  }
}
