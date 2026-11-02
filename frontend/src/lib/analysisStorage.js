const STORAGE_KEY = "hirelense:analysis:v1";

export function saveAnalysis(payload) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...payload, savedAt: Date.now() })
        );
    } catch (err) {
        console.warn("Could not save analysis to localStorage:", err);
    }
}

export function loadAnalysis() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearAnalysis() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}