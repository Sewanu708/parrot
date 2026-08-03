import type { HttpClient } from "../http";
import type {
  SendMessageResponse,
  SendVisitorMessageInput,
  MessageDto,
} from "../../schema/conversation";
import type { WidgetPropertyConfigDto } from "../../schema/tenant";

export class WidgetModule {
  constructor(private http: HttpClient) {}

  async sendMessage(input: SendVisitorMessageInput) {
    return this.http.post<SendMessageResponse>("/widget/messages", input);
  }

  async fetchConfig(propertyId: string) {
    return this.http.get<WidgetPropertyConfigDto>(`/widget/properties/${propertyId}`);
  }

  async getMessages(conversationId: string) {
    return this.http.get<MessageDto[]>(`/widget/conversations/${conversationId}/messages`);
  }
}
