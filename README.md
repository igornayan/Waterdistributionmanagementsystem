# Water Distribution Management System

Sistema de gerenciamento de distribuição de água para famílias com cisternas em regiões semiáridas.

Documentação completa de funcionalidades: [DOCUMENTACAO-FUNCIONALIDADES.md](./DOCUMENTACAO-FUNCIONALIDADES.md)

## Executar o projeto

```bash
npm i
npm run dev
```

## Alterações recentes

### v1.2 — Recuperação de senha

- **`/esqueci-senha`** — solicita email e envia token (`POST /auth/forgot-password`)
- **`/redefinir-senha`** — redefine senha com token do email (`PATCH /auth/reset-password`)
- Suporte a `/redefinir-senha?token=...` (token pré-preenchido)
- Link **"Esqueci minha senha"** na tela de login
- Após redefinir, redireciona para login (sem autenticação automática)

### v1.1 — Usuários, famílias e validações

#### Gerenciamento de usuários
- Cargo exibido como texto na listagem; edição via dialog
- API de atualização de cargo: `PUT /user-management/users/{id}/role`
- API de remoção de usuário: `DELETE /user-management/users/{id}`
- Remover usuário: apenas administradores
- Atribuir cargo com permissão `ADMIN`: apenas administradores (criação e edição)

#### Famílias
- Ativar/desativar família no lugar de excluir (`PATCH /families/{id}/activate|deactivate`)
- Campo `active` no `FamilyDTO`
- Badge **Inativa** (cor âmbar) na listagem e nos detalhes
- Família inativa: edição e registro de entrega desabilitados; demais dados permanecem visíveis
- Toggle de status atualiza apenas `active` no front (sem recarregar dados calculados)

#### Validações e autenticação
- Latitude (-90 a 90) e longitude (-180 a 180) no cadastro e edição de família
- Senha mínima de 8 caracteres no primeiro acesso (`ChangePassword`)
