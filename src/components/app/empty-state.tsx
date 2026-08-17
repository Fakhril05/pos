'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Link2, Store, Users, ArrowLeftRight, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Map of icon names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  search: Search,
  'payment-link': Link2,
  merchant: Store,
  users: Users,
  transaction: ArrowLeftRight,
  banknote: Banknote,
};

const defaultVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  },
};

interface EmptyStateProps {
  title: string;
  message?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  message,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const IconComp = icon ? ICON_MAP[icon] : null;
  const displayMessage = message || description;
  const isTambah = actionLabel?.toLowerCase() === 'tambah';

  return (
    <AnimatePresence>
      <motion.div
        variants={defaultVariants.container}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 px-6 dot-pattern overflow-hidden',
          className,
        )}
      >
        {/* Large translucent icon */}
        <motion.div variants={defaultVariants.item}>
          {IconComp ? (
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <IconComp className="h-16 w-16 text-muted-foreground/20" />
            </div>
          ) : (
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}
        </motion.div>

        {/* Title */}
        <motion.h2
          variants={defaultVariants.item}
          className="text-base font-medium text-foreground"
        >
          {title}
        </motion.h2>

        {/* Description */}
        {displayMessage && (
          <motion.p
            variants={defaultVariants.item}
            className="mt-1 text-sm text-muted-foreground text-center max-w-sm"
          >
            {displayMessage}
          </motion.p>
        )}

        {/* Action button */}
        {actionLabel && onAction && (
          <motion.div variants={defaultVariants.item} className="mt-4">
            <Button
              onClick={onAction}
              className={cn(
                'gap-2 shadow-sm btn-press',
                isTambah
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : '',
              )}
            >
              {isTambah && <Plus className="h-4 w-4" />}
              {actionLabel}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
