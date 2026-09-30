# WhatsApp Message Templates for Meta Business Approval

The WhatsApp Business Cloud API requires pre-approved HSM (Highly Structured Message) templates for business-initiated conversations outside the 24-hour customer window.

The following 4 templates must be submitted to the Meta Business Manager:

---

### 1. Template: `owner_entry_alert`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Business Owner
- **Header:** None
- **Body Text:**
  ```text
  Kumkum Payal: New {{1}} entry recorded for {{2}} (Value: {{3}}). Stamped by {{4}} at {{5}}.
  ```
- **Variables Sample:**
  - `{{1}}`: `Sale`
  - `{{2}}`: `Rajasthan Jewellers`
  - `{{3}}`: `₹1,84,000`
  - `{{4}}`: `Amit Verma`
  - `{{5}}`: `10:45 AM`

---

### 2. Template: `bill_delivery`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Customer
- **Header:** `MEDIA` (Image / Document - JPG Invoice)
- **Body Text:**
  ```text
  Namaste {{1}}, please find attached your Invoice #{{2}} from Kumkum Payal for {{3}}. Due date for payment is {{4}}. Thank you for your continued trust.
  ```
- **Variables Sample:**
  - `{{1}}`: `Shree Jewellers`
  - `{{2}}`: `1048`
  - `{{3}}`: `₹84,200`
  - `{{4}}`: `05/10/2026`

---

### 3. Template: `customer_payment_reminder`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Customer
- **Header:** None
- **Body Text:**
  ```text
  Namaste {{1}}, gentle reminder from Kumkum Payal regarding Invoice #{{2}} for {{3}}, which was due on {{4}}. Kindly arrange the settlement at your earliest convenience.
  ```
- **Variables Sample:**
  - `{{1}}`: `Kohinoor Exports`
  - `{{2}}`: `1024`
  - `{{3}}`: `₹2,75,000`
  - `{{4}}`: `26/09/2026`

---

### 4. Template: `owner_dues_summary`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Business Owner
- **Header:** None
- **Body Text:**
  ```text
  Kumkum Payal Daily Summary: You have {{1}} pending overdue bills totaling {{2}} across {{3}} customers as of {{4}}. Check the owner dashboard for individual statements.
  ```
- **Variables Sample:**
  - `{{1}}`: `7`
  - `{{2}}`: `₹14,25,000`
  - `{{3}}`: `4`
  - `{{4}}`: `01/10/2026`
