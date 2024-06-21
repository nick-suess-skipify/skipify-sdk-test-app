import { Event, EventPropertiesMap, EventType } from "../analytics"
import { Amplitude } from "./amplitude";
import * as LDClient from 'launchdarkly-js-client-sdk';
import { Pubsub } from "./pubsub";
import { LaunchDarkly } from "./launchDarkly";

let ldClient: LDClient.LDClient

export class SkipifyEvents {
  private amplitudeService?: Amplitude;
  private pubSubService?: Pubsub;

  private async enableServices() {
    try {
      const ld = await LaunchDarkly.getInstance();  // Esto garantiza una sola instancia
      const useAmplitude = await ld.getVariation('UseAmplitudeEvents')
      const usePubSub = await ld.getVariation('UseSkipifyEvents')
      if (useAmplitude) {
        this.amplitudeService = new Amplitude()
      }
      if (usePubSub) {
        this.pubSubService = new Pubsub()
      }
    } catch (err) {
      // timeout or initialization failed
      console.error(err)
    }
  }

  constructor() {
    this.enableServices()
  }

  getSessionId(): number | undefined {
    if (this.amplitudeService) {
      return this.amplitudeService.getSessionId()
    }
    if (this.pubSubService) {
      return this.pubSubService.sessionId
    }
    return
  }

  setSessionId(id: number) {
    if (this.amplitudeService) {
      return this.amplitudeService.setSessionId(id)
    }
    if (this.pubSubService) {
      return this.pubSubService.sessionId = id
    }
  }

  getDeviceId(): string | undefined {
    if (this.amplitudeService) {
      return this.amplitudeService.getDeviceId()
    }
    if (this.pubSubService) {
      return this.pubSubService.getDeviceId()
    }
    return
  }

  setDeviceId(id: string) {
    if (this.amplitudeService) {
      return this.amplitudeService.setDeviceId(id)
    }
    if (this.pubSubService) {
      return this.pubSubService.setDeviceId(id)
    }
  }

  async identify(userId: string) {
    if (this.amplitudeService) {
      this.amplitudeService.identify(userId)
    }
    if (this.pubSubService) {
      this.pubSubService.identify(userId)
    }
  }

  track<T extends EventType>(type: T, event_properties?: EventPropertiesMap[T]) {
    const event: Event<T> = {
      event_type: type,
      event_properties,
    }
    if (this.amplitudeService) {
      this.amplitudeService.track(event)
    }
    if (this.pubSubService) {
      this.pubSubService.track(event)
    }
  }

  reset() {
    if (this.amplitudeService) {
      this.amplitudeService.reset()
    }
    if (this.pubSubService) {
      this.pubSubService.reset()
    }
  }

  async onExit() {
    ldClient.close()
  }
}
