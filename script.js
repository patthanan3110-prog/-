/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 36

   OCR:
   - Thai OCR + English OCR แยก Worker
   - ใช้ line confidence + word confidence
   - ใช้ตำแหน่งและระยะห่างของข้อความ
   - ตรวจข้อความจากหลาย PSM
   - รวมผลระดับบรรทัด ไม่เลือกทั้งภาพจาก pass เดียว
   - ตัด OCR ข้ามภาษาที่เกิดในบริเวณเดียวกัน
   - ไม่ hardcode คำจากรูปตัวอย่าง
   - Camera และ Gallery ใช้ระบบเดียวกัน
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
   ENHANCED IMAGE
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


    const factor =
      1.12;


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
   OCR RECOGNIZE
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
   LANGUAGE PURITY
========================================================= */

function getExpectedLanguageQuality(
  text,
  language
) {

  const ratio =
    getLanguageRatio(
      text
    );


  if (
    language === "th"
  ) {

    return (
      ratio.thai -
      ratio.english * 0.35
    );

  }


  return (
    ratio.english -
    ratio.thai * 0.35
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
    ) ||
    !bbox
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


  const matched = [];


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

        matched.push(
          confidence
        );

      }

    }

  }


  if (
    matched.length === 0
  ) {

    return null;

  }


  return (
    matched.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    ) /
    matched.length
  );

}


/* =========================================================
   LINE QUALITY
========================================================= */

function getLineQuality(
  line,
  expectedLanguage = ""
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


  const lineConfidence =
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
    Number.isFinite(
      Number(
        line.wordConfidence
      )
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Number(
              line.wordConfidence
            )
          )
        )
      : lineConfidence;


  let score =
    lineConfidence * 0.38 +
    wordConfidence * 0.37 +
    usefulRatio * 100 * 0.15;


  if (
    expectedLanguage
  ) {

    const languageQuality =
      getExpectedLanguageQuality(
        text,
        expectedLanguage
      );


    score +=
      languageQuality *
      10;

  }


  return score;

}


/* =========================================================
   NORMALIZE THAI
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


/* =========================================================
   NORMALIZE ENGLISH
========================================================= */

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
  data,
  language
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


    const bbox =
      line.bbox || {};


    const item = {

      text,

      language,

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

      digits,

      wordConfidence:
        getWordConfidence(
          data,
          {
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
              )
          }
        )

    };


    result.push(
      item
    );

  }


  return result;

}


/* =========================================================
   BBOX HELPERS
========================================================= */

function getRight(
  line
) {

  return (
    Number(line.x || 0) +
    Number(line.width || 0)
  );

}


function getBottom(
  line
) {

  return (
    Number(line.y || 0) +
    Number(line.height || 0)
  );

}


function verticalOverlapRatio(
  a,
  b
) {

  const top =
    Math.max(
      Number(a.y || 0),
      Number(b.y || 0)
    );


  const bottom =
    Math.min(
      getBottom(a),
      getBottom(b)
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


  return (
    overlap /
    smaller
  );

}


function horizontalOverlapRatio(
  a,
  b
) {

  const left =
    Math.max(
      Number(a.x || 0),
      Number(b.x || 0)
    );


  const right =
    Math.min(
      getRight(a),
      getRight(b)
    );


  const overlap =
    Math.max(
      0,
      right - left
    );


  const smaller =
    Math.max(
      1,
      Math.min(
        Number(a.width || 1),
        Number(b.width || 1)
      )
    );


  return (
    overlap /
    smaller
  );

}


/* =========================================================
   LINE REGION RELATION
========================================================= */

function verticalCenter(
  line
) {

  return (
    Number(line.y || 0) +
    Number(line.height || 0) / 2
  );

}


function horizontalGap(
  a,
  b
) {

  const aRight =
    getRight(a);


  const bRight =
    getRight(b);


  if (
    aRight < Number(b.x || 0)
  ) {

    return (
      Number(b.x || 0) -
      aRight
    );

  }


  if (
    bRight < Number(a.x || 0)
  ) {

    return (
      Number(a.x || 0) -
      bRight
    );

  }


  return 0;

}


function sameTextRegion(
  a,
  b
) {

  const vertical =
    verticalOverlapRatio(
      a,
      b
    );


  const horizontal =
    horizontalOverlapRatio(
      a,
      b
    );


  if (
    vertical >= 0.35 &&
    horizontal >= 0.08
  ) {

    return true;

  }


  const centerDistance =
    Math.abs(
      verticalCenter(a) -
      verticalCenter(b)
    );


  const referenceHeight =
    Math.max(
      8,
      Math.max(
        Number(a.height || 0),
        Number(b.height || 0)
      )
    );


  const gap =
    horizontalGap(
      a,
      b
    );


  if (
    centerDistance <=
      referenceHeight * 0.75 &&
    gap <=
      Math.max(
        30,
        referenceHeight * 1.5
      )
  ) {

    return true;

  }


  return false;

}


function boxesOverlap(
  a,
  b
) {

  return sameTextRegion(
    a,
    b
  );

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


  return (
    same /
    Math.max(
      xWords.length,
      yWords.length
    )
  );

}


/* =========================================================
   OCR NOISE
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
    ไม่ให้บรรทัดที่เป็นตัวเลข/สัญลักษณ์
    และไม่มีตัวอักษรจริงหลุดเข้ามา
  */

  if (
    digits >= 5 &&
    digits > letters
  ) {

    return true;

  }


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
    อังกฤษ 1-2 ตัวโดด ๆ
    มีโอกาสเป็น OCR noise
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
    ถ้ามีอักขระแปลกมากเมื่อเทียบกับ
    จำนวนตัวอักษร ให้ลดความน่าเชื่อถือ
  */

  const suspicious =
    (
      text.match(
        /[|~`_^*=<>[\]{}]/g
      ) || []
    ).length;


  if (
    suspicious >= 2 &&
    suspicious >=
      Math.max(
        2,
        Math.floor(
          letters * 0.15
        )
      )
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   LANGUAGE-SPECIFIC NOISE
========================================================= */

function looksLikeLanguageNoise(
  line,
  language
) {

  if (
    !line ||
    !line.text
  ) {

    return true;

  }


  const text =
    cleanText(
      line.text
    );


  if (
    looksLikeOCRNoise(
      text
    )
  ) {

    return true;

  }


  const thai =
    countThai(
      text
    );


  const english =
    countEnglish(
      text
    );


  const confidence =
    Number(
      line.confidence || 0
    );


  const wordConfidence =
    Number.isFinite(
      Number(
        line.wordConfidence
      )
    )
      ? Number(
          line.wordConfidence
        )
      : confidence;


  if (
    language === "th"
  ) {

    /*
      Thai Worker ที่อ่านออกมาเป็นอังกฤษล้วน
      ไม่ใช่ผลภาษาไทย
    */

    if (
      thai === 0 &&
      english > 2
    ) {

      return true;

    }


    /*
      ถ้าเป็นไทยแต่ confidence ต่ำมาก
      และไม่มี word confidence ที่ดี
    */

    if (
      thai > 0 &&
      confidence < 25 &&
      wordConfidence < 35
    ) {

      return true;

    }

  } else {

    /*
      English Worker ที่อ่านออกมาเป็นไทยล้วน
    */

    if (
      english === 0 &&
      thai > 2
    ) {

      return true;

    }


    if (
      english > 0 &&
      confidence < 25 &&
      wordConfidence < 35
    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   DEDUPLICATE SAME LANGUAGE
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


      const sameText =
        lineSimilarity(
          line.text,
          old.text
        ) >= 0.82;


      const sameArea =
        sameTextRegion(
          line,
          old
        );


      if (
        sameText ||
        (
          sameArea &&
          line.language ===
            old.language
        )
      ) {

        if (
          getLineQuality(
            line,
            line.language
          ) >
          getLineQuality(
            old,
            old.language
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
   CROSS LANGUAGE CONFLICT
========================================================= */

function resolveCrossLanguageConflicts(
  lines
) {

  /*
    ไม่ใช้ลำดับที่เจอเป็นตัวตัดสิน
    แต่สร้างกลุ่มข้อความที่อยู่ในบริเวณเดียวกันก่อน
  */

  const result = [];


  for (
    const line
    of lines
  ) {

    if (!line?.text)
      continue;


    const conflicts =
      result.filter(
        old =>
          old.language !==
            line.language &&
          sameTextRegion(
            old,
            line
          )
      );


    if (
      conflicts.length === 0
    ) {

      result.push(
        line
      );

      continue;

    }


    let lineKeep =
      true;


    for (
      const old
      of conflicts
    ) {

      const lineQuality =
        getLineQuality(
          line,
          line.language
        );


      const oldQuality =
        getLineQuality(
          old,
          old.language
        );


      const lineWord =
        Number(
          line.wordConfidence
        );


      const oldWord =
        Number(
          old.wordConfidence
        );


      /*
        ถ้ามี word confidence ทั้งคู่
        ให้ใช้เป็นตัวแยกหลัก
      */

      if (
        Number.isFinite(
          lineWord
        ) &&
        Number.isFinite(
          oldWord
        )
      ) {

        if (
          oldWord -
            lineWord >=
          10
        ) {

          lineKeep =
            false;

          break;

        }


        if (
          lineWord -
            oldWord >=
          10
        ) {

          continue;

        }

      }


      /*
        ถ้า word confidence ใกล้กัน
        ใช้คุณภาพรวม
      */

      if (
        oldQuality -
          lineQuality >=
        12
      ) {

        lineKeep =
          false;

        break;

      }

    }


    if (
      lineKeep
    ) {

      /*
        ถ้าตัวใหม่ดีกว่า
        เอาตัวเก่าที่ชนกันออก
      */

      for (
        let i =
          result.length - 1;
        i >= 0;
        i--
      ) {

        if (
          result[i].language !==
            line.language &&
          sameTextRegion(
            result[i],
            line
          )
        ) {

          const newQuality =
            getLineQuality(
              line,
              line.language
            );


          const oldQuality =
            getLineQuality(
              result[i],
              result[i].language
            );


          const newWord =
            Number(
              line.wordConfidence
            );


          const oldWord =
            Number(
              result[i]
                .wordConfidence
            );


          const wordBetter =
            Number.isFinite(
              newWord
            ) &&
            Number.isFinite(
              oldWord
            ) &&
            newWord >
              oldWord + 10;


          const qualityBetter =
            newQuality >
            oldQuality + 12;


          if (
            wordBetter ||
            qualityBetter
          ) {

            result.splice(
              i,
              1
            );

          }

        }

      }


      result.push(
        line
      );

    }

  }


  return result;

}


/* =========================================================
   STABILITY / SUPPORT
========================================================= */

function getTextSupport(
  line,
  allCandidates
) {

  let support =
    0;


  for (
    const other
    of allCandidates
  ) {

    if (
      other === line
    ) {

      continue;

    }


    if (
      other.language !==
      line.language
    ) {

      continue;

    }


    if (
      lineSimilarity(
        line.text,
        other.text
      ) >= 0.65
    ) {

      support +=
        1;

    }

  }


  return support;

}


/* =========================================================
   SELECT BEST LINE CANDIDATES
========================================================= */

function selectBestOCRLines(
  allCandidates
) {

  const usable =
    allCandidates.filter(
      line =>
        line &&
        line.text &&
        !looksLikeLanguageNoise(
          line,
          line.language
        )
    );


  const selected = [];


  /*
    เรียงจากคุณภาพสูงก่อน
    เพื่อให้ข้อความจริงมีโอกาสถูกเลือกก่อน
  */

  usable.sort(
    (
      a,
      b
    ) => {

      const supportA =
        getTextSupport(
          a,
          usable
        );


      const supportB =
        getTextSupport(
          b,
          usable
        );


      const scoreA =
        getLineQuality(
          a,
          a.language
        ) +
        supportA * 8;


      const scoreB =
        getLineQuality(
          b,
          b.language
        ) +
        supportB * 8;


      return (
        scoreB -
        scoreA
      );

    }
  );


  for (
    const candidate
    of usable
  ) {

    let conflict =
      false;


    for (
      const old
      of selected
    ) {

      /*
        ข้อความภาษาเดียวกัน
        ถ้าซ้ำพื้นที่ ให้เก็บตัวที่ดีกว่า
      */

      if (
        old.language ===
        candidate.language
      ) {

        if (
          sameTextRegion(
            old,
            candidate
          )
        ) {

          conflict =
            true;

          break;

        }

        continue;

      }


      /*
        คนละภาษาในพื้นที่เดียวกัน
        เป็นจุดสำคัญของปัญหา
      */

      if (
        sameTextRegion(
          old,
          candidate
        )
      ) {

        const oldScore =
          getLineQuality(
            old,
            old.language
          );


        const newScore =
          getLineQuality(
            candidate,
            candidate.language
          );


        const oldWord =
          Number(
            old.wordConfidence
          );


        const newWord =
          Number(
            candidate.wordConfidence
          );


        if (
          Number.isFinite(
            oldWord
          ) &&
          Number.isFinite(
            newWord
          ) &&
          oldWord >=
            newWord + 8
        ) {

          conflict =
            true;

          break;

        }


        if (
          oldScore >=
            newScore + 10
        ) {

          conflict =
            true;

          break;

        }

      }

    }


    if (!conflict) {

      selected.push(
        candidate
      );

    }

  }


  return selected;

}


/* =========================================================
   SORT
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
   BUILD OCR TEXT
========================================================= */

function buildFinalOCRTextFromCandidates(
  candidateResults
) {

  const allCandidates = [];


  for (
    const result
    of candidateResults
  ) {

    if (!result)
      continue;


    const thaiLines =
      extractOCRLines(
        result.thaiData,
        "th"
      );


    const englishLines =
      extractOCRLines(
        result.englishData,
        "en"
      );


    for (
      const line
      of thaiLines
    ) {

      if (
        !looksLikeLanguageNoise(
          line,
          "th"
        )
      ) {

        allCandidates.push(
          line
        );

      }

    }


    for (
      const line
      of englishLines
    ) {

      if (
        !looksLikeLanguageNoise(
          line,
          "en"
        )
      ) {

        allCandidates.push(
          line
        );

      }

    }

  }


  const deduped =
    deduplicateLines(
      allCandidates
    );


  const selected =
    selectBestOCRLines(
      deduped
    );


  const resolved =
    resolveCrossLanguageConflicts(
      selected
    );


  const sorted =
    sortOCRLines(
      resolved
    );


  const output = [];


  for (
    const line
    of sorted
  ) {

    const text =
      cleanText(
        line.text
      );


    if (!text)
      continue;


    if (
      looksLikeOCRNoise(
        text
      )
    ) {

      continue;

    }


    const normalized =
      normalizeForCompare(
        text
      );


    if (
      output.some(
        old =>
          normalizeForCompare(
            old.text
          ) ===
          normalized
      )
    ) {

      continue;

    }


    output.push(
      {
        text,
        language:
          line.language
      }
    );

  }


  return output
    .map(
      item =>
        item.text
    )
    .join(
      "\n"
    )
    .trim();

}


/* =========================================================
   OCR SCORE
========================================================= */

function scoreOCRText(
  text,
  candidateResults
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


  for (
    const result
    of candidateResults
  ) {

    const dataScores = [
      Number(
        result?.thaiData?.confidence ||
        0
      ),

      Number(
        result?.englishData?.confidence ||
        0
      )
    ];


    score +=
      Math.max(
        ...dataScores
      ) * 0.12;

  }


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
      thai * 1.2;


    score +=
      english * 1.2;


    if (
      digits >
      thai + english
    ) {

      score -=
        digits * 1.5;

    }


    if (
      looksLikeOCRNoise(
        line
      )
    ) {

      score -=
        20;

    }

  }


  score +=
    Math.min(
      15,
      lines.length * 2
    );


  return score;

}


/* =========================================================
   OCR ONE PASS
========================================================= */

async function runOCROnCanvas(
  thaiWorkerInstance,
  englishWorkerInstance,
  canvas,
  psm
) {

  const results =
    await Promise.all([
      recognizeOCR(
        thaiWorkerInstance,
        canvas,
        psm
      ),

      recognizeOCR(
        englishWorkerInstance,
        canvas,
        psm
      )
    ]);


  const thaiData =
    results[0] || {};


  const englishData =
    results[1] || {};


  return {
    thaiData,
    englishData
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

    const workers =
      await getOCRWorkers();


    const candidateResults = [];


    /*
      ==============================================
      PASS 1
      ภาพขนาดปกติ + PSM 6
      ==============================================
    */

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
        workers.thaiWorker,
        workers.englishWorker,
        canvas,
        6
      );


    candidateResults.push(
      pass1
    );


    /*
      ==============================================
      PASS 2
      ขยายภาพ + PSM 6
      ==============================================
    */

    showLoading(
      "กำลังตรวจข้อความในภาพเพิ่มเติม..."
    );


    const enlargedCanvas =
      await prepareOCRImage(
        file,
        fromCamera
          ? 1.5
          : 1.25
      );


    const pass2 =
      await runOCROnCanvas(
        workers.thaiWorker,
        workers.englishWorker,
        enlargedCanvas,
        6
      );


    candidateResults.push(
      pass2
    );


    /*
      ==============================================
      PASS 3
      PSM 11
      ==============================================
    */

    showLoading(
      "กำลังตรวจตำแหน่งข้อความ..."
    );


    const sparseCanvas =
      await prepareOCRImage(
        file,
        fromCamera
          ? 1.35
          : 1.15
      );


    const pass3 =
      await runOCROnCanvas(
        workers.thaiWorker,
        workers.englishWorker,
        sparseCanvas,
        11
      );


    candidateResults.push(
      pass3
    );


    /*
      ==============================================
      รวมผลระดับบรรทัด
      ==============================================
    */

    let finalText =
      buildFinalOCRTextFromCandidates(
        candidateResults
      );


    /*
      ==============================================
      PASS 4
      Contrast เฉพาะเมื่อผลยังน้อย
      ==============================================
    */

    if (
      !finalText ||
      finalText.length < 5
    ) {

      showLoading(
        "กำลังปรับภาพเพื่ออ่านข้อความ..."
      );


      const contrastBase =
        await prepareOCRImage(
          file,
          fromCamera
            ? 1.4
            : 1.2
        );


      const contrastCanvas =
        createEnhancedCanvas(
          contrastBase
        );


      const pass4 =
        await runOCROnCanvas(
          workers.thaiWorker,
          workers.englishWorker,
          contrastCanvas,
          6
        );


      candidateResults.push(
        pass4
      );


      finalText =
        buildFinalOCRTextFromCandidates(
          candidateResults
        );

    }


    /*
      ==============================================
      ทำความสะอาดขั้นสุดท้าย
      ==============================================
    */

    finalText =
      cleanFinalOCR(
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
   VERSION 36 END
========================================================= */
