import express from 'express';
import cookieParser from 'cookie-parser';
// import { authRouter } from '@/routes/authRouter';
// import { userRouter } from '@/routes/userRouter';
import { errorHandler } from '@Pick2Me/shared/errors';
// import { adminRoute } from '@/routes/adminRoutes';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// app.use('/', authRouter);
// app.use('/', userRouter);
// app.use('/admin', adminRoute);

app.use(errorHandler);

export default app;
