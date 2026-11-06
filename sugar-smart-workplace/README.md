# Sugar Smart Workplace Study · trilingual PWA

An installable, responsive five-section baseline questionnaire based on the three photographed paper pages (November 2026), with **English, Sinhala, and Tamil** language selection. No participant account or password.

## Deliverables
- `public/`: static PWA with language switcher, 5 sections, accessible response controls, offline shell, local draft saving, and confirmed submission success.
- `netlify/functions/submit.mjs`: passwordless public submission API that validates answers and securely relays to Google Apps Script, with a basic IP rate limit.
- `google/Code.gs`: Google Apps Script writing one row per respondent into a **private Google Sheet**, with column headers, duplicate suppression, and a script lock.
- `netlify.toml`: publish and serverless functions configuration.

## Final launch steps (Google account owner must authorize these operations)
The Google Sheet was created and pre-filled with 62 data columns. The **Launch Setup** tab contains a private 64-character backend token in B2. Never publicly share the Sheet; participants need only the Netlify web URL.

### 1. Authorize the Google backend
1. Open your response Sheet: `https://docs.google.com/spreadsheets/d/1OOVOYn94q0aWTCYgvgvJ7gOMK9RXcq5IdAAk7EQ9W54/edit`.
2. Select **Extensions → Apps Script**. Delete the editor's sample code and paste the complete `google/Code.gs` from this repository (click **Raw** in GitHub to copy it). Save.
3. In the Apps Script function selector, choose **setupHeaders**, press **Run**, and grant Google's permissions. This reads the existing private `Launch Setup!B2` secret and saves the settings in the Script Properties automatically. No manual Script Properties are necessary.
4. Select **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Authorize if asked and click **Deploy**. Copy the `/exec` Web App URL. This is not the spreadsheet's URL.

### 2. Connect the existing Netlify project to GitHub
1. Open `https://app.netlify.com/projects/sugar-smart-workplace`, select the deploy/Git repository setup option, and connect your GitHub account if required.
2. Choose the existing public repository `senalfernando1984/hpb-launch` and the `sugar-smart-workplace-2026` branch.
3. Set the **Base directory** to `sugar-smart-workplace`; the `netlify.toml` in that directory sets the publish directory to `public` and the functions directory to `netlify/functions`.
4. Do not create a new site; connect this repository to the Netlify project already created for you, and publish.

### 3. Configure the two Netlify environment variables
In **Project configuration → Environment variables**, set these for **Functions**:
- `GOOGLE_APPS_SCRIPT_URL`: the deployed Apps Script **/exec** URL from step 1.
- `GOOGLE_SCRIPT_SECRET`: copy the complete value from **Launch Setup!B2** (the same Sheet used in step 1). Select *secret* when possible.

Apply the changes and **trigger a fresh production deploy**; Netlify functions receive the environment variables only when deployed with them. Never commit either environment value to public GitHub. Our connected Netlify API currently returns `403` on environment-variable writes, so this one configuration step must be performed in your dashboard.

### 4. Test before participant rollout
Make one fake test response with nonidentifying dummy data; check that the site displays **Thank you** with a submission reference, and that one row was added to the **Responses** tab of the private Google Sheet. Delete the test row afterwards. Confirm English, Sinhala and Tamil rendering and review translations with native speakers before formal data collection.

## Netlify deployment notes
Use the **existing Netlify project**, not a new one. The site was created without a visitor password. It still requires a GitHub source connection and an initial published deploy. Do not publish respondent data in GitHub or enable public Google Sheet sharing.

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