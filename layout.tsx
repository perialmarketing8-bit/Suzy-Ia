import Sidebar from "@/components/Sidebar";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (<div><Sidebar /><main className="p-5 md:ml-60 md:p-8">{children}</main></div>);
}
