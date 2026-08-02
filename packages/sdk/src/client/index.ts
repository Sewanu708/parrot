import { HttpClient, ParrotClientOptions } from "./http";
import { WsClient } from "./ws";
import { AuthModule } from "./modules/auth";
import { TenantModule } from "./modules/tenant";
import { ConversationModule } from "./modules/conversation";
import { WidgetModule } from "./modules/widget";

export class ParrotClient {
  private http: HttpClient;
  public ws: WsClient;

  public auth: AuthModule;
  public tenant: TenantModule;
  public conversation: ConversationModule;
  public widget: WidgetModule;

  constructor(options: ParrotClientOptions = {}) {
    this.http = new HttpClient(options);
    this.ws = new WsClient(options);

    this.auth = new AuthModule(this.http);
    this.tenant = new TenantModule(this.http);
    this.conversation = new ConversationModule(this.http);
    this.widget = new WidgetModule(this.http);
  }

  setToken(token: string | undefined) {
    this.http.setToken(token);
  }

  setTenantId(tenantId: string | undefined) {
    this.http.setTenantId(tenantId);
  }
}

export * from "./http";
export * from "./ws";
export * from "./modules/auth";
export * from "./modules/tenant";
export * from "./modules/conversation";
export * from "./modules/widget";
