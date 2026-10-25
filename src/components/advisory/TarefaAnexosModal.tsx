import React, { useEffect, useRef, useState } from 'react';
import { Clipboard, Download, FileText, Image as ImageIcon, LoaderCircle, Upload, X } from 'lucide-react';
import { advisoryService, type TarefaAnexo } from '../../services/advisoryService';

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(iso: string): string {
  const data = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString('pt-BR');
}

export function TarefaAnexosModal({ clienteId, tarefaId, titulo, onClose }: { clienteId: number; tarefaId: number; titulo: string; onClose: () => void }) {
  const [anexos, setAnexos] = useState<TarefaAnexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [colado, setColado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    setError('');
    advisoryService.anexos(clienteId, tarefaId)
      .then(setAnexos)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [clienteId, tarefaId]);

  const enviar = async (arquivo: File, nome?: string) => {
    setEnviando(true);
    setError('');
    try {
      await advisoryService.enviarAnexo(clienteId, tarefaId, arquivo, nome);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar o anexo.');
    } finally {
      setEnviando(false);
    }
  };

  const baixar = async (anexo: TarefaAnexo) => {
    try {
      const blob = await advisoryService.baixarAnexo(clienteId, anexo.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o anexo.');
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.kind === 'file' && entry.type.startsWith('image/'));
    if (!item) return;
    const arquivo = item.getAsFile();
    if (!arquivo) return;
    event.preventDefault();
    setColado(true);
    setTimeout(() => setColado(false), 1200);
    void enviar(arquivo, `imagem-colada-${Date.now()}.png`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} onPaste={handlePaste} tabIndex={-1} className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl outline-none">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Histórico & Anexos</h2>
            <p className="text-sm text-brand-slate">{titulo}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="space-y-3 border-b border-slate-200 p-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-brand-navy/20 bg-brand-cream-light p-4 text-sm text-brand-slate">
            <Clipboard size={18} className={colado ? 'text-emerald-600' : 'text-brand-navy/50'} />
            <span>Clique aqui dentro e cole (Ctrl+V) uma imagem printada, ou envie qualquer arquivo pelo botão ao lado.</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const arquivo = e.target.files?.[0]; if (arquivo) void enviar(arquivo); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={enviando}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-light disabled:opacity-60"
            >
              {enviando ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />} Anexar arquivo
            </button>
            <span className="text-xs text-brand-slate">PDF, imagens, Word, Excel ou texto — até 10 MB.</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex min-h-[120px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
          ) : anexos.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Nenhum anexo ainda. Esse espaço guarda o histórico de documentos e imagens dessa tarefa.</p>
          ) : (
            <ul className="space-y-2">
              {anexos.map((anexo) => (
                <li key={anexo.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {anexo.mime.startsWith('image/') ? <ImageIcon size={18} className="shrink-0 text-brand-gold-dark" /> : <FileText size={18} className="shrink-0 text-brand-slate" />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-navy">{anexo.nome_original}</p>
                      <p className="text-xs text-brand-slate">{formatarTamanho(anexo.tamanho)} · {anexo.enviado_por || 'Usuário'} · {formatarData(anexo.criado_em)}</p>
                    </div>
                  </div>
                  <button onClick={() => void baixar(anexo)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-cream-light" title="Abrir">
                    <Download size={14} /> Ver
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
