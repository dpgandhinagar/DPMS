import { supabase } from "./supabase.js";
import {
    logout,
    getCurrentProfile
} from "./auth.js";

import {
    logActivity
} from "./activity.js";
/* ==========================================================
   GLOBAL VARIABLES
========================================================== */

let plans = [];
let departments = [];
let currentUser = null;

const planModal = new bootstrap.Modal(
    document.getElementById("planModal")
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

        await loadDepartments();

        await loadWeeklyPlans();

        attachEvents();

    } catch (err) {

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
   LOAD DEPARTMENTS
========================================================== */

async function loadDepartments() {

    const { data, error } = await supabase

        .from("departments")

        .select("*")

        .eq("is_active", true)

        .order("department_name");

    if (error) {

        console.error(error);
        return;

    }

    departments = data;

    const ddl =
        document.getElementById("department");

    ddl.innerHTML = "";

    departments.forEach(dep => {

        ddl.insertAdjacentHTML(

            "beforeend",

            `<option value="${dep.id}">

                ${dep.department_name}

            </option>`

        );

    });

}

/* ==========================================================
   LOAD WEEKLY PLANS
========================================================== */

async function loadWeeklyPlans() {

    let query = supabase

        .from("weekly_plans")

       .select(`
    *,
    departments(
        department_name
    ),
    submitted_by:profiles!weekly_plans_submitted_by_fkey(
        full_name
    )
`)

        .order("year", {

            ascending: false

        })

        .order("week_no", {

            ascending: false

        });

    /* ----------------------------------
       ROLE FILTER
    ----------------------------------- */

    if (

        currentUser.role === "HOD"

        ||

        currentUser.role === "OPERATOR"

    ) {

        query = query.eq(

            "department_id",

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

    plans = data;

    renderTable(plans);

}

/* ==========================================================
   RENDER TABLE
========================================================== */

function renderTable(list) {

    const tbody =
        document.getElementById("plansTableBody");

    tbody.innerHTML = "";

    list.forEach((plan, index) => {

        tbody.insertAdjacentHTML(

            "beforeend",

            `
            <tr>

                <td>${index + 1}</td>

                <td>${plan.week_no}</td>

                <td>${plan.year}</td>

                <td>

                    ${plan.departments?.department_name ?? ""}

                </td>

                <td>

                    ${plan.title}

                </td>

                <td>

                    <span class="badge bg-primary">

                        ${plan.status}

                    </span>

                </td>

                <td>

                    ${new Date(plan.updated_at).toLocaleDateString()}

                </td>

                <td>

                    <button
                        class="btn btn-sm btn-outline-primary editBtn"
                        data-id="${plan.id}"
                        title="Edit">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="btn btn-sm btn-outline-success ms-1 actionBtn"
                        data-id="${plan.id}"
                        title="Action Items">

                        <i class="bi bi-list-check"></i>

                    </button>

                </td>

            </tr>

            `

        );

    });

    /* -------------------------------
       EDIT BUTTON
    -------------------------------- */

    document.querySelectorAll(".editBtn").forEach(btn => {

        btn.onclick = () => {

            alert("Edit module will be connected next.");

        };

    });

    /* -------------------------------
       ACTION ITEMS BUTTON
    -------------------------------- */

    document.querySelectorAll(".actionBtn").forEach(btn => {

        btn.onclick = () => {

            window.location.href =
                `action-items.html?plan=${btn.dataset.id}`;

        };

    });

}

/* ==========================================================
   EVENTS
========================================================== */

/* ==========================================================
   EVENTS
========================================================== */

function attachEvents() {

    // New Plan

    document

        .getElementById("btnNewPlan")

        .addEventListener("click", newPlan);

    // Save Draft

    document

        .getElementById("btnSaveDraft")

        .addEventListener("click", saveDraft);

    // Submit Plan

    document

        .getElementById("planForm")

        .addEventListener("submit", submitPlan);

    // Logout

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(

            "click",

            async e => {

                e.preventDefault();

                await logout();

            }

        );

    }

}

/* ==========================================================
   START
========================================================== */
/* ==========================================================
   NEW PLAN
========================================================== */

function newPlan(){

    document.getElementById("planForm").reset();

    document.getElementById("planId").value="";

    const today = new Date();

    document.getElementById("year").value =
        today.getFullYear();

    document.getElementById("weekNo").value =
        getWeekNumber(today);

    planModal.show();

}

/* ==========================================================
   SAVE DRAFT
========================================================== */

async function saveDraft(){

    const payload={

        week_no:
            Number(document.getElementById("weekNo").value),

        year:
            Number(document.getElementById("year").value),

        department_id:
            document.getElementById("department").value,

        title:
            document.getElementById("planTitle").value,

        objectives:
            document.getElementById("objectives").value,

        status:"Draft",

        submitted_by:currentUser.id

    };

    const {

    data:newPlan,

    error

}=await supabase

.from("weekly_plans")

.insert(payload)

.select()

.single();

    if(error){

        alert(error.message);

        return;

    }

    await logActivity({

    activityType:"WEEKLY_PLAN",

    description:

        `${currentUser.full_name} saved Weekly Plan as Draft`,

    referenceTable:"weekly_plans",

    referenceId:newPlan.id,

    profile:currentUser,

    metadata:{

        week_no:newPlan.week_no,

        year:newPlan.year,

        status:"Draft"

    }

});

    planModal.hide();

    await loadWeeklyPlans();

}

/* ==========================================================
   SUBMIT PLAN
========================================================== */

async function submitPlan(e){

    e.preventDefault();

    const payload={

        week_no:
            Number(document.getElementById("weekNo").value),

        year:
            Number(document.getElementById("year").value),

        department_id:
            document.getElementById("department").value,

        title:
            document.getElementById("planTitle").value,

        objectives:
            document.getElementById("objectives").value,

        status:"Submitted",

        submitted_by:currentUser.id,

        submitted_at:new Date().toISOString()

    };

   const {

    data:newPlan,

    error

}=await supabase

.from("weekly_plans")

.insert(payload)

.select()

.single();

    if(error){

        alert(error.message);

        return;

    }

    await logActivity({

    activityType:"WEEKLY_PLAN",

    description:

        `${currentUser.full_name} submitted Weekly Plan (Week ${newPlan.week_no})`,

    referenceTable:"weekly_plans",

    referenceId:newPlan.id,

    profile:currentUser,

    metadata:{

        week_no:newPlan.week_no,

        year:newPlan.year,

        status:"Submitted"

    }

});

    planModal.hide();

    await loadWeeklyPlans();

}

/* ==========================================================
   WEEK NUMBER
========================================================== */

function getWeekNumber(date){

    const firstDay =
        new Date(date.getFullYear(),0,1);

    const days =
        Math.floor(
            (date-firstDay)/86400000
        );

    return Math.ceil((days+firstDay.getDay()+1)/7);

}


initialize();