/*****************************************************************
 FILE : js/services/dashboardService.js
 MODULE : Dashboard Service
*****************************************************************/

import { supabase } from "../supabase.js";

/* ==========================================================
   KPI SUMMARY
========================================================== */

export async function getDashboardSummary() {

    const { data, error } = await supabase

        .from("dashboard_summary")

        .select()

        .single();

    if (error) throw error;

    return data;

}

/* ==========================================================
   WEEKLY PLAN STATUS
========================================================== */

export async function getWeeklyPlanStatus() {

    const { data, error } = await supabase

        .from("weekly_plan_status_summary")

        .select()

        .single();

    if (error) throw error;

    return data;

}

/* ==========================================================
   ACTION ITEM STATUS
========================================================== */

export async function getActionItemStatus() {

    const { data, error } = await supabase

        .from("action_item_status_summary")

        .select()

        .single();

    if (error) throw error;

    return data;

}

/* ==========================================================
   DEPARTMENT PERFORMANCE
========================================================== */

export async function getDepartmentPerformance() {

    const { data, error } = await supabase

        .from("department_performance_summary")

        .select("*")

        .order("completion_percent", {

            ascending: false

        });

    if (error) throw error;

    return data;

}

/* ==========================================================
   EXECUTIVE ALERTS
========================================================== */

export async function getExecutiveAlerts() {

    const { data, error } = await supabase

        .from("executive_alerts_summary")

        .select()

        .single();

    if (error) throw error;

    return data;

}

/* ==========================================================
   DISTRICT ACTIVITY FEED
========================================================== */

export async function getDistrictActivityFeed(limit = 10) {

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

        .limit(limit);

    if (error) throw error;

    return data;

}

/* ==========================================================
   LOAD ENTIRE DASHBOARD
========================================================== */

export async function loadDashboardData() {

    const [

        summary,

        weeklyPlans,

        actionItems,

        performance,

        alerts,

        activity

    ] = await Promise.all([

        getDashboardSummary(),

        getWeeklyPlanStatus(),

        getActionItemStatus(),

        getDepartmentPerformance(),

        getExecutiveAlerts(),

        getDistrictActivityFeed()

    ]);

    return {

        summary,

        weeklyPlans,

        actionItems,

        performance,

        alerts,

        activity

    };

}
