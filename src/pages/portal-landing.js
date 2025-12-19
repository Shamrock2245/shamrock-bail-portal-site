/**
 * Page: portal-landing
 * Role-aware landing with login/signup prompts, magic link handling, and role-based CTAs.
 */

import wixUsers from "wix-users";
import wixLocation from "wix-location";
import { getUserRole, ROLES, onMagicLinkLogin } from "backend/portal-auth";

$w.onReady(async function () {
  initSafeUI();
  $w("#roleSelectionContainer").hide();
  $w("#loginPrompt").hide();
  $w("#loadingStrip").show(); // optional: add a strip/spinner with this ID

  try {
    // 1) Magic link support (?token=...)
    const { token } = wixLocation.query || {};
    if (token) {
      try {
        const linkResult = await onMagicLinkLogin(token);
        if (linkResult?.role) {
          // Optionally show a toast/notice
          // $w('#toast').text = "Link verified — welcome!"; $w('#toast').show();
        }
      } catch (e) {
        // Soft-fail: continue, but show message
        console.warn("Magic link validation failed:", e?.message);
        // $w('#errorText').text = 'Your secure link is invalid or expired.'; $w('#errorText').show();
      } finally {
        // Clean token out of URL (avoid reprocessing on refresh)
        wixLocation.to(`${wixLocation.baseUrl}${wixLocation.path}`);
        return; // Let the page reload without the token
      }
    }

    // 2) Show either login prompt or role chooser
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
      showLogin();
      return;
    }

    // 3) Logged-in user → fetch role from backend
    const role = await getUserRole();
    showByRole(role);
  } catch (err) {
    console.error("portal-landing init error:", err);
    // $w('#errorText').text = 'Something went wrong. Please refresh or try again.'; $w('#errorText').show();
    showAllRoles(); // fall back to open selection
  } finally {
    $w("#loadingStrip").hide();
  }
});

/* ---------- UI helpers ---------- */

function initSafeUI() {
  // Guard against missing IDs (so the page never hard-crashes if an element is not present)
  [
    "#loginPrompt",
    "#loginButton",
    "#signupButton",
    "#roleSelectionContainer",
    "#defendantButton",
    "#indemnitorButton",
    "#staffButton",
    "#loadingStrip",
    "#errorText",
  ].forEach((sel) => {
    try {
      $w(sel).collapse();
    } catch (_) {}
  });
  // Expand immediately-hidden elements we actually want initially:
  try {
    $w("#loadingStrip").expand();
  } catch (_) {}
}

function showLogin() {
  try {
    $w("#roleSelectionContainer").hide();
    $w("#loginPrompt").show();
    $w("#loginButton").onClick(() => wixUsers.promptLogin({ mode: "login" }));
    $w("#signupButton").onClick(() =>
      wixUsers.promptSignup({ mode: "signup" })
    );
  } catch (e) {
    console.warn("showLogin() issue:", e?.message);
  }
}

function showAllRoles() {
  try {
    $w("#loginPrompt").hide();
    $w("#roleSelectionContainer").show();
    expandOnly(["#defendantButton", "#indemnitorButton", "#staffButton"]);

    $w("#defendantButton").onClick(() => wixLocation.to("/portal-defendant"));
    $w("#indemnitorButton").onClick(() => wixLocation.to("/portal-indemnitor"));
    $w("#staffButton").onClick(() => wixLocation.to("/portal-staff"));
  } catch (e) {
    console.warn("showAllRoles() issue:", e?.message);
  }
}

function showByRole(role) {
  if (role === ROLES.DEFENDANT) {
    roleSwitch({ show: "#defendantButton", goto: "/portal-defendant" });
  } else if (role === ROLES.INDEMNITOR || role === ROLES.COINDEMNITOR) {
    roleSwitch({ show: "#indemnitorButton", goto: "/portal-indemnitor" });
  } else if (role === ROLES.STAFF || role === ROLES.ADMIN) {
    roleSwitch({ show: "#staffButton", goto: "/portal-staff" });
  } else {
    showAllRoles();
  }
}

function roleSwitch({ show, goto }) {
  try {
    $w("#loginPrompt").hide();
    $w("#roleSelectionContainer").show();
    const all = ["#defendantButton", "#indemnitorButton", "#staffButton"];
    expandOnly([show], all);
    $w(show).onClick(() => wixLocation.to(goto));
  } catch (e) {
    console.warn("roleSwitch() issue:", e?.message);
    showAllRoles();
  }
}

function expandOnly(
  idsToShow = [],
  all = ["#defendantButton", "#indemnitorButton", "#staffButton"]
) {
  all.forEach((id) => {
    try {
      $w(id).collapse();
    } catch (_) {}
  });
  idsToShow.forEach((id) => {
    try {
      $w(id).expand();
    } catch (_) {}
  });
}

/* ---------- Expected element IDs (ensure in Editor) ----------
#loginPrompt (container)
#loginButton (button)
#signupButton (button)
#roleSelectionContainer (container)
#defendantButton (button)
#indemnitorButton (button)
#staffButton (button)
#loadingStrip (strip/container with spinner)  [optional]
#errorText (text)                              [optional]
------------------------------------------------------------- */
