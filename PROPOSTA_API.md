# Proposta de API para expansão do AgroGestor

Esta proposta foi implementada na API e as telas de gestão foram conectadas aos seus registros. Os antigos dados de demonstração eram temporários e não foram migrados.

São **23 endpoints novos ou ampliados**, além dos já existentes. O contrato implementado está documentado no repositório da API, em `docs/novas-funcionalidades-api.md`.

## Ficha do animal — 2

1. `GET /api/animais/{id}` — detalhes do animal.
2. `PATCH /api/animais/{id}/ficha` — atualizar dados complementares, como nascimento, raça e observações.

O CRUD atual de animais permanece; a ficha requer novos campos e validações.

## Produção — 4

3. `GET /api/producoes` — listar com filtros por período, animal e turno.
4. `POST /api/producoes` — registrar ordenha com data, animal, turno e litros.
5. `PUT /api/producoes/{id}` — corrigir registro.
6. `DELETE /api/producoes/{id}` — excluir registro.

## Agenda — 4

7. `GET /api/tarefas` — listar tarefas por data e situação.
8. `POST /api/tarefas` — criar tarefa.
9. `PATCH /api/tarefas/{id}` — editar ou alterar conclusão.
10. `DELETE /api/tarefas/{id}` — excluir tarefa.

## Saúde e reprodução — 4

11. `GET /api/eventos` — listar eventos por animal, tipo e período.
12. `POST /api/eventos` — registrar evento.
13. `PUT /api/eventos/{id}` — corrigir evento.
14. `DELETE /api/eventos/{id}` — excluir evento.

Tipos e campos específicos de tratamentos, reprodução e períodos de descarte devem ser definidos com responsável técnico; o sistema não deve inferir orientação veterinária.

## Financeiro — 4

15. `GET /api/financeiro/lancamentos` — listar por período e tipo.
16. `POST /api/financeiro/lancamentos` — registrar receita ou despesa.
17. `PUT /api/financeiro/lancamentos/{id}` — corrigir lançamento.
18. `DELETE /api/financeiro/lancamentos/{id}` — excluir lançamento.

## Relatórios e indicadores — 5

19. `GET /api/relatorios/producao` — agregados por período e animal.
20. `GET /api/relatorios/financeiro` — receitas, despesas e saldo.
21. `GET /api/relatorios/eventos` — eventos por período e tipo.
22. `GET /api/relatorios/exportacao` — exportação filtrada; formato a definir.
23. `GET /api/indicadores` — resumo de produção, tarefas e finanças calculado a partir dos registros.

Cada consulta e alteração deverá respeitar o dono dos dados, validar datas e valores, prever paginação e testes de isolamento. Comparações e alertas dependem de dados suficientes e regras explícitas; não são previsões automáticas nem diagnóstico. A API precisará de migrações de banco, testes de concorrência e uma estratégia para dados históricos existentes.
