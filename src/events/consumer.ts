import { socketService } from '@/services/implementation/socket-service';
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';

export class RealTimeEventConsumer {
  static async init() {
    await RabbitMQ.connect({ url: process.env.RABBIT_URL!, serviceName: 'realtime-service' });

    await RabbitMQ.setupExchange(EXCHANGES.DRIVER, 'topic');

    await RabbitMQ.bindQueueToExchanges(QUEUES.REALTIME_QUEUE, [
      {
        exchange: EXCHANGES.DRIVER,
        routingKeys: ['driver.#'],
      },
    ]);

    await RabbitMQ.consume(QUEUES.REALTIME_QUEUE, async (msg) => {
      switch (msg.type) {
        case ROUTING_KEYS.DRIVER_LOCATION_UPDATE:
          console.log('consume', msg);

          await socketService.notifyUser(msg);
          break;
        default:
          console.warn('Unknown message:', msg.type);
      }
    });
  }
}
