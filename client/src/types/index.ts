/**
 * Shared TypeScript types for KB Builder
 * 
 * These types are used across both client and server
 */

// ===========================
// Enums & Literals
// ===========================

export type Locale = 'en-US' | 'en-GB' | 'pt-BR' | 'pt-PT';

export type WizardStep =
  | 'welcome'
  | 'research'
  | 'brand'
  | 'services'
  | 'market'
  | 'competitors'
  | 'visual'
  | 'export';

export type DocumentType =
  | 'research'
  | 'brand'
  | 'services'
  | 'market'
  | 'competitors'
  | 'tone'
  | 'visual';

export type DocumentStatus = 'draft' | 'approved';

export type ImageRole = 'user' | 'generated';

export type ImageStatus = 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'analysed' | 'rejected' | 'error';

export type ExportFileType = 'json' | 'zip';

export type AIProvider = 'perplexity' | 'openai' | 'manual';

// ===========================
// Database Models
// ===========================

export interface KBSession {
  id: string;
  user_id: string;
  profile_id?: string;
  company_url?: string;
  language: Locale;
  step: WizardStep;
  created_at: string;
  updated_at: string;
}

export interface KBDocument {
  id: string;
  session_id: string;
  doc_type: DocumentType;
  title?: string;
  content_md?: string;
  content_json?: Record<string, unknown>;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

export interface KBSource {
  id: string;
  session_id: string;
  url: string;
  provider?: AIProvider;
  snippet?: string;
  created_at: string;
}

export interface KBImage {
  id: string;
  session_id: string;
  file_path: string;
  mime: string;
  size_bytes?: number;
  sha256?: string;
  role: ImageRole;
  status: ImageStatus;
  created_at: string;
}

export interface KBVisualGuide {
  id: string;
  session_id: string;
  rules_json: VisualGuideRules;
  derived_palettes_json?: Record<string, unknown>;
  created_at: string;
}

export interface KBExport {
  id: string;
  session_id: string;
  file_type: ExportFileType;
  storage_path: string;
  created_at: string;
}

// ===========================
// Visual Guide Structure
// ===========================

export interface VisualGuideRules {
  general_principles: string[];
  style_direction: {
    lighting: string;
    colour: string;
    composition: string;
    format: string;
  };
  palette: {
    primary: string[];
    secondary: string[];
    neutrals: string[];
  };
  people_and_emotions: string[];
  types_of_images: {
    category_name: string;
    subject_matter?: string;
    context?: string;
    examples: string[];
  }[];
  neuro_triggers: string[];
  variation_rules: string[];
  prompting_guidance: string[];
  producer_notes: {
    camera: string;
    lighting: string;
    angle: string;
    scene: string;
  };
}

// ===========================
// API Request/Response Types
// ===========================

export interface ResearchRequest {
  company_url: string;
  locale: Locale;
  step: 'research' | 'brand' | 'services' | 'market' | 'competitors';
  session_id: string;
}

export interface ResearchResponse {
  content_md: string;
  content_json?: Record<string, unknown>;
  sources: KBSource[];
}

export interface VisionAnalyseRequest {
  image_urls: string[];
  locale: Locale;
  brand_context?: string;
  session_id: string;
}

export interface VisionAnalyseResponse {
  visual_guide: VisualGuideRules;
  guide_md: string;
}

export interface TestImageRequest {
  base_prompt: string;
  negative_prompt?: string;
  count?: number;
  session_id: string;
}

export interface TestImageResponse {
  images: Array<{
    url: string;
    storage_path: string;
  }>;
}

export interface ExportJSONRequest {
  session_id: string;
}

export interface ExportJSONResponse {
  download_url: string;
  filename: string;
}

export interface ExportZIPRequest {
  session_id: string;
}

export interface ExportZIPResponse {
  download_url: string;
  filename: string;
}

// ===========================
// Export Formats
// ===========================

export interface WitfyKBExport {
  version: string;
  language: Locale;
  brand_story?: string;
  services?: Array<{
    title: string;
    description: string;
    benefits: string[];
  }>;
  market?: {
    trends: Array<{
      title: string;
      description: string;
    }>;
    takeaways: string[];
  };
  competitors?: Array<{
    name: string;
    strengths: string[];
  }>;
  differentiators?: string[];
  tone?: {
    traits: string[];
    examples: string[];
  };
  visual_guide?: VisualGuideRules;
  sources: KBSource[];
  created_at: string;
}

// ===========================
// Client State Types
// ===========================

export interface AppState {
  currentSession?: KBSession;
  currentStep: WizardStep;
  locale: Locale;
  isLoading: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<'search' | 'regenerate' | 'edit' | 'approve' | 'next'>;
}

// ===========================
// Form Types
// ===========================

export interface URLInputForm {
  company_url: string;
}

export interface ImageUploadForm {
  files?: File[];
  url?: string;
}

// ===========================
// Error Types
// ===========================

export interface APIError {
  error: string;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

