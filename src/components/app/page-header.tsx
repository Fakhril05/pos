'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  iconGradient?: 'emerald' | 'teal' | 'amber' | 'rose' | 'violet';
  children?: React.ReactNode;
  className?: string;
}

const gradientMap = {
  emerald: 'from-emerald-500 to-teal-500',
  teal: 'from-teal-500 to-cyan-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
  violet: 'from-violet-500 to-purple-500',
};

const glowMap = {
  emerald: 'shadow-emerald-500/20',
  teal: 'shadow-teal-500/20',
  amber: 'shadow-amber-500/20',
  rose: 'shadow-rose-500/20',
  violet: 'shadow-violet-500/20',
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconGradient = 'emerald',
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
              gradientMap[iconGradient],
              glowMap[iconGradient]
            )}
          >
            <Icon className="h-5.5 w-5.5 text-white" style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-gradient-emerald">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-2 hover-scale">{children}</div>}
      </motion.div>
      {/* Gradient separator */}
      <div className="mt-4 h-px w-full bg-gradient-to-r from-emerald-500/40 via-teal-500/20 to-transparent" />
    </div>
  );
}
