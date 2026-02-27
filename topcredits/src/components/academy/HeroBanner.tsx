import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Clock } from 'lucide-react';
import { AcademyLesson, AcademyModule } from '@/types';

interface HeroBannerProps {
  featuredClass: AcademyLesson;
  category: AcademyModule | undefined;
  onPlay: (cls: AcademyLesson) => void;
}



const HeroBanner = ({ featuredClass, category, onPlay }: HeroBannerProps) => {
  return (
    <div className="relative w-full h-[340px] sm:h-[400px] rounded-2xl overflow-hidden mb-8 group">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Decorative shapes */}
      <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-20 right-40 w-32 h-32 rounded-full bg-accent/15 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-10 max-w-2xl">
        <Badge className="w-fit mb-3 bg-accent/20 text-accent border-accent/30 text-xs font-semibold tracking-wider uppercase">
          Novo
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground leading-tight mb-2">
          {featuredClass.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 line-clamp-2">
          {featuredClass.description}
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onPlay(featuredClass)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 h-11 rounded-xl gap-2"
          >
            <Play className="h-4 w-4 fill-current" />
            Assistir Agora
          </Button>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {featuredClass.duration}
          </span>
          {category && (
            <Badge variant="outline" className="border-border text-muted-foreground text-xs">
              Módulo {category.title}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
