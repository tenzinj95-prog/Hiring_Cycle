/* =========================================================
   SCE CYCLE HIRE
   Student Booking System
   ========================================================= */

const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyXrCXOsVqgwcINVic74Zh6RFSqjb5Li2-jLNjRnuycgI1JsffPt99ntUs1LectWiMT/exec";

const HOURLY_RATE = 100;


// =========================================================
// ELEMENTS
// =========================================================

const bookingForm = document.getElementById("bookingForm");

const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const programme = document.getElementById("programme");
const phone = document.getElementById("phone");

const hireDate = document.getElementById("hireDate");
const startTime = document.getElementById("startTime");
const hours = document.getElementById("hours");

const pickup = document.getElementById("pickup");
const purpose = document.getElementById("purpose");

const agreement = document.getElementById("agreement");

const totalAmount = document.getElementById("totalAmount");
const durationText = document.getElementById("durationText");

const availabilityMessage =
    document.getElementById("availabilityMessage");

const submitButton =
    document.getElementById("submitButton");

const successBox =
    document.getElementById("successBox");

const bookingIdResult =
    document.getElementById("bookingIdResult");

const clientBookingId =
    document.getElementById("clientBookingId");

const submitFrame =
    document.getElementById("submitFrame");

const cycleStatus =
    document.getElementById("cycleStatus");


// =========================================================
// VARIABLES
// =========================================================

let isCheckingAvailability = false;
let isSubmitting = false;
let lastAvailabilityResult = null;


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    setMinimumDate();

    calculateTotal();

    updateCycleStatus();

    setupEvents();

});


// =========================================================
// SETUP EVENTS
// =========================================================

function setupEvents() {

    if (hours) {
        hours.addEventListener("change", () => {
            calculateTotal();
            checkAvailability();
        });
    }


    if (hireDate) {
        hireDate.addEventListener("change", () => {
            checkAvailability();
        });
    }


    if (startTime) {
        startTime.addEventListener("change", () => {
            checkAvailability();
        });
    }


    if (bookingForm) {

        bookingForm.addEventListener(
            "submit",
            handleFormSubmit
        );

    }


    /*
        When Google Apps Script responds inside the iframe,
        the iframe load event fires.

        We only use this after a real submission has started.
    */

    if (submitFrame) {

        submitFrame.addEventListener("load", () => {

            if (!isSubmitting) {
                return;
            }

            showBookingSuccess();

        });

    }

}


// =========================================================
// MINIMUM DATE
// =========================================================

function setMinimumDate() {

    if (!hireDate) {
        return;
    }

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;

    hireDate.min = todayString;

}


// =========================================================
// CALCULATE TOTAL
// =========================================================

function calculateTotal() {

    const selectedHours =
        Number(hours?.value || 0);

    const total =
        selectedHours * HOURLY_RATE;


    if (durationText) {

        if (selectedHours === 1) {

            durationText.textContent =
                "1 hour";

        } else {

            durationText.textContent =
                `${selectedHours} hours`;

        }

    }


    if (totalAmount) {

        totalAmount.textContent =
            `Nu. ${total.toLocaleString()}`;

    }

}


// =========================================================
// CHECK AVAILABILITY
// =========================================================

async function checkAvailability() {

    const date = hireDate?.value;
    const time = startTime?.value;
    const selectedHours = hours?.value;


    if (!date || !time || !selectedHours) {

        availabilityMessage.textContent = "";

        lastAvailabilityResult = null;

        return;

    }


    if (isCheckingAvailability) {
        return;
    }


    isCheckingAvailability = true;


    availabilityMessage.textContent =
        "Checking availability...";

    availabilityMessage.className =
        "availability-message checking";


    try {

        const url =
            `${APPS_SCRIPT_URL}` +
            `?action=availability` +
            `&date=${encodeURIComponent(date)}` +
            `&startTime=${encodeURIComponent(time)}` +
            `&hours=${encodeURIComponent(selectedHours)}`;


        const response =
            await fetch(url, {
                method: "GET",
                cache: "no-store"
            });


        const result =
            await response.json();


        lastAvailabilityResult = result;


        if (result.available === true) {

            availabilityMessage.textContent =
                "✓ This time is available.";

            availabilityMessage.className =
                "availability-message available";

        } else {

            availabilityMessage.textContent =
                "✕ This time is already booked. Please choose another time.";

            availabilityMessage.className =
                "availability-message unavailable";

        }


    } catch (error) {

        console.error(
            "Availability check error:",
            error
        );


        /*
            We don't block the booking because
            Google Apps Script will perform the final
            availability check again before saving.
        */

        lastAvailabilityResult = null;

        availabilityMessage.textContent =
            "Availability could not be checked. The system will verify it when you submit.";

        availabilityMessage.className =
            "availability-message checking";

    }


    isCheckingAvailability = false;

}


// =========================================================
// GENERATE CLIENT BOOKING ID
// =========================================================

function generateBookingId() {

    const now = new Date();

    const year =
        now.getFullYear();

    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );

    return `CY-${year}-${random}`;

}


// =========================================================
// FORM SUBMISSION
// =========================================================

function handleFormSubmit(event) {

    /*
        IMPORTANT:

        Do NOT use event.preventDefault()
        and then form.submit() blindly without
        setting the form action.

        The form already contains:

        action = Google Apps Script URL
        method = POST
        target = submitFrame

        Therefore the normal browser form submission
        is exactly what we want.
    */


    if (isSubmitting) {

        event.preventDefault();

        return;

    }


    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!bookingForm.checkValidity()) {

        event.preventDefault();

        bookingForm.reportValidity();

        return;

    }


    const selectedHours =
        Number(hours.value);


    if (
        !selectedHours ||
        selectedHours < 1 ||
        selectedHours > 12
    ) {

        event.preventDefault();

        alert(
            "Please select a valid number of hours."
        );

        return;

    }


    if (!hireDate.value) {

        event.preventDefault();

        alert(
            "Please select the hire date."
        );

        return;

    }


    if (!startTime.value) {

        event.preventDefault();

        alert(
            "Please select the start time."
        );

        return;

    }


    if (!agreement.checked) {

        event.preventDefault();

        alert(
            "Please accept the agreement before booking."
        );

        return;

    }


    // =====================================================
    // CHECK CLIENT-SIDE AVAILABILITY RESULT
    // =====================================================

    if (
        lastAvailabilityResult &&
        lastAvailabilityResult.available === false
    ) {

        event.preventDefault();

        alert(
            "This time is already booked. Please choose another time."
        );

        return;

    }


    // =====================================================
    // CREATE TEMPORARY REFERENCE ID
    // =====================================================

    const temporaryId =
        generateBookingId();


    clientBookingId.value =
        temporaryId;


    /*
        This ID is used as the student's immediate
        reference number.

        The Google Apps Script backend also creates
        its own official Booking ID when the row
        is stored in Google Sheets.
    */


    // =====================================================
    // SUBMISSION STATE
    // =====================================================

    isSubmitting = true;

    submitButton.disabled = true;

    submitButton.textContent =
        "Submitting booking...";


    availabilityMessage.textContent =
        "Submitting your booking...";

    availabilityMessage.className =
        "availability-message checking";


    /*
        IMPORTANT:

        We DO NOT call event.preventDefault().

        The browser will now submit the form to:

        Google Apps Script URL

        using POST and the hidden submitFrame.
    */

}


// =========================================================
// SHOW SUCCESS
// =========================================================

function showBookingSuccess() {

    if (!isSubmitting) {
        return;
    }


    isSubmitting = false;


    const referenceId =
        clientBookingId.value ||
        generateBookingId();


    bookingIdResult.textContent =
        referenceId;


    if (bookingForm) {

        bookingForm.style.display =
            "none";

    }


    if (successBox) {

        successBox.classList.remove(
            "hidden"
        );

    }


    submitButton.disabled =
        false;

    submitButton.textContent =
        "🚲 Book Cycle";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =========================================================
// NEW BOOKING
// =========================================================

function newBooking() {

    isSubmitting = false;

    lastAvailabilityResult = null;


    if (bookingForm) {

        bookingForm.reset();

        bookingForm.style.display =
            "";

    }


    if (successBox) {

        successBox.classList.add(
            "hidden"
        );

    }


    if (clientBookingId) {

        clientBookingId.value =
            "";

    }


    if (availabilityMessage) {

        availabilityMessage.textContent =
            "";

        availabilityMessage.className =
            "availability-message";

    }


    if (durationText) {

        durationText.textContent =
            "0 hours";

    }


    if (totalAmount) {

        totalAmount.textContent =
            "Nu. 0";

    }


    submitButton.disabled =
        false;

    submitButton.textContent =
        "🚲 Book Cycle";


    setMinimumDate();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =========================================================
// UPDATE CYCLE STATUS
// =========================================================

function updateCycleStatus() {

    if (!cycleStatus) {
        return;
    }


    /*
        The system has only ONE cycle.
        The backend is responsible for the real
        booking availability.
    */

    cycleStatus.textContent =
        "Available";

}


// =========================================================
// SERVICE WORKER
// =========================================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("service-worker.js")
                .then(() => {

                    console.log(
                        "Service Worker registered."
                    );

                })
                .catch((error) => {

                    console.log(
                        "Service Worker registration failed:",
                        error
                    );

                });

        }
    );

}