# PRD — Autenticação com Supabase (SignUp + Login)

## 1. Contexto e Diagnóstico

### Estado Atual do Código

O projeto já possui as telas de autenticação criadas, mas sem integração real com o Supabase. Ambas as pages são stubs de simulação:

**`src/pages/Register.tsx`** — `handleRegister` apenas faz `console.log` e simula um delay de 800ms, depois redireciona para `/chat`.

**`src/pages/Login.tsx`** — `handleLogin` igualmente faz `console.log`, simula delay e redireciona para `/home`.

Os componentes de formulário (`RegisterForm.tsx`, `LoginForm.tsx`) estão bem construídos: possuem validações básicas (campos obrigatórios, senha mínima de 6 caracteres, confirmação de senha) e usam o sistema de `toast` do projeto.

**O cliente Supabase já está configurado** em `src/integrations/supabase/client.ts` com `persistSession: true` e `autoRefreshToken: true`, pronto para uso.

**Problema central:** nenhuma das duas pages chama `supabase.auth.signUp()` ou `supabase.auth.signInWithPassword()`. Não existe `AuthContext` nem proteção de rotas.

### Gaps Identificados

| Gap | Impacto |
|---|---|
| `Register.tsx` não chama `supabase.auth.signUp()` | Nenhum usuário é criado no Supabase |
| `Login.tsx` não chama `supabase.auth.signInWithPassword()` | Nenhuma sessão real é criada |
| Sem `AuthContext` | Estado do usuário não é compartilhado entre componentes |
| Sem proteção de rotas | Rotas como `/home`, `/chat`, `/patients` estão acessíveis sem autenticação |
| Tabela `public.profiles` ausente no schema | Dados do veterinário (nome, CRMV, clínica) não são persistidos |
| `RegisterForm.tsx` não coleta nome, CRMV, clínica | Dados profissionais do veterinário não são capturados |

---

## 2. Padrões e Documentação de Referência

### Supabase `auth.signUp()` — API Reference

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'vet@clinica.com',
  password: 'senha123',
  options: {
    data: {
      full_name: 'Dr. Anderson',
      crmv: 'CRMV-SP 12345',
      clinic_name: 'Clínica VetPro',
    },
  },
});
```

- Os campos em `options.data` são gravados em `auth.users.raw_user_meta_data`
- Por padrão, o Supabase envia um e-mail de confirmação — o usuário só pode logar após confirmar
- Para MVP/desenvolvimento, é possível desabilitar "Confirm email" no Dashboard do Supabase (Authentication > Settings)
- Retorna `{ data: { user, session }, error }`

### Supabase `auth.signInWithPassword()` — API Reference

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'vet@clinica.com',
  password: 'senha123',
});
```

- Retorna `{ data: { user, session }, error }`
- Em caso de falha, o erro **não distingue** entre "usuário não existe" e "senha errada" — comportamento intencional de segurança

### `auth.onAuthStateChange()` — Escuta de Sessão

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // event: SIGNED_IN | SIGNED_OUT | TOKEN_REFRESHED | USER_UPDATED
    setSession(session);
    setUser(session?.user ?? null);
  }
);

// Cleanup no useEffect:
return () => subscription.unsubscribe();
```

### PostgreSQL Trigger — Populando `public.profiles`

Padrão oficial do Supabase para replicar dados do `auth.users` para uma tabela pública:

```sql
-- 1. Criar a tabela public.profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  crmv TEXT,
  clinic_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
CREATE POLICY "Usuário lê próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. Função trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, crmv, clinic_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'crmv',
    NEW.raw_user_meta_data ->> 'clinic_name'
  );
  RETURN NEW;
END;
$$;

-- 5. Associar trigger ao evento de criação de usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

> **Atenção:** Se o trigger falhar, o cadastro do usuário também falha. Testar a funcao antes de ativar em produção.

---

## 3. Arquitetura da Solução

### Diagrama de Fluxo

```
[RegisterForm]
  --> [Register.tsx: supabase.auth.signUp({ email, password, options.data })]
  --> [Supabase Auth: cria auth.users]
  --> [Trigger: handle_new_user()]
  --> [public.profiles: insere full_name, crmv, clinic_name]
  --> [E-mail de confirmação enviado]
  --> [Redireciona para /login com mensagem]

[LoginForm]
  --> [Login.tsx: supabase.auth.signInWithPassword({ email, password })]
  --> [Supabase Auth: valida credenciais, cria session]
  --> [AuthContext: session/user atualizados via onAuthStateChange]
  --> [Redireciona para /home]

[Rotas protegidas]
  --> [ProtectedRoute: verifica session no AuthContext]
  --> [Sem sessão: redireciona para /login]
  --> [Com sessão: renderiza componente]
```

### Arquivos a Criar / Modificar

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/contexts/AuthContext.tsx` | CRIAR | Context + Provider com session, user, signOut |
| `src/components/auth/ProtectedRoute.tsx` | CRIAR | Componente que guarda rotas autenticadas |
| `src/pages/Register.tsx` | MODIFICAR | Integrar `supabase.auth.signUp()` com campos extras |
| `src/pages/Login.tsx` | MODIFICAR | Integrar `supabase.auth.signInWithPassword()` |
| `src/components/auth/RegisterForm.tsx` | MODIFICAR | Adicionar campos: Nome completo, CRMV, Clínica |
| `src/App.tsx` | MODIFICAR | Envolver app em `AuthProvider`, proteger rotas internas |
| Supabase Dashboard (SQL Editor) | EXECUTAR | Migration SQL para `public.profiles` + trigger |

---

## 4. Especificação Detalhada de Implementação

### 4.1 `AuthContext.tsx`

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializa sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 4.2 `ProtectedRoute.tsx`

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return null; // ou um spinner

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
```

### 4.3 `Register.tsx` — Integração Real

```typescript
// src/pages/Register.tsx
import { supabase } from '@/integrations/supabase/client';

const handleRegister = async (
  email: string,
  password: string,
  fullName: string,
  crmv: string,
  clinicName: string
) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        crmv: crmv,
        clinic_name: clinicName,
      },
    },
  });

  if (error) throw error;

  // Não redirecionar para /home ainda — aguardar confirmação de e-mail
  // (ou redirecionar para /login com toast de "verifique seu e-mail")
};
```

### 4.4 `Login.tsx` — Integração Real

```typescript
// src/pages/Login.tsx
import { supabase } from '@/integrations/supabase/client';

const handleLogin = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  navigate('/home');
};
```

### 4.5 `App.tsx` — Proteção de Rotas

```typescript
// Envolver em AuthProvider e usar ProtectedRoute nas rotas internas
<AuthProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/home" element={
        <ProtectedRoute>
          <MainLayout><Home /></MainLayout>
        </ProtectedRoute>
      } />
      {/* ... demais rotas protegidas */}
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## 5. Migration SQL — Executar no Supabase

Executar no **SQL Editor** do Supabase Dashboard (`Database > SQL Editor > New query`):

```sql
-- Criar tabela de perfis do veterinário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  crmv TEXT,
  clinic_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Veterinário lê próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Veterinário atualiza próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, crmv, clinic_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'crmv',
    NEW.raw_user_meta_data ->> 'clinic_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger: dispara após INSERT em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Campos Extras no RegisterForm

O `RegisterForm.tsx` atual coleta apenas `email`, `password` e `confirmPassword`. Para o trigger funcionar corretamente, adicionar:

| Campo | Tipo | Obrigatório | Mapeado para |
|---|---|---|---|
| Nome completo | text | Sim | `options.data.full_name` |
| CRMV | text | Sim | `options.data.crmv` |
| Nome da clínica | text | Não | `options.data.clinic_name` |

A assinatura do callback `onRegister` em `RegisterForm` precisará ser atualizada para incluir esses campos.

---

## 7. Fluxo de Confirmação de E-mail

Por padrão, o Supabase exige que o usuário confirme o e-mail antes de poder logar.

**Opção A (MVP/Dev):** Desabilitar confirmação de e-mail no Supabase Dashboard:
- Authentication > Settings > "Confirm email" > Desativar

**Opção B (Produção):** Manter ativado. Após `signUp()` bem-sucedido:
- Redirecionar para `/login`
- Exibir toast: "Conta criada! Verifique seu e-mail para confirmar o cadastro."

---

## 8. Configuração de E-mail (Produção)

Para e-mails transacionais em produção, configurar SMTP próprio no Supabase:
- Authentication > Settings > SMTP Settings
- Recomendado: Resend, SendGrid, ou AWS SES
- O limite gratuito do Supabase é baixo (4 e-mails/hora) — SMTP próprio é obrigatório em produção

---

## 9. Variáveis de Ambiente

Confirmar que o arquivo `.env` (ou `.env.local`) possui:

```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-anon-key>
```

Essas variáveis já são consumidas corretamente em `src/integrations/supabase/client.ts`.

---

## 10. Ordem de Implementação Recomendada

1. **Executar a migration SQL** no Supabase (criar `public.profiles` + trigger)
2. **Criar `AuthContext.tsx`**
3. **Criar `ProtectedRoute.tsx`**
4. **Atualizar `App.tsx`** — envolver em `AuthProvider` e proteger rotas
5. **Atualizar `RegisterForm.tsx`** — adicionar campos de perfil veterinário
6. **Atualizar `Register.tsx`** — integrar `supabase.auth.signUp()`
7. **Atualizar `Login.tsx`** — integrar `supabase.auth.signInWithPassword()`
8. **Testar fluxo completo** — cadastro, confirmação de e-mail, login, proteção de rotas, logout

---

## Fontes

- [Password-based Auth | Supabase Docs](https://supabase.com/docs/guides/auth/passwords)
- [Use Supabase Auth with React | Supabase Docs](https://supabase.com/docs/guides/auth/quickstarts/react)
- [JavaScript API Reference: auth-signup | Supabase Docs](https://supabase.com/docs/reference/javascript/auth-signup)
- [User Management (options.data + trigger) | Supabase Docs](https://supabase.com/docs/guides/auth/managing-user-data)
- [onAuthStateChange | Supabase Docs](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Sign-up database trigger discussion | Supabase GitHub](https://github.com/orgs/supabase/discussions/306)
- [Best practices for profiles table at signup | Supabase GitHub](https://github.com/orgs/supabase/discussions/3491)
- [React Supabase Auth Template | GitHub](https://github.com/mmvergara/react-supabase-auth-template)
