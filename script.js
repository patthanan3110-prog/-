/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 40

   OCR:
   - Thai / English แยก Worker
   - อ่านหลาย pass
   - เลือกข้อความที่มีความเสถียร
   - ไม่รวม hallucination แบบเดิม
   - รักษาบรรทัดและคำที่ OCR อ่านได้
   - รองรับไทย + อังกฤษในภาพเดียวกัน
========================================================= */


/* =========================================================
   API
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyv4x3GhyXGKGQvWfmh-lKForJ_OV7BVtoglDGsGjtNYID8cf1Lwkog3rk3ROLJJsng/exec";

const TESSERACT_URL =
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";


/* =========================================================
   GLOBAL
========================================================= */

let sourceLanguage = "th";
let targetLanguage = "en";

let selectedImageFile = null;
let selectedImageUrl = null;

let thaiWorker = null;
let englishWorker = null;

let tesseractLoading = null;

let isOCRRunning = false;
let isTranslating = false;


/* =========================================================
   DOM
========================================================= */

const inputText =
  document.getElementById("inputText");

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

const translateButton =
  document.getElementById("translateButton");

const resultText =
  document.getElementById("resultText");

const loadingBox =
  document.getElementById("loadingBox");

const loadingText =
  document.getElementById("loadingText");

const statusMessage =
  document.getElementById("statusMessage");

const ocrCard =
  document.getElementById("ocrCard");

const ocrText =
  document.getElementById("ocrText");

const useOcrButton =
  document.getElementById("useOcrButton");

const speakOcrButton =
  document.getElementById("speakOcrButton");

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


/* =========================================================
   LANGUAGE
========================================================= */

function updateLanguageUI() {

  if (sourceLanguage === "th") {

    if (sourceLanguageText) {
      sourceLanguageText.textContent =
        "ภาษาไทย";
    }

    if (targetLanguageText) {
      targetLanguageText.textContent =
        "English";
    }

  } else {

    if (sourceLanguageText) {
      sourceLanguageText.textContent =
        "English";
    }

    if (targetLanguageText) {
      targetLanguageText.textContent =
        "ภาษาไทย";
    }

  }

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(
  message,
  type = "info"
) {

  if (!statusMessage) return;

  statusMessage.textContent =
    message;

  statusMessage.className =
    "status-message " + type;

  statusMessage.hidden =
    false;

}


function hideStatus() {

  if (statusMessage) {
    statusMessage.hidden =
      true;
  }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(message) {

  if (loadingText) {
    loadingText.textContent =
      message;
  }

  if (loadingBox) {
    loadingBox.hidden =
      false;
  }

}


function hideLoading() {

  if (loadingBox) {
    loadingBox.hidden =
      true;
  }

}


/* =========================================================
   LOAD TESSERACT
========================================================= */

function loadTesseract() {

  if (window.Tesseract) {
    return Promise.resolve(
      window.Tesseract
    );
  }

  if (tesseractLoading) {
    return tesseractLoading;
  }

  tesseractLoading =
    new Promise(
      (resolve, reject) => {

        const existing =
          document.querySelector(
            'script[data-tesseract="true"]'
          );

        if (existing) {

          existing.addEventListener(
            "load",
            () => {

              if (window.Tesseract) {

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

            }
          );

          existing.addEventListener(
            "error",
            () => {

              reject(
                new Error(
                  "โหลด Tesseract.js ไม่สำเร็จ"
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

        script.dataset.tesseract =
          "true";

        script.onload =
          () => {

            if (window.Tesseract) {

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
                "โหลด Tesseract.js ไม่สำเร็จ"
              )
            );

          };

        document.head.appendChild(
          script
        );

      }
    );

  return tesseractLoading;

}


/* =========================================================
   OCR WORKERS
========================================================= */

async function getOCRWorkers() {

  if (
    thaiWorker &&
    englishWorker
  ) {

    return {
      thaiWorker,
      englishWorker
    };

  }

  const Tesseract =
    await loadTesseract();

  showLoading(
    "กำลังเตรียมระบบอ่านภาษาไทยและอังกฤษ..."
  );

  if (!thaiWorker) {

    thaiWorker =
      await Tesseract.createWorker(
        "tha",
        1,
        {
          logger: message => {

            if (
              message &&
              message.status ===
                "recognizing text"
            ) {

              const percent =
                Math.round(
                  (
                    message.progress ||
                    0
                  ) * 100
                );

              showLoading(
                `กำลังอ่านภาษาไทย ${percent}%`
              );

            }

          }
        }
      );

    await thaiWorker.setParameters({

      preserve_interword_spaces:
        "1",

      user_defined_dpi:
        "300"

    });

  }

  if (!englishWorker) {

    englishWorker =
      await Tesseract.createWorker(
        "eng",
        1,
        {
          logger: message => {

            if (
              message &&
              message.status ===
                "recognizing text"
            ) {

              const percent =
                Math.round(
                  (
                    message.progress ||
                    0
                  ) * 100
                );

              showLoading(
                `กำลังอ่านภาษาอังกฤษ ${percent}%`
              );

            }

          }
        }
      );

    await englishWorker.setParameters({

      preserve_interword_spaces:
        "1",

      user_defined_dpi:
        "300"

    });

  }

  return {
    thaiWorker,
    englishWorker
  };

}


/* =========================================================
   CAMERA
========================================================= */

if (cameraButton) {

  cameraButton.addEventListener(
    "click",
    () => {

      if (!cameraInput) return;

      cameraInput.value =
        "";

      cameraInput.click();

    }
  );

}


/* =========================================================
   GALLERY
========================================================= */

if (galleryButton) {

  galleryButton.addEventListener(
    "click",
    () => {

      if (!galleryInput) return;

      galleryInput.value =
        "";

      galleryInput.click();

    }
  );

}


/* =========================================================
   CAMERA INPUT
========================================================= */

if (cameraInput) {

  cameraInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files &&
        event.target.files[0];

      if (file) {

        handleImageFile(
          file,
          true
        );

      }

    }
  );

}


/* =========================================================
   GALLERY INPUT
========================================================= */

if (galleryInput) {

  galleryInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files &&
        event.target.files[0];

      if (file) {

        handleImageFile(
          file,
          false
        );

      }

    }
  );

}


/* =========================================================
   HANDLE IMAGE
========================================================= */

function handleImageFile(
  file,
  fromCamera = false
) {

  if (!file) return;

  if (
    !file.type ||
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

  runOCR(
    file,
    fromCamera
  );

}


/* =========================================================
   REMOVE IMAGE
========================================================= */

if (removeImageButton) {

  removeImageButton.addEventListener(
    "click",
    clearSelectedImage
  );

}


function clearSelectedImage() {

  if (selectedImageUrl) {

    URL.revokeObjectURL(
      selectedImageUrl
    );

  }

  selectedImageUrl =
    null;

  selectedImageFile =
    null;

  if (imagePreview) {

    imagePreview.removeAttribute(
      "src"
    );

  }

  if (imagePreviewContainer) {

    imagePreviewContainer.hidden =
      true;

  }

  if (cameraInput) {

    cameraInput.value =
      "";

  }

  if (galleryInput) {

    galleryInput.value =
      "";

  }

  if (ocrText) {

    ocrText.value =
      "";

  }

  if (ocrCard) {

    ocrCard.hidden =
      true;

  }

  hideStatus();

}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImage(file) {

  return new Promise(
    async (
      resolve,
      reject
    ) => {

      try {

        if (
          "createImageBitmap" in
          window
        ) {

          try {

            const bitmap =
              await createImageBitmap(
                file,
                {
                  imageOrientation:
                    "from-image"
                }
              );

            resolve(
              bitmap
            );

            return;

          } catch (error) {

            console.warn(
              "Bitmap fallback:",
              error
            );

          }

        }

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
                "ไม่สามารถเปิดรูปได้"
              )
            );

          };

        img.src =
          url;

      } catch (error) {

        reject(
          error
        );

      }

    }
  );

}


/* =========================================================
   PREPARE IMAGE
========================================================= */

async function prepareOCRImage(
  file,
  scaleMultiplier = 1
) {

  const image =
    await loadImage(
      file
    );

  const width =
    image.width ||
    image.naturalWidth;

  const height =
    image.height ||
    image.naturalHeight;

  if (
    !width ||
    !height
  ) {

    throw new Error(
      "ไม่สามารถอ่านขนาดรูปได้"
    );

  }

  const MAX_SIZE =
    3200;

  let scale =
    1;

  if (
    width > MAX_SIZE ||
    height > MAX_SIZE
  ) {

    scale =
      Math.min(
        MAX_SIZE / width,
        MAX_SIZE / height
      );

  }

  scale *=
    scaleMultiplier;

  const MAX_PIXELS =
    12000000;

  let finalWidth =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );

  let finalHeight =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );

  const pixels =
    finalWidth *
    finalHeight;

  if (
    pixels > MAX_PIXELS
  ) {

    const pixelScale =
      Math.sqrt(
        MAX_PIXELS /
        pixels
      );

    finalWidth =
      Math.max(
        1,
        Math.round(
          finalWidth *
          pixelScale
        )
      );

    finalHeight =
      Math.max(
        1,
        Math.round(
          finalHeight *
          pixelScale
        )
      );

  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    finalWidth;

  canvas.height =
    finalHeight;

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );

  if (!ctx) {

    throw new Error(
      "ไม่สามารถสร้าง canvas ได้"
    );

  }

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.drawImage(
    image,
    0,
    0,
    finalWidth,
    finalHeight
  );

  if (
    image &&
    typeof image.close ===
      "function"
  ) {

    try {
      image.close();
    } catch (_) {}

  }

  return canvas;

}


/* =========================================================
   TEXT
========================================================= */

function cleanText(
  text
) {

  if (!text) return "";

  return String(
    text
  )
    .replace(
      /\r/g,
      ""
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .trim();

}


function countThai(
  text
) {

  return (
    String(
      text || ""
    )
      .match(
        /[ก-๙]/g
      ) || []
  ).length;

}


function countEnglish(
  text
) {

  return (
    String(
      text || ""
    )
      .match(
        /[a-zA-Z]/g
      ) || []
  ).length;

}


function countDigits(
  text
) {

  return (
    String(
      text || ""
    )
      .match(
        /[0-9๐-๙]/g
      ) || []
  ).length;

}


function countThaiMarks(
  text
) {

  return (
    String(
      text || ""
    )
      .match(
        /[ะาิีึืุูัเแโใไำ่้๊๋็์]/g
      ) || []
  ).length;

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeThaiText(
  text
) {

  if (!text) return "";

  return String(
    text
  )
    .replace(
      /\r/g,
      ""
    )
    .replace(
      /([ก-๙])\s+(?=[ก-๙])/g,
      "$1"
    )
    .replace(
      /\s+([ะาิีึืุูัเแโใไำ่้๊๋็์])/g,
      "$1"
    )
    .replace(
      /([เแโใไ])\s+(?=[ก-๙])/g,
      "$1"
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .trim();

}


function normalizeEnglishText(
  text
) {

  if (!text) return "";

  return String(
    text
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function normalizeForCompare(
  text
) {

  return String(
    text || ""
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* =========================================================
   LANGUAGE RATIO
========================================================= */

function getLanguageRatio(
  text
) {

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

  if (!total) {

    return {
      thai: 0,
      english: 0
    };

  }

  return {
    thai:
      thai / total,

    english:
      english / total
  };

}


/* =========================================================
   GIBBERISH
========================================================= */

function looksLikeEnglishGibberish(
  text
) {

  const value =
    normalizeEnglishText(
      text
    );

  if (!value)
    return true;

  const letters =
    countEnglish(
      value
    );

  if (
    letters < 4
  ) {

    return false;

  }

  const words =
    value
      .split(/\s+/)
      .filter(Boolean);

  /*
    อย่าตัดคำสั้นหรือประโยคปกติ
    เช่น:
    It's only you
    who can save you.
  */

  if (
    words.length >= 2
  ) {

    return false;

  }

  if (
    words.length === 1 &&
    letters >= 16
  ) {

    const word =
      words[0]
        .replace(
          /[^a-zA-Z]/g,
          ""
        );

    const vowels =
      (
        word.match(
          /[aeiouy]/gi
        ) || []
      ).length;

    if (
      vowels === 0
    ) {

      return true;

    }

    if (
      letters >= 19 &&
      vowels / letters < 0.20
    ) {

      return true;

    }

  }

  if (
    /(.)\1{5,}/i.test(
      value
    )
  ) {

    return true;

  }

  return false;

}


function looksLikeThaiGibberish(
  text
) {

  const value =
    normalizeThaiText(
      text
    );

  if (!value)
    return true;

  const thai =
    countThai(
      value
    );

  if (
    thai < 8
  ) {

    return false;

  }

  const marks =
    countThaiMarks(
      value
    );

  const markRatio =
    marks /
    Math.max(
      1,
      thai
    );

  /*
    ลดความเข้มจาก Version 39
    เพื่อไม่ให้ตัดข้อความไทยจริง
  */

  if (
    thai >= 18 &&
    markRatio < 0.035
  ) {

    return true;

  }

  const digits =
    countDigits(
      value
    );

  if (
    digits >= 4 &&
    digits >= thai * 0.45
  ) {

    return true;

  }

  return false;

}


function looksLikeOCRNoise(
  text
) {

  const value =
    cleanText(
      text
    );

  if (!value)
    return true;

  const thai =
    countThai(
      value
    );

  const english =
    countEnglish(
      value
    );

  const digits =
    countDigits(
      value
    );

  const letters =
    thai +
    english;

  if (!letters)
    return true;

  const symbols =
    (
      value.match(
        /[^ก-๙a-zA-Z0-9๐-๙\s.,!?'"’‘:;()\-]/g
      ) || []
    ).length;

  if (
    symbols >= 6 &&
    symbols > letters * 0.8
  ) {

    return true;

  }

  if (
    digits >= 6 &&
    digits > letters
  ) {

    return true;

  }

  if (
    english > 0 &&
    thai === 0 &&
    looksLikeEnglishGibberish(
      value
    )
  ) {

    return true;

  }

  if (
    thai > 0 &&
    english === 0 &&
    looksLikeThaiGibberish(
      value
    )
  ) {

    return true;

  }

  return false;

}


/* =========================================================
   LINE QUALITY
========================================================= */

function getLineQuality(
  line
) {

  const text =
    line.text || "";

  const ratio =
    getLanguageRatio(
      text
    );

  const expected =
    line.language === "th"
      ? ratio.thai
      : ratio.english;

  const confidence =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          line.confidence || 0
        )
      )
    );

  const wordConfidence =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          line.wordConfidence ||
          confidence
        )
      )
    );

  return (
    confidence * 0.45 +
    wordConfidence * 0.40 +
    expected * 100 * 0.15
  );

}


/* =========================================================
   WORD CONFIDENCE
========================================================= */

function getWordConfidence(
  data,
  bbox
) {

  if (
    !data ||
    !Array.isArray(
      data.words
    )
  ) {

    return null;

  }

  const x =
    Number(
      bbox.x || 0
    );

  const y =
    Number(
      bbox.y || 0
    );

  const right =
    x +
    Number(
      bbox.width || 0
    );

  const bottom =
    y +
    Number(
      bbox.height || 0
    );

  const values = [];

  for (
    const word
    of data.words
  ) {

    if (
      !word ||
      !word.text
    ) {

      continue;

    }

    const wb =
      word.bbox || {};

    const wx =
      Number(
        wb.x0 || 0
      );

    const wy =
      Number(
        wb.y0 || 0
      );

    const wr =
      Number(
        wb.x1 || 0
      );

    const wbott =
      Number(
        wb.y1 || 0
      );

    const overlapX =
      Math.max(
        0,
        Math.min(
          right,
          wr
        ) -
        Math.max(
          x,
          wx
        )
      );

    const overlapY =
      Math.max(
        0,
        Math.min(
          bottom,
          wbott
        ) -
        Math.max(
          y,
          wy
        )
      );

    if (
      overlapX > 0 &&
      overlapY > 0
    ) {

      const confidence =
        Number(
          word.confidence
        );

      if (
        Number.isFinite(
          confidence
        )
      ) {

        values.push(
          confidence
        );

      }

    }

  }

  if (
    !values.length
  ) {

    return null;

  }

  return (
    values.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    ) /
    values.length
  );

}


/* =========================================================
   EXTRACT LINES
========================================================= */

function extractOCRLines(
  data,
  language,
  passIndex
) {

  const result = [];

  if (
    !data ||
    !Array.isArray(
      data.lines
    )
  ) {

    return result;

  }

  for (
    const line
    of data.lines
  ) {

    const raw =
      cleanText(
        line.text
      );

    if (!raw)
      continue;

    const thai =
      countThai(
        raw
      );

    const english =
      countEnglish(
        raw
      );

    if (
      thai +
      english ===
      0
    ) {

      continue;

    }

    let text =
      raw;

    if (
      language === "th"
    ) {

      text =
        normalizeThaiText(
          text
        );

    } else {

      text =
        normalizeEnglishText(
          text
        );

    }

    if (!text)
      continue;

    const ratio =
      getLanguageRatio(
        text
      );

    /*
      Worker ภาษาไทย:
      ต้องเป็นไทยจริงเป็นหลัก

      Worker ภาษาอังกฤษ:
      ต้องเป็นอังกฤษจริงเป็นหลัก
    */

    if (
      language === "th"
    ) {

      if (
        thai < 2 ||
        ratio.thai < 0.68
      ) {

        continue;

      }

    } else {

      if (
        english < 2 ||
        ratio.english < 0.68
      ) {

        continue;

      }

    }

    if (
      looksLikeOCRNoise(
        text
      )
    ) {

      continue;

    }

    const bbox =
      line.bbox || {};

    const x =
      Number(
        bbox.x0 || 0
      );

    const y =
      Number(
        bbox.y0 || 0
      );

    const width =
      Math.max(
        1,
        Number(
          (bbox.x1 || 0) -
          (bbox.x0 || 0)
        )
      );

    const height =
      Math.max(
        1,
        Number(
          (bbox.y1 || 0) -
          (bbox.y0 || 0)
        )
      );

    const confidence =
      Number(
        line.confidence ||
        data.confidence ||
        0
      );

    const wordConfidence =
      getWordConfidence(
        data,
        {
          x,
          y,
          width,
          height
        }
      );

    result.push(
      {

        text,

        language,

        passIndex,

        confidence,

        wordConfidence:
          Number.isFinite(
            wordConfidence
          )
            ? wordConfidence
            : confidence,

        x,

        y,

        width,

        height

      }
    );

  }

  return result;

}


/* =========================================================
   REGION
========================================================= */

function lineCenterY(
  line
) {

  return (
    Number(line.y || 0) +
    Number(line.height || 0) / 2
  );

}


function sameTextRegion(
  a,
  b
) {

  const aHeight =
    Math.max(
      12,
      Number(
        a.height || 20
      )
    );

  const bHeight =
    Math.max(
      12,
      Number(
        b.height || 20
      )
    );

  const referenceHeight =
    Math.min(
      aHeight,
      bHeight
    );

  const verticalDistance =
    Math.abs(
      lineCenterY(a) -
      lineCenterY(b)
    );

  /*
    OCR สองรอบอาจวัดตำแหน่งไม่เท่ากัน
    จึงให้ระยะค่อนข้างกว้าง
  */

  if (
    verticalDistance >
    referenceHeight * 0.75
  ) {

    return false;

  }

  const aRight =
    Number(a.x || 0) +
    Number(a.width || 0);

  const bRight =
    Number(b.x || 0) +
    Number(b.width || 0);

  let gap = 0;

  if (
    aRight <
    Number(b.x || 0)
  ) {

    gap =
      Number(b.x || 0) -
      aRight;

  } else if (
    bRight <
    Number(a.x || 0)
  ) {

    gap =
      Number(a.x || 0) -
      bRight;

  }

  return (
    gap <=
    Math.max(
      80,
      referenceHeight * 2.5
    )
  );

}


/* =========================================================
   TEXT SIMILARITY
========================================================= */

function lineSimilarity(
  a,
  b
) {

  const x =
    normalizeForCompare(
      a
    );

  const y =
    normalizeForCompare(
      b
    );

  if (!x || !y)
    return 0;

  if (x === y)
    return 1;

  const xWords =
    x.split(/\s+/)
      .filter(Boolean);

  const yWords =
    y.split(/\s+/)
      .filter(Boolean);

  let same =
    0;

  for (
    const word
    of xWords
  ) {

    if (
      yWords.includes(
        word
      )
    ) {

      same++;

    }

  }

  return (
    same /
    Math.max(
      xWords.length,
      yWords.length
    )
  );

}


/* =========================================================
   MERGE OCR CANDIDATES
========================================================= */

function mergeCandidateLines(
  allCandidates
) {

  const groups = [];

  for (
    const candidate
    of allCandidates
  ) {

    let group =
      null;

    for (
      const existing
      of groups
    ) {

      const representative =
        existing[0];

      if (
        representative.language !==
        candidate.language
      ) {

        continue;

      }

      if (
        !sameTextRegion(
          representative,
          candidate
        )
      ) {

        continue;

      }

      const similarity =
        lineSimilarity(
          representative.text,
          candidate.text
        );

      /*
        0.35 เพื่อให้
        "It's on"
        กับ
        "It's only you"
        อยู่กลุ่มเดียวกันได้
        แล้วเลือกเวอร์ชันที่ครบกว่า
      */

      if (
        similarity >= 0.35 ||
        representative.text.length >=
          candidate.text.length * 0.55
      ) {

        group =
          existing;

        break;

      }

    }

    if (group) {

      group.push(
        candidate
      );

    } else {

      groups.push([
        candidate
      ]);

    }

  }

  return groups;

}


/* =========================================================
   CHOOSE BEST TEXT
========================================================= */

function chooseBestFromGroup(
  group
) {

  if (!group.length)
    return null;

  /*
    นับว่าข้อความแต่ละ candidate
    ปรากฏในกี่ pass
  */

  const scored =
    group.map(
      candidate => {

        let support =
          0;

        for (
          const other
          of group
        ) {

          if (
            other ===
            candidate
          ) {

            continue;

          }

          if (
            lineSimilarity(
              candidate.text,
              other.text
            ) >= 0.45
          ) {

            support++;

          }

        }

        /*
          ความครบของข้อความ
        */

        const length =
          candidate.text
            .replace(
              /\s/g,
              ""
            )
            .length;

        const quality =
          getLineQuality(
            candidate
          );

        let score =
          quality +
          support * 18;

        /*
          ถ้า text ยาวกว่าเล็กน้อย
          และ confidence ไม่แย่
          ให้โอกาสข้อความที่ครบกว่า
        */

        if (
          length >= 8
        ) {

          score +=
            Math.min(
              12,
              length * 0.12
            );

        }

        /*
          ประโยคภาษาอังกฤษหลายคำ
          ไม่ควรแพ้คำสั้นเพียงเพราะ
          confidence ต่างกันเล็กน้อย
        */

        if (
          candidate.language === "en" &&
          candidate.text
            .split(/\s+/)
            .length >= 2
        ) {

          score += 4;

        }

        return {
          candidate,
          support,
          score
        };

      }
    );

  scored.sort(
    (
      a,
      b
    ) => {

      /*
        ถ้าข้อความหนึ่งยาวกว่าอีกข้อความมาก
        แต่ quality ไม่ต่างกันมาก
        ให้ข้อความยาวกว่า
      */

      const aLength =
        a.candidate.text
          .replace(/\s/g, "")
          .length;

      const bLength =
        b.candidate.text
          .replace(/\s/g, "")
          .length;

      if (
        Math.abs(
          a.score -
          b.score
        ) < 8 &&
        Math.abs(
          aLength -
          bLength
        ) >= 4
      ) {

        return (
          bLength -
          aLength
        );

      }

      return (
        b.score -
        a.score
      );

    }
  );

  return {
    ...scored[0].candidate,
    support:
      scored[0].support + 1
  };

}


/* =========================================================
   SELECT FINAL LINES
========================================================= */

function selectFinalLines(
  allCandidates
) {

  const groups =
    mergeCandidateLines(
      allCandidates
    );

  const selected = [];

  for (
    const group
    of groups
  ) {

    const best =
      chooseBestFromGroup(
        group
      );

    if (!best)
      continue;

    const quality =
      getLineQuality(
        best
      );

    const support =
      Number(
        best.support || 1
      );

    /*
      ถ้าเจอหลายรอบ
      ให้ผ่านง่ายขึ้น
    */

    if (
      support >= 2 &&
      quality >= 42
    ) {

      selected.push(
        best
      );

      continue;

    }

    /*
      ถ้าเจอครั้งเดียว
      ต้อง confidence ดี
    */

    if (
      support === 1 &&
      quality >= 68
    ) {

      selected.push(
        best
      );

      continue;

    }

  }

  /*
    ป้องกันภาษาไทย hallucination
    ที่อยู่ตำแหน่งเดียวกับอังกฤษ
  */

  const final = [];

  for (
    const candidate
    of selected
  ) {

    let keep = true;

    for (
      let i = 0;
      i < final.length;
      i++
    ) {

      const old =
        final[i];

      if (
        old.language ===
        candidate.language
      ) {

        continue;

      }

      if (
        !sameTextRegion(
          old,
          candidate
        )
      ) {

        continue;

      }

      /*
        ถ้าคนละภาษาแต่ทั้งคู่
        อ่านได้หลาย pass
        อาจเป็นภาพสองภาษาอยู่บรรทัดใกล้กัน
      */

      if (
        old.support >= 2 &&
        candidate.support >= 2
      ) {

        continue;

      }

      const oldQuality =
        getLineQuality(
          old
        );

      const newQuality =
        getLineQuality(
          candidate
        );

      /*
        ภาษาไทย hallucination
        มัก confidence ต่ำกว่า
      */

      if (
        candidate.language === "th" &&
        old.language === "en" &&
        oldQuality >=
          newQuality + 8
      ) {

        keep = false;
        break;

      }

      if (
        candidate.language === "en" &&
        old.language === "th" &&
        newQuality >=
          oldQuality + 8
      ) {

        final.splice(
          i,
          1
        );

        i--;

      }

    }

    if (keep) {

      final.push(
        candidate
      );

    }

  }

  /*
    เรียงตำแหน่งบนลงล่าง
  */

  final.sort(
    (
      a,
      b
    ) => {

      const ay =
        Number(
          a.y || 0
        );

      const by =
        Number(
          b.y || 0
        );

      const h =
        Math.min(
          Number(
            a.height || 20
          ),
          Number(
            b.height || 20
          )
        );

      if (
        Math.abs(
          ay - by
        ) <=
        h * 0.7
      ) {

        return (
          Number(
            a.x || 0
          ) -
          Number(
            b.x || 0
          )
        );

      }

      return ay - by;

    }
  );

  return final;

}


/* =========================================================
   BUILD OCR TEXT
========================================================= */

function buildOCRText(
  candidates
) {

  if (!candidates.length)
    return "";

  const selected =
    selectFinalLines(
      candidates
    );

  const output = [];

  for (
    const line
    of selected
  ) {

    let text =
      cleanText(
        line.text
      );

    if (!text)
      continue;

    /*
      อย่าตัดประโยคที่มีหลายคำ
      เพราะ OCR อาจอ่านได้ไม่เหมือนกัน
      ในแต่ละ pass
    */

    if (
      line.language === "en"
    ) {

      if (
        looksLikeEnglishGibberish(
          text
        )
      ) {

        continue;

      }

    } else {

      if (
        looksLikeThaiGibberish(
          text
        )
      ) {

        /*
          ใช้เฉพาะกรณีมั่วชัดเจน
        */

        if (
          line.support < 2
        ) {

          continue;

        }

      }

    }

    /*
      กัน duplicate
    */

    let duplicate =
      false;

    for (
      const old
      of output
    ) {

      if (
        lineSimilarity(
          old,
          text
        ) >= 0.90
      ) {

        duplicate = true;

        break;

      }

    }

    if (!duplicate) {

      output.push(
        text
      );

    }

  }

  return output.join(
    "\n"
  ).trim();

}


/* =========================================================
   RUN OCR PASS
========================================================= */

async function runOCRPass(
  workers,
  canvas,
  psm,
  passIndex
) {

  const results =
    await Promise.all([

      recognizeOCR(
        workers.thaiWorker,
        canvas,
        psm
      ),

      recognizeOCR(
        workers.englishWorker,
        canvas,
        psm
      )

    ]);

  const thai =
    extractOCRLines(
      results[0],
      "th",
      passIndex
    );

  const english =
    extractOCRLines(
      results[1],
      "en",
      passIndex
    );

  return [
    ...thai,
    ...english
  ];

}


/* =========================================================
   RECOGNIZE
========================================================= */

async function recognizeOCR(
  worker,
  canvas,
  psm
) {

  await worker.setParameters({

    tessedit_pageseg_mode:
      String(psm),

    preserve_interword_spaces:
      "1",

    user_defined_dpi:
      "300"

  });

  const result =
    await worker.recognize(
      canvas
    );

  return (
    result &&
    result.data
      ? result.data
      : {}
  );

}


/* =========================================================
   MAIN OCR
========================================================= */

async function runOCR(
  file,
  fromCamera = false
) {

  if (isOCRRunning) {

    showStatus(
      "กำลังอ่านรูปอยู่ รอสักครู่นะคะ",
      "info"
    );

    return;

  }

  isOCRRunning =
    true;

  if (ocrCard) {

    ocrCard.hidden =
      false;

  }

  if (ocrText) {

    ocrText.value =
      "";

  }

  hideStatus();

  try {

    const workers =
      await getOCRWorkers();

    const candidates = [];


    /* =====================================================
       PASS 1
    ===================================================== */

    showLoading(
      fromCamera
        ? "กำลังอ่านข้อความจากกล้อง..."
        : "กำลังอ่านข้อความจากรูป..."
    );

    const normalCanvas =
      await prepareOCRImage(
        file,
        1
      );

    const pass1 =
      await runOCRPass(
        workers,
        normalCanvas,
        6,
        1
      );

    candidates.push(
      ...pass1
    );


    /* =====================================================
       PASS 2
       ขยายภาพ
    ===================================================== */

    showLoading(
      "กำลังอ่านข้อความให้ครบขึ้น..."
    );

    const enlargedCanvas =
      await prepareOCRImage(
        file,
        fromCamera
          ? 1.45
          : 1.25
      );

    const pass2 =
      await runOCRPass(
        workers,
        enlargedCanvas,
        6,
        2
      );

    candidates.push(
      ...pass2
    );


    let finalText =
      buildOCRText(
        candidates
      );


    /* =====================================================
       PASS 3
       ใช้เมื่อผลยังสั้น
    ===================================================== */

    if (
      !finalText ||
      finalText.length < 15
    ) {

      showLoading(
        "กำลังลองอ่านตำแหน่งข้อความอีกครั้ง..."
      );

      const sparseCanvas =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.30
            : 1.15
        );

      const pass3 =
        await runOCRPass(
          workers,
          sparseCanvas,
          11,
          3
        );

      candidates.push(
        ...pass3
      );

      finalText =
        buildOCRText(
          candidates
        );

    }


    /* =====================================================
       PASS 4
       Contrast
    ===================================================== */

    if (
      !finalText ||
      finalText.length < 15
    ) {

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );

      const baseCanvas =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.30
            : 1.15
        );

      const enhancedCanvas =
        createEnhancedCanvas(
          baseCanvas
        );

      const pass4 =
        await runOCRPass(
          workers,
          enhancedCanvas,
          6,
          4
        );

      candidates.push(
        ...pass4
      );

      finalText =
        buildOCRText(
          candidates
        );

    }


    /* =====================================================
       FINAL CLEAN
    ===================================================== */

    finalText =
      finalText
        .split("\n")
        .map(
          line =>
            cleanText(
              line
            )
        )
        .filter(Boolean)
        .filter(
          line =>
            !looksLikeOCRNoise(
              line
            )
        )
        .filter(
          line =>
            !looksLikeEnglishGibberish(
              line
            )
        )
        .join("\n")
        .trim();


    if (!finalText) {

      throw new Error(
        "ไม่พบข้อความที่อ่านได้"
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

    hideLoading();

    showOCRStatus(
      finalText
    );

  } catch (error) {

    console.error(
      "OCR ERROR:",
      error
    );

    hideLoading();

    if (ocrText) {

      ocrText.value =
        "";

    }

    showStatus(
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองถ่ายให้ข้อความชัดขึ้นค่ะ",
      "error"
    );

  } finally {

    isOCRRunning =
      false;

  }

}


/* =========================================================
   OCR STATUS
========================================================= */

function showOCRStatus(
  finalText
) {

  const hasThai =
    /[ก-๙]/.test(
      finalText
    );

  const hasEnglish =
    /[a-zA-Z]/.test(
      finalText
    );

  if (
    hasThai &&
    hasEnglish
  ) {

    showStatus(
      "สแกนภาษาไทยและอังกฤษเรียบร้อยแล้ว",
      "success"
    );

  } else if (hasThai) {

    showStatus(
      "สแกนภาษาไทยเรียบร้อยแล้ว",
      "success"
    );

  } else if (hasEnglish) {

    showStatus(
      "สแกนภาษาอังกฤษเรียบร้อยแล้ว",
      "success"
    );

  } else {

    showStatus(
      "ยังไม่พบข้อความที่ชัดเจน",
      "info"
    );

  }

}


/* =========================================================
   USE OCR
========================================================= */

if (useOcrButton) {

  useOcrButton.addEventListener(
    "click",
    () => {

      const text =
        ocrText
          ? ocrText.value.trim()
          : "";

      if (!text) {

        showStatus(
          "ยังไม่มีข้อความจากรูป",
          "error"
        );

        return;

      }

      if (inputText) {

        inputText.value =
          text;

        inputText.focus();

      }

      showStatus(
        "นำข้อความไปไว้ในช่องแปลแล้ว",
        "success"
      );

    }
  );

}


/* =========================================================
   TRANSLATION SOURCE FILTER
========================================================= */

function extractSourceLanguageText(
  text,
  language
) {

  if (!text)
    return "";

  const lines =
    String(
      text
    )
      .replace(
        /\r/g,
        ""
      )
      .split(
        "\n"
      )
      .map(
        line =>
          cleanText(
            line
          )
      )
      .filter(Boolean);

  if (!lines.length)
    return "";

  const sourceLines = [];

  for (
    const line
    of lines
  ) {

    const thai =
      countThai(
        line
      );

    const english =
      countEnglish(
        line
      );

    if (
      language === "th"
    ) {

      if (
        thai > 0 &&
        thai >= english
      ) {

        let value =
          normalizeThaiText(
            line
          );

        value =
          value.replace(
            /[0-9๐-๙]/g,
            ""
          );

        value =
          value.trim();

        if (value) {

          sourceLines.push(
            value
          );

        }

      }

    } else {

      if (
        english > 0 &&
        english >= thai
      ) {

        let value =
          normalizeEnglishText(
            line
          );

        value =
          value.replace(
            /[๐-๙]/g,
            ""
          );

        value =
          value.trim();

        if (value) {

          sourceLines.push(
            value
          );

        }

      }

    }

  }

  if (
    sourceLines.length === 0
  ) {

    return cleanText(
      text
    );

  }

  return sourceLines.join(
    "\n"
  );

}


/* =========================================================
   PREPARE TRANSLATION
========================================================= */

function prepareTranslationText(
  text
) {

  const value =
    String(
      text || ""
    ).trim();

  if (!value)
    return "";

  const thaiCount =
    countThai(
      value
    );

  const englishCount =
    countEnglish(
      value
    );

  if (
    thaiCount > 0 &&
    englishCount > 0
  ) {

    return extractSourceLanguageText(
      value,
      sourceLanguage
    );

  }

  return value;

}


/* =========================================================
   TRANSLATE
========================================================= */

if (translateButton) {

  translateButton.addEventListener(
    "click",
    translateText
  );

}


async function translateText() {

  if (isTranslating)
    return;

  const originalText =
    inputText
      ? inputText.value.trim()
      : "";

  if (!originalText) {

    showStatus(
      "กรุณาพิมพ์ข้อความก่อนแปล",
      "error"
    );

    return;

  }

  const text =
    prepareTranslationText(
      originalText
    );

  if (!text) {

    showStatus(
      "ไม่พบข้อความภาษาต้นทางสำหรับแปล",
      "error"
    );

    return;

  }

  if (
    text !== originalText &&
    inputText
  ) {

    inputText.value =
      text;

  }

  isTranslating =
    true;

  if (translateButton) {

    translateButton.disabled =
      true;

  }

  showLoading(
    "กำลังแปลภาษา..."
  );

  hideStatus();

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
                "translate",

              text:
                text,

              source:
                sourceLanguage,

              target:
                targetLanguage

            })

        }
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    const data =
      await response.json();

    if (
      !data ||
      data.success === false
    ) {

      throw new Error(
        data &&
        data.message
          ? data.message
          : "แปลภาษาไม่สำเร็จ"
      );

    }

    let translated =
      data.translation ||
      data.translatedText ||
      data.result ||
      "";

    translated =
      cleanTranslation(
        translated
      );

    if (!translated) {

      throw new Error(
        "ไม่พบคำแปล"
      );

    }

    if (resultText) {

      resultText.textContent =
        translated;

      resultText.classList.remove(
        "empty"
      );

    }

    showStatus(
      "แปลภาษาเรียบร้อยแล้ว",
      "success"
    );

  } catch (error) {

    console.error(
      "TRANSLATE ERROR:",
      error
    );

    if (resultText) {

      resultText.textContent =
        "เกิดข้อผิดพลาดในการแปลภาษา";

      resultText.classList.add(
        "empty"
      );

    }

    showStatus(
      "เชื่อมต่อระบบแปลภาษาไม่สำเร็จ",
      "error"
    );

  } finally {

    hideLoading();

    if (translateButton) {

      translateButton.disabled =
        false;

    }

    isTranslating =
      false;

  }

}


/* =========================================================
   CLEAN TRANSLATION
========================================================= */

function cleanTranslation(
  text
) {

  if (!text)
    return "";

  const lines =
    String(
      text
    )
      .replace(
        /\r/g,
        ""
      )
      .split(
        "\n"
      )
      .map(
        line =>
          line
            .replace(
              /\s+/g,
              " "
            )
            .trim()
      )
      .filter(Boolean);

  const unique = [];

  for (
    const line
    of lines
  ) {

    const normalized =
      line.toLowerCase();

    if (
      unique.some(
        old =>
          old.toLowerCase() ===
          normalized
      )
    ) {

      continue;

    }

    unique.push(
      line
    );

  }

  return unique.join(
    "\n"
  );

}


/* =========================================================
   SPEECH
========================================================= */

function speakText(
  text,
  language
) {

  if (!text)
    return;

  if (
    !(
      "speechSynthesis" in
      window
    )
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
      text
    );

  utterance.lang =
    language === "th"
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
   SPEAK OCR
========================================================= */

if (speakOcrButton) {

  speakOcrButton.addEventListener(
    "click",
    () => {

      const text =
        ocrText
          ? ocrText.value.trim()
          : "";

      if (!text)
        return;

      speakText(
        text,
        sourceLanguage
      );

    }
  );

}


/* =========================================================
   SPEAK RESULT
========================================================= */

if (speakResultButton) {

  speakResultButton.addEventListener(
    "click",
    () => {

      const text =
        resultText
          ? resultText.textContent.trim()
          : "";

      if (
        !text ||
        text ===
          "คำแปลจะแสดงที่นี่"
      ) {

        return;

      }

      speakText(
        text,
        targetLanguage
      );

    }
  );

}


/* =========================================================
   COPY
========================================================= */

if (copyResultButton) {

  copyResultButton.addEventListener(
    "click",
    async () => {

      const text =
        resultText
          ? resultText.textContent.trim()
          : "";

      if (
        !text ||
        text ===
          "คำแปลจะแสดงที่นี่"
      ) {

        return;

      }

      try {

        await navigator.clipboard.writeText(
          text
        );

        showStatus(
          "คัดลอกคำแปลแล้ว",
          "success"
        );

      } catch (error) {

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

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
  );

}


/* =========================================================
   CLEAR
========================================================= */

if (clearInputButton) {

  clearInputButton.addEventListener(
    "click",
    () => {

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

      clearSelectedImage();

    }
  );

}


/* =========================================================
   SWAP LANGUAGE
========================================================= */

if (swapLanguageButton) {

  swapLanguageButton.addEventListener(
    "click",
    () => {

      const oldSource =
        sourceLanguage;

      sourceLanguage =
        targetLanguage;

      targetLanguage =
        oldSource;

      updateLanguageUI();

      const input =
        inputText
          ? inputText.value.trim()
          : "";

      const result =
        resultText
          ? resultText.textContent.trim()
          : "";

      if (
        result &&
        result !==
          "คำแปลจะแสดงที่นี่"
      ) {

        if (inputText) {

          inputText.value =
            result;

        }

        if (resultText) {

          resultText.textContent =
            input ||
            "คำแปลจะแสดงที่นี่";

          if (input) {

            resultText.classList.remove(
              "empty"
            );

          } else {

            resultText.classList.add(
              "empty"
            );

          }

        }

      }

      showStatus(
        "สลับภาษาแล้ว",
        "success"
      );

    }
  );

}


/* =========================================================
   CTRL + ENTER
========================================================= */

if (inputText) {

  inputText.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        (
          event.ctrlKey ||
          event.metaKey
        )
      ) {

        event.preventDefault();

        translateText();

      }

    }
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

updateLanguageUI();

hideLoading();

hideStatus();


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (selectedImageUrl) {

      URL.revokeObjectURL(
        selectedImageUrl
      );

    }

    if (thaiWorker) {

      thaiWorker
        .terminate()
        .catch(
          () => {}
        );

    }

    if (englishWorker) {

      englishWorker
        .terminate()
        .catch(
          () => {}
        );

    }

  }
);


/* =========================================================
   VERSION 40 END
========================================================= */
