import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CONQUISTAS, arquivoDoPremio, objetoDaConquista } from './src/art/conquistas.js';

// No `npm run dev`: quando o PNG de um prêmio de conquista (src/assets/conquistas/) muda de tamanho,
// atualiza w/h (e x/y, mantendo o centro e a base, como o gerador) em src/art/objetos.json. Sem isso
// o jogo desenharia o PNG novo esticado no tamanho antigo até alguém rodar `npm run assets`.
const PASTA = fileURLToPath(new URL('./src/assets/conquistas/', import.meta.url)).replace(/\\/g, '/');
const JSON_OBJETOS = fileURLToPath(new URL('./src/art/objetos.json', import.meta.url));
const OBJETO_DO_ARQUIVO = Object.fromEntries(CONQUISTAS.map((cq) => [arquivoDoPremio(cq), objetoDaConquista(cq.id)]));

function tamanhoDosPremios() {
  const conferir = (arquivo) => {
    const caminho = arquivo.replace(/\\/g, '/');
    if (!caminho.startsWith(PASTA) || !caminho.endsWith('.png')) return;
    const nome = OBJETO_DO_ARQUIVO[caminho.slice(PASTA.length)];
    if (!nome) return; // silhueta antiga ou arquivo que não é prêmio
    let png;
    try {
      png = readFileSync(arquivo);
    } catch {
      return; // apagado
    }
    if (png.length < 24) return;
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
    const objetos = JSON.parse(readFileSync(JSON_OBJETOS, 'utf8'));
    const o = objetos[nome];
    if (!o || (o.w === w && o.h === h)) return;
    objetos[nome] = { ...o, x: o.x + Math.round((o.w - w) / 2), y: o.y + o.h - h, w, h };
    writeFileSync(JSON_OBJETOS, JSON.stringify(objetos, null, 2) + '\n');
    console.log(`[premios] ${nome}: tamanho ${o.w}x${o.h} → ${w}x${h} (objetos.json atualizado)`);
  };
  return {
    name: 'tamanho-dos-premios',
    apply: 'serve',
    configureServer(server) {
      server.watcher.on('change', conferir);
      server.watcher.on('add', conferir);
    },
  };
}

export default defineConfig({
  plugins: [react(), tamanhoDosPremios()],
  build: { assetsInlineLimit: 0 }, // mantém os PNGs como arquivos
  test: { environment: 'node' },
});
