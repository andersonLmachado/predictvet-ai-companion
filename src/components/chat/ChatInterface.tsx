import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Stethoscope, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePatient, type PatientInfo } from '@/contexts/PatientContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'patient-suggestion';
  suggestedPatients?: PatientInfo[];
}

const N8N_WEBHOOK_URL = 'https://vet-api.predictlab.com.br/webhook/chat';

const EXAM_KEYWORDS = ['exame', 'exames', 'resultado', 'resultados', 'histórico', 'hemograma', 'urinálise', 'bioquímico', 'laudo'];

const ChatInterface = () => {
  const { selectedPatient, setSelectedPatient, patients, patientsLoaded } = usePatient();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Olá! 🐾 Sou o **PredictLab**, seu assistente veterinário com IA.\n\nComo posso ajudá-lo hoje? Você pode me enviar sintomas, perguntas sobre diagnósticos ou qualquer dúvida veterinária.${selectedPatient ? `\n\n📋 Paciente selecionado: **${selectedPatient.name}**` : ''}`,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findMatchingPatients = (text: string): PatientInfo[] => {
    if (!patientsLoaded || patients.length === 0) return [];
    const lower = text.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase())
    );
  };

  const containsExamKeyword = (text: string): boolean => {
    const lower = text.toLowerCase();
    return EXAM_KEYWORDS.some(k => lower.includes(k));
  };

  const sendToN8N = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          patient_id: selectedPatient?.id ?? null,
          patient_name: selectedPatient?.name ?? null,
          timestamp: new Date().toISOString(),
          source: 'PredictLab Chat',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        if (!textResponse || textResponse.trim() === '') {
          return 'Recebi sua mensagem e estou processando. Como posso ajudá-lo com este caso veterinário?';
        }
        return textResponse;
      }

      const data = await response.json();
      const aiResponse = data.output || data.response || data.message || data.text || data.result;

      if (!aiResponse) {
        return 'Recebi sua mensagem. Pode me fornecer mais detalhes sobre o caso que está analisando?';
      }

      return aiResponse;
    } catch (error) {
      console.error('Erro ao enviar para n8n:', error);
      throw error;
    }
  };

  const handleSelectPatient = (patient: PatientInfo) => {
    setSelectedPatient(patient);
    const confirmMsg: Message = {
      id: Date.now().toString(),
      text: `✅ Paciente **${patient.name}** (${patient.breed || patient.species || 'sem raça'}) selecionado! Tutor: ${patient.owner_name}.\n\nAgora posso consultar exames e histórico deste paciente. Como posso ajudar?`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');

    // Check if user is asking about exams without a patient selected
    if (!selectedPatient && containsExamKeyword(currentMessage)) {
      const matches = findMatchingPatients(currentMessage);
      if (matches.length > 0) {
        // Auto-detected patient names
        const suggestion: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Encontrei pacientes que podem corresponder à sua mensagem. Selecione um para continuar:',
          isUser: false,
          timestamp: new Date(),
          type: 'patient-suggestion',
          suggestedPatients: matches.slice(0, 5),
        };
        setMessages(prev => [...prev, suggestion]);
        return;
      } else {
        // No patient selected, suggest picking one
        const noPatientMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: '⚠️ Nenhum paciente selecionado. Para consultar exames ou histórico, por favor selecione um paciente na página **Meus Pacientes** ou digite o nome do paciente aqui.',
          isUser: false,
          timestamp: new Date(),
          type: patients.length > 0 ? 'patient-suggestion' : 'text',
          suggestedPatients: patients.length > 0 ? patients.slice(0, 5) : undefined,
        };
        setMessages(prev => [...prev, noPatientMsg]);
        return;
      }
    }

    // Try to detect a patient name in the message even without exam keywords
    if (!selectedPatient && patientsLoaded) {
      const matches = findMatchingPatients(currentMessage);
      if (matches.length === 1) {
        handleSelectPatient(matches[0]);
        // Continue sending to n8n with the newly selected patient
      }
    }

    setIsLoading(true);

    try {
      const aiResponseText = await sendToN8N(currentMessage);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com o assistente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMarkdownLight = (text: string) => {
    // Simple bold markdown support
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Patient indicator bar */}
      {selectedPatient && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20">
          <Stethoscope className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">
            Paciente: <strong>{selectedPatient.name}</strong>
            {selectedPatient.breed && ` • ${selectedPatient.breed}`}
            {selectedPatient.owner_name && ` • Tutor: ${selectedPatient.owner_name}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs h-6"
            onClick={() => setSelectedPatient(null)}
          >
            Trocar
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isUser 
                    ? 'bg-primary' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {message.isUser ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className={`rounded-2xl px-4 py-3 ${
                  message.isUser 
                    ? 'bg-primary text-primary-foreground rounded-br-md' 
                    : 'bg-muted text-foreground rounded-bl-md border border-border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {renderMarkdownLight(message.text)}
                  </p>
                  <span className={`text-[10px] mt-1 block ${
                    message.isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Patient suggestion chips */}
            {message.type === 'patient-suggestion' && message.suggestedPatients && (
              <div className="flex flex-wrap gap-2 ml-10">
                {message.suggestedPatients.map(p => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                    onClick={() => handleSelectPatient(p)}
                  >
                    🐾 {p.name} {p.breed ? `(${p.breed})` : ''}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-muted border border-border">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">PredictLab está analisando...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedPatient
              ? `Pergunte sobre ${selectedPatient.name}...`
              : 'Digite sintomas, dúvidas ou o nome de um paciente...'
            }
            className="flex-1 min-h-[50px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="self-end"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Pressione Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
