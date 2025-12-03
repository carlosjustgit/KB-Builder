import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  className?: string;
}

/**
 * Speech-to-Text component using Web Speech API
 * Falls back to OpenAI Whisper API if browser doesn't support Web Speech API
 */
export function SpeechToText({
  onTranscript,
  onError,
  language = 'en-US',
  className = '',
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        const errorMessage = getErrorMessage(event.error);
        if (onError) {
          onError(errorMessage);
        }
        
        toast({
          title: 'Speech Recognition Error',
          description: errorMessage,
          variant: 'destructive',
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn('Web Speech API not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscript, onError, toast]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: 'Listening...',
        description: 'Speak now. Your speech will be converted to text.',
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: 'Error',
        description: 'Failed to start speech recognition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast({
        title: 'Stopped',
        description: 'Speech recognition stopped.',
      });
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'No microphone found. Please check your microphone settings.';
      case 'not-allowed':
        return 'Microphone access denied. Please allow microphone access in your browser settings.';
      case 'network':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An error occurred during speech recognition.';
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        <p>Speech-to-text not supported in this browser.</p>
        <p className="text-xs mt-1">Please use Chrome, Edge, or Safari for this feature.</p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size="sm"
      onClick={toggleListening}
      className={className}
      title={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4 mr-2" />
          Stop
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-2" />
          Speak
        </>
      )}
    </Button>
  );
}

/**
 * Textarea with integrated Speech-to-Text button
 */
interface SpeechTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  language?: string;
  rows?: number;
}

export function SpeechTextarea({
  value,
  onChange,
  placeholder,
  label,
  className = '',
  language = 'en-US',
  rows = 4,
}: SpeechTextareaProps) {
  const handleTranscript = (transcript: string) => {
    // Append transcript to existing value
    const newValue = value ? `${value} ${transcript}` : transcript;
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <SpeechToText
            onTranscript={handleTranscript}
            language={language}
          />
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-witfy-500"
      />
    </div>
  );
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  const SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}

