/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 39

   OCR:
   - Thai / English แยก Worker
   - อ่านหลายรอบ
   - ไม่รวม OCR noise ทุก pass เข้าด้วยกัน
   - เลือกข้อความจากตำแหน่ง + confidence + ความสม่ำเสมอ
   - ลด Thai hallucination จากข้อความภาษาอังกฤษ
   - ลด English hallucination จากข้อความภาษาไทย
   - ตัดข้อความมั่วที่พบเพียงครั้งเดียว
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
   LANGUAGE UI
========================================================= */

function updateLanguageUI() {

  if (sourceLanguage === "th") {

    if (sourceLanguageText) {
      sourceLanguageText.textContent = "ภาษาไทย";
    }

    if (targetLanguageText) {
      targetLanguageText.textContent = "English";
    }

  } else {

    if (sourceLanguageText) {
      sourceLanguageText.textContent = "English";
    }

    if (targetLanguageText) {
      targetLanguageText.textContent = "ภาษาไทย";
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

  statusMessage.textContent = message;

  statusMessage.className =
    "status-message " + type;

  statusMessage.hidden = false;

}


function hideStatus() {

  if (statusMessage) {
    statusMessage.hidden = true;
  }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(message) {

  if (loadingText) {
    loadingText.textContent = message;
  }

  if (loadingBox) {
    loadingBox.hidden = false;
  }

}


function hideLoading() {

  if (loadingBox) {
    loadingBox.hidden = true;
  }

}


/* =========================================================
   LOAD TESSERACT
========================================================= */

function loadTesseract() {

  if (window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }

  if (tesseractLoading) {
    return tesseractLoading;
  }

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

            if (window.Tesseract) {
              resolve(window.Tesseract);
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
        document.createElement("script");

      script.src = TESSERACT_URL;
      script.async = true;
      script.dataset.tesseract = "true";

      script.onload = () => {

        if (window.Tesseract) {
          resolve(window.Tesseract);
        } else {
          reject(
            new Error(
              "ไม่พบ Tesseract.js"
            )
          );
        }

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

      preserve_interword_spaces: "1",

      user_defined_dpi: "300"

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

      preserve_interword_spaces: "1",

      user_defined_dpi: "300"

    });

  }

  return {
    thaiWorker,
    englishWorker
  };

}


/* =========================================================
   CAMERA / GALLERY
========================================================= */

if (cameraButton) {

  cameraButton.addEventListener(
    "click",
    () => {

      if (!cameraInput) return;

      cameraInput.value = "";
      cameraInput.click();

    }
  );

}


if (galleryButton) {

  galleryButton.addEventListener(
    "click",
    () => {

      if (!galleryInput) return;

      galleryInput.value = "";
      galleryInput.click();

    }
  );

}


if (cameraInput) {

  cameraInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files &&
        event.target.files[0];

      if (file) {
        handleImageFile(file, true);
      }

    }
  );

}


if (galleryInput) {

  galleryInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files &&
        event.target.files[0];

      if (file) {
        handleImageFile(file, false);
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
    !file.type.startsWith("image/")
  ) {

    showStatus(
      "กรุณาเลือกไฟล์รูปภาพ",
      "error"
    );

    return;
  }

  selectedImageFile = file;

  if (selectedImageUrl) {
    URL.revokeObjectURL(selectedImageUrl);
  }

  selectedImageUrl =
    URL.createObjectURL(file);

  if (imagePreview) {
    imagePreview.src =
      selectedImageUrl;
  }

  if (imagePreviewContainer) {
    imagePreviewContainer.hidden = false;
  }

  runOCR(file, fromCamera);

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
    URL.revokeObjectURL(selectedImageUrl);
  }

  selectedImageUrl = null;
  selectedImageFile = null;

  if (imagePreview) {
    imagePreview.removeAttribute("src");
  }

  if (imagePreviewContainer) {
    imagePreviewContainer.hidden = true;
  }

  if (cameraInput) {
    cameraInput.value = "";
  }

  if (galleryInput) {
    galleryInput.value = "";
  }

  if (ocrText) {
    ocrText.value = "";
  }

  if (ocrCard) {
    ocrCard.hidden = true;
  }

  hideStatus();

}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImage(file) {

  return new Promise(
    async (resolve, reject) => {

      try {

        if ("createImageBitmap" in window) {

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
              "Bitmap orientation fallback",
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

  if (!width || !height) {

    throw new Error(
      "ไม่สามารถอ่านขนาดรูปได้"
    );

  }

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

  const MAX_PIXELS = 12000000;

  let finalWidth =
    Math.max(
      1,
      Math.round(width * scale)
    );

  let finalHeight =
    Math.max(
      1,
      Math.round(height * scale)
    );

  const pixels =
    finalWidth * finalHeight;

  if (pixels > MAX_PIXELS) {

    const pixelScale =
      Math.sqrt(
        MAX_PIXELS / pixels
      );

    finalWidth =
      Math.max(
        1,
        Math.round(
          finalWidth * pixelScale
        )
      );

    finalHeight =
      Math.max(
        1,
        Math.round(
          finalHeight * pixelScale
        )
      );

  }

  const canvas =
    document.createElement("canvas");

  canvas.width = finalWidth;
  canvas.height = finalHeight;

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );

  if (!ctx) {

    throw new Error(
      "ไม่สามารถสร้าง canvas ได้"
    );

  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    0,
    0,
    finalWidth,
    finalHeight
  );

  if (
    image &&
    typeof image.close === "function"
  ) {

    try {
      image.close();
    } catch (_) {}

  }

  return canvas;

}


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(text) {

  if (!text) return "";

  return String(text)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

}


function countThai(text) {

  return (
    String(text || "")
      .match(/[ก-๙]/g) || []
  ).length;

}


function countEnglish(text) {

  return (
    String(text || "")
      .match(/[a-zA-Z]/g) || []
  ).length;

}


function countDigits(text) {

  return (
    String(text || "")
      .match(/[0-9๐-๙]/g) || []
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

  if (!text) return "";

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
    .replace(/[ \t]+/g, " ")
    .trim();

}


function normalizeEnglishText(text) {

  if (!text) return "";

  return String(text)
    .replace(/\s+/g, " ")
    .trim();

}


function normalizeForCompare(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   LANGUAGE RATIO
========================================================= */

function languageRatio(text) {

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
    thai: thai / total,
    english: english / total
  };

}


/* =========================================================
   GIBBERISH FILTER
========================================================= */

function englishGibberish(text) {

  const value =
    normalizeEnglishText(text);

  if (!value) return true;

  const letters =
    countEnglish(value);

  if (letters < 4) return false;

  const words =
    value.split(/\s+/)
      .filter(Boolean);

  /*
    คำอังกฤษที่เป็นคำเดียว
    และยาวผิดปกติ
  */

  if (
    words.length === 1 &&
    letters >= 14
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

    if (
      vowels === 0
    ) {
      return true;
    }

    if (
      letters >= 18 &&
      vowels / letters < 0.22
    ) {
      return true;
    }

    if (
      letters >= 20 &&
      !/[.,!?'"’‘:-]/.test(value)
    ) {
      return true;
    }

  }

  /*
    ตัวอักษรซ้ำติดกันผิดปกติ
  */

  if (
    /(.)\1{4,}/i.test(value)
  ) {
    return true;
  }

  return false;

}


function thaiGibberish(text) {

  const value =
    normalizeThaiText(text);

  if (!value) return true;

  const thai =
    countThai(value);

  if (thai < 7) return false;

  const marks =
    countThaiMarks(value);

  const markRatio =
    marks / Math.max(1, thai);

  /*
    ข้อความไทยยาวมาก
    แต่ไม่มีสระ/วรรณยุกต์เลย
    มักเป็น OCR hallucination
  */

  if (
    thai >= 14 &&
    markRatio < 0.055
  ) {
    return true;
  }

  /*
    ตัวเลขเยอะผิดปกติ
  */

  const digits =
    countDigits(value);

  if (
    digits >= 3 &&
    digits >= thai * 0.4
  ) {
    return true;
  }

  return false;

}


/* =========================================================
   BASIC NOISE FILTER
========================================================= */

function basicOCRNoise(text) {

  const value =
    cleanText(text);

  if (!value) return true;

  const thai =
    countThai(value);

  const english =
    countEnglish(value);

  const digits =
    countDigits(value);

  const letters =
    thai + english;

  if (!letters) return true;

  /*
    เครื่องหมายมั่ว
  */

  const symbols =
    (
      value.match(
        /[^ก-๙a-zA-Z0-9๐-๙\s.,!?'"’‘:;()\-]/g
      ) || []
    ).length;

  if (
    symbols >= 5 &&
    symbols > letters * 0.6
  ) {
    return true;
  }

  /*
    ตัวเลขมากกว่าตัวอักษร
  */

  if (
    digits >= 5 &&
    digits > letters
  ) {
    return true;
  }

  /*
    อังกฤษล้วน
  */

  if (
    english > 0 &&
    thai === 0
  ) {

    if (
      english <= 2 &&
      value.split(/\s+/).length === 1
    ) {
      return true;
    }

    if (
      englishGibberish(value)
    ) {
      return true;
    }

  }

  /*
    ไทยล้วน
  */

  if (
    thai > 0 &&
    english === 0
  ) {

    if (
      thaiGibberish(value)
    ) {
      return true;
    }

  }

  return false;

}


/* =========================================================
   IMAGE ENHANCEMENT
========================================================= */

function createEnhancedCanvas(
  sourceCanvas
) {

  const width =
    sourceCanvas.width;

  const height =
    sourceCanvas.height;

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );

  if (!ctx) {
    return sourceCanvas;
  }

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );

  try {

    const imageData =
      ctx.getImageData(
        0,
        0,
        width,
        height
      );

    const data =
      imageData.data;

    const factor = 1.10;

    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      data[i] =
        Math.max(
          0,
          Math.min(
            255,
            128 +
            (data[i] - 128) *
            factor
          )
        );

      data[i + 1] =
        Math.max(
          0,
          Math.min(
            255,
            128 +
            (data[i + 1] - 128) *
            factor
          )
        );

      data[i + 2] =
        Math.max(
          0,
          Math.min(
            255,
            128 +
            (data[i + 2] - 128) *
            factor
          )
        );

    }

    ctx.putImageData(
      imageData,
      0,
      0
    );

  } catch (error) {

    console.warn(
      "Enhancement skipped:",
      error
    );

  }

  return canvas;

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
    !Array.isArray(data.words) ||
    !bbox
  ) {
    return null;
  }

  const x =
    Number(bbox.x || 0);

  const y =
    Number(bbox.y || 0);

  const right =
    x +
    Number(bbox.width || 0);

  const bottom =
    y +
    Number(bbox.height || 0);

  const values = [];

  for (
    const word of data.words
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
      Number(wb.x0 || 0);

    const wy =
      Number(wb.y0 || 0);

    const wr =
      Number(wb.x1 || 0);

    const wbott =
      Number(wb.y1 || 0);

    const overlapX =
      Math.max(
        0,
        Math.min(right, wr) -
        Math.max(x, wx)
      );

    const overlapY =
      Math.max(
        0,
        Math.min(bottom, wbott) -
        Math.max(y, wy)
      );

    if (
      overlapX > 0 &&
      overlapY > 0
    ) {

      const confidence =
        Number(word.confidence);

      if (
        Number.isFinite(confidence)
      ) {
        values.push(confidence);
      }

    }

  }

  if (!values.length) {
    return null;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );

}


/* =========================================================
   OCR LINE EXTRACTION
========================================================= */

function extractLines(
  data,
  language,
  pass
) {

  const output = [];

  if (
    !data ||
    !Array.isArray(data.lines)
  ) {
    return output;
  }

  for (
    const line of data.lines
  ) {

    const raw =
      cleanText(line.text);

    if (!raw) continue;

    const thai =
      countThai(raw);

    const english =
      countEnglish(raw);

    if (
      thai + english === 0
    ) {
      continue;
    }

    let text = raw;

    if (language === "th") {

      text =
        normalizeThaiText(text);

    } else {

      text =
        normalizeEnglishText(text);

    }

    if (!text) continue;

    const ratio =
      languageRatio(text);

    /*
      สำคัญมาก:
      Worker แต่ละภาษา
      ต้องมีตัวอักษรของภาษาตัวเองเป็นหลัก
    */

    if (language === "th") {

      if (
        thai < 2 ||
        ratio.thai < 0.70
      ) {
        continue;
      }

    } else {

      if (
        english < 2 ||
        ratio.english < 0.70
      ) {
        continue;
      }

    }

    if (
      basicOCRNoise(text)
    ) {
      continue;
    }

    const bbox =
      line.bbox || {};

    const x =
      Number(bbox.x0 || 0);

    const y =
      Number(bbox.y0 || 0);

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

    output.push({

      text,

      language,

      pass,

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

    });

  }

  return output;

}


/* =========================================================
   POSITION
========================================================= */

function centerY(line) {

  return (
    Number(line.y || 0) +
    Number(line.height || 0) / 2
  );

}


function verticalOverlap(a, b) {

  const top =
    Math.max(
      Number(a.y || 0),
      Number(b.y || 0)
    );

  const bottom =
    Math.min(
      Number(a.y || 0) +
        Number(a.height || 0),
      Number(b.y || 0) +
        Number(b.height || 0)
    );

  const overlap =
    Math.max(
      0,
      bottom - top
    );

  const smaller =
    Math.max(
      1,
      Math.min(
        Number(a.height || 1),
        Number(b.height || 1)
      )
    );

  return overlap / smaller;

}


function horizontalDistance(a, b) {

  const ar =
    Number(a.x || 0) +
    Number(a.width || 0);

  const br =
    Number(b.x || 0) +
    Number(b.width || 0);

  if (
    ar < Number(b.x || 0)
  ) {

    return (
      Number(b.x || 0) - ar
    );

  }

  if (
    br < Number(a.x || 0)
  ) {

    return (
      Number(a.x || 0) - br
    );

  }

  return 0;

}


function sameRegion(a, b) {

  const height =
    Math.max(
      10,
      Math.min(
        Number(a.height || 20),
        Number(b.height || 20)
      )
    );

  const vertical =
    Math.abs(
      centerY(a) -
      centerY(b)
    );

  if (
    vertical <= height * 0.65
  ) {

    const gap =
      horizontalDistance(
        a,
        b
      );

    if (
      gap <=
      Math.max(
        35,
        height * 1.8
      )
    ) {
      return true;
    }

  }

  if (
    verticalOverlap(a, b) >= 0.45
  ) {
    return true;
  }

  return false;

}


/* =========================================================
   TEXT SIMILARITY
========================================================= */

function textSimilarity(a, b) {

  const x =
    normalizeForCompare(a);

  const y =
    normalizeForCompare(b);

  if (!x || !y) return 0;

  if (x === y) return 1;

  const xWords =
    x.split(/\s+/)
      .filter(Boolean);

  const yWords =
    y.split(/\s+/)
      .filter(Boolean);

  let same = 0;

  for (
    const word of xWords
  ) {

    if (
      yWords.includes(word)
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
   CANDIDATE SCORE
========================================================= */

function candidateScore(line) {

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

  const text =
    line.text;

  const ratio =
    languageRatio(text);

  const languageRatioValue =
    line.language === "th"
      ? ratio.thai
      : ratio.english;

  let score =
    confidence * 0.40 +
    wordConfidence * 0.45 +
    languageRatioValue * 100 * 0.15;

  /*
    ข้อความที่มีความยาวสมเหตุสมผล
    ได้คะแนนเพิ่มเล็กน้อย
  */

  const length =
    text.replace(/\s/g, "").length;

  if (
    length >= 4 &&
    length <= 80
  ) {
    score += 3;
  }

  return score;

}


/* =========================================================
   FIND SIMILAR CANDIDATE
========================================================= */

function findSimilarCandidate(
  line,
  candidates
) {

  for (
    const other of candidates
  ) {

    if (
      other.language !==
      line.language
    ) {
      continue;
    }

    if (
      sameRegion(
        line,
        other
      )
    ) {

      const similarity =
        textSimilarity(
          line.text,
          other.text
        );

      if (
        similarity >= 0.55
      ) {
        return other;
      }

    }

  }

  return null;

}


/* =========================================================
   SELECT STABLE LINES
========================================================= */

function selectStableLines(
  allLines
) {

  const groups = [];

  /*
    รวมเฉพาะข้อความภาษาเดียวกัน
    ที่อยู่บริเวณเดียวกัน
  */

  for (
    const line of allLines
  ) {

    let group = null;

    for (
      const existing of groups
    ) {

      const representative =
        existing[0];

      if (
        representative.language !==
        line.language
      ) {
        continue;
      }

      if (
        sameRegion(
          representative,
          line
        )
      ) {

        const similarity =
          textSimilarity(
            representative.text,
            line.text
          );

        if (
          similarity >= 0.45
        ) {

          group = existing;
          break;

        }

      }

    }

    if (group) {

      group.push(line);

    } else {

      groups.push([line]);

    }

  }


  const selected = [];


  for (
    const group of groups
  ) {

    /*
      หา candidate ที่ดีที่สุด
    */

    let best =
      group[0];

    for (
      let i = 1;
      i < group.length;
      i++
    ) {

      if (
        candidateScore(
          group[i]
        ) >
        candidateScore(best)
      ) {

        best =
          group[i];

      }

    }


    const passSet =
      new Set(
        group.map(
          item => item.pass
        )
      );


    const support =
      passSet.size;


    /*
      หลักสำคัญของ Version 39:

      พบเพียง 1 pass
      ต้อง confidence สูงมาก

      พบ 2 pass
      สามารถผ่านได้ง่ายขึ้น

      พบ 3 pass
      ถือว่ามีความเสถียรสูง
    */

    const score =
      candidateScore(best);


    let accepted = false;


    if (
      support >= 2 &&
      score >= 48
    ) {

      accepted = true;

    }


    if (
      support === 1 &&
      score >= 72
    ) {

      accepted = true;

    }


    /*
      ถ้าเป็นคำ/ประโยคภาษาอังกฤษ
      ที่มีคำหลายคำและ confidence ดี
    */

    if (
      support === 1 &&
      best.language === "en" &&
      score >= 65 &&
      best.text.split(/\s+/).length >= 2 &&
      !englishGibberish(best.text)
    ) {

      accepted = true;

    }


    /*
      ไทยที่พบครั้งเดียวต้องเข้มกว่า
      เพราะภาพตัวอย่างมี Thai hallucination เยอะ
    */

    if (
      support === 1 &&
      best.language === "th"
    ) {

      if (
        score < 76
      ) {
        accepted = false;
      }

      if (
        thaiGibberish(
          best.text
        )
      ) {
        accepted = false;
      }

    }


    if (accepted) {

      selected.push({

        ...best,

        support

      });

    }

  }


  /*
    เรียงจากบนลงล่าง
  */

  selected.sort(
    (a, b) => {

      const ay =
        Number(a.y || 0);

      const by =
        Number(b.y || 0);

      const height =
        Math.min(
          Number(a.height || 20),
          Number(b.height || 20)
        );

      if (
        Math.abs(ay - by) <=
        height * 0.6
      ) {

        return (
          Number(a.x || 0) -
          Number(b.x || 0)
        );

      }

      return ay - by;

    }
  );


  /*
    ขั้นสุดท้าย:
    ถ้าไทยกับอังกฤษทับกันตำแหน่งเดียวกัน
    จะไม่เก็บตัวที่มี support ต่ำกว่า
    เว้นแต่ทั้งคู่มีหลักฐานชัดเจน
  */

  const final = [];


  for (
    const candidate of selected
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
        !sameRegion(
          old,
          candidate
        )
      ) {
        continue;
      }

      const oldSupport =
        Number(
          old.support || 1
        );

      const newSupport =
        Number(
          candidate.support || 1
        );

      const oldScore =
        candidateScore(old);

      const newScore =
        candidateScore(candidate);

      /*
        ถ้าทั้งคู่เจอหลาย pass
        เก็บทั้งคู่ได้
      */

      if (
        oldSupport >= 2 &&
        newSupport >= 2
      ) {
        continue;
      }

      /*
        ตัวที่มีหลักฐานชัดกว่าชนะ
      */

      if (
        oldSupport > newSupport
      ) {

        keep = false;
        break;

      }

      if (
        newSupport > oldSupport
      ) {

        final.splice(i, 1);
        i--;
        continue;

      }

      if (
        oldScore >= newScore
      ) {

        keep = false;
        break;

      }

      final.splice(i, 1);
      i--;

    }

    if (keep) {
      final.push(candidate);
    }

  }


  /*
    เรียงใหม่
  */

  final.sort(
    (a, b) => {

      const ay =
        Number(a.y || 0);

      const by =
        Number(b.y || 0);

      const h =
        Math.min(
          Number(a.height || 20),
          Number(b.height || 20)
        );

      if (
        Math.abs(ay - by) <=
        h * 0.6
      ) {

        return (
          Number(a.x || 0) -
          Number(b.x || 0)
        );

      }

      return ay - by;

    }
  );


  return final;

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
    await worker.recognize(canvas);

  return (
    result &&
    result.data
      ? result.data
      : {}
  );

}


/* =========================================================
   RUN ONE PASS
========================================================= */

async function runOCRPass(
  workers,
  canvas,
  psm,
  pass
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

  const thaiLines =
    extractLines(
      results[0],
      "th",
      pass
    );

  const englishLines =
    extractLines(
      results[1],
      "en",
      pass
    );

  return [
    ...thaiLines,
    ...englishLines
  ];

}


/* =========================================================
   BUILD FINAL OCR
========================================================= */

function buildFinalOCR(
  allLines
) {

  if (!allLines.length) {
    return "";
  }

  /*
    ลบ duplicate ที่เหมือนกันมาก
  */

  const unique = [];

  for (
    const line of allLines
  ) {

    let duplicate = false;

    for (
      const old of unique
    ) {

      if (
        old.language ===
        line.language &&
        textSimilarity(
          old.text,
          line.text
        ) >= 0.92
      ) {

        duplicate = true;

        /*
          เก็บตัว confidence ดีกว่า
        */

        if (
          candidateScore(line) >
          candidateScore(old)
        ) {

          Object.assign(
            old,
            line
          );

        }

        break;

      }

    }

    if (!duplicate) {
      unique.push(line);
    }

  }


  const selected =
    selectStableLines(
      unique
    );


  const output = [];


  for (
    const line of selected
  ) {

    let text =
      cleanText(
        line.text
      );

    if (!text) continue;


    /*
      Final filter
    */

    if (
      line.language === "en"
    ) {

      if (
        englishGibberish(text)
      ) {
        continue;
      }

    } else {

      if (
        thaiGibberish(text)
      ) {
        continue;
      }

    }


    /*
      กันข้อความซ้ำ
    */

    const duplicate =
      output.some(
        old =>
          textSimilarity(
            old,
            text
          ) >= 0.90
      );

    if (duplicate) {
      continue;
    }

    output.push(text);

  }


  return output.join("\n").trim();

}


/* =========================================================
   OCR MAIN
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

  if (ocrCard) {
    ocrCard.hidden = false;
  }

  if (ocrText) {
    ocrText.value = "";
  }

  hideStatus();

  try {

    const workers =
      await getOCRWorkers();

    const allLines = [];


    /* =====================================================
       PASS 1
       ภาพปกติ
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

    allLines.push(
      ...pass1
    );


    /* =====================================================
       PASS 2
       ขยายภาพ
    ===================================================== */

    showLoading(
      "กำลังตรวจข้อความให้ละเอียดขึ้น..."
    );

    const largeCanvas =
      await prepareOCRImage(
        file,
        fromCamera
          ? 1.35
          : 1.20
      );

    const pass2 =
      await runOCRPass(
        workers,
        largeCanvas,
        6,
        2
      );

    allLines.push(
      ...pass2
    );


    /*
      สำคัญ:
      Version 39 จะไม่ใช้ PSM 11 เป็นหลัก
      เพราะภาพมือถือของผู้ใช้เคยทำให้ PSM 11
      สร้างข้อความมั่วจำนวนมาก
    */


    let finalText =
      buildFinalOCR(
        allLines
      );


    /* =====================================================
       PASS 3
       ใช้เฉพาะกรณีผลยังสั้นมาก
    ===================================================== */

    if (
      !finalText ||
      finalText.length < 8
    ) {

      showLoading(
        "กำลังลองอ่านข้อความอีกครั้ง..."
      );

      const sparseCanvas =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.25
            : 1.10
        );

      const pass3 =
        await runOCRPass(
          workers,
          sparseCanvas,
          11,
          3
        );

      allLines.push(
        ...pass3
      );

      finalText =
        buildFinalOCR(
          allLines
        );

    }


    /* =====================================================
       PASS 4
       ปรับ contrast เฉพาะกรณีอ่านไม่ได้
    ===================================================== */

    if (
      !finalText ||
      finalText.length < 8
    ) {

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );

      const baseCanvas =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.25
            : 1.10
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

      allLines.push(
        ...pass4
      );

      finalText =
        buildFinalOCR(
          allLines
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
            cleanText(line)
        )
        .filter(Boolean)
        .filter(
          line =>
            !basicOCRNoise(line)
        )
        .filter(
          line =>
            !englishGibberish(line)
        )
        .filter(
          line =>
            !thaiGibberish(line)
        )
        .join("\n")
        .trim();


    if (!finalText) {

      throw new Error(
        "ไม่พบข้อความที่อ่านได้"
      );

    }


    if (ocrText) {
      ocrText.value = finalText;
    }

    if (ocrCard) {
      ocrCard.hidden = false;
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
      ocrText.value = "";
    }

    showStatus(
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองถ่ายให้ข้อความชัดขึ้นค่ะ",
      "error"
    );

  } finally {

    isOCRRunning = false;

  }

}


/* =========================================================
   OCR STATUS
========================================================= */

function showOCRStatus(
  text
) {

  const hasThai =
    /[ก-๙]/.test(text);

  const hasEnglish =
    /[a-zA-Z]/.test(text);

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
        inputText.value = text;
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
   SOURCE LANGUAGE FILTER
========================================================= */

function extractSourceLanguageText(
  text,
  language
) {

  if (!text) return "";

  const lines =
    String(text)
      .replace(/\r/g, "")
      .split("\n")
      .map(line => cleanText(line))
      .filter(Boolean);

  if (!lines.length) return "";

  const sourceLines = [];

  for (
    const line of lines
  ) {

    const thai =
      countThai(line);

    const english =
      countEnglish(line);

    if (
      language === "th"
    ) {

      if (
        thai > 0 &&
        thai >= english
      ) {

        let value =
          normalizeThaiText(line);

        value =
          value.replace(
            /[0-9๐-๙]/g,
            ""
          );

        value =
          value.trim();

        if (value) {
          sourceLines.push(value);
        }

      }

    } else {

      if (
        english > 0 &&
        english >= thai
      ) {

        let value =
          normalizeEnglishText(line);

        value =
          value.replace(
            /[๐-๙]/g,
            ""
          );

        value =
          value.trim();

        if (value) {
          sourceLines.push(value);
        }

      }

    }

  }

  if (!sourceLines.length) {
    return cleanText(text);
  }

  return sourceLines.join("\n");

}


/* =========================================================
   PREPARE TRANSLATION
========================================================= */

function prepareTranslationText(text) {

  const value =
    String(text || "").trim();

  if (!value) return "";

  const thaiCount =
    countThai(value);

  const englishCount =
    countEnglish(value);

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
   TRANSLATION
========================================================= */

if (translateButton) {

  translateButton.addEventListener(
    "click",
    translateText
  );

}


async function translateText() {

  if (isTranslating) return;

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

    inputText.value = text;

  }

  isTranslating = true;

  if (translateButton) {
    translateButton.disabled = true;
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

          method: "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify({

              action: "translate",

              text: text,

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
      translateButton.disabled = false;
    }

    isTranslating = false;

  }

}


/* =========================================================
   CLEAN TRANSLATION
========================================================= */

function cleanTranslation(text) {

  if (!text) return "";

  const lines =
    String(text)
      .replace(/\r/g, "")
      .split("\n")
      .map(
        line =>
          line
            .replace(/\s+/g, " ")
            .trim()
      )
      .filter(Boolean);

  const unique = [];

  for (
    const line of lines
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

    unique.push(line);

  }

  return unique.join("\n");

}


/* =========================================================
   SPEECH
========================================================= */

function speakText(
  text,
  language
) {

  if (!text) return;

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
      text
    );

  utterance.lang =
    language === "th"
      ? "th-TH"
      : "en-US";

  utterance.rate = 0.9;
  utterance.pitch = 1;

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

      if (!text) return;

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
   COPY RESULT
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

        textarea.value = text;

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
        inputText.value = "";
      }

      if (resultText) {

        resultText.textContent =
          "คำแปลจะแสดงที่นี่";

        resultText.classList.add(
          "empty"
        );

      }

      if (ocrText) {
        ocrText.value = "";
      }

      if (ocrCard) {
        ocrCard.hidden = true;
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
          inputText.value = result;
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
        .catch(() => {});

    }

    if (englishWorker) {

      englishWorker
        .terminate()
        .catch(() => {});

    }

  }
);


/* =========================================================
   VERSION 39 END
========================================================= */
