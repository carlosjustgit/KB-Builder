import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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

// Placeholder routes
app.post('/api/research', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/api/vision/analyse', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/api/visual/test-image', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/api/export/json', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/api/export/zip', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

