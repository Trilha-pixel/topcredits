import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AcademyModule, AcademyLesson, AcademyAttachment } from '@/types';
import { toast } from 'sonner';

export const useAcademyAdmin = () => {
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [attachments, setAttachments] = useState<AcademyAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchModules = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('academy_modules')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setModules(data || []);
        } catch (error: any) {
            console.error('Error fetching modules:', error);
            toast.error('Erro ao buscar módulos: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchLessons = useCallback(async () => {
        // We'll fetch all lessons or maybe by module? For now fetch all to simplify state
        try {
            const { data, error } = await supabase
                .from('academy_lessons')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setLessons(data || []);
        } catch (error: any) {
            console.error('Error fetching lessons:', error);
            toast.error('Erro ao buscar aulas: ' + error.message);
        }
    }, []);

    const fetchAttachments = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('academy_attachments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAttachments(data || []);
        } catch (error: any) {
            console.error('Error fetching attachments:', error);
            // toast.error('Erro ao buscar anexos: ' + error.message);
        }
    }, []);

    // Fetch on mount
    useState(() => {
        // Keeping this empty as placeholder if needed, but logic moved to useEffect below
    });

    const [initialized, setInitialized] = useState(false);

    if (!initialized) {
        fetchModules();
        fetchLessons();
        fetchAttachments();
        setInitialized(true);
    }

    // Also a function to refresh both
    const refreshAll = useCallback(async () => {
        await Promise.all([fetchModules(), fetchLessons(), fetchAttachments()]);
    }, [fetchModules, fetchLessons, fetchAttachments]);

    // --- Modules CRUD ---

    const createModule = async (moduleData: Omit<AcademyModule, 'id'>) => {
        try {
            const { error } = await supabase.from('academy_modules').insert([moduleData]);
            if (error) throw error;
            toast.success('Módulo criado com sucesso!');
            fetchModules();
        } catch (error: any) {
            toast.error('Erro ao criar módulo: ' + error.message);
        }
    };

    const updateModule = async (id: string, moduleData: Partial<AcademyModule>) => {
        try {
            const { error } = await supabase.from('academy_modules').update(moduleData).eq('id', id);
            if (error) throw error;
            toast.success('Módulo atualizado!');
            fetchModules();
        } catch (error: any) {
            toast.error('Erro ao atualizar módulo: ' + error.message);
        }
    };

    const deleteModule = async (id: string) => {
        try {
            const { error } = await supabase.from('academy_modules').delete().eq('id', id);
            if (error) throw error;
            toast.success('Módulo excluído!');
            fetchModules();
            // Also refresh lessons since they might cascade delete or become orphaned?
            // Assuming DB constraints handle it, but refreshing UI is good.
            fetchLessons();
        } catch (error: any) {
            toast.error('Erro ao excluir módulo: ' + error.message);
        }
    };

    // --- Lessons CRUD ---

    const createLesson = async (lessonData: Omit<AcademyLesson, 'id'>) => {
        try {
            const { error } = await supabase.from('academy_lessons').insert([lessonData]);
            if (error) throw error;
            toast.success('Aula criada com sucesso!');
            fetchLessons();
        } catch (error: any) {
            toast.error('Erro ao criar aula: ' + error.message);
        }
    };

    const updateLesson = async (id: string, lessonData: Partial<AcademyLesson>) => {
        try {
            const { error } = await supabase.from('academy_lessons').update(lessonData).eq('id', id);
            if (error) throw error;
            toast.success('Aula atualizada!');
            fetchLessons();
        } catch (error: any) {
            toast.error('Erro ao atualizar aula: ' + error.message);
        }
    };

    const deleteLesson = async (id: string) => {
        try {
            const { error } = await supabase.from('academy_lessons').delete().eq('id', id);
            if (error) throw error;
            toast.success('Aula excluída!');
            fetchLessons();
        } catch (error: any) {
            toast.error('Erro ao excluir aula: ' + error.message);
        }
    };

    // --- Attachments CRUD ---

    const createAttachment = async (attachmentData: Omit<AcademyAttachment, 'id' | 'created_at'>) => {
        try {
            const { error } = await supabase.from('academy_attachments').insert([attachmentData]);
            if (error) throw error;
            toast.success('Anexo adicionado!');
            fetchAttachments();
        } catch (error: any) {
            toast.error('Erro ao adicionar anexo: ' + error.message);
        }
    };

    const deleteAttachment = async (id: string, fileUrl: string) => {
        try {
            // Delete from Storage first
            // Extract path from URL (assuming standard Supabase storage URL format)
            // URL format: .../storage/v1/object/public/bucket/folder/file.ext
            // We need 'folder/file.ext'
            // Simplified check: if it contains 'academy-assets', try to parse

            if (fileUrl.includes('academy-assets')) {
                const path = fileUrl.split('academy-assets/')[1];
                if (path) {
                    const { error: storageError } = await supabase.storage.from('academy-assets').remove([path]);
                    if (storageError) console.error('Error deleting file from storage:', storageError);
                }
            }

            const { error } = await supabase.from('academy_attachments').delete().eq('id', id);
            if (error) throw error;
            toast.success('Anexo excluído!');
            fetchAttachments();
        } catch (error: any) {
            toast.error('Erro ao excluir anexo: ' + error.message);
        }
    };

    return {
        modules,
        lessons,
        isLoading,
        refreshAll,
        createModule,
        updateModule,
        deleteModule,
        createLesson,
        updateLesson,
        deleteLesson,
        attachments,
        createAttachment,
        deleteAttachment
    };
};
