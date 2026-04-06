import { useEffect, useRef, useState } from "react";
import { useDebugStore } from "../stores/debugStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

const tryParseJson = (msg: string): { prefix: string; json: object | null } => {
  const jsonStart = msg.search(/[\[{]/);
  if (jsonStart === -1) return { prefix: msg, json: null };
  try {
    return { prefix: msg.slice(0, jsonStart), json: JSON.parse(msg.slice(jsonStart)) };
  } catch {
    return { prefix: msg, json: null };
  }
};

const JsonToggle = ({ data }: { data: object }) => {
  const [open, setOpen] = useState(false);
  const incOpen = useDebugStore((s) => s.incOpen);
  const decOpen = useDebugStore((s) => s.decOpen);
  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;

      if (next)
        incOpen(); 
      else decOpen();

      return next;
    });
  };
  return (
    <span>
      <button
        onClick={() => handleToggle()}
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#7dd3fc",
          fontSize: "10px",
          borderRadius: "3px",
          padding: "0 4px",
          cursor: "pointer",
          marginLeft: "4px",
        }}>
        {open ? "▼ 접기" : "▶  펼치기"}
      </button>
      {open && (
        <pre
          style={{
            margin: "4px 0 0 12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            fontSize: "10px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
            padding: "6px",
          }}>
          {JSON.stringify(data, null, 2)
            .split("\n")
            .map((line, i) => {
              const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:)/);
              if (keyMatch) {
                return (
                  <span key={i}>
                    <span style={{ color: "#e2e8f0" }}>{keyMatch[1]}</span>
                    <span style={{ color: "#93c5fd" }}>"{keyMatch[2]}"</span>
                    <span style={{ color: "#e2e8f0" }}>{line.slice(keyMatch[0].length)}</span>
                    {"\n"}
                  </span>
                );
              }
              return (
                <span
                  key={i}
                  style={{ color: "#e2e8f0" }}>
                  {line}
                  {"\n"}
                </span>
              );
            })}
        </pre>
      )}
    </span>
  );
};

export const DebugConsole = () => {
  const { logs, clear } = useDebugStore();
  const isDebugMode = useSettingsStore((s) => s.isDebugMode);
  const [isVisible, setIsVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsVisible((prev) => !prev);
    window.addEventListener("toggle-debug-console", handler);
    return () => window.removeEventListener("toggle-debug-console", handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!isDebugMode) return null;
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.92)",
        fontSize: "11px",
        fontFamily: "monospace",
        maxHeight: "300px",
        overflowY: "auto",
        zIndex: 9999,
        borderTop: "1px solid rgba(255,255,255,0.15)",
      }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(0,0,0,0.95)",
          padding: "4px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
        <span style={{ color: "#94a3b8", fontSize: "10px" }}>DEBUG CONSOLE ({logs.length})</span>
        <button
          onClick={clear}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#94a3b8",
            fontSize: "10px",
            borderRadius: "3px",
            padding: "1px 6px",
            cursor: "pointer",
          }}>
          clear
        </button>
      </div>

      <div style={{ padding: "4px 8px" }}>
        {logs.map((log, i) => {
          const { prefix, json } = tryParseJson(log);
          return (
            <div
              key={i}
              style={{ padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#00ff00" }}>{prefix}</span>
              {json && <JsonToggle data={json} />}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
