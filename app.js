// ============================================================
// IELTS WRITING - APP.JS
// ============================================================
// No AI grading.
//
// Student submission is saved to Google Sheets:
//
// Username | Task1 | Task2 | Score | Band | Writing1 | Writing2
//
// Score and Band are left blank for manual marking.
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwPNTZ7fv5bkv8vcSOdhZARB33C43AI-ezSgLpWEJLFtf2ewnMcKnMXuBGrecQWDD7I3Q/exec";


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

  showScreen(
    "setupScreen"
  );

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

  // ----------------------------------------------------------
  // Start Test
  // ----------------------------------------------------------

  const startButton =
    document.getElementById(
      "startTestBtn"
    );

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
    document.getElementById(
      "submitTestBtn"
    );

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
    document.getElementById(
      "backBtn"
    );

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
    document.getElementById(
      "task1Tab"
    );

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
    document.getElementById(
      "task2Tab"
    );

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
    document.getElementById(
      "task1Answer"
    );

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
    document.getElementById(
      "task2Answer"
    );

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
    document.getElementById(
      "username"
    );


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


    if (value) {

      username =
        value;

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

  const input =
    document.getElementById(
      "username"
    );


  if (
    input &&
    input.value.trim()
  ) {

    return input.value.trim();

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


    if (value) {

      return value.trim();

    }

  }


  return "";

}


// ============================================================
// POPULATE TEST LIST
// ============================================================
//
// Currently supports Test1.json through Test8.json.
//
// ============================================================

function populateTestList() {

  const select =
    document.getElementById(
      "testSelect"
    );


  if (!select) {
    return;
  }


  select.innerHTML = "";


  for (
    let i = 1;
    i <= 8;
    i++
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      i;


    option.textContent =
      "Test " + i;


    select.appendChild(
      option
    );

  }

}


// ============================================================
// LOAD WRITING JSON
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
    document.getElementById(
      "testSelect"
    );


  if (!select) {

    showError(
      "Test selector was not found."
    );

    return;

  }


  const testNumber =
    Number(
      select.value
    );


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
      "Unable to load the test."
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


  if (
    typeof task ===
    "string"
  ) {

    return task.trim();

  }


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

      const value =
        task[
          possibleFields[i]
        ];


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


  if (task1Element) {

    task1Element.textContent =
      task1Question;

  }


  if (task2Element) {

    task2Element.textContent =
      task2Question;

  }


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

    task1Answer.value = "";

  }


  if (task2Answer) {

    task2Answer.value = "";

  }


  updateWordCount(1);

  updateWordCount(2);


  // ----------------------------------------------------------
  // Test Title
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


  // Remove previous image
  const oldImage =
    document.getElementById(
      "task1QuestionImage"
    );


  if (oldImage) {

    oldImage.remove();

  }


  if (!task1Image) {
    return;
  }


  const image =
    document.createElement(
      "img"
    );


  image.id =
    "task1QuestionImage";


  image.src =
    task1Image;


  image.alt =
    "IELTS Writing Task 1 image";


  image.style.display =
    "block";


  image.style.maxWidth =
    "100%";


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


  questionElement.insertAdjacentElement(
    "afterend",
    image
  );

}


// ============================================================
// SWITCH TASK
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


  if (task1Panel) {

    task1Panel.style.display =
      taskNumber === 1
        ? "block"
        : "none";

  }


  if (task2Panel) {

    task2Panel.style.display =
      taskNumber === 2
        ? "block"
        : "none";

  }


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
      word =>
        word.length > 0
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
      ? 150
      : 250;


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
//
// IELTS Writing = 60 minutes.
// ============================================================

function startTimer() {

  stopTimer();


  testStartTime =
    Date.now();


  const duration =
    60 * 60;


  updateTimer(
    duration
  );


  timerInterval =
    setInterval(
      function () {

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
            duration -
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
// AUTO SUBMIT
// ============================================================

async function autoSubmitWritingTest() {

  alert(
    "Time is up. Your Writing test will be submitted."
  );


  await submitWritingTest(
    true
  );

}


// ============================================================
// SUBMIT WRITING TEST
// ============================================================
//
// No AI grading.
//
// The answers are sent to Apps Script.
//
// Apps Script stores:
//
// Username
// Task1
// Task2
// Score
// Band
// Writing1
// Writing2
//
// Score and Band remain blank.
// ============================================================

async function submitWritingTest(
  automatic = false
) {

  if (isSubmitting) {
    return;
  }


  const username =
    getUsername();


  if (!username) {

    showError(
      "Username is required."
    );

    return;

  }


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


  const task1Answer =
    task1AnswerElement.value.trim();


  const task2Answer =
    task2AnswerElement.value.trim();


  const task1Words =
    countWords(
      task1Answer
    );


  const task2Words =
    countWords(
      task2Answer
    );


  // ==========================================================
  // MANUAL SUBMISSION
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
      task1Words < 150
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
      task2Words < 250
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
  // SUBMISSION START
  // ==========================================================

  isSubmitting =
    true;


  stopTimer();


  try {

    setLoading(
      true,
      "Saving your Writing..."
    );


    // --------------------------------------------------------
    // SEND TO GOOGLE APPS SCRIPT
    // --------------------------------------------------------

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
            JSON.stringify({

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

            })

        }
      );


    // --------------------------------------------------------
    // HTTP ERROR
    // --------------------------------------------------------

    if (!response.ok) {

      throw new Error(
        `Server error: ${response.status}`
      );

    }


    // --------------------------------------------------------
    // READ JSON RESPONSE
    // --------------------------------------------------------

    const result =
      await response.json();


    // --------------------------------------------------------
    // BACKEND ERROR
    // --------------------------------------------------------

    if (
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Writing submission failed."
      );

    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

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


    // Restart timer if submission failed.
    if (
      testStartTime &&
      !automatic
    ) {

      startTimer();

    }

  } finally {

    setLoading(false);

  }

}


// ============================================================
// DISPLAY SUBMISSION RESULT
// ============================================================
//
// There is NO automatic score.
//
// The student sees:
//
// Task 1: Pending
// Task 2: Pending
// Score: Pending
// Band: Pending
//
// The teacher can later enter Score and Band.
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
