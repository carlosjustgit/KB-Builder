import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Loader2, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast.tsx";

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationalAIProps {
  currentStep: string;
  companyUrl: string;
  sessionId: string;
  currentContent?: string;
  userLanguage?: string; // Add user language
}

export function ConversationalAI({ currentStep, companyUrl, sessionId, currentContent, userLanguage }: ConversationalAIProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Send new message mutation
  const sendMessageMutation = useMutation<ChatMessage, Error, { content: string }>({
    mutationFn: async ({ content }) => {
      console.log('🚀 Sending chat message:', {
        sessionId,
        content: content.substring(0, 50) + '...',
        currentStep,
        companyUrl,
        hasCurrentContent: !!currentContent,
        userLanguage
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          role: 'user',
          content,
          current_step: currentStep,
          company_url: companyUrl,
          current_content: currentContent,
          user_language: userLanguage, // Pass user language
        }),
      });

      console.log('📡 Chat response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Chat API error:', errorData);
        throw new Error(errorData.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['stepContent', sessionId, currentStep] });
      queryClient.invalidateQueries({ queryKey: ['currentStepContent', sessionId, currentStep] });
      queryClient.invalidateQueries({ queryKey: ['documents', sessionId] });
      setInputValue("");
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear chat');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      toast({
        title: "Chat Cleared",
        description: "All messages have been cleared",
      });
    },
    onError: (error) => {
      toast({
        title: "Clear Chat Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (inputValue.trim() && !sendMessageMutation.isPending) {
      await sendMessageMutation.mutateAsync({ content: inputValue });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all chat messages? This action cannot be undone.'
    );
    
    if (confirmed) {
      clearChatMutation.mutate();
    }
  };

  useEffect(() => {
    scrollAreaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

  const isLoading = sendMessageMutation.isPending;

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <img src="/Wit-profile.png" alt="Wit" className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Start a conversation about your research
              </p>
              <p className="text-xs mt-1">
                Try: "Is this information accurate?" or "Change the tone to be more professional"
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-center space-x-2 ${
                  message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  {message.role === "user" ? (
                    <User className="h-6 w-6 text-primary" />
                  ) : (
                    <img src="/Wit-profile.png" alt="Wit" className="h-6 w-6 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start justify-start">
              <div className="flex items-center space-x-2">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
                <img src="/Wit-profile.png" alt="Wit" className="h-6 w-6 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your research or request changes..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              onClick={handleClearChat}
              disabled={clearChatMutation.isPending}
              variant="outline"
              size="sm"
              title="Clear chat history"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}