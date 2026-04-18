import type { Session } from "../session/Session.js";

export interface ISessionRepository {
  create(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  terminate(id: string): Promise<void>;
}
