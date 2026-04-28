# AI.MD

## AI Tools Used
I used ChatGPT as a support tool during development.

## How I Used AI
I mainly used ChatGPT as a guidance and troubleshooting assistant, not as a full code generator. I first designed and implemented the core functionality myself (number-to-words conversion, API endpoints, and frontend interaction). Then I used ChatGPT to get ideas for UI design patterns, validate my project structure, debug API issues, and improve clarity in UI text.

## What AI Helped With vs What I Built Myself

### AI Assisted:
- Suggested UI/UX improvements (titles, button naming, layout clarity)
- Helped debug API issues (server not running, test skipping)
- Guided on running server and tests correctly
- Provided suggestions for improving readability and structure

### I Implemented Myself:
- Backend server (server.js) with API endpoints (/api/submit, /api/sort, /api/health)
- Input validation and error handling
- Number-to-words conversion logic using BigInt
- Frontend logic (API calls, rendering, sorting)
- Test setup (unit tests and API tests)

## Example of Reviewing / Correcting AI Output
When API tests were skipped with “server not reachable”, ChatGPT suggested checking if the server was running. I verified this and ensured the server was correctly running on port 3000 and endpoints matched. I also identified and fixed a file naming mismatch (numbertoword.js vs numberToWords.js) myself to resolve import issues.

## Summary
I used AI as a supporting tool for guidance, debugging, and refinement, while all core implementation and design decisions were done by me. I reviewed and validated all AI suggestions before applying them.
