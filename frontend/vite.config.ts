import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { pathToFileURL } from "url";
import { componentTagger } from "lovable-tagger";

// Serves POST /api/invite during `npm run dev` by reusing the same handler the
// Vercel serverless function uses, so invites work locally without `vercel dev`.
function devApiPlugin(): PluginOption {
  return {
    name: "dev-api-invite",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/invite", async (req, res) => {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
        const origin = req.headers.origin || `http://${req.headers.host}`;
        try {
          const mod = await import(
            pathToFileURL(path.resolve(__dirname, "../api/invite.js")).href
          );
          const { status, body } = await mod.handleInvite({
            method: req.method,
            token,
            body: raw,
            origin,
          });
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Dev API error" }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env(.local) including non-VITE_ vars so the dev invite handler can
  // read the service-role key (server-side only; never exposed to the client).
  const env = loadEnv(mode, __dirname, "");
  process.env.SUPABASE_URL = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "";
  process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return {
    base: mode === "production" ? "/falcons-fly-again/" : "/",
    server: {
      host: "localhost",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      devApiPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@stats": path.resolve(__dirname, "../stats/data"),
      },
    },
  };
});
