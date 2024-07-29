import { Event, EventPropertiesMap, EventType } from "../analytics"
import { Pubsub } from "./pubsub";
import { Messenger } from "..";

export class SkipifyEvents {
  private pubSubService?: Pubsub;

  private async enableServices() {
    try {
      this.pubSubService = new Pubsub()
    } catch (err) {
      // timeout or initialization failed
      console.error(err)
    }
  }

  constructor() {
    this.enableServices()
  }

  getSessionId(): number | undefined {
    return this.pubSubService?.sessionId
  }

  setSessionId(id: number) {
    if (this.pubSubService) {
      return this.pubSubService.sessionId = id
    }
    return
  }

  getDeviceId(): string | undefined {
    return this.pubSubService?.getDeviceId()
  }

  setDeviceId(id: string) {
    if (this.pubSubService) {
      return this.pubSubService.setDeviceId(id)
    }
  }

  async identify(userId: string) {
    this.pubSubService?.identify(userId)
  }

  track<T extends EventType>(messenger: Messenger, type: T, event_properties?: EventPropertiesMap[T]) {
    const event: Event<T> = {
      event_type: type,
      event_properties,
    }
    this.pubSubService?.track(messenger, type, event_properties)
  }

  reset() {
    this.pubSubService?.reset()
  }
}
