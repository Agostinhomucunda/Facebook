import express from 'express';
import { URL } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = new URL('.', import.meta.url).pathname;
const allowedPageHosts = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com']);
const allowedImageHosts = new Set(['facebook.com', 'www.facebook.com', 'fbcdn.net']);
const requestTimeoutMs = 12000;

function isAllowedHost(hostname, allowlist) {
  const host = hostname.toLowerCase();
  return [...allowlist].some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}

function validatePageUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !isAllowedHost(url.hostname, allowedPageHosts)) {
    throw new Error('Por segurança, só são aceites URLs HTTPS públicas do Facebook.');
  }
  return url;
}

function validateImageUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !isAllowedHost(url.hostname, allowedImageHosts)) {
    throw new Error('A imagem encontrada não pertence a um domínio público permitido.');
  }
  return url;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...options, redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'FotoVault/1.0 public-image-reader', accept: 'text/html,application/xhtml+xml' } });
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtml(value) {
  return value.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/&#([0-9]+);/g, (_, number) => String.fromCodePoint(Number(number))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function metaContent(html, key, attribute = 'property') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
  const reversePattern = new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${escaped}["'][^>]*>`, 'i');
  return decodeHtml(pattern.exec(html)?.[1] || reversePattern.exec(html)?.[1] || '');
}

app.use(express.static(publicDir, { extensions: ['html'] }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'fotovault' }));

app.get('/api/extract-image', async (req, res) => {
  try {
    const pageUrl = validatePageUrl(String(req.query.url || ''));
    const response = await fetchWithTimeout(pageUrl.href);
    if (!response.ok) throw new Error(`A página respondeu com HTTP ${response.status}.`);
    const html = await response.text();
    const rawImage = metaContent(html, 'og:image') || metaContent(html, 'twitter:image', 'name');
    if (!rawImage) return res.status(404).json({ error: 'Não foi encontrada uma imagem pública nesta página.' });
    const imageUrl = validateImageUrl(new URL(rawImage, response.url).href);
    res.json({ title: metaContent(html, 'og:title') || 'Imagem pública', pageUrl: response.url, imageUrl: imageUrl.href });
  } catch (error) {
    const message = error.name === 'AbortError' ? 'A plataforma demorou demasiado a responder.' : (error.message || 'Não foi possível analisar o link.');
    res.status(400).json({ error: message });
  }
});

app.get('/api/download-image', async (req, res) => {
  try {
    const imageUrl = validateImageUrl(String(req.query.url || ''));
    const response = await fetchWithTimeout(imageUrl.href, { headers: { accept: 'image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8' } });
    if (!response.ok || !response.body) throw new Error('A imagem pública não está disponível.');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new Error('O endereço não devolveu uma imagem.');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="fotovault-public-image"');
    res.setHeader('Cache-Control', 'no-store');
    for await (const chunk of response.body) res.write(chunk);
    res.end();
  } catch (error) {
    res.status(400).json({ error: error.message || 'Não foi possível descarregar a imagem.' });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`FotoVault a ouvir na porta ${port}`));
