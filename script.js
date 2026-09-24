/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   SCRIPT.JS - OCR MULTI-LAYOUT VERSION
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

let thaiWorker = null;
let englishWorker = null;
let mixedWorker = null;

let workersReady = false;
let ocrRunning = false;
let translationRunning = false;

/* =========================================================
   DOM
   ========================================================= */

const inputText = document.getElementById("inputText");
const resultText = document.getElementById("resultText");

const translateButton = document.getElementById("translateButton");

const cameraButton = document.getElementById("cameraButton");
const galleryButton = document.getElementById("galleryButton");

const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");

const imagePreviewContainer =
  document.getElementById("imagePreviewContainer");

const imagePreview = document.getElementById("imagePreview");

const removeImageButton =
  document.getElementById("removeImageButton");

const ocrCard = document.getElementById("ocrCard");
const ocrText = document.getElementById("ocrText");

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

const statusMessage =
  document.getElementById("statusMessage");

const loadingBox =
  document.getElementById("loadingBox");

const loadingText =
  document.getElementById("loadingText");


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  updateLanguageUI();
  bindEvents();
});


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  if (cameraButton && cameraInput) {
    cameraButton.addEventListener("click", () => {
      cameraInput.click();
    });
  }

  if (galleryButton && galleryInput) {
    galleryButton.addEventListener("click", () => {
      galleryInput.click();
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener("change", handleImageSelected);
  }

  if (galleryInput) {
    galleryInput.addEventListener("change", handleImageSelected);
  }

  if (removeImageButton) {
    removeImageButton.addEventListener("click", removeImage);
  }

  if (translateButton) {
    translateButton.addEventListener("click", translateText);
  }

  if (useOcrButton) {
    useOcrButton.addEventListener("click", useOCRText);
  }

  if (speakOcrButton) {
    speakOcrButton.addEventListener("click", () => {
      speakText(ocrText ? ocrText.value : "");
    });
  }

  if (speakResultButton) {
    speakResultButton.addEventListener("click", () => {
      speakText(resultText ? resultText.textContent : "");
    });
  }

  if (copyResultButton) {
    copyResultButton.addEventListener("click", copyResult);
  }

  if (clearInputButton) {
    clearInputButton.addEventListener("click", clearInput);
  }

  if (swapLanguageButton) {
    swapLanguageButton.addEventListener("click", swapLanguages);
  }
}


/* =========================================================
   LANGUAGE UI
   ========================================================= */

function updateLanguageUI() {

  if (!sourceLanguageText || !targetLanguageText) {
    return;
  }

  if (sourceLanguage === "th") {
    sourceLanguageText.textContent = "ภาษาไทย";
  } else {
    sourceLanguageText.textContent = "English";
  }

  if (targetLanguage === "th") {
    targetLanguageText.textContent = "ภาษาไทย";
  } else {
    targetLanguageText.textContent = "English";
  }
}


function swapLanguages() {

  const oldSource = sourceLanguage;

  sourceLanguage = targetLanguage;
  targetLanguage = oldSource;

  updateLanguageUI();

  if (inputText && resultText) {

    const oldInput = inputText.value;
    const oldResult =
      resultText.classList.contains("empty")
        ? ""
        : resultText.textContent;

    inputText.value = oldResult;

    if (oldInput.trim()) {
      resultText.textContent = oldInput;
      resultText.classList.remove("empty");
    } else {
      resultText.textContent = "คำแปลจะแสดงที่นี่";
      resultText.classList.add("empty");
    }
  }

  showStatus("สลับภาษาแล้ว", "success");
}


/* =========================================================
   IMAGE HANDLING
   ========================================================= */

function handleImageSelected(event) {

  const file =
    event.target &&
    event.target.files &&
    event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showStatus("กรุณาเลือกไฟล์รูปภาพ", "error");
    return;
  }

  selectedImageFile = file;

  if (selectedImageUrl) {
    URL.revokeObjectURL(selectedImageUrl);
  }

  selectedImageUrl = URL.createObjectURL(file);

  if (imagePreview) {
    imagePreview.src = selectedImageUrl;
  }

  if (imagePreviewContainer) {
    imagePreviewContainer.hidden = false;
  }

  showStatus("กำลังอ่านรูปภาพ...", "info");

  startOCR(file);
}


function removeImage() {

  selectedImageFile = null;

  if (selectedImageUrl) {
    URL.revokeObjectURL(selectedImageUrl);
    selectedImageUrl = null;
  }

  if (imagePreview) {
    imagePreview.removeAttribute("src");
  }

  if (imagePreviewContainer) {
    imagePreviewContainer.hidden = true;
  }

  if (ocrCard) {
    ocrCard.hidden = true;
  }

  if (ocrText) {
    ocrText.value = "";
  }

  if (cameraInput) {
    cameraInput.value = "";
  }

  if (galleryInput) {
    galleryInput.value = "";
  }

  showStatus("ลบรูปภาพแล้ว", "success");
}


/* =========================================================
   TESSERACT LOADER
   ========================================================= */

async function loadTesseract() {

  if (window.Tesseract) {
    return window.Tesseract;
  }

  return new Promise((resolve, reject) => {

    const existing =
      document.querySelector(
        'script[data-tesseract-loader="true"]'
      );

    if (existing) {

      existing.addEventListener("load", () => {
        if (window.Tesseract) {
          resolve(window.Tesseract);
        } else {
          reject(
            new Error("โหลด Tesseract ไม่สำเร็จ")
          );
        }
      });

      existing.addEventListener("error", () => {
        reject(
          new Error("โหลด Tesseract ไม่สำเร็จ")
        );
      });

      return;
    }

    const script = document.createElement("script");

    script.src = TESSERACT_URL;
    script.async = true;
    script.dataset.tesseractLoader = "true";

    script.onload = () => {

      if (window.Tesseract) {
        resolve(window.Tesseract);
      } else {
        reject(
          new Error("ไม่พบ Tesseract.js")
        );
      }
    };

    script.onerror = () => {
      reject(
        new Error("ไม่สามารถโหลด Tesseract.js ได้")
      );
    };

    document.head.appendChild(script);
  });
}


/* =========================================================
   OCR WORKERS
   ========================================================= */

async function createOCRWorkers() {

  if (workersReady) {
    return;
  }

  const Tesseract = await loadTesseract();

  showLoading("กำลังเตรียมระบบอ่านตัวอักษร...");

  thaiWorker = await Tesseract.createWorker("tha");

  englishWorker = await Tesseract.createWorker("eng");

  mixedWorker = await Tesseract.createWorker("tha+eng");

  workersReady = true;

  hideLoading();
}


/* =========================================================
   IMAGE PREPARATION
   ========================================================= */

/*
  สำคัญ:
  ไม่ crop ตามตำแหน่งที่กำหนดไว้ตายตัว

  เพราะรูปจริงอาจมีข้อความอยู่:
  - ด้านบน
  - ตรงกลาง
  - ด้านล่าง
  - ซ้าย
  - ขวา
  - หลายบรรทัด
  - ไทย + อังกฤษปนกัน
*/

async function prepareImage(file) {

  const img = await loadImage(file);

  const maxWidth = 2800;
  const maxHeight = 2800;

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  const scale =
    Math.min(
      1,
      maxWidth / width,
      maxHeight / height
    );

  width = Math.max(
    1,
    Math.round(width * scale)
  );

  height = Math.max(
    1,
    Math.round(height * scale)
  );

  const baseCanvas =
    document.createElement("canvas");

  baseCanvas.width = width;
  baseCanvas.height = height;

  const baseCtx =
    baseCanvas.getContext("2d", {
      willReadFrequently: true
    });

  baseCtx.drawImage(
    img,
    0,
    0,
    width,
    height
  );

  /*
    สร้างเฉพาะ variant ที่ช่วย OCR
    แต่ไม่สร้าง crop แบบบังคับตำแหน่ง
  */

  const normal =
    baseCanvas.toDataURL("image/png");

  const enhanced =
    createEnhancedVariant(
      baseCanvas,
      false
    );

  const grayscale =
    createEnhancedVariant(
      baseCanvas,
      true
    );

  const threshold =
    createThresholdVariant(
      baseCanvas
    );

  return {
    normal,
    enhanced,
    grayscale,
    threshold
  };
}


function loadImage(file) {

  return new Promise((resolve, reject) => {

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
        new Error("ไม่สามารถเปิดรูปภาพได้")
      );
    };

    img.src = url;
  });
}


/* =========================================================
   IMAGE ENHANCEMENT
   ========================================================= */

function createEnhancedVariant(
  sourceCanvas,
  grayscaleOnly
) {

  const canvas =
    document.createElement("canvas");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx =
    canvas.getContext("2d", {
      willReadFrequently: true
    });

  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    let gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    if (grayscaleOnly) {

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;

    } else {

      /*
        เพิ่ม contrast แบบไม่แรงเกินไป
        เพื่อไม่ทำให้ภาษาไทยแตก
      */

      const factor = 1.25;
      const midpoint = 128;

      r =
        (r - midpoint) *
        factor +
        midpoint;

      g =
        (g - midpoint) *
        factor +
        midpoint;

      b =
        (b - midpoint) *
        factor +
        midpoint;

      data[i] =
        clamp(r);

      data[i + 1] =
        clamp(g);

      data[i + 2] =
        clamp(b);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}


function createThresholdVariant(sourceCanvas) {

  const canvas =
    document.createElement("canvas");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx =
    canvas.getContext("2d", {
      willReadFrequently: true
    });

  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {

    const gray =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];

    const value =
      gray < 165
        ? 0
        : 255;

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}


function clamp(value) {

  return Math.max(
    0,
    Math.min(
      255,
      Math.round(value)
    )
  );
}


/* =========================================================
   OCR MAIN
   ========================================================= */

async function startOCR(file) {

  if (ocrRunning) {
    return;
  }

  ocrRunning = true;

  try {

    await createOCRWorkers();

    showLoading(
      "กำลังอ่านตัวอักษรจากรูป..."
    );

    const variants =
      await prepareImage(file);

    /*
      เราอ่านภาพเดียวกันหลายวิธี
      แต่จะไม่เอาข้อความทุกผลมาต่อกัน
      จะเลือกผลที่เหมาะสมที่สุด
    */

    const attempts = [];

    const languages = [
      {
        name: "mixed",
        worker: mixedWorker,
        label: "ไทย + อังกฤษ"
      },
      {
        name: "source",
        worker:
          sourceLanguage === "th"
            ? thaiWorker
            : englishWorker,
        label:
          sourceLanguage === "th"
            ? "ภาษาไทย"
            : "English"
      }
    ];

    const variantList = [
      {
        name: "normal",
        image: variants.normal
      },
      {
        name: "enhanced",
        image: variants.enhanced
      },
      {
        name: "grayscale",
        image: variants.grayscale
      },
      {
        name: "threshold",
        image: variants.threshold
      }
    ];

    /*
      PSM 6:
      เหมาะกับข้อความหลายบรรทัดที่อยู่รวมกัน

      PSM 11:
      เหมาะกับข้อความที่กระจายอยู่ในภาพ

      ไม่ใช้ PSM เดียว เพราะรูปจริงมีหลายรูปแบบ
    */

    const psmModes = [6, 11];

    for (const language of languages) {

      for (const variant of variantList) {

        for (const psm of psmModes) {

          try {

            showLoading(
              `กำลังอ่านภาพ... ${attempts.length + 1}`
            );

            const result =
              await recognizeImage(
                language.worker,
                variant.image,
                psm
              );

            if (!result) {
              continue;
            }

            const candidate =
              buildOCRCandidate(
                result,
                language,
                variant,
                psm
              );

            if (
              candidate &&
              candidate.text
            ) {
              attempts.push(candidate);
            }

          } catch (error) {

            console.warn(
              "OCR attempt failed:",
              error
            );
          }
        }
      }
    }

    const best =
      selectBestOCRResult(attempts);

    if (!best || !best.text) {

      throw new Error(
        "ไม่พบข้อความในรูปภาพ"
      );
    }

    const clean =
      cleanFinalOCRText(
        best.text
      );

    if (!clean) {

      throw new Error(
        "อ่านข้อความจากรูปไม่สำเร็จ"
      );
    }

    if (ocrText) {
      ocrText.value = clean;
    }

    if (ocrCard) {
      ocrCard.hidden = false;
    }

    if (inputText) {
      inputText.value = clean;
    }

    hideLoading();

    showStatus(
      "อ่านข้อความจากรูปสำเร็จ",
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

    ocrRunning = false;
  }
}


/* =========================================================
   SINGLE OCR
   ========================================================= */

async function recognizeImage(
  worker,
  image,
  psm
) {

  if (!worker) {
    return null;
  }

  /*
    Tesseract.js v5
  */

  try {

    await worker.setParameters({
      tessedit_pageseg_mode: String(psm),
      preserve_interword_spaces: "1"
    });

  } catch (error) {

    console.warn(
      "setParameters:",
      error
    );
  }

  const result =
    await worker.recognize(image);

  return result && result.data
    ? result.data
    : null;
}


/* =========================================================
   BUILD OCR CANDIDATE
   ========================================================= */

function buildOCRCandidate(
  data,
  language,
  variant,
  psm
) {

  const raw =
    typeof data.text === "string"
      ? data.text
      : "";

  const text =
    normalizeOCRText(raw);

  if (!text) {
    return null;
  }

  const confidence =
    Number.isFinite(data.confidence)
      ? data.confidence
      : 0;

  const words =
    Array.isArray(data.words)
      ? data.words
      : [];

  const lines =
    Array.isArray(data.lines)
      ? data.lines
      : [];

  const meaningfulWords =
    words.filter(word => {

      const value =
        typeof word.text === "string"
          ? word.text.trim()
          : "";

      return (
        value.length > 0 &&
        Number(word.confidence || 0) >= 20
      );
    });

  const meaningfulLines =
    lines.filter(line => {

      const value =
        typeof line.text === "string"
          ? line.text.trim()
          : "";

      return value.length > 0;
    });

  const languageScore =
    scoreLanguageBalance(text);

  const structureScore =
    scoreTextStructure(text);

  const confidenceScore =
    Math.max(
      0,
      Math.min(
        100,
        confidence
      )
    );

  const characterScore =
    scoreCharacters(text);

  const garbagePenalty =
    scoreGarbage(text);

  const lineScore =
    Math.min(
      100,
      meaningfulLines.length * 8
    );

  /*
    คะแนนนี้ไม่ได้บอกว่า OCR ถูก 100%
    แต่ใช้เลือก "ผลที่มีลักษณะเป็นข้อความจริง"
    จากหลายรอบ
  */

  const score =
    confidenceScore * 0.38 +
    structureScore * 0.22 +
    languageScore * 0.14 +
    characterScore * 0.14 +
    lineScore * 0.12 -
    garbagePenalty * 0.30;

  return {
    text,
    raw,
    score,
    confidence,
    words: meaningfulWords.length,
    lines: meaningfulLines.length,
    language: language.name,
    languageLabel: language.label,
    variant: variant.name,
    psm
  };
}


/* =========================================================
   OCR RESULT SELECTION
   ========================================================= */

function selectBestOCRResult(
  candidates
) {

  if (!candidates.length) {
    return null;
  }

  /*
    ลบผลซ้ำก่อน
  */

  const unique =
    removeDuplicateCandidates(
      candidates
    );

  /*
    ไม่เลือกจาก confidence อย่างเดียว
    เพราะบางครั้ง Tesseract มั่นใจในข้อความมั่ว
  */

  unique.sort(
    (a, b) => b.score - a.score
  );

  /*
    ถ้าผลอันดับต้น ๆ ใกล้เคียงกันมาก
    เลือกผลที่มีโครงสร้างข้อความสมบูรณ์กว่า
  */

  const top = unique[0];

  const close =
    unique.filter(item =>
      item.score >= top.score - 8
    );

  if (close.length > 1) {

    close.sort((a, b) => {

      const aStructure =
        scoreTextStructure(a.text);

      const bStructure =
        scoreTextStructure(b.text);

      if (
        Math.abs(
          aStructure - bStructure
        ) > 5
      ) {
        return (
          bStructure -
          aStructure
        );
      }

      return (
        b.confidence -
        a.confidence
      );
    });

    return close[0];
  }

  return top;
}


/* =========================================================
   DUPLICATE OCR
   ========================================================= */

function removeDuplicateCandidates(
  candidates
) {

  const result = [];
  const seen = new Set();

  for (const candidate of candidates) {

    const key =
      normalizeForComparison(
        candidate.text
      );

    if (!key) {
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(candidate);
  }

  return result;
}


/* =========================================================
   TEXT NORMALIZATION
   ========================================================= */

function normalizeOCRText(text) {

  if (!text) {
    return "";
  }

  let value =
    String(text)
      .replace(/\r/g, "\n")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n");

  const lines =
    value
      .split("\n")
      .map(line =>
        cleanOCRLine(line)
      )
      .filter(Boolean);

  return lines.join("\n").trim();
}


function cleanOCRLine(line) {

  let value =
    String(line)
      .replace(/\uFFFD/g, "")
      .trim();

  if (!value) {
    return "";
  }

  /*
    เก็บ punctuation ที่จำเป็น
    ไม่พยายามแก้ตัวอักษรทีละตัว
    เพราะอาจทำให้ภาษาไทยเสีย
  */

  value =
    value
      .replace(/[|]{3,}/g, " ")
      .replace(/[_]{4,}/g, " ")
      .replace(/[-]{5,}/g, " ")
      .replace(/[~]{4,}/g, " ");

  value =
    value
      .replace(/\s{2,}/g, " ")
      .trim();

  return value;
}


/* =========================================================
   FINAL OCR CLEANUP
   ========================================================= */

function cleanFinalOCRText(text) {

  let value =
    normalizeOCRText(text);

  if (!value) {
    return "";
  }

  const lines =
    value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

  /*
    ตัดบรรทัดที่มีลักษณะเป็น garbage จริง ๆ
    แต่ไม่ตัดภาษาไทย/อังกฤษเพียงเพราะสั้น
  */

  const cleaned = [];

  for (const line of lines) {

    if (isLikelyGarbageLine(line)) {
      continue;
    }

    cleaned.push(line);
  }

  /*
    ถ้าตัวกรองแรงเกินไป
    ให้ใช้ผลเดิมแทน
  */

  if (
    cleaned.length === 0 &&
    lines.length > 0
  ) {
    return lines.join("\n");
  }

  return cleaned.join("\n");
}


/* =========================================================
   GARBAGE DETECTION
   ========================================================= */

function isLikelyGarbageLine(line) {

  const value =
    line.trim();

  if (!value) {
    return true;
  }

  /*
    เครื่องหมายล้วน ๆ
  */

  if (
    /^[^A-Za-zก-๙0-9]+$/.test(value)
  ) {
    return true;
  }

  /*
    ตัวอักษรซ้ำผิดธรรมชาติ เช่น
    lllllll / 1111111
  */

  if (
    /(.)\1{7,}/u.test(value)
  ) {
    return true;
  }

  /*
    ถ้ามีตัวเลข/สัญลักษณ์เยอะมาก
    แต่แทบไม่มีตัวหนังสือ
  */

  const letters =
    (
      value.match(
        /[A-Za-zก-๙]/g
      ) || []
    ).length;

  const numbers =
    (
      value.match(
        /[0-9]/g
      ) || []
    ).length;

  const symbols =
    (
      value.match(
        /[^A-Za-zก-๙0-9\s]/g
      ) || []
    ).length;

  const total =
    value.replace(
      /\s/g,
      ""
    ).length;

  if (total >= 8) {

    if (
      letters <= 1 &&
      numbers + symbols > letters * 4
    ) {
      return true;
    }

    if (
      symbols / total > 0.65
    ) {
      return true;
    }
  }

  /*
    garbage OCR มักมีไทย + อังกฤษ + ตัวเลข
    สลับกันแทบทุกตัว เช่น
    waldluuAigsnranndniudu

    แต่ไม่ตัดข้อความธรรมชาติ
  */

  if (
    value.length >= 15 &&
    letters >= 8
  ) {

    const thaiCount =
      (
        value.match(
          /[ก-๙]/g
        ) || []
      ).length;

    const englishCount =
      (
        value.match(
          /[A-Za-z]/g
        ) || []
      ).length;

    const digitCount =
      (
        value.match(
          /[0-9]/g
        ) || []
      ).length;

    if (
      digitCount >= 4 &&
      digitCount >
        (thaiCount + englishCount) * 0.45
    ) {
      return true;
    }
  }

  return false;
}


/* =========================================================
   SCORING
   ========================================================= */

function scoreTextStructure(text) {

  if (!text) {
    return 0;
  }

  let score = 0;

  const lines =
    text
      .split("\n")
      .filter(Boolean);

  /*
    มีหลายบรรทัด = เป็นไปได้ว่าเป็นข้อความจริง
  */

  score +=
    Math.min(
      25,
      lines.length * 5
    );

  for (const line of lines) {

    const trimmed =
      line.trim();

    if (!trimmed) {
      continue;
    }

    /*
      มีช่องว่างระหว่างคำ
    */

    if (/\s/.test(trimmed)) {
      score += 8;
    }

    /*
      มีตัวอักษรภาษาอังกฤษเป็นคำ
    */

    if (
      /\b[A-Za-z]{2,}\b/.test(
        trimmed
      )
    ) {
      score += 10;
    }

    /*
      มีภาษาไทย
    */

    if (
      /[ก-๙]{2,}/.test(
        trimmed
      )
    ) {
      score += 10;
    }

    /*
      มี punctuation แบบประโยค
    */

    if (
      /[,.!?;:]/.test(trimmed)
    ) {
      score += 4;
    }

    /*
      ไม่ใช่ตัวเลข/สัญลักษณ์ล้วน
    */

    if (
      /[A-Za-zก-๙]/.test(
        trimmed
      )
    ) {
      score += 8;
    }
  }

  return Math.min(100, score);
}


function scoreLanguageBalance(text) {

  const thai =
    (
      text.match(
        /[ก-๙]/g
      ) || []
    ).length;

  const english =
    (
      text.match(
        /[A-Za-z]/g
      ) || []
    ).length;

  if (
    thai === 0 &&
    english === 0
  ) {
    return 0;
  }

  /*
    ไม่บังคับว่าต้องเป็นภาษาเดียว
    เพราะรูปจริงสามารถมีสองภาษาได้
  */

  const total =
    thai + english;

  return Math.min(
    100,
    (total / Math.max(1, text.length)) *
      100
  );
}


function scoreCharacters(text) {

  if (!text) {
    return 0;
  }

  const valid =
    (
      text.match(
        /[A-Za-zก-๙0-9\s.,!?'"“”‘’\-:;()]/g
      ) || []
    ).length;

  return Math.min(
    100,
    (valid / text.length) * 100
  );
}


function scoreGarbage(text) {

  if (!text) {
    return 100;
  }

  const lines =
    text.split("\n");

  let penalty = 0;

  for (const line of lines) {

    if (
      isLikelyGarbageLine(line)
    ) {
      penalty += 20;
    }
  }

  /*
    ตัวอักษรที่ไม่มีช่องว่างยาวผิดธรรมชาติ
  */

  const longTokens =
    text.match(
      /[A-Za-zก-๙]{22,}/g
    ) || [];

  penalty +=
    longTokens.length * 5;

  return Math.min(
    100,
    penalty
  );
}


/* =========================================================
   COMPARISON
   ========================================================= */

function normalizeForComparison(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(
      /[“”‘’]/g,
      '"'
    )
    .trim();
}


/* =========================================================
   USE OCR
   ========================================================= */

function useOCRText() {

  if (!ocrText || !inputText) {
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

  inputText.value = text;

  showStatus(
    "นำข้อความจากรูปมาใช้แล้ว",
    "success"
  );
}


/* =========================================================
   TRANSLATION
   ========================================================= */

async function translateText() {

  if (translationRunning) {
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

  translationRunning = true;

  try {

    showLoading(
      "กำลังแปลภาษา..."
    );

    const response =
      await fetch(
        TRANSLATE_API,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: "translate",
            text: text,
            source: sourceLanguage,
            target: targetLanguage
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

    let data = null;

    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
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

    translationRunning = false;
  }
}


/* =========================================================
   TRANSLATION RESPONSE
   ========================================================= */

function extractTranslation(
  data,
  raw
) {

  if (data) {

    const possibleKeys = [
      "translation",
      "translatedText",
      "result",
      "text",
      "output",
      "translated",
      "data"
    ];

    for (
      const key of possibleKeys
    ) {

      const value =
        data[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    if (
      data.data &&
      typeof data.data === "object"
    ) {

      for (
        const key of possibleKeys
      ) {

        const value =
          data.data[key];

        if (
          typeof value === "string" &&
          value.trim()
        ) {
          return value.trim();
        }
      }
    }
  }

  if (
    typeof raw === "string" &&
    raw.trim()
  ) {

    /*
      บาง Apps Script อาจคืน text ตรง ๆ
    */

    const trimmed =
      raw.trim();

    if (
      !trimmed.startsWith("<!DOCTYPE") &&
      !trimmed.startsWith("<html")
    ) {
      return trimmed;
    }
  }

  return "";
}


/* =========================================================
   SPEECH
   ========================================================= */

function speakText(text) {

  const value =
    String(text || "").trim();

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

  utterance.rate = 0.9;
  utterance.pitch = 1;

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
    resultText.classList.contains("empty")
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

    /*
      fallback สำหรับ browser บางรุ่น
    */

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value = value;

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

  removeImage();

  showStatus(
    "ล้างข้อมูลแล้ว",
    "success"
  );
}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(message) {

  if (loadingBox) {
    loadingBox.hidden = false;
  }

  if (loadingText) {
    loadingText.textContent =
      message ||
      "กำลังดำเนินการ...";
  }
}


function hideLoading() {

  if (loadingBox) {
    loadingBox.hidden = true;
  }
}


/* =========================================================
   STATUS
   ========================================================= */

let statusTimer = null;

function showStatus(
  message,
  type = "info"
) {

  if (!statusMessage) {
    return;
  }

  statusMessage.textContent =
    message;

  statusMessage.hidden = false;

  statusMessage.className =
    `status-message ${type}`;

  clearTimeout(
    statusTimer
  );

  statusTimer =
    setTimeout(() => {

      statusMessage.hidden = true;

    }, 3500);
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

      if (thaiWorker) {
        await thaiWorker.terminate();
      }

      if (englishWorker) {
        await englishWorker.terminate();
      }

      if (mixedWorker) {
        await mixedWorker.terminate();
      }

    } catch (error) {

      console.warn(
        "Worker cleanup:",
        error
      );
    }
  }
);
