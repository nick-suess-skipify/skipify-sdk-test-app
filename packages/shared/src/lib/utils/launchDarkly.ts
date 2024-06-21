import * as LDClient from 'launchdarkly-js-client-sdk';
import { LaunchDarklyConfig } from "../constants";


export class LaunchDarkly {
  private static instance: LaunchDarkly | null = null;
  private ldClient: LDClient.LDClient;
  private initialized = false;

  private constructor() {
    this.ldClient = LDClient.initialize(LaunchDarklyConfig.clientSideId, LaunchDarklyConfig.context);
  }

  public static async getInstance(): Promise<LaunchDarkly> {
    if (!LaunchDarkly.instance) {
      LaunchDarkly.instance = new LaunchDarkly();
      await LaunchDarkly.instance.initialize();
    }
    return LaunchDarkly.instance;
  }

  private async initialize(): Promise<void> {
    try {
      await this.ldClient.waitForInitialization(10);
      console.log("LaunchDarkly client initialized successfully.");
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing LaunchDarkly client:", error);
      throw error;
    }
    console.log(this.ldClient.allFlags())
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
