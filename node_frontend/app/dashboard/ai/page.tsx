"use client";

import React, { useEffect, useState } from "react";
import { JetBrains_Mono } from "next/font/google";
import { Rocket } from "lucide-react";
import InteractiveTerminal from "@/components/ui/terminal";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const typewriterText =
  "503 ERROR\n\nAsadbek AI sahifasi ayni damda ishlab chiqilmoqda.\n Tez kunlarda ishga tushiriladi...";

export default function AsadbekAIPage() {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (index > typewriterText.length) {
        setIsTypingDone(true);
        return;
      }
      setDisplayedText(typewriterText.slice(0, index));
      index += 1;
      setTimeout(tick, 35);
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      className={`${jetbrainsMono.className} min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 bg-background`}
    >
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="relative rounded-xl border border-border bg-card/95 px-6 py-5 shadow-md overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),transparent_65%)]" />
          <div className="relative flex flex-col gap-3">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              SERVICE TEMPORARILY UNAVAILABLE
            </span>
            <pre className="whitespace-pre-wrap text-foreground text-base leading-relaxed">
              {displayedText}
              {!isTypingDone && (
                <span className="inline-block w-2 h-5 align-middle bg-foreground/80 animate-pulse ml-1" />
              )}
            </pre>
          </div>
        </div>

        {isTypingDone && (
          <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto relative">
            <InteractiveTerminal
              command="asadbek-ai train --profile narpay-staff --dataset narpay-murojaatlar-v2"
              autoExecute
              variant="dark"
              repeat={false}
              icon={<Rocket className="mr-2 text-blue-400" />}
              steps={[
                "[bootstrap] resolving configuration for profile 'narpay-staff'...",
                "[bootstrap] loading dataset manifest: narpay-murojaatlar-v2.json ...",
                "[io] mounting training shards: /data/murojaatlar/{2023,2024,2025} ...",
                "[preproc] normalizing text: Unicode NFC, lowercasing, punctuation stripping ...",
                "[preproc] language detection enabled: uz, ru, mixed; heuristic fallback active ...",
                "[tokenizer] building BPE vocabulary (32k merges) from sampled corpus ...",
                "[model] initializing transformer encoder-decoder architecture (24 layers, 16 heads) ...",
                "[optimizer] AdamW configured (lr=2e-4, weight_decay=0.01, betas=(0.9, 0.999)) ...",
                "[scheduler] cosine annealing with warmup (warmup_steps=4000) activated ...",
                "[checkpoint] loading base weights from asadbek-ai-base-v0.9 ...",
                "[dataloader] spinning up 8 workers with pinned memory and prefetch factor=4 ...",
                "[train] starting epoch 1/32 (batch_size=64, seq_len=2048, grad_accum=4) ...",
                "[train] computing intent classification and priority routing heads ...",
                "[metric] tracking loss, accuracy, F1, latency_p95, escalation_rate ...",
                "[eval] running periodic validation on hold-out set 'operators-labelled-v1' ...",
                "[safety] enabling PII redaction and content safety filters (mode=strict) ...",
                "[routing] registering integration endpoints: telegram, web_widget, operator_dashboard ...",
                "[monitor] enabling real-time telemetry stream: /metrics/asadbek-ai-train ...",
                "[train] GPU(0) utilization: 92%, memory: 18.3 GiB / 24 GiB, mixed-precision: enabled (fp16) ...",
                "[train] global_step=1024, lr=1.87e-4, train_loss=1.9324, grad_norm=3.21 ...",
                "[train] global_step=2048, lr=1.73e-4, train_loss=1.7542, grad_norm=2.88 ...",
                "[metric] validation@intent: macro_F1=0.873, accuracy=0.912, escalation_rate=0.041 ...",
                "[metric] response_time_p95 improved from 1.84s -> 1.21s (n=10_000 simulated queries) ...",
                "[dist] NCCL backend initialized for 4 devices, gradient synchronization every 4 steps ...",
                "[cache] building intent-specific retrieval index for similar historical sessions ...",
                "[router] updating rules for high-priority tickets (sla_deadline < 2h) ...",
                "[ab-test] preparing shadow deployment model_id=asadbek-ai-exp-2025-01-17 ...",
                "[log] writing detailed training traces to /var/log/asadbek-ai/train.log ...",
                "[checkpoint] writing model snapshot to s3://asadbek-ai/checkpoints/tmp/latest ...",
              ]}
              finalMessage={`Asadbek AI training pipeline is still running...

Tasks completed: 1093/12300
Status: CONTINUOUS LEARNING IN PROGRESS`}
              stepDelay={750}
              className="rounded-md border border-blue-900/50 shadow-md hover:shadow-lg transition-shadow bg-black/90"
            />
          </div>
        )}
      </div>
    </main>
  );
}


