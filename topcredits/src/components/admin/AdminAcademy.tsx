import React, { useState } from 'react';
import { useAcademyAdmin } from '@/hooks/useAcademyAdmin';
import { AcademyModule, AcademyLesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Edit, Trash2, Video, Clock, GripVertical, Upload, X, Download, FileText, File as FileIcon, GraduationCap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RichTextEditor from '@/components/ui/RichTextEditor';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const AdminAcademy = () => {
    const { modules, lessons, createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson, attachments, createAttachment, deleteAttachment } = useAcademyAdmin();

    // -- Module State --
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Partial<AcademyModule>>({});
    const [uploadingModuleCover, setUploadingModuleCover] = useState(false);

    // -- Lesson State --
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Partial<AcademyLesson>>({});
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    // -- Module Handlers --
    const handleOpenModuleModal = (module?: AcademyModule) => {
        if (module) {
            setEditingModule(module);
        } else {
            setEditingModule({ title: '', description: '', display_order: modules.length + 1 });
        }
        setIsModuleModalOpen(true);
    };

    const handleModuleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploadingModuleCover(true);

        try {
            const fileName = `module-cover-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('academy-assets')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('academy-assets')
                .getPublicUrl(fileName);

            setEditingModule(prev => ({ ...prev, cover_url: publicUrl }));
            toast.success('Capa do módulo enviada!');

        } catch (error: any) {
            console.error('Error uploading module cover:', error);
            toast.error('Erro ao enviar capa: ' + error.message);
        } finally {
            setUploadingModuleCover(false);
        }
    };

    const handleSaveModule = async () => {
        if (!editingModule.title) return; // Basic validation
        if (editingModule.id) {
            await updateModule(editingModule.id, {
                title: editingModule.title,
                description: editingModule.description,
                display_order: editingModule.display_order,
                cover_url: editingModule.cover_url
            });
        } else {
            await createModule(editingModule as Omit<AcademyModule, 'id'>);
        }
        setIsModuleModalOpen(false);
    };

    const handleDeleteModule = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este módulo? Todas as aulas serão afetadas.')) {
            await deleteModule(id);
        }
    };

    // -- Lesson Handlers --
    const handleOpenLessonModal = (moduleId: string, lesson?: AcademyLesson) => {
        if (lesson) {
            setEditingLesson(lesson);
        } else {
            // Find max order in this module
            const existingLessons = lessons.filter(l => l.module_id === moduleId);
            const maxOrder = existingLessons.reduce((max, l) => Math.max(max, l.display_order), 0);
            setEditingLesson({
                module_id: moduleId,
                title: '',
                description: '',
                video_url: '',
                duration: '',
                display_order: maxOrder + 1,
                cover_url: '',
                content: ''
            });
        }
        setIsLessonModalOpen(true);
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploadingCover(true);

        try {
            const fileName = `cover-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('academy-assets')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('academy-assets')
                .getPublicUrl(fileName);

            setEditingLesson(prev => ({ ...prev, cover_url: publicUrl }));
            toast.success('Capa enviada com sucesso!');

        } catch (error: any) {
            console.error('Error uploading cover:', error);
            toast.error('Erro ao enviar capa: ' + error.message);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingLesson.id) {
            toast.error('Salve a aula antes de adicionar anexos.');
            return;
        }

        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploadingAttachment(true);

        try {
            const fileName = `attachment-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('academy-assets')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('academy-assets')
                .getPublicUrl(fileName);

            // Create attachment record
            await createAttachment({
                lesson_id: editingLesson.id,
                title: file.name,
                file_url: publicUrl,
                file_type: file.name.split('.').pop(),
                file_size: formatFileSize(file.size)
            });

            e.target.value = ''; // Reset input

        } catch (error: any) {
            console.error('Error uploading attachment:', error);
            toast.error('Erro ao enviar anexo: ' + error.message);
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handleSaveLesson = async () => {
        if (!editingLesson.title || !editingLesson.module_id) return;
        if (editingLesson.id) {
            await updateLesson(editingLesson.id, {
                title: editingLesson.title,
                description: editingLesson.description,
                video_url: editingLesson.video_url,
                duration: editingLesson.duration,
                display_order: editingLesson.display_order,
                cover_url: editingLesson.cover_url,
                content: editingLesson.content
            });
        } else {
            await createLesson(editingLesson as Omit<AcademyLesson, 'id'>);
        }
        setIsLessonModalOpen(false);
    };

    const handleDeleteLesson = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
            await deleteLesson(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header com gradiente */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <GraduationCap className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Academy</h2>
                            <p className="text-sm text-muted-foreground">Crie módulos e aulas para a área de aprendizado</p>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenModuleModal()} className="shadow-lg">
                        <Plus className="mr-2 h-4 w-4" /> Novo Módulo
                    </Button>
                </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {modules.map((module) => {
                    const moduleLessons = lessons.filter(l => l.module_id === module.id).sort((a, b) => a.display_order - b.display_order);
                    return (
                        <AccordionItem key={module.id} value={module.id} className="border border-border rounded-xl bg-card/50 backdrop-blur-sm px-4 hover:border-primary/50 transition-all">
                            <div className="flex items-center justify-between w-full py-4">
                                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                    <div className="flex items-center gap-3 text-left">
                                        <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 border-primary/20 bg-primary/5 text-primary">
                                            {module.display_order}
                                        </Badge>
                                        <span className="font-semibold text-lg">{module.title}</span>
                                        <span className="text-xs text-muted-foreground font-normal ml-2">({moduleLessons.length} aulas)</span>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModuleModal(module); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <AccordionContent className="pt-2 pb-6">
                                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>

                                <div className="space-y-3 pl-4 border-l-2 border-border ml-3">
                                    {moduleLessons.map((lesson) => (
                                        <Card key={lesson.id} className="bg-secondary/20 border-border shadow-sm">
                                            <CardContent className="p-3 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded bg-background border border-border shrink-0 text-muted-foreground text-xs font-mono">
                                                        #{lesson.display_order}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-medium truncate">{lesson.title}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> {lesson.duration}
                                                            </span>
                                                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                                <Video className="h-3 w-3" /> {lesson.video_url}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenLessonModal(module.id, lesson)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button variant="outline" size="sm" className="w-full border-dashed text-muted-foreground hover:text-primary mt-2" onClick={() => handleOpenLessonModal(module.id)}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar Aula neste Módulo
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            {/* Module Modal */}
            <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingModule.id ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
                        <DialogDescription>Preencha os dados do módulo abaixo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Module Cover Image */}
                        <div className="space-y-2">
                            <Label>Capa do Módulo</Label>
                            <div className="flex items-center gap-4 border border-input p-3 rounded-md bg-muted/20">
                                {editingModule.cover_url ? (
                                    <div className="relative h-20 w-36 rounded-md overflow-hidden border border-border group">
                                        <img src={editingModule.cover_url} alt="Cover" className="h-full w-full object-cover" />
                                        <button
                                            onClick={() => setEditingModule({ ...editingModule, cover_url: '' })}
                                            className="absolute top-1 right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-20 w-36 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50 text-muted-foreground text-xs">
                                        Sem capa
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('module-cover-upload')?.click()}
                                        disabled={uploadingModuleCover}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {uploadingModuleCover ? 'Enviando...' : 'Fazer Upload'}
                                    </Button>
                                    <input
                                        id="module-cover-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleModuleCoverUpload}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 1280x720 (16:9)</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={editingModule.title || ''}
                                onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                                placeholder="Ex: Módulo 1: Introdução"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={editingModule.description || ''}
                                onChange={e => setEditingModule({ ...editingModule, description: e.target.value })}
                                placeholder="Breve descrição do módulo..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ordem</Label>
                            <Input
                                type="number"
                                value={editingModule.display_order || 0}
                                onChange={e => setEditingModule({ ...editingModule, display_order: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveModule}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Modal */}
            <Dialog open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingLesson.id ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
                        <DialogDescription>Adicione o conteúdo da aula.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto pr-2">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Título da Aula</Label>
                                <Input
                                    value={editingLesson.title || ''}
                                    onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                    placeholder="Ex: Como vender mais"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ordem</Label>
                                <Input
                                    type="number"
                                    value={editingLesson.display_order || 0}
                                    onChange={e => setEditingLesson({ ...editingLesson, display_order: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Video & Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>URL do Vídeo (YouTube/Vimeo)</Label>
                                <div className="relative">
                                    <Video className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        value={editingLesson.video_url || ''}
                                        onChange={e => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Duração</Label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        value={editingLesson.duration || ''}
                                        onChange={e => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                                        placeholder="Ex: 10:00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-2">
                            <Label>Capa da Aula</Label>
                            <div className="flex items-center gap-4 border border-input p-3 rounded-md bg-muted/20">
                                {editingLesson.cover_url ? (
                                    <div className="relative h-20 w-36 rounded-md overflow-hidden border border-border group">
                                        <img src={editingLesson.cover_url} alt="Cover" className="h-full w-full object-cover" />
                                        <button
                                            onClick={() => setEditingLesson({ ...editingLesson, cover_url: '' })}
                                            className="absolute top-1 right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-20 w-36 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50 text-muted-foreground text-xs">
                                        Sem capa
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('cover-upload')?.click()}
                                        disabled={uploadingCover}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {uploadingCover ? 'Enviando...' : 'Fazer Upload'}
                                    </Button>
                                    <input
                                        id="cover-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleCoverUpload}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 1280x720 (16:9)</p>
                                </div>
                            </div>
                        </div>

                        {/* Rich Text Description */}
                        <div className="space-y-2">
                            <Label>Conteúdo da Aula (Descrição)</Label>
                            <RichTextEditor
                                value={editingLesson.content || editingLesson.description || ''}
                                onChange={(val) => setEditingLesson({ ...editingLesson, content: val, description: val.replace(/<[^>]*>?/gm, '').substring(0, 150) })}
                            />
                        </div>

                        {/* Attachments Section (Only for existing lessons) */}
                        {editingLesson.id && (
                            <div className="space-y-3 pt-4 border-t border-border mt-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium">Materiais Complementares</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('attachment-upload')?.click()}
                                        disabled={uploadingAttachment}
                                    >
                                        <Upload className="h-3 w-3 mr-2" />
                                        {uploadingAttachment ? 'Enviando...' : 'Adicionar Arquivo'}
                                    </Button>
                                    <input
                                        id="attachment-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={handleAttachmentUpload}
                                    />
                                </div>

                                <div className="space-y-2">
                                    {attachments.filter(a => a.lesson_id === editingLesson.id).length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded-md">Nenhum material anexado</p>
                                    ) : (
                                        attachments.filter(a => a.lesson_id === editingLesson.id).map(attachment => (
                                            <div key={attachment.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                                        <FileIcon className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{attachment.title}</p>
                                                        <p className="text-xs text-muted-foreground">{attachment.file_size} • {attachment.file_type?.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 h-7 w-7"
                                                    onClick={() => deleteAttachment(attachment.id, attachment.file_url)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        {!editingLesson.id && (
                            <div className="text-xs text-muted-foreground italic text-center py-2 bg-yellow-500/10 text-yellow-500 rounded-md border border-yellow-500/20">
                                Salve a aula primeiro para adicionar materiais complementares.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLessonModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveLesson}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminAcademy;
