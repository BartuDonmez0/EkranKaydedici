// Bağımlılıksız, tek dosyalık yerel sunucu — bu klasördeki index.html'i
// http://localhost üzerinden sunar (getDisplayMedia/showDirectoryPicker "file://"
// üzerinden çalışmaz, localhost bir güvenli bağlam sayılır) ve kayıtları Windows'un
// yerleşik oynatıcısında ileri sarılabilir hale getiren /fix uç noktasını sağlar.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { exec, execFile } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5757;
const FFMPEG_PATH = path.join(__dirname, "bin", "ffmpeg.exe");
const HAS_FFMPEG = fs.existsSync(FFMPEG_PATH);

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript" };

function serveStatic(req, res) {
  const filePath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = path.join(__dirname, path.normalize(filePath).replace(/^(\.\.[/\\])+/, ""));
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Bulunamadı");
      return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

/**
 * Kaydı (kayıpsız) yeniden paketler: MediaRecorder çıktısı "akış" hâlinde yazıldığı
 * için süre/arama (seek) tablosu eksik kalır — Chrome/VLC tolere eder ama Windows'un
 * yerleşik oynatıcısı ileri sarmada 0xC00D3E84 hatası verir. `-c copy` ile codec'e
 * dokunmadan sadece konteyneri düzeltiyoruz: hızlı (saniyeler) ve kalite kaybı yok.
 */
function handleFix(req, res) {
  if (!HAS_FFMPEG) {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ffmpeg bulunamadı (bin/ffmpeg.exe)" }));
    return;
  }

  const ext = (new URL(req.url, "http://x").searchParams.get("ext") || "mp4").replace(/[^a-z0-9]/gi, "");
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("error", () => res.writeHead(400).end());
  req.on("end", () => {
    const input = path.join(os.tmpdir(), `ekran-kayit-${crypto.randomUUID()}.${ext}`);
    const output = path.join(os.tmpdir(), `ekran-kayit-${crypto.randomUUID()}-fixed.${ext}`);
    fs.writeFileSync(input, Buffer.concat(chunks));

    const args =
      ext === "mp4"
        ? ["-y", "-i", input, "-c", "copy", "-movflags", "+faststart", output]
        : ["-y", "-i", input, "-c", "copy", output];

    execFile(FFMPEG_PATH, args, { maxBuffer: 1024 * 1024 * 1024 }, (err) => {
      const cleanup = () => {
        fs.unlink(input, () => {});
        fs.unlink(output, () => {});
      };
      if (err || !fs.existsSync(output)) {
        cleanup();
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "ffmpeg hatası: " + (err?.message || "çıktı üretilemedi") }));
        return;
      }
      const fixed = fs.readFileSync(output);
      cleanup();
      res.writeHead(200, { "Content-Type": ext === "mp4" ? "video/mp4" : "video/webm" });
      res.end(fixed);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/fix")) {
    handleFix(req, res);
    return;
  }
  if (req.url === "/ffmpeg-status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ available: HAS_FFMPEG }));
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Ekran Kaydedici çalışıyor: ${url}`);
  console.log(`ffmpeg (otomatik düzeltme): ${HAS_FFMPEG ? "hazır" : "bulunamadı — bin/ffmpeg.exe yok"}`);
  console.log("Kapatmak için bu pencereyi kapatın veya Ctrl+C basın.\n");
  const openCmd = process.platform === "win32" ? `start ${url}` : process.platform === "darwin" ? `open ${url}` : `xdg-open ${url}`;
  exec(openCmd);
});
