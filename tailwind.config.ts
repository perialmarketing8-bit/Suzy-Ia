import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: {
  colors: { ink: "#0a0a0a", panel: "#141414", edge: "#242424", mute: "#8a8a85", lime: { DEFAULT: "#b8f03c", dim: "#8fbf24" } },
  fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] } } }, plugins: [] } satisfies Config;
