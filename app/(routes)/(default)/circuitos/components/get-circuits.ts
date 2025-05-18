import type { Circuit } from "./types";

const URL = "api/circuits";

export const getCircuits = async (): Promise<Circuit[]> => {
    const res = await fetch(`${URL}`);
    const data = await res.json();

    return data.data;
}
