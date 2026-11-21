# AgroGestor — frontend

Aplicação web para gestão de rebanho leiteiro. O frontend reúne cadastro de animais, registros de produção, agenda, saúde e reprodução, financeiro e relatórios em uma interface responsiva.

Este repositório contém **somente o frontend**. O funcionamento das áreas autenticadas depende de uma API compatível, configurada separadamente.

## Funcionalidades

- **Acesso e conta:** cadastro, login, confirmação de e-mail, recuperação e redefinição de senha, logout e exclusão de conta.
- **Visão geral e rebanho:** cadastro, edição, exclusão, filtros e indicadores calculados a partir dos dados atuais dos animais.
- **Gestão:** ficha complementar do animal, ordenhas, tarefas, eventos de saúde e reprodução e lançamentos financeiros.
- **Relatórios:** filtros por nome, brinco e categoria, indicadores, distribuição do rebanho e exportação para Excel.
- **Configurações:** temas claro e escuro, importação e exportação de JSON e opção de zerar o rebanho.
- **Navegação:** busca de comandos com `Ctrl+K` ou `Cmd+K`, menu móvel e barra lateral recolhível no desktop. Clique no logo para recolher ou expandir a barra.
- **Páginas públicas:** apresentação do produto, status, termos de uso e política de privacidade.

A interface inclui recursos como identificação acessível de controles, navegação por teclado, modais de confirmação e suporte a movimento reduzido. Essas medidas não substituem uma auditoria completa de acessibilidade.

## Tecnologias

- React 19, TypeScript 6 e Vite 8.
- React Router 7 para navegação e Axios para comunicação HTTP.
- Tailwind CSS 4 e CSS em `src/index.css` para estilos e temas.
- ExcelJS para geração de arquivos `.xlsx` no navegador.
- Vitest, Testing Library e jsdom para testes; ESLint para análise estática.

As versões exatas instaladas estão em `package-lock.json`.

## Executar localmente

### Pré-requisitos

- Node.js **20.19 ou superior na linha 20**, ou **22.12 ou superior**. O Vite 8 não oferece suporte ao Node 21.
- npm e acesso a uma API AgroGestor compatível.

### Instalação

```bash
git clone https://github.com/ALVAROVELAME/agrogestor-frontend.git
cd agrogestor-frontend
npm ci
```

Copie `.env.example` para `.env` e informe o endereço da API. No PowerShell:

```powershell
Copy-Item .env.example .env
```

Em shells como Bash:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=https://endereco-da-sua-api
```

`VITE_API_URL` é obrigatória. Reinicie o servidor de desenvolvimento depois de alterá-la. Variáveis com prefixo `VITE_` são disponibilizadas no código do navegador: **não coloque segredos nelas**.

```bash
npm run dev
```

Abra o endereço informado pelo Vite no terminal, normalmente `http://localhost:5173`. Para login e operações de gestão, a API deve estar acessível e permitir as requisições da origem do frontend.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Verifica o TypeScript e gera o build de produção em `dist/`. |
| `npm run preview` | Serve localmente um build já gerado. |
| `npm run lint` | Executa o ESLint. |
| `npm test` | Executa a suíte de testes uma vez. |
| `npm run test:watch` | Executa os testes em modo de observação. |
| `npm run test:coverage` | Executa os testes com relatório de cobertura. |

O relatório visual de cobertura é gerado em `coverage/index.html`. A configuração inclui os arquivos TypeScript de `src`, com exceção dos testes, tipos e ponto de entrada `main.tsx`.

## Estrutura

```text
public/                         Logo, favicon e imagem de compartilhamento
src/
  components/
    auth/                       Proteção de rotas e saída da conta
    dashboard/                  Componentes de gestão e relatórios
      utils/                    Métricas, período financeiro e planilha
    AnimalForm.tsx              Formulário do rebanho
    ModalConfirmacao.tsx        Confirmações reutilizáveis
    LegalLayout.tsx             Layout das páginas legais
  contexts/                     Estado de autenticação
  data/                         Dados demonstrativos da página inicial
  hooks/                        Rebanho e interações visuais
  pages/
    auth/                       Acesso, cadastro e recuperação de senha
    legal/                      Termos e política de privacidade
    Dashboard.tsx               Navegação e áreas do painel
    Landing.tsx                 Página inicial
    Status.tsx                  Páginas de status
  services/                     Cliente HTTP e integração com a API
  test/
    auth/                       Testes de autenticação
    dashboard/                  Testes do painel e relatórios
    pages/                      Testes de páginas, rotas e interações
    services/                   Testes dos serviços
    setup.ts                    Configuração compartilhada dos testes
  types/                        Tipos compartilhados
  App.tsx                       Rotas e carregamento das páginas
  index.css                     Estilos globais e variáveis de tema
  main.tsx                      Entrada da aplicação
vite.config.ts                  Configuração do Vite e Tailwind
vitest.config.ts                Configuração de testes e cobertura
vercel.json                     Reescrita de rotas para SPA
```

Arquivos gerados como `dist/`, `coverage/` e logs não fazem parte do código-fonte versionado.

## Relatórios e planilha Excel

Na área **Relatórios**, os filtros de nome, brinco e categoria determinam os animais exibidos e exportados. O botão **Baixar planilha (.xlsx)** gera:

1. **Resumo:** filtros, indicadores, categorias e resumo financeiro.
2. **Animais filtrados:** dados cadastrais e avisos de produção que merece conferência.
3. **Ordenhas:** histórico disponível dos animais filtrados.
4. **Eventos:** registros disponíveis vinculados aos animais filtrados.
5. **Tarefas:** histórico disponível das tarefas gerais e das vinculadas aos animais filtrados.
6. **Financeiro:** lançamentos de todos os animais e lançamentos gerais nos últimos 365 dias, incluindo o dia da exportação.

Os indicadores de produção do rebanho usam o **valor atual cadastrado** por animal; não representam a soma do histórico de ordenhas. A média considera vacas em lactação, inclusive valores zero. Os filtros de animais não são aplicados ao resumo financeiro nem à aba financeira.

A exportação consulta a API antes de gerar o arquivo. Se alguma consulta necessária falhar, a interface informa o erro e não faz o download de uma planilha incompleta. Dados financeiros e históricos dependem das informações disponibilizadas pela API.

## API e autenticação

O cliente Axios em `src/services/api.ts` usa `VITE_API_URL` como endereço base e adiciona o token Bearer salvo no navegador às requisições. O `AuthProvider` valida a sessão usando `/api/auth/me` ao iniciar. Uma resposta 401 de uma requisição autenticada da sessão atual no dashboard limpa a sessão e redireciona para login.

Principais recursos consumidos:

| Recursos | Endpoints |
| --- | --- |
| Autenticação | `/api/auth/login`, `/api/auth/me`, `/api/auth/confirmar`, `/api/auth/forgot-password`, `/api/auth/reset-password` |
| Conta | `/api/usuarios`, `/api/usuarios/me` |
| Rebanho e ficha | `/api/animais`, `/api/animais/:id`, `/api/animais/:id/ficha` |
| Gestão | `/api/producoes`, `/api/tarefas`, `/api/eventos`, `/api/financeiro/lancamentos` |
| Resumo financeiro | `/api/relatorios/financeiro` |

As listagens de ordenhas, tarefas, eventos e lançamentos são paginadas; o serviço percorre as páginas para reunir os registros. O serviço de animais converte os nomes das categorias entre a interface e a API. Para métodos HTTP e formatos atuais, consulte os arquivos em `src/services/`.

O navegador armazena o token e os dados básicos do usuário em `localStorage`, além das preferências de tema e de barra lateral. Os dados de gestão são carregados e salvos pela API; **não há modo offline de rebanho**. A importação JSON cria os animais na API um por um.

## Testes

Os testes estão agrupados por domínio em `src/test/`. Eles exercitam componentes, hooks, serviços e fluxos como autenticação, navegação, gestão e geração de planilhas. As chamadas à API são simuladas; a suíte não substitui testes de integração com o backend real, testes de ponta a ponta ou verificações visuais e de acessibilidade em navegadores e dispositivos.

Para rodar apenas um arquivo:

```bash
npx vitest run src/test/dashboard/report-spreadsheet.test.tsx
```

## Publicação

O build é gerado com `npm run build`. Em hospedagens de SPA, configure as rotas para retornar `index.html`, permitindo o acesso direto às URLs do React Router. O `vercel.json` incluído já configura essa reescrita para a Vercel.

Configure `VITE_API_URL` no ambiente de build da hospedagem e verifique se a API aceita requisições da origem publicada. O endereço da API é incorporado ao frontend durante o build.
