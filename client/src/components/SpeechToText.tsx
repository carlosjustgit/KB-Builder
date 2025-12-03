import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  className?: string;
}

interface SpeechTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  language?: string;
  rows?: number;
}

const isSupported = !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

/**
 * Speech-to-Text component using Web Speech API
 * Creates a fresh recognition instance for each recording session
 */
export function SpeechToText({
  onTranscript,
  onError,
  language = 'en-US',
  className = '',
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptBufferRef = useRef<string>('');
  const { toast } = useToast();

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
      case 'aborted':
        return 'Recording was stopped.';
      default:
        return 'An error occurred during speech recognition.';
    }
  };

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Always create a fresh recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configuration
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      // Reset transcript buffer
      transcriptBufferRef.current = '';

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('📝 Speech recognition result received');
        
        // Collect all final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            console.log('✅ Final transcript:', transcript);
            
            // Add to buffer with a space
            transcriptBufferRef.current += (transcriptBufferRef.current ? ' ' : '') + transcript;
            
            // Send the accumulated transcript to parent
            onTranscript(transcriptBufferRef.current.trim());
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech recognition error:', event.error);
        
        // Only show error toast for critical errors
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          const errorMessage = getErrorMessage(event.error);
          
          if (onError) {
            onError(errorMessage);
          }
          
          toast({
            title: 'Speech Recognition Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        
        // Clean up
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        
        // Send final accumulated transcript
        if (transcriptBufferRef.current) {
          onTranscript(transcriptBufferRef.current.trim());
        }
        
        setIsListening(false);
        recognitionRef.current = null;
      };

      // Store reference and start
      recognitionRef.current = recognition;
      recognition.start();
      
      toast({
        title: 'Listening...',
        description: 'Speak now. Click Stop when finished.',
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: 'Error',
        description: 'Failed to start speech recognition. Please try again.',
        variant: 'destructive',
      });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        console.log('🛑 Stopping speech recognition...');
        recognitionRef.current.stop();
        
        toast({
          title: 'Stopped',
          description: 'Speech recognition stopped.',
        });
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
        recognitionRef.current = null;
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size="icon"
      onClick={toggleListening}
      className={className}
      title={isListening ? 'Stop Recording' : 'Start Recording'}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
}

/**
 * Textarea with integrated Speech-to-Text button
 */
export function SpeechTextarea({
  value,
  onChange,
  placeholder,
  label,
  className = '',
  language = 'en-US',
  rows = 4,
}: SpeechTextareaProps) {
  const initialValueRef = useRef('');
  const [localIsListening, setLocalIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptBufferRef = useRef<string>('');
  const { toast } = useToast();

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'No microphone found. Please check your microphone settings.';
      case 'not-allowed':
        return 'Microphone access denied.';
      case 'network':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An error occurred during speech recognition.';
    }
  };

  const startRecognition = () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save current value and create fresh instance
      initialValueRef.current = value;
      transcriptBufferRef.current = '';

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Recording started');
        setLocalIsListening(true);
        toast({
          title: 'Listening...',
          description: 'Speak now. Click Stop when finished.',
        });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            transcriptBufferRef.current += (transcriptBufferRef.current ? ' ' : '') + transcript;
            
            // Append to initial value
            const newValue = initialValueRef.current 
              ? `${initialValueRef.current} ${transcriptBufferRef.current}`.trim()
              : transcriptBufferRef.current.trim();
            
            onChange(newValue);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Speech error:', event.error);
        
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          const errorMessage = getErrorMessage(event.error);
          toast({
            title: 'Speech Recognition Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        
        cleanup();
      };

      recognition.onend = () => {
        console.log('🛑 Recording ended');
        
        // Send final transcript
        if (transcriptBufferRef.current) {
          const newValue = initialValueRef.current 
            ? `${initialValueRef.current} ${transcriptBufferRef.current}`.trim()
            : transcriptBufferRef.current.trim();
          
          onChange(newValue);
        }
        
        cleanup();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting:', error);
      toast({
        title: 'Error',
        description: 'Failed to start speech recognition.',
        variant: 'destructive',
      });
      cleanup();
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        toast({
          title: 'Stopped',
          description: 'Recording stopped.',
        });
      } catch (error) {
        console.error('Error stopping:', error);
      }
    }
    cleanup();
  };

  const cleanup = () => {
    recognitionRef.current = null;
    transcriptBufferRef.current = '';
    initialValueRef.current = '';
    setLocalIsListening(false);
  };

  const handleClick = () => {
    if (localIsListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          {isSupported && (
            <Button
              type="button"
              variant={localIsListening ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClick}
            >
              {localIsListening ? (
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
          )}
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
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
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
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}
