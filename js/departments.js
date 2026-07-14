import { supabase } from "./supabase.js";
import {

    logout,

    getCurrentProfile,

    requireRole

} from "./auth.js";
/* ==========================================================
   LOAD COMPONENTS
========================================================== */

async function loadComponent(containerId, filePath) {

    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(`Unable to load ${filePath}`);
    }

    const html = await response.text();

    document.getElementById(containerId).innerHTML = html;

}

/* ==========================================================
   INITIALIZE PAGE
========================================================== */

async function initialize() {

    try {

        // pages/departments.html is one level below root,
        // therefore components are loaded using ../

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
        "DDO"
    )
) {

    return;

}

await loadDepartments();

attachEvents();

    } catch (err) {

        console.error(err);
        alert(err.message);

    }

}

/* ==========================================================
   LOGIN CHECK
========================================================== */

async function checkLogin() {

    currentUser = await getCurrentProfile();

    if (!currentUser) return;

    const loggedUser =
        document.getElementById("loggedUser");

    if (loggedUser) {

        loggedUser.innerHTML =
            `<i class="bi bi-person-circle"></i>
            ${currentUser.full_name}`;

    }

}

/* ==========================================================
   LOAD DEPARTMENTS
========================================================== */

let departments = [];
let currentUser = null;

async function loadDepartments() {

    const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("department_name");

    if (error) {

        console.error(error);
        alert(error.message);
        return;

    }

    departments = data;

    renderTable(departments);

}

/* ==========================================================
   RENDER TABLE
========================================================== */

function renderTable(list) {

    const tbody = document.getElementById("departmentTableBody");

    tbody.innerHTML = "";

    list.forEach((dept, index) => {

        tbody.insertAdjacentHTML(
            "beforeend",
            `
            <tr>

                <td>${index + 1}</td>

                <td>${dept.department_name}</td>

                <td>${dept.short_name ?? ""}</td>

                <td>${dept.hod_name ?? ""}</td>

                <td>${dept.hod_email ?? ""}</td>

                <td>${dept.hod_mobile ?? ""}</td>

                <td>
                    <span class="badge ${dept.is_active ? "bg-success" : "bg-danger"}">
                        ${dept.is_active ? "Active" : "Inactive"}
                    </span>
                </td>

                <td>

    ${
        currentUser.role === "SUPER_ADMIN"

        ?

        `
        <button
            class="btn btn-sm btn-outline-primary edit-btn"
            data-id="${dept.id}">
            <i class="bi bi-pencil"></i>
        </button>
        `

        :

        ""

    }

</td>

            </tr>
            `
        );

    });

    document.querySelectorAll(".edit-btn").forEach(button => {

        button.addEventListener("click", () => {

            editDepartment(button.dataset.id);

        });

    });

}

/* ==========================================================
   EVENTS
========================================================== */

function attachEvents() {

    /* Logout */


    /* Add Department */

const btnAddDepartment =
    document.getElementById("btnAddDepartment");

if (btnAddDepartment) {

    if (currentUser.role === "SUPER_ADMIN") {

        btnAddDepartment.style.display = "";

        btnAddDepartment.addEventListener("click", () => {

            document.getElementById("departmentForm").reset();

            document.getElementById("departmentId").value = "";

            departmentModal.show();

        });

    } else {

        btnAddDepartment.style.display = "none";

    }

}
    const logoutBtn = document.getElementById("logoutBtn");

    if(logoutBtn){

        logoutBtn.addEventListener("click",async(e)=>{

            e.preventDefault();

            await logout();

        });

    }

    /* Search */

    const txtSearch = document.getElementById("txtSearch");

    if(txtSearch){

        txtSearch.addEventListener("keyup",()=>{

            const keyword = txtSearch.value
                .trim()
                .toLowerCase();

            const result = departments.filter(d=>{

                return (

                    d.department_name.toLowerCase().includes(keyword)

                    ||

                    (d.short_name ?? "")
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (d.hod_name ?? "")
                    .toLowerCase()
                    .includes(keyword)

                );

            });

            renderTable(result);

        });

    }

}

/* ==========================================================
   START
========================================================== */

/* ==========================================================
   ADD DEPARTMENT
========================================================== */

const departmentModal = new bootstrap.Modal(
    document.getElementById("departmentModal")
);



document
    .getElementById("departmentForm")
    .addEventListener("submit", saveDepartment);

async function saveDepartment(e) {

    e.preventDefault();

    const id = document.getElementById("departmentId").value;

    const payload = {

        department_name:
            document.getElementById("departmentName").value.trim(),

        short_name:
            document.getElementById("shortName").value.trim(),

        hod_name:
            document.getElementById("hodName").value.trim(),

        hod_email:
            document.getElementById("hodEmail").value.trim(),

        hod_mobile:
            document.getElementById("hodMobile").value.trim(),

        is_active:
            document.getElementById("isActive").value === "true"

    };

    let result;

    if (id === "") {

        result = await supabase
            .from("departments")
            .insert(payload);

    } else {

        result = await supabase
            .from("departments")
            .update(payload)
            .eq("id", id);

    }

    if (result.error) {

        alert(result.error.message);
        return;

    }

    departmentModal.hide();

    await loadDepartments();

}

async function editDepartment(id){

    const dept = departments.find(d => d.id === id);

    if(!dept) return;

    document.getElementById("departmentId").value = dept.id;
    document.getElementById("departmentName").value = dept.department_name;
    document.getElementById("shortName").value = dept.short_name || "";
    document.getElementById("hodName").value = dept.hod_name || "";
    document.getElementById("hodEmail").value = dept.hod_email || "";
    document.getElementById("hodMobile").value = dept.hod_mobile || "";
    document.getElementById("isActive").value = dept.is_active.toString();

    departmentModal.show();

}
initialize();