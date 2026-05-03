import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pm4Routes from './routes/pm4.routes';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api', pm4Routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', pm4: process.env.PM4_BASE_URL });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Proxying to: ${process.env.PM4_BASE_URL}`);
});
