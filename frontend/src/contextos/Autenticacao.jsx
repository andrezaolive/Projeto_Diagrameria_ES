import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../servicos/api';

const AutenticacaoContexto = createContext({});

export function AutenticacaoProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarSessao() {
      const token = localStorage.getItem('diagrameria_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/eu');
          setUsuario(data.usuario);
        } catch {
          localStorage.removeItem('diagrameria_token');
          setUsuario(null);
        }
      }
      setCarregando(false);
    }
    carregarSessao();
  }, []);

  async function entrar(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('diagrameria_token', data.token);
    setUsuario(data.usuario);
  }

  async function cadastrar(nome, email, senha) {
    const { data } = await api.post('/auth/cadastro', { nome, email, senha });
    localStorage.setItem('diagrameria_token', data.token);
    setUsuario(data.usuario);
  }

  function sair() {
    localStorage.removeItem('diagrameria_token');
    setUsuario(null);
  }

  return (
    <AutenticacaoContexto.Provider
      value={{ usuario, logado: !!usuario, carregando, entrar, cadastrar, sair }}
    >
      {!carregando && children}
    </AutenticacaoContexto.Provider>
  );
}

export function useAutenticacao() {
  return useContext(AutenticacaoContexto);
}