# Sugar Smart Workplace Study · trilingual PWA

An installable, responsive five-section baseline questionnaire based on the three photographed paper pages (November 2026), with **English, Sinhala, and Tamil** language selection. No participant account or password.

## Deliverables
- `public/`: static PWA with language switcher, 5 sections, accessible response controls, offline shell, local draft saving, and confirmed submission success.
- `netlify/functions/submit.mjs`: passwordless public submission API that validates answers and securely relays to Google Apps Script, with a basic IP rate limit.
- `google/Code.gs`: Google Apps Script writing one row per respondent into a **private Google Sheet**, with column headers, duplicate suppression, and a script lock.
- `netlify.toml`: publish and serverless functions configuration.

## Google backend setup (must be completed by a Google account owner)
1. Create or use the Google Sheet for responses. Keep the **sheet private** and owned by the investigator; **do not** set `Anyone with link` for the Sheet.
2. Open [script.google.com](https://script.google.com), select **New project**, paste the contents of `google/Code.gs`.
3. In **Project Settings → Script Properties**, add `SHEET_ID` = spreadsheet ID from the Sheet URL (not the whole URL); add `GOOGLE_SCRIPT_SECRET` = a long, random shared secret (at least 32 characters). Never commit this value to GitHub.
4. In the Apps Script editor, run `setupHeaders()` once and authorize Google Sheets access, verifying `Responses` is created.
5. Select **Deploy → New deployment → Web app**; **Execute as: Me**, **Who has access: Anyone**; deploy and copy the `/exec` URL. This URL is not a Sheet URL.
6. In Netlify project **Environment variables**, add `GOOGLE_APPS_SCRIPT_URL` = Web App `/exec` URL and `GOOGLE_SCRIPT_SECRET` = exact same secret, with **Functions** scope. Redeploy after setting variables.
7. Make a **test submission** using non-identifying dummy data, confirm the app says successful, verify a single row appeared in `Responses`, and delete the test row before field use.

## Netlify deployment
- Fast path: upload project ZIP or connect a clean GitHub repository to Netlify. If using a GitHub branch of an existing repository, set **Base directory** to `sugar-smart-workplace` (if files are in that subfolder); the `netlify.toml` inside that folder specifies `public` and `netlify/functions`.
- To deploy locally with CLI: `npx netlify-cli deploy --prod` from the project root, after connecting it to your Netlify site.
- The site must be **public** with no visitor password / SSO. The Google Sheet itself remains private.

## Research questionnaire fidelity and data conventions
- All **five sections (A–E)** and the source answer options are retained. Section B has **nine purchase items**, Section C has **eleven consumption items**.
- Original paper questionnaire numbers 16 twice in Section D. The app distinguishes **16a** (knowledge of alternatives) and **16b** (availability of alternatives), without dropping either statement.
- One submission equals one spreadsheet row. Values are stored as language-independent codes, e.g. `days34`, `yes`, or `3`, so language does not alter analysis. Multiple-response fields are joined with ` | `.
- Participant ID, study dates/times, institution, and interviewer are optional to support self-administration. The questionnaire's substantive items are required, except Q28 app-function preferences.
- Q9 is skipped if Q8 = 0 cups; Q12 is shown only if Q11 = Yes. Both cases are blank in the saved row.
- Q13's options and the sugar-NCD risk wording in Q15 reproduce the provided research instrument rather than independently defining dietary recommendations. **Review these for scientific validity before deployment.**
- A qualified Sinhala/Tamil reviewer should independently check and pilot the translations, particularly meaning/response comparability, before collecting research data.
- No name, email, GPS, or device ID is requested. The draft is saved in browser localStorage until successful submission; users should clear the draft on shared devices. Browser IPs may still appear in Netlify operational logs; the app does not save IP to the research spreadsheet.
- Public, unauthenticated forms are susceptible to spam and are not a replacement for ethical approval, information sheets, and an investigator-managed response plan.

## Privacy and risk controls
The **participant form has no password** as requested. The backend is protected from direct append abuse by a server-side shared secret and Netlify throttling. The code does not expose spreadsheet IDs or Google credentials in the browser. Do not publish participant responses or personally identifying text. Provide study information and appropriate consent procedures before launching data collection.
