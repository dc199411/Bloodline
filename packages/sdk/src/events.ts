import { io, type Socket } from 'socket.io-client';
import type { Agent, Bounty } from '@bloodline/shared';

export type AgentBornCallback = (payload: { agent: Agent }) => void;
export type AgentDiedCallback = (payload: { agent: Agent; lastWill: string }) => void;
export type ProdigyBornCallback = (payload: { agent: Agent }) => void;
export type BountyPostedCallback = (payload: { bounty: Bounty }) => void;

export class BloodlineEvents {
  private socket: Socket | null = null;
  private wsUrl: string;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl.replace(/\/$/, '');
  }

  private getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(this.wsUrl, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });
    }
    return this.socket;
  }

  onAgentBorn(cb: AgentBornCallback): () => void {
    const socket = this.getSocket();
    const handler = (payload: { agent: Agent }) => cb(payload);
    socket.on('agent:born', handler);
    return () => socket.off('agent:born', handler);
  }

  onAgentDied(cb: AgentDiedCallback): () => void {
    const socket = this.getSocket();
    const handler = (payload: { agent: Agent; lastWill: string }) => cb(payload);
    socket.on('agent:died', handler);
    return () => socket.off('agent:died', handler);
  }

  onProdigyBorn(cb: ProdigyBornCallback): () => void {
    const socket = this.getSocket();
    const handler = (payload: { agent: Agent }) => cb(payload);
    socket.on('prodigy:born', handler);
    return () => socket.off('prodigy:born', handler);
  }

  onBountyPosted(cb: BountyPostedCallback): () => void {
    const socket = this.getSocket();
    const handler = (payload: { bounty: Bounty }) => cb(payload);
    socket.on('bounty:posted', handler);
    return () => socket.off('bounty:posted', handler);
  }

  onDeployLog(cb: (payload: { step: string; status: string; message: string }) => void): () => void {
    const socket = this.getSocket();
    const handler = (payload: { step: string; status: string; message: string }) => cb(payload);
    socket.on('deploy:log', handler);
    return () => socket.off('deploy:log', handler);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
