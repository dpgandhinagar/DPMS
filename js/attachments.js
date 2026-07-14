/*****************************************************************
 FILE : js/attachments.js
 VERSION : 1.0
 MODULE : Attachments
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

let weeklyPlanId = null;

let actionItemId = null;

let parentModule = "";

let attachments = [];

const uploadModal =
    new bootstrap.Modal(
        document.getElementById("uploadModal")
    );

/* ==========================================================
   LOAD COMPONENTS
========================================================== */

async function loadComponent(id, file) {

    const response = await fetch(file);

    document.getElementById(id).innerHTML =
        await response.text();

}

/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

    await loadComponent(
        "sidebar-container",
        "../components/sidebar.html"
    );

    await loadComponent(
        "navbar-container",
        "../components/navbar.html"
    );

    await checkLogin();

    weeklyPlanId =
        new URLSearchParams(window.location.search)
        .get("plan");

    actionItemId =
        new URLSearchParams(window.location.search)
        .get("action");

    if (weeklyPlanId) {

        parentModule = "Weekly Plan";

        await loadWeeklyPlan();

    }

    else if (actionItemId) {

        parentModule = "Action Item";

        await loadActionItem();

    }

    else {

        alert("Invalid attachment request.");

        history.back();

        return;

    }

    await loadAttachments();

    attachEvents();

}

/* ==========================================================
   LOGIN
========================================================== */

async function checkLogin() {

    const {

        data:{user}

    } = await supabase.auth.getUser();

    if(!user){

        window.location="../login.html";

        return;

    }

    currentUser=user;

    const {

        data:profile

    } = await supabase

        .from("profiles")

        .select("full_name")

        .eq("id",user.id)

        .single();

    if(profile){

        const lbl =
            document.getElementById("loggedUser");

        if(lbl){

            lbl.innerHTML=

            `<i class="bi bi-person-circle"></i>

            ${profile.full_name}`;

        }

    }

}

/* ==========================================================
   LOAD WEEKLY PLAN
========================================================== */

async function loadWeeklyPlan(){

    const {data,error}=await supabase

        .from("weekly_plans")

        .select("title")

        .eq("id",weeklyPlanId)

        .single();

    if(error){

        alert(error.message);

        return;

    }

    document.getElementById("parentModule")
        .innerText="Weekly Plan";

    document.getElementById("parentTitle")
        .innerText=data.title;

}

/* ==========================================================
   LOAD ACTION ITEM
========================================================== */

async function loadActionItem(){

    const {data,error}=await supabase

        .from("action_items")

        .select("activity_title")

        .eq("id",actionItemId)

        .single();

    if(error){

        alert(error.message);

        return;

    }

    document.getElementById("parentModule")
        .innerText="Action Item";

    document.getElementById("parentTitle")
        .innerText=data.activity_title;

}

/* ==========================================================
   LOAD ATTACHMENTS
========================================================== */

async function loadAttachments(){

    let query = supabase

        .from("attachments")

        .select("*")

        .order("uploaded_at",{

            ascending:false

        });

    if(weeklyPlanId){

        query=query.eq(
            "weekly_plan_id",
            weeklyPlanId
        );

    }

    if(actionItemId){

        query=query.eq(
            "action_item_id",
            actionItemId
        );

    }

    const {

        data,

        error

    }=await query;

    if(error){

        alert(error.message);

        return;

    }

    attachments=data;

    renderTable();

}

/* ==========================================================
   TABLE
========================================================== */

function renderTable(){

    const tbody =
        document.getElementById("attachmentTable");

    tbody.innerHTML="";

    attachments.forEach((file,index)=>{

        tbody.insertAdjacentHTML(

            "beforeend",

            `

<tr>

<td>${index+1}</td>

<td>

${file.file_name}

</td>

<td>

${file.file_type}

</td>

<td>

${Math.round(file.file_size/1024)} KB

</td>

<td>

${new Date(file.uploaded_at)
.toLocaleDateString()}

</td>

<td>

<button

class="btn btn-sm btn-outline-success downloadBtn"

data-id="${file.id}">

<i class="bi bi-download"></i>

</button>

<button

class="btn btn-sm btn-outline-danger deleteBtn"

data-id="${file.id}">

<i class="bi bi-trash"></i>

</button>

</td>

</tr>

`

        );

    });

}

/* ==========================================================
   UPLOAD
========================================================== */

function newUpload() {

    document.getElementById("uploadForm").reset();

    uploadModal.show();

}

/* ==========================================================
   SAVE ATTACHMENT
========================================================== */

async function uploadAttachment(e){

    e.preventDefault();

    const fileInput =
        document.getElementById("attachmentFile");

    if(fileInput.files.length===0){

        alert("Please select a file.");

        return;

    }

    const file=fileInput.files[0];

    const attachmentType=
        document.getElementById("attachmentType").value;

    let bucketName="";

    switch(attachmentType){

        case "planning":

            bucketName="planning-files";

            break;

        case "progress":

            bucketName="progress-files";

            break;

        case "photo":

            bucketName="activity-photos";

            break;

    }

    let folder="";

    if(weeklyPlanId){

        folder=`weekly-plans/${weeklyPlanId}`;

    }else{

        folder=`action-items/${actionItemId}`;

    }

    const storagePath=
        `${folder}/${Date.now()}_${file.name}`;

    /* Upload File */

    const {

        error:uploadError

    } = await supabase.storage

        .from(bucketName)

        .upload(storagePath,file,{

            upsert:false

        });

    if(uploadError){

        alert(uploadError.message);

        return;

    }

    /* Save Database */

    const {

        error:dbError

    } = await supabase

        .from("attachments")

        .insert({

            weekly_plan_id:weeklyPlanId,

            action_item_id:actionItemId,

            bucket_name:bucketName,

            file_name:file.name,

            file_path:storagePath,

            file_size:file.size,

            file_type:file.type,

            uploaded_by:currentUser.id

        });

    if(dbError){

        alert(dbError.message);

        return;

    }

    uploadModal.hide();

    await loadAttachments();

}

/* ==========================================================
   DOWNLOAD
========================================================== */

async function downloadAttachment(id){

    const file =
        attachments.find(x=>x.id===id);

    if(!file) return;

    const {

        data,

        error

    } = await supabase.storage

        .from(file.bucket_name)

        .createSignedUrl(

            file.file_path,

            300

        );

    if(error){

        alert(error.message);

        return;

    }

    window.open(data.signedUrl,"_blank");

}

/* ==========================================================
   DELETE
========================================================== */

async function deleteAttachment(id){

    if(!confirm("Delete this attachment?"))

        return;

    const file =
        attachments.find(x=>x.id===id);

    if(!file) return;

    /* Delete Storage */

    const {

        error:storageError

    } = await supabase.storage

        .from(file.bucket_name)

        .remove([file.file_path]);

    if(storageError){

        alert(storageError.message);

        return;

    }

    /* Delete Database */

    const {

        error:dbError

    } = await supabase

        .from("attachments")

        .delete()

        .eq("id",id);

    if(dbError){

        alert(dbError.message);

        return;

    }

    await loadAttachments();

}

/* ==========================================================
   EVENTS
========================================================== */

function attachEvents(){

    document

        .getElementById("btnUpload")

        .addEventListener(

            "click",

            newUpload

        );

    document

        .getElementById("uploadForm")

        .addEventListener(

            "submit",

            uploadAttachment

        );

    document

        .addEventListener(

            "click",

            function(e){

                const downloadBtn=
                    e.target.closest(".downloadBtn");

                if(downloadBtn){

                    downloadAttachment(

                        downloadBtn.dataset.id

                    );

                    return;

                }

                const deleteBtn=
                    e.target.closest(".deleteBtn");

                if(deleteBtn){

                    deleteAttachment(

                        deleteBtn.dataset.id

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