import { sendError } from "../notifier";
import { AccountData } from "../scrape";

import { HoldingsGoogleSheetsStorage } from "./holdings/sheets";

export const storages = [new HoldingsGoogleSheetsStorage()].filter((s) => s.canSave());

export async function initializeStorage() {
	try {
		return Promise.all(storages.map((s) => s.init()));
	} catch (e) {
		sendError(e, "initializeStorage");
	}
}

export async function saveResults(results: AccountData) {
	if (results.holdings.length) {
		const res = await Promise.all(storages.map((s) => s.save(results)));

		return {
			saved: true,
			stats: res,
		};
	}
	return {
		saved: false,
		stats: [],
	};
}

// export function transactionHash(tx: Transaction, companyId: CompanyTypes, accountNumber: string) {
// 	const date = roundToNearestMinutes(parseISO(tx.date)).toISOString();
// 	return `${date}_${tx.chargedAmount}_${tx.description}_${tx.memo}_${companyId}_${accountNumber}`;
// }

// function resultsToTransactions(results: Array<AccountScrapeResult>): Array<TransactionRow> {
// 	const txns: Array<TransactionRow> = [];

// 	for (let { result, companyId } of results) {
// 		if (result.success) {
// 			for (let account of result.accounts ?? []) {
// 				for (let tx of account.txns) {
// 					txns.push({
// 						...tx,
// 						hash: transactionHash(tx, companyId, account.accountNumber),
// 						account: account.accountNumber,
// 					});
// 				}
// 			}
// 		}
// 	}

// 	return txns;
// }
