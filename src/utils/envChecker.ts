import { envChecker } from '@pick2me/shared/utils';

export const isEnvDefined = () => {
  envChecker(process.env.PORT, 'PORT');
  envChecker(process.env.CORS_ORIGIN, 'CORS_ORIGIN');
  envChecker(process.env.ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET');
  envChecker(process.env.REDIS_URL, 'REDIS_URL');
  envChecker(process.env.RABBIT_URL, 'RABBIT_URL');
};
