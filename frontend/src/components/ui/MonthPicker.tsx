import { ChevronLeft, ChevronRight } from 'lucide-react';
import { labelYearMonth, shiftYearMonth } from '../../lib/format';
import { Button } from './Button';

type Props = {
  yearMonth: string;
  onChange: (next: string) => void;
};

export function MonthPicker({ yearMonth, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-white/80 p-1 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        className="!px-2 !py-2"
        aria-label="Mês anterior"
        onClick={() => onChange(shiftYearMonth(yearMonth, -1))}
      >
        <ChevronLeft size={18} />
      </Button>
      <span className="min-w-40 px-2 text-center text-sm font-semibold capitalize text-ink">
        {labelYearMonth(yearMonth)}
      </span>
      <Button
        type="button"
        variant="ghost"
        className="!px-2 !py-2"
        aria-label="Próximo mês"
        onClick={() => onChange(shiftYearMonth(yearMonth, 1))}
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
