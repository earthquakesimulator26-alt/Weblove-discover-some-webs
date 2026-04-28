import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) return res.status(400).send("URL required");
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) return res.status(400).send("Invalid URL");

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      });
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/html")) {
        let html = await response.text();
        
        // Try to inject base tag to fix relative assets
        let baseHref = targetUrl;
        if (!baseHref.endsWith('/')) {
            const urlObj = new URL(targetUrl);
            baseHref = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
        }
        
        const baseTag = `<base href="${baseHref}">`;
        
        // Remove frame-breaking scripts if possible (simple regex)
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, (match) => {
          if (match.includes('top.location') || match.includes('window.top')) {
            return '<!-- framebusting script removed -->';
          }
          return match;
        });

        // Insert base tag right after head
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}`);
        } else {
          html = `<head>${baseTag}</head>` + html;
        }

        res.send(html);
      } else {
        // Transparent proxy for other assets? We won't need to proxy assets since base tag makes them go to original server.
        // If the browser requests something directly from the proxy, just fail for now or proxy it
        res.set("Content-Type", contentType || "application/octet-stream");
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (e) {
      console.error(e);
      res.status(500).send("Error fetching URL");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
