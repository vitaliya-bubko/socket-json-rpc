interface Logger {
    debug: Function;
    warn: Function;
    error: Function;
}
declare let Logger: Logger;
declare function setLogger(logger: number | Logger): void;
export { Logger, setLogger };
