import { AuthResult, RMType, StructAccountTransaction, RMTotalType, SecuritiesData, SecuritiesTotalType, ChartPoint } from "./response-maps";

const RESPONSE_TYPES = {
	AuthResult: AuthResult,
	StructAccountTransaction: StructAccountTransaction,
	RMType: RMType,
	RMTotalType: RMTotalType,
	SecuritiesData: SecuritiesData,
	SecuritiesTotalType: SecuritiesTotalType,
	ChartPoint: ChartPoint,
};

export function convertKeys(data) {
	const responseType = data._t as keyof typeof RESPONSE_TYPES;
	const keysMap = RESPONSE_TYPES[responseType] || {};

	const res = Object.keys(data).reduce((acc, curKey) => {
		const newKey = (keysMap[curKey] as string) || curKey;
		acc[newKey] = data[curKey];
		return acc;
	}, {});

	return res;
}
