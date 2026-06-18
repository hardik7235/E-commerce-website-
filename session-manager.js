// =========================================================================
// Dhaga Piroi - 15-Day Session & Cookie Manager 
// =========================================================================

// 1. Supabase Settings
const SESSION_SUPABASE_URL = 'https://aybzziayodaybspnuxos.supabase.co';
const SESSION_SUPABASE_ANON_KEY = 'sb_publishable__YSi8eCD5W3QW1XN9uE08g_U8VHT3Ik';

// Initialize Supabase Client (uses existing if available to save memory)
const sessionClient = window.supabaseClient || window.supabase.createClient(SESSION_SUPABASE_URL, SESSION_SUPABASE_ANON_KEY);

// 2. Session Configuration
const INACTIVITY_DAYS = 15;
const COOKIE_NAME = 'dhaga_active_session';
const LOCAL_STORAGE_KEY = 'dhaga_last_activity';

/**
 * 3. Set or Refresh the 15-day activity cookie and local timer
 */
function refreshActivityCookie() {
    const expiryDate = new Date();
    // Current time + 15 Days
    expiryDate.setTime(expiryDate.getTime() + (INACTIVITY_DAYS * 24 * 60 * 60 * 1000));
    
    // Set secure cookie accessible across the entire website
    document.cookie = `${COOKIE_NAME}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    // Set local storage backup timestamp
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
}

/**
 * 4. Verify if the 15-day cookie still exists in the browser
 */
function isSessionCookieValid() {
    return document.cookie.split(';').some(c => c.trim().startsWith(`${COOKIE_NAME}=`));
}

/**
 * 5. Main validation logic (Runs when any page loads)
 */
async function validateUserSession() {
    try {
        // Get current active session from Supabase
        const { data: { session }, error } = await sessionClient.auth.getSession();
        
        if (error) throw error;

        if (session) {
            const lastActivity = localStorage.getItem(LOCAL_STORAGE_KEY);
            const msSinceLastActive = lastActivity ? (Date.now() - parseInt(lastActivity)) : 0;
            const msIn15Days = INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

            // Check if 15 days passed OR cookie was manually deleted
            if (!isSessionCookieValid() || msSinceLastActive > msIn15Days) {
                console.warn("Session expired! No activity detected for 15 days. Logging out...");
                
                // Sign out forcefully from backend
                await sessionClient.auth.signOut();
                
                // Clear all traces of the session
                document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                
                // Redirect to login page ONLY if not already there
                if (!window.location.href.includes('index.html')) {
                    alert("Your Sessio Is Expired Please Log-In Again For SecurityS.");
                    window.location.href = 'index.html'; 
                }
            } else {
                // User is valid and active, refresh the 15-day timer
                refreshActivityCookie();
            }
        }
    } catch (err) {
        console.error("Session validation error:", err);
    }
}

// =========================================================================
// RUN ON PAGE LOAD
// =========================================================================
// Automatically check session security as soon as the script loads
validateUserSession();

// =========================================================================
// BACKGROUND ACTIVITY TRACKER (Throttled for Performance)
// =========================================================================
let activityThrottleTimer = null;

function handleUserActivity() {
    // We don't want to update cookies on every single millisecond of scrolling.
    // Throttling ensures we only update the database/cookies once per minute max.
    if (!activityThrottleTimer) {
        activityThrottleTimer = setTimeout(() => {
            
            // Only refresh the timer if the user is actually logged in
            sessionClient.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    refreshActivityCookie();
                }
            });
            
            // Cooldown of 60 seconds (60000 ms)
            activityThrottleTimer = null; 
        }, 60000); 
    }
}

// Listen to standard user activities to keep the session alive
window.addEventListener('click', handleUserActivity);
window.addEventListener('scroll', handleUserActivity, { passive: true });
window.addEventListener('keypress', handleUserActivity);
window.addEventListener('mousemove', handleUserActivity, { passive: true });