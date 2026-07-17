import { supabase } from "./supabase.js";
import { logout } from "./auth.js";
import { initializeLayout } from "./layout.js";





import {
    getExecutiveAlerts,
    getDepartmentPerformance
} from "./services/dashboardService.js";


async function loadExecutiveAlerts() {

    const data = await getExecutiveAlerts();

    const container = document.getElementById("executiveAlerts");

    const alerts = [];

    if (data.pending_approvals > 0)
        alerts.push(`🔴 ${data.pending_approvals} Weekly Plans awaiting approval`);

    if (data.returned_plans > 0)
        alerts.push(`🟠 ${data.returned_plans} Returned Weekly Plans`);

    if (data.delayed_actions > 0)
        alerts.push(`🔴 ${data.delayed_actions} Delayed Action Items`);

    if (data.active_actions > 0)
        alerts.push(`🟡 ${data.active_actions} Action Items in Progress`);

    if (alerts.length === 0) {

        container.innerHTML = `
            <div class="alert alert-success mb-0">
                ✅ No pending executive alerts.
            </div>
        `;

        return;
    }

    container.innerHTML = alerts
        .map(a => `<div class="alert alert-warning py-2 mb-2">${a}</div>`)
        .join("");
}

async function loadDepartmentPerformance() {

    const rows = await getDepartmentPerformance();

    const container = document.getElementById("departmentPerformance");

    container.innerHTML = "";

    rows.forEach(row => {

        container.insertAdjacentHTML("beforeend", `

            <div class="mb-3">

                <div class="d-flex justify-content-between">

                    <strong>${row.department_name}</strong>

                    <strong>${row.completion_percent}%</strong>

                </div>

                <div class="progress">

                    <div class="progress-bar"

                        style="width:${row.completion_percent}%">

                    </div>

                </div>

            </div>

        `);

    });

}





/* =====================================================
   Initialize
===================================================== */

const profile = await initializeLayout();

if (!profile) {

    window.location = "login.html";

}

/* =====================================================
   Dashboard Counts
===================================================== */

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

        avg = progressData.reduce(
            (sum, row) => sum + (row.progress || 0),
            0
        ) / progressData.length;

    }

    document.getElementById("completionPercent").innerText =
        Math.round(avg) + "%";

}
/* =====================================================
   District Activity Feed
===================================================== */

async function loadActivityFeed() {

    const { data, error } = await supabase

        .from("activity_log")

        .select(`
            *,
            profiles!activity_log_user_id_fkey(
                full_name
            ),
            departments!activity_log_department_id_fkey(
                department_name
            )
        `)

        .order("created_at", {

            ascending: false

        })

        .limit(10);

    if (error) {

        console.error(error);

        return;

    }

    const container =
        document.getElementById("activityFeed");

    container.innerHTML = "";

    if (!data.length) {

        container.innerHTML =

            `<p class="text-muted">

                No recent activity.

            </p>`;

        return;

    }

    data.forEach(item => {

        let icon = "bi-clock-history";
        let color = "secondary";

        switch (item.activity_type) {

            case "WEEKLY_PLAN":
                icon = "bi-calendar-check";
                color = "primary";
                break;

            case "ACTION_ITEM":
            case "ACTION_ITEM_CREATED":
                icon = "bi-list-check";
                color = "warning";
                break;

            case "ACTION_ITEM_UPDATED":
                icon = "bi-pencil-square";
                color = "info";
                break;

            case "PROGRESS_UPDATE":
                icon = "bi-graph-up-arrow";
                color = "success";
                break;

            case "ACTION_COMPLETED":
                icon = "bi-check-circle-fill";
                color = "success";
                break;

            case "APPROVAL":
                icon = "bi-patch-check-fill";
                color = "primary";
                break;

            case "REJECTION":
                icon = "bi-x-circle-fill";
                color = "danger";
                break;

        }

        container.insertAdjacentHTML(

            "beforeend",

            `
            <div class="d-flex mb-3">

                <div class="me-3">

                    <i class="bi ${icon} text-${color} fs-4"></i>

                </div>

                <div class="flex-grow-1">

                    <div class="fw-semibold">

                        ${item.description}

                    </div>

                    <small class="text-muted">

                        ${item.departments?.department_name ?? ""}

                        ·

                        ${item.profiles?.full_name ?? ""}

                        ·

                        ${new Date(item.created_at).toLocaleString()}

                    </small>

                </div>

            </div>

            <hr>

            `

        );

    });

}
/* =====================================================
   Logout
===================================================== */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        await logout();

    });

}

/* =====================================================
   Start
===================================================== */

await loadCounts();

await loadActivityFeed();


await loadExecutiveAlerts();

await loadDepartmentPerformance();