/*****************************************************************
 FILE : js/users.js
 VERSION : 1.0
 MODULE : User Management
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

let users = [];

let departments = [];

const userModal =
    new bootstrap.Modal(
        document.getElementById("userModal")
    );

/* ==========================================================
   LOAD COMPONENTS
========================================================== */

async function loadComponent(containerId, filePath) {

    const response = await fetch(filePath);

    if (!response.ok) {

        throw new Error(
            "Unable to load " + filePath
        );

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

if (!requireRole(

    currentUser,

    "SUPER_ADMIN"

)) {

    return;

}

await loadDepartments();

await loadUsers();

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
   PAGE PERMISSION
========================================================== */


/* ==========================================================
   LOAD DEPARTMENTS
========================================================== */

async function loadDepartments(){

    const {

        data,

        error

    } = await supabase

        .from("departments")

        .select("id,department_name")

        .order("department_name");

    if(error){

        alert(error.message);

        return;

    }

    departments=data;

    const ddl =
        document.getElementById("department");

    ddl.innerHTML="";

    ddl.insertAdjacentHTML(

        "beforeend",

        `<option value="">-- Select Department --</option>`

    );

    departments.forEach(dep=>{

        ddl.insertAdjacentHTML(

            "beforeend",

            `
            <option value="${dep.id}">
                ${dep.department_name}
            </option>
            `

        );

    });

}

/* ==========================================================
   LOAD USERS
========================================================== */

async function loadUsers(){

    const {

        data,

        error

    } = await supabase

        .from("profiles")

        .select(`
            *,
            departments(
                department_name
            )
        `)

        .order("full_name");

    if(error){

        alert(error.message);

        return;

    }

    users=data;

    renderTable();

}

/* ==========================================================
   TABLE
========================================================== */

function renderTable(){

    const tbody =
        document.getElementById("usersTableBody");

    tbody.innerHTML="";

    users.forEach((user,index)=>{

        tbody.insertAdjacentHTML(

            "beforeend",

            `
<tr>

<td>${index+1}</td>

<td>${user.full_name}</td>

<td>${user.email}</td>

<td>${user.role}</td>

<td>

${user.departments?.department_name ?? "-"}

</td>

<td>

<span class="badge ${user.is_active ? 'badge-active' : 'badge-inactive'}">

${user.is_active ? "Active" : "Inactive"}

</span>

</td>

<td>

<div class="action-buttons">

<button

class="btn btn-sm btn-outline-primary editBtn"

data-id="${user.id}"

title="Edit">

<i class="bi bi-pencil"></i>

</button>

<button

class="btn btn-sm btn-outline-warning statusBtn"

data-id="${user.id}"

title="Activate / Deactivate">

<i class="bi bi-arrow-repeat"></i>

</button>

</div>

</td>

</tr>

`

        );

    });

}

/* ==========================================================
   NEW USER
========================================================== */

function newUser() {

    document.getElementById("userForm").reset();

    document.getElementById("userId").value = "";

    document.getElementById("isActive").value = "true";

    document.getElementById("department").disabled = false;

    userModal.show();

}

/* ==========================================================
   EDIT USER
========================================================== */

function editUser(id) {

    const user = users.find(u => String(u.id) === String(id));

    if (!user) return;

    document.getElementById("userId").value = user.id;

    document.getElementById("fullName").value =
        user.full_name ?? "";

    document.getElementById("email").value =
        user.email ?? "";

    document.getElementById("role").value =
        user.role ?? "HOD";

    document.getElementById("department").value =
        user.department_id ?? "";

    document.getElementById("isActive").value =
        String(user.is_active);

    toggleDepartment();

    userModal.show();

}

/* ==========================================================
   SAVE USER
========================================================== */

async function saveUser(e) {

    e.preventDefault();

    const payload = {

        full_name:
            document.getElementById("fullName").value.trim(),

        role:
            document.getElementById("role").value,

        department_id:
            document.getElementById("department").value || null,

        is_active:
            document.getElementById("isActive").value === "true"

    };

    const id =
        document.getElementById("userId").value;

    let result;

    if (id === "") {

        alert(
            "Version 1.0 only manages existing authenticated users.\n\nCreate the login in Supabase Authentication first, then edit the profile here."
        );

        return;

    }

    result = await supabase

        .from("profiles")

        .update(payload)

        .eq("id", id);

    if (result.error) {

        alert(result.error.message);

        return;

    }

    userModal.hide();

    await loadUsers();

}

/* ==========================================================
   ACTIVATE / DEACTIVATE
========================================================== */

async function toggleStatus(id) {

    const user =
        users.find(u => String(u.id) === String(id));

    if (!user) return;

    const ok = confirm(

        user.is_active ?

        "Deactivate this user?"

        :

        "Activate this user?"

    );

    if (!ok) return;

    const { error } = await supabase

        .from("profiles")

        .update({

            is_active: !user.is_active

        })

        .eq("id", id);

    if (error) {

        alert(error.message);

        return;

    }

    await loadUsers();

}

/* ==========================================================
   SEARCH
========================================================== */

function searchUsers() {

    const keyword =

        document

        .getElementById("searchUser")

        .value

        .toLowerCase()

        .trim();

    const filtered = users.filter(user => {

        return (

            (user.full_name ?? "")

            .toLowerCase()

            .includes(keyword)

            ||

            (user.email ?? "")

            .toLowerCase()

            .includes(keyword)

        );

    });

    const old = users;

    users = filtered;

    renderTable();

    users = old;

}

/* ==========================================================
   ROLE CHANGE
========================================================== */

function toggleDepartment() {

    const role =

        document

        .getElementById("role")

        .value;

    const ddl =

        document

        .getElementById("department");

    if (

        role === "SUPER_ADMIN"

        ||

        role === "DDO"

    ) {

        ddl.value = "";

        ddl.disabled = true;

    }

    else {

        ddl.disabled = false;

    }

}

/* ==========================================================
   EVENTS
========================================================== */

function attachEvents() {

    document

        .getElementById("btnAddUser")

        .addEventListener(

            "click",

            newUser

        );

    document

        .getElementById("userForm")

        .addEventListener(

            "submit",

            saveUser

        );

    document

        .getElementById("searchUser")

        .addEventListener(

            "keyup",

            searchUsers

        );

    document

        .getElementById("role")

        .addEventListener(

            "change",

            toggleDepartment

        );

    document

        .addEventListener(

            "click",

            function(e){

                const editBtn =
                    e.target.closest(".editBtn");

                if(editBtn){

                    editUser(

                        editBtn.dataset.id

                    );

                    return;

                }

                const statusBtn =
                    e.target.closest(".statusBtn");

                if(statusBtn){

                    toggleStatus(

                        statusBtn.dataset.id

                    );

                }

            }

        );

    const logoutBtn =
        document.getElementById("logoutBtn");

    if(logoutBtn){

        logoutBtn.addEventListener(

            "click",

            async function(e){

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