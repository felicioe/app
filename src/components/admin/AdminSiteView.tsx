import React, { useEffect, useState } from 'react';
import { LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import { CONTEUDO_PADRAO, institucionalService, parseServicos, type ConteudoSite, type Servico } from '../../services/institucionalService';

const CAMPOS_TEXTO: { chave: keyof typeof CONTEUDO_PADRAO; label: string; textarea?: boolean }[] = [
  { chave: 'hero_eyebrow', label: 'Etiqueta acima do título' },
  { chave: 'hero_titulo', label: 'Título principal' },
  { chave: 'hero_subtitulo', label: 'Subtítulo', textarea: true },
  { chave: 'sobre_texto', label: 'Texto "Sobre"', textarea: true },
  { chave: 'contato_titulo', label: 'Título da seção de contato' },
  { chave: 'contato_email', label: 'E-mail de contato' },
  { chave: 'cta_workspace_label', label: 'Botão Workspace — texto' },
  { chave: 'cta_workspace_desc', label: 'Botão Workspace — descrição' },
  { chave: 'cta_advisory_label', label: 'Botão Advisory — texto' },
  { chave: 'cta_advisory_desc', label: 'Botão Advisory — descrição' },
];

export function AdminSiteView() {
  const [campos, setCampos] = useState<ConteudoSite>(CONTEUDO_PADRAO);
  const [servicos, setServicos] = useState<Servico[]>(parseServicos(CONTEUDO_PADRAO.servicos));
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    institucionalService.obter()
      .then((real) => { const merged = { ...CONTEUDO_PADRAO, ...real }; setCampos(merged); setServicos(parseServicos(merged.servicos)); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o conteúdo.'))
      .finally(() => setLoading(false));
  }, []);

  const salvar = async () => {
    setSalvando(true);
    setError('');
    setSucesso('');
    try {
      await institucionalService.salvar({ ...campos, servicos: JSON.stringify(servicos) });
      setSucesso('Conteúdo publicado com sucesso.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <a href="/" className="text-sm font-semibold text-brand-gold-dark">← Ver site institucional</a>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Editar site institucional</h1>
            <p className="mt-1 text-sm text-slate-500">Alterações aparecem imediatamente na página pública ao salvar.</p>
          </div>
          <button onClick={() => void salvar()} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-light disabled:opacity-60">
            {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Salvar e publicar
          </button>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {sucesso && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{sucesso}</p>}

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {CAMPOS_TEXTO.map(({ chave, label, textarea }) => (
            <label key={chave} className="block text-xs font-medium text-slate-700">
              {label}
              {textarea ? (
                <textarea
                  rows={3}
                  value={campos[chave] ?? ''}
                  onChange={(e) => setCampos({ ...campos, [chave]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
                />
              ) : (
                <input
                  value={campos[chave] ?? ''}
                  onChange={(e) => setCampos({ ...campos, [chave]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
                />
              )}
            </label>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Serviços (seção "O que fazemos")</h2>
            <button
              onClick={() => setServicos([...servicos, { titulo: '', descricao: '' }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          {servicos.map((servico, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_2fr_auto]">
              <input
                placeholder="Título"
                value={servico.titulo}
                onChange={(e) => setServicos(servicos.map((item, i) => (i === index ? { ...item, titulo: e.target.value } : item)))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                placeholder="Descrição"
                value={servico.descricao}
                onChange={(e) => setServicos(servicos.map((item, i) => (i === index ? { ...item, descricao: e.target.value } : item)))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button onClick={() => setServicos(servicos.filter((_, i) => i !== index))} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50" title="Remover">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {servicos.length === 0 && <p className="text-xs text-slate-400">Nenhum serviço cadastrado.</p>}
        </div>
      </div>
    </main>
  );
}
