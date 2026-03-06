# SPEC — Autenticação com Supabase (SignUp + Login)

Derivado do PRD.md, Seção 10. Cada item descreve exatamente o que criar ou modificar, com base no estado atual do código.

---

## Pré-requisito: Migration SQL (Supabase Dashboard)

**Onde executar:** Supabase Dashboard > Database > SQL Editor > New query

Executar antes de qualquer alteração no código. O trigger abaixo é necessário para que o cadastro salve os dados do veterinário em `public.profiles` automaticamente.

```sql
-- 1. Tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  crmv TEXT,
  clinic_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Veterinario le proprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Veterinario atualiza proprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Funcao trigger
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

-- 4. Trigger associado ao INSERT em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

> Se o trigger falhar, o cadastro do usuario tambem falha. Testar com um usuario de desenvolvimento antes de ativar em producao.

---

## Passo 1 — CRIAR `src/contexts/AuthContext.tsx`

**Status atual:** Arquivo inexistente. So existe `src/contexts/PatientContext.tsx`.

**O que criar:** Context + Provider que gerencia `session`, `user`, `loading` e `signOut`. Todos os componentes que precisam saber se o usuario esta logado consumirao este context via `useAuth()`.

**Logica necessaria:**
- `supabase.auth.getSession()` no mount para recuperar sessao ja existente (localStorage).
- `supabase.auth.onAuthStateChange()` para reagir a login/logout em tempo real.
- Cleanup do subscriber no `return` do `useEffect`.

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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

---

## Passo 2 — CRIAR `src/components/auth/ProtectedRoute.tsx`

**Status atual:** Arquivo inexistente. O diretorio `src/components/auth/` ja existe (contem `LoginForm.tsx` e `RegisterForm.tsx`).

**O que criar:** Componente wrapper que verifica se existe sessao ativa. Se nao houver, redireciona para `/login`. Enquanto o estado de auth esta sendo carregado (`loading: true`), retorna `null` para evitar flash de conteudo protegido.

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return null;

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
```

---

## Passo 3 — MODIFICAR `src/App.tsx`

**Status atual:** Nenhum `AuthProvider` envolve a arvore. Nenhuma rota usa `ProtectedRoute`. Todas as rotas internas (ex: `/home`, `/chat`, `/patients`) sao publicamente acessiveis.

**O que modificar:**

1. Importar `AuthProvider` de `@/contexts/AuthContext`.
2. Importar `ProtectedRoute` de `@/components/auth/ProtectedRoute`.
3. Envolver toda a arvore com `<AuthProvider>` (dentro de `QueryClientProvider`, fora do `BrowserRouter` ou envolvendo-o).
4. Adicionar `<ProtectedRoute>` em todas as rotas que exigem sessao.

**Rotas que precisam de protecao** (todas que usam `MainLayout`):
- `/home`
- `/chat`
- `/register-pet`
- `/patients`
- `/patient/:id`
- `/paciente/:id/relatorio-alta`
- `/exams`
- `/dashboard`

**Rotas publicas** (nao proteger):
- `/` (Index)
- `/login`
- `/register`

**Diff conceitual das importacoes a adicionar:**

```typescript
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
```

**Diff conceitual da estrutura de rotas:**

```typescript
// ANTES
<Route
  path="/home"
  element={
    <MainLayout>
      <Home />
    </MainLayout>
  }
/>

// DEPOIS
<Route
  path="/home"
  element={
    <ProtectedRoute>
      <MainLayout>
        <Home />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

Aplicar o mesmo padrao para `/chat`, `/register-pet`, `/patients`, `/patient/:id`, `/paciente/:id/relatorio-alta`, `/exams` e `/dashboard`.

**Estrutura final do provider wrapping:**

```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>           // <-- adicionar aqui
      <PatientProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* rotas publicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* rotas protegidas */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <MainLayout><Home /></MainLayout>
                </ProtectedRoute>
              } />
              {/* ... demais rotas protegidas */}
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PatientProvider>
    </AuthProvider>           // <-- fechar aqui
  </QueryClientProvider>
);
```

---

## Passo 4 — MODIFICAR `src/components/auth/RegisterForm.tsx`

**Status atual:** Interface `RegisterFormProps` tem apenas `onRegister(email, password)`. Formulario coleta apenas `email`, `password` e `confirmPassword`. Nenhum campo de perfil veterinario existe.

**O que modificar:**

1. Atualizar interface `RegisterFormProps` para aceitar os novos campos na assinatura de `onRegister`.
2. Adicionar 3 novos estados: `fullName`, `crmv`, `clinicName`.
3. Adicionar 3 novos campos no formulario (antes dos campos de senha).
4. Incluir `fullName` e `crmv` na validacao de campos obrigatorios.
5. Passar os novos campos na chamada de `onRegister`.
6. Atualizar o toast de sucesso para indicar verificacao de e-mail.

**Atualizacoes de interface e estado:**

```typescript
// Interface atualizada
interface RegisterFormProps {
  onRegister: (
    email: string,
    password: string,
    fullName: string,
    crmv: string,
    clinicName: string
  ) => Promise<void>;
}

// Novos estados a adicionar
const [fullName, setFullName] = useState('');
const [crmv, setCrmv] = useState('');
const [clinicName, setClinicName] = useState('');
```

**Validacao atualizada (campos obrigatorios):**

```typescript
// ANTES
if (!email || !password || !confirmPassword) { ... }

// DEPOIS
if (!fullName || !crmv || !email || !password || !confirmPassword) { ... }
```

**Novos campos JSX a inserir no formulario (antes do campo de email):**

```tsx
<div className="space-y-2">
  <Label htmlFor="fullName">Nome completo</Label>
  <Input
    id="fullName"
    type="text"
    placeholder="Dr. Ana Lima"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    required
  />
</div>

<div className="space-y-2">
  <Label htmlFor="crmv">CRMV</Label>
  <Input
    id="crmv"
    type="text"
    placeholder="CRMV-SP 12345"
    value={crmv}
    onChange={(e) => setCrmv(e.target.value)}
    required
  />
</div>

<div className="space-y-2">
  <Label htmlFor="clinicName">Nome da clinica (opcional)</Label>
  <Input
    id="clinicName"
    type="text"
    placeholder="Clinica VetPro"
    value={clinicName}
    onChange={(e) => setClinicName(e.target.value)}
  />
</div>
```

**Chamada de onRegister atualizada:**

```typescript
// ANTES
await onRegister(email, password);

// DEPOIS
await onRegister(email, password, fullName, crmv, clinicName);
```

**Toast de sucesso atualizado:**

```typescript
// ANTES
toast({ title: "Conta criada com sucesso!", description: "Bem-vindo ao PredictLab." });

// DEPOIS
toast({
  title: "Conta criada com sucesso!",
  description: "Verifique seu e-mail para confirmar o cadastro.",
});
```

---

## Passo 5 — MODIFICAR `src/pages/Register.tsx`

**Status atual:** `handleRegister(email, password)` apenas faz `console.log`, aguarda 800ms e redireciona para `/chat`.

**O que modificar:**

1. Importar `supabase` de `@/integrations/supabase/client`.
2. Importar `useNavigate` (ja importado).
3. Atualizar assinatura de `handleRegister` para receber `fullName`, `crmv`, `clinicName`.
4. Substituir o stub por chamada real a `supabase.auth.signUp()` com `options.data`.
5. Tratar erro lancando-o (o `catch` no `RegisterForm.tsx` exibira o toast de erro).
6. Apos sucesso, redirecionar para `/login` (nao para `/chat`) com indicacao de verificar e-mail.
7. Remover `console.log` de debug.

```typescript
// src/pages/Register.tsx
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const navigate = useNavigate();

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

    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <RegisterForm onRegister={handleRegister} />
    </div>
  );
};

export default Register;
```

---

## Passo 6 — MODIFICAR `src/pages/Login.tsx`

**Status atual:** `handleLogin(email, password)` apenas faz `console.log`, aguarda 800ms e redireciona para `/home`.

**O que modificar:**

1. Importar `supabase` de `@/integrations/supabase/client`.
2. Substituir o stub por chamada real a `supabase.auth.signInWithPassword()`.
3. Tratar erro lancando-o (o `catch` no `LoginForm.tsx` exibira o toast de erro).
4. Apos sucesso, o `AuthContext` atualiza a sessao automaticamente via `onAuthStateChange` — so e necessario redirecionar para `/home`.
5. Remover `console.log` de debug.

```typescript
// src/pages/Login.tsx
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
```

---

## Resumo dos Arquivos

| Arquivo | Acao | Motivo |
|---|---|---|
| `src/contexts/AuthContext.tsx` | CRIAR | Context global de sessao e usuario |
| `src/components/auth/ProtectedRoute.tsx` | CRIAR | Guard de rotas autenticadas |
| `src/App.tsx` | MODIFICAR | Adicionar `AuthProvider` + `ProtectedRoute` em 8 rotas |
| `src/components/auth/RegisterForm.tsx` | MODIFICAR | Adicionar campos fullName, crmv, clinicName + atualizar interface |
| `src/pages/Register.tsx` | MODIFICAR | Substituir stub por `supabase.auth.signUp()` |
| `src/pages/Login.tsx` | MODIFICAR | Substituir stub por `supabase.auth.signInWithPassword()` |
| Supabase SQL Editor | EXECUTAR | Criar `public.profiles` + trigger `handle_new_user` |

---

## Dependencias entre os Passos

```
Migration SQL
    |
    v
AuthContext.tsx (Passo 1)
    |
    +---> ProtectedRoute.tsx (Passo 2)
    |         |
    |         v
    |     App.tsx (Passo 3)  <-- depende de ambos
    |
    +---> Register.tsx (Passo 5)  <-- independente de ProtectedRoute
    |
    +---> Login.tsx (Passo 6)     <-- independente de ProtectedRoute

RegisterForm.tsx (Passo 4)  <-- deve ser feito antes de Register.tsx (Passo 5)
```

Os passos 1 e 2 podem ser feitos em paralelo. O passo 3 (App.tsx) depende de ambos. Os passos 4 e 5 devem ser feitos nessa ordem (4 antes de 5). O passo 6 e independente dos demais (exceto da Migration SQL ja estar feita no Supabase).
