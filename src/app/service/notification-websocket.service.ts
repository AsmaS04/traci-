import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

export interface AppNotification {
  type: 'NEW_CLIENT'      | 'NEW_PAYMENT'      |
        'NEW_RESELLER'    | 'UPDATE_RESELLER'  | 'DELETE_RESELLER' |
        'UPDATE_CLIENT'   | 'DELETE_CLIENT'    |
        'DEVICE_ASSIGNED';
  label?:     string;
  detail?:    string;
  message?:   string;
  timestamp:  string;
}

export interface AvatarEvent {
  resellerId: number;
  avatarUrl:  string;
  message:    string;
}

@Injectable({ providedIn: 'root' })
export class NotificationWebsocketService {

  private client!: Client;

  notification$ = new Subject<AppNotification>();
  avatar$        = new Subject<AvatarEvent>();

  connect() {
    this.client = new Client({
      brokerURL:      'ws://localhost:8080/ws/websocket',
      reconnectDelay: 5000,
      debug:          () => {}
    });

    this.client.onConnect = () => {
      this.client.subscribe('/topic/notifications', (msg: IMessage) => {
        this.notification$.next(JSON.parse(msg.body));
      });

      const resellerId = Number(localStorage.getItem('idRev'));
      if (resellerId) {
        this.client.subscribe(`/topic/reseller/${resellerId}/avatar`, (msg: IMessage) => {
          this.avatar$.next(JSON.parse(msg.body));
        });
      }
    };

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
  }
}