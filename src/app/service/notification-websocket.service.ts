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
  | 'INVOICE_PAID'
  | 'PAYMENT_SUCCESS'
  | 'SUBSCRIPTION_EXPIRING';

export interface AppNotification {
  id?        : number;
  type       : AppNotificationType;
  label?     : string;
  detail?    : string;
  message?   : string;
  isRead?    : boolean;
  timestamp? : string;
  createdAt? : string;
}

export interface AvatarEvent {
  resellerId? : number;
  clientId?   : number;
  avatarUrl   : string;
  message     : string;
}

@Injectable({ providedIn: 'root' })
export class NotificationWebsocketService {

  private client!     : Client;
  private connected   = false;
  private connecting  = false;

  // ── Subjects ────────────────────────────────────────────────
  notification$         = new Subject<AppNotification>();
  resellerNotification$ = new Subject<AppNotification>();
  clientNotification$   = new Subject<AppNotification>();
  avatar$               = new Subject<AvatarEvent>();
  clientAvatar$         = new Subject<AvatarEvent>();

  // ── Main connect — call once per layout ─────────────────────
  connect() {
    if (this.connected || this.connecting) return;
    this.connecting = true;

    this.client = new Client({
      brokerURL     : 'ws://localhost:8080/ws/websocket',
      reconnectDelay: 5000,
      debug         : () => {}
    });

    this.client.onConnect = () => {
      this.connected  = true;
      this.connecting = false;

      // ── Global admin channel ─────────────────────────────
      this.client.subscribe('/topic/notifications', (msg: IMessage) => {
        this.notification$.next(JSON.parse(msg.body));
      });

      // ── Reseller-specific channel ────────────────────────
      const resellerId = Number(localStorage.getItem('idRev'));
      if (resellerId) {
        this.client.subscribe(
          `/topic/reseller/${resellerId}/notification`,
          (msg: IMessage) => { this.resellerNotification$.next(JSON.parse(msg.body)); }
        );
        this.client.subscribe(
          `/topic/reseller/${resellerId}/avatar`,
          (msg: IMessage) => { this.avatar$.next(JSON.parse(msg.body)); }
        );
      }

      // ── Client-specific channel ──────────────────────────
      const clientId = Number(localStorage.getItem('clientId'));
      if (clientId) {
        this.client.subscribe(
          `/topic/client/${clientId}/notification`,
          (msg: IMessage) => { this.clientNotification$.next(JSON.parse(msg.body)); }
        );
        this.client.subscribe(
          `/topic/client/${clientId}/avatar`,
          (msg: IMessage) => { this.clientAvatar$.next(JSON.parse(msg.body)); }
        );
      }
    };

    this.client.onDisconnect = () => {
      this.connected  = false;
      this.connecting = false;
    };

    this.client.onStompError = (frame) => {
      this.connected  = false;
      this.connecting = false;
      console.error('STOMP broker error:', frame.headers['message']);
    };

    this.client.activate();
  }

  // ── Called by client layout AFTER clientId is known ─────────
  // Use this when connect() was called before clientId was in localStorage
  subscribeToClient(clientId: number) {
    if (!clientId) return;

    const doSubscribe = () => {
      this.client.subscribe(
        `/topic/client/${clientId}/notification`,
        (msg: IMessage) => { this.clientNotification$.next(JSON.parse(msg.body)); }
      );
      this.client.subscribe(
        `/topic/client/${clientId}/avatar`,
        (msg: IMessage) => { this.clientAvatar$.next(JSON.parse(msg.body)); }
      );
    };

    if (this.connected) {
      doSubscribe();
    } else {
      // Wait for connection then subscribe
      const waitAndSubscribe = setInterval(() => {
        if (this.connected) {
          clearInterval(waitAndSubscribe);
          doSubscribe();
        }
      }, 200);
      // Give up after 10 seconds
      setTimeout(() => clearInterval(waitAndSubscribe), 10000);
    }
  }

  // ── Called by reseller layout AFTER idRev is known ──────────
  subscribeToReseller(resellerId: number) {
    if (!resellerId) return;

    const doSubscribe = () => {
      this.client.subscribe(
        `/topic/reseller/${resellerId}/notification`,
        (msg: IMessage) => { this.resellerNotification$.next(JSON.parse(msg.body)); }
      );
      this.client.subscribe(
        `/topic/reseller/${resellerId}/avatar`,
        (msg: IMessage) => { this.avatar$.next(JSON.parse(msg.body)); }
      );
    };

    if (this.connected) {
      doSubscribe();
    } else {
      const waitAndSubscribe = setInterval(() => {
        if (this.connected) {
          clearInterval(waitAndSubscribe);
          doSubscribe();
        }
      }, 200);
      setTimeout(() => clearInterval(waitAndSubscribe), 10000);
    }
  }

  disconnect() {
    this.connected  = false;
    this.connecting = false;
    this.client?.deactivate();
  }
}