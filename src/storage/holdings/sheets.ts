import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";

import { logger } from "../../logger.js";
import { SaveStats } from "../../types.js";

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const worksheetName = process.env.HOLDINGS_WORKSHEET_NAME || "_spark_holdings";

const log = logger("sheets-holdings");

export type HoldingRow = {
	ticker: string;
	quantity: number;
	cost_per_share: number;
	category: "ETF" | "Stocks" | "Cash";
	currency: string;
};

export class HoldingsGoogleSheetsStorage {
	static FileHeaders = ["ticker", "quantity", "cost per share"];

	private initPromise: null | Promise<void> = null;

	private sheet: null | GoogleSpreadsheetWorksheet = null;

	async init() {
		// Init only once
		if (!this.initPromise) {
			this.initPromise = (async () => {
				await this.initDocAndSheet();
			})();
		}

		await this.initPromise;
	}

	canSave() {
		const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = process.env;
		return Boolean(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
	}

	async save(holdings: Array<HoldingRow>) {
		const rows: string[][] = [];
		await this.init();

		const stats: SaveStats = {
			name: "Google Sheets",
			table: worksheetName,
			total: holdings.length,
			added: 0,
			pending: 0,
			existing: 0,
			skipped: 0,
		};

		for (let h of holdings) {
			if (h.quantity < 1) {
				stats.pending++;
				stats.skipped++;
				continue;
			}

			rows.push(this.holdingRow(h));
		}

		if (rows.length) {
			stats.added = rows.length;
			await this.sheet?.addRows(rows);
		}

		return stats;
	}

	private async initDocAndSheet() {
		const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

		const { GOOGLE_SERVICE_ACCOUNT_EMAIL: client_email, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: private_key_base_64_encoded } = process.env;

		const private_key_decoded = Buffer.from(private_key_base_64_encoded || "", "base64")
			.toString("utf8")
			.replace(`"`, "");

		if (client_email && private_key_decoded) {
			log("Using ServiceAccountAuth");
			await doc.useServiceAccountAuth({
				client_email,
				private_key: private_key_decoded,
			});
		}

		await doc.loadInfo();

		if (!(worksheetName in doc.sheetsByTitle)) {
			log("Creating new sheet");
			const sheet = await doc.addSheet({ title: worksheetName });
			await sheet.setHeaderRow(HoldingsGoogleSheetsStorage.FileHeaders);
		}

		this.sheet = doc.sheetsByTitle[worksheetName];
	}

	private holdingRow(h: HoldingRow): Array<string> {
		return [h.ticker, String(h.quantity), String(h.cost_per_share)];
	}
}
