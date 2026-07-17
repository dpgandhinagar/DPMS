/*****************************************************************
 FILE : js/action-items.js
 VERSION : 1.0
 MODULE : Action Items
*****************************************************************/

import { supabase } from "./supabase.js";
import {
    logout,
    getCurrentProfile
} from "./auth.js";
import { logActivity } from "./activity.js";
/* ==========================================================
   GLOBAL VARIABLES
========================================================== */

let currentUser = null;
let planId = null;
let plan = null;
let actionItems = [];

const itemModal = new bootstrap.Modal(
    document.getElementById("itemModal")
);

/* ==========================================================
   LOAD HTML COMPONENTS
========================================================== */

async function loadComponent(containerId, filePath) {

    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error("Unable to load " + filePath);
    }

    document.getElementById(containerId).innerHTML =
        await response.text();

}

/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

    try {

        await loadComponent(
            "sidebar-container",
            "../components/sidebar.html"
        );

        await loadComponent(
            "navbar-container",
            "../components/navbar.html"
        );

        await checkLogin();

        planId =
    new URLSearchParams(window.location.search)
    .get("plan");

if (planId) {

    await loadPlan();

}

await loadActionItems();

        attachEvents();

    }

    catch (err) {

        console.error(err);

        alert(err.message);

    }

}

/* ==========================================================
   LOGIN
========================================================== */

async function checkLogin() {

    currentUser = await getCurrentProfile();

    if (!currentUser) return;

    const lbl =
        document.getElementById("loggedUser");

    if (lbl) {

        lbl.innerHTML =
            `<i class="bi bi-person-circle"></i>
            ${currentUser.full_name}`;

    }

}

/* ==========================================================
   LOAD PLAN
========================================================== */

async function loadPlan() {

    if (!planId) {

        document.getElementById("planDepartment").innerText = "All Departments";
        document.getElementById("planWeek").innerText = "-";
        document.getElementById("planYear").innerText = "-";
        document.getElementById("planTitle").innerText = "All Weekly Plans";

        return;

    }

    const { data, error } = await supabase

        .from("weekly_plans")

        .select(`
            *,
            departments(
                department_name
            )
        `)

        .eq("id", planId)

        .single();

    if (error) {

        alert(error.message);

        return;

    }

    plan = data;

    document.getElementById("planDepartment").innerText =
        plan.departments.department_name;

    document.getElementById("planWeek").innerText =
        plan.week_no;

    document.getElementById("planYear").innerText =
        plan.year;

    document.getElementById("planTitle").innerText =
        plan.title;

}

/* ==========================================================
   LOAD ACTION ITEMS
========================================================== */

async function loadActionItems() {

    let query = supabase

        .from("action_items")

        .select(`
            *,
            weekly_plans!inner(
                department_id
            )
        `)

        .order("target_date");

    /* -----------------------------
       Specific Weekly Plan
    ------------------------------ */

    if (planId) {

        query = query.eq(
            "weekly_plan_id",
            planId
        );

    }

    /* -----------------------------
       HOD / OPERATOR
    ------------------------------ */

    if (

        currentUser.role === "HOD"

        ||

        currentUser.role === "OPERATOR"

    ) {

        query = query.eq(

            "weekly_plans.department_id",

            currentUser.department_id

        );

    }

    const {

        data,

        error

    } = await query;

    if (error) {

        alert(error.message);

        return;

    }

    actionItems = data;

    renderTable();

}

/* ==========================================================
   TABLE
========================================================== */

function renderTable() {

    const tbody = document.getElementById("itemsTableBody");

    tbody.innerHTML = "";

    actionItems.forEach((item, index) => {

        tbody.insertAdjacentHTML(

            "beforeend",

            `
            <tr>

                <td>${index + 1}</td>

                <td>${item.activity_title}</td>

                <td>${item.priority}</td>

                <td>${item.responsible_officer}</td>

                <td>${item.target_date ?? ""}</td>

                <td>

                    <div class="progress">

                        <div
                            class="progress-bar"
                            role="progressbar"
                            style="width:${item.progress ?? 0}%">

                            ${item.progress ?? 0}%

                        </div>

                    </div>

                </td>

                <td>

                    <span class="badge bg-primary">

                        ${item.status}

                    </span>

                </td>

                <td>

                    <td >
    <div class="d-flex gap-1">

        <button
            class="btn btn-sm btn-outline-primary editBtn"
            data-id="${item.id}"
            title="Edit">

            <i class="bi bi-pencil"></i>

        </button>

        <button
            class="btn btn-sm btn-outline-success progressBtn"
            data-id="${item.id}"
            title="Progress Updates">

            <i class="bi bi-graph-up"></i>

        </button>

        <button
            class="btn btn-sm btn-outline-danger deleteBtn"
            data-id="${item.id}"
            title="Delete">

            <i class="bi bi-trash"></i>

        </button>

    </div>

</td>

                </td>

            </tr>

            `
        );

    });

    /* EDIT */

    document.querySelectorAll(".editBtn").forEach(btn => {

        btn.onclick = () => {

            editItem(btn.dataset.id);

        };

    });

    /* PROGRESS */

    document.querySelectorAll(".progressBtn").forEach(btn => {

        btn.onclick = () => {

            window.location.href =
                `progress-updates.html?action=${btn.dataset.id}`;

        };

    });

    /* DELETE */

    document.querySelectorAll(".deleteBtn").forEach(btn => {

        btn.onclick = () => {

            alert("Delete feature will be added next.");

        };

    });

}

/* ==========================================================
   NEW ITEM
========================================================== */

function newItem() {

    document.getElementById("itemForm").reset();

    document.getElementById("itemId").value = "";

    document.getElementById("progress").value = 0;

    document.getElementById("status").value = "Planned";

    itemModal.show();

}

/* ==========================================================
   EDIT ITEM
========================================================== */

function editItem(id) {

    const item = actionItems.find(i => String(i.id) === String(id));

    if (!item) return;

    document.getElementById("itemId").value = item.id;

    document.getElementById("activityTitle").value =
        item.activity_title ?? "";

    document.getElementById("activityDescription").value =
        item.activity_description ?? "";

    document.getElementById("priority").value =
        item.priority ?? "Medium";

    document.getElementById("targetDate").value =
        item.target_date ?? "";

    document.getElementById("responsibleOfficer").value =
        item.responsible_officer ?? "";

    document.getElementById("progress").value =
        item.progress ?? 0;

    document.getElementById("status").value =
        item.status ?? "Planned";

    document.getElementById("remarks").value =
        item.remarks ?? "";

    itemModal.show();

}

/* ==========================================================
   SAVE ITEM
========================================================== */

async function saveItem(e) {

    e.preventDefault();

    const payload = {

        weekly_plan_id: planId,

        activity_title:
            document.getElementById("activityTitle").value.trim(),

        activity_description:
            document.getElementById("activityDescription").value.trim(),

        priority:
            document.getElementById("priority").value,

        target_date:
            document.getElementById("targetDate").value,

        responsible_officer:
            document.getElementById("responsibleOfficer").value.trim(),

        progress:
            Number(document.getElementById("progress").value),

        status:
            document.getElementById("status").value,

        remarks:
            document.getElementById("remarks").value.trim()

    };

    const id = document.getElementById("itemId").value;

    let result;

    if (id === "") {

       result = await supabase
    .from("action_items")
    .insert(payload)
    .select()
    .single();
    } else {

       result = await supabase
    .from("action_items")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

    }

    if (result.error) {

        alert(result.error.message);

        return;

    }
    if (id === "") {

    // New Action Item

    await logActivity({

        activityType: "ACTION_ITEM",

        description:
            `${currentUser.full_name} created Action Item '${payload.activity_title}'`,

        referenceTable: "action_items",

        referenceId: result.data.id,

        profile: currentUser,

        metadata: {

            weekly_plan_id: planId,

            priority: payload.priority,

            status: payload.status

        }

    });

} else {

    // Existing Action Item Updated

    await logActivity({

        activityType: "ACTION_ITEM_UPDATED",

        description:
            `${currentUser.full_name} updated Action Item '${payload.activity_title}'`,

        referenceTable: "action_items",

        referenceId: id,

        profile: currentUser,

        metadata: {

            progress: payload.progress,

            status: payload.status,

            priority: payload.priority

        }

    });

    // Log completion separately

    if (payload.status === "Completed") {

        await logActivity({

            activityType: "ACTION_COMPLETED",

            description:
                `${currentUser.full_name} completed Action Item '${payload.activity_title}'`,

            referenceTable: "action_items",

            referenceId: id,

            profile: currentUser,

            metadata: {

                progress: payload.progress

            }

        });

    }

}

    itemModal.hide();

    await loadActionItems();

}

/* ==========================================================
   EVENTS
========================================================== */

function attachEvents() {

    document
        .getElementById("btnAddItem")
        .addEventListener("click", newItem);

    document
        .getElementById("itemForm")
        .addEventListener("submit", saveItem);

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async function (e) {

                e.preventDefault();

                await logout();

            }
        );

    }

}

/* ==========================================================
   START
========================================================== */

initialize();