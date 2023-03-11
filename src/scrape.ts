import lib from "./spark/lib";
import { logger } from "./logger";
import { Account } from "./spark/types";
import { HoldingRow } from "./storage/holdings/sheets";

const log = logger("scrape");

export type AccountData = {
	holdings: HoldingRow[];
};

export async function scrape() {
	if (!process.env.USERNAME || !process.env.PASSWORD || !process.env.BROKER) throw new Error("no username or password");

	log(`Login in to https://${process.env.BROKER}.ordernet.co.il with user ${process.env.USERNAME}...`);
	await lib.authenticate(process.env.USERNAME, process.env.PASSWORD, process.env.BROKER);

	let accounts: Account[] = [];
	log("Getting account keys...");

	accounts = await lib.getAccounts();
	log(`Account keys found (${accounts.length}): ${accounts.map((a) => a.key).join(", ")}`);

	const a = accounts[0];

	const accountData: AccountData = {
		holdings: [],
	};

	log(`Getting balance for account ${a.number} (account key ${a.key})...`);

	const holdings = await lib.getHoldings(a);
	log("holdings", holdings);
	accountData.holdings = holdings;

	const transactions = await lib.getTransactions(a);
	// log("transactions", { transactions });

	const balance = await lib.getAccountBalance(a);
	log("balance", balance);

	return accountData;
}
