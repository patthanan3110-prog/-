/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 43

   OCR:
   - Thai / English แยก Worker
   - OCR แบบแยกพื้นที่ภาษา
   - ป้องกัน Thai OCR อ่านตัว English
   - ป้องกัน English OCR อ่านตัว Thai
   - ใช้ตำแหน่งจริงของข้อความ
   - ใช้ตำแหน่งแบบสัดส่วนเพื่อรวม OCR ต่างขนาด
   - ลด OCR hallucination
   - ป้องกันข้อความจริงถูกตัดทิ้งจากการ OCR หลายรอบ
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

    if (sourceLanguageText)
      sourceLanguageText.textContent = "ภาษาไทย";

    if (targetLanguageText)
      targetLanguageText.textContent = "English";

  } else {

    if (sourceLanguageText)
      sourceLanguageText.textContent = "English";

    if (targetLanguageText)
      targetLanguageText.textContent = "ภาษาไทย";

  }

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(message, type = "info") {

  if (!statusMessage) return;

  statusMessage.textContent = message;

  statusMessage.className =
    "status-message " + type;

  statusMessage.hidden = false;

}


function hideStatus() {

  if (statusMessage)
    statusMessage.hidden = true;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(message) {

  if (loadingText)
    loadingText.textContent = message;

  if (loadingBox)
    loadingBox.hidden = false;

}


function hideLoading() {

  if (loadingBox)
    loadingBox.hidden = true;

}


/* =========================================================
   LOAD TESSERACT
========================================================= */

function loadTesseract() {

  if (window.Tesseract)
    return Promise.resolve(window.Tesseract);

  if (tesseractLoading)
    return tesseractLoading;

  tesseractLoading =
    new Promise((resolve, reject) => {

      const existing =
        document.querySelector(
          'script[data-tesseract="true"]'
        );

      if (existing) {

        existing.addEventListener(
          "load",
          () => {

            if (window.Tesseract)
              resolve(window.Tesseract);
            else
              reject(
                new Error(
                  "ไม่พบ Tesseract.js"
                )
              );

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
        document.createElement("script");

      script.src = TESSERACT_URL;
      script.async = true;
      script.dataset.tesseract = "true";

      script.onload = () => {

        if (window.Tesseract)
          resolve(window.Tesseract);
        else
          reject(
            new Error(
              "ไม่พบ Tesseract.js"
            )
          );

      };

      script.onerror = () => {

        reject(
          new Error(
            "โหลด Tesseract.js ไม่สำเร็จ"
          )
        );

      };

      document.head.appendChild(script);

    });

  return tesseractLoading;

}


/* =========================================================
   OCR WORKERS
========================================================= */

async function getOCRWorkers() {

  if (thaiWorker && englishWorker) {

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
                  (message.progress || 0) * 100
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
                  (message.progress || 0) * 100
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

      if (!cameraInput)
        return;

      cameraInput.value = "";
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

      if (!galleryInput)
        return;

      galleryInput.value = "";
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

      if (file)
        handleImageFile(
          file,
          true
        );

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

      if (file)
        handleImageFile(
          file,
          false
        );

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

  if (!file)
    return;

  if (
    !file.type ||
    !file.type.startsWith("image/")
  ) {

    showStatus(
      "กรุณาเลือกไฟล์รูปภาพ",
      "error"
    );

    return;

  }

  selectedImageFile = file;

  if (selectedImageUrl)
    URL.revokeObjectURL(
      selectedImageUrl
    );

  selectedImageUrl =
    URL.createObjectURL(file);

  if (imagePreview)
    imagePreview.src =
      selectedImageUrl;

  if (imagePreviewContainer)
    imagePreviewContainer.hidden =
      false;

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

  if (selectedImageUrl)
    URL.revokeObjectURL(
      selectedImageUrl
    );

  selectedImageUrl = null;
  selectedImageFile = null;

  if (imagePreview)
    imagePreview.removeAttribute(
      "src"
    );

  if (imagePreviewContainer)
    imagePreviewContainer.hidden =
      true;

  if (cameraInput)
    cameraInput.value = "";

  if (galleryInput)
    galleryInput.value = "";

  if (ocrText)
    ocrText.value = "";

  if (ocrCard)
    ocrCard.hidden = true;

  hideStatus();

}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImage(file) {

  return new Promise(
    async (resolve, reject) => {

      try {

        if (
          "createImageBitmap" in window
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

            resolve(bitmap);
            return;

          } catch (error) {

            console.warn(
              "Bitmap fallback:",
              error
            );

          }

        }

        const url =
          URL.createObjectURL(file);

        const img =
          new Image();

        img.onload = () => {

          URL.revokeObjectURL(url);

          resolve(img);

        };

        img.onerror = () => {

          URL.revokeObjectURL(url);

          reject(
            new Error(
              "ไม่สามารถเปิดรูปได้"
            )
          );

        };

        img.src = url;

      } catch (error) {

        reject(error);

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
    await loadImage(file);

  const width =
    image.width ||
    image.naturalWidth;

  const height =
    image.height ||
    image.naturalHeight;

  if (!width || !height)
    throw new Error(
      "ไม่สามารถอ่านขนาดรูปได้"
    );

  const MAX_SIZE = 3200;

  let scale = 1;

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

  scale *= scaleMultiplier;

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
    pixels >
    MAX_PIXELS
  ) {

    const pixelScale =
      Math.sqrt(
        MAX_PIXELS / pixels
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

  if (!ctx)
    throw new Error(
      "ไม่สามารถสร้าง canvas ได้"
    );

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
   ENHANCED IMAGE
========================================================= */

function createEnhancedCanvas(
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

  const sourceCtx =
    sourceCanvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );

  if (!sourceCtx || !ctx)
    return sourceCanvas;

  const imageData =
    sourceCtx.getImageData(
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height
    );

  const data =
    imageData.data;

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const r =
      data[i];

    const g =
      data[i + 1];

    const b =
      data[i + 2];

    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    const contrast =
      (gray - 128) *
      1.18 +
      128;

    const value =
      Math.max(
        0,
        Math.min(
          255,
          contrast
        )
      );

    data[i] =
      value;

    data[i + 1] =
      value;

    data[i + 2] =
      value;

  }

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvas;

}


/* =========================================================
   MASK REGIONS
========================================================= */

function createMaskedCanvas(
  sourceCanvas,
  regions,
  padding = 12
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

  if (!ctx)
    return sourceCanvas;

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );

  ctx.fillStyle =
    "#ffffff";

  for (
    const region
    of regions || []
  ) {

    /*
      ใช้พิกัดจริงของ canvas
      เพราะ mask เกิดภายใน pass เดียวกัน
    */

    const x =
      Math.max(
        0,
        Math.floor(
          Number(
            region.x || 0
          ) -
          padding
        )
      );

    const y =
      Math.max(
        0,
        Math.floor(
          Number(
            region.y || 0
          ) -
          padding
        )
      );

    const right =
      Math.min(
        canvas.width,
        Math.ceil(
          Number(
            region.x || 0
          ) +
          Number(
            region.width || 0
          ) +
          padding
        )
      );

    const bottom =
      Math.min(
        canvas.height,
        Math.ceil(
          Number(
            region.y || 0
          ) +
          Number(
            region.height || 0
          ) +
          padding
        )
      );

    const width =
      Math.max(
        1,
        right - x
      );

    const height =
      Math.max(
        1,
        bottom - y
      );

    ctx.fillRect(
      x,
      y,
      width,
      height
    );

  }

  return canvas;

}


/* =========================================================
   TEXT
========================================================= */

function cleanText(text) {

  if (!text)
    return "";

  return String(text)
    .replace(/\r/g, "")
    .replace(
      /[ \t]+/g,
      " "
    )
    .trim();

}


function countThai(text) {

  return (
    String(text || "")
      .match(
        /[ก-๙]/g
      ) || []
  ).length;

}


function countEnglish(text) {

  return (
    String(text || "")
      .match(
        /[a-zA-Z]/g
      ) || []
  ).length;

}


function countDigits(text) {

  return (
    String(text || "")
      .match(
        /[0-9๐-๙]/g
      ) || []
  ).length;

}


function countThaiMarks(text) {

  return (
    String(text || "")
      .match(
        /[ะาิีึืุูัเแโใไำ่้๊๋็์]/g
      ) || []
  ).length;

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeThaiText(text) {

  if (!text)
    return "";

  return String(text)
    .replace(/\r/g, "")
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


function normalizeEnglishText(text) {

  if (!text)
    return "";

  return String(text)
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function normalizeForCompare(text) {

  return String(text || "")
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

function getLanguageRatio(text) {

  const thai =
    countThai(text);

  const english =
    countEnglish(text);

  const total =
    thai + english;

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
    countEnglish(value);

  if (letters < 4)
    return false;

  const words =
    value
      .split(/\s+/)
      .filter(Boolean);

  if (words.length >= 2)
    return false;

  if (
    words.length === 1 &&
    letters >= 16
  ) {

    const word =
      words[0].replace(
        /[^a-zA-Z]/g,
        ""
      );

    const vowels =
      (
        word.match(
          /[aeiouy]/gi
        ) || []
      ).length;

    if (!vowels)
      return true;

    if (
      letters >= 19 &&
      vowels / letters <
        0.20
    )
      return true;

  }

  if (
    /(.)\1{5,}/i.test(
      value
    )
  )
    return true;

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
    countThai(value);

  if (thai < 8)
    return false;

  const digits =
    countDigits(value);

  if (
    digits >= 4 &&
    digits >=
      thai * 0.45
  )
    return true;

  if (
    /(.)\1{4,}/.test(
      value
    )
  )
    return true;

  const strange =
    (
      value.match(
        /[^ก-๙\s0-9๐-๙]/g
      ) || []
    ).length;

  if (
    strange >= 3 &&
    strange >=
      thai * 0.25
  )
    return true;

  return false;

}


function looksLikeOCRNoise(text) {

  const value =
    cleanText(text);

  if (!value)
    return true;

  const thai =
    countThai(value);

  const english =
    countEnglish(value);

  const digits =
    countDigits(value);

  const letters =
    thai + english;

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
    symbols >
      letters * 0.8
  )
    return true;

  if (
    digits >= 6 &&
    digits > letters
  )
    return true;

  if (
    english > 0 &&
    thai === 0 &&
    looksLikeEnglishGibberish(
      value
    )
  )
    return true;

  if (
    thai > 0 &&
    english === 0 &&
    looksLikeThaiGibberish(
      value
    )
  )
    return true;

  return false;

}


/* =========================================================
   LINE QUALITY
========================================================= */

function getLineQuality(line) {

  const text =
    line.text || "";

  const ratio =
    getLanguageRatio(text);

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
    confidence * 0.30 +
    wordConfidence * 0.50 +
    expected * 100 * 0.20
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
  )
    return null;

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
    )
      continue;

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
      )
        values.push(
          confidence
        );

    }

  }

  if (!values.length)
    return null;

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
   เพิ่ม normalized coordinates
========================================================= */

function extractOCRLines(
  data,
  language,
  passIndex,
  canvas
) {

  const result = [];

  if (
    !data ||
    !Array.isArray(
      data.lines
    )
  )
    return result;

  const canvasWidth =
    Number(
      canvas &&
      canvas.width
    ) || 1;

  const canvasHeight =
    Number(
      canvas &&
      canvas.height
    ) || 1;

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
      countThai(raw);

    const english =
      countEnglish(raw);

    if (
      !thai &&
      !english
    )
      continue;

    let text =
      raw;

    if (
      language === "th"
    )
      text =
        normalizeThaiText(
          text
        );
    else
      text =
        normalizeEnglishText(
          text
        );

    if (!text)
      continue;

    const ratio =
      getLanguageRatio(
        text
      );

    if (
      language === "th"
    ) {

      if (
        thai < 2 ||
        ratio.thai < 0.72
      )
        continue;

    } else {

      if (
        english < 2 ||
        ratio.english < 0.72
      )
        continue;

    }

    if (
      looksLikeOCRNoise(
        text
      )
    )
      continue;

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

    result.push({

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

      /*
        พิกัดจริง
        ใช้สำหรับ mask
      */

      x,
      y,
      width,
      height,

      /*
        พิกัดแบบสัดส่วน
        ใช้สำหรับเปรียบเทียบ
        OCR จากภาพคนละขนาด
      */

      nx:
        x / canvasWidth,

      ny:
        y / canvasHeight,

      nw:
        width / canvasWidth,

      nh:
        height / canvasHeight

    });

  }

  return result;

}


/* =========================================================
   GEOMETRY
========================================================= */

function getNormalizedGeometry(
  line
) {

  if (
    Number.isFinite(
      Number(line.nx)
    ) &&
    Number.isFinite(
      Number(line.ny)
    ) &&
    Number.isFinite(
      Number(line.nw)
    ) &&
    Number.isFinite(
      Number(line.nh)
    )
  ) {

    return {

      x: Number(line.nx),

      y: Number(line.ny),

      width:
        Number(line.nw),

      height:
        Number(line.nh)

    };

  }

  return {

    x:
      Number(line.x || 0),

    y:
      Number(line.y || 0),

    width:
      Number(line.width || 0),

    height:
      Number(line.height || 0)

  };

}


function lineCenterY(line) {

  const geometry =
    getNormalizedGeometry(
      line
    );

  return (
    geometry.y +
    geometry.height / 2
  );

}


function sameTextRegion(
  a,
  b
) {

  const ag =
    getNormalizedGeometry(
      a
    );

  const bg =
    getNormalizedGeometry(
      b
    );

  const aHeight =
    Math.max(
      0.008,
      ag.height
    );

  const bHeight =
    Math.max(
      0.008,
      bg.height
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
    ถ้าเป็นภาพคนละ scale
    ใช้ normalized coordinate
    จึงสามารถเทียบตำแหน่งได้
  */

  if (
    verticalDistance >
    referenceHeight * 0.70
  )
    return false;

  const aRight =
    ag.x +
    ag.width;

  const bRight =
    bg.x +
    bg.width;

  let gap = 0;

  if (
    aRight < bg.x
  ) {

    gap =
      bg.x -
      aRight;

  } else if (
    bRight < ag.x
  ) {

    gap =
      ag.x -
      bRight;

  }

  return (
    gap <=
    Math.max(
      0.025,
      referenceHeight * 2.0
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
    x
      .split(/\s+/)
      .filter(Boolean);

  const yWords =
    y
      .split(/\s+/)
      .filter(Boolean);

  let same = 0;

  for (
    const word
    of xWords
  ) {

    if (
      yWords.includes(
        word
      )
    )
      same++;

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
   GROUP CANDIDATES
========================================================= */

function mergeCandidateLines(
  allCandidates
) {

  const groups = [];

  const sorted =
    [...allCandidates].sort(
      (a, b) => {

        const ay =
          lineCenterY(a);

        const by =
          lineCenterY(b);

        if (
          Math.abs(
            ay - by
          ) < 0.008
        ) {

          const ax =
            getNormalizedGeometry(
              a
            ).x;

          const bx =
            getNormalizedGeometry(
              b
            ).x;

          return ax - bx;

        }

        return ay - by;

      }
    );

  for (
    const candidate
    of sorted
  ) {

    let bestGroup =
      null;

    let bestSimilarity =
      0;

    for (
      const group
      of groups
    ) {

      const representative =
        group[0];

      if (
        representative.language !==
        candidate.language
      )
        continue;

      if (
        !sameTextRegion(
          representative,
          candidate
        )
      )
        continue;

      const similarity =
        lineSimilarity(
          representative.text,
          candidate.text
        );

      if (
        similarity >= 0.45 &&
        similarity >
          bestSimilarity
      ) {

        bestGroup =
          group;

        bestSimilarity =
          similarity;

      }

    }

    if (bestGroup)
      bestGroup.push(
        candidate
      );
    else
      groups.push([
        candidate
      ]);

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

  const scored =
    group.map(
      candidate => {

        let support = 0;

        let similaritySupport =
          0;

        for (
          const other
          of group
        ) {

          if (
            other === candidate
          )
            continue;

          const similarity =
            lineSimilarity(
              candidate.text,
              other.text
            );

          if (
            similarity >= 0.45
          ) {

            support++;

            similaritySupport +=
              similarity;

          }

        }

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
          support * 12 +
          similaritySupport * 8;

        if (
          length >= 8
        ) {

          score +=
            Math.min(
              10,
              length * 0.10
            );

        }

        if (
          candidate.language ===
            "en" &&
          candidate.text
            .split(/\s+/)
            .length >= 2
        )
          score += 5;

        /*
          ถ้ามีหลาย pass สนับสนุน
          ให้ความสำคัญมากขึ้น
        */

        if (
          candidate.passIndex
        ) {

          score +=
            Math.min(
              4,
              Number(
                candidate.support ||
                0
              )
            );

        }

        return {

          candidate,

          support,

          score

        };

      }
    );

  scored.sort(
    (a, b) => {

      const aLength =
        a.candidate.text
          .replace(
            /\s/g,
            ""
          )
          .length;

      const bLength =
        b.candidate.text
          .replace(
            /\s/g,
            ""
          )
          .length;

      if (
        Math.abs(
          a.score -
          b.score
        ) < 6
      ) {

        if (
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
      Version 43:
      ลดการตัดข้อความจริงทิ้ง

      ถ้า confidence สูง
      ให้รับได้แม้มีแค่ 1 pass
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

    if (
      support === 1 &&
      quality >= 68
    ) {

      selected.push(
        best
      );

    }

  }

  const final = [];

  for (
    const candidate
    of selected
  ) {

    let discarded =
      false;

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
      )
        continue;

      if (
        !sameTextRegion(
          old,
          candidate
        )
      )
        continue;

      const oldQuality =
        getLineQuality(
          old
        );

      const newQuality =
        getLineQuality(
          candidate
        );

      const oldLength =
        old.text
          .replace(
            /\s/g,
            ""
          )
          .length;

      const newLength =
        candidate.text
          .replace(
            /\s/g,
            ""
          )
          .length;

      if (
        newQuality >
        oldQuality + 5
      ) {

        final.splice(
          i,
          1
        );

        i--;

        continue;

      }

      if (
        oldQuality >
        newQuality + 5
      ) {

        discarded =
          true;

        break;

      }

      if (
        newLength >
          oldLength * 1.20 &&
        newQuality >=
          oldQuality - 4
      ) {

        final.splice(
          i,
          1
        );

        i--;

        continue;

      }

      if (
        oldLength >
          newLength * 1.20 &&
        oldQuality >=
          newQuality - 4
      ) {

        discarded =
          true;

        break;

      }

      const oldWord =
        Number(
          old.wordConfidence ||
          0
        );

      const newWord =
        Number(
          candidate.wordConfidence ||
          0
        );

      if (
        newWord <=
        oldWord + 4
      ) {

        discarded =
          true;

        break;

      }

      final.splice(
        i,
        1
      );

      i--;

    }

    if (!discarded)
      final.push(
        candidate
      );

  }

  const unique = [];

  for (
    const candidate
    of final
  ) {

    let duplicate =
      false;

    for (
      const old
      of unique
    ) {

      if (
        old.language !==
        candidate.language
      )
        continue;

      if (
        lineSimilarity(
          old.text,
          candidate.text
        ) >= 0.80 &&
        sameTextRegion(
          old,
          candidate
        )
      ) {

        duplicate =
          true;

        if (
          getLineQuality(
            candidate
          ) >
          getLineQuality(
            old
          )
        ) {

          const index =
            unique.indexOf(
              old
            );

          unique[index] =
            candidate;

        }

        break;

      }

    }

    if (!duplicate)
      unique.push(
        candidate
      );

  }

  unique.sort(
    (a, b) => {

      const ay =
        lineCenterY(a);

      const by =
        lineCenterY(b);

      const ah =
        getNormalizedGeometry(
          a
        ).height;

      const bh =
        getNormalizedGeometry(
          b
        ).height;

      const threshold =
        Math.min(
          ah,
          bh
        ) * 0.50;

      if (
        Math.abs(
          ay - by
        ) <= threshold
      ) {

        return (
          getNormalizedGeometry(
            a
          ).x -
          getNormalizedGeometry(
            b
          ).x
        );

      }

      return ay - by;

    }
  );

  return unique;

}


/* =========================================================
   BUILD OCR TEXT
========================================================= */

function buildOCRText(
  candidates
) {

  if (
    !candidates.length
  )
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

    const text =
      cleanText(
        line.text
      );

    if (!text)
      continue;

    if (
      line.language ===
        "en" &&
      looksLikeEnglishGibberish(
        text
      )
    )
      continue;

    if (
      line.language ===
        "th" &&
      looksLikeThaiGibberish(
        text
      )
    )
      continue;

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
        ) >= 0.85
      ) {

        duplicate =
          true;

        break;

      }

    }

    if (!duplicate)
      output.push(
        text
      );

  }

  return output
    .join("\n")
    .trim();

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
   LANGUAGE-SEPARATED OCR
========================================================= */

async function runSeparatedOCRPass(
  workers,
  canvas,
  psm,
  passIndex
) {

  /*
    1. อ่านอังกฤษจากภาพเต็ม
  */

  const englishData =
    await recognizeOCR(
      workers.englishWorker,
      canvas,
      psm
    );

  const englishLines =
    extractOCRLines(
      englishData,
      "en",
      passIndex,
      canvas
    );


  /*
    2. ปิดเฉพาะพื้นที่อังกฤษ
  */

  const thaiCanvas =
    createMaskedCanvas(
      canvas,
      englishLines,
      14
    );


  /*
    3. อ่านไทยจากพื้นที่ที่เหลือ
  */

  const thaiData =
    await recognizeOCR(
      workers.thaiWorker,
      thaiCanvas,
      psm
    );

  const thaiLines =
    extractOCRLines(
      thaiData,
      "th",
      passIndex,
      canvas
    );


  /*
    4. ไม่รับ Thai ที่ทับ
       ตำแหน่งอังกฤษ
  */

  const cleanThaiLines =
    thaiLines.filter(
      thaiLine => {

        for (
          const englishLine
          of englishLines
        ) {

          if (
            sameTextRegion(
              thaiLine,
              englishLine
            )
          ) {

            return false;

          }

        }

        return true;

      }
    );


  /*
    5. ปิดพื้นที่ไทย
  */

  const thaiMaskCanvas =
    createMaskedCanvas(
      canvas,
      cleanThaiLines,
      14
    );


  /*
    6. อ่านอังกฤษซ้ำ
       เพื่อไม่ให้พลาดข้อความ
  */

  const englishSecondData =
    await recognizeOCR(
      workers.englishWorker,
      thaiMaskCanvas,
      psm
    );

  const englishSecondLines =
    extractOCRLines(
      englishSecondData,
      "en",
      passIndex,
      thaiMaskCanvas
    );


  /*
    7. รวม English
  */

  const allEnglish = [
    ...englishLines
  ];

  for (
    const line
    of englishSecondLines
  ) {

    const duplicate =
      allEnglish.some(
        old =>
          sameTextRegion(
            old,
            line
          ) &&
          lineSimilarity(
            old.text,
            line.text
          ) >= 0.55
      );

    if (!duplicate)
      allEnglish.push(
        line
      );

  }

  return [
    ...cleanThaiLines,
    ...allEnglish
  ];

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

  isOCRRunning = true;

  if (ocrCard)
    ocrCard.hidden = false;

  if (ocrText)
    ocrText.value = "";

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
        ? "กำลังแยกภาษาและอ่านข้อความจากกล้อง..."
        : "กำลังแยกภาษาและอ่านข้อความจากรูป..."
    );

    const normalCanvas =
      await prepareOCRImage(
        file,
        1
      );

    const pass1 =
      await runSeparatedOCRPass(
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
    ===================================================== */

    showLoading(
      "กำลังอ่านซ้ำโดยแยกพื้นที่ภาษา..."
    );

    const enlargedCanvas =
      await prepareOCRImage(
        file,
        fromCamera
          ? 1.45
          : 1.25
      );

    const pass2 =
      await runSeparatedOCRPass(
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
    ===================================================== */

    if (
      !finalText ||
      finalText.length < 15
    ) {

      showLoading(
        "กำลังตรวจตำแหน่งข้อความอีกครั้ง..."
      );

      const sparseCanvas =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.30
            : 1.15
        );

      const pass3 =
        await runSeparatedOCRPass(
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
        await runSeparatedOCRPass(
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
        .join("\n")
        .trim();


    if (!finalText)
      throw new Error(
        "ไม่พบข้อความที่อ่านได้"
      );

    if (ocrText)
      ocrText.value =
        finalText;

    if (ocrCard)
      ocrCard.hidden =
        false;

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

    if (ocrText)
      ocrText.value = "";

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

  } else if (
    hasThai
  ) {

    showStatus(
      "สแกนภาษาไทยเรียบร้อยแล้ว",
      "success"
    );

  } else if (
    hasEnglish
  ) {

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
    String(text)
      .replace(
        /\r/g,
        ""
      )
      .split("\n")
      .map(
        line =>
          cleanText(line)
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
          value
            .replace(
              /[0-9๐-๙]/g,
              ""
            )
            .trim();

        if (value)
          sourceLines.push(
            value
          );

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
          value
            .replace(
              /[๐-๙]/g,
              ""
            )
            .trim();

        if (value)
          sourceLines.push(
            value
          );

      }

    }

  }

  if (
    !sourceLines.length
  )
    return cleanText(
      text
    );

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
    String(text || "")
      .trim();

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
  )
    inputText.value =
      text;

  isTranslating =
    true;

  if (translateButton)
    translateButton.disabled =
      true;

  showLoading(
    "กำลังแปลภาษา..."
  );

  hideStatus();

  try {

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

    if (!response.ok)
      throw new Error(
        `HTTP ${response.status}`
      );

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

    if (!translated)
      throw new Error(
        "ไม่พบคำแปล"
      );

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

    if (translateButton)
      translateButton.disabled =
        false;

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
    String(text)
      .replace(
        /\r/g,
        ""
      )
      .split("\n")
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
    )
      continue;

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
      "speechSynthesis"
      in window
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
      )
        return;

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
      )
        return;

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

      if (inputText)
        inputText.value =
          "";

      if (resultText) {

        resultText.textContent =
          "คำแปลจะแสดงที่นี่";

        resultText.classList.add(
          "empty"
        );

      }

      if (ocrText)
        ocrText.value =
          "";

      if (ocrCard)
        ocrCard.hidden =
          true;

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

        if (inputText)
          inputText.value =
            result;

        if (resultText) {

          resultText.textContent =
            input ||
            "คำแปลจะแสดงที่นี่";

          if (input)
            resultText.classList.remove(
              "empty"
            );
          else
            resultText.classList.add(
              "empty"
            );

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
        event.key ===
          "Enter" &&
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
   VERSION 43 END
========================================================= */
