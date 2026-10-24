import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { definirVolumes, iniciarAudio, tocarEfeito } from '../servicos/audio';

const CHAVE = 'diagrameria_config';

const PADRAO = {
  volumes: { musica: 6, chuva: 9, efeitos: 4 },
  telas: { crt: true, raios: true, suavizar: false, relogio: true },
  velocidade: 1, // 0 = lenta, 1 = calma, 2 = rápida
};

// Milissegundos por letra no texto "digitado"
const MS_POR_LETRA = [55, 28, 10];

function ler() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE));
    if (!bruto) return PADRAO;
    return {
      volumes: { ...PADRAO.volumes, ...bruto.volumes },
      telas: { ...PADRAO.telas, ...bruto.telas },
      velocidade: [0, 1, 2].includes(bruto.velocidade) ? bruto.velocidade : PADRAO.velocidade,
    };
  } catch {
    return PADRAO;
  }
}

const ConfigContexto = createContext({});

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(ler);
  const [aberta, setAberta] = useState(false);

  // Salva e aplica as preferências
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(config));
    } catch {
      /* armazenamento indisponível: segue sem salvar */
    }
    definirVolumes(config.volumes);
    const raiz = document.documentElement;
    raiz.dataset.suave = config.telas.suavizar ? 'sim' : 'nao';
  }, [config]);

  // Navegadores só liberam áudio após o primeiro clique/tecla
  useEffect(() => {
    function liberar() {
      iniciarAudio();
      window.removeEventListener('pointerdown', liberar);
      window.removeEventListener('keydown', liberar);
    }
    window.addEventListener('pointerdown', liberar);
    window.addEventListener('keydown', liberar);
    return () => {
      window.removeEventListener('pointerdown', liberar);
      window.removeEventListener('keydown', liberar);
    };
  }, []);

  // Som de clique em qualquer botão do jogo
  useEffect(() => {
    function aoClicar(e) {
      if (e.target.closest && e.target.closest('button')) tocarEfeito('clique');
    }
    document.addEventListener('click', aoClicar);
    return () => document.removeEventListener('click', aoClicar);
  }, []);

  const definirVolume = useCallback((chave, valor) => {
    // aplica já, para o clique de teste soar no volume novo
    definirVolumes({ [chave]: valor });
    setConfig((c) => ({ ...c, volumes: { ...c.volumes, [chave]: valor } }));
  }, []);

  const alternarTela = useCallback((chave) => {
    setConfig((c) => ({ ...c, telas: { ...c.telas, [chave]: !c.telas[chave] } }));
  }, []);

  const definirVelocidade = useCallback((indice) => {
    setConfig((c) => ({ ...c, velocidade: indice }));
  }, []);

  const abrirConfig = useCallback(() => {
    tocarEfeito('abrir');
    setAberta(true);
  }, []);

  const fecharConfig = useCallback(() => {
    tocarEfeito('fechar');
    setAberta(false);
  }, []);

  return (
    <ConfigContexto.Provider
      value={{
        volumes: config.volumes,
        telas: config.telas,
        velocidade: config.velocidade,
        msPorLetra: MS_POR_LETRA[config.velocidade],
        aberta,
        definirVolume,
        alternarTela,
        definirVelocidade,
        abrirConfig,
        fecharConfig,
      }}
    >
      {children}
    </ConfigContexto.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContexto);
}
