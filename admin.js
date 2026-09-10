/* =========================================================
   SCE CYCLE HIRE
   ADMIN JAVASCRIPT
========================================================= */


const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyXrCXOsVqgwcINVic74Zh6RFSqjb5Li2-jLNjRnuycgI1JsffPt99ntUs1LectWiMT/exec";


let adminPassword = "";

let allBookings = [];


/* =========================================================
   LOGIN
========================================================= */

async function login() {

    const passwordInput =
        document.getElementById(
            "adminPassword"
        );


    const password =
        passwordInput.value.trim();


    if (!password) {

        alert(
            "Please enter the admin password."
        );

        return;

    }


    try {

        const url =
            GOOGLE_SCRIPT_URL +
            "?action=stats" +
            "&password=" +
            encodeURIComponent(password);


        const response =
            await fetch(url);


        const result =
            await response.json();


        if (!result.success) {

            alert(
                "Invalid admin password."
            );

            return;

        }


        adminPassword =
            password;


        sessionStorage.setItem(
            "sceAdminPassword",
            password
        );


        document
            .getElementById(
                "loginScreen"
            )
            .classList
            .add("hidden");


        document
            .getElementById(
                "dashboard"
            )
            .classList
            .remove("hidden");


        loadAll();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the Google Sheet backend."
        );

    }

}


/* =========================================================
   AUTO LOGIN
========================================================= */

window.addEventListener(
    "load",
    function() {

        const saved =
            sessionStorage.getItem(
                "sceAdminPassword"
            );


        if (saved) {

            adminPassword =
                saved;


            document
                .getElementById(
                    "loginScreen"
                )
                .classList
                .add("hidden");


            document
                .getElementById(
                    "dashboard"
                )
                .classList
                .remove("hidden");


            loadAll();

        }

    }
);


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadAll() {

    await Promise.all([
        loadStats(),
        loadBookings()
    ]);

}


/* =========================================================
   LOAD STATS
========================================================= */

async function loadStats() {

    try {

        const url =
            GOOGLE_SCRIPT_URL +
            "?action=stats" +
            "&password=" +
            encodeURIComponent(
                adminPassword
            );


        const response =
            await fetch(url);


        const result =
            await response.json();


        if (!result.success) {

            logout();

            return;

        }


        document.getElementById(
            "totalBookings"
        ).textContent =
            result.totalBookings;


        document.getElementById(
            "todayBookings"
        ).textContent =
            result.todayBookings;


        document.getElementById(
            "ongoingBookings"
        ).textContent =
            result.ongoing;


        document.getElementById(
            "earnings"
        ).textContent =
            "Nu. " +
            Number(
                result.earnings
            ).toLocaleString();


        const cycleStatus =
            document.getElementById(
                "adminCycleStatus"
            );


        cycleStatus.textContent =
            result.cycleStatus;


        if (
            result.cycleStatus ===
            "Available"
        ) {

            cycleStatus.style.color =
                "#16a34a";

        } else {

            cycleStatus.style.color =
                "#dc2626";

        }

    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   LOAD BOOKINGS
========================================================= */

async function loadBookings() {

    try {

        const url =
            GOOGLE_SCRIPT_URL +
            "?action=bookings" +
            "&password=" +
            encodeURIComponent(
                adminPassword
            );


        const response =
            await fetch(url);


        const result =
            await response.json();


        if (!result.success) {

            logout();

            return;

        }


        allBookings =
            result.bookings.reverse();


        renderBookings(
            allBookings
        );

    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   RENDER BOOKINGS
========================================================= */

function renderBookings(bookings) {

    const table =
        document.getElementById(
            "bookingTable"
        );


    table.innerHTML = "";


    if (bookings.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="text-align:center;padding:40px;"
                >

                    No bookings found.

                </td>

            </tr>

        `;

        return;

    }


    bookings.forEach(
        function(booking) {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                String(
                    booking.status || "Pending"
                )
                .toLowerCase();


            row.innerHTML = `

                <td>

                    <span class="booking-id">

                        ${escapeHtml(
                            booking.bookingId
                        )}

                    </span>

                </td>


                <td>

                    <strong>

                        ${escapeHtml(
                            booking.studentName
                        )}

                    </strong>

                    <br>

                    <small>

                        ${escapeHtml(
                            booking.studentId
                        )}

                    </small>

                </td>


                <td>

                    ${escapeHtml(
                        booking.hireDate
                    )}

                </td>


                <td>

                    ${escapeHtml(
                        booking.startTime
                    )}

                </td>


                <td>

                    ${booking.hours} hr

                </td>


                <td>

                    Nu.
                    ${Number(
                        booking.total
                    ).toLocaleString()}

                </td>


                <td>

                    <span
                        class="status status-${status}"
                    >

                        ${escapeHtml(
                            booking.status
                        )}

                    </span>

                </td>


                <td>

                    <select
                        class="action-select"
                        onchange="changeStatus(
                            '${escapeJs(
                                booking.bookingId
                            )}',
                            this.value
                        )"
                    >

                        <option value="">
                            Action
                        </option>

                        <option value="Approved">
                            Approve
                        </option>

                        <option value="Ongoing">
                            Start Hire
                        </option>

                        <option value="Returned">
                            Returned
                        </option>

                        <option value="Cancelled">
                            Cancel
                        </option>

                    </select>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(
    bookingId,
    status
) {

    if (!status) {
        return;
    }


    const confirmed =
        confirm(
            `Change booking ${bookingId} to ${status}?`
        );


    if (!confirmed) {

        loadBookings();

        return;

    }


    try {

        const formData =
            new URLSearchParams();


        formData.append(
            "action",
            "update_status"
        );


        formData.append(
            "password",
            adminPassword
        );


        formData.append(
            "bookingId",
            bookingId
        );


        formData.append(
            "status",
            status
        );


        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(
                result.message ||
                "Unable to update booking."
            );

            return;

        }


        showToast(
            "Booking updated successfully."
        );


        loadAll();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the backend."
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function filterBookings() {

    const query =
        document.getElementById(
            "searchBox"
        )
        .value
        .toLowerCase()
        .trim();


    if (!query) {

        renderBookings(
            allBookings
        );

        return;

    }


    const filtered =
        allBookings.filter(
            function(booking) {

                return (

                    String(
                        booking.bookingId
                    )
                    .toLowerCase()
                    .includes(query)

                    ||

                    String(
                        booking.studentName
                    )
                    .toLowerCase()
                    .includes(query)

                    ||

                    String(
                        booking.studentId
                    )
                    .toLowerCase()
                    .includes(query)

                    ||

                    String(
                        booking.phone
                    )
                    .toLowerCase()
                    .includes(query)

                );

            }
        );


    renderBookings(
        filtered
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function showDashboard() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function showBookings() {

    document
        .querySelector(
            ".booking-section"
        )
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    sessionStorage.removeItem(
        "sceAdminPassword"
    );


    adminPassword = "";


    document
        .getElementById(
            "dashboard"
        )
        .classList
        .add("hidden");


    document
        .getElementById(
            "loginScreen"
        )
        .classList
        .remove("hidden");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        function() {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


/* =========================================================
   SECURITY HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeJs(value) {

    return String(value || "")
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );

}