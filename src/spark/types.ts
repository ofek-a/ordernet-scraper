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

export type SparkHolding = {
	_t: "RMType";
	_k: string;
	Sug: string;
	ID: string;
	BNO: number;
	SUG_RC: number;
	Tik: string;
	Branch: string;
	ID_NAME: string;
	BS_BNO: string;
	SYMBOL_NAM: string;
	BNO_NAME: string;
	SUG_ID: string;
	SUG_BNO: string;
	LAST_OP: string;
	mm: "הפקדה" | "קניה";
	LAST_DT: string;
	STRT_DT: number;
	END_DT: number;
	AV_TERM: string;
	MDR: string;
	MANPIK: string;
	MNG_REP: string;
	DERIV_COD: string;
	SORT: string;
	SH: string;
	SUG_PR: string;
	PRC: number;
	PRC_CHNG: string;
	SUG_CUR: string;
	PR_MATACH: string;
	HON_RASHUM: number;
	NV: number;
	COST: number;
	VL: number;
	EXT_MARGIN: number;
	REQ_MARGIN: number;
	SUM1: number;
	SUM2: number;
	ID_PCNT: number;
	TK_PCNT: number;
	LVL1: string;
	LVL2: string;
	LVL3: string;
	LVL4: string;
	LVL5: string;
	LVL6: string;
	MANG_COD: string;
	BANK: string;
	BNK_BRANCH: string;
	ID_BANK: string;
	MDL: string;
	BLC: string;
	BLC_NEG: string;
	BGT: string;
	SIVUG: string;
	INTRST_COD: string;
	PAY_MNG: string;
	FIL: string;
	IsNewStruct: boolean;
	BnoType: "FRGN" | "SH500";
	SugBno: "ForeignStockFrgn" | "StockShekel" | "KranotFrgn" | "MatachMezuman";
};
