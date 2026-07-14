import { isLoggedIn } from "./auth.js";

async function start() {

    const loggedIn = await isLoggedIn();

    if (loggedIn) {

        window.location = "pages/dashboard.html";

    } else {

        window.location = "login.html";

    }

}

start();