# Contexto do Projeto: Vet AI Platform

Este documento descreve a arquitetura técnica, convenções e fluxos de dados do repositório atual. Utilize este arquivo como contexto para entender o funcionamento do sistema.

## 1. Visão Geral
A aplicação é uma plataforma veterinária focada em **análise de exames assistida por IA** e gestão de pacientes. É um SPA (Single Page Application) moderno construído com o ecossistema React.

## 2. Stack Tecnológico

### Frontend
- **Framework:** React 18 + Vite.
- **Linguagem:** TypeScript.
- **Estilização:** Tailwind CSS + shadcn/ui.
- **Ícones:** Lucide React.
- **Gerenciamento de Estado/Data:** React Query (`@tanstack/react-query`) + Hooks locais.
- **Roteamento:** React Router DOM (`v6`).
- **Charts:** Recharts.
- **Runtime/Package Manager:** Bun.

### Backend & Integrações
A arquitetura de backend é **híbrida**:
1.  **Supabase:**
    -   Utilizado para **Autenticação** e **Banco de Dados Relacional** (PostgreSQL).
    -   Cliente configurado em `src/integrations/supabase/client.ts`.
    -   Tabelas principais: `patients` (dados dos animais e tutores).

2.  **Webhooks (n8n/Backend API):**
    -   Utilizado para lógica de negócios complexa e integrações de IA.
    -   Base URL: `https://vet-api.predictlab.com.br/webhook`

## 3. Estrutura de Diretórios (`src/`)

-   **`components/`**: Componentes de UI reutilizáveis.
    -   `ui/`: Componentes base do shadcn/ui (Button, Input, Card, etc.).
    -   `pets/`: Componentes específicos de gestão de pacientes (ex: `PetRegistrationForm`, `PatientHeader`).
    -   `analysis/`: Componentes de análise de exames (ex: `FileDropzone`, `AnalysisResults`).
    -   `layout/`: Estruturas de layout (ex: `MainLayout`).
-   **`pages/`**: Views principais da aplicação mapeadas nas rotas (ex: `Exams.tsx`, `Patients.tsx`, `RegisterPet.tsx`).
-   **`integrations/supabase/`**: Configuração do cliente Supabase e tipos.
-   **`hooks/`**: Custom hooks (ex: `use-toast`).
-   **`lib/`**: Utilitários gerais (ex: `utils.ts` para classes Tailwind).

## 4. Fluxos de Dados Principais

### A. Cadastro de Pacientes (`RegisterPet.tsx`)
-   **Método:** Webhook via API.
-   **Componente:** `PetRegistrationForm`.
-   **Fluxo:**
    1.  Validação local do formulário.
    2.  Verificação de autenticação (`supabase.auth.getUser()`).
    3.  POST para `/webhook/cadastrar-paciente`.
    4.  Campos enviados (JSON): `name`, `species`, `breed`, `age` (calculada), `sex`, `weight`, `owner_name`, `owner_phone`, `owner_email`, `veterinarian_id`.

### B. Análise de Exames - Fluxo "Patient-Centric" (`Exams.tsx`)
Este fluxo prioriza a seleção do paciente antes do upload do exame.
-   **Método:** Webhooks HTTP.
-   **Fluxo:**
    1.  **Busca de Pacientes:** GET em `/webhook/buscar-pacientes`.
        -   Retorna lista de pacientes cadastrados.
    2.  **Seleção:** Usuário seleciona um paciente da lista (Obrigatório).
    3.  **Upload:**
        -   POST em `/webhook/analisar-arquivo`.
        -   Payload: `FormData` contendo o arquivo (`data`) e o tipo (`examType`).
        -   A seleção do paciente no frontend garante que o resultado seja associado ao animal correto visualmente (Header `PatientHeader`).

## 5. Convenções e Padrões
-   **Nomes de Arquivos:** PascalCase para Componentes/Páginas (`RegisterPet.tsx`), camelCase para hooks/utils (`use-toast.ts`).
-   **Estilização:** Utility-first com Tailwind. Evitar CSS puro (`.css`) exceto para configurações globais.
-   **Imports:** Uso de alias `@/` apontando para `src/`.
-   **Tipagem:** Interfaces TypeScript explícitas para respostas de API e Props de componentes.

## 6. Autenticação
-   Gerenciada pelo Supabase Auth.
-   O usuário deve estar logado para acessar rotas protegidas (`MainLayout`) e realizar operações de escrita (cadastro de pets).
