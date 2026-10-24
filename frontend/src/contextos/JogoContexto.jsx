import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../servicos/api';
import { useAutenticacao } from './Autenticacao';

const JogoContexto = createContext({});

export function JogoProvider({ children }) {
  const { logado } = useAutenticacao();

  const [dia, setDia] = useState(null);
  const [progresso, setProgresso] = useState({ fase: 1, moedas: 0 });
  const [carregando, setCarregando] = useState(true);
  const [resumoFinal, setResumoFinal] = useState(null);

  // Busca as moedas e fase salva do jogador
  const carregarProgresso = useCallback(async () => {
    if (!logado) return;
    try {
      const { data } = await api.get('/progresso');
      setProgresso(data);
    } catch (err) {
      console.error('Erro ao buscar progresso:', err);
    }
  }, [logado]);

  // Consulta o dia aberto ou fecha pendentes e abre um novo
  const sincronizarDia = useCallback(async () => {
    if (!logado) return;
    try {
      const { data } = await api.get('/dias/atual');
      setDia(data);

      // Se o backend concluiu o dia ou deu Game Over, ativa o modal de resumo
      if (data.status === 'concluido' || data.status === 'game_over') {
        if (data.resumo) {
          setResumoFinal(data.resumo);
        }
      }
    } catch (err) {
      if (err.codigo === 'NAO_ENCONTRADO') {
        // Nenhum dia aberto: inicia um novo dia automaticamente
        try {
          const { data: novoDia } = await api.post('/dias');
          setDia(novoDia);
          setResumoFinal(null);
        } catch (erroIniciar) {
          console.error('Erro ao iniciar dia:', erroIniciar);
        }
      }
    } finally {
      setCarregando(false);
    }
  }, [logado]);

  // Polling a cada 4 segundos para atualizar timers e clientes na fila
  useEffect(() => {
    if (!logado) {
      setDia(null);
      setCarregando(false);
      return;
    }

    carregarProgresso();
    sincronizarDia();

    const intervalo = setInterval(() => {
      sincronizarDia();
    }, 4000);

    return () => clearInterval(intervalo);
  }, [logado, carregarProgresso, sincronizarDia]);

  // Alterna o estado de pausa (RF29)
  async function alternarPausa() {
    if (!dia) return;
    try {
      if (dia.status === 'em_andamento') {
        const { data } = await api.post(`/dias/${dia.id}/pausar`);
        setDia(data);
      } else if (dia.status === 'pausado') {
        const { data } = await api.post(`/dias/${dia.id}/retomar`);
        setDia(data);
      }
    } catch (err) {
      alert(err.mensagem || 'Não foi possível alterar a pausa.');
    }
  }

  // Inicia uma nova rodada após o encerramento do dia
  async function iniciarProximoDia() {
    setResumoFinal(null);
    setCarregando(true);
    try {
      const { data } = await api.post('/dias');
      setDia(data);
      await carregarProgresso();
    } catch (err) {
      alert(err.mensagem || 'Erro ao iniciar próximo dia.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <JogoContexto.Provider
      value={{
        dia,
        progresso,
        carregando,
        resumoFinal,
        alternarPausa,
        sincronizarDia,
        carregarProgresso,
        iniciarProximoDia,
      }}
    >
      {children}
    </JogoContexto.Provider>
  );
}

export function useJogo() {
  return useContext(JogoContexto);
}