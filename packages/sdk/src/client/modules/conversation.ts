import type { HttpClient } from "../http";
import type {
  SendAgentMessageInput,
  SendMessageResponse,
  MessageDto,
} from "../../schema/conversation";

export class ConversationModule {
  constructor(private http: HttpClient) {}

  async sendMessage(input: SendAgentMessageInput) {
    return this.http.post<SendMessageResponse>("/conversations/messages", input);
  }

  async getMessages(conversationId: string) {
    return this.http.get<MessageDto[]>(`/conversations/${conversationId}/messages`);
  }
}

