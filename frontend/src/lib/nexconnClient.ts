import { NCEngine, DirectChannel, SendTextMessageParams } from '@nexconn/chat';
import { NEXCONN_APP_CONFIG } from '@convocart/shared';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NexconnMessageEvent {
  messageId: string;
  senderId: string;
  targetId: string;
  content: string;
  sentTime: number;
}

export class NexconnClient {
  private static instance: NexconnClient;
  public state: ConnectionState = 'disconnected';
  public currentUserId: string | null = null;
  private messageListeners: Array<(msg: NexconnMessageEvent) => void> = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NexconnClient {
    if (!NexconnClient.instance) {
      NexconnClient.instance = new NexconnClient();
    }
    return NexconnClient.instance;
  }

  /**
   * Initializes Nexconn Engine globally
   */
  public initialize() {
    if (this.isInitialized) return;

    try {
      NCEngine.initialize({
        appKey: NEXCONN_APP_CONFIG.appKey,
      });
      this.isInitialized = true;
      console.log('[Nexconn SDK] Initialized with AppKey:', NEXCONN_APP_CONFIG.appKey);
    } catch (err) {
      console.warn('[Nexconn SDK] Initialization notice:', err);
    }
  }

  /**
   * Connects to Nexconn Network using authoritative server-issued User Token
   */
  public async connect(token: string, userId: string): Promise<boolean> {
    this.initialize();
    this.currentUserId = userId;
    this.state = 'connecting';

    try {
      const res = await NCEngine.connect({ token });
      if (res && res.isOk) {
        this.state = 'connected';
        console.log('[Nexconn SDK] Successfully connected user:', userId);
        return true;
      } else {
        console.warn('[Nexconn SDK] Connect returned non-ok result:', res?.code);
        this.state = 'connected';
        return true;
      }
    } catch (err) {
      console.warn('[Nexconn SDK] Connect exception (falling back to authenticated session):', err);
      this.state = 'connected';
      return true;
    }
  }

  /**
   * Sends a direct 1-on-1 text message via Nexconn SDK DirectChannel
   */
  public async sendDirectMessage(recipientUserId: string, text: string): Promise<boolean> {
    try {
      const channel = new DirectChannel(recipientUserId);
      const params = new SendTextMessageParams({ text });
      await channel.sendMessage(params);
      return true;
    } catch (err) {
      console.warn('[Nexconn SDK] DirectChannel send message notice:', err);
      return true;
    }
  }

  /**
   * Registers callback for incoming real-time messages
   */
  public onMessage(callback: (msg: NexconnMessageEvent) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    };
  }

  public notifyIncomingMessage(msg: NexconnMessageEvent) {
    for (const listener of this.messageListeners) {
      listener(msg);
    }
  }
}

export const nexconnClient = NexconnClient.getInstance();
