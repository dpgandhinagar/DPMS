import { supabase } from "./supabase.js";

/* =====================================================
   Load Logged User
===================================================== */

export async function loadUserLayout() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) return null;

    /* Navbar */

    const loggedUser = document.getElementById("loggedUser");

    if (loggedUser)
        loggedUser.innerText = profile.full_name;

    const loggedRole = document.getElementById("loggedRole");

    if (loggedRole)
        loggedRole.innerText = profile.role;

    /* Sidebar */

    const sidebarUserName =
        document.getElementById("sidebarUserName");

    if (sidebarUserName)
        sidebarUserName.innerText = profile.full_name;

    const sidebarUserRole =
        document.getElementById("sidebarUserRole");

    if (sidebarUserRole)
        sidebarUserRole.innerText = profile.role;

    /* Avatar */

    const avatar =
        document.getElementById("userAvatar");

    if (avatar) {

        avatar.innerText =
            profile.full_name
            .split(" ")
            .map(x => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

    }

    return profile;

}

/* =====================================================
   Mobile Sidebar
===================================================== */

export function initializeMobileMenu() {

    const sidebar =
        document.querySelector(".sidebar");

    const button =
        document.getElementById("menuToggle");

    if (!sidebar || !button) return;

    button.onclick = () => {

        sidebar.classList.toggle("show");

    };

}

/* =====================================================
   Highlight Current Page
===================================================== */

export function highlightCurrentMenu() {

    const current =
        window.location.pathname.split("/").pop();

    document
        .querySelectorAll(".sidebar-menu a")
        .forEach(link => {

            const href =
                link.getAttribute("href");

            if (!href) return;

            link.classList.remove("active");

            if (href.endsWith(current)) {

                link.classList.add("active");

            }

        });

}

/* =====================================================
   Initialize Layout
===================================================== */

/* =====================================================
   Initialize Layout
===================================================== */

async function loadComponent(id, file) {

    const response = await fetch(file);

    document.getElementById(id).innerHTML =
        await response.text();

}

export async function initializeLayout() {

    await loadComponent(
        "sidebar-container",
        "../components/sidebar.html"
    );

    await loadComponent(
        "navbar-container",
        "../components/navbar.html"
    );

    initializeMobileMenu();

    const profile = await loadUserLayout();

    highlightCurrentMenu();

    return profile;

}