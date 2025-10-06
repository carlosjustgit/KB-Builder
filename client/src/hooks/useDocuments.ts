import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KBDocument, DocumentType, DocumentStatus } from '@/types';

const QUERY_KEYS = {
  documents: ['documents'] as const,
  documentsBySession: (sessionId: string) => ['documents', sessionId] as const,
  documentByType: (sessionId: string, docType: string) => ['documents', sessionId, docType] as const,
};

/**
 * Hook for fetching all documents for a session
 */
export function useDocuments(sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.documentsBySession(sessionId),
    queryFn: async (): Promise<KBDocument[]> => {
      const { data, error } = await supabase
        .from('kb_documents')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching a specific document by type
 */
export function useDocument(sessionId: string, docType: DocumentType) {
  return useQuery({
    queryKey: QUERY_KEYS.documentByType(sessionId, docType),
    queryFn: async (): Promise<KBDocument | null> => {
      const { data, error } = await supabase
        .from('kb_documents')
        .select('*')
        .eq('session_id', sessionId)
        .eq('doc_type', docType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Document doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!sessionId && !!docType,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for creating a new document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      session_id: string;
      doc_type: DocumentType;
      title?: string;
      content_md?: string;
      content_json?: Record<string, unknown>;
      status?: DocumentStatus;
    }) => {
      const { data: document, error } = await supabase
        .from('kb_documents')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return document;
    },
    onSuccess: (newDocument) => {
      // Update documents cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documentsBySession(newDocument.session_id),
      });

      // Update specific document cache
      queryClient.setQueryData(
        QUERY_KEYS.documentByType(newDocument.session_id, newDocument.doc_type),
        newDocument
      );
    },
  });
}

/**
 * Hook for updating a document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      documentId: string;
      updates: Partial<{
        title: string;
        content_md: string;
        content_json: Record<string, unknown>;
        status: DocumentStatus;
      }>;
    }) => {
      const { data: document, error } = await supabase
        .from('kb_documents')
        .update({
          ...data.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.documentId)
        .select()
        .single();

      if (error) throw error;
      return document;
    },
    onSuccess: (updatedDocument) => {
      // Update documents cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documentsBySession(updatedDocument.session_id),
      });

      // Update specific document cache
      queryClient.setQueryData(
        QUERY_KEYS.documentByType(updatedDocument.session_id, updatedDocument.doc_type),
        updatedDocument
      );
    },
  });
}

/**
 * Hook for saving document content (creates or updates)
 */
export function useSaveDocument() {
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      docType: DocumentType;
      title?: string;
      content_md?: string;
      content_json?: Record<string, unknown>;
      status?: DocumentStatus;
    }) => {
      // Check if document exists
      const { data: existingDoc } = await supabase
        .from('kb_documents')
        .select('id')
        .eq('session_id', data.sessionId)
        .eq('doc_type', data.docType)
        .single();

      if (existingDoc) {
        // Update existing document
        const result = await updateDocument.mutateAsync({
          documentId: existingDoc.id,
          updates: {
            title: data.title,
            content_md: data.content_md,
            content_json: data.content_json,
            status: data.status,
          },
        });
        return result;
      } else {
        // Create new document
        const result = await createDocument.mutateAsync({
          session_id: data.sessionId,
          doc_type: data.docType,
          title: data.title,
          content_md: data.content_md,
          content_json: data.content_json,
          status: data.status,
        });
        return result;
      }
    },
  });
}

/**
 * Hook for approving a document (marking as approved)
 */
export function useApproveDocument() {
  const updateDocument = useUpdateDocument();

  return useMutation({
    mutationFn: async (documentId: string) => {
      return await updateDocument.mutateAsync({
        documentId,
        updates: { status: 'approved' },
      });
    },
  });
}

/**
 * Hook for getting document completion status
 */
export function useDocumentStatus(sessionId: string) {
  return useQuery({
    queryKey: ['documents', 'status', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_documents')
        .select('doc_type, status')
        .eq('session_id', sessionId);

      if (error) throw error;

      const statusMap = new Map<string, DocumentStatus>();
      data?.forEach(doc => {
        statusMap.set(doc.doc_type, doc.status);
      });

      return statusMap;
    },
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

