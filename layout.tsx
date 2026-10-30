import "./globals.css";
import { Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "sonner";
const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans" });
export const metadata = { title: "Agentes WhatsApp" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="pt"><body className={`${sans.variable} font-sans antialiased`}>{children}<Toaster theme="dark" position="top-right" /></body></html>);
}
