import { ReactNode, useEffect, useState } from "react";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TotemLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  hideBack?: boolean;
}

export function TotemLayout({ children, onBack, backLabel = "Voltar", hideBack }: TotemLayoutProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
  const date = now
    ? now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    : "";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-12 py-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-touch)]">
            <Stethoscope className="h-9 w-9 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">Clínica Vitae</p>
            <p className="text-lg text-muted-foreground capitalize">{date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-5xl font-bold text-primary tabular-nums">{time}</p>
          <p className="text-base text-muted-foreground">Horário local</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-12 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-12 py-8">
        {!hideBack && (
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="h-20 w-full rounded-2xl border-2 text-2xl font-semibold"
          >
            <ArrowLeft className="mr-3 h-7 w-7" />
            {backLabel}
          </Button>
        )}
        {hideBack && (
          <p className="text-center text-lg text-muted-foreground">
            Em caso de dúvida, dirija-se à recepção
          </p>
        )}
      </footer>
    </div>
  );
}
