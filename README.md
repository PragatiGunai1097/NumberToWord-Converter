# Number to Words Sorter

A small JavaScript application with a  **Node.js / Express** backend.
You enter a comma-separated list of whole numbers, click **Submit Input** to
validate them, and then click **Sort Text** to display them sorted
alphabetically by their spelled-out form.

---

## How to run the project

You need **Node.js 18 or newer** installed (check with `node -v`).
**There are no third-party dependencies — you do not need to run `npm install`.**

### 1. Open a terminal in the project folder

cd NumberToWords

### 2. Start the server

npm start

or, equivalently:

node server/server.js

You should see:

Number to Words server running at http://localhost:3000

### 3. Open the app in your browser

Go to **http://localhost:3000**

That's it.

> Want a different port? Run `PORT=4000 npm start` or
> `set PORT=4000 && npm start` (Windows cmd).

To stop the server, press **Ctrl + C** in the terminal.

---

## How to use the app

1. Type whole numbers separated by commas, e.g. `1, 2, 3, 11, 8999, 16`.
2. Click **Submit Input** — the numbers are validated by the backend and
   listed in the order you entered them. If the input is invalid, you see a
   friendly message with an example, and nothing breaks.
3. Click **Sort Text** — the list re-renders sorted alphabetically by the
   spelled-out form (e.g. *Eight Thousand Nine Hundred Ninety Nine* comes
   before *Eleven*).
4. Any number greater than **9000** is replaced with an "It's Over 9000!"
   badge. **Hover** the badge to see a large styled tooltip with the
   spelled-out words (this is what lets large numbers like
   `9000022324` reveal *Nine Billion Twenty Two Thousand Three Hundred
   Twenty Four* clearly).
5. **Negative** numbers are accepted (e.g. `-42`) and prefixed with the word
   "Negative" in the output, both for display and for sorting.

---

## Project structure

NumberToWords/
├── package.json           # just `npm start`
├── README.md              # this file README file
├── server/
│   ├── server.js          # Zero-dep Node http server + /api/submit, /api/sort
│   └── numberToWords.js   # Number → words conversion (BigInt-safe)
└── public/                # Static frontend served by the Node server
│    ├── index.html
│    ├── css/style.css
│    └── js/main.js
└── tests/
    └── run-tests.js        # tests file

## API

### `POST /api/submit`

Validates the input. Returns `200 OK` either way (so invalid input never
fails the request) with a body indicating success or the validation error.

Request:

```json
{ "input": "1,2,3,11,8999,16" }
```

Response (success):

```json
{
    "ok": true,
    "count": 6,
    "results": [
        { "number": "1",    "words": "One",    "isOver9000": false },
        { "number": "2",    "words": "Two",    "isOver9000": false },
        { "number": "8999", "words": "Eight Thousand Nine Hundred Ninety Nine", "isOver9000": false }
    ]
}
```

Response (invalid):

```json
{
    "ok": false,
    "error": "\"foo\" is not a valid whole number.",
    "example": "1, 2, 3, 11, 8999, 16",
    "hint": "Enter whole numbers separated by commas. Negative numbers are allowed (e.g. -5)."
}
```

### `POST /api/sort`

Same input/response shape as `/api/submit`, but `results` is sorted
alphabetically by the `words` field using
`localeCompare(b, 'en', { sensitivity: 'base' })`.

### `GET /api/health`

Simple health-check endpoint that returns `{ "ok": true, "service": "number-to-words" }`.


## 🧪 Testing Steps

### 1. Start the Server

node server/server.js

Server runs at: http://localhost:3000

### 2. Test in Browser

Open:

http://localhost:3000

* Enter numbers (e.g., `1, 2, 3, 11`)
* Click **Convert** and **Sort**

---

### 3. Run Automated Tests

Open a new terminal (keep server running):

```bash
node tests/run-tests.js
```

---

### 4. Troubleshooting

* If tests say **server not reachable** → start the server first
* Check file names (case-sensitive)
