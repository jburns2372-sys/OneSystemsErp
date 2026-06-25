# CC. TROUBLESHOOTING GUIDE

## 1. Access and Permission Issues

**Issue: "I cannot see my assigned project."**
- **Cause**: PBAC (Project-Based Access Control) limits visibility. You may not be assigned to the project.
- **Solution**: Ask the Project Manager or System Admin to navigate to `Projects > [Project Name] > Users` and add your account to the project.

**Issue: "I clicked an Admin menu item and got redirected or hit a 404 error."**
- **Cause**: You do not have `SUPER_ADMIN` or `SYSTEM_ADMIN` roles. The system actively blocks non-admins from accessing settings or AI registry pages and redirects them to the root dashboard (`/`).
- **Solution**: Request admin privileges if your job requires it.

**Issue: "I am logged in but I cannot create, edit, or approve anything. The buttons are missing or return errors."**
- **Cause**: You are assigned the `GUEST_USER` role.
- **Solution**: Guest users are strictly view-only by design. If you need write access, a System Admin must change your primary role.

## 2. Procurement & BOQ Issues

**Issue: "I cannot generate a Material Request (MR); it says 'Insufficient Benchmark Quantity'."**
- **Cause**: You are requesting more materials than what was allocated in the internal Procurement Benchmark BOQ.
- **Solution**: 
  - Check if there were previous MRs that already consumed the budget.
  - If a budget increase is justified, a Director must approve an update to the Benchmark BOQ or authorize an override.

**Issue: "The Awarded BOQ total does not match the Contract Amount."**
- **Cause**: An error in the uploaded Excel file.
- **Solution**: Delete the uploaded BOQ (if it is still unlocked) and re-upload the corrected Excel file. If it is already locked, only an Admin can unlock it.

## 3. Financial & Payroll Issues

**Issue: "My Daily Time Record (DTR) upload failed."**
- **Cause**: Incorrect Excel format, or referencing `workerId`s that do not exist in the Worker Database.
- **Solution**: Download the DTR template from the system, ensure all worker IDs match exactly, and re-upload.

**Issue: "An expense was flagged as a 'Duplicate' by the AI Validation."**
- **Cause**: The AI detected a similar receipt number, amount, or date logged recently.
- **Solution**: The Finance Officer must manually review the flagged expense. If it is a false positive, they can override the AI warning and approve it. If it is a true duplicate, Reject the expense.

## 4. System & AI Issues

**Issue: "The AI Command Center is returning 'API Key Error' or failing to generate charts."**
- **Cause**: The `OPENAI_API_KEY` or `GEMINI_API_KEY` environment variables are missing or expired in the Vercel deployment settings.
- **Solution**: The System Admin must update the keys in Vercel and trigger a redeployment.

**Issue: "The Excel Document Viewer is not displaying my formulas correctly."**
- **Cause**: The web-based viewer renders static values. Complex macros or advanced VBA scripts will not run in the browser.
- **Solution**: Download the file and open it in desktop Microsoft Excel. 

## 5. Deployment Issues

**Issue: "I pushed a fix, but the live site still shows the old version."**
- **Cause**: Vercel deployments take 2-4 minutes to build.
- **Solution**: Wait 5 minutes. Clear your browser cache (Ctrl + F5 or Cmd + Shift + R) and try again.
