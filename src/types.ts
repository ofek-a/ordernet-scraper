export type Config = {
	// The API URL to send requests to. Probably one of `https://sparknesua.ordernet.co.il/api`, `https://sparkmeitav.ordernet.co.il/api` or `https://sparkpsagot.ordernet.co.il/api`.
	apiUrl?: string;

	// The bearer token to pass for authentication in each API call
	authorization?: string;
	broker?: string;
};

export type Account = {
	key: string; // The account key for API usage (`ACC_XXX-YYYYYY`)
	name: string; // The name listed on the account
	number: string; // The account number (`YYYYYY`)
};
