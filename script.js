/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   SCRIPT.JS - VERSION 59
   OCR + TRANSLATION API FIX
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const TRANSLATE_API =
  "https://script.google.com/macros/s/AKfycbyv4x3GhyXGKGQvWfmh-lKForJ_OV7BVtoglDGsGjtNYID8cf1Lwkog3rk3ROLJJsng/exec";

const TESSERACT_URL =
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

let sourceLanguage = "th";
let targetLanguage = "en";

let selectedImageFile = null;
let selectedImageUrl = null;

let ocrWorker = null;
let workerLoading = null;

let ocrRunning = false;
let translationRunning = false;


/* =========================================================
   DOM
   ========================================================= */

const inputText =
  document.getElementById("inputText");

const resultText =
  document.getElementById("resultText");

const translateButton =
  document.getElementById("translateButton");

const cameraButton =
  document.getElementById("cameraButton");

const galleryButton =
  document.getElementById("galleryButton");

const cameraInput =
  document.getElementById("cameraInput");

const galleryInput =
  document.getElementById("galleryInput");

const imagePreviewContainer =
  document.getElementById("imagePreviewContainer");

const imagePreview =
  document.getElementById("imagePreview");

const removeImageButton =
  document.getElementById("removeImageButton");

const ocrCard =
  document.getElementById("ocrCard");

const ocrText =
  document.getElementById("ocrText");

const speakOcrButton =
  document.getElementById("speakOcrButton");

const useOcrButton =
  document.getElementById("useOcrButton");

const speakResultButton =
  document.getElementById("speakResultButton");

const copyResultButton =
  document.getElementById("copyResultButton");

const clearInputButton =
  document.getElementById("clearInputButton");

const swapLanguageButton =
  document.getElementById("swapLanguageButton");

const sourceLanguageText =
  document.getElementById("sourceLanguageText");

const targetLanguageText =
  document.getElementById("targetLanguageText");

const statusMessage =
  document.getElementById("statusMessage");

const loadingBox =
  document.getElementById("loadingBox");

const loadingText =
  document.getElementById("loadingText");


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateLanguageUI();
    bindEvents();

  }
);


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  if (
    cameraButton &&
    cameraInput
  ) {

    cameraButton.addEventListener(
      "click",
      () => cameraInput.click()
    );

  }


  if (
    galleryButton &&
    galleryInput
  ) {

    galleryButton.addEventListener(
      "click",
      () => galleryInput.click()
    );

  }


  if (cameraInput) {

    cameraInput.addEventListener(
      "change",
      handleImageSelected
    );

  }


  if (galleryInput) {

    galleryInput.addEventListener(
      "change",
      handleImageSelected
    );

  }


  if (removeImageButton) {

    removeImageButton.addEventListener(
      "click",
      removeImage
    );

  }


  if (translateButton) {

    translateButton.addEventListener(
      "click",
      translateText
    );

  }


  if (useOcrButton) {

    useOcrButton.addEventListener(
      "click",
      useOCRText
    );

  }


  if (speakOcrButton) {

    speakOcrButton.addEventListener(
      "click",
      () => {

        speakText(
          ocrText
            ? ocrText.value
            : ""
        );

      }
    );

  }


  if (speakResultButton) {

    speakResultButton.addEventListener(
      "click",
      () => {

        speakText(
          resultText
            ? resultText.textContent
            : ""
        );

      }
    );

  }


  if (copyResultButton) {

    copyResultButton.addEventListener(
      "click",
      copyResult
    );

  }


  if (clearInputButton) {

    clearInputButton.addEventListener(
      "click",
      clearInput
    );

  }


  if (swapLanguageButton) {

    swapLanguageButton.addEventListener(
      "click",
      swapLanguages
    );

  }

}


/* =========================================================
   LANGUAGE UI
   ========================================================= */

function updateLanguageUI() {

  if (sourceLanguageText) {

    sourceLanguageText.textContent =
      sourceLanguage === "th"
        ? "ภาษาไทย"
        : "English";

  }


  if (targetLanguageText) {

    targetLanguageText.textContent =
      targetLanguage === "th"
        ? "ภาษาไทย"
        : "English";

  }

}


/* =========================================================
   SWAP LANGUAGE
   ========================================================= */

function swapLanguages() {

  const oldSource =
    sourceLanguage;

  sourceLanguage =
    targetLanguage;

  targetLanguage =
    oldSource;

  updateLanguageUI();

  showStatus(
    "สลับภาษาแล้ว",
    "success"
  );

}


/* =========================================================
   IMAGE SELECT
   ========================================================= */

function handleImageSelected(
  event
) {

  const file =
    event &&
    event.target &&
    event.target.files &&
    event.target.files[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showStatus(
      "กรุณาเลือกไฟล์รูปภาพ",
      "error"
    );

    return;
  }

  selectedImageFile =
    file;

  if (selectedImageUrl) {

    URL.revokeObjectURL(
      selectedImageUrl
    );

  }

  selectedImageUrl =
    URL.createObjectURL(
      file
    );

  if (imagePreview) {

    imagePreview.src =
      selectedImageUrl;

  }

  if (imagePreviewContainer) {

    imagePreviewContainer.hidden =
      false;

  }

  const fromCamera =
    event.target ===
    cameraInput;

  startOCR(
    file,
    fromCamera
  );

}


/* =========================================================
   REMOVE IMAGE
   ========================================================= */

function removeImage() {

  selectedImageFile =
    null;

  if (selectedImageUrl) {

    URL.revokeObjectURL(
      selectedImageUrl
    );

    selectedImageUrl =
      null;

  }

  if (imagePreview) {

    imagePreview.removeAttribute(
      "src"
    );

  }

  if (imagePreviewContainer) {

    imagePreviewContainer.hidden =
      true;

  }

  if (ocrCard) {

    ocrCard.hidden =
      true;

  }

  if (ocrText) {

    ocrText.value =
      "";

  }

  if (cameraInput) {

    cameraInput.value =
      "";

  }

  if (galleryInput) {

    galleryInput.value =
      "";

  }

}


/* =========================================================
   LOAD TESSERACT
   ========================================================= */

async function loadTesseract() {

  if (
    window.Tesseract
  ) {

    return window.Tesseract;

  }

  return new Promise(
    (resolve, reject) => {

      const oldScript =
        document.querySelector(
          'script[data-tesseract-loader="true"]'
        );

      if (oldScript) {

        oldScript.addEventListener(
          "load",
          () => {

            if (
              window.Tesseract
            ) {

              resolve(
                window.Tesseract
              );

            } else {

              reject(
                new Error(
                  "โหลด Tesseract ไม่สำเร็จ"
                )
              );

            }

          }
        );

        oldScript.addEventListener(
          "error",
          () => {

            reject(
              new Error(
                "โหลด Tesseract ไม่สำเร็จ"
              )
            );

          }
        );

        return;

      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        TESSERACT_URL;

      script.async =
        true;

      script.dataset.tesseractLoader =
        "true";

      script.onload =
        () => {

          if (
            window.Tesseract
          ) {

            resolve(
              window.Tesseract
            );

          } else {

            reject(
              new Error(
                "ไม่พบ Tesseract.js"
              )
            );

          }

        };

      script.onerror =
        () => {

          reject(
            new Error(
              "ไม่สามารถโหลด Tesseract.js ได้"
            )
          );

        };

      document.head.appendChild(
        script
      );

    }
  );

}


/* =========================================================
   SINGLE OCR WORKER
   ========================================================= */

async function getOCRWorker() {

  if (ocrWorker) {

    return ocrWorker;

  }

  if (workerLoading) {

    return workerLoading;

  }

  workerLoading =
    (async () => {

      const Tesseract =
        await loadTesseract();

      showLoading(
        "กำลังเตรียมระบบสแกนข้อความ..."
      );

      ocrWorker =
        await Tesseract.createWorker(
          "tha+eng"
        );

      try {

        await ocrWorker.setParameters({

          tessedit_pageseg_mode:
            "6",

          preserve_interword_spaces:
            "1"

        });

      } catch (error) {

        console.warn(
          "ตั้งค่า OCR:",
          error
        );

      }

      hideLoading();

      return ocrWorker;

    })();

  try {

    return await workerLoading;

  } finally {

    workerLoading =
      null;

  }

}


/* =========================================================
   PREPARE IMAGE
   ========================================================= */

async function prepareImage(
  file,
  fromCamera
) {

  const img =
    await loadImage(
      file
    );

  let width =
    img.naturalWidth;

  let height =
    img.naturalHeight;

  const maxSize =
    fromCamera
      ? 2200
      : 2400;

  const scale =
    Math.min(
      1,
      maxSize / width,
      maxSize / height
    );

  width =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );

  height =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );

  if (
    fromCamera &&
    width < 1400
  ) {

    const enlarge =
      Math.min(
        1.5,
        1400 / width
      );

    width =
      Math.round(
        width * enlarge
      );

    height =
      Math.round(
        height * enlarge
      );

  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const ctx =
    canvas.getContext(
      "2d"
    );

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.drawImage(
    img,
    0,
    0,
    width,
    height
  );

  return {

    normal:
      canvas.toDataURL(
        "image/jpeg",
        0.90
      ),

    enhanced:
      createEnhancedVariant(
        canvas
      )

  };

}


/* =========================================================
   LOAD IMAGE
   ========================================================= */

function loadImage(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const url =
        URL.createObjectURL(
          file
        );

      const img =
        new Image();

      img.onload =
        () => {

          URL.revokeObjectURL(
            url
          );

          resolve(
            img
          );

        };

      img.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "ไม่สามารถเปิดรูปภาพได้"
            )
          );

        };

      img.src =
        url;

    }
  );

}


/* =========================================================
   ENHANCED IMAGE
   ========================================================= */

function createEnhancedVariant(
  sourceCanvas
) {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    sourceCanvas.width;

  canvas.height =
    sourceCanvas.height;

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const data =
    imageData.data;

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const gray =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];

    const value =
      (
        (gray - 128) *
        1.25
      ) + 128;

    data[i] =
      clamp(
        value
      );

    data[i + 1] =
      clamp(
        value
      );

    data[i + 2] =
      clamp(
        value
      );

  }

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.90
  );

}


/* =========================================================
   CLAMP
   ========================================================= */

function clamp(
  value
) {

  return Math.max(
    0,
    Math.min(
      255,
      Math.round(
        value
      )
    )
  );

}


/* =========================================================
   START OCR
   ========================================================= */

async function startOCR(
  file,
  fromCamera = false
) {

  if (ocrRunning) {
    return;
  }

  ocrRunning =
    true;

  try {

    const worker =
      await getOCRWorker();

    showLoading(
      fromCamera
        ? "กำลังอ่านตัวอักษรจากกล้อง..."
        : "กำลังอ่านตัวอักษรจากรูป..."
    );

    const variants =
      await prepareImage(
        file,
        fromCamera
      );

    const first =
      await recognizeImage(
        worker,
        variants.normal
      );

    let firstText =
      first?.text
        ? normalizeOCRText(
            first.text
          )
        : "";

    let finalText =
      firstText;

    if (
      !isGoodOCR(
        firstText
      )
    ) {

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );

      const second =
        await recognizeImage(
          worker,
          variants.enhanced
        );

      const secondText =
        second?.text
          ? normalizeOCRText(
              second.text
            )
          : "";

      finalText =
        chooseBetterOCRText(
          firstText,
          secondText
        );

    } else {

      finalText =
        cleanFinalOCRText(
          firstText
        );

    }

    finalText =
      cleanFinalOCRText(
        finalText
      );

    if (!finalText) {

      throw new Error(
        "ไม่พบข้อความในรูปภาพ"
      );

    }

    if (ocrText) {

      ocrText.value =
        finalText;

    }

    if (ocrCard) {

      ocrCard.hidden =
        false;

    }

    showLoading(
      "อ่านข้อความได้แล้ว กำลังแปล..."
    );

    await autoTranslateOCR(
      finalText
    );

    hideLoading();

    showStatus(
      "อ่านและแปลเรียบร้อยแล้ว",
      "success"
    );

  } catch (error) {

    console.error(
      "OCR / TRANSLATION ERROR:",
      error
    );

    hideLoading();

    showStatus(
      error.message ||
        "ไม่สามารถอ่านหรือแปลข้อความได้",
      "error"
    );

  } finally {

    ocrRunning =
      false;

  }

}


/* =========================================================
   RECOGNIZE IMAGE
   ========================================================= */

async function recognizeImage(
  worker,
  image
) {

  if (!worker) {
    return null;
  }

  try {

    await worker.setParameters({

      tessedit_pageseg_mode:
        "6",

      preserve_interword_spaces:
        "1"

    });

  } catch (error) {

    console.warn(
      "OCR parameter:",
      error
    );

  }

  const result =
    await worker.recognize(
      image
    );

  return result?.data || null;

}


/* =========================================================
   CHOOSE BETTER OCR
   ========================================================= */

function chooseBetterOCRText(
  first,
  second
) {

  const a =
    cleanFinalOCRText(
      first
    );

  const b =
    cleanFinalOCRText(
      second
    );

  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  const scoreA =
    scoreOCR(
      a
    );

  const scoreB =
    scoreOCR(
      b
    );

  if (
    scoreB >
    scoreA + 5
  ) {

    return b;

  }

  if (
    scoreA >
    scoreB + 5
  ) {

    return a;

  }

  return mergeBestOCRLines(
    a,
    b
  );

}


/* =========================================================
   MERGE BEST OCR LINES
   ========================================================= */

function mergeBestOCRLines(
  first,
  second
) {

  const firstLines =
    first
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);

  const secondLines =
    second
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);

  if (
    Math.abs(
      firstLines.length -
      secondLines.length
    ) > 2
  ) {

    return scoreOCR(
      first
    ) >=
      scoreOCR(
        second
      )
      ? first
      : second;

  }

  const max =
    Math.max(
      firstLines.length,
      secondLines.length
    );

  const result = [];

  for (
    let i = 0;
    i < max;
    i++
  ) {

    const a =
      firstLines[i] ||
      "";

    const b =
      secondLines[i] ||
      "";

    if (
      !a &&
      b
    ) {

      result.push(
        b
      );

      continue;

    }

    if (
      a &&
      !b
    ) {

      result.push(
        a
      );

      continue;

    }

    const cleanA =
      cleanOCRCandidateLine(
        a
      );

    const cleanB =
      cleanOCRCandidateLine(
        b
      );

    if (!cleanA) {

      if (cleanB) {

        result.push(
          cleanB
        );

      }

      continue;

    }

    if (!cleanB) {

      result.push(
        cleanA
      );

      continue;

    }

    result.push(
      chooseBetterOCRLine(
        cleanA,
        cleanB
      )
    );

  }

  return result.join(
    "\n"
  );

}


/* =========================================================
   CHOOSE BETTER LINE
   ========================================================= */

function chooseBetterOCRLine(
  first,
  second
) {

  const scoreA =
    scoreOCRLine(
      first
    );

  const scoreB =
    scoreOCRLine(
      second
    );

  return (
    scoreB >
    scoreA
      ? second
      : first
  );

}


/* =========================================================
   OCR LINE SCORE
   ========================================================= */

function scoreOCRLine(
  line
) {

  if (!line) {
    return 0;
  }

  const thai =
    countThai(
      line
    );

  const english =
    countEnglish(
      line
    );

  const numbers =
    countNumbers(
      line
    );

  const letters =
    thai +
    english +
    numbers;

  const symbols =
    (
      line.match(
        /[^A-Za-zก-๙0-9\s]/g
      ) || []
    ).length;

  const length =
    line.replace(
      /\s/g,
      ""
    ).length;

  if (!length) {
    return 0;
  }

  let score =
    Math.min(
      60,
      letters * 3
    );

  if (
    letters >=
    symbols
  ) {

    score +=
      20;

  }

  if (
    letters <= 2
  ) {

    score -=
      20;

  }

  if (
    symbols >= 4 &&
    symbols >= letters
  ) {

    score -=
      35;

  }

  if (
    thai > 0 &&
    english > 0 &&
    letters >= 5
  ) {

    score +=
      5;

  }

  return Math.max(
    0,
    Math.min(
      100,
      score
    )
  );

}


/* =========================================================
   OCR QUALITY
   ========================================================= */

function isGoodOCR(
  text
) {

  if (!text) {
    return false;
  }

  const thai =
    countThai(
      text
    );

  const english =
    countEnglish(
      text
    );

  const total =
    thai +
    english;

  if (
    total < 5
  ) {

    return false;

  }

  return (
    scoreOCR(
      text
    ) >= 45
  );

}


function scoreOCR(
  text
) {

  if (!text) {
    return 0;
  }

  const thai =
    countThai(
      text
    );

  const english =
    countEnglish(
      text
    );

  const letters =
    thai +
    english;

  const length =
    text.replace(
      /\s/g,
      ""
    ).length;

  if (!length) {
    return 0;
  }

  const valid =
    (
      text.match(
        /[A-Za-zก-๙0-9\s.,!?'"“”‘’\-:;()]/g
      ) || []
    ).length;

  const garbage =
    (
      text.match(
        /[^A-Za-zก-๙0-9\s.,!?'"“”‘’\-:;()]/g
      ) || []
    ).length;

  let score =
    Math.min(
      50,
      letters * 2
    );

  score +=
    Math.min(
      25,
      text
        .split("\n")
        .filter(Boolean)
        .length * 5
    );

  score +=
    (
      valid /
      Math.max(
        1,
        text.length
      )
    ) * 20;

  score -=
    Math.min(
      25,
      garbage * 2
    );

  return Math.max(
    0,
    Math.min(
      100,
      score
    )
  );

}


/* =========================================================
   NORMALIZE OCR
   ========================================================= */

function normalizeOCRText(
  text
) {

  if (!text) {
    return "";
  }

  const lines =
    String(text)
      .replace(
        /\r/g,
        "\n"
      )
      .replace(
        /\u0000/g,
        ""
      )
      .split("\n")
      .map(
        line =>
          cleanOCRLine(
            line
          )
      )
      .filter(Boolean);

  return lines.join(
    "\n"
  ).trim();

}


/* =========================================================
   CLEAN OCR LINE
   ========================================================= */

function cleanOCRLine(
  line
) {

  let value =
    String(line)
      .replace(
        /\uFFFD/g,
        ""
      )
      .trim();

  if (!value) {
    return "";
  }

  value =
    value
      .replace(
        /[|]{2,}/g,
        " "
      )
      .replace(
        /[_]{3,}/g,
        " "
      )
      .replace(
        /[-]{5,}/g,
        " "
      )
      .replace(
        /[~]{3,}/g,
        " "
      )
      .replace(
        /[=]{3,}/g,
        " "
      )
      .replace(
        /\s{2,}/g,
        " "
      )
      .trim();

  value =
    value.replace(
      /^[|_=~]+/g,
      ""
    );

  value =
    value.replace(
      /[|_=~]+$/g,
      ""
    );

  return value.trim();

}


/* =========================================================
   CLEAN OCR CANDIDATE LINE
   ========================================================= */

function cleanOCRCandidateLine(
  line
) {

  let value =
    cleanOCRLine(
      line
    );

  if (!value) {
    return "";
  }

  if (
    isGarbageLine(
      value
    )
  ) {

    return "";

  }

  value =
    value.replace(
      /\s+[|•·¦]+\s+/g,
      " "
    );

  value =
    value.replace(
      /\s{2,}/g,
      " "
    );

  return value.trim();

}


/* =========================================================
   FINAL OCR CLEAN
   ========================================================= */

function cleanFinalOCRText(
  text
) {

  const value =
    normalizeOCRText(
      text
    );

  if (!value) {
    return "";
  }

  const lines =
    value
      .split("\n")
      .map(
        line =>
          cleanOCRCandidateLine(
            line
          )
      )
      .filter(Boolean);

  const corrected =
    lines.map(
      line =>
        correctCommonThaiOCR(
          line
        )
    );

  return corrected.join(
    "\n"
  ).trim();

}


/* =========================================================
   COMMON THAI OCR CORRECTION
   ========================================================= */

function correctCommonThaiOCR(
  line
) {

  let value =
    String(line);

  value =
    value.replace(
      /เท่านัน/g,
      "เท่านั้น"
    );

  value =
    value.replace(
      /เป็นตน/g,
      "เป็นต้น"
    );

  value =
    value.replace(
      /นัน้/g,
      "นั้น"
    );

  /*
    OCR กรณี
    กิจะช่วย...
    ที่จริงมักเป็น
    ที่จะช่วย...
  */

  value =
    value.replace(
      /^กิจะ(?=\s|ช่วย|ทำ|เป็น|ไป|ได้)/,
      "ที่จะ"
    );

  value =
    value.replace(
      /กิจะช่วย/g,
      "ที่จะช่วย"
    );

  value =
    value.replace(
      /กิจะทำ/g,
      "ที่จะทำ"
    );

  value =
    value.replace(
      /กิจะเป็น/g,
      "ที่จะเป็น"
    );

  value =
    value.replace(
      /([ก-๙])\s+([่้๊๋ั็์])/g,
      "$1$2"
    );

  return value.trim();

}


/* =========================================================
   GARBAGE LINE
   ========================================================= */

function isGarbageLine(
  line
) {

  if (!line) {
    return true;
  }

  const thai =
    countThai(
      line
    );

  const english =
    countEnglish(
      line
    );

  const numbers =
    countNumbers(
      line
    );

  const symbols =
    (
      line.match(
        /[^A-Za-zก-๙0-9\s]/g
      ) || []
    ).length;

  const letters =
    thai +
    english;

  const alphanumeric =
    letters +
    numbers;

  if (
    alphanumeric === 0
  ) {

    return true;

  }

  if (
    alphanumeric <= 3 &&
    symbols >= 3
  ) {

    return true;

  }

  if (
    symbols >= 4 &&
    symbols >=
      alphanumeric
  ) {

    return true;

  }

  const words =
    line
      .split(/\s+/)
      .filter(Boolean);

  if (
    alphanumeric <= 5 &&
    words.length >= 3 &&
    symbols >= 2
  ) {

    return true;

  }

  if (
    /(.)\1{7,}/u.test(
      line
    )
  ) {

    return true;

  }

  if (
    line.length <= 12 &&
    symbols >= 3 &&
    alphanumeric <= 5
  ) {

    return true;

  }

  return false;

}


/* =========================================================
   LANGUAGE COUNT
   ========================================================= */

function countThai(
  text
) {

  return (
    String(text)
      .match(
        /[ก-๙]/g
      ) || []
  ).length;

}


function countEnglish(
  text
) {

  return (
    String(text)
      .match(
        /[A-Za-z]/g
      ) || []
  ).length;

}


function countNumbers(
  text
) {

  return (
    String(text)
      .match(
        /[0-9]/g
      ) || []
  ).length;

}


/* =========================================================
   SOURCE TEXT
   ========================================================= */

function extractSourceText(
  text,
  source
) {

  const lines =
    String(text)
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);

  const result =
    lines.filter(
      line =>
        isSourceLine(
          line,
          source
        )
    );

  return result.join(
    "\n"
  );

}


function isSourceLine(
  text,
  source
) {

  const thai =
    countThai(
      text
    );

  const english =
    countEnglish(
      text
    );

  if (
    source === "th"
  ) {

    return (
      thai >= 2 &&
      thai >= english
    );

  }

  if (
    source === "en"
  ) {

    if (
      english < 2 ||
      english < thai
    ) {

      return false;

    }

    if (
      thai > 0 &&
      thai >=
        english * 0.30
    ) {

      return false;

    }

    return true;

  }

  return false;

}


/* =========================================================
   AUTO TRANSLATE OCR
   ========================================================= */

async function autoTranslateOCR(
  text
) {

  if (
    !text ||
    !text.trim()
  ) {

    return;

  }

  translationRunning =
    true;

  try {

    const sourceText =
      extractSourceText(
        text,
        sourceLanguage
      );

    if (!sourceText) {

      if (resultText) {

        resultText.textContent =
          "ไม่พบข้อความภาษาต้นทาง";

        resultText.classList.remove(
          "empty"
        );

      }

      return;

    }

    const translated =
      await translateSingleText(
        sourceText,
        sourceLanguage,
        targetLanguage
      );

    if (resultText) {

      resultText.textContent =
        translated;

      resultText.classList.remove(
        "empty"
      );

    }

  } catch (error) {

    console.error(
      "AUTO TRANSLATE ERROR:",
      error
    );

    if (resultText) {

      resultText.textContent =
        "ไม่สามารถแปลข้อความจากรูปได้";

      resultText.classList.remove(
        "empty"
      );

    }

    throw error;

  } finally {

    translationRunning =
      false;

  }

}


/* =========================================================
   TRANSLATE API
   ========================================================= */

async function translateSingleText(
  text,
  source,
  target
) {

  const cleanText =
    String(
      text || ""
    ).trim();

  if (!cleanText) {

    throw new Error(
      "ไม่มีข้อความสำหรับแปล"
    );

  }

  /*
    ใช้ URLSearchParams เพื่อให้
    Google Apps Script รับ POST ได้ง่าย
    และลดปัญหา CORS preflight
  */

  const payload =
    JSON.stringify({

      action:
        "translate",

      text:
        cleanText,

      source:
        source,

      target:
        target

    });

  let response;

  try {

    response =
      await fetch(
        TRANSLATE_API,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            payload,

          redirect:
            "follow"
        }
      );

  } catch (error) {

    console.error(
      "FETCH TRANSLATE ERROR:",
      error
    );

    throw new Error(
      "เชื่อมต่อระบบแปลภาษาไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต"
    );

  }

  if (!response.ok) {

    throw new Error(
      `เซิร์ฟเวอร์แปลภาษาตอบกลับ ${response.status}`
    );

  }

  const raw =
    await response.text();

  console.log(
    "TRANSLATION RAW RESPONSE:",
    raw
  );

  const translated =
    extractTranslation(
      null,
      raw
    );

  if (!translated) {

    throw new Error(
      "ระบบแปลภาษาไม่ส่งคำแปลกลับมา"
    );

  }

  return translated.trim();

}


/* =========================================================
   EXTRACT TRANSLATION
   ========================================================= */

function extractTranslation(
  data,
  raw
) {

  /*
    ======================================================
    กรณีมี JSON object อยู่แล้ว
    ======================================================
  */

  if (
    data &&
    typeof data ===
      "object"
  ) {

    const direct =
      findTranslationValue(
        data
      );

    if (direct) {

      return direct;

    }

  }


  /*
    ======================================================
    อ่าน raw response
    ======================================================
  */

  if (
    typeof raw !==
      "string"
  ) {

    return "";

  }

  let value =
    raw.trim();

  if (!value) {

    return "";

  }


  /*
    บางครั้ง Apps Script
    อาจส่ง JSON มาเป็น string
    ======================================================
  */

  for (
    let attempt = 0;
    attempt < 3;
    attempt++
  ) {

    try {

      const parsed =
        JSON.parse(
          value
        );

      const found =
        findTranslationValue(
          parsed
        );

      if (found) {

        return found;

      }

      /*
        ถ้า parsed เป็น string
        ลอง parse ต่ออีกครั้ง
      */

      if (
        typeof parsed ===
        "string"
      ) {

        value =
          parsed.trim();

        continue;

      }

      break;

    } catch {

      break;

    }

  }


  /*
    ======================================================
    ลบ JSONP / callback ถ้ามี
    ======================================================
  */

  value =
    value.replace(
      /^\s*[^(]+\(\s*/,
      ""
    );

  value =
    value.replace(
      /\s*\)\s*;?\s*$/,
      ""
    ).trim();


  try {

    const parsed =
      JSON.parse(
        value
      );

    const found =
      findTranslationValue(
        parsed
      );

    if (found) {

      return found;

    }

  } catch {

    // ไม่เป็น JSON ให้ตรวจเป็นข้อความต่อ

  }


  /*
    ======================================================
    ถ้าเป็น HTML error page
    ไม่เอา HTML ไปแสดงเป็นคำแปล
    ======================================================
  */

  const lower =
    value.toLowerCase();

  if (
    lower.includes(
      "<!doctype html"
    ) ||
    lower.includes(
      "<html"
    ) ||
    lower.includes(
      "<head"
    )
  ) {

    return "";

  }


  /*
    ======================================================
    กรณี API ส่งข้อความแปลตรง ๆ
    ======================================================
  */

  return value.trim();

}


/* =========================================================
   FIND TRANSLATION VALUE
   ========================================================= */

function findTranslationValue(
  data
) {

  if (
    data === null ||
    data === undefined
  ) {

    return "";

  }


  /*
    ถ้าเป็น string
    ถือว่าเป็นคำแปล
  */

  if (
    typeof data ===
      "string"
  ) {

    const value =
      data.trim();

    return value;

  }


  if (
    typeof data !==
      "object"
  ) {

    return "";

  }


  /*
    รองรับชื่อ field หลายแบบ
  */

  const keys = [

    "translation",
    "translatedText",
    "translated",
    "result",
    "output",
    "text",
    "answer",
    "response",
    "message"

  ];


  for (
    const key
    of keys
  ) {

    if (
      data[key] !==
      undefined &&
      data[key] !==
      null
    ) {

      const value =
        data[key];

      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {

        return value.trim();

      }


      if (
        typeof value ===
          "object"
      ) {

        const nested =
          findTranslationValue(
            value
          );

        if (nested) {

          return nested;

        }

      }

    }

  }


  /*
    รองรับ
    { data: {...} }
    { data: "..." }
  */

  if (
    data.data !==
      undefined &&
    data.data !==
      null
  ) {

    const nested =
      findTranslationValue(
        data.data
      );

    if (nested) {

      return nested;

    }

  }


  /*
    รองรับ
    { result: { translation: "..." } }
  */

  if (
    data.result &&
    typeof data.result ===
      "object"
  ) {

    const nested =
      findTranslationValue(
        data.result
      );

    if (nested) {

      return nested;

    }

  }


  return "";

}


/* =========================================================
   MANUAL TRANSLATE
   ========================================================= */

async function translateText() {

  if (
    translationRunning
  ) {

    return;

  }

  const text =
    inputText
      ? inputText.value.trim()
      : "";

  if (!text) {

    showStatus(
      "กรุณาพิมพ์ข้อความหรือเลือกรูปภาพก่อน",
      "error"
    );

    return;

  }

  translationRunning =
    true;

  try {

    showLoading(
      "กำลังแปลภาษา..."
    );

    const translated =
      await translateSingleText(
        text,
        sourceLanguage,
        targetLanguage
      );

    if (resultText) {

      resultText.textContent =
        translated;

      resultText.classList.remove(
        "empty"
      );

    }

    hideLoading();

    showStatus(
      "แปลภาษาเรียบร้อยแล้ว",
      "success"
    );

  } catch (error) {

    console.error(
      "TRANSLATION ERROR:",
      error
    );

    hideLoading();

    showStatus(
      error.message ||
        "ไม่สามารถแปลภาษาได้",
      "error"
    );

  } finally {

    translationRunning =
      false;

  }

}


/* =========================================================
   USE OCR
   ========================================================= */

function useOCRText() {

  if (
    !ocrText ||
    !inputText
  ) {

    return;

  }

  const text =
    ocrText.value.trim();

  if (!text) {

    showStatus(
      "ยังไม่มีข้อความจากรูป",
      "error"
    );

    return;

  }

  inputText.value =
    text;

  showStatus(
    "นำข้อความจากรูปมาใช้แล้ว",
    "success"
  );

}


/* =========================================================
   SPEECH
   ========================================================= */

function speakText(
  text
) {

  const value =
    String(
      text || ""
    ).trim();

  if (!value) {

    showStatus(
      "ไม่มีข้อความให้อ่าน",
      "error"
    );

    return;

  }

  if (
    !("speechSynthesis" in window)
  ) {

    showStatus(
      "อุปกรณ์นี้ไม่รองรับการอ่านออกเสียง",
      "error"
    );

    return;

  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      value
    );

  utterance.lang =
    targetLanguage === "th"
      ? "th-TH"
      : "en-US";

  utterance.rate =
    0.9;

  utterance.pitch =
    1;

  window.speechSynthesis.speak(
    utterance
  );

}


/* =========================================================
   COPY
   ========================================================= */

async function copyResult() {

  const value =
    resultText
      ? resultText.textContent.trim()
      : "";

  if (
    !value ||
    resultText.classList.contains(
      "empty"
    )
  ) {

    showStatus(
      "ยังไม่มีคำแปลให้คัดลอก",
      "error"
    );

    return;

  }

  try {

    await navigator.clipboard.writeText(
      value
    );

    showStatus(
      "คัดลอกคำแปลแล้ว",
      "success"
    );

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      value;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    showStatus(
      "คัดลอกคำแปลแล้ว",
      "success"
    );

  }

}


/* =========================================================
   CLEAR
   ========================================================= */

function clearInput() {

  if (inputText) {

    inputText.value =
      "";

  }

  if (resultText) {

    resultText.textContent =
      "คำแปลจะแสดงที่นี่";

    resultText.classList.add(
      "empty"
    );

  }

  if (ocrText) {

    ocrText.value =
      "";

  }

  if (ocrCard) {

    ocrCard.hidden =
      true;

  }

  removeImage();

  showStatus(
    "ล้างข้อมูลแล้ว",
    "success"
  );

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(
  message
) {

  if (loadingBox) {

    loadingBox.hidden =
      false;

  }

  if (loadingText) {

    loadingText.textContent =
      message ||
      "กำลังดำเนินการ...";

  }

}


function hideLoading() {

  if (loadingBox) {

    loadingBox.hidden =
      true;

  }

}


/* =========================================================
   STATUS
   ========================================================= */

let statusTimer =
  null;


function showStatus(
  message,
  type = "info"
) {

  if (!statusMessage) {
    return;
  }

  statusMessage.textContent =
    message;

  statusMessage.hidden =
    false;

  statusMessage.className =
    `status-message ${type}`;

  clearTimeout(
    statusTimer
  );

  statusTimer =
    setTimeout(
      () => {

        statusMessage.hidden =
          true;

      },
      3500
    );

}


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener(
  "beforeunload",
  async () => {

    if (selectedImageUrl) {

      URL.revokeObjectURL(
        selectedImageUrl
      );

    }

    try {

      if (ocrWorker) {

        await ocrWorker.terminate();

        ocrWorker =
          null;

      }

    } catch (error) {

      console.warn(
        "OCR worker cleanup:",
        error
      );

    }

  }
);
