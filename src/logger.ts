export function logger(loggerName: string) {
	function log(text: string | any, ...args: any) {
		if (process.env.VERBOSE === "true") {
			console.info(`[${new Date().toJSON()}] [${loggerName}] [INFO] ${text}`, ...args);
		}
	}

	return log;
}

export function logToPublicLog(message: string) {
	console.log(message);
}
