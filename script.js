/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation
   VERSION 18
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
                "โหลดระบบ OCR ไม่สำเร็จ"
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
   CREATE WORKERS
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
   IMAGE FILE
   ใช้ไฟล์ต้นฉบับสำหรับ Preview
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


  /*
    สำคัญ:
    Preview ใช้ไฟล์จริง
    ไม่ผ่าน canvas
  */

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
          file
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
          file
        );

      }

    }
  );

}


/* =========================================================
   REMOVE IMAGE
========================================================= */

if (removeImageButton) {

  removeImageButton.addEventListener(
    "click",
    () => {

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
  );

}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadImage(file) {

  return new Promise(
    (resolve, reject) => {

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
   PREPARE OCR IMAGE
   ไม่ crop
   ไม่หมุน
   ไม่ยืด
   ใช้เฉพาะสำเนา OCR
========================================================= */

async function prepareOCRImage(
  file
) {

  const img =
    await loadImage(file);


  const width =
    img.naturalWidth ||
    img.width;


  const height =
    img.naturalHeight ||
    img.height;


  if (
    !width ||
    !height
  ) {

    throw new Error(
      "ไม่สามารถอ่านขนาดรูปภาพได้"
    );

  }


  const MAX_SIZE =
    2600;


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


  ctx.drawImage(
    img,
    0,
    0,
    canvas.width,
    canvas.height
  );


  return canvas;

}


/* =========================================================
   CREATE HIGH CONTRAST
   สำหรับตัวหนังสือสีเทาอ่อน
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
    เพิ่ม contrast
    โดยไม่ตัดรูป
  */

  const contrast =
    1.8;

  const intercept =
    128 -
    contrast * 128;


  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const gray =
      (
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114
      );


    let value =
      contrast *
        gray +
      intercept;


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
   CREATE THRESHOLD
   สำหรับไทยสีเทาอ่อนบนพื้นสว่าง
========================================================= */

function createThresholdCanvas(
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


  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const gray =
      (
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114
      );


    /*
      เกณฑ์ค่อนข้างสูง
      เพราะตัวหนังสือไทยในรูปตัวอย่าง
      เป็นสีเทาอ่อน
    */

    const value =
      gray < 215
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


  return canvas;

}


/* =========================================================
   RECOGNIZE
========================================================= */

async function recognize(
  worker,
  image,
  psm,
  language
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
      image
    );


  const data =
    result &&
    result.data
      ? result.data
      : {};


  const lines = [];


  if (
    Array.isArray(
      data.lines
    )
  ) {

    for (
      const line
      of data.lines
    ) {

      const text =
        String(
          line.text ||
          ""
        ).trim();


      if (!text) continue;


      const bbox =
        line.bbox ||
        {};


      lines.push({

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
            bbox.x0 ||
            0
          ),

        y:
          Number(
            bbox.y0 ||
            0
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

      });

    }

  }


  /*
    fallback
  */

  if (
    !lines.length &&
    data.text
  ) {

    const fallback =
      String(
        data.text
      )
        .split("\n")
        .map(
          x => x.trim()
        )
        .filter(Boolean);


    fallback.forEach(
      (text, index) => {

        lines.push({

          text,

          language,

          confidence:
            Number(
              data.confidence ||
              0
            ),

          x: 0,

          y:
            index * 50,

          width: 0,

          height: 0

        });

      }
    );

  }


  return lines;

}


/* =========================================================
   CLEAN OCR LINE
========================================================= */

function cleanOCRLine(
  text
) {

  if (!text) return "";


  let result =
    String(text)
      .replace(/\r/g, "")
      .replace(
        /[ \t]+/g,
        " "
      )
      .trim();


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
    ตัด noise
  */

  if (
    /^(unknown|unhmvn|unhmw|unknwn|unkn0wn|unknvn|unhnvn)$/i.test(
      compact
    )
  ) {

    return "";

  }


  if (
    /^(Ww|W|ww|ศศ|ศ)$/i.test(
      compact
    )
  ) {

    return "";

  }


  if (
    /^[\W_]+$/u.test(
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
   MERGE LINES
========================================================= */

function mergeOCRLines(
  lines
) {

  const cleaned =
    lines
      .map(item => ({

        ...item,

        text:
          cleanOCRLine(
            item.text
          )

      }))
      .filter(
        item =>
          item.text
      );


  const unique = [];


  for (
    const item
    of cleaned
  ) {

    const normalized =
      item.text
        .toLowerCase()
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    let duplicate =
      false;


    for (
      const old
      of unique
    ) {

      const oldNormalized =
        old.text
          .toLowerCase()
          .replace(
            /\s+/g,
            " "
          )
          .trim();


      if (
        normalized ===
        oldNormalized
      ) {

        if (
          item.confidence >
          old.confidence
        ) {

          old.confidence =
            item.confidence;

        }

        duplicate =
          true;

        break;

      }


      const a =
        normalized
          .split(" ")
          .filter(Boolean);


      const b =
        oldNormalized
          .split(" ")
          .filter(Boolean);


      if (
        a.length >= 3 &&
        b.length >= 3
      ) {

        let same =
          0;


        for (
          const word
          of a
        ) {

          if (
            b.includes(word)
          ) {

            same++;

          }

        }


        const overlap =
          same /
          Math.max(
            a.length,
            b.length
          );


        if (
          overlap >= 0.85
        ) {

          if (
            item.text.length >
            old.text.length
          ) {

            old.text =
              item.text;

          }

          duplicate =
            true;

          break;

        }

      }

    }


    if (!duplicate) {

      unique.push(
        item
      );

    }

  }


  /*
    เรียงตามตำแหน่งบนภาพ
  */

  unique.sort(
    (a, b) => {

      const yDiff =
        a.y - b.y;


      const heightA =
        a.height || 20;


      const heightB =
        b.height || 20;


      const rowTolerance =
        Math.max(
          12,
          Math.min(
            heightA,
            heightB
          )
        );


      if (
        Math.abs(yDiff) <=
        rowTolerance
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
   OCR
   3 รอบ:
   1. อังกฤษภาพปกติ
   2. ไทยภาพปกติ
   3. ไทยภาพเพิ่ม contrast/threshold
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


    const canvas =
      await prepareOCRImage(
        file
      );


    /*
      สร้างสำเนาสำหรับไทย
    */

    showLoading(
      "กำลังปรับภาพสำหรับอ่านข้อความไทย..."
    );


    const enhancedCanvas =
      createEnhancedCanvas(
        canvas
      );


    const thresholdCanvas =
      createThresholdCanvas(
        enhancedCanvas
      );


    /* -----------------------------------------
       รอบ 1: อังกฤษ
    ----------------------------------------- */

    showLoading(
      "กำลังอ่านภาษาอังกฤษ..."
    );


    const englishLines =
      await recognize(
        workers.english,
        canvas,
        6,
        "en"
      );


    /* -----------------------------------------
       รอบ 2: ไทย
       ใช้ภาพเพิ่ม contrast
    ----------------------------------------- */

    showLoading(
      "กำลังอ่านภาษาไทย..."
    );


    const thaiLines =
      await recognize(
        workers.thai,
        enhancedCanvas,
        6,
        "th"
      );


    /* -----------------------------------------
       รอบ 3: ไทย
       threshold
    ----------------------------------------- */

    showLoading(
      "กำลังตรวจตัวอักษรไทยให้ชัดขึ้น..."
    );


    const thaiThresholdLines =
      await recognize(
        workers.thai,
        thresholdCanvas,
        6,
        "th"
      );


    /*
      รวมผล
    */

    const allLines = [

      ...englishLines,

      ...thaiLines,

      ...thaiThresholdLines

    ];


    const finalText =
      mergeOCRLines(
        allLines
      );


    if (!finalText) {

      throw new Error(
        "ไม่พบข้อความในรูป"
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


    if (hasThai) {

      showStatus(
        "สแกนข้อความไทยและอังกฤษเรียบร้อยแล้ว",
        "success"
      );

    } else {

      showStatus(
        "สแกนแล้ว แต่ยังไม่พบตัวอักษรไทย",
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
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองใช้รูปที่คมชัดขึ้นค่ะ",
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


      if (!text) return;


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


      hideStatus();

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
