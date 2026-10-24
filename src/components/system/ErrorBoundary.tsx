import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  render() {
    if (this.state.error) {
      return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><section role="alert" className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm"><h1 className="text-lg font-bold text-slate-900">Não foi possível carregar esta tela</h1><p className="mt-2 text-sm text-slate-600">Atualize a página. Se o problema continuar, registre o horário e a operação realizada.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Atualizar</button></section></main>;
    }
    return this.props.children;
  }
}
