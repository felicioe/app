import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.tsx', 'utf8');
const layout = readFileSync('src/components/layout/AppLayout.tsx', 'utf8');
const flow = readFileSync('src/services/flowService.ts', 'utf8');
const advisory = readFileSync('src/services/advisoryService.ts', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

for (const route of ['/workspace', '/advisory']) assert.ok(app.includes(route), 'rota principal ausente: ' + route);
for (const endpoint of ['flow/documentos.php', 'flow/alcadas.php', 'flow/notificacoes.php', 'flow/aprovacoes.php']) assert.ok(flow.includes(endpoint), 'endpoint Flow ausente: ' + endpoint);
for (const endpoint of ['advisory/timesheet.php', 'advisory/kanban.php', 'advisory/despesas.php', 'advisory/faturamento.php']) assert.ok(advisory.includes(endpoint), 'endpoint Advisory ausente: ' + endpoint);
assert.ok(layout.includes("item.id !== 'admin' || canAdmin"), 'menu administrativo sem restrição');
assert.ok(layout.includes("item.id !== 'despesas' || canOperate"), 'menu de despesas sem restrição');
assert.ok(layout.includes("item.id !== 'faturas' || canBilling"), 'menu de faturas sem restrição');
assert.ok(!app.includes('CLIENTES_MOCK'), 'App ainda depende de clientes mockados');
assert.ok(app.includes("activeView === 'admin' && user.perfil === 'bpo_adm'"), 'guard da administracao ausente');
assert.ok(app.includes("activeView === 'faturas' && user.perfil === 'bpo_adm'"), 'guard de faturamento ausente');
assert.ok(main.includes('ErrorBoundary'), 'Error Boundary ausente');
assert.ok(app.includes('clientes autorizados'), 'estado de carregamento de clientes ausente');
console.log('Frontend contract checks passed.');
