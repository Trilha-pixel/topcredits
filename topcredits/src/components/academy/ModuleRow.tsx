import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentClass, ContentCategory } from '@/lib/mock-data';
import ClassCard from './ClassCard';

interface ModuleRowProps {
  category: ContentCategory;
  classes: ContentClass[];
  moduleIndex: number;
  onSelectClass: (cls: ContentClass) => void;
}

const ModuleRow = ({ category, classes, moduleIndex, onSelectClass }: ModuleRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (classes.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 px-1 flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Módulo {moduleIndex}:
        </span>
        <span>{category.icon} {category.name}</span>
      </h2>

      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-card/90 border border-border flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1"
        >
          {classes.map((cls, i) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              index={i}
              moduleIcon={category.icon}
              moduleName={category.name}
              onSelect={onSelectClass}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-card/90 border border-border flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ModuleRow;
