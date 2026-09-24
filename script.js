/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   SCRIPT.JS - OCR + CAMERA SEPARATED LANGUAGE OCR
   VERSION 55
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

  if (cameraButton && cameraInput) {

    cameraButton.addEventListener(
      "click",
      () => cameraInput.click()
    );

  }


  if (galleryButton && galleryInput) {

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
      () => speakText(
        ocrText ? ocrText.value : ""
      )
    );

  }


  if (speakResultButton) {

    speakResultButton.addEventListener(
      "click",
      () => speakText(
        resultText
          ? resultText.textContent
          : ""
      )
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

  if (
    !sourceLanguageText ||
    !targetLanguageText
  ) {
    return;
  }


  sourceLanguageText.textContent =
    sourceLanguage === "th"
      ? "ภาษาไทย"
      : "English";


  targetLanguageText.textContent =
    targetLanguage === "th"
      ? "ภาษาไทย"
      : "English";
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


  if (
    inputText &&
    resultText
  ) {

    const oldInput =
      inputText.value;


    const oldResult =
      resultText.classList.contains("empty")
        ? ""
        : resultText.textContent;


    inputText.value =
      oldResult;


    if (oldInput.trim()) {

      resultText.textContent =
        oldInput;

      resultText.classList.remove(
        "empty"
      );

    } else {

      resultText.textContent =
        "คำแปลจะแสดงที่นี่";

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


/* =========================================================
   IMAGE SELECT
   ========================================================= */

function handleImageSelected(event) {

  const file =
    event &&
    event.target &&
    event.target.files &&
    event.target.files[0];


  if (!file) {
    return;
  }


  if (
    !file.type.startsWith("image/")
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
    URL.createObjectURL(file);


  if (imagePreview) {

    imagePreview.src =
      selectedImageUrl;

  }


  if (imagePreviewContainer) {

    imagePreviewContainer.hidden =
      false;

  }


  const fromCamera =
    event.target === cameraInput;


  showStatus(
    fromCamera
      ? "กำลังอ่านตัวอักษรจากกล้อง..."
      : "กำลังอ่านตัวอักษรจากรูป...",
    "info"
  );


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


  showStatus(
    "ลบรูปภาพแล้ว",
    "success"
  );
}


/* =========================================================
   TESSERACT LOADER
   ========================================================= */

async function loadTesseract() {

  if (window.Tesseract) {

    return window.Tesseract;

  }


  return new Promise(
    (resolve, reject) => {

      const existing =
        document.querySelector(
          'script[data-tesseract-loader="true"]'
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
                  "โหลด Tesseract ไม่สำเร็จ"
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
   OCR WORKERS
   ========================================================= */

async function createOCRWorkers() {

  if (workersReady) {
    return;
  }


  const Tesseract =
    await loadTesseract();


  showLoading(
    "กำลังเตรียมระบบอ่านตัวอักษร..."
  );


  thaiWorker =
    await Tesseract.createWorker(
      "tha"
    );


  englishWorker =
    await Tesseract.createWorker(
      "eng"
    );


  mixedWorker =
    await Tesseract.createWorker(
      "tha+eng"
    );


  workersReady =
    true;


  hideLoading();
}


/* =========================================================
   LOAD IMAGE
   ========================================================= */

function loadImage(file) {

  return new Promise(
    (resolve, reject) => {

      const url =
        URL.createObjectURL(file);


      const img =
        new Image();


      img.onload =
        () => {

          URL.revokeObjectURL(url);

          resolve(img);

        };


      img.onerror =
        () => {

          URL.revokeObjectURL(url);

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
   PREPARE IMAGE
   ========================================================= */

async function prepareImage(
  file,
  fromCamera = false
) {

  const img =
    await loadImage(file);


  let width =
    img.naturalWidth;

  let height =
    img.naturalHeight;


  const maxSize =
    fromCamera
      ? 3000
      : 2800;


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
    ถ้าภาพจากกล้องมีขนาดเล็ก
    ให้ขยายก่อน OCR
  */

  if (
    fromCamera &&
    width < 1800
  ) {

    const enlarge =
      Math.min(
        2,
        1800 / width
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
      "2d",
      {
        willReadFrequently: true
      }
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


  const variants = {

    normal:
      canvas.toDataURL(
        "image/png"
      ),

    enhanced:
      createEnhancedVariant(
        canvas
      ),

    grayscale:
      createGrayscaleVariant(
        canvas
      ),

    threshold:
      createThresholdVariant(
        canvas,
        165
      ),

    thresholdLight:
      createThresholdVariant(
        canvas,
        185
      ),

    thresholdDark:
      createThresholdVariant(
        canvas,
        145
      )

  };


  if (fromCamera) {

    variants.cameraContrast =
      createContrastVariant(
        canvas,
        1.35
      );


    variants.cameraStrongContrast =
      createContrastVariant(
        canvas,
        1.60
      );


    variants.cameraSoft =
      createSoftVariant(
        canvas
      );

  }


  return variants;
}


/* =========================================================
   ENHANCED VARIANT
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
        willReadFrequently: true
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


    const value =
      ((gray - 128) * 1.25) +
      128;


    data[i] =
      clamp(value);

    data[i + 1] =
      clamp(value);

    data[i + 2] =
      clamp(value);

  }


  ctx.putImageData(
    imageData,
    0,
    0
  );


  return canvas.toDataURL(
    "image/png"
  );
}


/* =========================================================
   GRAYSCALE
   ========================================================= */

function createGrayscaleVariant(
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
        willReadFrequently: true
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


    data[i] =
      gray;

    data[i + 1] =
      gray;

    data[i + 2] =
      gray;

  }


  ctx.putImageData(
    imageData,
    0,
    0
  );


  return canvas.toDataURL(
    "image/png"
  );
}


/* =========================================================
   CONTRAST
   ========================================================= */

function createContrastVariant(
  sourceCanvas,
  factor
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
        willReadFrequently: true
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
      ((gray - 128) * factor) +
      128;


    data[i] =
      clamp(value);

    data[i + 1] =
      clamp(value);

    data[i + 2] =
      clamp(value);

  }


  ctx.putImageData(
    imageData,
    0,
    0
  );


  return canvas.toDataURL(
    "image/png"
  );
}


/* =========================================================
   SOFT
   ========================================================= */

function createSoftVariant(
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
      "2d"
    );


  ctx.filter =
    "brightness(1.05) contrast(1.12)";


  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );


  ctx.filter =
    "none";


  return canvas.toDataURL(
    "image/png"
  );
}


/* =========================================================
   THRESHOLD
   ========================================================= */

function createThresholdVariant(
  sourceCanvas,
  threshold = 165
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
        willReadFrequently: true
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
      gray < threshold
        ? 0
        : 255;


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


  return canvas.toDataURL(
    "image/png"
  );
}


/* =========================================================
   CLAMP
   ========================================================= */

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

    await createOCRWorkers();


    showLoading(
      fromCamera
        ? "กำลังอ่านภาษาไทยและอังกฤษจากกล้อง..."
        : "กำลังอ่านตัวอักษรจากรูป..."
    );


    const variants =
      await prepareImage(
        file,
        fromCamera
      );


    /*
      ======================================================
      ขั้นที่ 1
      OCR แบบปกติ
      ======================================================
    */

    const generalCandidates =
      await runGeneralOCR(
        variants,
        fromCamera
      );


    /*
      ======================================================
      ขั้นที่ 2
      ถ้าเป็นกล้อง ให้แยก OCR ภาษาไทย/อังกฤษ
      ======================================================
    */

    let finalText = "";


    if (fromCamera) {

      showLoading(
        "กำลังแยกข้อความภาษาไทยและอังกฤษ..."
      );


      const separated =
        await runSeparatedCameraOCR(
          variants
        );


      /*
        ถ้าการแยกภาษาได้ผลดี
        ใช้ผลนี้

        ถ้าไม่ได้ ให้ fallback
        ไปใช้ general OCR
      */

      if (
        separated &&
        separated.text &&
        separated.quality >= 45
      ) {

        finalText =
          separated.text;

      } else {

        const best =
          selectBestOCRResult(
            generalCandidates,
            true
          );


        finalText =
          best
            ? best.text
            : "";

      }

    } else {

      const best =
        selectBestOCRResult(
          generalCandidates,
          false
        );


      finalText =
        best
          ? best.text
          : "";

    }


    if (!finalText) {

      throw new Error(
        "ไม่พบข้อความในรูปภาพ"
      );

    }


    const clean =
      cleanFinalOCRText(
        finalText
      );


    if (!clean) {

      throw new Error(
        "อ่านข้อความจากรูปไม่สำเร็จ"
      );

    }


    if (ocrText) {

      ocrText.value =
        clean;

    }


    if (ocrCard) {

      ocrCard.hidden =
        false;

    }


    if (inputText) {

      inputText.value =
        clean;

    }


    showLoading(
      "อ่านข้อความได้แล้ว กำลังแปล..."
    );


    await autoTranslateOCR(
      clean
    );


    hideLoading();


    showStatus(
      fromCamera
        ? "อ่านและแปลจากกล้องเรียบร้อยแล้ว"
        : "อ่านและแปลจากรูปเรียบร้อยแล้ว",
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
   GENERAL OCR
   ========================================================= */

async function runGeneralOCR(
  variants,
  fromCamera
) {

  const attempts =
    [];


  const languages = [

    {
      name:
        "mixed",

      worker:
        mixedWorker
    },

    {
      name:
        "source",

      worker:
        sourceLanguage === "th"
          ? thaiWorker
          : englishWorker
    }

  ];


  const variantList = [

    {
      name:
        "normal",

      image:
        variants.normal
    },

    {
      name:
        "enhanced",

      image:
        variants.enhanced
    },

    {
      name:
        "grayscale",

      image:
        variants.grayscale
    },

    {
      name:
        "threshold",

      image:
        variants.threshold
    },

    {
      name:
        "thresholdLight",

      image:
        variants.thresholdLight
    },

    {
      name:
        "thresholdDark",

      image:
        variants.thresholdDark
    }

  ];


  if (fromCamera) {

    variantList.push(

      {
        name:
          "cameraContrast",

        image:
          variants.cameraContrast
      },

      {
        name:
          "cameraStrongContrast",

        image:
          variants.cameraStrongContrast
      },

      {
        name:
          "cameraSoft",

        image:
          variants.cameraSoft
      }

    );

  }


  const psmModes =
    fromCamera
      ? [6, 11, 12]
      : [6, 11];


  for (
    const language
    of languages
  ) {

    for (
      const variant
      of variantList
    ) {

      for (
        const psm
        of psmModes
      ) {

        try {

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
              language.name,
              variant.name,
              psm
            );


          if (
            candidate &&
            candidate.text
          ) {

            attempts.push(
              candidate
            );

          }

        } catch (error) {

          console.warn(
            "General OCR failed:",
            error
          );

        }

      }

    }

  }


  return attempts;
}


/* =========================================================
   SEPARATED CAMERA OCR
   ========================================================= */

async function runSeparatedCameraOCR(
  variants
) {

  const thaiResults =
    [];


  const englishResults =
    [];


  const mixedResults =
    [];


  const variantList = [

    {
      name:
        "normal",

      image:
        variants.normal
    },

    {
      name:
        "enhanced",

      image:
        variants.enhanced
    },

    {
      name:
        "grayscale",

      image:
        variants.grayscale
    },

    {
      name:
        "cameraContrast",

      image:
        variants.cameraContrast
    },

    {
      name:
        "cameraStrongContrast",

      image:
        variants.cameraStrongContrast
    },

    {
      name:
        "cameraSoft",

      image:
        variants.cameraSoft
    },

    {
      name:
        "threshold",

      image:
        variants.threshold
    },

    {
      name:
        "thresholdLight",

      image:
        variants.thresholdLight
    },

    {
      name:
        "thresholdDark",

      image:
        variants.thresholdDark
    }

  ];


  /*
    ภาษาไทย
  */

  for (
    const variant
    of variantList
  ) {

    for (
      const psm
      of [6, 11, 12]
    ) {

      try {

        const data =
          await recognizeImage(
            thaiWorker,
            variant.image,
            psm
          );


        if (
          data &&
          data.text
        ) {

          const candidate =
            buildSeparatedCandidate(
              data.text,
              "th",
              variant.name,
              psm,
              data.confidence
            );


          if (candidate) {

            thaiResults.push(
              candidate
            );

          }

        }

      } catch (error) {

        console.warn(
          "Thai camera OCR failed:",
          error
        );

      }

    }

  }


  /*
    ภาษาอังกฤษ
  */

  for (
    const variant
    of variantList
  ) {

    for (
      const psm
      of [6, 11, 12]
    ) {

      try {

        const data =
          await recognizeImage(
            englishWorker,
            variant.image,
            psm
          );


        if (
          data &&
          data.text
        ) {

          const candidate =
            buildSeparatedCandidate(
              data.text,
              "en",
              variant.name,
              psm,
              data.confidence
            );


          if (candidate) {

            englishResults.push(
              candidate
            );

          }

        }

      } catch (error) {

        console.warn(
          "English camera OCR failed:",
          error
        );

      }

    }

  }


  /*
    Mixed OCR ใช้เป็นตัวช่วยจัดลำดับ
  */

  for (
    const variant
    of variantList
  ) {

    for (
      const psm
      of [6, 11]
    ) {

      try {

        const data =
          await recognizeImage(
            mixedWorker,
            variant.image,
            psm
          );


        if (
          data &&
          data.text
        ) {

          const candidate =
            buildSeparatedCandidate(
              data.text,
              "mixed",
              variant.name,
              psm,
              data.confidence
            );


          if (candidate) {

            mixedResults.push(
              candidate
            );

          }

        }

      } catch (error) {

        console.warn(
          "Mixed camera OCR failed:",
          error
        );

      }

    }

  }


  const bestThai =
    selectSeparatedCandidate(
      thaiResults,
      "th"
    );


  const bestEnglish =
    selectSeparatedCandidate(
      englishResults,
      "en"
    );


  const bestMixed =
    selectSeparatedCandidate(
      mixedResults,
      "mixed"
    );


  /*
    ถ้าเป็นภาพที่มีทั้งสองภาษา
    ให้ประกอบผลจากไทย + อังกฤษ
  */

  if (
    bestThai &&
    bestEnglish
  ) {

    const merged =
      mergeSeparatedOCR(
        bestThai.text,
        bestEnglish.text
      );


    if (merged) {

      return {

        text:
          merged.text,

        quality:
          merged.quality

      };

    }

  }


  /*
    ถ้ามีแค่ภาษาเดียว
  */

  if (bestThai) {

    return {

      text:
        cleanFinalOCRText(
          bestThai.text
        ),

      quality:
        bestThai.quality

    };

  }


  if (bestEnglish) {

    return {

      text:
        cleanFinalOCRText(
          bestEnglish.text
        ),

      quality:
        bestEnglish.quality

    };

  }


  if (bestMixed) {

    return {

      text:
        cleanFinalOCRText(
          bestMixed.text
        ),

      quality:
        bestMixed.quality

    };

  }


  return null;
}


/* =========================================================
   SEPARATED CANDIDATE
   ========================================================= */

function buildSeparatedCandidate(
  raw,
  language,
  variant,
  psm,
  confidence
) {

  const text =
    normalizeOCRText(
      raw
    );


  if (!text) {
    return null;
  }


  const filtered =
    filterOCRByLanguage(
      text,
      language
    );


  if (!filtered) {
    return null;
  }


  const languageAmount =
    countLanguageCharacters(
      filtered,
      language
    );


  const totalLetters =
    countLetters(
      filtered
    );


  if (
    language !== "mixed" &&
    languageAmount < 2
  ) {

    return null;

  }


  const confidenceScore =
    Math.max(
      0,
      Math.min(
        100,
        Number(confidence) || 0
      )
    );


  const structureScore =
    scoreTextStructure(
      filtered
    );


  const characterScore =
    scoreCharacters(
      filtered
    );


  const lineCount =
    filtered
      .split("\n")
      .filter(Boolean)
      .length;


  let quality =
    confidenceScore * 0.45 +
    structureScore * 0.20 +
    characterScore * 0.20 +
    Math.min(
      15,
      lineCount * 3
    );


  if (
    totalLetters > 0 &&
    languageAmount /
      totalLetters >
      0.70
  ) {

    quality +=
      10;

  }


  return {

    text:
      filtered,

    language,

    variant,

    psm,

    confidence:
      confidenceScore,

    quality:
      Math.min(
        100,
        quality
      )

  };
}


/* =========================================================
   FILTER OCR BY LANGUAGE
   ========================================================= */

function filterOCRByLanguage(
  text,
  language
) {

  const lines =
    String(text)
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);


  if (
    language === "mixed"
  ) {

    return lines.join(
      "\n"
    );

  }


  const result =
    [];


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


    if (language === "th") {

      /*
        ภาษาไทยเป็นหลัก
      */

      if (
        thai >= 2 &&
        thai >= english
      ) {

        result.push(
          line
        );

      }

    }


    if (language === "en") {

      /*
        ภาษาอังกฤษเป็นหลัก
      */

      if (
        english >= 2 &&
        english >= thai
      ) {

        result.push(
          line
        );

      }

    }

  }


  return result.join(
    "\n"
  );
}


/* =========================================================
   SELECT SEPARATED CANDIDATE
   ========================================================= */

function selectSeparatedCandidate(
  candidates,
  language
) {

  if (!candidates.length) {
    return null;
  }


  const unique =
    [];


  const seen =
    new Set();


  for (
    const candidate
    of candidates
  ) {

    const key =
      normalizeForComparison(
        candidate.text
      );


    if (
      !key ||
      seen.has(key)
    ) {

      continue;

    }


    seen.add(
      key
    );


    unique.push(
      candidate
    );

  }


  /*
    ถ้าเป็นภาษาที่ต้องการ
    ให้ความสำคัญกับจำนวนข้อความที่อ่านได้
  */

  unique.forEach(
    candidate => {

      const lineCount =
        candidate.text
          .split("\n")
          .filter(Boolean)
          .length;


      candidate.quality +=
        Math.min(
          12,
          lineCount * 2
        );


      if (
        candidate.variant ===
        "normal"
      ) {

        candidate.quality +=
          2;

      }


      if (
        language === "th"
      ) {

        const thai =
          countThai(
            candidate.text
          );


        const english =
          countEnglish(
            candidate.text
          );


        if (
          thai >
          english
        ) {

          candidate.quality +=
            8;

        }

      }


      if (
        language === "en"
      ) {

        const thai =
          countThai(
            candidate.text
          );


        const english =
          countEnglish(
            candidate.text
          );


        if (
          english >
          thai
        ) {

          candidate.quality +=
            8;

        }

      }

    }
  );


  unique.sort(
    (a, b) =>
      b.quality -
      a.quality
  );


  return unique[0];
}


/* =========================================================
   MERGE SEPARATED OCR
   ========================================================= */

function mergeSeparatedOCR(
  thaiText,
  englishText
) {

  const thaiLines =
    String(thaiText)
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);


  const englishLines =
    String(englishText)
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);


  if (
    !thaiLines.length &&
    !englishLines.length
  ) {

    return null;

  }


  /*
    ถ้าจำนวนบรรทัดใกล้กัน
    สลับตามลำดับของต้นฉบับ

    ตัวอย่าง:
      English
      Thai
      English
      Thai
  */

  const result =
    [];


  const max =
    Math.max(
      thaiLines.length,
      englishLines.length
    );


  /*
    ในภาพทั่วไป Tesseract
    แยกภาษาจะไม่รู้ลำดับเดิม
    จึงใช้การสลับโดยประมาณ
    เมื่อจำนวนบรรทัดเท่ากัน
  */

  if (
    thaiLines.length ===
    englishLines.length
  ) {

    for (
      let i = 0;
      i < max;
      i++
    ) {

      /*
        ถ้าต้นทางเป็นไทย
        ให้ไทยขึ้นก่อน

        ถ้าต้นทางเป็นอังกฤษ
        ให้อังกฤษขึ้นก่อน
      */

      if (
        sourceLanguage === "th"
      ) {

        result.push(
          thaiLines[i]
        );

        result.push(
          englishLines[i]
        );

      } else {

        result.push(
          englishLines[i]
        );

        result.push(
          thaiLines[i]
        );

      }

    }

  } else {

    /*
      จำนวนบรรทัดไม่เท่ากัน
      เอาบรรทัดที่มีอยู่มารวม
      โดยไม่ตัดข้อมูลทิ้ง
    */

    if (
      sourceLanguage === "th"
    ) {

      result.push(
        ...thaiLines
      );

      result.push(
        ...englishLines
      );

    } else {

      result.push(
        ...englishLines
      );

      result.push(
        ...thaiLines
      );

    }

  }


  const text =
    result.join(
      "\n"
    );


  const thaiCount =
    countThai(
      text
    );


  const englishCount =
    countEnglish(
      text
    );


  let quality =
    50;


  if (
    thaiCount > 5
  ) {

    quality +=
      15;

  }


  if (
    englishCount > 5
  ) {

    quality +=
      15;

  }


  if (
    thaiLines.length ===
    englishLines.length
  ) {

    quality +=
      15;

  }


  return {

    text,

    quality:
      Math.min(
        100,
        quality
      )

  };
}


/* =========================================================
   RECOGNIZE IMAGE
   ========================================================= */

async function recognizeImage(
  worker,
  image,
  psm
) {

  if (!worker) {
    return null;
  }


  try {

    await worker.setParameters({

      tessedit_pageseg_mode:
        String(psm),

      preserve_interword_spaces:
        "1"

    });

  } catch (error) {

    console.warn(
      "Tesseract parameters:",
      error
    );

  }


  const result =
    await worker.recognize(
      image
    );


  return result &&
    result.data
    ? result.data
    : null;
}


/* =========================================================
   GENERAL OCR CANDIDATE
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
    normalizeOCRText(
      raw
    );


  if (!text) {
    return null;
  }


  const confidence =
    Number.isFinite(
      data.confidence
    )
      ? data.confidence
      : 0;


  const structure =
    scoreTextStructure(
      text
    );


  const characters =
    scoreCharacters(
      text
    );


  const garbage =
    scoreGarbage(
      text
    );


  const lines =
    text
      .split("\n")
      .filter(Boolean)
      .length;


  let score =
    confidence * 0.38 +
    structure * 0.24 +
    characters * 0.20 +
    Math.min(
      100,
      lines * 8
    ) * 0.18 -
    garbage * 0.35;


  const thai =
    countThai(
      text
    );


  const english =
    countEnglish(
      text
    );


  if (
    thai > 0 &&
    english > 0
  ) {

    score +=
      5;

  }


  if (
    language === "mixed"
  ) {

    score +=
      3;

  }


  return {

    text,

    raw,

    score,

    confidence,

    lines,

    language,

    variant,

    psm

  };
}


/* =========================================================
   SELECT BEST GENERAL OCR
   ========================================================= */

function selectBestOCRResult(
  candidates,
  fromCamera = false
) {

  if (!candidates.length) {
    return null;
  }


  const unique =
    removeDuplicateCandidates(
      candidates
    );


  if (fromCamera) {

    unique.forEach(
      candidate => {

        if (
          candidate.lines >= 3
        ) {

          candidate.score +=
            5;

        }


        if (
          candidate.language ===
          "mixed"
        ) {

          candidate.score +=
            4;

        }

      }
    );

  }


  unique.sort(
    (a, b) =>
      b.score -
      a.score
  );


  return unique[0];
}


/* =========================================================
   REMOVE DUPLICATES
   ========================================================= */

function removeDuplicateCandidates(
  candidates
) {

  const result =
    [];


  const seen =
    new Set();


  for (
    const candidate
    of candidates
  ) {

    const key =
      normalizeForComparison(
        candidate.text
      );


    if (!key) {
      continue;
    }


    if (
      seen.has(key)
    ) {

      continue;

    }


    seen.add(
      key
    );


    result.push(
      candidate
    );

  }


  return result;
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


  const value =
    String(text)
      .replace(
        /\r/g,
        "\n"
      )
      .replace(
        /\u0000/g,
        ""
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      );


  const lines =
    value
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
        /[|]{3,}/g,
        " "
      )
      .replace(
        /[_]{4,}/g,
        " "
      )
      .replace(
        /[-]{5,}/g,
        " "
      )
      .replace(
        /[~]{4,}/g,
        " "
      );


  return value
    .replace(
      /\s{2,}/g,
      " "
    )
    .trim();
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
        !isLikelyGarbageLine(
          line
        )
    );


  return (
    cleaned.length
      ? cleaned
      : lines
  ).join("\n");
}


/* =========================================================
   GARBAGE DETECTION
   ========================================================= */

function isLikelyGarbageLine(
  line
) {

  const value =
    line.trim();


  if (!value) {
    return true;
  }


  if (
    /^[^A-Za-zก-๙0-9]+$/.test(
      value
    )
  ) {

    return true;
  }


  if (
    /(.)\1{7,}/u.test(
      value
    )
  ) {

    return true;
  }


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
      numbers + symbols >
        letters * 4
    ) {

      return true;
    }


    if (
      symbols / total >
      0.65
    ) {

      return true;
    }

  }


  return false;
}


/* =========================================================
   TEXT SCORE
   ========================================================= */

function scoreTextStructure(
  text
) {

  if (!text) {
    return 0;
  }


  let score =
    0;


  const lines =
    text
      .split("\n")
      .filter(Boolean);


  score +=
    Math.min(
      25,
      lines.length * 5
    );


  for (
    const line
    of lines
  ) {

    const trimmed =
      line.trim();


    if (
      /\s/.test(
        trimmed
      )
    ) {

      score +=
        8;

    }


    if (
      /\b[A-Za-z]{2,}\b/.test(
        trimmed
      )
    ) {

      score +=
        10;

    }


    if (
      /[ก-๙]{2,}/.test(
        trimmed
      )
    ) {

      score +=
        10;

    }


    if (
      /[,.!?;:]/.test(
        trimmed
      )
    ) {

      score +=
        4;

    }


    if (
      /[A-Za-zก-๙]/.test(
        trimmed
      )
    ) {

      score +=
        8;

    }

  }


  return Math.min(
    100,
    score
  );
}


/* =========================================================
   CHARACTER SCORE
   ========================================================= */

function scoreCharacters(
  text
) {

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
    (
      valid /
      Math.max(
        1,
        text.length
      )
    ) * 100
  );
}


/* =========================================================
   GARBAGE SCORE
   ========================================================= */

function scoreGarbage(
  text
) {

  if (!text) {
    return 100;
  }


  const lines =
    text.split("\n");


  let penalty =
    0;


  for (
    const line
    of lines
  ) {

    if (
      isLikelyGarbageLine(
        line
      )
    ) {

      penalty +=
        20;

    }

  }


  return Math.min(
    100,
    penalty
  );
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


function countLanguageCharacters(
  text,
  language
) {

  if (
    language === "th"
  ) {

    return countThai(
      text
    );

  }


  if (
    language === "en"
  ) {

    return countEnglish(
      text
    );

  }


  return (
    countThai(text) +
    countEnglish(text)
  );
}


function countLetters(
  text
) {

  return (
    countThai(text) +
    countEnglish(text)
  );
}


/* =========================================================
   COMPARISON
   ========================================================= */

function normalizeForComparison(
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


    showLoading(
      "กำลังแปลข้อความ..."
    );


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
   EXTRACT SOURCE TEXT
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


  const sourceLines =
    lines.filter(
      line =>
        isSourceLine(
          line,
          source
        )
    );


  return sourceLines.join(
    "\n"
  );
}


/* =========================================================
   SOURCE LINE DETECTION
   ========================================================= */

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
      ยอมให้ OCR มีตัวไทยหลุดมาเล็กน้อย
      แต่ไม่เอาบรรทัดที่ไทยปนหนัก
    */

    if (
      thai > 0 &&
      thai >=
        english * 0.35
    ) {

      return false;

    }


    return true;
  }


  return false;
}


/* =========================================================
   TRANSLATE
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
      ข้อความที่ผู้ใช้พิมพ์เอง
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

    const trimmed =
      raw.trim();


    if (
      !trimmed.startsWith(
        "<!DOCTYPE"
      ) &&
      !trimmed.startsWith(
        "<html"
      )
    ) {

      return trimmed;

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
