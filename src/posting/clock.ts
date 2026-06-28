/** Источник времени. Инъекция делает rate-limiter и очередь тестируемыми. */
export type Clock = () => Date;

export const CLOCK = Symbol('CLOCK');

export const systemClock: Clock = () => new Date();
