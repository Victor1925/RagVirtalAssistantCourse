import { Message } from './Message';

export class ChatSession {
  private messages: Message[] = [];

  constructor(public readonly id: string) {}

  addMessage(message: Message): void {
    this.messages.push(message);
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getLastNMessages(n: number): Message[] {
    return this.messages.slice(-n);
  }
}
