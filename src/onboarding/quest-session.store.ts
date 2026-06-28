import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { QuestSession } from './quest.types';

/**
 * Хранилище сессий квеста. Бизнес-логика зависит от порта — in-memory для dev
 * подменяется на РФ-хранилище в проде.
 */
export interface QuestSessionStore {
  create(): Promise<QuestSession>;
  get(id: string): Promise<QuestSession | undefined>;
  save(session: QuestSession): Promise<void>;
}

export const QUEST_SESSION_STORE = Symbol('QUEST_SESSION_STORE');

/**
 * In-memory реализация. Только для dev/тестов — сессии не переживают рестарт.
 * [TODO] Заменить на хранилище в РФ-юрисдикции (spec п.8).
 */
@Injectable()
export class InMemoryQuestSessionStore implements QuestSessionStore {
  private readonly sessions = new Map<string, QuestSession>();

  async create(): Promise<QuestSession> {
    const session: QuestSession = {
      id: randomUUID(),
      createdAt: new Date(),
      demoDone: false,
      completedSteps: [],
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(id: string): Promise<QuestSession | undefined> {
    return this.sessions.get(id);
  }

  async save(session: QuestSession): Promise<void> {
    this.sessions.set(session.id, session);
  }
}
