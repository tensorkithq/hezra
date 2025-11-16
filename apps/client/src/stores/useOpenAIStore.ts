import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  arguments: any;
  result: any;
  widget?: any; // Widget specification from result._widget
  timestamp: string;
  duration?: number;
}

interface OpenAIStore {
  messages: Message[];
  toolExecutions: ToolExecution[];
  rawEvents: any[];
  
  addMessage: (message: Message) => void;
  addToolExecution: (execution: ToolExecution) => void;
  addRawEvent: (event: any) => void;
  clearAll: () => void;
}

export const useOpenAIStore = create<OpenAIStore>((set) => ({
  messages: [],
  toolExecutions: [],
  rawEvents: [],
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  addToolExecution: (execution) => set((state) => ({
    toolExecutions: [...state.toolExecutions, {
      ...execution,
      widget: execution.result?._widget || null
    }]
  })),
  
  addRawEvent: (event) => set((state) => ({ 
    rawEvents: [...state.rawEvents, event] 
  })),
  
  clearAll: () => set({ 
    messages: [], 
    toolExecutions: [], 
    rawEvents: [] 
  }),
}));
