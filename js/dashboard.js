import { supabase } from "./supabase.js";
import { logout } from "./auth.js";

/* -----------------------------
   Load HTML Components
------------------------------*/

async function loadComponent(id, file) {

    const response = await fetch(file);
    const html = await response.text();

    document.getElementById(id).innerHTML = html;

}

await loadComponent("sidebar-container","../components/sidebar.html");
await loadComponent("navbar-container","../components/navbar.html");
/* -----------------------------
   Mobile Sidebar
------------------------------*/

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");

if (menuToggle && sidebar) {

    menuToggle.addEventListener("click", () => {

        sidebar.classList.toggle("show");

    });

}
/* -----------------------------
   Check Login
------------------------------*/

const {

    data:{user}

} = await supabase.auth.getUser();

if(!user){

    window.location="login.html";

}

/* -----------------------------
   Load Logged User
------------------------------*/

const {

    data:profile

} = await supabase

.from("profiles")

.select("*")

.eq("id",user.id)

.single();

if(profile){

    document.getElementById("loggedUser").innerHTML=

    `<i class="bi bi-person-circle"></i>

    ${profile.full_name}`;

}

/* -----------------------------
   Dashboard Cards
------------------------------*/

async function loadCounts() {

    /* Departments */

    const { count: deptCount } = await supabase
        .from("departments")
        .select("*", { count: "exact", head: true });

    document.getElementById("departmentCount").innerText =
        deptCount ?? 0;

    /* Weekly Plans */

    const { count: planCount } = await supabase
        .from("weekly_plans")
        .select("*", { count: "exact", head: true });

    document.getElementById("planCount").innerText =
        planCount ?? 0;

    /* Submitted Plans */

    const { count: submittedCount } = await supabase
        .from("weekly_plans")
        .select("*", { count: "exact", head: true })
        .eq("status", "Submitted");

    document.getElementById("submittedPlans").innerText =
        submittedCount ?? 0;

    /* Action Items */

    const { count: activityCount } = await supabase
        .from("action_items")
        .select("*", { count: "exact", head: true });

    document.getElementById("activityCount").innerText =
        activityCount ?? 0;

    /* Completed */

    const { count: completedCount } = await supabase
        .from("action_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "Completed");

    document.getElementById("completedCount").innerText =
        completedCount ?? 0;

    /* In Progress */

    const { count: progressCount } = await supabase
        .from("action_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "In Progress");

    document.getElementById("inProgressCount").innerText =
        progressCount ?? 0;

    /* Delayed */

    const { count: delayedCount } = await supabase
        .from("action_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "Delayed");

    document.getElementById("delayedCount").innerText =
        delayedCount ?? 0;

    /* Average Progress */

    const { data: progressData } = await supabase
        .from("action_items")
        .select("progress");

    let avg = 0;

    if (progressData && progressData.length > 0) {

        avg =
            progressData.reduce(
                (sum, row) => sum + (row.progress || 0),
                0
            ) / progressData.length;

    }

    document.getElementById("completionPercent").innerText =
        Math.round(avg) + "%";

}

loadCounts();

/* -----------------------------
   Logout
------------------------------*/

document

.getElementById("logoutBtn")

.addEventListener("click",async(e)=>{

    e.preventDefault();

    await logout();

});
