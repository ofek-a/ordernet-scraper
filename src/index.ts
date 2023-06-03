import "dotenv/config";

import { send, editMessage, sendError } from "./notifier";
import { initializeStorage, saveResults, storages } from "./storage/index";
import { logger, logToPublicLog } from "./logger";
import { scrape } from "./scrape";

const log = logger("main");

main();

async function main() {
	logToPublicLog("Scraping started");

	const message = await send("Starting...");

	if (!storages.length) {
		log("No storages found, aborting");
		await editMessage(message?.message_id, "No storages found, aborting");
	} else {
		try {
			const [results] = await Promise.all([scrape(), initializeStorage()]);

			const saved = await saveResults(results);
			// const summary = getSummaryMessage(results, saved.stats);

			// await send(summary);
		} catch (e) {
			log(e);
			await sendError(e);
		}
	}

	logToPublicLog("Scraping ended");
}
