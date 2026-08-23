// Bağımlılıksız, tek dosyalık yerel sunucu — sadece bu klasördeki index.html'i
// http://localhost üzerinden sunar. getDisplayMedia/showDirectoryPicker gibi
// tarayıcı API'leri "file://" üzerinden çalışmadığı için localhost gerekli.
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5757;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript" };

const server = http.createServer((req, res) => {
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
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Ekran Kaydedici çalışıyor: ${url}`);
  console.log("Kapatmak için bu pencereyi kapatın veya Ctrl+C basın.\n");
  const openCmd = process.platform === "win32" ? `start ${url}` : process.platform === "darwin" ? `open ${url}` : `xdg-open ${url}`;
  exec(openCmd);
});
