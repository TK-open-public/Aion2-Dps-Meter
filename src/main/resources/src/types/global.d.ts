export {};

declare global {
  interface Window {
    javaBridge?: {
      resetDps?: () => void;
      moveWindow?: (x: number, y: number) => void;
      startKeyCapture: () => void;
      stopKeyCapture: () => void;
      getDpsData?: () => void;
      getBattleDetail?: (id: number) => Promise<any>;
      getVersion?: () => void;
    };
  }
}
