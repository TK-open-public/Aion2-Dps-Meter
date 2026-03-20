export {};

declare global {
  interface Window {
    dpsData?: {
      getDpsData?: () => unknown;
      getBattleDetail?: (id: string) => Promise<any>;
    };

    javaBridge?: {
      
      resetDps?: () => void;
      moveWindow?: (x: number, y: number) => void;
      startKeyCapture: () => void;
      stopKeyCapture: () => void;
    };
  }
}
