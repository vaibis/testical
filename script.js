const STORAGE_KEY = "vai-score-tracker-v2";

let tests = loadTests();


const testsContainer =
  document.getElementById("testsContainer");

const emptyState =
  document.getElementById("emptyState");

const addTestBtn =
  document.getElementById("addTestBtn");

const testForm =
  document.getElementById("testForm");

const cancelTestBtn =
  document.getElementById("cancelTestBtn");

const createTestForm =
  document.getElementById("createTestForm");


/* =========================================================
   storage
========================================================= */

function loadTests() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;

  } catch (error) {

    console.error(
      "could not load saved tests:",
      error
    );

    return [];
  }
}


function saveTests() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tests)
  );
}


/* =========================================================
   utilities
========================================================= */

function number(value, fallback = 0) {

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function formatNumber(value) {

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "0";
  }

  if (Number.isInteger(n)) {
    return String(n);
  }

  return String(
    Number(n.toFixed(2))
  );
}


function getStatus(score, thresholds) {

  if (
    score >=
    Number(thresholds.green)
  ) {

    return {
      className: "good",
      label: "green"
    };

  }


  if (
    score >=
    Number(thresholds.yellow)
  ) {

    return {
      className: "almost",
      label: "yellow"
    };

  }


  return {
    className: "bad",
    label: "red"
  };
}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

  return escapeHTML(value);
}


/* =========================================================
   render everything
========================================================= */

function render() {

  testsContainer.innerHTML = "";


  emptyState.style.display =
    tests.length === 0
      ? "block"
      : "none";


  tests.forEach(
    (test, testIndex) => {

      testsContainer.appendChild(
        createTestCard(
          test,
          testIndex
        )
      );

    }
  );
}


/* =========================================================
   test card
========================================================= */

function createTestCard(
  test,
  testIndex
) {

  const card =
    document.createElement("article");


  card.className =
    "test-card";


  /*
    final score = sum of every paper score

    paper colors have absolutely no influence
    on this calculation.
  */

  const totalScore =
    test.papers.reduce(
      (sum, paper) =>
        sum + number(paper.score),
      0
    );


  const testStatus =
    getStatus(
      totalScore,
      test.thresholds
    );


  card.innerHTML = `

    <div class="test-header">

      <div class="test-title">

        <h2>
          ${escapeHTML(test.name)}
        </h2>

        <div class="test-meta">

          red &lt;
          ${formatNumber(
            test.thresholds.yellow
          )}

          · yellow ≥
          ${formatNumber(
            test.thresholds.yellow
          )}

          · green ≥
          ${formatNumber(
            test.thresholds.green
          )}

        </div>

      </div>


      <div class="test-actions">

        <div class="overall-score">

          <span>
            ${formatNumber(totalScore)}
          </span>

          <span
            class="status ${testStatus.className}"
          >
            ${testStatus.label}
          </span>

        </div>


        <button
          type="button"
          class="secondary-btn edit-test"
        >
          edit
        </button>


        <button
          type="button"
          class="danger-btn delete-test"
        >
          remove
        </button>

      </div>

    </div>


    <div class="papers"></div>


    <form class="add-paper">

      <div class="add-paper-title">
        add paper
      </div>


      <div class="add-paper-grid">

        <input
          name="name"
          type="text"
          placeholder="paper name"
          required
        >


        <input
          name="score"
          type="number"
          step="any"
          placeholder="score"
          required
        >


        <input
          name="red"
          type="number"
          step="any"
          value="0"
          placeholder="red"
          required
        >


        <input
          name="yellow"
          type="number"
          step="any"
          placeholder="yellow"
          required
        >


        <input
          name="green"
          type="number"
          step="any"
          placeholder="green"
          required
        >


        <button
          type="submit"
          class="primary-btn"
        >
          + paper
        </button>

      </div>

    </form>

  `;


  const papersContainer =
    card.querySelector(".papers");


  test.papers.forEach(
    (paper, paperIndex) => {

      papersContainer.appendChild(
        createPaperRow(
          test,
          paper,
          testIndex,
          paperIndex
        )
      );

    }
  );


  /* add paper */

  card
    .querySelector(".add-paper")
    .addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const form =
          event.currentTarget;


        const name =
          form.name.value.trim();


        const score =
          number(form.score.value);


        const red =
          number(form.red.value);


        const yellow =
          number(form.yellow.value);


        const green =
          number(form.green.value);


        if (!name) {
          return;
        }


        if (
          yellow < red
        ) {

          alert(
            "yellow threshold cannot be below red."
          );

          return;
        }


        if (
          green < yellow
        ) {

          alert(
            "green threshold cannot be below yellow."
          );

          return;
        }


        test.papers.push({

          id: crypto.randomUUID(),

          name,

          score,

          thresholds: {

            red,

            yellow,

            green

          }

        });


        saveTests();

        render();

      }
    );


  /* edit test */

  card
    .querySelector(".edit-test")
    .addEventListener(
      "click",
      () => {

        openEditTestModal(
          testIndex
        );

      }
    );


  /* remove test */

  card
    .querySelector(".delete-test")
    .addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            `remove "${test.name}" and all its papers?`
          );


        if (!confirmed) {
          return;
        }


        tests.splice(
          testIndex,
          1
        );


        saveTests();

        render();

      }
    );


  return card;
}


/* =========================================================
   paper row
========================================================= */

function createPaperRow(
  test,
  paper,
  testIndex,
  paperIndex
) {

  const row =
    document.createElement("div");


  row.className =
    "paper-row";


  const status =
    getStatus(
      number(paper.score),
      paper.thresholds
    );


  row.innerHTML = `

    <div class="paper-main">

      <div class="paper-name">

        ${escapeHTML(paper.name)}

      </div>


      <input
        class="paper-score"
        type="number"
        step="any"
        value="${escapeAttribute(
          paper.score
        )}"
        aria-label="score"
      >


      <div class="paper-status">

        <span
          class="status ${status.className}"
        >
          ${status.label}
        </span>

      </div>


      <div class="paper-thresholds">

        red &lt;
        ${formatNumber(
          paper.thresholds.yellow
        )}

        · yellow ≥
        ${formatNumber(
          paper.thresholds.yellow
        )}

        · green ≥
        ${formatNumber(
          paper.thresholds.green
        )}

      </div>

    </div>


    <div class="paper-details">

      score:
      ${formatNumber(paper.score)}

      · thresholds:
      ${formatNumber(paper.thresholds.red)}
      /
      ${formatNumber(paper.thresholds.yellow)}
      /
      ${formatNumber(paper.thresholds.green)}

      <button
        type="button"
        class="danger-btn remove-paper"
        style="float:right"
      >
        remove
      </button>

      <button
        type="button"
        class="secondary-btn edit-paper"
        style="float:right;margin-right:6px"
      >
        edit
      </button>

    </div>

  `;


  /* score editing */

  row
    .querySelector(".paper-score")
    .addEventListener(
      "change",
      event => {

        const value =
          number(
            event.target.value
          );


        tests[testIndex]
          .papers[paperIndex]
          .score = value;


        saveTests();

        render();

      }
    );


  /* edit paper */

  row
    .querySelector(".edit-paper")
    .addEventListener(
      "click",
      () => {

        openEditPaperModal(
          testIndex,
          paperIndex
        );

      }
    );


  /* remove paper */

  row
    .querySelector(".remove-paper")
    .addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            `remove "${paper.name}"?`
          );


        if (!confirmed) {
          return;
        }


        tests[testIndex]
          .papers
          .splice(
            paperIndex,
            1
          );


        saveTests();

        render();

      }
    );


  return row;
}


/* =========================================================
   create test
========================================================= */

addTestBtn.addEventListener(
  "click",
  () => {

    testForm.classList.remove(
      "hidden"
    );


    document
      .getElementById("testName")
      .focus();

  }
);


cancelTestBtn.addEventListener(
  "click",
  () => {

    testForm.classList.add(
      "hidden"
    );


    createTestForm.reset();


    document.getElementById(
      "testRed"
    ).value = 0;


    document.getElementById(
      "testYellow"
    ).value = 30;


    document.getElementById(
      "testGreen"
    ).value = 40;

  }
);


createTestForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const name =
      document
        .getElementById("testName")
        .value
        .trim();


    const red =
      number(
        document.getElementById(
          "testRed"
        ).value
      );


    const yellow =
      number(
        document.getElementById(
          "testYellow"
        ).value
      );


    const green =
      number(
        document.getElementById(
          "testGreen"
        ).value
      );


    if (!name) {
      return;
    }


    if (yellow < red) {

      alert(
        "yellow threshold cannot be below red."
      );

      return;
    }


    if (green < yellow) {

      alert(
        "green threshold cannot be below yellow."
      );

      return;
    }


    tests.push({

      id: crypto.randomUUID(),

      name,

      thresholds: {

        red,

        yellow,

        green

      },

      papers: []

    });


    saveTests();


    createTestForm.reset();


    document.getElementById(
      "testRed"
    ).value = 0;


    document.getElementById(
      "testYellow"
    ).value = 30;


    document.getElementById(
      "testGreen"
    ).value = 40;


    testForm.classList.add(
      "hidden"
    );


    render();

  }
);


/* =========================================================
   edit test modal
========================================================= */

function openEditTestModal(
  testIndex
) {

  const test =
    tests[testIndex];


  const backdrop =
    document.createElement("div");


  backdrop.className =
    "modal-backdrop";


  backdrop.innerHTML = `

    <div class="modal">

      <h2>
        edit test
      </h2>


      <p>
        change the test name or
        final-score thresholds.
      </p>


      <div class="field">

        <label>
          test name
        </label>

        <input
          id="editTestName"
          type="text"
          value="${escapeAttribute(
            test.name
          )}"
        >

      </div>


      <br>


      <div class="form-grid">

        <div class="field">

          <label>
            red below
          </label>

          <input
            id="editTestRed"
            type="number"
            step="any"
            value="${test.thresholds.red}"
          >

        </div>


        <div class="field">

          <label>
            yellow from
          </label>

          <input
            id="editTestYellow"
            type="number"
            step="any"
            value="${test.thresholds.yellow}"
          >

        </div>


        <div class="field">

          <label>
            green from
          </label>

          <input
            id="editTestGreen"
            type="number"
            step="any"
            value="${test.thresholds.green}"
          >

        </div>

      </div>


      <div class="modal-actions">

        <button
          type="button"
          class="secondary-btn"
          id="closeModal"
        >
          cancel
        </button>


        <button
          type="button"
          class="primary-btn"
          id="saveEdit"
        >
          save changes
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    backdrop
  );


  backdrop
    .querySelector("#closeModal")
    .addEventListener(
      "click",
      () => {

        backdrop.remove();

      }
    );


  backdrop
    .querySelector("#saveEdit")
    .addEventListener(
      "click",
      () => {

        const name =
          backdrop
            .querySelector(
              "#editTestName"
            )
            .value
            .trim();


        const red =
          number(
            backdrop
              .querySelector(
                "#editTestRed"
              )
              .value
          );


        const yellow =
          number(
            backdrop
              .querySelector(
                "#editTestYellow"
              )
              .value
          );


        const green =
          number(
            backdrop
              .querySelector(
                "#editTestGreen"
              )
              .value
          );


        if (!name) {

          alert(
            "test name cannot be empty."
          );

          return;
        }


        if (yellow < red) {

          alert(
            "yellow threshold cannot be below red."
          );

          return;
        }


        if (green < yellow) {

          alert(
            "green threshold cannot be below yellow."
          );

          return;
        }


        test.name =
          name;


        test.thresholds = {

          red,

          yellow,

          green

        };


        saveTests();


        backdrop.remove();

        render();

      }
    );

}


/* =========================================================
   edit paper modal
========================================================= */

function openEditPaperModal(
  testIndex,
  paperIndex
) {

  const paper =
    tests[testIndex]
      .papers[paperIndex];


  const backdrop =
    document.createElement("div");


  backdrop.className =
    "modal-backdrop";


  backdrop.innerHTML = `

    <div class="modal">

      <h2>
        edit paper
      </h2>


      <p>
        change the paper name,
        score, or thresholds.
      </p>


      <div class="field">

        <label>
          paper name
        </label>

        <input
          id="editPaperName"
          type="text"
          value="${escapeAttribute(
            paper.name
          )}"
        >

      </div>


      <br>


      <div class="form-grid">

        <div class="field">

          <label>
            score
          </label>

          <input
            id="editPaperScore"
            type="number"
            step="any"
            value="${paper.score}"
          >

        </div>


        <div class="field">

          <label>
            red below
          </label>

          <input
            id="editPaperRed"
            type="number"
            step="any"
            value="${paper.thresholds.red}"
          >

        </div>


        <div class="field">

          <label>
            yellow from
          </label>

          <input
            id="editPaperYellow"
            type="number"
            step="any"
            value="${paper.thresholds.yellow}"
          >

        </div>


        <div class="field">

          <label>
            green from
          </label>

          <input
            id="editPaperGreen"
            type="number"
            step="any"
            value="${paper.thresholds.green}"
          >

        </div>

      </div>


      <div class="modal-actions">

        <button
          type="button"
          class="secondary-btn"
          id="closePaperModal"
        >
          cancel
        </button>


        <button
          type="button"
          class="primary-btn"
          id="savePaperEdit"
        >
          save changes
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    backdrop
  );


  backdrop
    .querySelector(
      "#closePaperModal"
    )
    .addEventListener(
      "click",
      () => {

        backdrop.remove();

      }
    );


  backdrop
    .querySelector(
      "#savePaperEdit"
    )
    .addEventListener(
      "click",
      () => {

        const name =
          backdrop
            .querySelector(
              "#editPaperName"
            )
            .value
            .trim();


        const score =
          number(
            backdrop
              .querySelector(
                "#editPaperScore"
              )
              .value
          );


        const red =
          number(
            backdrop
              .querySelector(
                "#editPaperRed"
              )
              .value
          );


        const yellow =
          number(
            backdrop
              .querySelector(
                "#editPaperYellow"
              )
              .value
          );


        const green =
          number(
            backdrop
              .querySelector(
                "#editPaperGreen"
              )
              .value
          );


        if (!name) {

          alert(
            "paper name cannot be empty."
          );

          return;
        }


        if (yellow < red) {

          alert(
            "yellow threshold cannot be below red."
          );

          return;
        }


        if (green < yellow) {

          alert(
            "green threshold cannot be below yellow."
          );

          return;
        }


        paper.name =
          name;


        paper.score =
          score;


        paper.thresholds = {

          red,

          yellow,

          green

        };


        saveTests();


        backdrop.remove();

        render();

      }
    );

}


/* =========================================================
   startup
========================================================= */

render();