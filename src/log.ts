export function log(text: string | any, ...args: any) {
	if (process.env.VERBOSE === "true") {
		console.info(`[${new Date().toJSON()}] [INFO] ${text}`, ...args);
	}
}
