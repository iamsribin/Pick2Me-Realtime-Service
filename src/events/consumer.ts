import { container } from '@/config/inversify.config';
import { RideMatchingService } from '@/services/implementation/ride-matching-service';
import { INotificationService } from '@/services/interfaces/i-notification-service';
import { BookRideResponse, ConsumerTypes, expiresDocument, RideStart } from '@/types/event-types';
import { TYPES } from '@/types/inversify-types';
import { emitToUser } from '@/utils/socket-emit';
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from '@pick2me/shared/messaging';

const notificationService = container.get<INotificationService>(TYPES.NotificationService);
export class RealTimeEventConsumer {
  static async init() {
    await RabbitMQ.connect({ url: process.env.RABBIT_URL!, serviceName: 'realtime-service' });

    await RabbitMQ.setupExchange(EXCHANGES.DRIVER, 'topic');
    await RabbitMQ.setupExchange(EXCHANGES.BOOKING, 'topic');

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

    await RabbitMQ.consume(QUEUES.REALTIME_QUEUE, async (msg: ConsumerTypes) => {
      console.log("msg:",msg);
      
      switch (msg.type) {
        case ROUTING_KEYS.NOTIFY_DOCUMENT_EXPIRE:
          const notification = await notificationService.createDocumentExpireNotification(
            msg.data as expiresDocument
          );
          emitToUser(notification.receiverId, 'notification', notification);
          break;

        case ROUTING_KEYS.NOTIFY_BOOK_RIDE_DRIVER:
          console.log('NOTIFY_BOOK_RIDE_DRIVER:', msg);
          await RideMatchingService.getInstance().processRideRequest(msg.data as BookRideResponse);
          break;

        case ROUTING_KEYS.NOTIFY_RIDE_START:
          console.log('NOTIFY_RIDE_START:', msg);
          const rideData = msg.data as RideStart
          emitToUser(rideData.userId, "ride:start", rideData.status)
          emitToUser(rideData.driverId, "ride:start", rideData.status)
          break;

        case ROUTING_KEYS.RIDE_COMPLETED:
          console.log('Ride completed notifyed:', msg);
          const completedRideData = msg.data as any
          emitToUser(completedRideData.userId, "ride:completed", completedRideData)
          // emitToUser(completedRideData.driverId, "ride:completed", completedRideData)
          break;
        default:
          console.warn('Unknown message:', msg);
      }
    });
  }
}
