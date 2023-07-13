import { Types, createInstance, Identify } from "@amplitude/analytics-browser";
import { AmplitudeApiKey } from "../constants";

export class Amplitude {
  private client: Types.BrowserClient;

  constructor() {
    this.client = createInstance();
    this.client.init(AmplitudeApiKey, {
      defaultTracking: false,
      plan: {
        source: "checkout-sdk",
      },
    });
  }

  /**
   * Identify event
   *
   * @param userId The user's id or email
   */
  async identify(userId: string) {
    const amplitudeIdentify = new Identify();
    return this.client?.identify(amplitudeIdentify, { user_id: userId })
      .promise;
  }

  /**
   * Track event
   *
   * @param event The event to track.
   * @param options Optional event options.
   */
  async track(event: Types.TrackEvent, options?: Types.EventOptions) {
    return this.client?.track(event, undefined, options);
  }
}
