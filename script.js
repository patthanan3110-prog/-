/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 50
   =========================================================

   OCR SYSTEM

   ✓ Thai OCR
   ✓ English OCR
   ✓ Thai + English Mixed OCR
   ✓ Camera
   ✓ Gallery
   ✓ EXIF / Orientation
   ✓ Upscale
   ✓ Grayscale
   ✓ Contrast
   ✓ Threshold
   ✓ Multi-pass OCR
   ✓ Position-based merging
   ✓ Confidence-based selection
   ✓ Thai / English hallucination protection
   ✓ Mixed-language support
   ✓ Translation source filtering

   หมายเหตุ:
   ไม่มี OCR ใดรับประกัน 100% กับภาพทุกชนิด
   แต่ระบบนี้ออกแบบให้ไม่ตัดข้อความจริงทิ้งง่าย
   และพยายามอ่านภาพหลายรูปแบบก่อนตัดสินผล
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
let mixedWorker = null;

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

    if (sourceLanguageText)
      sourceLanguageText.textContent =
        "ภาษาไทย";

    if (targetLanguageText)
      targetLanguageText.textContent =
        "English";

  } else {

    if (sourceLanguageText)
      sourceLanguageText.textContent =
        "English";

    if (targetLanguageText)
      targetLanguageText.textContent =
        "ภาษาไทย";

  }

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(
  message,
  type = "info"
) {

  if (!statusMessage)
    return;

  statusMessage.textContent =
    message;

  statusMessage.className =
    "status-message " + type;

  statusMessage.hidden =
    false;

}


function hideStatus() {

  if (statusMessage)
    statusMessage.hidden =
      true;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
  message
) {

  if (loadingText)
    loadingText.textContent =
      message;

  if (loadingBox)
    loadingBox.hidden =
      false;

}


function hideLoading() {

  if (loadingBox)
    loadingBox.hidden =
      true;

}


/* =========================================================
   LOAD TESSERACT
========================================================= */

function loadTesseract() {

  if (window.Tesseract)
    return Promise.resolve(
      window.Tesseract
    );

  if (tesseractLoading)
    return tesseractLoading;

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

              if (window.Tesseract)
                resolve(
                  window.Tesseract
                );
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

            if (window.Tesseract)
              resolve(
                window.Tesseract
              );
            else
              reject(
                new Error(
                  "ไม่พบ Tesseract.js"
                )
              );

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
    englishWorker &&
    mixedWorker
  ) {

    return {
      thaiWorker,
      englishWorker,
      mixedWorker
    };

  }

  const Tesseract =
    await loadTesseract();

  showLoading(
    "กำลังเตรียมระบบอ่านภาษาไทยและอังกฤษ..."
  );


  /* =======================================================
     THAI
  ======================================================= */

  if (!thaiWorker) {

    thaiWorker =
      await Tesseract.createWorker(
        "tha",
        1,
        {
          logger:
            message => {

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


  /* =======================================================
     ENGLISH
  ======================================================= */

  if (!englishWorker) {

    englishWorker =
      await Tesseract.createWorker(
        "eng",
        1,
        {
          logger:
            message => {

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


  /* =======================================================
     MIXED THAI + ENGLISH
  ======================================================= */

  if (!mixedWorker) {

    mixedWorker =
      await Tesseract.createWorker(
        "tha+eng",
        1,
        {
          logger:
            message => {

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
                  `กำลังตรวจข้อความไทยและอังกฤษ ${percent}%`
                );

              }

            }
        }
      );

    await mixedWorker.setParameters({

      preserve_interword_spaces:
        "1",

      user_defined_dpi:
        "300"

    });

  }


  return {
    thaiWorker,
    englishWorker,
    mixedWorker
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

      if (!galleryInput)
        return;

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

    try {
      URL.revokeObjectURL(
        selectedImageUrl
      );
    } catch (_) {}

  }


  selectedImageUrl =
    URL.createObjectURL(
      file
    );


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

  if (selectedImageUrl) {

    try {

      URL.revokeObjectURL(
        selectedImageUrl
      );

    } catch (_) {}

  }

  selectedImageUrl =
    null;

  selectedImageFile =
    null;


  if (imagePreview)
    imagePreview.removeAttribute(
      "src"
    );


  if (imagePreviewContainer)
    imagePreviewContainer.hidden =
      true;


  if (cameraInput)
    cameraInput.value =
      "";


  if (galleryInput)
    galleryInput.value =
      "";


  if (ocrText)
    ocrText.value =
      "";


  if (ocrCard)
    ocrCard.hidden =
      true;


  hideStatus();

}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImage(
  file
) {

  return new Promise(
    async (
      resolve,
      reject
    ) => {

      try {

        if (
          "createImageBitmap"
          in window
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
              "createImageBitmap:",
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


  /*
    จำกัดขนาดใหญ่เกินไป
    แต่ไม่ลดรูปเล็กให้เล็กลง
  */

  const MAX_SIZE =
    3600;

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
    14000000;


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


  if (!ctx)
    throw new Error(
      "ไม่สามารถสร้าง canvas ได้"
    );


  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";


  /*
    พื้นหลังขาว
    ช่วยกรณี PNG / transparency
  */

  ctx.fillStyle =
    "#ffffff";

  ctx.fillRect(
    0,
    0,
    finalWidth,
    finalHeight
  );


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
   IMAGE PROCESSING
========================================================= */

function cloneCanvas(
  source
) {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    source.width;

  canvas.height =
    source.height;


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );


  if (!ctx)
    return source;


  ctx.drawImage(
    source,
    0,
    0
  );


  return canvas;

}


/* =========================================================
   GRAYSCALE
========================================================= */

function createGrayscaleCanvas(
  source
) {

  const canvas =
    cloneCanvas(
      source
    );

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );


  if (!ctx)
    return source;


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
      (
        0.299 * data[i] +
        0.587 * data[i + 1] +
        0.114 * data[i + 2]
      );


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


  return canvas;

}


/* =========================================================
   CONTRAST
========================================================= */

function createContrastCanvas(
  source,
  amount = 1.25
) {

  const canvas =
    createGrayscaleCanvas(
      source
    );


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );


  if (!ctx)
    return source;


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

    let value =
      (
        data[i] -
        128
      ) *
      amount +
      128;


    value =
      Math.max(
        0,
        Math.min(
          255,
          value
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
   ADAPTIVE-LIKE THRESHOLD
========================================================= */

function createThresholdCanvas(
  source
) {

  const canvas =
    createGrayscaleCanvas(
      source
    );


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );


  if (!ctx)
    return source;


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
    ไม่ใช้ threshold แข็งเกินไป
    เพื่อไม่ทำให้ตัวอักษรไทยที่มีวรรณยุกต์หาย
  */

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const value =
      data[i];


    let output;


    if (
      value < 105
    )
      output = 0;

    else if (
      value > 180
    )
      output = 255;

    else
      output =
        value < 145
          ? 35
          : 220;


    data[i] =
      output;

    data[i + 1] =
      output;

    data[i + 2] =
      output;

  }


  ctx.putImageData(
    imageData,
    0,
    0
  );


  return canvas;

}


/* =========================================================
   ENHANCED
========================================================= */

function createEnhancedCanvas(
  sourceCanvas
) {

  return createContrastCanvas(
    sourceCanvas,
    1.22
  );

}


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(
  text
) {

  if (!text)
    return "";

  return String(text)
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
    String(text || "")
      .match(
        /[ก-๙]/g
      ) || []
  ).length;

}


function countEnglish(
  text
) {

  return (
    String(text || "")
      .match(
        /[a-zA-Z]/g
      ) || []
  ).length;

}


function countDigits(
  text
) {

  return (
    String(text || "")
      .match(
        /[0-9๐-๙]/g
      ) || []
  ).length;

}


/* =========================================================
   NORMALIZE THAI
========================================================= */

function normalizeThaiText(
  text
) {

  if (!text)
    return "";

  return String(text)
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


/* =========================================================
   NORMALIZE ENGLISH
========================================================= */

function normalizeEnglishText(
  text
) {

  if (!text)
    return "";

  return String(text)
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* =========================================================
   COMPARE
========================================================= */

function normalizeForCompare(
  text
) {

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

function getLanguageRatio(
  text
) {

  const thai =
    countThai(text);

  const english =
    countEnglish(text);

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
   ENGLISH GIBBERISH
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
  )
    return false;


  /*
    ถ้ามีไทยอยู่ด้วย
    ห้ามใช้ filter อังกฤษแรงเกินไป
  */

  if (
    countThai(value) > 0
  )
    return false;


  const words =
    value
      .split(/\s+/)
      .filter(Boolean);


  for (
    const word
    of words
  ) {

    const clean =
      word.replace(
        /[^a-zA-Z]/g,
        ""
      );


    if (
      clean.length >= 10
    ) {

      const vowels =
        (
          clean.match(
            /[aeiouy]/gi
          ) || []
        ).length;


      if (
        vowels === 0
      )
        return true;


      if (
        vowels /
          clean.length <
          0.14
      )
        return true;

    }


    /*
      ไม่รับคำที่มีตัวใหญ่สลับ
      แบบ OCR noise
    */

    if (
      /[a-z][A-Z][a-z][A-Z]/.test(
        clean
      )
    ) {

      if (
        clean.length >= 7
      )
        return true;

    }

  }


  return false;

}


/* =========================================================
   THAI GIBBERISH
========================================================= */

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
    thai < 5
  )
    return false;


  const digits =
    countDigits(
      value
    );


  if (
    digits >= 6 &&
    digits >
      thai * 0.8
  )
    return true;


  if (
    /(.)\1{5,}/.test(
      value
    )
  )
    return true;


  return false;

}


/* =========================================================
   GENERAL OCR NOISE
========================================================= */

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


  /*
    สำคัญ:
    ข้อความไทย+อังกฤษ
    ไม่ถูกมองเป็น noise
  */

  if (
    thai > 0 &&
    english > 0
  )
    return false;


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


  if (
    digits >= 8 &&
    digits > letters * 2
  )
    return true;


  return false;

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
      ) {

        values.push(
          confidence
        );

      }

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
      canvas.width
    ) || 1;


  const canvasHeight =
    Number(
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
      countThai(
        raw
      );

    const english =
      countEnglish(
        raw
      );


    /*
      ภาษาเฉพาะ worker
      ไม่บังคับ 72%
      เพราะภาพจริงอาจมีชื่ออังกฤษ
      ปนกับข้อความไทย
    */

    if (
      language === "th" &&
      thai === 0
    )
      continue;


    if (
      language === "en" &&
      english === 0
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


    /*
      Mixed OCR สามารถมีทั้งภาษา
      ได้ตามธรรมชาติ
    */

    if (
      language === "en" &&
      thai === 0 &&
      looksLikeEnglishGibberish(
        text
      )
    )
      continue;


    if (
      language === "th" &&
      english === 0 &&
      looksLikeThaiGibberish(
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
          bbox.x1 || 0
        ) - x
      );


    const height =
      Math.max(
        1,
        Number(
          bbox.y1 || 0
        ) - y
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

      x,
      y,
      width,
      height,

      nx:
        x /
        canvasWidth,

      ny:
        y /
        canvasHeight,

      nw:
        width /
        canvasWidth,

      nh:
        height /
        canvasHeight

    });

  }


  return result;

}


/* =========================================================
   NORMALIZED GEOMETRY
========================================================= */

function getNormalizedGeometry(
  line
) {

  return {

    x:
      Number(
        line.nx ??
        line.x ??
        0
      ),

    y:
      Number(
        line.ny ??
        line.y ??
        0
      ),

    width:
      Number(
        line.nw ??
        line.width ??
        0
      ),

    height:
      Number(
        line.nh ??
        line.height ??
        0
      )

  };

}


/* =========================================================
   CENTER Y
========================================================= */

function lineCenterY(
  line
) {

  const g =
    getNormalizedGeometry(
      line
    );


  return (
    g.y +
    g.height / 2
  );

}


/* =========================================================
   REGION
========================================================= */

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


  const ah =
    Math.max(
      0.005,
      ag.height
    );


  const bh =
    Math.max(
      0.005,
      bg.height
    );


  const referenceHeight =
    Math.min(
      ah,
      bh
    );


  const verticalDistance =
    Math.abs(
      lineCenterY(a) -
      lineCenterY(b)
    );


  if (
    verticalDistance >
    referenceHeight * 1.15
  )
    return false;


  const ar =
    ag.x +
    ag.width;


  const br =
    bg.x +
    bg.width;


  let gap =
    0;


  if (
    ar < bg.x
  ) {

    gap =
      bg.x -
      ar;

  } else if (
    br < ag.x
  ) {

    gap =
      ag.x -
      br;

  }


  return (
    gap <=
    Math.max(
      0.04,
      referenceHeight * 3
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


  const xCompact =
    x.replace(
      /\s/g,
      ""
    );

  const yCompact =
    y.replace(
      /\s/g,
      ""
    );


  if (
    xCompact ===
    yCompact
  )
    return 0.98;


  const minLength =
    Math.min(
      xCompact.length,
      yCompact.length
    );


  if (
    minLength >= 5
  ) {

    let same =
      0;


    for (
      let i = 0;
      i < minLength;
      i++
    ) {

      if (
        xCompact[i] ===
        yCompact[i]
      )
        same++;

    }


    const characterSimilarity =
      same /
      Math.max(
        xCompact.length,
        yCompact.length
      );


    if (
      characterSimilarity >
      0.72
    )
      return characterSimilarity;

  }


  const xWords =
    x.split(/\s+/)
      .filter(Boolean);


  const yWords =
    y.split(/\s+/)
      .filter(Boolean);


  let sameWords =
    0;


  for (
    const word
    of xWords
  ) {

    if (
      yWords.includes(
        word
      )
    )
      sameWords++;

  }


  return (
    sameWords /
    Math.max(
      xWords.length,
      yWords.length
    )
  );

}


/* =========================================================
   QUALITY
========================================================= */

function getLineQuality(
  line
) {

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
    line.text || "";


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


  let languageBonus =
    0;


  if (total) {

    if (
      line.language ===
      "th"
    ) {

      languageBonus =
        (
          thai /
          total
        ) * 15;

    } else {

      languageBonus =
        (
          english /
          total
        ) * 15;

    }

  }


  return (
    confidence * 0.45 +
    wordConfidence * 0.40 +
    languageBonus
  );

}


/* =========================================================
   MERGE CANDIDATES
========================================================= */

function mergeCandidateLines(
  candidates
) {

  const groups = [];


  const sorted =
    [...candidates].sort(
      (a, b) =>
        lineCenterY(a) -
        lineCenterY(b)
    );


  for (
    const candidate
    of sorted
  ) {

    let best =
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


      /*
        ถ้าข้อความคนละภาษา
        แต่ตำแหน่งเดียวกัน
        ยังรวมไว้ในกลุ่มเดียวกัน
        เพื่อให้ระบบเลือกภาษาที่เหมาะสม
      */

      const threshold =
        representative.language ===
        candidate.language
          ? 0.35
          : 0;


      if (
        similarity >=
        threshold
      ) {

        if (
          similarity >
          bestSimilarity
        ) {

          best =
            group;

          bestSimilarity =
            similarity;

        }

      }

    }


    if (best)
      best.push(
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
   CHOOSE BEST
========================================================= */

function chooseBestFromGroup(
  group
) {

  if (!group.length)
    return null;


  const scored =
    group.map(
      candidate => {

        let support =
          0;


        let similaritySupport =
          0;


        for (
          const other
          of group
        ) {

          if (
            other ===
            candidate
          )
            continue;


          const similarity =
            lineSimilarity(
              candidate.text,
              other.text
            );


          if (
            similarity >=
            0.45
          ) {

            support++;

            similaritySupport +=
              similarity;

          }

        }


        const quality =
          getLineQuality(
            candidate
          );


        const textLength =
          candidate.text
            .replace(
              /\s/g,
              ""
            )
            .length;


        let score =
          quality +
          support * 10 +
          similaritySupport * 7;


        /*
          ไม่ให้ข้อความสั้น
          ชนะข้อความจริงที่ยาวกว่า
        */

        if (
          textLength >= 5
        ) {

          score +=
            Math.min(
              8,
              textLength *
              0.12
            );

        }


        /*
          Mixed OCR ที่ confidence ดี
          ให้ความสำคัญมาก
        */

        if (
          candidate.language ===
          "mixed"
        ) {

          score +=
            4;

        }


        return {

          candidate,

          score,

          support

        };

      }
    );


  scored.sort(
    (a, b) =>
      b.score -
      a.score
  );


  const best =
    scored[0];


  if (!best)
    return null;


  return {

    ...best.candidate,

    support:
      best.support + 1

  };

}


/* =========================================================
   SELECT FINAL LINES
========================================================= */

function selectFinalLines(
  candidates
) {

  const groups =
    mergeCandidateLines(
      candidates
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
      ข้อความที่หลาย pass อ่านตรงกัน
      รับได้ตั้งแต่ confidence กลาง
    */

    if (
      support >= 2 &&
      quality >= 35
    ) {

      selected.push(
        best
      );

      continue;

    }


    /*
      ข้อความที่อ่านได้รอบเดียว
      ต้อง confidence สูงกว่า
    */

    if (
      support === 1 &&
      quality >= 58
    ) {

      selected.push(
        best
      );

    }

  }


  /*
    ป้องกันบรรทัดซ้ำ
  */

  const unique = [];


  for (
    const candidate
    of selected
  ) {

    let duplicate =
      false;


    for (
      let i = 0;
      i < unique.length;
      i++
    ) {

      const old =
        unique[i];


      if (
        !sameTextRegion(
          old,
          candidate
        )
      )
        continue;


      const similarity =
        lineSimilarity(
          old.text,
          candidate.text
        );


      if (
        similarity >=
        0.72
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

          unique[i] =
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


  /*
    เรียงตามตำแหน่งจริง
  */

  unique.sort(
    (a, b) => {

      const ay =
        lineCenterY(a);

      const by =
        lineCenterY(b);


      if (
        Math.abs(
          ay - by
        ) < 0.015
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

    let text =
      cleanText(
        line.text
      );


    if (!text)
      continue;


    /*
      Mixed language ไม่กรองทิ้ง
    */

    if (
      looksLikeOCRNoise(
        text
      ) &&
      !(
        countThai(text) > 0 &&
        countEnglish(text) > 0
      )
    )
      continue;


    /*
      รวมบรรทัดซ้ำ
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
        ) >=
        0.82
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


  return output.join(
    "\n"
  ).trim();

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
   SEPARATED OCR
========================================================= */

async function runSeparatedOCRPass(
  workers,
  canvas,
  psm,
  passIndex
) {

  const candidates = [];


  /* =======================================================
     THAI
  ======================================================= */

  try {

    const thaiData =
      await recognizeOCR(
        workers.thaiWorker,
        canvas,
        psm
      );


    candidates.push(
      ...extractOCRLines(
        thaiData,
        "th",
        passIndex,
        canvas
      )
    );

  } catch (error) {

    console.warn(
      "Thai OCR:",
      error
    );

  }


  /* =======================================================
     ENGLISH
  ======================================================= */

  try {

    const englishData =
      await recognizeOCR(
        workers.englishWorker,
        canvas,
        psm
      );


    candidates.push(
      ...extractOCRLines(
        englishData,
        "en",
        passIndex,
        canvas
      )
    );

  } catch (error) {

    console.warn(
      "English OCR:",
      error
    );

  }


  return candidates;

}


/* =========================================================
   MIXED OCR
========================================================= */

async function runMixedOCRPass(
  workers,
  canvas,
  psm,
  passIndex
) {

  try {

    const data =
      await recognizeOCR(
        workers.mixedWorker,
        canvas,
        psm
      );


    /*
      Mixed OCR ไม่มีการบังคับภาษา
    */

    const lines = [];


    if (
      data &&
      Array.isArray(
        data.lines
      )
    ) {

      const width =
        canvas.width || 1;

      const height =
        canvas.height || 1;


      for (
        const line
        of data.lines
      ) {

        const text =
          cleanText(
            line.text
          );


        if (!text)
          continue;


        const thai =
          countThai(
            text
          );

        const english =
          countEnglish(
            text
          );


        if (
          thai === 0 &&
          english === 0
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


        const w =
          Math.max(
            1,
            Number(
              bbox.x1 || 0
            ) - x
          );


        const h =
          Math.max(
            1,
            Number(
              bbox.y1 || 0
            ) - y
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
              width: w,
              height: h
            }
          );


        lines.push({

          text,

          language:
            thai > 0 &&
            english > 0
              ? "mixed"
              : thai > 0
                ? "th"
                : "en",

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
          width: w,
          height: h,

          nx:
            x / width,

          ny:
            y / height,

          nw:
            w / width,

          nh:
            h / height

        });

      }

    }


    return lines;

  } catch (error) {

    console.warn(
      "Mixed OCR:",
      error
    );

    return [];

  }

}


/* =========================================================
   OCR ONE VARIANT
========================================================= */

async function runOCRVariant(
  workers,
  canvas,
  passIndex,
  psm
) {

  const candidates = [];


  /*
    อ่านแยกภาษา
  */

  const separated =
    await runSeparatedOCRPass(
      workers,
      canvas,
      psm,
      passIndex
    );


  candidates.push(
    ...separated
  );


  /*
    Mixed OCR
  */

  const mixed =
    await runMixedOCRPass(
      workers,
      canvas,
      psm,
      passIndex
    );


  candidates.push(
    ...mixed
  );


  return candidates;

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


  if (ocrCard)
    ocrCard.hidden =
      false;


  if (ocrText)
    ocrText.value =
      "";


  hideStatus();


  try {

    const workers =
      await getOCRWorkers();


    const candidates = [];


    /* =====================================================
       VARIANT 1
       ภาพปกติ
    ===================================================== */

    showLoading(
      fromCamera
        ? "กำลังอ่านภาพจากกล้อง..."
        : "กำลังอ่านข้อความจากรูป..."
    );


    const normalCanvas =
      await prepareOCRImage(
        file,
        1
      );


    candidates.push(
      ...await runOCRVariant(
        workers,
        normalCanvas,
        1,
        6
      )
    );


    /* =====================================================
       VARIANT 2
       ขยายภาพ
    ===================================================== */

    showLoading(
      "กำลังอ่านภาพแบบขยาย..."
    );


    const enlargedCanvas =
      await prepareOCRImage(
        file,
        1.35
      );


    candidates.push(
      ...await runOCRVariant(
        workers,
        enlargedCanvas,
        2,
        6
      )
    );


    /* =====================================================
       VARIANT 3
       Grayscale + Contrast
    ===================================================== */

    showLoading(
      "กำลังปรับความคมชัดของภาพ..."
    );


    const contrastCanvas =
      createContrastCanvas(
        enlargedCanvas,
        1.25
      );


    candidates.push(
      ...await runOCRVariant(
        workers,
        contrastCanvas,
        3,
        6
      )
    );


    /* =====================================================
       VARIANT 4
       Threshold
    ===================================================== */

    showLoading(
      "กำลังตรวจภาพตัวอักษรอีกแบบ..."
    );


    const thresholdCanvas =
      createThresholdCanvas(
        enlargedCanvas
      );


    candidates.push(
      ...await runOCRVariant(
        workers,
        thresholdCanvas,
        4,
        6
      )
    );


    /* =====================================================
       VARIANT 5
       Sparse text
    ===================================================== */

    showLoading(
      "กำลังค้นหาข้อความที่อยู่คนละตำแหน่ง..."
    );


    candidates.push(
      ...await runOCRVariant(
        workers,
        normalCanvas,
        5,
        11
      )
    );


    /* =====================================================
       BUILD
    ===================================================== */

    let finalText =
      buildOCRText(
        candidates
      );


    /*
      ถ้ายังไม่มีข้อความ
      ทำ PSM 11 กับภาพขยายอีกครั้ง
    */

    if (
      !finalText ||
      finalText.length < 5
    ) {

      showLoading(
        "กำลังตรวจข้อความละเอียดอีกครั้ง..."
      );


      candidates.push(
        ...await runOCRVariant(
          workers,
          enlargedCanvas,
          6,
          11
        )
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
      ocrText.value =
        "";


    showStatus(
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองใช้ภาพที่ชัดขึ้นค่ะ",
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
  text
) {

  const hasThai =
    /[ก-๙]/.test(
      text
    );


  const hasEnglish =
    /[a-zA-Z]/.test(
      text
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
   SOURCE LANGUAGE FILTER
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
        thai > 0
      ) {

        sourceLines.push(
          normalizeThaiText(
            line
          )
        );

      }

    } else {

      if (
        english > 0
      ) {

        sourceLines.push(
          normalizeEnglishText(
            line
          )
        );

      }

    }

  }


  /*
    ถ้าหา source language
    ไม่เจอ อย่าทำข้อความหาย
  */

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


  /*
    ถ้าข้อความมีสองภาษา
    เลือกตามภาษาต้นทาง
  */

  const thai =
    countThai(
      value
    );


  const english =
    countEnglish(
      value
    );


  if (
    thai > 0 &&
    english > 0
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
    inputText &&
    text !== originalText
  ) {

    inputText.value =
      text;

  }


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


      /*
        ถ้ามีสองภาษา
        ให้ใช้ภาษาต้นทาง
      */

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

      try {

        URL.revokeObjectURL(
          selectedImageUrl
        );

      } catch (_) {}

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


    if (mixedWorker) {

      mixedWorker
        .terminate()
        .catch(
          () => {}
        );

    }

  }
);


/* =========================================================
   VERSION 50 END
========================================================= */
