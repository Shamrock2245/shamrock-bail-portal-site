# Shamrock Bail Portal - Field Analysis Report

**Date:** February 9, 2026  
**Analyst:** The Architect

---

## Executive Summary

Analyzed 12 PDF forms containing **280 total form fields**. Created comprehensive mapping system linking actual PDF field names to standardized Master Data Dictionary tags.

---

## Field Distribution by PDF

| PDF Document | Field Count | Mapped | Complexity |
|--------------|-------------|--------|------------|
| osi-defendant-application-shamrock-reducedsize.pdf | 87 | 23 | High |
| osi-collateral-premium-receipt.pdf | 48 | 48 | Medium |
| osi-indemnity-agreement-shamrock.pdf | 46 | 46 | Medium |
| osi-appearance-bond-shamrock.pdf | 25 | 25 | Low |
| osi-surety-terms-and-conditions-shamrock.pdf | 25 | 25 | Low |
| shamrock-premium-finance-notice.pdf | 23 | 23 | Low |
| osi-disclosure-form-shamrock.pdf | 11 | 11 | Low |
| osi-promissory-note-side2-shamrock.pdf | 10 | 10 | Low |
| shamrock-paperwork-header.pdf | 4 | 4 | Low |
| shamrock-master-waiver.pdf | 1 | 1 | Low |
| Shamrock Bail Bonds - FAQ Cosigners.pdf | 0 | 0 | N/A |
| Shamrock Bail Bonds- FAQ Defe..pdf | 0 | 0 | N/A |
| **TOTAL** | **280** | **216** | - |

---

## Master Data Dictionary Categories

### Defendant Fields (Def*)
- **Core Identity:** DefName, DefFirstName, DefLastName, DefAlias, DefDOB, DefSSN
- **Contact:** DefPhone, DefEmail, DefAddress, DefCity, DefState, DefZip
- **Physical:** DefHeight, DefWeight, DefEyes, DefHair, DefRace, DefScars
- **Identifiers:** DefDL, DefBookingNum, DefFacility
- **Legal:** DefCharges, DefCounty, DefArrestDate, DefCourtDate, DefAttorney
- **Vehicle:** DefCarYear, DefCarMake, DefCarModel, DefCarColor, DefCarPlate, DefCarVin

**Total Defendant Fields:** 40+

### Indemnitor Fields (Ind*)
- **Core Identity:** IndName, IndRelation, IndDOB, IndSSN
- **Contact:** IndPhone, IndEmail, IndAddress, IndCity, IndState, IndZip
- **Employment:** IndEmployer, IndEmpPhone, IndEmpAddress, IndSupervisor
- **Financial:** IndHomeowner, IndMortgageCo
- **Multi-Indemnitor:** Ind2Name, Ind2Address, Ind2DL, Ind3Signature

**Total Indemnitor Fields:** 25+

### Financial Fields
- **Bond:** TotalBond, Premium, PremiumPaid, BalanceDue
- **Collateral:** CollateralAmount, CollateralDescription
- **Fees:** OtherFeesDue, TotalMoniesDue, CreditCardFee

**Total Financial Fields:** 25+

---

## Cross-Form Field Consistency

| Master Key | Appears On Forms | Count |
|------------|------------------|-------|
| DefName | All defendant forms | 8 |
| TotalBond | All financial forms | 7 |
| PowerNum | Most forms | 6 |
| Premium | All financial forms | 6 |
| Date | Most forms | 10 |

**Key Insight:** The mapping ensures consistent data population across all forms.

---

## Recommendations

1. ✅ **Use the provided mapping file** - Complete for 216 fields
2. ✅ **Implement mapping layer** in automation code
3. ✅ **Test with sample data** on each form
4. ⚠️ **Map remaining Text fields** as needed

---

**Report Prepared By:** The Architect  
**Project:** OSI PDF AUTOMATION
