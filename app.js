// ============================================================
// IELTS WRITING PRACTICE - APP.JS
// ============================================================
//
// NO AI GRADING
//
// Google Sheet:
//
// Username | Task1 | Task2 | Score | Band | Writing1 | Writing2 | Test | SubmittedAt
//
// Features:
//
// - Test 1 - Test 8
// - JSON question loading
// - Task 1 image
// - 60-minute timer
// - Word counter
// - Submit Writing
// - Google Sheets storage
// - Score History by username
// - Manual Score / Band
//
// ============================================================


// ============================================================
// API
// ============================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwPNTZ7fv5bkv8vcSOdhZARB33C43AI-ezSgLpWEJLFtf2ewnMcKnMXuBGrecQWDD7I3Q/exec";


// ============================================================
// CONFIGURATION
// ============================================================

const TOTAL_TESTS =
  8;

const TEST_DURATION_SECONDS =
  60 * 60;

const TASK1_MIN_WORDS =
  150;

const TASK2_MIN_WORDS =
  250;


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentTest =
  null;

let currentTestNumber =
  null;

let task1Question =
  "";

let task2Question =
  "";

let task1Image =
  "";

let testStartTime =
  null;

let timerInterval =
  null;

let isSubmitting =
  false;


// ============================================================
// INITIALIZATION
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

  createHistoryInterface();

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

        submitWritingTest(
          false
        );

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
  // Task 1
  // ----------------------------------------------------------

  const task1Tab =
    document.getElementById(
      "task1Tab"
    );


  if (task1Tab) {

    task1Tab.addEventListener(
      "click",
      function () {

        switchTask(
          1
        );

      }
    );

  }


  // ----------------------------------------------------------
  // Task 2
  // ----------------------------------------------------------

  const task2Tab =
    document.getElementById(
      "task2Tab"
    );


  if (task2Tab) {

    task2Tab.addEventListener(
      "click",
      function () {

        switchTask(
          2
        );

      }
    );

  }


  // ----------------------------------------------------------
  // Task 1 word count
  // ----------------------------------------------------------

  const task1Answer =
    document.getElementById(
      "task1Answer"
    );


  if (task1Answer) {

    task1Answer.addEventListener(
      "input",
      function () {

        updateWordCount(
          1
        );

      }
    );

  }


  // ----------------------------------------------------------
  // Task 2 word count
  // ----------------------------------------------------------

  const task2Answer =
    document.getElementById(
      "task2Answer"
    );


  if (task2Answer) {

    task2Answer.addEventListener(
      "input",
      function () {

        updateWordCount(
          2
        );

      }
    );

  }

}


// ============================================================
// USERNAME
// ============================================================

function loadUsername() {

  const input =
    document.getElementById(
      "username"
    );


  if (!input) {
    return;
  }


  const keys = [

    "username",
    "Username",
    "studentUsername",
    "student_username",
    "loggedInUsername",
    "currentUsername"

  ];


  let username =
    "";


  for (
    let i = 0;
    i < keys.length;
    i++
  ) {

    const value =
      localStorage.getItem(
        keys[i]
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

    input.value =
      username;

    input.readOnly =
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


  const keys = [

    "username",
    "Username",
    "studentUsername",
    "student_username",
    "loggedInUsername",
    "currentUsername"

  ];


  for (
    let i = 0;
    i < keys.length;
    i++
  ) {

    const value =
      localStorage.getItem(
        keys[i]
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
// TEST LIST
// ============================================================

function populateTestList() {

  const select =
    document.getElementById(
      "testSelect"
    );


  if (!select) {
    return;
  }


  select.innerHTML =
    "";


  for (
    let i = 1;
    i <= TOTAL_TESTS;
    i++
  ) {

    const option =
      document.createElement(
        "option"
      );


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
// LOAD TEST JSON
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
        cache:
          "no-cache"
      }
    );


  if (!response.ok) {

    throw new Error(
      `Test${testNumber}.json could not be loaded.`
    );

  }


  return await response.json();

}


// ============================================================
// START TEST
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


    switchTask(
      1
    );


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

    setLoading(
      false
    );

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
      "Task 1 question was not found."
    );

  }


  if (!task2Question) {

    throw new Error(
      "Task 2 question was not found."
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

    const fields = [

      "question",
      "prompt",
      "task",
      "title",
      "text"

    ];


    for (
      let i = 0;
      i < fields.length;
      i++
    ) {

      const value =
        task[
          fields[i]
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
// EXTRACT IMAGE
// ============================================================

function extractImage(
  task
) {

  if (
    !task ||
    typeof task !==
      "object"
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


  updateWordCount(
    1
  );


  updateWordCount(
    2
  );


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
        "Could not load Task 1 image:",
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
// WORD COUNT
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

        return word.length >
          0;

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
// TIMER
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
    timerInterval !==
    null
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
    "Time is up. Your Writing test will be submitted automatically."
  );


  await submitWritingTest(
    true
  );

}


// ============================================================
// SUBMIT WRITING
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


  const task1Element =
    document.getElementById(
      "task1Answer"
    );


  const task2Element =
    document.getElementById(
      "task2Answer"
    );


  if (
    !task1Element ||
    !task2Element
  ) {

    showError(
      "Answer fields were not found."
    );

    return;

  }


  const task1Answer =
    task1Element.value.trim();


  const task2Answer =
    task2Element.value.trim();


  const task1Words =
    countWords(
      task1Answer
    );


  const task2Words =
    countWords(
      task2Answer
    );


  // ==========================================================
  // MANUAL CONFIRMATIONS
  // ==========================================================

  if (!automatic) {

    if (
      !task1Answer &&
      !task2Answer
    ) {

      if (
        !confirm(
          "Both Task 1 and Task 2 are empty.\n\nSubmit anyway?"
        )
      ) {

        return;

      }

    }


    else if (
      !task1Answer
    ) {

      if (
        !confirm(
          "Task 1 is empty.\n\nSubmit anyway?"
        )
      ) {

        switchTask(
          1
        );

        return;

      }

    }


    else if (
      !task2Answer
    ) {

      if (
        !confirm(
          "Task 2 is empty.\n\nSubmit anyway?"
        )
      ) {

        switchTask(
          2
        );

        return;

      }

    }


    if (
      task1Answer &&
      task1Words <
        TASK1_MIN_WORDS
    ) {

      if (
        !confirm(
          `Task 1 has only ${task1Words} words.\n\nMinimum recommended: 150 words.\n\nSubmit anyway?`
        )
      ) {

        switchTask(
          1
        );

        return;

      }

    }


    if (
      task2Answer &&
      task2Words <
        TASK2_MIN_WORDS
    ) {

      if (
        !confirm(
          `Task 2 has only ${task2Words} words.\n\nMinimum recommended: 250 words.\n\nSubmit anyway?`
        )
      ) {

        switchTask(
          2
        );

        return;

      }

    }


    if (
      !confirm(
        "Are you sure you want to submit your Writing test?\n\nYou will not be able to edit your answers after submission."
      )
    ) {

      return;

    }

  }


  // ==========================================================
  // SUBMISSION
  // ==========================================================

  isSubmitting =
    true;


  stopTimer();


  try {

    setLoading(
      true,
      "Saving your Writing..."
    );


    const payload = {

      action:
        "saveWriting",

      data: {

        username:
          username,

        testNumber:
          currentTestNumber,

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


    if (!response.ok) {

      throw new Error(
        `Server error: ${response.status}`
      );

    }


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

    } catch (error) {

      throw new Error(
        "The server returned an invalid response."
      );

    }


    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result.message ||
        "Writing submission failed."
      );

    }


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


    if (
      testStartTime &&
      !automatic
    ) {

      startTimer();

    }


    return;

  } finally {

    setLoading(
      false
    );

  }

}


// ============================================================
// DISPLAY RESULT
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


  isSubmitting =
    false;


  console.log(
    "Submission successful:",
    result
  );

}


// ============================================================
// BACK TO SETUP
// ============================================================

function backToSetup() {

  if (
    !confirm(
      "Leave this test?\n\nYour current answers will be lost."
    )
  ) {

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
// LOADING
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
// ERROR
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
// ============================================================
// SCORE HISTORY
// ============================================================
// ============================================================


// ============================================================
// CREATE HISTORY INTERFACE
// ============================================================
//
// We create the history UI dynamically.
// You don't need to add new HTML manually.
//
// ============================================================

function createHistoryInterface() {

  const setupScreen =
    document.getElementById(
      "setupScreen"
    );


  if (!setupScreen) {

    console.warn(
      "setupScreen not found. Score History UI was not created."
    );

    return;

  }


  // ----------------------------------------------------------
  // Prevent duplicate
  // ----------------------------------------------------------

  if (
    document.getElementById(
      "writingHistorySection"
    )
  ) {

    return;

  }


  // ----------------------------------------------------------
  // Add styles
  // ----------------------------------------------------------

  addHistoryStyles();


  // ----------------------------------------------------------
  // Create section
  // ----------------------------------------------------------

  const section =
    document.createElement(
      "div"
    );


  section.id =
    "writingHistorySection";


  section.className =
    "writing-history-section";


  section.innerHTML = `

    <div class="history-header">

      <h2>My Score History</h2>

      <p>
        View your previous IELTS Writing submissions and manually entered scores.
      </p>

    </div>

    <div class="history-controls">

      <button
        type="button"
        id="viewHistoryBtn"
        class="history-button"
      >
        View Score History
      </button>

    </div>

    <div
      id="historyLoading"
      class="history-loading"
      style="display:none;"
    >
      Loading score history...
    </div>

    <div
      id="historyError"
      class="history-error"
      style="display:none;"
    ></div>

    <div
      id="historyResults"
      class="history-results"
      style="display:none;"
    ></div>

  `;


  // ----------------------------------------------------------
  // Add after setup content
  // ----------------------------------------------------------

  setupScreen.appendChild(
    section
  );


  // ----------------------------------------------------------
  // Button
  // ----------------------------------------------------------

  const button =
    document.getElementById(
      "viewHistoryBtn"
    );


  if (button) {

    button.addEventListener(
      "click",
      loadScoreHistory
    );

  }

}


// ============================================================
// ADD HISTORY CSS
// ============================================================

function addHistoryStyles() {

  if (
    document.getElementById(
      "writingHistoryStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "writingHistoryStyles";


  style.textContent = `

    .writing-history-section {

      margin-top: 30px;

      padding: 24px;

      border-radius: 16px;

      background: rgba(255,255,255,0.04);

      border: 1px solid rgba(255,255,255,0.10);

    }


    .history-header h2 {

      margin: 0 0 8px;

      font-size: 22px;

    }


    .history-header p {

      margin: 0 0 18px;

      opacity: 0.75;

      line-height: 1.5;

    }


    .history-button {

      width: 100%;

      padding: 13px 18px;

      border: none;

      border-radius: 10px;

      cursor: pointer;

      font-size: 15px;

      font-weight: 600;

      background: #ffffff;

      color: #111111;

      transition: opacity 0.2s ease;

    }


    .history-button:hover {

      opacity: 0.85;

    }


    .history-loading {

      margin-top: 20px;

      padding: 15px;

      text-align: center;

      opacity: 0.8;

    }


    .history-error {

      margin-top: 20px;

      padding: 14px;

      border-radius: 10px;

      background: rgba(255, 70, 70, 0.12);

      border: 1px solid rgba(255, 70, 70, 0.3);

    }


    .history-results {

      margin-top: 24px;

    }


    .history-empty {

      padding: 20px;

      text-align: center;

      opacity: 0.75;

    }


    .history-title {

      margin-bottom: 16px;

      font-size: 18px;

      font-weight: 600;

    }


    .history-table-wrapper {

      width: 100%;

      overflow-x: auto;

      border-radius: 12px;

    }


    .history-table {

      width: 100%;

      border-collapse: collapse;

      min-width: 600px;

    }


    .history-table th,

    .history-table td {

      padding: 12px 10px;

      text-align: left;

      border-bottom: 1px solid rgba(255,255,255,0.10);

    }


    .history-table th {

      font-weight: 600;

      background: rgba(255,255,255,0.05);

    }


    .history-pending {

      opacity: 0.65;

    }


    .history-score {

      font-weight: 700;

    }


    .history-band {

      font-weight: 700;

    }


    .history-answer-button {

      padding: 7px 11px;

      border: 1px solid rgba(255,255,255,0.2);

      background: transparent;

      color: inherit;

      border-radius: 7px;

      cursor: pointer;

    }


    .history-answer-button:hover {

      background: rgba(255,255,255,0.08);

    }


    .history-answer-box {

      margin-top: 8px;

      padding: 14px;

      border-radius: 10px;

      background: rgba(0,0,0,0.18);

      white-space: pre-wrap;

      line-height: 1.6;

      max-height: 350px;

      overflow-y: auto;

    }


    @media (max-width: 600px) {

      .writing-history-section {

        padding: 18px;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


// ============================================================
// LOAD SCORE HISTORY
// ============================================================

async function loadScoreHistory() {

  const username =
    getUsername();


  if (!username) {

    showError(
      "Please enter your username first."
    );

    return;

  }


  const loading =
    document.getElementById(
      "historyLoading"
    );


  const error =
    document.getElementById(
      "historyError"
    );


  const results =
    document.getElementById(
      "historyResults"
    );


  if (loading) {

    loading.style.display =
      "block";

  }


  if (error) {

    error.style.display =
      "none";

    error.textContent =
      "";

  }


  if (results) {

    results.style.display =
      "none";

    results.innerHTML =
      "";

  }


  try {

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
                "getWritingHistory",

              data: {

                username:
                  username

              }

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        `Server error: ${response.status}`
      );

    }


    const responseText =
      await response.text();


    console.log(
      "Score history response:",
      responseText
    );


    let result;


    try {

      result =
        JSON.parse(
          responseText
        );

    } catch (parseError) {

      throw new Error(
        "The server returned an invalid history response."
      );

    }


    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result.message ||
        "Unable to load score history."
      );

    }


    displayScoreHistory(
      result.history ||
      [],
      username
    );


  } catch (err) {

    console.error(
      "History error:",
      err
    );


    if (error) {

      error.textContent =
        err.message ||
        "Unable to load score history.";

      error.style.display =
        "block";

    }

  } finally {

    if (loading) {

      loading.style.display =
        "none";

    }

  }

}


// ============================================================
// DISPLAY SCORE HISTORY
// ============================================================

function displayScoreHistory(
  history,
  username
) {

  const results =
    document.getElementById(
      "historyResults"
    );


  if (!results) {
    return;
  }


  results.style.display =
    "block";


  // ----------------------------------------------------------
  // No history
  // ----------------------------------------------------------

  if (
    !history ||
    history.length === 0
  ) {

    results.innerHTML = `

      <div class="history-empty">

        No Writing submissions were found for
        <strong>${escapeHtml(username)}</strong>.

      </div>

    `;


    return;

  }


  // ----------------------------------------------------------
  // Header
  // ----------------------------------------------------------

  let html = `

    <div class="history-title">

      Score History for
      <strong>${escapeHtml(username)}</strong>

    </div>

    <div class="history-table-wrapper">

      <table class="history-table">

        <thead>

          <tr>

            <th>Test</th>

            <th>Submitted</th>

            <th>Score</th>

            <th>Band</th>

            <th>Answers</th>

          </tr>

        </thead>

        <tbody>

  `;


  // ----------------------------------------------------------
  // Rows
  // ----------------------------------------------------------

  history.forEach(
    function (
      item,
      index
    ) {

      const score =
        item.score &&
        item.score.trim()
          ? item.score
          : "Pending";


      const band =
        item.band &&
        item.band.trim()
          ? item.band
          : "Pending";


      const test =
        item.test &&
        item.test.trim()
          ? item.test
          : "Writing";


      const submitted =
        item.submittedAt &&
        item.submittedAt.trim()
          ? formatHistoryDate(
              item.submittedAt
            )
          : "—";


      const scoreClass =
        score === "Pending"
          ? "history-pending"
          : "history-score";


      const bandClass =
        band === "Pending"
          ? "history-pending"
          : "history-band";


      html += `

        <tr>

          <td>
            ${escapeHtml(test)}
          </td>

          <td>
            ${escapeHtml(submitted)}
          </td>

          <td class="${scoreClass}">
            ${escapeHtml(score)}
          </td>

          <td class="${bandClass}">
            ${escapeHtml(band)}
          </td>

          <td>

            <button
              type="button"
              class="history-answer-button"
              data-history-index="${index}"
            >
              View
            </button>

          </td>

        </tr>

        <tr
          id="historyAnswerRow${index}"
          style="display:none;"
        >

          <td colspan="5">

            <div class="history-answer-box">

              <strong>Task 1</strong>

              <br><br>

              ${escapeHtml(
                item.writing1 ||
                "No Task 1 answer."
              )}

              <br><br>

              <strong>Task 2</strong>

              <br><br>

              ${escapeHtml(
                item.writing2 ||
                "No Task 2 answer."
              )}

            </div>

          </td>

        </tr>

      `;

    }
  );


  // ----------------------------------------------------------
  // Close table
  // ----------------------------------------------------------

  html += `

        </tbody>

      </table>

    </div>

  `;


  results.innerHTML =
    html;


  // ----------------------------------------------------------
  // View answer buttons
  // ----------------------------------------------------------

  const buttons =
    results.querySelectorAll(
      ".history-answer-button"
    );


  buttons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const index =
            Number(
              button.dataset.historyIndex
            );


          const row =
            document.getElementById(
              `historyAnswerRow${index}`
            );


          if (!row) {
            return;
          }


          const isHidden =
            row.style.display ===
            "none";


          row.style.display =
            isHidden
              ? "table-row"
              : "none";


          button.textContent =
            isHidden
              ? "Hide"
              : "View";

        }
      );

    }
  );

}


// ============================================================
// FORMAT HISTORY DATE
// ============================================================

function formatHistoryDate(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(
      value.replace(
        " ",
        "T"
      )
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return date.toLocaleString(
    undefined,
    {

      year:
        "numeric",

      month:
        "short",

      day:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit"

    }
  );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
  value
) {

  if (
    value ===
    null ||
    value ===
    undefined
  ) {

    return "";

  }


  return String(
    value
  )
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


window.loadScoreHistory =
  loadScoreHistory;


// ============================================================
// DEBUG
// ============================================================

console.log(
  "IELTS Writing app.js loaded."
);

console.log(
  "AI grading: DISABLED"
);

console.log(
  "Backend action for submissions: saveWriting"
);

console.log(
  "Backend action for history: getWritingHistory"
);

console.log(
  "API:",
  API_URL
);
