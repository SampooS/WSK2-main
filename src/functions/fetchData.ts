export default async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error("fetch error: " + response.statusText);
    }
    const json = await response.json();
    return json;
};