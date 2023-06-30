import { Types, createInstance } from "@amplitude/analytics-browser";
import { AmplitudeApiKey } from "../constants";

export class Amplitude {
  private client: Types.BrowserClient;

  constructor() {
    this.client = createInstance();
    this.client.init(AmplitudeApiKey, {
      plan: {
        source: "checkout-sdk",
      },
    });
  }

  /**
   * Track event
   *
   * @param event The event to track.
   * @param options Optional event options.
   */
  track(event: Types.TrackEvent, options?: Types.EventOptions) {
    return this.client?.track(event, undefined, options);
  }
}
