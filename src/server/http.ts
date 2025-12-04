import express from 'express';
import cookieParser from 'cookie-parser';
import { notificationRouter } from '@/routes/notificationRouter';
import { errorHandler } from '@Pick2Me/shared/errors';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/', notificationRouter);

app.use(errorHandler);

export default app;
