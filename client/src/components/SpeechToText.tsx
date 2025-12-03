import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
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

const isSupported = !!(typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/**
 * Speech-to-Text component using OpenAI Whisper API
 * Records audio in the browser and sends to Whisper for transcription
 */
export function SpeechToText({
  onTranscript,
  onError,
  language = 'en-US',
  className = '',
}: SpeechToTextProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Audio recording is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🎤 Starting audio recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing...');
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) {
          toast({
            title: 'No Audio',
            description: 'No audio was recorded. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

        // Send to Whisper API
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: 'Recording...',
        description: 'Speak now. Click Stop when finished.',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      
      const errorMessage = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access in your browser settings.'
        : 'Failed to start recording. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      console.log('🔄 Sending audio to Whisper API...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcription failed');
      }

      const data = await response.json();
      console.log('✅ Transcription received:', data.transcript);

      if (data.transcript) {
        onTranscript(data.transcript);
        toast({
          title: 'Transcription Complete',
          description: 'Your speech has been converted to text.',
        });
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to transcribe audio. Please try again.';
      
      toast({
        title: 'Transcription Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      onClick={toggleRecording}
      disabled={isTranscribing}
      className={className}
      title={isRecording ? 'Stop Recording' : isTranscribing ? 'Transcribing...' : 'Start Recording'}
    >
      {isTranscribing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}

/**
 * Textarea with integrated Speech-to-Text button (using Whisper)
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Audio recording is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🎤 Starting audio recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing...');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          toast({
            title: 'No Audio',
            description: 'No audio was recorded. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);

        // Transcribe
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: 'Recording...',
        description: 'Speak now. Click Stop when finished.',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      
      const errorMessage = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access.'
        : 'Failed to start recording. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      console.log('🔄 Sending audio to Whisper API...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcription failed');
      }

      const data = await response.json();
      console.log('✅ Transcription received:', data.transcript);

      if (data.transcript) {
        // Append to existing value
        const newValue = value ? `${value} ${data.transcript}`.trim() : data.transcript;
        onChange(newValue);
        
        toast({
          title: 'Transcription Complete',
          description: 'Your speech has been converted to text.',
        });
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to transcribe audio. Please try again.';
      
      toast({
        title: 'Transcription Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isProcessing = isRecording || isTranscribing;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          {isSupported && (
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClick}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : isRecording ? (
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
        disabled={isProcessing}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-witfy-500 disabled:opacity-50"
      />
    </div>
  );
}
