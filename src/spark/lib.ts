import axios, { AxiosInstance } from "axios";
import yahooFinance from "yahoo-finance2";

import { logger } from "../logger";
import { HoldingRow } from "../storage/holdings/sheets";
import { convertKeys } from "./response-keys-converter/data-keys-converter";

import { Config, Account, SparkHolding } from "./types";

const log = logger("spark-lib");

const config: Config = {
	apiUrl: undefined,
	authorization: undefined,
};

let axiosClient: AxiosInstance;

/**
 * Authenticate against the Spark system of the broker. This function must be called first as it initializes the `apiUrl` and `authorization` fields in the internal config. That way we won't need to authenticate again for each API call. Uses `/api/Auth/Authenticate`.
 * @param {string} username - The Spark username
 * @param {string} password - The Spark password
 * @param {string} broker - Used to get the API URL like this: `https://spark${broker}.ordernet.co.il/api`. E.g. `nesua`, `meitav`, `psagot`
 */
async function authenticate(username: string, password: string, broker: string) {
	config.apiUrl = `https://spark${broker}.ordernet.co.il/api/`;
	const authRes = await axios.post(`${config.apiUrl}/Auth/Authenticate`, {
		username,
		password,
	});

	config.broker = broker;
	config.authorization = `Bearer ${authRes.data.l}`;

	axiosClient = axios.create({
		baseURL: config.apiUrl,
		headers: {
			Authorization: config.authorization,
		},
	});
}

/**
 * Get all the accounts listed under this Spark user. Uses `/api/DataProvider/GetStaticData`.
 */
async function getAccounts(): Promise<Account[]> {
	const getStaticDataRes = await axiosClient.get(`DataProvider/GetStaticData`);

	const accounts = getStaticDataRes.data.filter((x) => x.b == "ACC")[0].a.map((x) => ({ key: x._k, number: x.a.b, name: x.a.e }));

	return accounts;
}

/**
 * Get total balance of an account. Uses `/api/Account/GetAccountSecurities`.
 * @param {Account} account - Account to get balance for
 */
async function getAccountBalance(account: Account): Promise<number> {
	const result = await axiosClient.get(`Account/GetAccountSecurities?accountKey=${account.key}`);
	return result.data.a.o;
}

async function getHoldings(account: Account) {
	const result: SparkHolding[] = await axiosClient
		.get(`Account/GetHoldings?accountKey=${account.key}`)
		.then((res) => res.data)
		.then((data) => data.map(convertKeys));

	const holdingsPromises = result.map(async (h) => await new SparkHoldingTransformer(h).getHoldingRow());
	const holdings = (await Promise.all(holdingsPromises)).filter((h) => h !== null);

	return holdings;
}

async function getTransactions(account: Account, from: Date = new Date(new Date().getFullYear(), 0, 1), to: Date = new Date(Date.now())) {
	const result = await axiosClient
		.get(`Account/GetAccountTransactions`, {
			params: {
				accountKey: account.key,
				startDate: from.toISOString(), // 2018-01-01T00:00:00.000Z
				endDate: to.toISOString(), // 2018-11-19T00:00:00.000Z&
			},
		})
		.then((res) => res.data)
		.then((data) => data.map(convertKeys));

	return result;
}

/**
 * Convert account key to account number.
 * @param {string} key - The account key for API usage (`ACC_XXX-YYYYYY`)
 */
function accountKeyToNumber(key: string) {
	return key.split("-")[1];
}

// function transformYahooSymbolTo

class SparkHoldingTransformer {
	private readonly holding: SparkHolding;

	constructor(holding: SparkHolding) {
		this.holding = holding;
	}

	get yahooCategoryMapToHoldingRow(): Record<string, HoldingRow["category"]> {
		return {
			ETF: "ETF",
			Equity: "Stocks",
			Currency: "Cash",
		};
	}

	async getHoldingRow(): Promise<HoldingRow | null> {
		const quantity = this.holding.NV;
		if (quantity < 1) return null;

		const ticker = await this.getTicker();
		if (!ticker) return null;

		const gsheetHolding: HoldingRow = {
			ticker,
			quantity,
			cost_per_share: parseFloat(this.getCostPerShare(quantity).toFixed(2)),
			category: await this.getCategory(ticker, this.holding.SYMBOL_NAM),
			currency: await this.getCurrency(ticker),
		};

		return gsheetHolding;
	}

	private async getTicker() {
		const holdingType = this.holding.SugBno;
		const holdingSymbol = this.holding.SYMBOL_NAM;

		this.holding.SugBno;

		// if US stock
		if (holdingType === "KranotFrgn" || holdingType === "ForeignStockFrgn") {
			return holdingSymbol.replace(" US", "");
		}
		// if israeli stock
		else if (holdingType === "StockShekel") {
			const yahoo = await yahooFinance.search(holdingSymbol);
			const yahooQuote = yahoo.quotes[0];

			if (!yahooQuote) return null;

			return this.yahooTickerToGoogleFinanceTicker(yahooQuote.symbol);
		} else if (holdingType === "MatachMezuman") {
			return holdingSymbol.replace(" CASH", "");
		}
	}

	private getCostPerShare(quantity: number) {
		if (this.holding.SugBno === "StockShekel") return this.holding.COST / quantity;

		return this.holding.SUM1 / quantity;
	}

	private async getCategory(ticker: string, originalTicker: string) {
		if (this.holding.SugBno === "MatachMezuman") return "Cash";
		if (this.holding.SugBno === "StockShekel") ticker = originalTicker;

		const yahoo = await yahooFinance.search(ticker);
		const category = yahoo.quotes[0]?.typeDisp;

		return this.yahooCategoryMapToHoldingRow[category];
	}

	private async getCurrency(ticker: string) {
		if (this.holding.SugBno === "MatachMezuman") return ticker;
		if (this.holding.SugBno === "StockShekel") return "ILS";

		const yahoo = await yahooFinance.quote(ticker);

		return yahoo?.currency || "";
	}

	private yahooTickerToGoogleFinanceTicker(yahooTicker: string) {
		let output = "TLV:" + yahooTicker.replace("-", ".").replace(".TA", "");
		output = output.replace(".", ""); // Remove the extra period
		output = output.substring(0, 6) + "." + output.substring(6);

		return output;
	}
}

export default { config, authenticate, getAccounts, getAccountBalance, accountKeyToNumber, getHoldings, getTransactions };
