import { supabase } from "./supabase.js";

/* ==========================================================
   Activity Logger
========================================================== */

export async function logActivity({

    activityType,
    description,
    referenceTable = null,
    referenceId = null,
    profile,
    metadata = {}

}) {

    if (!profile) return;

    const { error } = await supabase
        .from("activity_log")
        .insert({

            activity_type: activityType,

            description: description,

            user_id: profile.id,

            department_id: profile.department_id,

            reference_table: referenceTable,

            reference_id: referenceId,

            metadata: metadata

        });

   if (error) {

    alert(error.message);

    console.error(error);

} else {

    alert("Activity Logged");

}

}