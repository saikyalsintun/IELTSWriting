// ============================================================
// IELTS WRITING - APP.JS
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwPNTZ7fv5bkv8vcSOdhZARB33C43AI-ezSgLpWEJLFtf2ewnMcKnMXuBGrecQWDD7I3Q/exec";


// ============================================================
// GLOBAL STATE
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
// INITIALIZE
// ============================================================

async function initializeWritingPage() {

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
  // Start test
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
  // Submit test
  // ----------------------------------------------------------

  const submitButton =
    document.getElementById(
      "submitTestBtn"
    );

  if (submitButton) {

    submitButton.addEventListener(
      "click",
      submitWritingTest
    );
  }


  // ----------------------------------------------------------
  // Back button
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
  // Task tabs
  // ----------------------------------------------------------

  const task1Tab =
    document.getElementById(
      "task1Tab"
    );

  const task2Tab =
    document.getElementById(
      "task2Tab"
    );


  if (task1Tab) {

    task1Tab.addEventListener(
      "click",
      function () {

        switchTask(1);

      }
    );
  }


  if (task2Tab) {

    task2Tab.addEventListener(
      "click",
      function () {

        switchTask(2);

      }
    );
  }


  // ----------------------------------------------------------
  // Answer input
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

    task1Answer.addEventListener(
      "input",
      function () {

        updateWordCount(1);

      }
    );
  }


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
// Test1.json -> Test 1
// Test2.json -> Test 2
// ...
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


    switchTask(
      1
    );


  } catch (error) {

    console.error(
      error
    );


    showError(
      error.message ||
      "Unable to load the test."
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
//
// Supports:
//
// {
//   "task1": {
//      "question": "...",
//      "image": "Writing/Images/Test1.png"
//   },
//   "task2": {
//      "question": "..."
//   }
// }
//
// OR
//
// {
//   "task1": "...",
//   "task2": "..."
// }
//
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


  // ----------------------------------------------------------
  // GET TASK 1 IMAGE
  // ----------------------------------------------------------

  task1Image = "";


  if (
    test &&
    test.task1 &&
    typeof test.task1 === "object" &&
    typeof test.task1.image === "string"
  ) {

    task1Image =
      test.task1.image.trim();
  }


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
// EXTRACT QUESTION TEXT
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


  // ----------------------------------------------------------
  // DISPLAY TASK 1 IMAGE
  // ----------------------------------------------------------

  displayTask1Image();


  // ----------------------------------------------------------
  // RESET ANSWERS
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
  // UPDATE TEST TITLE
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
//
// This creates the image container automatically.
// No HTML change is required.
//
// Example JSON:
//
// "image": "Writing/Images/Test1.png"
//
// ============================================================

function displayTask1Image() {

  const task1Element =
    document.getElementById(
      "task1Question"
    );


  if (!task1Element) {
    return;
  }


  // ----------------------------------------------------------
  // Remove old image container
  // ----------------------------------------------------------

  const oldContainer =
    document.getElementById(
      "task1ImageContainer"
    );


  if (oldContainer) {

    oldContainer.remove();
  }


  // ----------------------------------------------------------
  // If there is no image, stop
  // ----------------------------------------------------------

  if (!task1Image) {
    return;
  }


  // ----------------------------------------------------------
  // Create image container
  // ----------------------------------------------------------

  const imageContainer =
    document.createElement(
      "div"
    );


  imageContainer.id =
    "task1ImageContainer";


  imageContainer.style.width =
    "100%";


  imageContainer.style.margin =
    "20px 0";


  imageContainer.style.textAlign =
    "center";


  // ----------------------------------------------------------
  // Create image
  // ----------------------------------------------------------

  const image =
    document.createElement(
      "img"
    );


  image.src =
    task1Image;


  image.alt =
    "IELTS Writing Task 1 chart";


  image.style.display =
    "block";


  image.style.maxWidth =
    "100%";


  image.style.height =
    "auto";


  image.style.margin =
    "0 auto";


  image.style.borderRadius =
    "8px";


  image.style.objectFit =
    "contain";


  // ----------------------------------------------------------
  // Image error
  // ----------------------------------------------------------

  image.onerror =
    function () {

      console.error(
        "Task 1 image could not be loaded:",
        task1Image
      );


      imageContainer.innerHTML =
        "";


      const errorMessage =
        document.createElement(
          "p"
        );


      errorMessage.textContent =
        "Task 1 image could not be loaded.";


      errorMessage.style.padding =
        "20px";


      errorMessage.style.textAlign =
        "center";


      errorMessage.style.color =
        "#d9534f";


      imageContainer.appendChild(
        errorMessage
      );

    };


  // ----------------------------------------------------------
  // Add image
  // ----------------------------------------------------------

  imageContainer.appendChild(
    image
  );


  // ----------------------------------------------------------
  // Insert image AFTER question
  // ----------------------------------------------------------

  task1Element.insertAdjacentElement(
    "afterend",
    imageContainer
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
    .split(
      /\s+/
    )
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
// IELTS Writing = 60 minutes total.
//
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


  if (!automatic) {

    const task1Words =
      countWords(
        task1Answer
      );


    const task2Words =
      countWords(
        task2Answer
      );


    if (!task1Answer) {

      showError(
        "Please write your Task 1 answer."
      );


      switchTask(1);


      return;
    }


    if (!task2Answer) {

      showError(
        "Please write your Task 2 answer."
      );


      switchTask(2);


      return;
    }


    if (
      task1Words < 150
    ) {

      const continueAnyway =
        confirm(
          `Task 1 has only ${task1Words} words. IELTS Task 1 requires at least 150 words.\n\nSubmit anyway?`
        );


      if (!continueAnyway) {

        switchTask(1);

        return;
      }
    }


    if (
      task2Words < 250
    ) {

      const continueAnyway =
        confirm(
          `Task 2 has only ${task2Words} words. IELTS Task 2 requires at least 250 words.\n\nSubmit anyway?`
        );


      if (!continueAnyway) {

        switchTask(2);

        return;
      }
    }


    const confirmed =
      confirm(
        "Are you sure you want to submit your Writing test?\n\nYou will not be able to edit your answers after submission."
      );


    if (!confirmed) {
      return;
    }

  }


  isSubmitting =
    true;


  stopTimer();


  try {

    setLoading(
      true,
      "AI is grading your Writing..."
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify({

              action:
                "scoreWriting",

              data: {

                username:
                  username,

                task1Question:
                  task1Question,

                task1Answer:
                  task1Answer,

                task2Question:
                  task2Question,

                task2Answer:
                  task2Answer

              }

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        `Server returned HTTP ${response.status}.`
      );
    }


    const result =
      await response.json();


    if (
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Writing submission failed."
      );
    }


    displayResult(
      result.result
    );


  } catch (error) {

    console.error(
      "Submission error:",
      error
    );


    showError(
      error.message ||
      "Unable to submit your Writing test."
    );


    isSubmitting =
      false;


    if (
      testStartTime
    ) {

      startTimer();
    }


  } finally {

    setLoading(
      false
    );

  }

}


// ============================================================
// DISPLAY RESULT
// ============================================================

function displayResult(
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
      formatBand(
        result.task1
      );
  }


  if (task2Score) {

    task2Score.textContent =
      formatBand(
        result.task2
      );
  }


  if (score) {

    score.textContent =
      formatBand(
        result.score
      );
  }


  if (band) {

    band.textContent =
      formatBand(
        result.band
      );
  }


  showScreen(
    "resultScreen"
  );

}


// ============================================================
// FORMAT BAND
// ============================================================

function formatBand(
  value
) {

  const number =
    Number(value);


  if (
    Number.isNaN(
      number
    )
  ) {

    return value;
  }


  return number
    .toFixed(1);

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


  const imageContainer =
    document.getElementById(
      "task1ImageContainer"
    );


  if (imageContainer) {

    imageContainer.remove();
  }


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
// EXPORT GLOBAL FUNCTIONS
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
