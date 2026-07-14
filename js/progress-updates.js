/*****************************************************************
 FILE : js/progress-updates.js
 VERSION : 1.0
 MODULE : Progress Updates
*****************************************************************/

import { supabase } from "./supabase.js";
import {

    logout,

    getCurrentProfile,

    requireRole

} from "./auth.js";

/* ==========================================================
   GLOBAL VARIABLES
========================================================== */

let currentUser = null;
let actionId = null;
let actionItem = null;
let progressList = [];

const progressModal = new bootstrap.Modal(
    document.getElementById("progressModal")
);

/* ==========================================================
   LOAD COMPONENTS
========================================================== */

async function loadComponent(id, file) {

    const response = await fetch(file);

    if (!response.ok)
        throw new Error("Unable to load " + file);

    document.getElementById(id).innerHTML =
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
        if (
    !requireRole(
        currentUser,
        "SUPER_ADMIN",
        "DDO",
        "HOD",
        "OPERATOR"
    )
) {

    return;

}

        actionId =
            new URLSearchParams(window.location.search)
            .get("action");

        if (!actionId) {

            alert("Action Item not found.");

           window.location = "weekly-plans.html";

            return;

        }

        await loadActionItem();

        await loadProgressHistory();

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
   LOAD ACTION ITEM
========================================================== */

async function loadActionItem(){

    const {data,error}=await supabase

       .from("action_items")
.select(`
    *,
    weekly_plans!inner(
        department_id
    )
`)

        .eq("id",actionId)

        .single();

    if(error){

        alert(error.message);

        return;

    }

    actionItem=data;
    if (

    (currentUser.role === "HOD" ||
     currentUser.role === "OPERATOR")

    &&

    actionItem.weekly_plans.department_id !== currentUser.department_id

) {

    alert("Access Denied.");

    window.location = "action-items.html";

    return;

}

    document.getElementById("activityTitle")
        .innerText=
        actionItem.activity_title;

    document.getElementById("activityPriority")
        .innerText=
        actionItem.priority;

    document.getElementById("activityOfficer")
        .innerText=
        actionItem.responsible_officer;

    document.getElementById("activityDate")
        .innerText=
        actionItem.target_date;

}

/* ==========================================================
   LOAD PROGRESS HISTORY
========================================================== */

async function loadProgressHistory(){

    const {data,error}=await supabase

        .from("progress_updates")

       .select(`
    *,
    updated_by:profiles!progress_updates_updated_by_fkey(
        full_name
    )
`)

        .eq("action_item_id",actionId)

        .order("created_at",{

            ascending:false

        });

    if(error){

        alert(error.message);

        return;

    }

    progressList=data;

    renderTable();

}

/* ==========================================================
   TABLE
========================================================== */

function renderTable(){

    const tbody=
        document.getElementById("progressTableBody");

    tbody.innerHTML="";

    progressList.forEach((row,index)=>{

        tbody.insertAdjacentHTML(

            "beforeend",

            `

<tr>

<td>${index+1}</td>

<td>

${new Date(row.created_at).toLocaleDateString()}

</td>

<td>

<div class="progress" style="width:130px;">

<div
class="progress-bar"

style="width:${row.progress}%">

${row.progress}%

</div>

</div>

</td>

<td>

${row.remarks}

</td>

<td>

${row.updated_by?.full_name ?? ""}

</td>

</tr>

`

        );

    });

}

/* ==========================================================
   ADD PROGRESS
========================================================== */

function newProgress() {

    document.getElementById("progressForm").reset();

    document.getElementById("progressId").value = "";

    document.getElementById("progress").value =
        actionItem.progress ?? 0;

    document.getElementById("remarks").value = "";

    progressModal.show();

}

/* ==========================================================
   SAVE PROGRESS
========================================================== */

async function saveProgress(e) {

    e.preventDefault();

    const progressValue =
        Number(document.getElementById("progress").value);

    const remarks =
        document.getElementById("remarks").value.trim();

    const payload = {

        action_item_id: actionId,

        progress: progressValue,

        remarks: remarks,

        updated_by: currentUser.id

    };

    const id =
        document.getElementById("progressId").value;

    let result;

    if (id === "") {

        result = await supabase

            .from("progress_updates")

            .insert(payload);

    } else {

        result = await supabase

            .from("progress_updates")

            .update(payload)

            .eq("id", id);

    }

    if (result.error) {

        alert(result.error.message);

        return;

    }

    /* ---------------------------------------
       UPDATE ACTION ITEM
    --------------------------------------- */

   let status = "Planned";

if (progressValue > 0 && progressValue < 100)
    status = "In Progress";

if (progressValue >= 100)
    status = "Completed";
    const { error } = await supabase

        .from("action_items")

        .update({

            progress: progressValue,

            status: status

        })

        .eq("id", actionId);

    if (error) {

        alert(error.message);

        return;

    }

    progressModal.hide();

    await loadActionItem();

    await loadProgressHistory();

}

/* ==========================================================
   EVENTS
========================================================== */

function attachEvents() {

    document

        .getElementById("btnAddProgress")

        .addEventListener(

            "click",

            newProgress

        );

    document

        .getElementById("progressForm")

        .addEventListener(

            "submit",

            saveProgress

        );

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