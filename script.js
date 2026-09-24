/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   SCRIPT.JS - OCR + CAMERA OCR IMPROVEMENT
   VERSION 54
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


  /*
    ตรวจว่าเป็นรูปจากกล้องหรือไม่
    เพื่อให้ OCR ใช้ preprocessing
    ที่ละเอียดขึ้น
  */

  const fromCamera =
    event.target === cameraInput;


  showStatus(
    fromCamera
      ? "กำลังปรับภาพจากกล้องและอ่านตัวอักษร..."
      : "กำลังอ่านรูปภาพ...",
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


  /*
    กล้องมือถือบางเครื่องส่งภาพใหญ่มาก
    แต่บางเครื่องลดความละเอียดมาแล้ว

    เราเพิ่มขนาดภาพเล็ก ๆ ให้ OCR
    ในกรณีที่ตัวหนังสือเล็ก
  */

  const maxWidth =
    fromCamera
      ? 3200
      : 2800;

  const maxHeight =
    fromCamera
      ? 3200
      : 2800;


  let width =
    img.naturalWidth;

  let height =
    img.naturalHeight;


  const scale =
    Math.min(
      1,
      maxWidth / width,
      maxHeight / height
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
    ถ้าภาพจากกล้องเล็กมาก
    ขยายขึ้นก่อน OCR
  */

  if (
    fromCamera &&
    width < 1600
  ) {

    const enlarge =
      Math.min(
        2,
        1600 / width
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


  /*
    ปรับคุณภาพการวาดภาพ
  */

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


  const result = {

    normal:
      canvas.toDataURL(
        "image/png"
      ),

    enhanced:
      createEnhancedVariant(
        canvas,
        false
      ),

    grayscale:
      createEnhancedVariant(
        canvas,
        true
      ),

    threshold:
      createThresholdVariant(
        canvas
      )

  };


  /*
    รูปจากกล้องจะเพิ่ม variant
    สำหรับตัวหนังสือเล็กและภาพไม่คม
  */

  if (fromCamera) {

    result.cameraSharp =
      createCameraSharpVariant(
        canvas
      );


    result.cameraSoft =
      createCameraSoftVariant(
        canvas
      );


    result.cameraThreshold =
      createAdaptiveThresholdVariant(
        canvas
      );


    result.cameraDarkText =
      createDarkTextVariant(
        canvas
      );

  }


  return result;
}


/* =========================================================
   ENHANCE
   ========================================================= */

function createEnhancedVariant(
  sourceCanvas,
  grayscaleOnly
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

    let r =
      data[i];

    let g =
      data[i + 1];

    let b =
      data[i + 2];


    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;


    if (grayscaleOnly) {

      data[i] =
        gray;

      data[i + 1] =
        gray;

      data[i + 2] =
        gray;

    } else {

      const factor =
        1.25;

      const midpoint =
        128;


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
   CAMERA SHARP VARIANT
   ========================================================= */

function createCameraSharpVariant(
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


  /*
    เพิ่ม contrast + sharpen แบบเบา
    เพื่อไม่ทำลายตัวอักษรไทย
  */

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
      ((gray - 128) * 1.45) +
      128;


    data[i] =
      clamp(contrast);

    data[i + 1] =
      clamp(contrast);

    data[i + 2] =
      clamp(contrast);

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
   CAMERA SOFT VARIANT
   ========================================================= */

function createCameraSoftVariant(
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


  ctx.filter =
    "contrast(1.18) brightness(1.04)";


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
   ADAPTIVE THRESHOLD
   ========================================================= */

function createAdaptiveThresholdVariant(
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


  /*
    ใช้ค่าเฉลี่ยแสงรอบ ๆ แบบง่าย
    เพื่อไม่ให้พื้นหลังสว่าง/มืดทำลายตัวอักษร
  */

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const gray =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];


    let value;


    if (gray < 145) {

      value =
        0;

    } else if (gray > 195) {

      value =
        255;

    } else {

      value =
        gray < 170
          ? 0
          : 255;

    }


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
   DARK TEXT VARIANT
   ========================================================= */

function createDarkTextVariant(
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


    /*
      ทำให้พื้นหลังเป็นขาว
      และตัวอักษรเข้มขึ้น
    */

    const value =
      gray < 180
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
   THRESHOLD
   ========================================================= */

function createThresholdVariant(
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


    const value =
      gray < 165
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
        ? "กำลังปรับภาพจากกล้องและอ่านข้อความ..."
        : "กำลังอ่านตัวอักษรจากรูป..."
    );


    const variants =
      await prepareImage(
        file,
        fromCamera
      );


    const attempts =
      [];


    const languages = [

      {
        name:
          "mixed",

        worker:
          mixedWorker,

        label:
          "ไทย + อังกฤษ"

      },

      {
        name:
          "source",

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
      }

    ];


    /*
      เพิ่ม variant เฉพาะกล้อง
    */

    if (fromCamera) {

      variantList.push(

        {
          name:
            "cameraSharp",

          image:
            variants.cameraSharp
        },

        {
          name:
            "cameraSoft",

          image:
            variants.cameraSoft
        },

        {
          name:
            "cameraThreshold",

          image:
            variants.cameraThreshold
        },

        {
          name:
            "cameraDarkText",

          image:
            variants.cameraDarkText
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
                language,
                variant,
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
              "OCR attempt failed:",
              error
            );

          }

        }
      }
    }


    const best =
      selectBestOCRResult(
        attempts,
        fromCamera
      );


    if (
      !best ||
      !best.text
    ) {

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


    /*
      แสดง OCR
    */

    if (ocrText) {

      ocrText.value =
        clean;

    }


    if (ocrCard) {

      ocrCard.hidden =
        false;

    }


    /*
      ใส่ OCR ลงช่องต้นฉบับ
    */

    if (inputText) {

      inputText.value =
        clean;

    }


    /*
      แปลเฉพาะภาษาต้นทาง
    */

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
   OCR RECOGNIZE
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
      "setParameters:",
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
   OCR CANDIDATE
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


  const lines =
    Array.isArray(data.lines)
      ? data.lines
      : [];


  const meaningfulLines =
    lines.filter(
      line =>
        typeof line.text ===
          "string" &&
        line.text.trim()
    );


  const languageScore =
    scoreLanguageBalance(
      text
    );


  const structureScore =
    scoreTextStructure(
      text
    );


  const confidenceScore =
    Math.max(
      0,
      Math.min(
        100,
        confidence
      )
    );


  const characterScore =
    scoreCharacters(
      text
    );


  const garbagePenalty =
    scoreGarbage(
      text
    );


  const lineScore =
    Math.min(
      100,
      meaningfulLines.length * 8
    );


  /*
    เพิ่มคะแนนให้ OCR ที่มี
    ไทย + อังกฤษสมดุล
    โดยเฉพาะรูปกล้อง
  */

  let mixedBonus =
    0;


  const thaiCount =
    (
      text.match(
        /[ก-๙]/g
      ) || []
    ).length;


  const englishCount =
    (
      text.match(
        /[A-Za-z]/g
      ) || []
    ).length;


  if (
    thaiCount > 0 &&
    englishCount > 0
  ) {

    mixedBonus =
      8;

  }


  const score =
    confidenceScore * 0.34 +
    structureScore * 0.23 +
    languageScore * 0.13 +
    characterScore * 0.15 +
    lineScore * 0.15 +
    mixedBonus -
    garbagePenalty * 0.30;


  return {

    text,
    raw,
    score,
    confidence,
    lines:
      meaningfulLines.length,
    language:
      language.name,
    variant:
      variant.name,
    psm

  };
}


/* =========================================================
   SELECT BEST OCR
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


  /*
    รูปจากกล้อง:
    ไม่ให้ OCR ที่ confidence สูงอย่างเดียว
    ชนะข้อความที่มีโครงสร้างดีมากเกินไป

    เพราะบางครั้ง Tesseract ให้ confidence สูง
    กับข้อความไทยที่อ่านผิดเป็นตัวอื่น
  */

  if (fromCamera) {

    unique.forEach(
      candidate => {

        if (
          candidate.lines >= 2
        ) {

          candidate.score += 5;

        }


        if (
          candidate.language ===
          "mixed"
        ) {

          candidate.score += 4;

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


    if (seen.has(key)) {
      continue;
    }


    seen.add(key);

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


  let value =
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
   SCORE TEXT
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


    if (/\s/.test(trimmed)) {
      score += 8;
    }


    if (
      /\b[A-Za-z]{2,}\b/.test(
        trimmed
      )
    ) {

      score += 10;
    }


    if (
      /[ก-๙]{2,}/.test(
        trimmed
      )
    ) {

      score += 10;
    }


    if (
      /[,.!?;:]/.test(
        trimmed
      )
    ) {

      score += 4;
    }


    if (
      /[A-Za-zก-๙]/.test(
        trimmed
      )
    ) {

      score += 8;

    }

  }


  return Math.min(
    100,
    score
  );
}


/* =========================================================
   LANGUAGE SCORE
   ========================================================= */

function scoreLanguageBalance(
  text
) {

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


  const total =
    thai + english;


  if (!total) {
    return 0;
  }


  return Math.min(
    100,
    (
      total /
      Math.max(
        1,
        text.length
      )
    ) * 100
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
      text.length
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

      penalty += 20;

    }
  }


  return Math.min(
    100,
    penalty
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

/*
  ไทย → อังกฤษ:
      เอาเฉพาะไทย
      แปลเป็นอังกฤษ

  อังกฤษ → ไทย:
      เอาเฉพาะอังกฤษ
      แปลเป็นไทย
*/

async function autoTranslateOCR(
  text
) {

  if (!text || !text.trim()) {
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

  const thaiCount =
    (
      text.match(
        /[ก-๙]/g
      ) || []
    ).length;


  const englishCount =
    (
      text.match(
        /[A-Za-z]/g
      ) || []
    ).length;


  /*
    ภาษาไทย
  */

  if (source === "th") {

    if (
      thaiCount >= 2 &&
      thaiCount >=
        englishCount
    ) {

      return true;
    }


    return false;
  }


  /*
    ภาษาอังกฤษ
  */

  if (source === "en") {

    if (
      englishCount >= 2 &&
      englishCount >
        thaiCount
    ) {

      /*
        ป้องกันข้อความ OCR
        ที่ภาษาไทยปนเข้ามาหนักเกินไป
      */

      if (
        thaiCount > 0 &&
        thaiCount >=
          englishCount * 0.25
      ) {

        return false;
      }


      return true;
    }


    return false;
  }


  return false;
}


/* =========================================================
   TRANSLATE ONE BLOCK
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


  translationRunning =
    true;


  try {

    showLoading(
      "กำลังแปลภาษา..."
    );


    /*
      สำคัญ:
      การพิมพ์เองต้องแปลข้อความทั้งหมด
      ไม่ใช้ extractSourceText
      เพราะผู้ใช้ตั้งใจป้อนข้อความอยู่แล้ว
    */

    const sourceText =
      text;


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
