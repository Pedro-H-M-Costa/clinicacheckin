import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumpadProps {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}

export function Numpad({ value, onChange, maxLength = 11 }: NumpadProps) {
  const press = (k: string) => {
    if (k === "del") onChange(value.slice(0, -1));
    else if (value.length < maxLength) onChange(value + k);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="grid w-full grid-cols-3 gap-5">
      {keys.map((k, i) =>
        k === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => press(k)}
            className={cn(
              "h-24 rounded-2xl border-2 border-border bg-card text-5xl font-bold text-foreground shadow-[var(--shadow-card)] transition-all active:scale-95 active:bg-secondary",
              k === "del" && "bg-secondary"
            )}
          >
            {k === "del" ? <Delete className="mx-auto h-10 w-10" /> : k}
          </button>
        )
      )}
    </div>
  );
}
