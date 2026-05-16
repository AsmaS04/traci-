import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

export type AppNotificationType =
  | 'NEW_CLIENT'
  | 'NEW_PAYMENT'
  | 'NEW_RESELLER'
  | 'UPDATE_RESELLER'
  | 'DELETE_RESELLER'
  | 'UPDATE_CLIENT'
  | 'DELETE_CLIENT'
  | 'DEVICE_ASSIGNED'
  | 'NEW_DEVICE_REQUEST'
  | 'DEVICE_REQUEST_FULFILLED'
  | 'DEVICE_REQUEST_REJECTED'
  | 'ACCESS_REQUEST'
  | 'COMMISSION_EARNED'
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID';

export interface AppNotification {
  id?: number;
  type: AppNotificationType;
  label?: string;
  detail?: string;
  message?: string;
  isRead?: boolean;
  timestamp?: string;
  createdAt?: string;
}

export interface AvatarEvent {
  resellerId: number;
  avatarUrl: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationWebsocketService {

  private client!: Client;

  notification$          = new Subject<AppNotification>();
  resellerNotification$  = new Subject<AppNotification>();
  avatar$                = new Subject<AvatarEvent>();

  connect() {
    this.client = new Client({
      brokerURL:      'ws://localhost:8080/ws/websocket',
      reconnectDelay: 5000,
      debug: () => {}
    });

    this.client.onConnect = () => {

      // Global admin channel
      this.client.subscribe('/topic/notifications', (msg: IMessage) => {
        this.notification$.next(JSON.parse(msg.body));
      });

      // Reseller-specific channel
      const resellerId = Number(localStorage.getItem('idRev'));
      if (resellerId) {
        this.client.subscribe(
          `/topic/reseller/${resellerId}/notification`,
          (msg: IMessage) => {
            this.resellerNotification$.next(JSON.parse(msg.body));
          }
        );

        this.client.subscribe(
          `/topic/reseller/${resellerId}/avatar`,
          (msg: IMessage) => {
            this.avatar$.next(JSON.parse(msg.body));
          }
        );
      }
    };

    this.client.onStompError = (frame) => {
      console.error('Broker error:', frame.headers['message']);
      console.error('Details:', frame.body);
    };

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
  }
}