
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o PredictVet, seu assistente veterinário com IA. Como posso ajudá-lo hoje? Você pode me enviar sintomas, perguntas sobre diagnósticos ou qualquer dúvida veterinária.',
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

  const sendToN8N = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('https://a502d49b88db.ngrok-free.app/webhook/7542c3b7-eed8-43fd-b97f-fa5309620430', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString(),
          source: 'PredictVet Chat'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Assumindo que o n8n retorna a resposta em um campo 'response' ou 'message'
      return data.response || data.message || data.text || 'Desculpe, não consegui processar sua solicitação no momento.';
    } catch (error) {
      console.error('Erro ao enviar para n8n:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, digite uma mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Enviar para n8n e aguardar resposta
      const aiResponseText = await sendToN8N(currentMessage);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
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

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isUser ? 'bg-blue-600 ml-2' : 'bg-green-600 mr-2'}`}>
                {message.isUser ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              
              <Card className={`p-3 ${message.isUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.text}</p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </Card>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <Card className="p-3 bg-gray-50 border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite aqui os sintomas do paciente ou sua pergunta..."
            className="flex-1 min-h-[50px] max-h-32"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Pressione Enter para enviar ou Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
