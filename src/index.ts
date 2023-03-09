import dotenv from "dotenv";
dotenv.config();

import lib from "./lib";
import { log } from "./log";
import { Account } from "./types";

const broker = "nesua";

main();

async function main() {
	if (!process.env.USERNAME || !process.env.PASSWORD) throw new Error("no username or password");

	log(`Login in to https://${broker}.ordernet.co.il with user ${process.env.USERNAME}...`);
	await lib.authenticate(process.env.USERNAME, process.env.PASSWORD, broker);

	let accounts: Account[] = [];
	log("Getting account keys...");

	accounts = await lib.getAccounts();
	log(`Account keys found (${accounts.length}): ${accounts.map((a) => a.key).join(", ")}`);

	for (const a of accounts) {
		log(`Getting balance for account ${a.number} (account key ${a.key})...`);

		const holdings = await lib.getHoldings(a);
		log("holdings", holdings);

		const transactions = await lib.getTransactions(a);
		log("transactions", { transactions });

		const balance = await lib.getAccountBalance(a);
		log("balance", balance);
	}
}
