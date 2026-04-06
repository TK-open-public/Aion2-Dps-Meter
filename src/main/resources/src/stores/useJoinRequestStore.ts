import { create } from "zustand";
// import { useDebugStore } from "../stores/debugStore";

export interface JoinRequestUser {
  nickname: string;
  power: number;
  job: string | null;
  server: number;
  requester: number;
  arrivedAt: number;
  skill: Record<string, number>;
}

interface JoinRequestStore {
  requests: JoinRequestUser[];
  isOpen: boolean;
  refuseRequest: () => void;

  addRequest: (data: JoinRequestUser) => void;
  removeRequest: (requester: number) => void;
  clearAll: () => void;
  setOpen: (open: boolean) => void;
}

const timerMap = new Map<number, ReturnType<typeof setTimeout>>();

export const useJoinRequestStore = create<JoinRequestStore>((set, get) => ({
  requests: [],
  isOpen: false,

  addRequest: (data) => {
    // const addLog = useDebugStore.getState().addLog;
    // addLog(JSON.stringify(data));
    const { removeRequest } = get();

    if (timerMap.has(data.requester)) {
      clearTimeout(timerMap.get(data.requester));
    }

    const elapsed = Date.now() - data.arrivedAt;
    const remaining = Math.max(0, 20000 - elapsed);

    const timerId = setTimeout(() => {
      removeRequest(data.requester);
    }, remaining);

    timerMap.set(data.requester, timerId);

    set((state) => ({
      requests: [...state.requests.filter((r) => r.requester !== data.requester), data],
      isOpen: state.requests.length === 0 ? true : state.isOpen, // 빈배열일때만 자동오픈
    }));
  },

  removeRequest: (requester) => {
    if (timerMap.has(requester)) {
      clearTimeout(timerMap.get(requester));
      timerMap.delete(requester);
    }
    set((state) => ({
      requests: state.requests.filter((r) => r.requester !== requester),
    }));
  },

  clearAll: () => {
    timerMap.forEach((id) => clearTimeout(id));
    timerMap.clear();
    set({ requests: [], isOpen: false });
  },

  setOpen: (open) => set({ isOpen: open }),
  refuseRequest: () => {
    const { requests, removeRequest } = get();
    if (requests.length === 0) return;
    const oldest = [...requests].sort((a, b) => a.arrivedAt - b.arrivedAt)[0];
    removeRequest(oldest.requester);
  },
}));
