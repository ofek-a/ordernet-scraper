import axios, { AxiosInstance } from "axios";
import { convertKeys } from "./response-keys-converter/data-keys-converter";

import { Config, Account } from "./types";

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
	const result = await axiosClient
		.get(`Account/GetHoldings?accountKey=${account.key}`)
		.then((res) => res.data)
		.then((data) => data.map(convertKeys));

	return result.map((holding) => holding.SYMBOL_NAM);
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

export default { config, authenticate, getAccounts, getAccountBalance, accountKeyToNumber, getHoldings, getTransactions };
