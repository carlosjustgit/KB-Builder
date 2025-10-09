import { createContext, useContext, useState, ReactNode } from 'react';

interface StepContentContextType {
  currentStepContent: string | null;
  setCurrentStepContent: (content: string | null) => void;
}

const StepContentContext = createContext<StepContentContextType | undefined>(undefined);

export function StepContentProvider({ children }: { children: ReactNode }) {
  const [currentStepContent, setCurrentStepContent] = useState<string | null>(null);

  return (
    <StepContentContext.Provider value={{ currentStepContent, setCurrentStepContent }}>
      {children}
    </StepContentContext.Provider>
  );
}

export function useStepContent() {
  const context = useContext(StepContentContext);
  if (context === undefined) {
    throw new Error('useStepContent must be used within a StepContentProvider');
  }
  return context;
}
