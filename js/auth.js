/*****************************************************************
 FILE : js/auth.js
 MODULE : Authentication & User Profile
*****************************************************************/

import { supabase } from "./supabase.js";

/* ==========================================================
   LOGIN
========================================================== */

export async function login(email, password) {

    const { data, error } =
        await supabase.auth.signInWithPassword({

            email,
            password

        });

    if (error) throw error;

    return data;

}

/* ==========================================================
   LOGOUT
========================================================== */

export async function logout() {

    await supabase.auth.signOut();

    window.location = "../index.html";

}

/* ==========================================================
   AUTH USER
========================================================== */

export async function getCurrentUser() {

    const {

        data:{user}

    } = await supabase.auth.getUser();

    return user;

}

/* ==========================================================
   CURRENT PROFILE
========================================================== */

export async function getCurrentProfile() {

    const authUser = await getCurrentUser();

    if (!authUser) {

        window.location = "../index.html";

        return null;

    }

    const {

        data,

        error

    } = await supabase

        .from("profiles")

        .select("*")

        .eq("id", authUser.id)

        .single();

    if (error || !data) {

        await logout();

        alert(
            "Your profile has not been configured.\nPlease contact the System Administrator."
        );

        return null;

    }

    if (!data.is_active) {

        await logout();

        alert(
            "Your account has been disabled.\nPlease contact the System Administrator."
        );

        return null;

    }

    return {

        id: data.id,

        full_name: data.full_name,

        email: data.email,

        role: data.role,

        department_id: data.department_id,

        is_active: data.is_active

    };

}

/* ==========================================================
   LOGIN STATUS
========================================================== */

export async function isLoggedIn() {

    return (await getCurrentUser()) !== null;

}

/* ==========================================================
   ROLE PERMISSION
========================================================== */

export function requireRole(currentUser, ...roles) {

    if (!currentUser) {

        window.location.href = "../login.html";

        return false;

    }

    if (roles.includes(currentUser.role)) {

        return true;

    }

    alert("Access Denied.");

    window.location.href = "dashboard.html";

    return false;

}