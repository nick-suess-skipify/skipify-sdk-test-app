import { Messenger } from '..';
import { Event, EventPropertiesMap, EventType } from '../analytics';

export class Pubsub {
    isLoaded = false;

    sessionId?: number = undefined;
    deviceId?: string = undefined;

    /**
     * Identify a user and set user properties.
     *
     * @param userId The user's id.
     * @param properties The user properties.
     * @param options Optional event options.
     */
    identify(userId: string) {
        userId;
        console.warn('not implemented yet');
    }

    track<T extends EventType>(messenger: Messenger, type: T, event_properties?: EventPropertiesMap[T]) {
        messenger.trackEvent(type, event_properties);
    }

    getSessionId() {
        return this.sessionId;
    }

    setSessionId(sessionId: number) {
        this.sessionId = sessionId;
    }

    getDeviceId() {
        return this.deviceId;
    }

    setDeviceId(deviceId: string) {
        this.deviceId = deviceId;
    }

    reset() {
        console.warn('not implemented yet');
    }
}
