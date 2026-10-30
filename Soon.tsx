export default function Soon({ title, step }: { title: string; step: string }) {
  return (<div><h1 className="text-2xl font-semibold">{title}</h1>
    <div className="mt-6 rounded-xl border border-dashed border-edge p-8 text-sm text-mute">Esta secção ainda não foi construída. Está prevista para a {step} do plano.</div></div>);
}
