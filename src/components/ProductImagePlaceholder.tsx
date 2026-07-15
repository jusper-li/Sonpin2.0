import { Coffee, Gift } from 'lucide-react';

interface ProductImagePlaceholderProps {
  name: string;
  compact?: boolean;
}

export default function ProductImagePlaceholder({ name, compact = false }: ProductImagePlaceholderProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--sonpin-surface)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--sonpin-primary)_4%,transparent)_25%,transparent_25%,transparent_50%,color-mix(in_srgb,var(--sonpin-primary)_4%,transparent)_50%,color-mix(in_srgb,var(--sonpin-primary)_4%,transparent)_75%,transparent_75%,transparent)] bg-[length:28px_28px]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--sonpin-primary)]/70 via-[var(--sonpin-primary-warm)] to-[var(--sonpin-primary-soft)]" />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className={`${compact ? 'h-12 w-12' : 'h-16 w-16'} flex items-center justify-center border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm`}>
          {compact ? (
            <Gift className="h-6 w-6 text-[var(--sonpin-primary)]" />
          ) : (
            <Coffee className="h-8 w-8 text-[var(--sonpin-primary)]" />
          )}
        </div>
        {!compact && (
          <>
            <img src="/LOGO-1.png" alt="" className="mt-5 h-10 opacity-70" />
            <p className="mt-4 max-w-[13rem] text-xs font-medium leading-relaxed tracking-[0.12em] text-[var(--sonpin-ink)]">
              {name}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
