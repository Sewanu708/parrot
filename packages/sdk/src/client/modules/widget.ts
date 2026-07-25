import type { HttpClient } from "../http";
import type {
  SendMessageResponse,
  SendVisitorMessageInput,
} from "../../schema/conversation";

export class WidgetModule {
  constructor(private http: HttpClient) {}

  async sendMessage(input: SendVisitorMessageInput) {
    return this.http.post<SendMessageResponse>("/widget/messages", input);
  }
}
