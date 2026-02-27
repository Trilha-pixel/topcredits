import { Play, Clock } from 'lucide-react';
import { ContentClass } from '@/lib/mock-data';

interface ClassCardProps {
  cls: ContentClass;
  index: number;
  moduleIcon: string;
  moduleName: string;
  onSelect: (cls: ContentClass) => void;
}

const ClassCard = ({ cls, index, moduleIcon, moduleName, onSelect }: ClassCardProps) => {
  return (
    <button
      onClick={() => onSelect(cls)}
      className="group flex-shrink-0 w-[220px] sm:w-[260px] text-left rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-card to-card border border-border rounded-xl overflow-hidden">
        {/* Module label */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/15 backdrop-blur-sm px-2 py-0.5 rounded-md">
            Módulo {moduleIcon}
          </span>
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 shadow-lg shadow-primary/30">
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/80 via-transparent to-transparent">
          <p className="text-sm font-bold text-white leading-tight line-clamp-2">
            {cls.title}
          </p>
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
          <Clock className="h-2.5 w-2.5" />
          {cls.duration}
        </div>
      </div>
    </button>
  );
};

export default ClassCard;
