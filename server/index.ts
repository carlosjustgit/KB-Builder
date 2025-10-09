// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config();

// Log environment check on startup
console.log('🔧 Environment check:');
console.log('  - SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
console.log('  - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓' : '✗');
console.log('  - PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✓' : '✗');

// Now import everything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import researchRoutes from './routes/research.js';
import visionRoutes from './routes/vision.js';
import exportRoutes from './routes/export.js';
import chatRoutes from './routes/chat.js';
import imagesRoutes from './routes/images.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/research', researchRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/images', imagesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

