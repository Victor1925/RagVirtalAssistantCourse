export type MessageRole = 'user' | 'assistant' | 'system';

export class Message {
  constructor(
    public readonly id: string,
    public readonly role: MessageRole,
    public readonly content: string,
    public readonly timestamp: Date,
    public readonly sources?: string[]
  ) {}

  static create(role: MessageRole, content: string, sources?: string[]): Message {
    const { v4: uuidv4 } = require('uuid');
    return new Message(uuidv4(), role, content, new Date(), sources);
  }
}
