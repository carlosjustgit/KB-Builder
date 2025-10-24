import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, computeFileSHA256 } from '@/lib/supabase';
import type { KBImage, ImageRole, ImageStatus } from '@/types';

const QUERY_KEYS = {
  images: ['images'] as const,
  imagesBySession: (sessionId: string) => ['images', sessionId] as const,
  imagesByRole: (sessionId: string, role: ImageRole) => ['images', sessionId, role] as const,
};

/**
 * Hook for fetching all images for a session
 */
export function useImages(sessionId: string, role?: ImageRole) {
  return useQuery({
    queryKey: role
      ? QUERY_KEYS.imagesByRole(sessionId, role)
      : QUERY_KEYS.imagesBySession(sessionId),
    queryFn: async (): Promise<KBImage[]> => {
      let query = supabase
        .from('kb_images')
        .select('*')
        .eq('session_id', sessionId);

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for uploading an image file
 */
export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      file: File;
      role?: ImageRole;
    }): Promise<{ image: KBImage; signedUrl: string }> => {
      // Ensure we're authenticated (anonymous)
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.log('🔐 No session found, signing in anonymously...');
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.error('❌ Failed to sign in anonymously:', signInError);
          throw new Error('Authentication failed');
        }
      }

      // Compute SHA256 hash for deduplication
      const sha256 = await computeFileSHA256(data.file);

      // Check if image already exists
      const { data: existingImages } = await supabase
        .from('kb_images')
        .select('*')
        .eq('session_id', data.sessionId)
        .eq('sha256', sha256)
        .limit(1);

      const existingImage = existingImages?.[0];

      if (existingImage) {
        // Get public URL for existing image
        const { data: urlData } = supabase.storage
          .from('kb-builder')
          .getPublicUrl(existingImage.file_path);

        return {
          image: existingImage,
          signedUrl: urlData?.publicUrl || '',
        };
      }

      // Upload file to storage
      const timestamp = Date.now();
      // Sanitize filename: remove special characters, replace spaces with hyphens
      const sanitizedName = data.file.name
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9._-]/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
        .toLowerCase();
      const fileName = `${timestamp}-${sanitizedName}`;
      const filePath = `images/user/${data.sessionId}/${fileName}`;

      console.log('📤 Uploading to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('kb-builder')
        .upload(filePath, data.file);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded successfully');

      // Create image record in database
      const { data: image, error: dbError } = await supabase
        .from('kb_images')
        .insert({
          session_id: data.sessionId,
          file_path: filePath,
          mime: data.file.type,
          size_bytes: data.file.size,
          sha256,
          role: data.role || 'user',
          status: 'uploaded',
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }

      console.log('✅ Image record created:', image.id);

      // Get public URL for preview
      const { data: urlData } = supabase.storage
        .from('kb-builder')
        .getPublicUrl(filePath);

      return {
        image,
        signedUrl: urlData?.publicUrl || '',
      };
    },
    onSuccess: (result) => {
      // Invalidate images cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.imagesBySession(result.image.session_id),
      });

      if (result.image.role) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.imagesByRole(result.image.session_id, result.image.role),
        });
      }
    },
  });
}

/**
 * Hook for updating image status (e.g., after analysis)
 */
export function useUpdateImageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      imageId: string;
      status: ImageStatus;
    }) => {
      const { data: image, error } = await supabase
        .from('kb_images')
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.imageId)
        .select()
        .single();

      if (error) throw error;
      return image;
    },
    onSuccess: (updatedImage) => {
      // Invalidate images cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.imagesBySession(updatedImage.session_id),
      });

      if (updatedImage.role) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.imagesByRole(updatedImage.session_id, updatedImage.role),
        });
      }
    },
  });
}

/**
 * Hook for deleting an image
 */
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      // Get image details first
      const { data: image, error: fetchError } = await supabase
        .from('kb_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('kb-builder')
        .remove([image.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('kb_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      return image;
    },
    onSuccess: (deletedImage) => {
      // Invalidate images cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.imagesBySession(deletedImage.session_id),
      });

      if (deletedImage.role) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.imagesByRole(deletedImage.session_id, deletedImage.role),
        });
      }
    },
  });
}

/**
 * Hook for getting image statistics
 */
export function useImageStats(sessionId: string) {
  return useQuery({
    queryKey: ['images', 'stats', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_images')
        .select('role, status')
        .eq('session_id', sessionId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byRole: {} as Record<ImageRole, number>,
        byStatus: {} as Record<ImageStatus, number>,
      };

      data?.forEach(image => {
        const role = image.role as ImageRole;
        const status = image.status as ImageStatus;
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      return stats;
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for importing image from URL
 */
export function useImportImageFromUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      url: string;
      role?: ImageRole;
    }): Promise<{ image: KBImage; signedUrl: string }> => {
      console.log('🌐 Importing image from URL (server-side):', data.url);

      // Call server endpoint to import image (avoids CORS issues)
      const response = await fetch('/api/images/import-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          session_id: data.sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to import image');
      }

      const result = await response.json();
      console.log('✅ Image imported successfully:', result);

      return result;
    },
    onSuccess: (result) => {
      // Invalidate images cache for the session
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.imagesBySession(result.image.session_id),
      });
    },
  });
}

