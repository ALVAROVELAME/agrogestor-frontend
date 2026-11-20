# Testes automatizados

Execute `npm test`. A suíte cobre a demonstração da landing, acesso às páginas legais, cadastro, login e suas falhas, proteção de rotas, confirmação de e-mail e nova tentativa, estados de status, indicadores vazios, validação e cancelamento do formulário de animais, operações do hook de rebanho e serviços de autenticação e animais.

Os testes simulam as chamadas da API. Eles não verificam comunicação com o servidor real nem a aparência das telas.

O fluxo de recuperação inclui testes para solicitação, token ausente ou expirado, confirmação de senha e sucesso. Na API, há testes unitários e HTTP; o teste integrado com MariaDB requer Docker.

## Cenários a ampliar

- Landing: navegação, menu móvel, demonstração, FAQ, links e movimento reduzido.
- Autenticação: login válido e inválido, persistência, expiração e logout; rotas públicas e protegidas.
- Cadastro: validação, aceite de termos, senhas, sucesso e falha da API.
- Confirmação de e-mail e status: token ausente, válido, expirado, falhas e nova tentativa.
- Termos e privacidade: conteúdo, índice, navegação e acessibilidade.
- Dashboard e rebanho: carregamento, erros, criação, edição, exclusão, filtros, produção, relatórios e estados vazios.
- Serviços: conversão de categorias, erros da API, segurança da sessão e exclusão de conta.
- Integração e ponta a ponta: fluxos completos com backend de teste, responsividade, teclado e verificação automatizada de acessibilidade.

Os itens acima incluem cenários parcialmente cobertos e ainda não implementados, em especial testes de ponta a ponta, responsividade e acessibilidade automatizada.
