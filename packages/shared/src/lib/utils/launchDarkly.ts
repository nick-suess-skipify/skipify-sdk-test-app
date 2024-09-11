import * as LDClient from 'launchdarkly-js-client-sdk';
import { LaunchDarklyConfig } from "../constants";


export class LaunchDarkly {
  private static instance: LaunchDarkly | null = null;
  private ldClient: LDClient.LDClient;
  private initialized = false;

  private constructor(merchantId: string) {
    this.ldClient = LDClient.initialize(LaunchDarklyConfig.clientSideId, LaunchDarklyConfig.context(merchantId));
  }

  public static async getInstance(merchantId: string): Promise<LaunchDarkly> {
    if (!LaunchDarkly.instance) {
      LaunchDarkly.instance = new LaunchDarkly(merchantId);
      await LaunchDarkly.instance.initialize();
    }
    return LaunchDarkly.instance;
  }

  private async initialize(): Promise<void> {
    try {
      await this.ldClient.waitForInitialization(10);
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing LaunchDarkly client:", error);
      throw error;
    }
  }

  public async getVariation(flagName: string, defaultValue?: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("LaunchDarkly client is not initialized. Please call getInstance() first.");
    }
    return this.ldClient.variation(flagName, defaultValue);
  }

  public close(): void {
    this.ldClient.close();
  }
}
