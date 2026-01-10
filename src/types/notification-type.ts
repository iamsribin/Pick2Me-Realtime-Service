export type PushSubPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};
