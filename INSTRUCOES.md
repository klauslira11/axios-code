# Configuração do Supabase & Projeto QR Code Dinâmico

## 1. Instruções para criar a tabela no Supabase
1. Acesse o painel do seu projeto no Supabase (https://supabase.com).
2. Vá em **SQL Editor**.
3. Copie o conteúdo do arquivo [`schema.sql`](file:///c:/Users/klaus/Documents/antigravity/axioscodes/schema.sql) e execute.
4. A tabela `qr_codes` será criada com suporte a RLS e colunas `id`, `name`, `target_url`, `secret_key`, `created_at`, e `updated_at`.

## 2. Configurar Variáveis de Ambiente (.env)
Crie um arquivo `.env` na raiz do projeto com as suas credenciais públicas do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## 3. URL Pública do Aplicativo
- Todas as requisições geradas para o QR Code usam a URL permanente `/q/:id`.
- Ao acessar `/q/:id`, o aplicativo consulta a tabela no Supabase e redireciona automaticamente para o `target_url` configurado.
- Para gerenciar os QR Codes criados, a URL privada conterá o parâmetro `?key=SUA_CHAVE_SECRETA`.
