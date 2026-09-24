/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 34

   OCR หลัก:
   - ใช้ Thai + English OCR ร่วมกัน
   - ไม่ใช้ Thai worker แยกกับ English worker แล้วเอามาชนกัน
   - ลดปัญหา English ถูกอ่านเป็นภาษาไทย
   - Camera และ Gallery ใช้ระบบ OCR เดียวกัน
   - Camera มีการเตรียมภาพเพิ่มเติม
   - ไม่ hardcode ข้อความจากรูปตัวอย่าง
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

let ocrWorker = null;
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
   OCR WORKER
========================================================= */

async function getOCRWorker() {

  if (ocrWorker) {
    return ocrWorker;
  }


  const Tesseract =
    await loadTesseract();


  showLoading(
    "กำลังเตรียมระบบอ่านภาษาไทยและอังกฤษ..."
  );


  /*
    สำคัญ:
    ใช้ OCR ภาษาไทย + อังกฤษใน worker เดียว
    เพื่อไม่ให้ Thai OCR พยายามอ่าน English
    แล้วนำผลผิด ๆ มาชนกับ English OCR
  */

  ocrWorker =
    await Tesseract.createWorker(
      "tha+eng",
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
              `กำลังอ่านข้อความ ${percent}%`
            );

          }

        }
      }
    );


  await ocrWorker.setParameters({

    preserve_interword_spaces:
      "1",

    user_defined_dpi:
      "300"

  });


  return ocrWorker;

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
              "Bitmap orientation fallback",
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


  /*
    ป้องกัน canvas ใหญ่เกินไป
  */

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
   IMAGE VARIANTS
========================================================= */

function createEnhancedCanvas(
  sourceCanvas
) {

  const width =
    sourceCanvas.width;

  const height =
    sourceCanvas.height;


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
        willReadFrequently:
          true
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


  /*
    ปรับ contrast เล็กน้อย
    โดยไม่เปลี่ยนรูปต้นฉบับ
  */

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


      /*
        เพิ่ม contrast แบบเบา ๆ
      */

      const factor =
        1.12;


      data[i] =
        Math.max(
          0,
          Math.min(
            255,
            128 +
            (r - 128) *
            factor
          )
        );


      data[i + 1] =
        Math.max(
          0,
          Math.min(
            255,
            128 +
            (g - 128) *
            factor
          )
        );


      data[i + 2] =
        Math.max(
          0,
          Math.min(
            255,
            128 +
            (b - 128) *
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
   OCR
========================================================= */

async function recognizeOCR(
  worker,
  canvas,
  psm = 6
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
   CLEAN TEXT
========================================================= */

function cleanText(
  text
) {

  if (!text)
    return "";


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


/* =========================================================
   CHARACTER COUNTS
========================================================= */

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


  if (!total)
    return 0;


  return {
    thai:
      thai / total,

    english:
      english / total
  };

}


/* =========================================================
   LINE QUALITY
========================================================= */

function getLineQuality(
  line
) {

  const text =
    cleanText(
      line?.text
    );


  if (!text)
    return 0;


  const thai =
    countThai(
      text
    );


  const english =
    countEnglish(
      text
    );


  const digits =
    countDigits(
      text
    );


  const useful =
    thai +
    english +
    digits;


  const total =
    text.replace(
      /\s/g,
      ""
    ).length;


  if (!total)
    return 0;


  const usefulRatio =
    useful /
    total;


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


  return (
    confidence * 0.65 +
    usefulRatio * 100 * 0.35
  );

}


/* =========================================================
   LINE CLEANING
========================================================= */

function normalizeThaiText(
  text
) {

  if (!text)
    return "";


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
      /\s+([ะาิีึืุูัเแโใไำ่้๊๋็์ๆฯ])/g,
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

  if (!text)
    return "";


  return String(
    text
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* =========================================================
   EXTRACT OCR LINES
========================================================= */

function extractOCRLines(
  data
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


    const digits =
      countDigits(
        raw
      );


    /*
      ต้องมีตัวอักษรจริง
    */

    if (
      thai +
      english ===
      0
    ) {

      continue;

    }


    /*
      ถ้าเป็นข้อความผสม ให้รักษาไว้
      เพราะรูปจริงอาจมีไทยและอังกฤษในบรรทัดเดียวกัน
    */

    let text =
      raw;


    if (thai > 0) {

      text =
        normalizeThaiText(
          text
        );

    }


    if (english > 0) {

      text =
        normalizeEnglishText(
          text
        );

    }


    if (!text)
      continue;


    const bbox =
      line.bbox || {};


    result.push({

      text,

      confidence:
        Number(
          line.confidence ||
          data.confidence ||
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
        Math.max(
          1,
          Number(
            (bbox.x1 || 0) -
            (bbox.x0 || 0)
          )
        ),

      height:
        Math.max(
          1,
          Number(
            (bbox.y1 || 0) -
            (bbox.y0 || 0)
          )
        ),

      thai,

      english,

      digits

    });

  }


  return result;

}


/* =========================================================
   LINE SIMILARITY
========================================================= */

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
    x.split(" ")
      .filter(Boolean);


  const yWords =
    y.split(" ")
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

  const result = [];


  for (
    const line
    of lines
  ) {

    if (!line?.text)
      continue;


    let found =
      false;


    for (
      let i = 0;
      i < result.length;
      i++
    ) {

      const old =
        result[i];


      if (
        lineSimilarity(
          line.text,
          old.text
        ) >= 0.82
      ) {

        if (
          getLineQuality(
            line
          ) >
          getLineQuality(
            old
          )
        ) {

          result[i] =
            line;

        }


        found =
          true;

        break;

      }

    }


    if (!found) {

      result.push(
        line
      );

    }

  }


  return result;

}


/* =========================================================
   NOISE FILTER
========================================================= */

function looksLikeOCRNoise(
  line
) {

  const text =
    cleanText(
      line
    );


  if (!text)
    return true;


  const thai =
    countThai(
      text
    );


  const english =
    countEnglish(
      text
    );


  const digits =
    countDigits(
      text
    );


  const letters =
    thai +
    english;


  if (!letters)
    return true;


  /*
    ตัวเลขล้วนหรือเกือบล้วน
  */

  if (
    digits >= 4 &&
    digits > letters
  ) {

    return true;

  }


  /*
    อักขระแปลกจำนวนมาก
  */

  const symbols =
    (
      text.match(
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
    อังกฤษสั้นมากที่มีลักษณะเป็น OCR noise
  */

  if (
    english > 0 &&
    thai === 0
  ) {

    const words =
      text
        .split(/\s+/)
        .filter(Boolean);


    if (
      words.length === 1 &&
      english <= 2
    ) {

      return true;

    }

  }


  /*
    ไทยที่มีอังกฤษปนหนักผิดปกติ
  */

  if (
    thai > 0 &&
    english > thai * 1.5 &&
    thai < 6
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   ORDER LINES
========================================================= */

function sortOCRLines(
  lines
) {

  return lines
    .slice()
    .sort(
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


        const ah =
          Math.max(
            12,
            Number(
              a.height || 20
            )
          );


        const bh =
          Math.max(
            12,
            Number(
              b.height || 20
            )
          );


        const rowHeight =
          Math.min(
            ah,
            bh
          );


        if (
          Math.abs(
            ay - by
          ) <=
          rowHeight * 0.6
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

}


/* =========================================================
   FINAL OCR TEXT
========================================================= */

function buildFinalOCRText(
  data
) {

  let lines =
    extractOCRLines(
      data
    );


  lines =
    deduplicateLines(
      lines
    );


  lines =
    sortOCRLines(
      lines
    );


  const output = [];


  for (
    const line
    of lines
  ) {

    let text =
      line.text;


    if (
      looksLikeOCRNoise(
        text
      )
    ) {

      continue;

    }


    /*
      ห้ามตัดไทยหรืออังกฤษออกจากบรรทัด
      เพราะ OCR แบบ combined สามารถอ่าน
      ข้อความหลายภาษาในบรรทัดเดียวได้
    */

    text =
      cleanText(
        text
      );


    if (!text)
      continue;


    const normalized =
      normalizeForCompare(
        text
      );


    if (
      output.some(
        old =>
          normalizeForCompare(
            old
          ) ===
          normalized
      )
    ) {

      continue;

    }


    output.push(
      text
    );

  }


  return output.join(
    "\n"
  ).trim();

}


/* =========================================================
   OCR SCORE
========================================================= */

function scoreOCRText(
  text,
  data
) {

  if (!text)
    return -999;


  const lines =
    text
      .split("\n")
      .filter(Boolean);


  if (!lines.length)
    return -999;


  let score =
    0;


  const confidence =
    Number(
      data?.confidence || 0
    );


  score +=
    confidence * 0.5;


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


    const digits =
      countDigits(
        line
      );


    score +=
      thai * 1.5;


    score +=
      english * 1.5;


    if (
      digits >
      thai + english
    ) {

      score -=
        digits * 2;

    }


    if (
      looksLikeOCRNoise(
        line
      )
    ) {

      score -=
        10;

    }

  }


  score +=
    Math.min(
      10,
      lines.length * 2
    );


  return score;

}


/* =========================================================
   OCR ONE PASS
========================================================= */

async function runOCROnCanvas(
  worker,
  canvas,
  psm
) {

  const data =
    await recognizeOCR(
      worker,
      canvas,
      psm
    );


  const text =
    buildFinalOCRText(
      data
    );


  return {
    text,
    data
  };

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

    const worker =
      await getOCRWorker();


    /* =====================================================
       PASS 1
       ใช้กับทั้ง Camera และ Gallery
    ===================================================== */

    showLoading(
      fromCamera
        ? "กำลังอ่านข้อความจากกล้อง..."
        : "กำลังอ่านข้อความจากรูป..."
    );


    const canvas =
      await prepareOCRImage(
        file,
        1
      );


    const pass1 =
      await runOCROnCanvas(
        worker,
        canvas,
        6
      );


    let candidates = [
      pass1
    ];


    /* =====================================================
       PASS 2
       ขยายภาพ
       ใช้ทั้ง Camera และ Gallery
       เพื่อให้ภาพตัวหนังสือเล็กอ่านง่ายขึ้น
    ===================================================== */

    if (
      !pass1.text ||
      fromCamera
    ) {

      showLoading(
        "กำลังตรวจภาพเพิ่มเติม..."
      );


      const enlargedCanvas =
        await prepareOCRImage(
          file,
          1.5
        );


      const pass2 =
        await runOCROnCanvas(
          worker,
          enlargedCanvas,
          6
        );


      candidates.push(
        pass2
      );

    }


    /* =====================================================
       PASS 3
       ภาพปรับ contrast
       ใช้เฉพาะเมื่อผลยังไม่ดี
    ===================================================== */

    let best =
      candidates[0];


    for (
      const candidate
      of candidates
    ) {

      const candidateScore =
        scoreOCRText(
          candidate.text,
          candidate.data
        );


      const bestScore =
        scoreOCRText(
          best.text,
          best.data
        );


      if (
        candidateScore >
        bestScore
      ) {

        best =
          candidate;

      }

    }


    if (
      !best.text
    ) {

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );


      const baseCanvas =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.35
            : 1.2
        );


      const enhancedCanvas =
        createEnhancedCanvas(
          baseCanvas
        );


      const pass3 =
        await runOCROnCanvas(
          worker,
          enhancedCanvas,
          6
        );


      const bestScore =
        scoreOCRText(
          best.text,
          best.data
        );


      const pass3Score =
        scoreOCRText(
          pass3.text,
          pass3.data
        );


      if (
        pass3Score >
        bestScore
      ) {

        best =
          pass3;

      }

    }


    const finalText =
      cleanFinalOCR(
        best.text
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
   CLEAN FINAL OCR
========================================================= */

function cleanFinalOCR(
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
          cleanText(
            line
          )
      )
      .filter(Boolean);


  const result = [];


  for (
    const line
    of lines
  ) {

    if (
      looksLikeOCRNoise(
        line
      )
    ) {

      continue;

    }


    const normalized =
      normalizeForCompare(
        line
      );


    if (
      result.some(
        old =>
          normalizeForCompare(
            old
          ) ===
          normalized
      )
    ) {

      continue;

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
          line;


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


    if (ocrWorker) {

      ocrWorker
        .terminate()
        .catch(
          () => {}
        );

    }

  }
);
