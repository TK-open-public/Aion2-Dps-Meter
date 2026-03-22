export {};

declare global {
  interface Window {
    javaBridge?: {
      resetDps?: () => void;
      moveWindow?: (x: number, y: number) => void;
      startUpdate: (msiUrl: string) => void;  
      getDpsData?: () => void;
      getBattleDetail?: (id: number) => Promise<any>;
      getVersion?: () => string;          
      getBattleList?: () => void;
      getBattleDetailFromList?: (idx: number, id: number) => Promise<any>;
      openBrowser?: (url: string) => void;    
      exitApp?: () => void;                  
    };
  }
}