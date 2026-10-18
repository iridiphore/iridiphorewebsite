import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Base path. A custom domain (public/CNAME present) serves from "/", a plain
// github.io project site serves from "/<repo>/". The deploy workflow sets VITE_BASE.
const BASE = process.env.VITE_BASE || "/";
const SITE = (process.env.VITE_SITE_URL || "https://iridiphore.co.uk").replace(/\/$/, "");

interface Shell {
  route: string; // no leading slash; "" is the home page
  title: string;
  description: string;
  h1: string;
  body: string;
}

// Static per-route HTML so crawlers and link previews that don't run JS still see
// real copy. React replaces #root on mount. Event pages are client-rendered.
const SHELLS: Shell[] = [
  {
    route: "",
    title: "Iridiphore | Live visuals for live music",
    description:
      "Iridiphore turns gigs into audio-visual events people talk about and remember: live visuals for artists, festivals and livestreams.",
    h1: "Iridiphore",
    body: "Live visuals for live music. We turn gigs into audio-visual events people talk about and remember.",
  },
  {
    route: "work",
    title: "Work | Iridiphore",
    description: "Events Iridiphore has made visuals for: gigs, EMOM nights and livestreams.",
    h1: "Work",
    body: "Previous events and the visuals we made for them.",
  },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function applyShell(html: string, s: Shell): string {
  const url = `${SITE}/${s.route}`;
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(s.title)}</title>`);
  out = out.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(s.description)}" />`);
  out = out.replace(/<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(s.title)}" />`);
  out = out.replace(/<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(s.description)}" />`);
  out = out.replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`);
  out = out.replace("</head>", `    <link rel="canonical" href="${esc(url)}" />\n  </head>`);
  out = out.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    `<div id="root"><div id="prerender-shell"><h1>${esc(s.h1)}</h1><p>${esc(s.body)}</p></div></div>`,
  );
  return out;
}

function staticShells() {
  return {
    name: "iridiphore-static-shells",
    apply: "build" as const,
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexPath = path.join(dist, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, "utf8");
      for (const s of SHELLS) {
        const html = applyShell(base, s);
        if (s.route === "") fs.writeFileSync(indexPath, html, "utf8");
        else {
          fs.mkdirSync(path.join(dist, s.route), { recursive: true });
          fs.writeFileSync(path.join(dist, s.route, "index.html"), html, "utf8");
        }
      }
      // GitHub Pages serves 404.html for unknown paths; React Router then renders
      // the real route (event pages, /admin, /login). noindex keeps it out of search.
      fs.writeFileSync(
        path.join(dist, "404.html"),
        base.replace("</head>", `  <meta name="robots" content="noindex" />\n  </head>`),
        "utf8",
      );
      console.log(`[iridiphore-static-shells] wrote ${SHELLS.length} shells + 404.html`);
    },
  };
}

export default defineConfig({
  base: BASE,
  server: { port: 8080 },
  plugins: [react(), staticShells()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
