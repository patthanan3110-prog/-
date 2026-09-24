/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   SCRIPT.JS - VERSION 57
   FAST SINGLE OCR WORKER
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


      /*
        สำคัญ:
        สร้างแค่ worker เดียว
        รองรับทั้งภาษาไทยและอังกฤษ
      */

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


  /*
    ลดขนาดภาพเพื่อให้เร็วขึ้น
  */

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


  /*
    กล้องภาพเล็ก
    ขยายเล็กน้อยเท่านั้น
  */

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

    /*
      เตรียม worker เดียว
    */

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
      ======================================================
      รอบที่ 1
      อ่านภาพปกติ
      ======================================================
    */

    const first =
      await recognizeImage(
        worker,
        variants.normal
      );


    let finalText =
      first?.text
        ? normalizeOCRText(
            first.text
          )
        : "";


    /*
      ถ้าอ่านได้ดีแล้ว
      ไม่ต้อง OCR ซ้ำ
    */

    if (
      !isGoodOCR(
        finalText
      )
    ) {

      /*
        ====================================================
        รอบที่ 2
        ใช้ภาพปรับ contrast
        เฉพาะตอนผลรอบแรกไม่ดี
        ====================================================
      */

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );


      const second =
        await recognizeImage(
          worker,
          variants.enhanced
        );


      const enhancedText =
        second?.text
          ? normalizeOCRText(
              second.text
            )
          : "";


      if (
        scoreOCR(
          enhancedText
        ) >
        scoreOCR(
          finalText
        )
      ) {

        finalText =
          enhancedText;

      }

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


    /*
      แสดง OCR
    */

    if (ocrText) {

      ocrText.value =
        finalText;

    }


    if (ocrCard) {

      ocrCard.hidden =
        false;

    }


    /*
      ======================================================
      แปลเฉพาะภาษาต้นทาง
      ======================================================
    */

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
      "OCR ERROR:",
      error
    );


    hideLoading();


    showStatus(
      error.message ||
        "ไม่สามารถอ่านข้อความจากรูปได้",
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
        /[|]{3,}/g,
        " "
      )
      .replace(
        /[_]{4,}/g,
        " "
      )
      .replace(
        /[-]{6,}/g,
        " "
      )
      .replace(
        /[~]{4,}/g,
        " "
      )
      .replace(
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
          line.trim()
      )
      .filter(Boolean);


  const cleaned =
    lines.filter(
      line =>
        !isGarbageLine(
          line
        )
    );


  return (
    cleaned.length
      ? cleaned
      : lines
  ).join("\n");

}


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
    (
      line.match(
        /[0-9]/g
      ) || []
    ).length;


  const symbols =
    (
      line.match(
        /[^A-Za-zก-๙0-9\s]/g
      ) || []
    ).length;


  const letters =
    thai +
    english;


  if (
    letters === 0 &&
    numbers === 0
  ) {

    return true;

  }


  if (
    letters < 2 &&
    symbols > 4
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
      ป้องกัน OCR เช่น

      It's only หอน

      ไม่ให้เอาทั้งบรรทัด
      ไปแปลเป็นอังกฤษ
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

  const response =
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
          JSON.stringify({

            action:
              "translate",

            text:
              text,

            source:
              source,

            target:
              target

          })
      }
    );


  if (!response.ok) {

    throw new Error(
      `เซิร์ฟเวอร์ตอบกลับ ${response.status}`
    );

  }


  const raw =
    await response.text();


  let data =
    null;


  try {

    data =
      JSON.parse(
        raw
      );

  } catch {

    data =
      null;

  }


  const translated =
    extractTranslation(
      data,
      raw
    );


  if (!translated) {

    throw new Error(
      "ไม่พบคำแปลจากเซิร์ฟเวอร์"
    );

  }


  return translated.trim();

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


    /*
      ข้อความที่พิมพ์เอง
      แปลทั้งหมด
    */

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
   EXTRACT TRANSLATION
   ========================================================= */

function extractTranslation(
  data,
  raw
) {

  if (data) {

    const keys = [

      "translation",
      "translatedText",
      "result",
      "text",
      "output",
      "translated",
      "data"

    ];


    for (
      const key
      of keys
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

    }


    if (
      data.data &&
      typeof data.data ===
        "object"
    ) {

      for (
        const key
        of keys
      ) {

        const value =
          data.data[key];


        if (
          typeof value ===
            "string" &&
          value.trim()
        ) {

          return value.trim();

        }

      }

    }

  }


  if (
    typeof raw ===
      "string" &&
    raw.trim()
  ) {

    const value =
      raw.trim();


    if (
      !value.startsWith(
        "<!DOCTYPE"
      ) &&
      !value.startsWith(
        "<html"
      )
    ) {

      return value;

    }

  }


  return "";

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
