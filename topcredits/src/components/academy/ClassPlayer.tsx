import { AcademyLesson, AcademyModule, AcademyAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, FileIcon, Download, PlayCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

interface ClassPlayerProps {
  selectedClass: AcademyLesson;
  category: AcademyModule | undefined;
  allCategories: AcademyModule[];
  allLessons: AcademyLesson[];
  attachments?: AcademyAttachment[];
  onBack: () => void;
  onSelectClass: (cls: AcademyLesson) => void;
}

const getEmbedUrl = (url: string) => {
  try {
    if (!url) return '';

    // Check if it's a YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (youtubeRegex.test(url)) {
      // Extract Video ID
      // Supports:
      // youtube.com/watch?v=VIDEO_ID
      // youtube.com/embed/VIDEO_ID
      // youtu.be/VIDEO_ID
      let videoId = '';

      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // If not YouTube or couldn't extract ID, return original
    return url;
  } catch (error) {
    console.error("Error parsing video URL:", error);
    return url;
  }
};

const ClassPlayer = ({ selectedClass, category, allCategories, allLessons, attachments = [], onBack, onSelectClass }: ClassPlayerProps) => {

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Conteúdo do Curso</h3>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="single" collapsible defaultValue={category?.id} className="w-full">
          {allCategories.map((module) => {
            const moduleLessons = allLessons
              .filter(l => l.module_id === module.id)
              .sort((a, b) => a.display_order - b.display_order);

            return (
              <AccordionItem key={module.id} value={module.id} className="border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50 font-medium text-sm">
                  <span className="text-left flex-1 line-clamp-1">{module.title}</span>
                  {moduleLessons.length === 0 && <Badge variant="outline" className="ml-2 text-[10px] h-5">Em breve</Badge>}
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col">
                    {moduleLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectClass(lesson)}
                        className={cn(
                          "text-left px-4 py-3 text-sm flex items-start gap-3 transition-colors border-l-2",
                          selectedClass.id === lesson.id
                            ? "bg-primary/5 border-primary text-primary font-medium"
                            : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <PlayCircle className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          selectedClass.id === lesson.id ? "fill-primary text-primary" : "text-muted-foreground"
                        )} />
                        <span className="line-clamp-2">{lesson.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{lesson.duration}</span>
                      </button>
                    ))}
                    {moduleLessons.length === 0 && (
                      <div className="px-8 py-3 text-xs text-muted-foreground italic">
                        Nenhuma aula disponível neste módulo.
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)]">
      {/* Left Column (Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground pl-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar aos módulos
          </Button>

          {/* Mobile Sidebar Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4 mr-2" />
                  Conteúdo
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Video Player */}
        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black shadow-lg">
          <iframe
            src={getEmbedUrl(selectedClass.video_url)}
            title={selectedClass.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Content Tabs */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="materials">Materiais ({attachments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{selectedClass.title}</h1>
                <div className="flex items-center gap-3 text-muted-foreground text-sm mb-4">
                  {category && (
                    <Badge variant="secondary" className="font-normal">
                      Módulo {category.display_order}: {category.title}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {selectedClass.duration}
                  </span>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedClass.content ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedClass.content }} />
                ) : (
                  <p className="text-muted-foreground">{selectedClass.description}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="materials" className="animate-in fade-in-50 duration-300">
              {attachments.length > 0 ? (
                <div className="grid gap-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border transition-colors">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <FileIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{attachment.title}</h4>
                        <p className="text-sm text-muted-foreground uppercase">{attachment.file_size || 'UNKNOWN'} • {attachment.file_type}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                    <Download className="h-6 w-6 opacity-50" />
                  </div>
                  <p>Nenhum material complementar disponível para esta aula.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column (Sidebar) - Desktop Only */}
      <div className="hidden lg:block w-80 xl:w-96 shrink-0">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm sticky top-6 h-[calc(100vh-120px)] flex flex-col">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
};

export default ClassPlayer;
