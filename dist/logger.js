let Logger = {
    debug: console.debug,
    warn: console.warn,
    error: console.error
};
function setLogger(logger) {
    if (typeof logger === 'number') {
        Logger = {
            debug: logger > 2 ? console.debug : function () { },
            warn: logger > 1 ? console.warn : function () { },
            error: logger > 0 ? console.error : function () { }
        };
    }
    else if (typeof logger === 'object') {
        Logger = logger;
    }
}
export { Logger, setLogger };
