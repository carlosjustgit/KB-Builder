# KB Builder - Architecture Notes

This document captures key architectural decisions, patterns, and rationale for the KB Builder application.

---

## Table of Contents

1. [Client/Server Split](#1-clientserver-split)
2. [Routing Strategy](#2-routing-strategy)
3. [Component Architecture](#3-component-architecture)
4. [State Management](#4-state-management)
5. [Error Handling](#5-error-handling)
6. [File Upload Flow](#6-file-upload-flow)
7. [AI Integration Patterns](#7-ai-integration-patterns)
8. [Security Considerations](#8-security-considerations)
9. [Data Flow](#9-data-flow)
10. [Performance Optimizations](#10-performance-optimizations)

---

## 1. Client/Server Split

### Decision: Separate Client and Server

**Rationale:**
- **Security:** API keys (OpenAI, Perplexity, Supabase service key) must remain server-side
- **Performance:** Heavy AI processing on server prevents client bloat
- **Scalability:** Server can be independently scaled
- **Type Safety:** Shared types ensure contract consistency

**Implementation:**
```
/client  → React SPA (Vite build)
/server  → Express API (Node.js)
```

**Communication:**
- RESTful JSON API on `/api/*`
- Vite dev proxy forwards `/api` to Express during development
- Production: same origin or CORS-configured separate domains

**Alternative Considered:**
- **Monolith (Next.js):** Rejected due to requirement for standalone app and simpler deployment model
- **Serverless Functions:** Considered for server, but Express chosen for simplicity and local dev experience

---

## 2. Routing Strategy

### Client Routing

**Decision: Client-Side Routing with React Router**

**Routes:**
```
/            → Welcome & Locale Selection
/research    → Automated Research
/brand       → Brand & Tone
/services    → Services & Proof Points
/market      → Market Trends
/competitors → Competitive Analysis
/visual      → Visual Brand Guideline
/export      → Export & Download
```

**Rationale:**
- SPA UX: seamless navigation without full page reloads
- Preserves wizard state across steps
- Back/forward browser buttons work naturally

**Route Guards:**
- Each route checks if session exists (via context or localStorage)
- Redirect to `/` if no active session
- Allow skipping steps? **No** - enforce linear flow for MVP

**Implementation Pattern:**
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
    {/* ... */}
  </Routes>
</BrowserRouter>
```

### Server Routing

**Decision: Express Router with Modular Routes**

**Structure:**
```
/api/health              → GET  (no auth)
/api/research            → POST (validates session_id)
/api/vision/analyse      → POST
/api/visual/test-image   → POST
/api/export/json         → POST
/api/export/zip          → POST
```

**Middleware Stack:**
1. Helmet (security headers)
2. CORS (allow client origin)
3. Rate limiter (per IP)
4. JSON body parser
5. Route-specific validation (Zod)
6. Business logic
7. Error handler

**Rationale:**
- Clear separation of concerns
- Easy to add authentication middleware later
- Rate limiting prevents abuse

---

## 3. Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header (logo, progress indicator)
│   ├── Main
│   │   ├── ChatArea (70%)
│   │   │   ├── ChatBubble[]
│   │   │   ├── MarkdownEditor
│   │   │   └── ActionButtons
│   │   └── SidePanel (30%)
│   │       └── Tabs
│   │           ├── SummaryTab
│   │           ├── SourcesTab
│   │           ├── DocumentsTab
│   │           ├── VisualTab
│   │           └── ExportTab
│   └── Footer
│       ├── LocaleSelector
│       ├── SaveButton
│       ├── ExportButton
│       └── DownloadButton
└── Routes (Welcome, Research, Brand, ...)
```

### Component Design Principles

1. **Composition over Inheritance:** Use React composition patterns
2. **Single Responsibility:** Each component does one thing well
3. **Controlled vs Uncontrolled:** Prefer controlled components for form inputs
4. **Accessibility First:** ARIA labels, keyboard support, focus management
5. **Responsive:** Mobile-first with Tailwind breakpoints

### Key Components

#### ChatBubble
```tsx
interface ChatBubbleProps {
  type: 'user' | 'assistant';
  content: string;
  actions?: Array<'search' | 'regenerate' | 'edit' | 'approve' | 'next'>;
  onAction?: (action: string) => void;
}
```

**Rationale:**
- Reusable for all conversational steps
- Clear visual distinction between user and AI
- Inline actions reduce UI clutter

#### MarkdownEditor
```tsx
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  showPreview?: boolean;
  maxLength?: number;
}
```

**Rationale:**
- Users can edit AI output before saving
- Preview helps non-technical users visualize formatting
- Character limit prevents overly long content

#### ImageDropzone
```tsx
interface ImageDropzoneProps {
  onUpload: (files: File[]) => void;
  onPaste: (url: string) => void;
  accept?: string[];
  maxSize?: number;
}
```

**Rationale:**
- Multiple input methods (drag, paste, URL) for flexibility
- Client-side validation before upload
- Clear feedback on progress/errors

---

## 4. State Management

### Decision: TanStack Query + React Context

**Why Not Redux/Zustand?**
- Server state (API data) managed by TanStack Query
- Local UI state managed by React Context and hooks
- No need for heavy state library for this use case

**State Categories:**

#### 1. Server State (TanStack Query)
- Session data
- Documents
- Sources
- Images
- Visual guides
- Exports

**Pattern:**
```tsx
const { data: session, isLoading, error } = useQuery({
  queryKey: ['session', sessionId],
  queryFn: () => fetchSession(sessionId),
});

const mutation = useMutation({
  mutationFn: (data) => saveDocument(data),
  onSuccess: () => queryClient.invalidateQueries(['documents']),
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Loading/error states

#### 2. UI State (React Context)
- Current step
- Locale
- Side panel open/closed
- Toast notifications

**Pattern:**
```tsx
const AppContext = createContext<AppState | null>(null);

function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be within provider');
  return context;
}
```

#### 3. Form State (React Hook Form)
- URL input
- Markdown editing
- Image selection

**Pattern:**
```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

**Benefits:**
- Built-in validation
- Performance (uncontrolled inputs)
- Integration with Zod schemas

---

## 5. Error Handling

### Layered Error Strategy

#### Layer 1: Client-Side Validation
- Form validation (React Hook Form + Zod)
- File validation (size, type)
- URL validation (regex)
- Display errors inline near inputs

#### Layer 2: API Error Responses
- Server returns structured errors:
  ```json
  {
    "error": "Invalid URL",
    "code": "VALIDATION_ERROR",
    "field": "company_url"
  }
  ```
- Client displays toast notification with retry button

#### Layer 3: Network Errors
- TanStack Query retries 3 times with exponential backoff
- Final failure shows: "Network error. Please check your connection. [Retry]"

#### Layer 4: AI Service Errors
- Perplexity/OpenAI timeout or quota hit
- Show: "AI service is busy. Retrying... (attempt 2/3)"
- If all retries fail: "AI unavailable. Please try again later or enter manually."

### Error Component Pattern

```tsx
function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-md bg-destructive/10 p-4">
      <p className="text-sm text-destructive">{error.message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}
```

### Error Logging

**Client:**
- Console errors in development
- Sentry or similar in production (future)

**Server:**
- All errors logged to console with timestamp
- Structured logging (JSON) for production
- No sensitive data in logs (API keys, user content)

---

## 6. File Upload Flow

### Image Upload Architecture

**Flow:**
```
User selects image
  ↓
Client: Validate (size, type)
  ↓
Client: Compute SHA256 hash
  ↓
Client: Check if hash exists in kb_images (dedupe)
  ↓ (if new)
Client: Upload to Supabase Storage (kb-builder/images/user/)
  ↓
Client: Insert row in kb_images table
  ↓
Client: Get signed URL for preview
  ↓
Display thumbnail in ImageGrid
```

### Implementation Details

**SHA256 Hashing (Client-Side):**
```ts
async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Deduplication Check:**
```ts
const { data } = await supabase
  .from('kb_images')
  .select('id, file_path')
  .eq('session_id', sessionId)
  .eq('sha256', hash)
  .single();

if (data) {
  // Already uploaded, reuse existing
  return data;
}
```

**Upload to Storage:**
```ts
const filePath = `images/user/${sessionId}/${Date.now()}-${file.name}`;
const { data, error } = await supabase.storage
  .from('kb-builder')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
```

**Signed URL for Preview:**
```ts
const { data: urlData } = await supabase.storage
  .from('kb-builder')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

### Why This Approach?

- **Dedupe saves storage:** Same image uploaded twice uses one file
- **Client-side hash:** Reduces server load
- **Signed URLs:** Security - no public access to bucket
- **Metadata in DB:** Easy querying and filtering

---

## 7. AI Integration Patterns

### Service Layer Abstraction

**Goal:** Easy to swap or mock AI providers

**Structure:**
```
/server/services/
  perplexity/
    client.ts       → HTTP client
    prompts.ts      → Prompt templates
    parser.ts       → Response parsing
  openai/
    vision.ts       → Vision API
    images.ts       → Image generation
    prompts.ts      → Vision prompts
```

### Perplexity Service Pattern

```ts
// server/services/perplexity/client.ts
export async function searchAndChat(
  prompt: string,
  options: { locale: string }
): Promise<PerplexityResponse> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-small-online', // or appropriate model
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  return await response.json();
}
```

### OpenAI Vision Pattern

```ts
// server/services/openai/vision.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyseImages(
  imageUrls: string[],
  prompt: string
): Promise<VisionAnalysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } })),
        ],
      },
    ],
    max_tokens: 1500,
  });

  return parseVisionResponse(response);
}
```

### Retry Logic

```ts
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Prompt Template System

```ts
// server/services/perplexity/prompts.ts
export const PROMPTS = {
  brandOverview: (companyUrl: string, locale: string) => `
Task: Extract a concise brand overview from ${companyUrl} and public sources.
Output in ${locale}. Max 4 sentences.
Include: mission/essence, target audience, positioning, 3 differentiators.
Return 3–5 sources (URL + short snippet). Avoid generic language.
  `.trim(),

  marketTrends: (industry: string, locale: string) => `
Task: Identify 2–3 current trends affecting ${industry}.
Explain each trend in 2 lines. Add 2–3 actionable takeaways for social media strategy.
Return 3–5 recent sources with dates and URLs. Output in ${locale}.
  `.trim(),

  // ... other prompts
};
```

**Benefits:**
- Centralized prompt management
- Easy A/B testing of prompts
- Version control for prompt changes
- Type-safe interpolation

---

## 8. Security Considerations

### 1. API Key Protection

**Server-Only:**
- OpenAI, Perplexity, Supabase service keys in `.env.local`
- Never imported in client code
- Env vars validated on server startup

**Verification:**
```ts
// server/lib/validateEnv.ts
const requiredEnvVars = [
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'PERPLEXITY_API_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}
```

### 2. Supabase RLS

**Policy Pattern:**
```sql
-- All tables use owner-only access
CREATE POLICY "owner_access"
ON kb_sessions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Testing:**
- Unit tests attempt unauthorized access (should return 403)
- Test with different `auth.uid()` values

### 3. Input Validation

**Server-Side with Zod:**
```ts
const ResearchRequestSchema = z.object({
  company_url: z.string().url(),
  locale: z.enum(['en-US', 'en-GB', 'pt-BR', 'pt-PT']),
  step: z.enum(['research', 'brand', 'services', 'market', 'competitors']),
  session_id: z.string().uuid(),
});

app.post('/api/research', async (req, res) => {
  const result = ResearchRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  // ... proceed with validated data
});
```

**Client-Side Validation:**
- React Hook Form + Zod for UX (instant feedback)
- **Never trust client validation alone**

### 4. Rate Limiting

```ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // per IP
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api', limiter);
```

**Stricter limits for expensive endpoints:**
```ts
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
});

app.post('/api/research', aiLimiter, researchHandler);
app.post('/api/vision/analyse', aiLimiter, visionHandler);
```

### 5. CORS

```ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // dev
  'https://kb-builder.witfy.ai', // production
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### 6. Content Security Policy

```ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://*.supabase.co'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind needs inline
    },
  },
}));
```

### 7. Sanitizing User Input

**Markdown Content:**
- Use DOMPurify for rendering user markdown
- Prevent XSS via `<script>` tags

```tsx
import DOMPurify from 'dompurify';

function MarkdownPreview({ content }: { content: string }) {
  const html = markdownToHtml(content);
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

---

## 9. Data Flow

### Complete Flow Example: Research Step

```
[CLIENT]
User enters URL → Validates → Clicks "Research"
  ↓
useMutation triggers POST /api/research
  {
    company_url: "...",
    locale: "en-US",
    step: "research",
    session_id: "..."
  }

[SERVER]
Express receives request
  ↓
Zod validates schema
  ↓
Check session exists in Supabase (auth)
  ↓
Call Perplexity API with prompt
  ↓
Parse response (extract content + sources)
  ↓
Return JSON:
  {
    content_md: "...",
    sources: [...]
  }

[CLIENT]
Receive response
  ↓
Display content in MarkdownEditor
  ↓
Display sources in SourcesTab
  ↓
User edits/approves
  ↓
On approve: Save to Supabase
  - Insert/update kb_documents
  - Insert kb_sources (batch)
  ↓
Navigate to next step (/brand)
```

### State Synchronization

**Challenge:** Keep client state in sync with Supabase

**Solution:**
- TanStack Query caching
- Optimistic updates for instant UX
- Refetch on window focus (stale data check)
- Invalidate queries after mutations

```tsx
const mutation = useMutation({
  mutationFn: saveDocument,
  onMutate: async (newDoc) => {
    // Optimistic update
    await queryClient.cancelQueries(['documents']);
    const prev = queryClient.getQueryData(['documents']);
    queryClient.setQueryData(['documents'], (old) => [...old, newDoc]);
    return { prev };
  },
  onError: (err, newDoc, context) => {
    // Rollback on error
    queryClient.setQueryData(['documents'], context.prev);
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['documents']);
  },
});
```

---

## 10. Performance Optimizations

### 1. Code Splitting

**Route-Based:**
```tsx
const Welcome = lazy(() => import('./routes/Welcome'));
const Research = lazy(() => import('./routes/Research'));
// ... etc

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Welcome />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**Benefits:**
- Initial bundle smaller
- Load routes on-demand

### 2. i18n Lazy Loading

```ts
i18next.init({
  lng: detectedLocale,
  fallbackLng: 'en-US',
  ns: [], // Load namespaces on-demand
  backend: {
    loadPath: '/i18n/{{lng}}/kb-builder/{{ns}}.json',
  },
});

// In component:
const { t, ready } = useTranslation('step-welcome');
if (!ready) return <Loading />;
```

**Benefits:**
- Don't load all translations upfront
- Faster initial load

### 3. Image Optimization

**Client-Side Compression (before upload):**
```ts
async function compressImage(file: File): Promise<File> {
  if (file.size < 2 * 1024 * 1024) return file; // < 2MB, skip

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = await createImageBitmap(file);

  const maxDim = 1920;
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width *= ratio;
    height *= ratio;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.85);
  });
}
```

### 4. Debouncing

**Markdown Editor Auto-Save:**
```tsx
const debouncedSave = useMemo(
  () => debounce((content: string) => {
    saveDocument({ content });
  }, 1000),
  []
);

const handleChange = (e) => {
  setValue(e.target.value);
  debouncedSave(e.target.value);
};
```

### 5. React.memo for Expensive Components

```tsx
const ImageCard = React.memo(({ image, onRemove }: ImageCardProps) => {
  return (
    <div className="relative">
      <img src={image.url} alt={image.name} />
      <button onClick={() => onRemove(image.id)}>Remove</button>
    </div>
  );
}, (prev, next) => prev.image.id === next.image.id);
```

### 6. Virtualization (if needed)

**For large lists (e.g., many sources):**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function SourcesList({ sources }) {
  const parentRef = useRef();
  const virtualizer = useVirtualizer({
    count: sources.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualRow => (
        <div key={virtualRow.index} style={{ height: virtualRow.size }}>
          <SourceCard source={sources[virtualRow.index]} />
        </div>
      ))}
    </div>
  );
}
```

---

## 11. Testing Strategy

### Unit Tests
- Utility functions (SHA256, parsing)
- Zod schemas
- Service layer functions (mock API responses)

### Integration Tests
- API endpoints (use supertest)
- Database operations (use test Supabase instance)
- RLS policies

### E2E Tests (Future)
- Full wizard flow with Playwright or Cypress
- Test in all 4 locales

### Accessibility Tests
- Automated: axe-core, eslint-plugin-jsx-a11y
- Manual: keyboard navigation, screen reader testing

---

## 12. Future Enhancements

### Potential Improvements (Post-MVP)

1. **Real-Time Collaboration:** Multiple users editing same KB
2. **Version History:** Track changes to documents over time
3. **AI Prompt Customization:** Let users tweak prompts
4. **More AI Providers:** Add Claude, Gemini as alternatives
5. **Export to Google Docs/Notion:** Direct integration
6. **Analytics Dashboard:** Track usage, popular steps, drop-off
7. **Webhooks:** Notify Witfy main app when KB completed
8. **Admin Panel:** Manage sessions, moderate content
9. **Advanced i18n:** Right-to-left language support (Arabic, Hebrew)
10. **Offline Mode:** Progressive Web App with service workers

---

## 13. Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| Phase 0 | Use Vite over Create React App | Faster builds, better DX | CRA (deprecated), Next.js (overkill) |
| Phase 0 | Express over Serverless | Simpler local dev, stateful sessions | AWS Lambda, Vercel Functions |
| Phase 0 | TanStack Query over SWR | Better TypeScript support, more features | SWR, Redux Toolkit Query |
| Phase 1 | Linear wizard flow (no skip) | Ensures data quality | Free-form navigation |
| Phase 1 | Client-side image compression | Reduce upload time, bandwidth | Server-side (slower for user) |

---

**Author:** KB Builder Team  
**Last Updated:** Phase 1 (Planning)  
**Status:** Living Document (update as architecture evolves)

