import { container } from '@/config/inversify.config';
import { RideMatchingService } from '@/services/implementation/ride-matching-service';
import { INotificationService } from '@/services/interfaces/i-notification-service';
import { expiresDocumentConsumer } from '@/types/event-types';
import { TYPES } from '@/types/inversify-types';
import { emitToUser } from '@/utils/socket-emit';
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';

const notificationService = container.get<INotificationService>(TYPES.NotificationService);
export class RealTimeEventConsumer {
  static async init() {
    await RabbitMQ.connect({ url: process.env.RABBIT_URL!, serviceName: 'realtime-service' });

    await RabbitMQ.setupExchange(EXCHANGES.DRIVER, 'topic');

    await RabbitMQ.bindQueueToExchanges(QUEUES.REALTIME_QUEUE, [
      {
        exchange: EXCHANGES.DRIVER,
        routingKeys: ['driver-realtime.#'],
      },
      {
        exchange: EXCHANGES.BOOKING,
        routingKeys: ['booking-realtime.#'],
      },
    ]);

    await RabbitMQ.consume(QUEUES.REALTIME_QUEUE, async (msg: expiresDocumentConsumer) => {
      
      switch (msg.type) {
        case ROUTING_KEYS.NOTIFY_DOCUMENT_EXPIRE:
          const data = await notificationService.createDocumentExpireNotification(msg.data);
          emitToUser(data.receiverId, 'notification', data);
          break;

          case ROUTING_KEYS.NOTIFY_BOOK_RIDE_DRIVER:
            console.log("NOTIFY_BOOK_RIDE_DRIVER:",msg);
            const re = await RideMatchingService.getInstance().processRideRequest(msg.data);
          break;
        default:
          console.warn('Unknown message:', msg.type);
      }
    });
  }
}

// messageId: documentData.messageId,
// receiverId: documentData.receiverId,
// title: 'document expires',
// body: `your ${documentData.documents.length()} expires update that before going to online`,
// date: documentData.generatedAt,
