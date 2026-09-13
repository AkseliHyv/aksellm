export function applyTheme(theme: string | undefined) {
    if (theme) {
        document.documentElement.dataset.theme = theme.toLowerCase().replace(/\s+/g, "-");
    } else {
        delete document.documentElement.dataset.theme;
    }
}
