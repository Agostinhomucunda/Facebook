const urlInput = document.querySelector('#profile-url');
const scanButton = document.querySelector('#scan-btn');
const result = document.querySelector('#scan-result');
const imageUrlInput = document.querySelector('#image-url');
const imageDownloadButton = document.querySelector('#image-download-btn');
const fileInput = document.querySelector('#file-input');
const fileList = document.querySelector('#file-list');
const dropzone = document.querySelector('#dropzone');
const downloadButton = document.querySelector('#download-btn');
const clearButton = document.querySelector('#clear-btn');
let selectedFiles = [];

const platforms = [
  { name: 'Facebook', domains: ['facebook.com', 'fb.com'], recovery: 'Usa o Centro de Contas Meta para exportar as tuas informações.' },
  { name: 'Instagram', domains: ['instagram.com'], recovery: 'Acede à conta e pede uma cópia das tuas informações.' },
  { name: 'TikTok', domains: ['tiktok.com'], recovery: 'Usa a opção oficial de descarregar os teus dados nas definições.' },
  { name: 'Outra plataforma', domains: [], recovery: 'Confirma que tens acesso à conta antes de exportar os ficheiros.' }
];

function detectPlatform(value) {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return platforms.find(platform => platform.domains.some(domain => host === domain || host.endsWith(`.${domain}`))) || platforms[3];
  } catch { return null; }
}

scanButton.addEventListener('click', async () => {
  const value = urlInput.value.trim();
  result.hidden = false;
  result.classList.remove('warning');
  if (!value) {
    result.classList.add('warning');
    result.innerHTML = '<strong>Cola um link primeiro.</strong><br>O endereço deve começar por <code>https://</code>.';
    return;
  }
  const platform = detectPlatform(value);
  if (!platform) {
    result.classList.add('warning');
    result.innerHTML = '<strong>Link não reconhecido.</strong><br>Usa o endereço público de um perfil ou publicação. Não coles credenciais nem códigos de acesso.';
    return;
  }
  result.innerHTML = `<strong>${platform.name} identificado.</strong><br>A analisar a imagem pública…`;
  scanButton.disabled = true;
  try {
    const response = await fetch(`/api/extract-image?url=${encodeURIComponent(value)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi encontrada uma imagem pública.');
    result.innerHTML = `<strong>${data.title} — imagem pública encontrada.</strong><br><a class="result-link" href="/api/download-image?url=${encodeURIComponent(data.imageUrl)}">Baixar imagem original disponível ↓</a><br><small>Se o perfil estiver restrito, só será devolvido o que a própria página tornar público.</small>`;
  } catch (error) {
    result.classList.add('warning');
    result.innerHTML = `<strong>Não foi possível obter uma imagem pública.</strong><br>${error.message}<br><small>${platform.recovery}</small>`;
  } finally {
    scanButton.disabled = false;
  }
});

imageDownloadButton.addEventListener('click', () => {
  const value = imageUrlInput.value.trim();
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || !/\.(jpe?g|png|webp|gif|heic)(?:$|[?#])/i.test(url.pathname)) throw new Error();
    const link = document.createElement('a');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.download = `fotovault-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    result.hidden = false;
    result.classList.remove('warning');
    result.innerHTML = '<strong>Download iniciado.</strong><br>Se o navegador abrir a imagem numa nova aba, usa o menu da imagem para a guardar no dispositivo.';
  } catch {
    result.hidden = false;
    result.classList.add('warning');
    result.innerHTML = '<strong>URL de imagem inválido.</strong><br>Cola o endereço direto de um ficheiro JPG, PNG, WEBP, GIF ou HEIC público — não apenas o endereço do perfil.';
  }
});

function formatSize(bytes) { return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }
function renderFiles() {
  fileList.hidden = selectedFiles.length === 0;
  downloadButton.disabled = selectedFiles.length === 0;
  fileList.innerHTML = selectedFiles.map((file, index) => `<div class="file-item"><strong>${index + 1}. ${file.name}</strong><span>${formatSize(file.size)}</span></div>`).join('');
  downloadButton.innerHTML = `Descarregar ${selectedFiles.length} selecionada${selectedFiles.length === 1 ? '' : 's'} <span>↓</span>`;
}
function addFiles(files) {
  const images = [...files].filter(file => file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name));
  selectedFiles = [...selectedFiles, ...images].filter((file, index, all) => all.findIndex(item => item.name === file.name && item.size === file.size) === index);
  renderFiles();
}
fileInput.addEventListener('change', event => addFiles(event.target.files));
['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', event => addFiles(event.dataTransfer.files));
downloadButton.addEventListener('click', () => {
  selectedFiles.forEach((file, index) => setTimeout(() => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, index * 180));
});
clearButton.addEventListener('click', () => {
  urlInput.value = '';
  imageUrlInput.value = '';
  result.hidden = true;
  selectedFiles = [];
  fileInput.value = '';
  renderFiles();
});
