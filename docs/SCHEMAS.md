# SCHEMAS.md

## Overview
This project uses **JSON Schema Draft 2020-12** to validate all forms.  
Validation happens client-side (Wix Velo) before submission and server-side in the API.  
Shared definitions allow us to avoid repetitive input and enforce data integrity.

---

## Shared `$defs`
```json
{
  "USState": { "type": "string", "pattern": "^(A[EKLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[A]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$" },
  "Phone": { "type": "string", "pattern": "^\\+?1?[ .-]?\$begin:math:text$?\\\\d{3}\\$end:math:text$?[ .-]?\\d{3}[ .-]?\\d{4}$" },
  "Address": {
    "type": "object",
    "properties": {
      "line1": { "type": "string" },
      "city": { "type": "string" },
      "state": { "$ref": "#/$defs/USState" },
      "zip": { "type": "string", "pattern": "^\\d{5}(-\\d{4})?$" }
    },
    "required": ["line1", "city", "state", "zip"],
    "additionalProperties": false
  }
}

# Person Schema

{
  "type": "object",
  "required": ["role", "first_name", "last_name", "dob"],
  "properties": {
    "person_id": { "type": "string" },
    "role": {
      "type": "string",
      "enum": ["defendant","indemnitor","coindemnitor","spouse","parent","reference","attorney"]
    },
    "first_name": { "type": "string" },
    "middle_name": { "type": "string" },
    "last_name": { "type": "string" },
    "dob": { "type": "string", "format": "date" },
    "ssn": { "type": "string", "pattern": "^\\d{3}-?\\d{2}-?\\d{4}$" },
    "email": { "type": "string", "format": "email" },
    "phone_primary": { "$ref": "#/$defs/Phone" },
    "address": { "$ref": "#/$defs/Address" },
    "employer_name": { "type": "string" },
    "employer_address": { "$ref": "#/$defs/Address" },
    "employer_phone": { "$ref": "#/$defs/Phone" },
    "identifiers": {
      "type": "object",
      "properties": {
        "height": { "type": "string" },
        "weight_lb": { "type": "integer", "minimum": 0 },
        "eyes": { "type": "string" },
        "hair": { "type": "string" },
        "race": { "type": "string" },
        "handedness": { "type": "string", "enum": ["left", "right"] },
        "glasses": { "type": "boolean" },
        "dentures": { "type": "boolean" },
        "beard_mustache": { "type": "boolean" },
        "marks_tattoos": { "type": "string" }
      },
      "additionalProperties": false
    },
    "driver_license_number": { "type": "string" },
    "driver_license_state": { "$ref": "#/$defs/USState" },
    "social_media_handle": { "type": "string" }
  },
  "additionalProperties": false
}

# Case Schema

{
  "type": "object",
  "required": ["court_name", "county", "bond_amount"],
  "properties": {
    "case_number": { "type": "string" },
    "court_name": { "type": "string" },
    "county": { "type": "string", "enum": ["Lee","Charlotte","Collier"] },
    "charge_description": { "type": "string" },
    "bond_amount": { "type": "number", "minimum": 0 },
    "power_of_attorney_numbers": { "type": "array", "items": { "type": "string" } },
    "execution_datetime": { "type": "string", "format": "date-time" },
    "agent_name": { "type": "string" },
    "defendant_person_id": { "type": "string" },
    "indemnitors": { "type": "array", "items": { "type": "string" } }
  },
  "additionalProperties": false
}

Document Keys

Valid document_key values:
	•	financial_indemnity_v1
	•	appearance_application_v1
	•	collateral_promissory_v1
	•	bond_info_sheet_v1
	•	waiver_authorization_v1
	•	ssa_3288_v1
	•	cc_authorization_v1

⸻

Conditionals
	•	Collateral type = real_estate → require deed/mortgage upload
	•	Arrested before = true → require offense_notes
	•	SSA benefit date range → require both from and to dates

⸻

Usage Notes
	•	Client (Velo) forms should validate against these schemas before calling the API.
	•	Server enforces the same schemas for compliance.
	•	Errors follow the API_SPEC.md Errors shape.
