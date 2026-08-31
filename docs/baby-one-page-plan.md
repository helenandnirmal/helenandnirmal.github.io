# BabyOnePage Implementation Plan

## 1. Goal

Add a `BabyOnePage` RSVP experience for the Baptism of Francis Noel Benann. The page will initially contain one tab, `Baptism`, and will allow an invitee to validate their invitation, review event details, submit Accept or Decline responses for each member of their invite group, and persist those responses to a Google Sheet.

The existing wedding homepage must remain available and unchanged in behavior.

## 2. Page Access and Routing

- Add a `BabyOnePage` route using the existing `react-router-dom` dependency.
- Use hash-based routing so the page works when hosted as a static GitHub Pages site.
- Proposed URL:

  ```text
  /francisnoel
  ```

- Preserve the current homepage route as the default route.
- Add a navigation link only if the existing site navigation requires one; otherwise the page can be accessed directly through its route.

## 3. BabyOnePage UI

Create:

- `src/pages/BabyOnePage/BabyOnePage.jsx`
- `src/pages/BabyOnePage/BabyOnePage.css`

The page should contain:

1. A tab bar at the top.
   - Render one tab labeled `Baptism`.
   - Structure it so additional event tabs can be added later.

2. Event heading:
   - `Baptism of Francis Noel Benann`

3. Invite lookup form:
   - Label and input for `Enter your First Name`.
   - Label and password-type input for `Enter the passcode you were given`.
   - Lookup button.
   - Validation error text:

     ```text
     Trouble finding the invite! Please contact Helen and Nirmal
     ```

4. Successful lookup state:
   - Make the first name and passcode controls read-only or disabled.
   - Keep the validated invite visible.
   - Display the RSVP form directly below the lookup form.

5. Baptism event box:
   - Church: `St. Elizabeth Ann Seton Catholic Church`
   - Address: `2316 180th St SE, Bothell, WA 98012`
   - Time: `11am`
   - List every person in the authenticated invite group.
   - Show `Accept` and `Decline` radio buttons for each person.

6. Lunch Reception event box:
  - Address: `The Villas at Beardslee, 19121 112th Ave NE, Bothell, WA 98011`
  - Time: `1pm`
  - Parking: Street parking is available, as well as parking next to the nearby retail shops.
  - Entry instructions: Enter code `920257` after pressing the Delivery button on the intercom to access the building and proceed to the 3rd floor.
   - List the same people.
   - Show `Accept` and `Decline` radio buttons for each person.

7. Submit button:
   - Submit both RSVP values for every returned member.
   - Prevent duplicate submissions while the request is in progress.
   - Display a success message after a successful write.
   - Display a recoverable error message if the write fails.

## 4. Google Sheet Schema

The sheet should use these columns:

```text
ID (numeric) | Name | Group | Passcode | Baptism RSVP | Reception RSVP | Email
```

Example:

```text
ID | Name   | Group | Passcode | Baptism RSVP | Reception RSVP | Email
1  | Ben    | BC    | XXXX     |              |                |
2  | Car    | BC    | XXXX     |              |                |
3  | Ja     | JSJ   | XXXX     |              |                |
4  | Snehan | JSJ   | XXXX     |              |                |
5  | Josh   | JSJ   | XXXX     |              |                |
```

### Column rules

- `ID` is a unique numeric value per row and must remain stable.
- `Name` is matched using a case-insensitive, trimmed contains check with `Passcode` for initial invite validation.
- `Group` associates multiple people with the same invitation.
- `Passcode` validates the invite. It should not be returned to the browser.
- `Baptism RSVP` stores numeric `1` for Accept or `0` for Decline.
- `Reception RSVP` stores numeric `1` for Accept or `0` for Decline.
- `Email` stores the email address used for the invitation, when available.

The ID is required in API responses and submissions so updates target exact rows even when names repeat or are edited later.

## 5. API Configuration

Because the website is hosted as a static GitHub Pages site, Google service-account credentials must not be placed in React or committed to the repository.

Expose only the deployed Apps Script web-app URL to the frontend through a Vite environment variable:

```text
VITE_INVITE_API_URL=https://script.google.com/macros/s/AKfycbyZMRAjJe1BixBFIQ4rD7aQf-Oq2JrvbWSn5qyKrG4cIvf543d3Mv6NOoj7e3mPjMgS/exec
```

Use a local `.env` file for development and configure the same variable in the deployment environment. Do not commit secrets or private passcodes.

## 6. Apps Script API Contract

The Apps Script web app should expose `doGet(e)` and `doPost(e)`.

### 6.1 GET invite lookup

Request:

```http
GET {API_URL}?name=Ben&passcode=XXXX
```

Inputs:

- `name`: invitee’s first name.
- `passcode`: passcode entered by the invitee.

Processing:

1. Read the header row and resolve column indexes by header name rather than relying only on hard-coded column numbers.
2. Find the first row whose normalized `Name` contains the submitted normalized name. Matching trims whitespace and ignores letter case.
3. Verify that the submitted passcode matches the row’s `Passcode`.
4. If validation fails, return an invalid-invite response.
5. Read the validated row’s `Group`.
6. Return every sheet row with that same `Group`.
7. Return each member’s `ID`, `Name`, and existing RSVP values.
8. Never return the passcode.

Success response:

```json
{
  "success": true,
  "group": "BC",
  "people": [
    {
      "id": 1,
      "name": "Ben",
      "baptismRsvp": null,
      "receptionRsvp": null
    },
    {
      "id": 2,
      "name": "Car",
      "baptismRsvp": null,
      "receptionRsvp": null
    }
  ]
}
```

Invalid invite response:

```json
{
  "success": false,
  "error": "INVALID_INVITE"
}
```

Recommended HTTP status behavior:

- `200` for a valid lookup.
- `401` for an invalid name/passcode pair.
- `400` for missing parameters.
- `500` for an unexpected sheet or Apps Script error.

The frontend should show the requested user-facing error for both invalid credentials and lookup failures without revealing which field was incorrect.

### 6.1.1 Email invite details

Request:

```http
POST {API_URL}
Content-Type: text/plain;charset=utf-8
```

Body:

```json
{
  "action": "emailDetails",
  "name": "Ben",
  "passcode": "XXXX",
  "email": "guest@example.com"
}
```

The Apps Script must revalidate `name + passcode` before sending. It should send the event details for both November 28, 2026 events in an HTML email and attach one `.ics` file containing both events. The Apps Script project must be authorized for the `script.send_mail` scope. It returns:

```json
{
  "success": true,
  "message": "Email sent"
}
```

The HTML email uses simple inline HTML without the website background image. Invalid email input returns `INVALID_EMAIL`; an invalid invite returns `INVALID_INVITE`.

### 6.1.2 Calendar download

`Add to my Calendar` is handled entirely in the browser. It downloads one `.ics` file containing two `VEVENT` entries:

- Baptism: November 28, 2026, 11:00 AM to 12:00 PM Pacific Time.
- Lunch Reception: November 28, 2026, 1:00 PM to 3:00 PM Pacific Time.

Use explicit UTC timestamps in the `.ics` file to avoid calendar-client timezone interpretation issues: Baptism is `20261128T190000Z` to `20261128T200000Z`, and the reception is `20261128T210000Z` to `20261128T230000Z`. These represent 11:00 AM and 1:00 PM Pacific Time on November 28, 2026, when Pacific Time is UTC-8. No backend request is needed for this action.

### 6.2 POST RSVP submission

Request:

```http
POST {API_URL}
Content-Type: application/json
```

Body:

```json
{
  "action": "saveRsvp",
  "name": "Ben",
  "passcode": "XXXX",
  "responses": [
    {
      "id": 1,
      "baptismRsvp": true,
      "receptionRsvp": false
    },
    {
      "id": 2,
      "baptismRsvp": true,
      "receptionRsvp": true
    }
  ]
}
```

Use `action: "saveRsvp"` for RSVP updates. The Apps Script may treat a missing action as `saveRsvp` for backward compatibility.

Processing:

1. Parse the JSON body.
2. Validate that `name`, `passcode`, and `responses` are present.
3. Re-validate `name + passcode` against the sheet. Do not trust the earlier GET request or client state.
4. Resolve the authenticated group from the validated name.
5. Ensure every submitted ID belongs to that group.
6. Validate every RSVP value as a number: `1` for Accept or `0` for Decline.
7. Update `Baptism RSVP` and `Reception RSVP` by matching `ID`, never by array position or name alone.
8. Return success only after all requested rows have been updated.

Success response:

```json
{
  "success": true,
  "message": "RSVP saved"
}
```

Invalid or unauthorized submission:

```json
{
  "success": false,
  "error": "INVALID_INVITE"
}
```

Invalid RSVP payload:

```json
{
  "success": false,
  "error": "INVALID_RSVP"
}
```

Sheet write failure:

```json
{
  "success": false,
  "error": "RSVP_NOT_SAVED"
}
```

## 6.3 Apps Script implementation

Add the following code to the Google Sheet under **Extensions -> Apps Script**. Replace `SHEET_TAB_NAME` with the exact name of the worksheet tab containing the RSVP data.

```javascript
const SPREADSHEET_ID = '14OXqE_PxJHx2rHt7YLuPqFxlzoxLpnaIFRNA5-L5N-Y';
const SHEET_TAB_NAME = 'Baptism';

const REQUIRED_HEADERS = [
  'ID',
  'Name',
  'Group',
  'Passcode',
  'Baptism RSVP',
  'Reception RSVP',
  'Email'
];

function doGet(e) {
  try {
    const name = normalize(e.parameter.name);
    const passcode = normalize(e.parameter.passcode);

    if (!name || !passcode) {
      return json({ success: false, error: 'INVALID_INVITE' });
    }

    const sheetData = readSheet();
    const inviteRow = sheetData.rows.find(
      row =>
        normalize(row.Name).includes(name) &&
        normalize(row.Passcode) === passcode,
    );

    if (!inviteRow) {
      return json({ success: false, error: 'INVALID_INVITE' });
    }

    const people = sheetData.rows
      .filter(row => normalize(row.Group) === normalize(inviteRow.Group))
      .map(row => ({
        id: Number(row.ID),
        name: row.Name,
        baptismRsvp: getRsvpValue(row['Baptism RSVP']),
        receptionRsvp: getRsvpValue(row['Reception RSVP']),
      }));

    return json({
      success: true,
      group: inviteRow.Group,
      people,
    });
  } catch (error) {
    console.error(error);
    return errorResponse('SERVER_ERROR', error);
  }
}

function doPost(e) {
  let request;

  try {
    request = JSON.parse(e.postData.contents);
    const name = normalize(request.name);
    const passcode = normalize(request.passcode);

    if (request.action === 'emailDetails') {
      return sendInviteEmail(name, passcode, request.email);
    }

    const responses = request.responses;

    if (!name || !passcode || !Array.isArray(responses) || responses.length === 0) {
      return json({ success: false, error: 'INVALID_RSVP' });
    }

    const sheetData = readSheet();
    const inviteRow = sheetData.rows.find(
      row =>
        normalize(row.Name).includes(name) &&
        normalize(row.Passcode) === passcode,
    );

    if (!inviteRow) {
      return json({ success: false, error: 'INVALID_INVITE' });
    }

    const group = normalize(inviteRow.Group);
    const groupIds = new Set(
      sheetData.rows
        .filter(row => normalize(row.Group) === group)
        .map(row => String(row.ID)),
    );

    for (const response of responses) {
      if (
        !groupIds.has(String(response.id)) ||
        !isValidRsvp(response.baptismRsvp) ||
        !isValidRsvp(response.receptionRsvp)
      ) {
        return json({ success: false, error: 'INVALID_RSVP' });
      }
    }

    for (const response of responses) {
      const matchingRow = sheetData.rows.find(
        row => String(row.ID) === String(response.id),
      );

      sheetData.sheet
        .getRange(matchingRow.rowNumber, sheetData.columns['Baptism RSVP'] + 1)
        .setValue(response.baptismRsvp);

      sheetData.sheet
        .getRange(matchingRow.rowNumber, sheetData.columns['Reception RSVP'] + 1)
        .setValue(response.receptionRsvp);
    }

    return json({ success: true, message: 'RSVP saved' });
  } catch (error) {
    console.error(error);
    return errorResponse(
      request && request.action === 'emailDetails'
        ? 'EMAIL_NOT_SENT'
        : 'RSVP_NOT_SAVED',
      error,
    );
  }
}

function readSheet() {
  const sheet = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName(SHEET_TAB_NAME);

  if (!sheet) {
    throw new Error(`Sheet tab not found: ${SHEET_TAB_NAME}`);
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    throw new Error('The sheet has no data rows');
  }

  const headers = values[0].map(header => String(header).trim());
  const columns = {};

  REQUIRED_HEADERS.forEach(header => {
    const columnIndex = headers.indexOf(header);

    if (columnIndex === -1) {
      throw new Error(`Missing required column: ${header}`);
    }

    columns[header] = columnIndex;
  });

  const rows = values.slice(1).map((rowValues, index) => {
    const row = { rowNumber: index + 2 };

    headers.forEach((header, columnIndex) => {
      row[header] = rowValues[columnIndex];
    });

    return row;
  });

  return { sheet, columns, rows };
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidRsvp(value) {
  return value === 0 || value === 1;
}

function getRsvpValue(value) {
  return value === '' ? null : Number(value);
}

function sendInviteEmail(name, passcode, email) {
  if (!name || !passcode || !isValidEmail(email)) {
    return json({ success: false, error: 'INVALID_EMAIL' });
  }

  const sheetData = readSheet();
  const inviteRow = sheetData.rows.find(
    row =>
      normalize(row.Name).includes(name) &&
      normalize(row.Passcode) === passcode,
  );

  if (!inviteRow) {
    return json({ success: false, error: 'INVALID_INVITE' });
  }

  const people = sheetData.rows
    .filter(row => normalize(row.Group) === normalize(inviteRow.Group))
    .map(row => row.Name)
    .join(', ');

  const subject = 'Baptism of Francis Noel Benann';
  const plainText = [
    'Baptism of Francis Noel Benann',
    '',
    `Guests: ${people}`,
    '',
    'Baptism Ceremony on November 28, 2026 at 11:00 AM Pacific Time',
    'St. Elizabeth Ann Seton Catholic Church',
    '2316 180th St SE, Bothell, WA 98012',
    '',
    'Lunch Reception on November 28, 2026 at 1:00 PM Pacific Time',
    'The Villas at Beardslee, 19121 112th Ave NE, Bothell, WA 98011',
    'Street parking is available, as well as parking next to the nearby retail shops.',
    'Enter code 920257 after pressing the Delivery button on the intercom to access the building and proceed to the 3rd floor.',
    '',
    'With love, we kindly request no gifts. Your presence and blessings are what matter most to us.',
  ].join('\n');

  try {
    MailApp.sendEmail({
      to: email.trim(),
      subject,
      body: plainText,
      htmlBody: createInviteEmailHtml(people),
      attachments: [
        createCalendarAttachment(),
      ],
    });
  } catch (error) {
    console.error(error);
    return errorResponse('EMAIL_NOT_SENT', error);
  }

  try {
    sheetData.sheet
      .getRange(inviteRow.rowNumber, sheetData.columns.Email + 1)
      .setValue(email.trim());
  } catch (error) {
    console.error(error);
    return errorResponse('EMAIL_NOT_SAVED', error);
  }

  return json({ success: true, message: 'Email sent' });
}

function isValidEmail(email) {
  return typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function createInviteEmailHtml(people) {
  return `
    <div style="background-color:#f7f5ef;background-size:cover;padding:32px 16px;color:#26564c;font-family:Georgia,serif;">
      <div style="background:#ffffff;max-width:600px;margin:0 auto;padding:28px;border:1px solid #d8d8d0;">
        <p style="color:#b91f1c;text-transform:uppercase;letter-spacing:1px;font-size:20px;">You are invited to celebrate the</p>
        <h1 style="font-size:28px;margin:0 0 20px;">Baptism of Francis Noel Benann</h1>
        <p style="font-size:18px;"><strong>Guests:</strong> ${escapeHtml(people)}</p>
        <h2 style="font-size:20px;">Baptism Ceremony on November 28, 2026 at 11:00 AM Pacific Time</h2>
        <p style="font-size:18px;">St. Elizabeth Ann Seton Catholic Church<br>2316 180th St SE, Bothell, WA 98012</p>
        <h2 style="font-size:20px;">Lunch Reception on November 28, 2026 at 1:00 PM Pacific Time</h2>
        <p style="font-size:18px;">
          <a href="https://www.google.com/maps/search/?api=1&query=47.766139,-122.192722" style="color:#26564c;">
            The Villas at Beardslee, 19121 112th Ave NE, Bothell, WA 98011
          </a><br>
          Street parking is available, as well as parking next to the nearby retail shops.<br>
          Enter code 920257 after pressing the Delivery button on the intercom to access the building and proceed to the 3rd floor.
        </p>
        <p style="font-size:18px;font-style:italic;">With love, we kindly request no gifts. Your presence and blessings are what matter most to us.</p>
      </div>
    </div>`;
}

function createCalendarAttachment() {
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Helen and Nirmal//Francis Noel Baptism//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:francis-noel-baptism-20261128@helenandnirmal.github.io',
    `DTSTAMP:${getCalendarTimestamp()}`,
    'DTSTART:20261128T190000Z',
    'DTEND:20261128T200000Z',
    'SUMMARY:Baptism of Francis Noel Benann',
    'LOCATION:St. Elizabeth Ann Seton Catholic Church\\, 2316 180th St SE\\, Bothell\\, WA 98012',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:francis-noel-reception-20261128@helenandnirmal.github.io',
    `DTSTAMP:${getCalendarTimestamp()}`,
    'DTSTART:20261128T210000Z',
    'DTEND:20261128T230000Z',
    'SUMMARY:Lunch Reception for Baptism of Francis Noel Benann',
    'LOCATION:47.766139,-122.192722',
    'DESCRIPTION:Street parking is available\\, as well as parking next to the nearby retail shops. Enter code 920257 after pressing the Delivery button on the intercom to access the building and proceed to the 3rd floor.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return Utilities.newBlob(
    calendar,
    'text/calendar',
    'francis-noel-benann-baptism.ics',
  );
}

function getCalendarTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function errorResponse(errorCode, error) {
  return json({
    success: false,
    error: errorCode,
    message: error && error.message ? error.message : String(error),
  });
}

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy the Apps Script as a **Web app**, set **Execute as** to `Me`, and set **Who has access** to `Anyone`. The frontend should use the API URL documented in Section 5.

## 7. Frontend State Model

The React page should track:

- Active tab, initially `baptism`.
- First name input.
- Passcode input.
- Lookup status: idle, loading, success, or error.
- Authenticated group.
- Returned people, including their IDs and existing RSVP values.
- RSVP selections keyed by member ID.
- Submission status: idle, submitting, success, or error.

Use the returned numeric IDs as the keys for RSVP state and React list rendering.

When initializing RSVP state:

- Preserve existing values returned by the sheet when present.
- Require a valid Accept or Decline selection before allowing submission, unless the product decision explicitly allows blank responses.

## 8. Error and Loading Behavior

- Disable the lookup button while the lookup request is pending.
- Show the exact requested message after an invalid lookup:

  ```text
  Trouble finding the invite! Please contact Helen and Nirmal
  ```

- Avoid indicating whether the name or passcode was wrong.
- Keep lookup inputs editable after an error so the invitee can retry.
- Disable all RSVP controls and the submit button while saving.
- Show a clear success state after the backend confirms the update.
- Keep the RSVP form available after a failed save so the invitee can retry.
- Handle malformed or unavailable API responses as recoverable errors.

## 9. Security and Data Handling

- Never expose Google credentials, Apps Script secrets, or sheet access tokens in frontend code.
- Do not return passcodes from the GET endpoint.
- Re-authenticate every POST request using name and passcode.
- Confirm submitted IDs belong to the authenticated group.
- Validate all request fields server-side.
- Consider rate limiting or a simple abuse mitigation strategy for the public Apps Script endpoint.
- Avoid logging passcodes or full personal data in Apps Script logs.
- Restrict the Google Sheet’s sharing permissions; the Apps Script should be the write interface.

## 10. Suggested File Changes

Frontend files:

- `src/App.jsx`: add route configuration for `/francisnoel`.
- `src/pages/BabyOnePage/BabyOnePage.jsx`: page state, forms, API calls, and RSVP rendering.
- `src/pages/BabyOnePage/BabyOnePage.css`: page-specific responsive styles.
- `.env.example`: document `VITE_INVITE_API_URL` without including a real URL or secret.

Backend/documentation files:

- `docs/baby-one-page-plan.md`: this implementation plan and API contract.
- Optional separate Apps Script project: `Code.gs` containing `doGet`, `doPost`, validation, and sheet update logic.

Do not put Apps Script server code in the Vite frontend bundle.

## 11. Implementation Order

1. Confirm the exact Google Sheet tab name and headers.
2. Confirm every row has a stable, unique ID.
3. Deploy and manually test the Apps Script GET endpoint.
4. Deploy and manually test the Apps Script POST endpoint with a test sheet or test rows.
5. Add the React route and page shell.
6. Implement lookup validation and group-member rendering.
7. Implement the two RSVP event boxes and ID-keyed radio state.
8. Implement submission, loading, success, and error states.
9. Add responsive styling consistent with the existing site.
10. Add the API URL environment configuration.
11. Run lint and production build checks.
12. Test the complete flow in a browser on desktop and mobile.

## 12. Acceptance Checklist

- [ ] Existing homepage still renders.
- [ ] `/francisnoel` opens `BabyOnePage`.
- [ ] The page displays the Baptism tab and event heading.
- [ ] First name and passcode fields are present.
- [ ] Invalid credentials show the exact requested error.
- [ ] Valid credentials return all members in the matching group.
- [ ] Every returned member includes its unique numeric ID.
- [ ] Lookup inputs become read-only after success.
- [ ] Baptism details are correct.
- [ ] Lunch Reception details are correct.
- [ ] Each person has Accept and Decline controls for both events.
- [ ] RSVP state is keyed by unique ID.
- [ ] POST re-validates the name and passcode.
- [ ] POST verifies that IDs belong to the authenticated group.
- [ ] POST updates both RSVP columns by ID.
- [ ] Successful submission displays confirmation.
- [ ] Failed submission remains retryable.
- [ ] No Google credentials are present in frontend code.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Desktop and mobile layouts are usable.
