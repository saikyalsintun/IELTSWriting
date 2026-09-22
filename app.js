// ============================================================
// IELTS WRITING PRACTICE - APP.JS
// ============================================================
// NO AI GRADING
//
// Google Sheet columns:
//
// Username | Task1 | Task2 | Score | Band | Writing1 | Writing2
//
// The website sends only:
//
// Username
// Writing1
// Writing2
//
// Task1, Task2, Score and Band remain blank.
//
// ============================================================


// ============================================================
// GOOGLE APPS SCRIPT API
// ============================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwPNTZ7fv5bkv8vcSOdhZARB33C43AI-ezSgLpWEJLFtf2ewnMcKnMXuBGrecQWDD7I3Q/exec";


// ============================================================
// TEST CONFIGURATION
// ============================================================

const TOTAL_TESTS = 8;

const TEST_DURATION_SECONDS = 60 * 60;

const TASK1_MIN_WORDS = 150;

const TASK2_MIN_WORDS = 250;


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentTest = null;

let currentTestNumber = null;

let task1Question = "";

let task2Question = "";

let task1Image = "";

let testStartTime = null;

let timerInterval = null;

let isSubmitting = false;


// ============================================================
// PAGE INITIALIZATION
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeWritingPage();

  }
);


// ============================================================
// INITIALIZE PAGE
// ============================================================

function initializeWritingPage() {

  setupEventListeners();

  loadUsername();

  populateTestList();

  showScreen("setupScreen");

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

  // ----------------------------------------------------------
  // Start Test
  // ----------------------------------------------------------

  const startButton =
    document.getElementById("startTestBtn");

  if (startButton) {

    startButton.addEventListener(
      "click",
      startSelectedTest
    );

  }


  // ----------------------------------------------------------
  // Submit Test
  // ----------------------------------------------------------

  const submitButton =
    document.getElementById("submitTestBtn");

  if (submitButton) {

    submitButton.addEventListener(
      "click",
      function () {

        submitWritingTest(false);

      }
    );

  }


  // ----------------------------------------------------------
  // Back Button
  // ----------------------------------------------------------

  const backButton =
    document.getElementById("backBtn");

  if (backButton) {

    backButton.addEventListener(
      "click",
      backToSetup
    );

  }


  // ----------------------------------------------------------
  // Task 1 Tab
  // ----------------------------------------------------------

  const task1Tab =
    document.getElementById("task1Tab");

  if (task1Tab) {

    task1Tab.addEventListener(
      "click",
      function () {

        switchTask(1);

      }
    );

  }


  // ----------------------------------------------------------
  // Task 2 Tab
  // ----------------------------------------------------------

  const task2Tab =
    document.getElementById("task2Tab");

  if (task2Tab) {

    task2Tab.addEventListener(
      "click",
      function () {

        switchTask(2);

      }
    );

  }


  // ----------------------------------------------------------
  // Task 1 Answer
  // ----------------------------------------------------------

  const task1Answer =
    document.getElementById("task1Answer");

  if (task1Answer) {

    task1Answer.addEventListener(
      "input",
      function () {

        updateWordCount(1);

      }
    );

  }


  // ----------------------------------------------------------
  // Task 2 Answer
  // ----------------------------------------------------------

  const task2Answer =
    document.getElementById("task2Answer");

  if (task2Answer) {

    task2Answer.addEventListener(
      "input",
      function () {

        updateWordCount(2);

      }
    );

  }

}


// ============================================================
// USERNAME
// ============================================================

function loadUsername() {

  const usernameInput =
    document.getElementById("username");

  if (!usernameInput) {
    return;
  }


  const possibleKeys = [

    "username",
    "Username",
    "studentUsername",
    "student_username",
    "loggedInUsername",
    "currentUsername"

  ];


  let username = "";


  for (
    let i = 0;
    i < possibleKeys.length;
    i++
  ) {

    const value =
      localStorage.getItem(
        possibleKeys[i]
      );


    if (
      value &&
      value.trim()
    ) {

      username =
        value.trim();

      break;

    }

  }


  if (username) {

    usernameInput.value =
      username;

    usernameInput.readOnly =
      true;

  }

}


// ============================================================
// GET USERNAME
// ============================================================

function getUsername() {

  const usernameInput =
    document.getElementById("username");


  if (
    usernameInput &&
    usernameInput.value.trim()
  ) {

    return usernameInput.value.trim();

  }


  const possibleKeys = [

    "username",
    "Username",
    "studentUsername",
    "student_username",
    "loggedInUsername",
    "currentUsername"

  ];


  for (
    let i = 0;
    i < possibleKeys.length;
    i++
  ) {

    const value =
      localStorage.getItem(
        possibleKeys[i]
      );


    if (
      value &&
      value.trim()
    ) {

      return value.trim();

    }

  }


  return "";

}


// ============================================================
// POPULATE TEST LIST
// ============================================================
//
// Currently:
//
// Test1.json
// Test2.json
// ...
// Test8.json
//
// ============================================================

function populateTestList() {

  const select =
    document.getElementById("testSelect");


  if (!select) {
    return;
  }


  select.innerHTML = "";


  for (
    let i = 1;
    i <= TOTAL_TESTS;
    i++
  ) {

    const option =
      document.createElement("option");


    option.value =
      String(i);


    option.textContent =
      "Test " + i;


    select.appendChild(
      option
    );

  }

}


// ============================================================
// LOAD WRITING TEST JSON
// ============================================================

async function loadWritingTest(
  testNumber
) {

  const path =
    `Writing/Test${testNumber}.json`;


  const response =
    await fetch(
      path,
      {
        cache: "no-cache"
      }
    );


  if (!response.ok) {

    throw new Error(
      `Test${testNumber}.json could not be loaded.`
    );

  }


  const data =
    await response.json();


  return data;

}


// ============================================================
// START SELECTED TEST
// ============================================================

async function startSelectedTest() {

  if (isSubmitting) {
    return;
  }


  const select =
    document.getElementById("testSelect");


  if (!select) {

    showError(
      "Test selector was not found."
    );

    return;

  }


  const testNumber =
    Number(select.value);


  if (
    !testNumber ||
    testNumber < 1
  ) {

    showError(
      "Please select a test."
    );

    return;

  }


  const username =
    getUsername();


  if (!username) {

    showError(
      "Please enter your username."
    );

    return;

  }


  try {

    setLoading(
      true,
      "Loading Writing Test..."
    );


    const test =
      await loadWritingTest(
        testNumber
      );


    currentTest =
      test;


    currentTestNumber =
      testNumber;


    extractQuestions(
      test
    );


    displayTest();


    startTimer();


    showScreen(
      "testScreen"
    );


    switchTask(1);


  } catch (error) {

    console.error(
      "Test loading error:",
      error
    );


    showError(
      error.message ||
      "Unable to load the Writing test."
    );


  } finally {

    setLoading(false);

  }

}


// ============================================================
// EXTRACT QUESTIONS
// ============================================================

function extractQuestions(
  test
) {

  if (!test) {

    throw new Error(
      "Writing test data is empty."
    );

  }


  task1Question =
    extractQuestion(
      test.task1
    );


  task2Question =
    extractQuestion(
      test.task2
    );


  task1Image =
    extractImage(
      test.task1
    );


  if (!task1Question) {

    throw new Error(
      "Task 1 question was not found in the JSON file."
    );

  }


  if (!task2Question) {

    throw new Error(
      "Task 2 question was not found in the JSON file."
    );

  }

}


// ============================================================
// EXTRACT QUESTION
// ============================================================

function extractQuestion(
  task
) {

  if (!task) {
    return "";
  }


  // ----------------------------------------------------------
  // If task itself is a string
  // ----------------------------------------------------------

  if (
    typeof task ===
    "string"
  ) {

    return task.trim();

  }


  // ----------------------------------------------------------
  // If task is an object
  // ----------------------------------------------------------

  if (
    typeof task ===
    "object"
  ) {

    const possibleFields = [

      "question",
      "prompt",
      "task",
      "title",
      "text"

    ];


    for (
      let i = 0;
      i < possibleFields.length;
      i++
    ) {

      const field =
        possibleFields[i];


      const value =
        task[field];


      if (
        typeof value ===
        "string" &&
        value.trim()
      ) {

        return value.trim();

      }

    }

  }


  return "";

}


// ============================================================
// EXTRACT TASK 1 IMAGE
// ============================================================

function extractImage(
  task
) {

  if (
    !task ||
    typeof task !== "object"
  ) {

    return "";

  }


  if (
    typeof task.image ===
    "string"
  ) {

    return task.image.trim();

  }


  return "";

}


// ============================================================
// DISPLAY TEST
// ============================================================

function displayTest() {

  const task1Element =
    document.getElementById(
      "task1Question"
    );


  const task2Element =
    document.getElementById(
      "task2Question"
    );


  // ----------------------------------------------------------
  // Task 1 question
  // ----------------------------------------------------------

  if (task1Element) {

    task1Element.textContent =
      task1Question;

  }


  // ----------------------------------------------------------
  // Task 2 question
  // ----------------------------------------------------------

  if (task2Element) {

    task2Element.textContent =
      task2Question;

  }


  // ----------------------------------------------------------
  // Task 1 image
  // ----------------------------------------------------------

  displayTask1Image();


  // ----------------------------------------------------------
  // Clear previous answers
  // ----------------------------------------------------------

  const task1Answer =
    document.getElementById(
      "task1Answer"
    );


  const task2Answer =
    document.getElementById(
      "task2Answer"
    );


  if (task1Answer) {

    task1Answer.value =
      "";

  }


  if (task2Answer) {

    task2Answer.value =
      "";

  }


  updateWordCount(1);

  updateWordCount(2);


  // ----------------------------------------------------------
  // Test title
  // ----------------------------------------------------------

  const title =
    document.getElementById(
      "testTitle"
    );


  if (title) {

    title.textContent =
      "IELTS Writing Test " +
      currentTestNumber;

  }

}


// ============================================================
// DISPLAY TASK 1 IMAGE
// ============================================================

function displayTask1Image() {

  const questionElement =
    document.getElementById(
      "task1Question"
    );


  if (!questionElement) {
    return;
  }


  // ----------------------------------------------------------
  // Remove any previously created image
  // ----------------------------------------------------------

  const oldImage =
    document.getElementById(
      "task1QuestionImage"
    );


  if (oldImage) {

    oldImage.remove();

  }


  // ----------------------------------------------------------
  // No image
  // ----------------------------------------------------------

  if (!task1Image) {
    return;
  }


  // ----------------------------------------------------------
  // Create image
  // ----------------------------------------------------------

  const image =
    document.createElement("img");


  image.id =
    "task1QuestionImage";


  image.src =
    task1Image;


  image.alt =
    "IELTS Writing Task 1 chart or image";


  image.style.display =
    "block";


  image.style.maxWidth =
    "100%";


  image.style.width =
    "auto";


  image.style.height =
    "auto";


  image.style.margin =
    "20px auto";


  image.style.borderRadius =
    "8px";


  image.style.objectFit =
    "contain";


  image.onerror =
    function () {

      console.error(
        "Task 1 image could not be loaded:",
        task1Image
      );


      image.remove();

    };


  // ----------------------------------------------------------
  // Insert image after question
  // ----------------------------------------------------------

  questionElement.insertAdjacentElement(
    "afterend",
    image
  );

}


// ============================================================
// SWITCH BETWEEN TASK 1 AND TASK 2
// ============================================================

function switchTask(
  taskNumber
) {

  const task1Panel =
    document.getElementById(
      "task1Panel"
    );


  const task2Panel =
    document.getElementById(
      "task2Panel"
    );


  const task1Tab =
    document.getElementById(
      "task1Tab"
    );


  const task2Tab =
    document.getElementById(
      "task2Tab"
    );


  // ----------------------------------------------------------
  // Task 1
  // ----------------------------------------------------------

  if (task1Panel) {

    task1Panel.style.display =
      taskNumber === 1
        ? "block"
        : "none";

  }


  // ----------------------------------------------------------
  // Task 2
  // ----------------------------------------------------------

  if (task2Panel) {

    task2Panel.style.display =
      taskNumber === 2
        ? "block"
        : "none";

  }


  // ----------------------------------------------------------
  // Tabs
  // ----------------------------------------------------------

  if (task1Tab) {

    task1Tab.classList.toggle(
      "active",
      taskNumber === 1
    );

  }


  if (task2Tab) {

    task2Tab.classList.toggle(
      "active",
      taskNumber === 2
    );

  }

}


// ============================================================
// COUNT WORDS
// ============================================================

function countWords(
  text
) {

  if (!text) {
    return 0;
  }


  return text
    .trim()
    .split(/\s+/)
    .filter(
      function (word) {

        return word.length > 0;

      }
    )
    .length;

}


// ============================================================
// UPDATE WORD COUNT
// ============================================================

function updateWordCount(
  taskNumber
) {

  const textarea =
    document.getElementById(
      `task${taskNumber}Answer`
    );


  const counter =
    document.getElementById(
      `task${taskNumber}WordCount`
    );


  if (
    !textarea ||
    !counter
  ) {

    return;

  }


  const words =
    countWords(
      textarea.value
    );


  counter.textContent =
    words;


  const minimum =
    taskNumber === 1
      ? TASK1_MIN_WORDS
      : TASK2_MIN_WORDS;


  counter.classList.toggle(
    "under-limit",
    words > 0 &&
    words < minimum
  );


  counter.classList.toggle(
    "met-limit",
    words >= minimum
  );

}


// ============================================================
// START TIMER
// ============================================================

function startTimer() {

  stopTimer();


  testStartTime =
    Date.now();


  updateTimer(
    TEST_DURATION_SECONDS
  );


  timerInterval =
    setInterval(
      function () {

        if (!testStartTime) {
          return;
        }


        const elapsed =
          Math.floor(
            (
              Date.now() -
              testStartTime
            ) / 1000
          );


        const remaining =
          Math.max(
            0,
            TEST_DURATION_SECONDS -
            elapsed
          );


        updateTimer(
          remaining
        );


        if (
          remaining <= 0
        ) {

          stopTimer();


          autoSubmitWritingTest();

        }

      },
      1000
    );

}


// ============================================================
// UPDATE TIMER
// ============================================================

function updateTimer(
  seconds
) {

  const timer =
    document.getElementById(
      "timer"
    );


  if (!timer) {
    return;
  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remainingSeconds =
    seconds % 60;


  timer.textContent =
    `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;


  timer.classList.toggle(
    "warning",
    seconds <= 600
  );


  timer.classList.toggle(
    "danger",
    seconds <= 300
  );

}


// ============================================================
// STOP TIMER
// ============================================================

function stopTimer() {

  if (
    timerInterval !== null
  ) {

    clearInterval(
      timerInterval
    );


    timerInterval =
      null;

  }

}


// ============================================================
// AUTOMATIC SUBMISSION
// ============================================================

async function autoSubmitWritingTest() {

  alert(
    "Time is up. Your Writing test will be submitted automatically."
  );


  await submitWritingTest(
    true
  );

}


// ============================================================
// SUBMIT WRITING TEST
// ============================================================
//
// IMPORTANT:
//
// This function DOES NOT call:
//
// scoreWriting
// OpenAI
// AI grading
//
// It only calls:
//
// saveWriting
//
// ============================================================

async function submitWritingTest(
  automatic = false
) {

  // ----------------------------------------------------------
  // Prevent double submission
  // ----------------------------------------------------------

  if (isSubmitting) {

    return;

  }


  // ----------------------------------------------------------
  // Get username
  // ----------------------------------------------------------

  const username =
    getUsername();


  if (!username) {

    showError(
      "Username is required."
    );

    return;

  }


  // ----------------------------------------------------------
  // Get answer fields
  // ----------------------------------------------------------

  const task1AnswerElement =
    document.getElementById(
      "task1Answer"
    );


  const task2AnswerElement =
    document.getElementById(
      "task2Answer"
    );


  if (
    !task1AnswerElement ||
    !task2AnswerElement
  ) {

    showError(
      "Answer fields were not found."
    );

    return;

  }


  // ----------------------------------------------------------
  // Read answers
  // ----------------------------------------------------------

  const task1Answer =
    task1AnswerElement.value.trim();


  const task2Answer =
    task2AnswerElement.value.trim();


  // ----------------------------------------------------------
  // Count words
  // ----------------------------------------------------------

  const task1Words =
    countWords(
      task1Answer
    );


  const task2Words =
    countWords(
      task2Answer
    );


  // ==========================================================
  // MANUAL SUBMISSION CHECKS
  // ==========================================================

  if (!automatic) {

    // --------------------------------------------------------
    // BOTH EMPTY
    // --------------------------------------------------------

    if (
      !task1Answer &&
      !task2Answer
    ) {

      const confirmed =
        confirm(
          "Both Task 1 and Task 2 are empty.\n\nAre you sure you want to submit your Writing test?"
        );


      if (!confirmed) {

        return;

      }

    }


    // --------------------------------------------------------
    // TASK 1 EMPTY
    // --------------------------------------------------------

    else if (
      !task1Answer
    ) {

      const confirmed =
        confirm(
          "Task 1 is empty.\n\nAre you sure you want to submit your Writing test?"
        );


      if (!confirmed) {

        switchTask(1);

        return;

      }

    }


    // --------------------------------------------------------
    // TASK 2 EMPTY
    // --------------------------------------------------------

    else if (
      !task2Answer
    ) {

      const confirmed =
        confirm(
          "Task 2 is empty.\n\nAre you sure you want to submit your Writing test?"
        );


      if (!confirmed) {

        switchTask(2);

        return;

      }

    }


    // --------------------------------------------------------
    // TASK 1 WORD COUNT
    // --------------------------------------------------------

    if (
      task1Answer &&
      task1Words < TASK1_MIN_WORDS
    ) {

      const confirmed =
        confirm(
          `Task 1 has only ${task1Words} words.\n\nIELTS Task 1 requires at least 150 words.\n\nSubmit anyway?`
        );


      if (!confirmed) {

        switchTask(1);

        return;

      }

    }


    // --------------------------------------------------------
    // TASK 2 WORD COUNT
    // --------------------------------------------------------

    if (
      task2Answer &&
      task2Words < TASK2_MIN_WORDS
    ) {

      const confirmed =
        confirm(
          `Task 2 has only ${task2Words} words.\n\nIELTS Task 2 requires at least 250 words.\n\nSubmit anyway?`
        );


      if (!confirmed) {

        switchTask(2);

        return;

      }

    }


    // --------------------------------------------------------
    // FINAL CONFIRMATION
    // --------------------------------------------------------

    const confirmed =
      confirm(
        "Are you sure you want to submit your Writing test?\n\nYou will not be able to edit your answers after submission."
      );


    if (!confirmed) {

      return;

    }

  }


  // ==========================================================
  // BEGIN SUBMISSION
  // ==========================================================

  isSubmitting =
    true;


  stopTimer();


  try {

    setLoading(
      true,
      "Saving your Writing..."
    );


    // ========================================================
    // SEND ONLY saveWriting
    // ========================================================

    const payload = {

      action:
        "saveWriting",

      data: {

        username:
          username,

        task1Answer:
          task1Answer,

        task2Answer:
          task2Answer

      }

    };


    console.log(
      "Sending Writing submission:",
      payload
    );


    const response =
      await fetch(
        API_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    // ========================================================
    // CHECK HTTP RESPONSE
    // ========================================================

    if (!response.ok) {

      throw new Error(
        `Server error: ${response.status}`
      );

    }


    // ========================================================
    // READ RESPONSE
    // ========================================================

    const responseText =
      await response.text();


    console.log(
      "Apps Script response:",
      responseText
    );


    let result;


    try {

      result =
        JSON.parse(
          responseText
        );

    } catch (parseError) {

      console.error(
        "Invalid JSON response:",
        responseText
      );


      throw new Error(
        "The server returned an invalid response."
      );

    }


    // ========================================================
    // BACKEND ERROR
    // ========================================================

    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "Writing submission failed."
      );

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "Writing submission saved successfully:",
      result
    );


    displaySubmissionResult(
      result.result
    );


  } catch (error) {

    console.error(
      "Submission error:",
      error
    );


    showError(
      error.message ||
      "Unable to save your Writing test."
    );


    isSubmitting =
      false;


    // --------------------------------------------------------
    // Restart timer if manual submission failed
    // --------------------------------------------------------

    if (
      testStartTime &&
      !automatic
    ) {

      startTimer();

    }

    return;

  } finally {

    setLoading(false);

  }

}


// ============================================================
// DISPLAY SUBMISSION RESULT
// ============================================================
//
// There is NO AI SCORE.
//
// Everything is pending until the teacher manually marks it.
//
// ============================================================

function displaySubmissionResult(
  result
) {

  const task1Score =
    document.getElementById(
      "resultTask1"
    );


  const task2Score =
    document.getElementById(
      "resultTask2"
    );


  const score =
    document.getElementById(
      "resultScore"
    );


  const band =
    document.getElementById(
      "resultBand"
    );


  if (task1Score) {

    task1Score.textContent =
      "Pending";

  }


  if (task2Score) {

    task2Score.textContent =
      "Pending";

  }


  if (score) {

    score.textContent =
      "Pending";

  }


  if (band) {

    band.textContent =
      "Pending";

  }


  showScreen(
    "resultScreen"
  );


  // ----------------------------------------------------------
  // Keep result in console for debugging
  // ----------------------------------------------------------

  console.log(
    "Submission result:",
    result
  );

}


// ============================================================
// BACK TO SETUP
// ============================================================

function backToSetup() {

  const confirmed =
    confirm(
      "Leave this test?\n\nYour current answers will be lost."
    );


  if (!confirmed) {

    return;

  }


  stopTimer();


  currentTest =
    null;


  currentTestNumber =
    null;


  task1Question =
    "";


  task2Question =
    "";


  task1Image =
    "";


  testStartTime =
    null;


  isSubmitting =
    false;


  showScreen(
    "setupScreen"
  );

}


// ============================================================
// SHOW SCREEN
// ============================================================

function showScreen(
  screenId
) {

  const screens =
    document.querySelectorAll(
      ".screen"
    );


  screens.forEach(
    function (screen) {

      screen.style.display =
        screen.id === screenId
          ? "block"
          : "none";

    }
  );

}


// ============================================================
// LOADING OVERLAY
// ============================================================

function setLoading(
  loading,
  message
) {

  const overlay =
    document.getElementById(
      "loadingOverlay"
    );


  const messageElement =
    document.getElementById(
      "loadingMessage"
    );


  if (!overlay) {
    return;
  }


  if (messageElement) {

    messageElement.textContent =
      message ||
      "Loading...";

  }


  overlay.style.display =
    loading
      ? "flex"
      : "none";

}


// ============================================================
// ERROR MESSAGE
// ============================================================

function showError(
  message
) {

  console.error(
    "Writing website error:",
    message
  );


  const errorElement =
    document.getElementById(
      "errorMessage"
    );


  if (errorElement) {

    errorElement.textContent =
      message;


    errorElement.style.display =
      "block";


    setTimeout(
      function () {

        errorElement.style.display =
          "none";

      },
      6000
    );


    return;

  }


  alert(
    message
  );

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.startSelectedTest =
  startSelectedTest;


window.submitWritingTest =
  submitWritingTest;


window.switchTask =
  switchTask;


window.backToSetup =
  backToSetup;


window.updateWordCount =
  updateWordCount;


// ============================================================
// DEBUG INFORMATION
// ============================================================

console.log(
  "IELTS Writing app.js loaded."
);


console.log(
  "AI grading: DISABLED"
);


console.log(
  "Backend action: saveWriting"
);


console.log(
  "API URL:",
  API_URL
);
