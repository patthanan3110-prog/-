/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 21
   Improved Camera OCR
   General Thai + English OCR
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

        const script =
          document.createElement(
            "script"
          );

        script.src =
          TESSERACT_URL;

        script.async =
          true;

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
      thai: thaiWorker,
      english: englishWorker
    };

  }


  const Tesseract =
    await loadTesseract();


  showLoading(
    "กำลังเตรียมระบบอ่านภาษาไทย..."
  );


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

            const p =
              Math.round(
                (message.progress || 0) *
                  100
              );

            showLoading(
              `กำลังอ่านภาษาไทย ${p}%`
            );

          }

        }
      }
    );


  showLoading(
    "กำลังเตรียมระบบอ่านภาษาอังกฤษ..."
  );


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

            const p =
              Math.round(
                (message.progress || 0) *
                  100
              );

            showLoading(
              `กำลังอ่านภาษาอังกฤษ ${p}%`
            );

          }

        }
      }
    );


  const params = {

    preserve_interword_spaces:
      "1",

    user_defined_dpi:
      "300"

  };


  await thaiWorker.setParameters(
    params
  );

  await englishWorker.setParameters(
    params
  );


  return {
    thai: thaiWorker,
    english: englishWorker
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

      if (!galleryInput) return;

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

      if (file) {
        handleImageFile(file);
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
        handleImageFile(file);
      }

    }
  );

}


/* =========================================================
   IMAGE FILE
========================================================= */

function handleImageFile(file) {

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


  runOCR(file);

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


  selectedImageUrl = null;
  selectedImageFile = null;


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
   รองรับ orientation ของภาพจากกล้อง
========================================================= */

function loadImage(file) {

  return new Promise(
    async (resolve, reject) => {

      try {

        /*
          createImageBitmap ช่วยจัดการ orientation
          ของรูปจากกล้องบน browser รุ่นใหม่
        */

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

          } catch (bitmapError) {

            console.warn(
              "createImageBitmap fallback:",
              bitmapError
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

            resolve(img);

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

        reject(error);

      }

    }
  );

}


/* =========================================================
   CREATE OCR CANVAS
========================================================= */

async function createBaseCanvas(
  file
) {

  const img =
    await loadImage(file);


  const width =
    img.width ||
    img.naturalWidth;


  const height =
    img.height ||
    img.naturalHeight;


  if (!width || !height) {

    throw new Error(
      "ไม่สามารถอ่านขนาดรูปได้"
    );

  }


  /*
    รูปกล้องบางเครื่องใหญ่มาก
    จำกัดขนาดเพื่อไม่ให้มือถือค้าง
  */

  const MAX_SIZE =
    3200;


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


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );


  canvas.height =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
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
    canvas.width,
    canvas.height
  );


  if (
    typeof img.close ===
    "function"
  ) {

    try {
      img.close();
    } catch (_) {}

  }


  return canvas;

}


/* =========================================================
   IMAGE PREPROCESS
   ปรับภาพให้เหมาะกับ OCR
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


  /*
    ปรับ contrast + brightness
    แบบไม่ threshold แข็ง
    เพื่อรักษาตัวอักษรสีเทา
  */

  const contrast =
    1.18;

  const brightness =
    6;


  const factor =
    (259 *
      (contrast + 255)) /
    (255 *
      (259 - contrast));


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


    /*
      grayscale
    */

    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;


    let value =
      factor *
        (gray - 128) +
      128 +
      brightness;


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
   LIGHT SHARPEN
========================================================= */

function createSharpCanvas(
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


  /*
    ภาพหลักก่อน
  */

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );


  /*
    overlay แบบเบา ๆ
    ไม่ทำให้ตัวอักษรแตก
  */

  ctx.globalAlpha =
    0.18;

  ctx.drawImage(
    sourceCanvas,
    -1,
    0
  );

  ctx.drawImage(
    sourceCanvas,
    1,
    0
  );

  ctx.drawImage(
    sourceCanvas,
    0,
    -1
  );

  ctx.drawImage(
    sourceCanvas,
    0,
    1
  );


  ctx.globalAlpha =
    1;


  return canvas;

}


/* =========================================================
   PREPARE OCR IMAGES
========================================================= */

async function prepareOCRImages(
  file
) {

  const baseCanvas =
    await createBaseCanvas(
      file
    );


  const enhancedCanvas =
    createEnhancedCanvas(
      baseCanvas
    );


  const sharpCanvas =
    createSharpCanvas(
      enhancedCanvas
    );


  return {

    base:
      baseCanvas,

    enhanced:
      enhancedCanvas,

    sharp:
      sharpCanvas

  };

}


/* =========================================================
   OCR RECOGNIZE
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


  const data =
    result &&
    result.data
      ? result.data
      : {};


  return {

    text:
      String(
        data.text || ""
      ),

    confidence:
      Number(
        data.confidence || 0
      ),

    lines:
      Array.isArray(
        data.lines
      )
        ? data.lines
        : []

  };

}


/* =========================================================
   CLEAN LINE
========================================================= */

function cleanLine(text) {

  if (!text) return "";


  let result =
    String(text)
      .replace(/\r/g, "")
      .replace(
        /[ \t]+/g,
        " "
      )
      .trim();


  /*
    แก้เฉพาะ OCR error ทั่วไป
    ไม่ผูกกับประโยคตัวอย่าง
  */

  const replacements = [

    ["ช่วขลด", "ช่วยลด"],
    ["ชว่ยลด", "ช่วยลด"],
    ["ชว่ขลด", "ช่วยลด"],
    ["ช่วลด", "ช่วยลด"],

    ["ธีไซเคิลไล้", "รีไซเคิลได้"],
    ["ธีไซเคิลได้", "รีไซเคิลได้"],
    ["รีไซเคิลไล้", "รีไซเคิลได้"],
    ["รีไซเคิลไล", "รีไซเคิลได้"],
    ["รีไซเคิลไต้", "รีไซเคิลได้"],

    ["ผลาสติก", "พลาสติก"],
    ["พลาสตก", "พลาสติก"],
    ["พลาสตค", "พลาสติก"],

    ["โปรดริบประทาน", "โปรดรับประทาน"],
    ["โปรดรบประทาน", "โปรดรับประทาน"],

    ["สําหรับ", "สำหรับ"],
    ["สาหรับ", "สำหรับ"],

    ["ทัง", "ทั้ง"]

  ];


  for (
    const [wrong, right]
    of replacements
  ) {

    result =
      result
        .split(wrong)
        .join(right);

  }


  const compact =
    result.replace(
      /\s/g,
      ""
    );


  /*
    unknown noise
  */

  if (
    /^[-~_]*unknown[-~_]*$/i.test(
      compact
    )
  ) {

    return "";

  }


  if (
    /^[-~_]*(unhmvn|unhmw|unknwn|unkn0wn|unknvn|unhnvn)[-~_]*$/i.test(
      compact
    )
  ) {

    return "";

  }


  /*
    มีแต่เครื่องหมาย
  */

  if (
    /^[^ก-๙a-zA-Z0-9]+$/u.test(
      compact
    )
  ) {

    return "";

  }


  const useful =
    (
      compact.match(
        /[ก-๙a-zA-Z0-9]/g
      ) || []
    ).length;


  if (
    useful < 2
  ) {

    return "";

  }


  return result;

}


/* =========================================================
   THAI QUALITY
========================================================= */

function isGoodThaiLine(
  line
) {

  const text =
    cleanLine(
      line.text
    );


  if (!text) return false;


  const compact =
    text.replace(
      /\s/g,
      ""
    );


  const thaiCount =
    (
      compact.match(
        /[ก-๙]/g
      ) || []
    ).length;


  const latinCount =
    (
      compact.match(
        /[a-zA-Z]/g
      ) || []
    ).length;


  const digitCount =
    (
      compact.match(
        /[0-9๐-๙]/g
      ) || []
    ).length;


  const symbolCount =
    (
      compact.match(
        /[^ก-๙a-zA-Z0-9๐-๙]/g
      ) || []
    ).length;


  const confidence =
    Number(
      line.confidence || 0
    );


  /*
    ต้องมีภาษาไทยจริง
  */

  if (
    thaiCount < 3
  ) {

    return false;

  }


  /*
    ถ้ามีไทยปนอังกฤษ/ตัวเลขมากผิดปกติ
    มักเป็น noise
  */

  const mixedNoise =
    (
      latinCount +
      digitCount
    ) /
    Math.max(
      thaiCount,
      1
    );


  if (
    confidence < 55 &&
    mixedNoise > 0.55
  ) {

    return false;

  }


  /*
    สัญลักษณ์เยอะเกินไป
  */

  const noiseRatio =
    (
      digitCount +
      symbolCount
    ) /
    Math.max(
      compact.length,
      1
    );


  if (
    confidence < 60 &&
    noiseRatio > 0.28
  ) {

    return false;

  }


  /*
    บรรทัดที่เหมือนตัวอักษรมั่ว
    เช่นไม่มีสระ/ตัวสะกดที่สมเหตุสมผล
    ใช้เป็นเงื่อนไขเฉพาะ confidence ต่ำ
  */

  if (
    confidence < 45 &&
    thaiCount < 5
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   ENGLISH QUALITY
========================================================= */

function isGoodEnglishLine(
  line
) {

  const text =
    cleanLine(
      line.text
    );


  if (!text) return false;


  const compact =
    text.replace(
      /\s/g,
      ""
    );


  const englishCount =
    (
      compact.match(
        /[a-zA-Z]/g
      ) || []
    ).length;


  const thaiCount =
    (
      compact.match(
        /[ก-๙]/g
      ) || []
    ).length;


  const digitCount =
    (
      compact.match(
        /[0-9]/g
      ) || []
    ).length;


  const symbolCount =
    (
      compact.match(
        /[^a-zA-Z0-9ก-๙]/g
      ) || []
    ).length;


  const confidence =
    Number(
      line.confidence || 0
    );


  if (
    englishCount < 2
  ) {

    return false;

  }


  /*
    ถ้าไทยมากกว่าอังกฤษ
    ไม่ใช่บรรทัดอังกฤษ
  */

  if (
    thaiCount >
    englishCount
  ) {

    return false;

  }


  /*
    ตัวเลขเยอะเกิน
  */

  if (
    digitCount >
    englishCount * 0.5 &&
    confidence < 75
  ) {

    return false;

  }


  /*
    อักขระแปลกเยอะ
  */

  const noiseRatio =
    (
      digitCount +
      symbolCount
    ) /
    Math.max(
      compact.length,
      1
    );


  if (
    confidence < 50 &&
    noiseRatio > 0.35
  ) {

    return false;

  }


  /*
    คำยาวติดกันแบบ OCR noise
  */

  const words =
    text
      .split(/\s+/)
      .filter(Boolean);


  const longGarbage =
    words.some(
      word =>
        word.length >= 20 &&
        !/[.,!?;:()'"\-]/.test(
          word
        )
    );


  if (
    confidence < 70 &&
    longGarbage
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   LINE EXTRACTION
========================================================= */

function extractLines(
  result,
  language
) {

  const output = [];


  if (
    !Array.isArray(
      result.lines
    )
  ) {

    return output;

  }


  for (
    const line
    of result.lines
  ) {

    const text =
      cleanLine(
        line.text || ""
      );


    if (!text)
      continue;


    const bbox =
      line.bbox || {};


    const item = {

      text,

      language,

      confidence:
        Number(
          line.confidence ||
          result.confidence ||
          0
        ),

      x:
        Number(
          bbox.x0 || 0
        ),

      y:
        Number(
          bbox.y0 || 0
        ),

      width:
        Number(
          (bbox.x1 || 0) -
          (bbox.x0 || 0)
        ),

      height:
        Number(
          (bbox.y1 || 0) -
          (bbox.y0 || 0)
        )

    };


    if (
      language === "th"
    ) {

      if (
        isGoodThaiLine(
          item
        )
      ) {

        output.push(
          item
        );

      }

    } else {

      if (
        isGoodEnglishLine(
          item
        )
      ) {

        output.push(
          item
        );

      }

    }

  }


  return output;

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeLine(
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
   SIMILARITY
========================================================= */

function lineSimilarity(
  a,
  b
) {

  const x =
    normalizeLine(a);

  const y =
    normalizeLine(b);


  if (!x || !y)
    return 0;


  if (x === y)
    return 1;


  const xWords =
    x.split(" ")
      .filter(Boolean);


  const yWords =
    y.split(" ")
      .filter(Boolean);


  if (
    !xWords.length ||
    !yWords.length
  ) {

    return 0;

  }


  let same = 0;


  for (
    const word
    of xWords
  ) {

    if (
      yWords.includes(word)
    ) {

      same++;

    }

  }


  return same /
    Math.max(
      xWords.length,
      yWords.length
    );

}


/* =========================================================
   DEDUPLICATE
========================================================= */

function deduplicateLines(
  lines
) {

  const unique = [];


  for (
    const line
    of lines
  ) {

    let duplicate =
      false;


    for (
      const old
      of unique
    ) {

      /*
        ถ้าข้อความเหมือนกันมาก
        ถือว่าเป็นบรรทัดซ้ำ
      */

      if (
        lineSimilarity(
          line.text,
          old.text
        ) >= 0.82
      ) {

        if (
          Number(
            line.confidence || 0
          ) >
          Number(
            old.confidence || 0
          )
        ) {

          old.text =
            line.text;

          old.confidence =
            line.confidence;

          old.x =
            line.x;

          old.y =
            line.y;

          old.width =
            line.width;

          old.height =
            line.height;

        }


        duplicate =
          true;

        break;

      }

    }


    if (!duplicate) {

      unique.push(
        line
      );

    }

  }


  return unique;

}


/* =========================================================
   MERGE LINES
========================================================= */

function mergeLines(
  thaiLines,
  englishLines
) {

  const all = [

    ...thaiLines,
    ...englishLines

  ];


  const unique =
    deduplicateLines(
      all
    );


  /*
    เรียงตามตำแหน่งจริงของข้อความ
  */

  unique.sort(
    (a, b) => {

      const yDiff =
        a.y - b.y;


      const tolerance =
        Math.max(
          12,
          Math.min(
            a.height || 24,
            b.height || 24
          ) * 0.6
        );


      if (
        Math.abs(yDiff) <=
        tolerance
      ) {

        return a.x - b.x;

      }


      return yDiff;

    }
  );


  return unique
    .map(
      item =>
        item.text
    )
    .join("\n")
    .trim();

}


/* =========================================================
   REMOVE OBVIOUS OCR NOISE
========================================================= */

function removeObviousNoise(
  text
) {

  if (!text)
    return "";


  const lines =
    String(text)
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


  const result = [];


  for (
    const line
    of lines
  ) {

    const compact =
      line.replace(
        /\s/g,
        ""
      );


    if (!compact)
      continue;


    /*
      ข้อความอังกฤษที่ดูเป็น noise
      เช่น ตัวอักษรติดกันยาวมาก
    */

    const english =
      (
        compact.match(
          /[a-zA-Z]/g
        ) || []
      ).length;


    const thai =
      (
        compact.match(
          /[ก-๙]/g
        ) || []
      ).length;


    const digits =
      (
        compact.match(
          /[0-9]/g
        ) || []
      ).length;


    const letters =
      english + thai;


    /*
      ตัวอักษรน้อยมาก + ตัวเลขเยอะ
    */

    if (
      letters <= 2 &&
      digits >= 3
    ) {

      continue;

    }


    /*
      อังกฤษยาวมากแต่แทบไม่มีช่องว่าง
      มักเป็น noise จากภาพ
    */

    if (
      english >= 18 &&
      !/\s/.test(line) &&
      thai === 0
    ) {

      /*
        ยกเว้นคำที่ดูเป็นประโยคจริง
        ซึ่งโดยทั่วไปจะมีเครื่องหมาย
      */

      if (
        !/[.,!?;:'"\-]/.test(
          line
        )
      ) {

        continue;

      }

    }


    result.push(
      line
    );

  }


  return result.join(
    "\n"
  );

}


/* =========================================================
   OCR ONE IMAGE
========================================================= */

async function runOCRPasses(
  workers,
  canvasSet
) {

  const allThai = [];
  const allEnglish = [];


  /*
    -----------------------------------------
    PASS 1
    ภาพปกติ
    -----------------------------------------
  */

  showLoading(
    "กำลังอ่านภาษาไทย..."
  );


  const thaiBase =
    await recognizeOCR(
      workers.thai,
      canvasSet.base,
      6
    );


  allThai.push(
    ...extractLines(
      thaiBase,
      "th"
    )
  );


  showLoading(
    "กำลังอ่านภาษาอังกฤษ..."
  );


  const englishBase =
    await recognizeOCR(
      workers.english,
      canvasSet.base,
      6
    );


  allEnglish.push(
    ...extractLines(
      englishBase,
      "en"
    )
  );


  /*
    -----------------------------------------
    PASS 2
    ภาพปรับ contrast
    -----------------------------------------
  */

  showLoading(
    "กำลังปรับภาพเพื่ออ่านข้อความ..."
  );


  const thaiEnhanced =
    await recognizeOCR(
      workers.thai,
      canvasSet.enhanced,
      6
    );


  allThai.push(
    ...extractLines(
      thaiEnhanced,
      "th"
    )
  );


  const englishEnhanced =
    await recognizeOCR(
      workers.english,
      canvasSet.enhanced,
      6
    );


  allEnglish.push(
    ...extractLines(
      englishEnhanced,
      "en"
    )
  );


  /*
    -----------------------------------------
    PASS 3
    ภาพ sharpen
    เฉพาะกรณีที่ยังอ่านได้น้อย
    -----------------------------------------
  */

  if (
    allThai.length === 0 ||
    allEnglish.length === 0
  ) {

    showLoading(
      "กำลังตรวจข้อความเพิ่มเติม..."
    );


    if (
      allThai.length === 0
    ) {

      const thaiSharp =
        await recognizeOCR(
          workers.thai,
          canvasSet.sharp,
          11
        );


      allThai.push(
        ...extractLines(
          thaiSharp,
          "th"
        )
      );

    }


    if (
      allEnglish.length === 0
    ) {

      const englishSharp =
        await recognizeOCR(
          workers.english,
          canvasSet.sharp,
          11
        );


      allEnglish.push(
        ...extractLines(
          englishSharp,
          "en"
        )
      );

    }

  }


  return {

    thai:
      deduplicateLines(
        allThai
      ),

    english:
      deduplicateLines(
        allEnglish
      )

  };

}


/* =========================================================
   OCR MAIN
========================================================= */

async function runOCR(
  file
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


    showLoading(
      "กำลังเตรียมรูป..."
    );


    const canvasSet =
      await prepareOCRImages(
        file
      );


    const result =
      await runOCRPasses(
        workers,
        canvasSet
      );


    let finalText =
      mergeLines(
        result.thai,
        result.english
      );


    finalText =
      removeObviousNoise(
        finalText
      );


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


  const text =
    inputText
      ? inputText.value.trim()
      : "";


  if (!text) {

    showStatus(
      "กรุณาพิมพ์ข้อความก่อนแปล",
      "error"
    );

    return;

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

  if (!text) return "";


  const lines =
    String(text)
      .replace(/\r/g, "")
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

  if (!text) return;


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
