import { SkipifyErrorType } from './embedded-components.types';

export class SkipifyError {
    error: SkipifyErrorType = { message: 'Something went wrong. Please try again later.' };

    constructor(error?: any) {
        if (typeof error === 'string') {
            this.error.message = error;
        } else if (error?.error?.message) {
            this.error.message = error.error.message;
        }
    }

    contains(substring: string): boolean {
        return this.error.message.includes(substring);
    }
}
