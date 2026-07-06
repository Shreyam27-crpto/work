# Staywise Hotels

A responsive hotel discovery interface built against the provided Demo Hotels API.

## API integration

- Documentation: https://demohotelsapi.pythonanywhere.com/
- Endpoint: https://demohotelsapi.pythonanywhere.com/hotels/
- Supported query features used in the app:
  - `search`
  - `location`
  - `min_price` / `max_price`
  - `min_rating` / `max_rating`
  - `order_by`
  - `limit` / `skip`

## Project structure

```text
.
├── index.html
├── src
│   ├── api.js
│   ├── app.js
│   └── styles.css
└── README.md
```

## Run locally

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Open `http://127.0.0.1:5173/`.
