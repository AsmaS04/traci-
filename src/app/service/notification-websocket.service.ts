import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject } from 'rxjs';

export interface AppNotification {
  type: 'NEW_CLIENT' | 'NEW_PAYMENT';
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationWebsocketService {
  private stompClient: Client;
  notification$ = new Subject<AppNotification>();

  constructor() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws/websocket',
      onConnect: () => {
        this.stompClient.subscribe('/topic/notifications', (msg) => {
          const notification: AppNotification = JSON.parse(msg.body);
          this.notification$.next(notification);
        });
      }
    });
  }

  connect() { this.stompClient.activate(); }
  disconnect() { this.stompClient.deactivate(); }
}