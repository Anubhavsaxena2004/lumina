# WhatsApp Message Templates for Meta Business Approval

The WhatsApp Business Cloud API requires pre-approved HSM (Highly Structured Message) templates for business-initiated conversations outside the 24-hour customer window.

Below are the 4 official templates required for **Kumkum Payal** with exact Meta Graph API creation payloads, variables, and bilingual fallback texts.

---

### 1. Template: `owner_entry_alert`
- **Category:** `UTILITY`
- **Language:** English (`en_IN` / `en`)
- **Recipient:** Business Owner
- **Header:** None
- **Body Text:**
  ```text
  Kumkum Payal Alert: Staff {{1}} created a new {{2}} (Ref: {{3}}) for {{4}} with value {{5}} at {{6}}.
  ```
- **Bilingual Hindi/English Text (Alternative):**
  ```text
  Kumkum Payal Suchna: Staff {{1}} ne naya {{2}} (Ref: {{3}}) party {{4}} ke liye darj kiya. Rakam/Vajan: {{5}}, Samay: {{6}}.
  ```
- **Variable Mapping:**
  - `{{1}}` (`staff_name`): `Amit Verma`
  - `{{2}}` (`entry_type`): `Sale` / `Purchase` / `Polish Job Work` / `Receipt Voucher`
  - `{{3}}` (`bill_number`): `1001`
  - `{{4}}` (`party_name`): `Rajasthan Jewellers`
  - `{{5}}` (`amount_or_kg`): `₹1,84,000.00` or `1.250 Kg`
  - `{{6}}` (`entry_time`): `10:45 AM`
- **Meta API Submission Payload:**
  ```json
  {
    "name": "owner_entry_alert",
    "category": "UTILITY",
    "language": "en",
    "components": [
      {
        "type": "BODY",
        "text": "Kumkum Payal Alert: Staff {{1}} created a new {{2}} (Ref: {{3}}) for {{4}} with value {{5}} at {{6}}.",
        "example": {
          "body_text": [["Amit Verma", "Sale", "1001", "Rajasthan Jewellers", "₹1,84,000.00", "10:45 AM"]]
        }
      }
    ]
  }
  ```

---

### 2. Template: `bill_delivery`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Customer
- **Header:** `MEDIA` (Image - JPG Invoice)
- **Body Text:**
  ```text
  Namaste {{1}}, please find attached your Invoice #{{2}} from Kumkum Payal for {{3}}. Due date for payment is {{4}}. Thank you for your business.
  ```
- **Variable Mapping:**
  - `{{1}}` (`customer_name`): `Shree Jewellers`
  - `{{2}}` (`bill_number`): `1048`
  - `{{3}}` (`total_amount`): `₹84,200.00`
  - `{{4}}` (`due_date`): `05/10/2026`
- **Meta API Submission Payload:**
  ```json
  {
    "name": "bill_delivery",
    "category": "UTILITY",
    "language": "en",
    "components": [
      {
        "type": "HEADER",
        "format": "IMAGE",
        "example": {
          "header_handle": ["https://kumkum-payal.local/sample-invoice.jpg"]
        }
      },
      {
        "type": "BODY",
        "text": "Namaste {{1}}, please find attached your Invoice #{{2}} from Kumkum Payal for {{3}}. Due date for payment is {{4}}. Thank you for your business.",
        "example": {
          "body_text": [["Shree Jewellers", "1048", "₹84,200.00", "05/10/2026"]]
        }
      }
    ]
  }
  ```

---

### 3. Template: `customer_payment_reminder`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Customer
- **Header:** None
- **Body Text:**
  ```text
  Namaste {{1}}, gentle reminder from Kumkum Payal regarding Invoice #{{2}} with an outstanding balance of {{3}}, which was due on {{4}} ({{5}} days overdue). Kindly remit payment at your earliest convenience.
  ```
- **Variable Mapping:**
  - `{{1}}` (`customer_name`): `Kohinoor Exports`
  - `{{2}}` (`bill_number`): `1024`
  - `{{3}}` (`outstanding_amount`): `₹2,75,000.00`
  - `{{4}}` (`due_date`): `26/09/2026`
  - `{{5}}` (`days_overdue`): `5`
- **Meta API Submission Payload:**
  ```json
  {
    "name": "customer_payment_reminder",
    "category": "UTILITY",
    "language": "en",
    "components": [
      {
        "type": "BODY",
        "text": "Namaste {{1}}, gentle reminder from Kumkum Payal regarding Invoice #{{2}} with an outstanding balance of {{3}}, which was due on {{4}} ({{5}} days overdue). Kindly remit payment at your earliest convenience.",
        "example": {
          "body_text": [["Kohinoor Exports", "1024", "₹2,75,000.00", "26/09/2026", "5"]]
        }
      }
    ]
  }
  ```

---

### 4. Template: `owner_dues_summary`
- **Category:** `UTILITY`
- **Language:** English (`en`)
- **Recipient:** Business Owner
- **Header:** None
- **Body Text:**
  ```text
  Kumkum Payal Daily Summary for {{1}}: Total overdue receivables: {{2}} across {{3}} delinquent accounts. Top overdue: {{4}}.
  ```
- **Variable Mapping:**
  - `{{1}}` (`summary_date`): `01/10/2026`
  - `{{2}}` (`total_overdue_amount`): `₹14,25,000.00`
  - `{{3}}` (`overdue_bills_count`): `7`
  - `{{4}}` (`top_debtors_list`): `Rajasthan Jewellers (₹8.5L), Balaji Arts (₹3.2L)`
- **Meta API Submission Payload:**
  ```json
  {
    "name": "owner_dues_summary",
    "category": "UTILITY",
    "language": "en",
    "components": [
      {
        "type": "BODY",
        "text": "Kumkum Payal Daily Summary for {{1}}: Total overdue receivables: {{2}} across {{3}} delinquent accounts. Top overdue: {{4}}.",
        "example": {
          "body_text": [["01/10/2026", "₹14,25,000.00", "7", "Rajasthan Jewellers (₹8.5L), Balaji Arts (₹3.2L)"]]
        }
      }
    ]
  }
  ```
