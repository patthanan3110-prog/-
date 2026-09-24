/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   SCRIPT.JS - VERSION 60
   OCR CONFIDENCE + SMART LINE FILTER
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

    /*
      รอบแรก:
      ใช้ภาพปกติก่อน
    */

    const firstData =
      await recognizeImage(
        worker,
        variants.normal
      );

    const firstLines =
      extractOCRLines(
        firstData
      );

    let finalLines =
      firstLines;

    /*
      ถ้ารอบแรกคุณภาพต่ำ
      จึงค่อยใช้ภาพปรับความคมชัด
    */

    if (
      !isGoodOCRLines(
        firstLines
      )
    ) {

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );

      const secondData =
        await recognizeImage(
          worker,
          variants.enhanced
        );

      const secondLines =
        extractOCRLines(
          secondData
        );

      finalLines =
        chooseBetterOCRLines(
          firstLines,
          secondLines
        );

    }

    /*
      กรองรอบสุดท้าย
    */

    finalLines =
      finalLines
        .filter(
          line =>
            isUsableOCRLine(
              line
            )
        );

    const finalText =
      ocrLinesToText(
        finalLines
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
   EXTRACT OCR LINES
   ========================================================= */

function extractOCRLines(
  data
) {

  if (!data) {
    return [];
  }

  /*
    Tesseract.js 5
    มี data.lines
  */

  if (
    Array.isArray(
      data.lines
    ) &&
    data.lines.length
  ) {

    return data.lines
      .map(
        line => {

          const text =
            cleanOCRLine(
              line?.text || ""
            );

          const confidence =
            getLineConfidence(
              line
            );

          return {

            text:
              text,

            confidence:
              confidence

          };

        }
      )
      .filter(
        line =>
          line.text
      );

  }

  /*
    fallback
    ถ้าไม่มี lines
  */

  const rawText =
    data.text || "";

  return String(
    rawText
  )
    .replace(
      /\r/g,
      "\n"
    )
    .split("\n")
    .map(
      text => ({

        text:
          cleanOCRLine(
            text
          ),

        confidence:
          50

      })
    )
    .filter(
      line =>
        line.text
    );

}


/* =========================================================
   LINE CONFIDENCE
   ========================================================= */

function getLineConfidence(
  line
) {

  if (
    line &&
    Number.isFinite(
      Number(
        line.confidence
      )
    )
  ) {

    return Number(
      line.confidence
    );

  }

  /*
    บางผลลัพธ์อาจไม่มี
    confidence ระดับ line
    จึงคำนวณจาก words
  */

  if (
    line &&
    Array.isArray(
      line.words
    ) &&
    line.words.length
  ) {

    const values =
      line.words
        .map(
          word =>
            Number(
              word?.confidence
            )
        )
        .filter(
          value =>
            Number.isFinite(
              value
            )
        );

    if (values.length) {

      return (
        values.reduce(
          (
            total,
            value
          ) =>
            total + value,
          0
        ) /
        values.length
      );

    }

  }

  return 50;

}


/* =========================================================
   OCR LINE USABILITY
   ========================================================= */

function isUsableOCRLine(
  line
) {

  if (
    !line ||
    !line.text
  ) {

    return false;

  }

  const text =
    line.text.trim();

  if (!text) {
    return false;
  }

  const confidence =
    Number(
      line.confidence
    );

  const thai =
    countThai(
      text
    );

  const english =
    countEnglish(
      text
    );

  const numbers =
    countNumbers(
      text
    );

  const letters =
    thai +
    english +
    numbers;

  const symbols =
    countOCRSymbols(
      text
    );

  /*
    ไม่มีตัวอักษร/ตัวเลขเลย
  */

  if (
    letters === 0
  ) {

    return false;

  }

  /*
    บรรทัดสั้นมากและ confidence ต่ำ
    เช่น "สอ" ที่เกิดจาก OCR
  */

  if (
    letters <= 3 &&
    confidence < 45
  ) {

    return false;

  }

  /*
    บรรทัดสั้น + มีสัญลักษณ์เยอะ
  */

  if (
    letters <= 5 &&
    symbols >= 3 &&
    confidence < 55
  ) {

    return false;

  }

  /*
    confidence ต่ำมาก
    และข้อความสั้น
  */

  if (
    confidence < 25 &&
    text.length <= 10
  ) {

    return false;

  }

  /*
    มีแต่สัญลักษณ์เป็นส่วนใหญ่
  */

  if (
    symbols >= 4 &&
    symbols >= letters &&
    confidence < 65
  ) {

    return false;

  }

  return true;

}


/* =========================================================
   OCR SYMBOL COUNT
   ========================================================= */

function countOCRSymbols(
  text
) {

  return (
    String(text)
      .match(
        /[^A-Za-zก-๙0-9\s]/g
      ) || []
  ).length;

}


/* =========================================================
   OCR LINES → TEXT
   ========================================================= */

function ocrLinesToText(
  lines
) {

  if (
    !Array.isArray(
      lines
    )
  ) {

    return "";

  }

  return lines
    .map(
      line =>
        cleanOCRLine(
          line.text
        )
    )
    .filter(Boolean)
    .join("\n")
    .trim();

}


/* =========================================================
   OCR LINE SCORE
   ========================================================= */

function scoreOCRLineObject(
  line
) {

  if (
    !line ||
    !line.text
  ) {

    return 0;

  }

  const text =
    line.text;

  const confidence =
    Number(
      line.confidence
    ) || 0;

  const thai =
    countThai(
      text
    );

  const english =
    countEnglish(
      text
    );

  const numbers =
    countNumbers(
      text
    );

  const letters =
    thai +
    english +
    numbers;

  const symbols =
    countOCRSymbols(
      text
    );

  let score =
    confidence;

  /*
    มีตัวอักษรจริง
  */

  score +=
    Math.min(
      20,
      letters * 1.5
    );

  /*
    มีสัญลักษณ์มากเกินไป
  */

  if (
    symbols > letters
  ) {

    score -=
      15;

  }

  /*
    บรรทัดสั้นมาก
  */

  if (
    letters <= 2
  ) {

    score -=
      15;

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
   CHOOSE BETTER OCR LINES
   ========================================================= */

function chooseBetterOCRLines(
  first,
  second
) {

  const a =
    Array.isArray(first)
      ? first.filter(
          isUsableOCRLine
        )
      : [];

  const b =
    Array.isArray(second)
      ? second.filter(
          isUsableOCRLine
        )
      : [];

  if (!a.length) {
    return b;
  }

  if (!b.length) {
    return a;
  }

  /*
    ถ้าจำนวนบรรทัดต่างกันมาก
    ให้เลือกชุดที่มีคะแนนรวมดีกว่า
  */

  if (
    Math.abs(
      a.length -
      b.length
    ) > 2
  ) {

    return (
      scoreOCRLines(
        b
      ) >
      scoreOCRLines(
        a
      )
        ? b
        : a
    );

  }

  /*
    ถ้าจำนวนบรรทัดใกล้กัน
    เลือกทีละบรรทัด
  */

  const max =
    Math.max(
      a.length,
      b.length
    );

  const result = [];

  for (
    let i = 0;
    i < max;
    i++
  ) {

    const lineA =
      a[i] || null;

    const lineB =
      b[i] || null;

    if (
      !lineA &&
      lineB
    ) {

      result.push(
        lineB
      );

      continue;

    }

    if (
      lineA &&
      !lineB
    ) {

      result.push(
        lineA
      );

      continue;

    }

    const chosen =
      chooseBetterOCRLineObject(
        lineA,
        lineB
      );

    if (chosen) {

      result.push(
        chosen
      );

    }

  }

  return result;

}


/* =========================================================
   CHOOSE BETTER OCR LINE OBJECT
   ========================================================= */

function chooseBetterOCRLineObject(
  first,
  second
) {

  if (!first) {
    return second;
  }

  if (!second) {
    return first;
  }

  const scoreA =
    scoreOCRLineObject(
      first
    );

  const scoreB =
    scoreOCRLineObject(
      second
    );

  /*
    ถ้าคะแนนต่างกันชัดเจน
    เลือกตัวที่ดีกว่า
  */

  if (
    Math.abs(
      scoreA -
      scoreB
    ) >= 8
  ) {

    return (
      scoreB >
      scoreA
        ? second
        : first
    );

  }

  /*
    ถ้าคะแนนใกล้กัน
    ให้ความสำคัญกับ confidence
  */

  const confidenceA =
    Number(
      first.confidence
    ) || 0;

  const confidenceB =
    Number(
      second.confidence
    ) || 0;

  if (
    confidenceB >
    confidenceA + 3
  ) {

    return second;

  }

  return first;

}


/* =========================================================
   SCORE OCR LINES
   ========================================================= */

function scoreOCRLines(
  lines
) {

  if (
    !Array.isArray(
      lines
    ) ||
    !lines.length
  ) {

    return 0;

  }

  const total =
    lines.reduce(
      (
        sum,
        line
      ) =>
        sum +
        scoreOCRLineObject(
          line
        ),
      0
    );

  return (
    total /
    lines.length
  );

}


/* =========================================================
   OCR QUALITY
   ========================================================= */

function isGoodOCRLines(
  lines
) {

  if (
    !Array.isArray(
      lines
    ) ||
    !lines.length
  ) {

    return false;

  }

  const usable =
    lines.filter(
      isUsableOCRLine
    );

  if (!usable.length) {
    return false;
  }

  const text =
    ocrLinesToText(
      usable
    );

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

  const averageConfidence =
    usable.reduce(
      (
        totalConfidence,
        line
      ) =>
        totalConfidence +
        (
          Number(
            line.confidence
          ) || 0
        ),
      0
    ) /
    usable.length;

  /*
    ถ้า confidence โดยรวมต่ำ
    ให้ OCR รอบสองช่วย
  */

  if (
    averageConfidence < 48
  ) {

    return false;

  }

  return true;

}


/* =========================================================
   NORMALIZE OCR TEXT
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
    String(line || "")
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
   CLEAN OCR CANDIDATE
   ========================================================= */

function cleanOCRCandidateLine(
  line
) {

  const value =
    cleanOCRLine(
      line
    );

  if (!value) {
    return "";
  }

  const fakeLine = {

    text:
      value,

    confidence:
      100

  };

  if (
    !isUsableOCRLine(
      fakeLine
    )
  ) {

    return "";

  }

  return value;

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

  return value
    .split("\n")
    .map(
      line =>
        cleanOCRCandidateLine(
          line
        )
    )
    .filter(Boolean)
    .join("\n")
    .trim();

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
    countOCRSymbols(
      line
    );

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

  if (
    /(.)\1{7,}/u.test(
      line
    )
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

    /*
      ป้องกันบรรทัดแบบ
      "It's only หอน"
      ไม่ให้ถูกมองว่าเป็นอังกฤษล้วน
    */

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
    ลอง JSON หลายชั้น
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
    JSONP
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

    // ไม่เป็น JSON

  }

  /*
    ป้องกัน HTML error
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

  if (
    typeof data ===
      "string"
  ) {

    return data.trim();

  }

  if (
    typeof data !==
      "object"
  ) {

    return "";

  }

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
