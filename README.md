# Lista zamówień

Lista kontrolna zamówień (Wojtek, Warzywa, Mięso, Perfect, Dodatki). Ilości i dodane pozycje zapisują się na serwerze Netlify i są wspólne dla wszystkich telefonów.

## Struktura

- `public/index.html` – cała aplikacja
- `netlify/functions/state.mjs` – serwer (zapis w Netlify Blobs, adres `/api/state`)
- `netlify.toml`, `package.json` – ustawienia wdrożenia

## Wdrożenie

1. Wgraj wszystkie pliki do repozytorium GitHub (zachowaj foldery).
2. Netlify → Add new site → Import an existing project → GitHub → wybierz repozytorium → Deploy.
3. Żadnych zmiennych środowiskowych nie trzeba.

Każdy, kto zna adres strony, może zmieniać listę.
