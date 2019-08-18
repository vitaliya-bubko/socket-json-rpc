interface Logger {
  debug: Function
  warn: Function
  error: Function
}

let Logger: Logger = {
  debug: console.debug,
  warn: console.warn,
  error: console.error
}

function setLogger(logger: number | Logger): void {
  if (typeof logger === 'number') {
    Logger = {
      debug: logger > 2 ? console.debug : function(): void {},
      warn: logger > 1 ? console.warn : function(): void {},
      error: logger > 0 ? console.error : function(): void {}
    }
  } else if (typeof logger === 'object') {
    Logger = logger
  }
}

export { Logger, setLogger }
