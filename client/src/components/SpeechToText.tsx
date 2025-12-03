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
  const [isSupported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
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
      recognition.continuous = true; // Keep listening until explicitly stopped
      recognition.interimResults = false; // Only process final results to avoid text replacement
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
        
        // Only show error toast for critical errors (not for user stopping or pausing)
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