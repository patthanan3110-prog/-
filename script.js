/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js

   OCR:
   Tesseract.js
   GENERAL OCR + WIDE CROP VERSION
========================================= */


/* =========================================
   CONFIG
========================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyv4x3GhyXGKGQvWfmh-lKForJ_OV7BVtoglDGsGjtNYID8cf1Lwkog3rk3ROLJJsng/exec";

let sourceLanguage = "th";
let targetLanguage = "en";

let tesseractReady = false;
let tesseractLoadingPromise = null;
let tesseractWorker = null;


/* =========================================
   LOAD TESSERACT.JS
========================================= */

function loadTesseract() {

  if (window.Tesseract) {
    return Promise.resolve();
  }

  if (tesseractLoadingPromise) {
    return tesseractLoadingPromise;
  }

  tesseractLoadingPromise =
    new Promise(function (resolve, reject) {

      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

      script.onload =
        function () {

          if (window.Tesseract) {
            resolve();
          } else {
            reject(
              new Error(
                "โหลด Tesseract.js ไม่สำเร็จ"
              )
            );
          }

        };

      script.onerror =
        function () {

          reject(
            new Error(
              "ไม่สามารถโหลดระบบ OCR ได้"
            )
          );

        };

      document.head.appendChild(script);

    });

  return tesseractLoadingPromise;

}


/* =========================================
   CREATE TESSERACT WORKER
========================================= */

async function getTesseractWorker() {

  if (tesseractWorker) {
    return tesseractWorker;
  }

  await loadTesseract();

  tesseractWorker =
    await Tesseract.createWorker(
      "tha+eng",
      1,
      {
        logger:
          function (message) {

            console.log(
              "Tesseract:",
              message
            );

            if (
              message.status ===
              "recognizing text"
            ) {

              const progress =
                Math.round(
                  (message.progress || 0) * 100
                );

              ocrText.value =
                "กำลังอ่านข้อความ... " +
                progress +
                "%";

            }

          }
      }
    );

  try {

    await tesseractWorker.setParameters({

      preserve_interword_spaces:
        "1",

      user_defined_dpi:
        "300"

    });

  } catch (error) {

    console.warn(
      "ตั้งค่า OCR ไม่สำเร็จ:",
      error
    );

  }

  tesseractReady = true;

  return tesseractWorker;

}


/* =========================================
   ELEMENTS
========================================= */

const inputText =
  document.getElementById("inputText");

const resultText =
  document.getElementById("resultText");

const ocrText =
  document.getElementById("ocrText");

const ocrCard =
  document.getElementById("ocrCard");

const loadingBox =
  document.getElementById("loadingBox");

const loadingText =
  document.getElementById("loadingText");

const statusMessage =
  document.getElementById("statusMessage");

const cameraInput =
  document.getElementById("cameraInput");

const galleryInput =
  document.getElementById("galleryInput");

const imagePreviewContainer =
  document.getElementById("imagePreviewContainer");

const imagePreview =
  document.getElementById("imagePreview");

const sourceLanguageText =
  document.getElementById("sourceLanguageText");

const targetLanguageText =
  document.getElementById("targetLanguageText");

const translateButton =
  document.getElementById("translateButton");

const swapLanguageButton =
  document.getElementById("swapLanguageButton");

const cameraButton =
  document.getElementById("cameraButton");

const galleryButton =
  document.getElementById("galleryButton");

const clearInputButton =
  document.getElementById("clearInputButton");

const removeImageButton =
  document.getElementById("removeImageButton");

const copyResultButton =
  document.getElementById("copyResultButton");

const speakResultButton =
  document.getElementById("speakResultButton");

const speakOcrButton =
  document.getElementById("speakOcrButton");

const useOcrButton =
  document.getElementById("useOcrButton");


/* =========================================
   LANGUAGE UI
========================================= */

function updateLanguageUI() {

  sourceLanguageText.textContent =
    sourceLanguage === "th"
      ? "ภาษาไทย"
      : "English";

  targetLanguageText.textContent =
    targetLanguage === "th"
      ? "ภาษาไทย"
      : "English";

  updatePlaceholder();

}


/* =========================================
   PLACEHOLDER
========================================= */

function updatePlaceholder() {

  inputText.placeholder =
    sourceLanguage === "th"
      ? "พิมพ์ข้อความภาษาไทยที่ต้องการแปล..."
      : "Type English text to translate...";

}


/* =========================================
   SWAP LANGUAGE
========================================= */

swapLanguageButton.addEventListener(
  "click",
  function () {

    const oldSource =
      sourceLanguage;

    sourceLanguage =
      targetLanguage;

    targetLanguage =
      oldSource;

    updateLanguageUI();

    const currentInput =
      inputText.value.trim();

    const currentResult =
      resultText.classList.contains("empty")
        ? ""
        : resultText.textContent.trim();

    if (
      currentInput &&
      currentResult
    ) {

      inputText.value =
        currentResult;

      resultText.textContent =
        currentInput;

      resultText.classList.remove(
        "empty"
      );

    }

    showStatus(
      "สลับภาษาเรียบร้อย",
      "success"
    );

  }
);


/* =========================================
   CAMERA
========================================= */

cameraButton.addEventListener(
  "click",
  function () {

    cameraInput.click();

  }
);


/* =========================================
   GALLERY
========================================= */

galleryButton.addEventListener(
  "click",
  function () {

    galleryInput.click();

  }
);


/* =========================================
   CAMERA IMAGE
========================================= */

cameraInput.addEventListener(
  "change",
  function (event) {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    handleSelectedImage(file);

  }
);


/* =========================================
   GALLERY IMAGE
========================================= */

galleryInput.addEventListener(
  "change",
  function (event) {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    handleSelectedImage(file);

  }
);


/* =========================================
   HANDLE IMAGE
========================================= */

function handleSelectedImage(file) {

  if (
    !file.type.startsWith("image/")
  ) {

    showStatus(
      "กรุณาเลือกไฟล์รูปภาพ",
      "error"
    );

    return;

  }

  const reader =
    new FileReader();

  reader.onload =
    function (event) {

      imagePreview.src =
        event.target.result;

      imagePreviewContainer.hidden =
        false;

      ocrCard.hidden =
        false;

      ocrText.value =
        "กำลังเตรียมระบบอ่านข้อความ...";

      showStatus(
        "กำลังอ่านข้อความจากรูป...",
        "success"
      );

      runOCR(file);

    };

  reader.onerror =
    function () {

      showStatus(
        "ไม่สามารถอ่านรูปภาพได้",
        "error"
      );

    };

  reader.readAsDataURL(file);

}


/* =========================================
   REMOVE IMAGE
========================================= */

removeImageButton.addEventListener(
  "click",
  function () {

    imagePreview.src =
      "";

    imagePreviewContainer.hidden =
      true;

    cameraInput.value =
      "";

    galleryInput.value =
      "";

    ocrCard.hidden =
      true;

    ocrText.value =
      "";

  }
);


/* =========================================
   LOAD IMAGE
========================================= */

function loadImageFromFile(file) {

  return new Promise(
    function (resolve, reject) {

      const reader =
        new FileReader();

      reader.onload =
        function (event) {

          const img =
            new Image();

          img.onload =
            function () {

              resolve(img);

            };

          img.onerror =
            function () {

              reject(
                new Error(
                  "ไม่สามารถโหลดรูปภาพได้"
                )
              );

            };

          img.src =
            event.target.result;

        };

      reader.onerror =
        function () {

          reject(
            new Error(
              "ไม่สามารถอ่านรูปภาพได้"
            )
          );

        };

      reader.readAsDataURL(file);

    }
  );

}


/* =========================================
   DRAW IMAGE TO CANVAS
========================================= */

function drawImageToCanvas(
  img,
  options = {}
) {

  const cropX =
    options.cropX || 0;

  const cropY =
    options.cropY || 0;

  const cropWidth =
    options.cropWidth ||
    img.naturalWidth;

  const cropHeight =
    options.cropHeight ||
    img.naturalHeight;

  const targetWidth =
    options.targetWidth ||
    3000;

  const scale =
    targetWidth / cropWidth;

  const targetHeight =
    Math.round(
      cropHeight * scale
    );


  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    targetWidth;

  canvas.height =
    targetHeight;


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


  ctx.fillStyle =
    "#ffffff";

  ctx.fillRect(
    0,
    0,
    targetWidth,
    targetHeight
  );


  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );


  return canvas;

}


/* =========================================
   PREPARE OCR IMAGE
========================================= */

async function prepareOCRImage(
  file,
  mode = "normal"
) {

  const img =
    await loadImageFromFile(
      file
    );


  const originalWidth =
    img.naturalWidth;

  const originalHeight =
    img.naturalHeight;


  /* =====================================
     ORIGINAL
  ===================================== */

  if (
    mode === "original"
  ) {

    const canvas =
      drawImageToCanvas(
        img,
        {
          cropX:
            0,

          cropY:
            0,

          cropWidth:
            originalWidth,

          cropHeight:
            originalHeight,

          targetWidth:
            Math.min(
              3600,
              Math.max(
                2400,
                originalWidth
              )
            )
        }
      );


    return canvas.toDataURL(
      "image/png"
    );

  }


  /* =====================================
     WIDE FOCUS CROP
  ===================================== */

  if (
    mode === "focus"
  ) {

    let cropX =
      Math.round(
        originalWidth * 0.03
      );

    let cropY =
      Math.round(
        originalHeight * 0.08
      );

    let cropWidth =
      Math.round(
        originalWidth * 0.94
      );

    let cropHeight =
      Math.round(
        originalHeight * 0.87
      );


    cropX =
      Math.max(
        0,
        cropX
      );

    cropY =
      Math.max(
        0,
        cropY
      );


    cropWidth =
      Math.min(
        cropWidth,
        originalWidth - cropX
      );

    cropHeight =
      Math.min(
        cropHeight,
        originalHeight - cropY
      );


    const canvas =
      drawImageToCanvas(
        img,
        {
          cropX:
            cropX,

          cropY:
            cropY,

          cropWidth:
            cropWidth,

          cropHeight:
            cropHeight,

          targetWidth:
            3600
        }
      );


    return canvas.toDataURL(
      "image/png"
    );

  }


  /* =====================================
     LOWER CROP
  ===================================== */

  if (
    mode === "lower"
  ) {

    const cropX =
      Math.round(
        originalWidth * 0.03
      );

    const cropY =
      Math.round(
        originalHeight * 0.25
      );

    const cropWidth =
      Math.round(
        originalWidth * 0.94
      );

    const cropHeight =
      Math.round(
        originalHeight * 0.70
      );


    const canvas =
      drawImageToCanvas(
        img,
        {
          cropX:
            cropX,

          cropY:
            cropY,

          cropWidth:
            cropWidth,

          cropHeight:
            cropHeight,

          targetWidth:
            3600
        }
      );


    return canvas.toDataURL(
      "image/png"
    );

  }


  /* =====================================
     CENTER CROP
  ===================================== */

  if (
    mode === "center"
  ) {

    const cropX =
      Math.round(
        originalWidth * 0.05
      );

    const cropY =
      Math.round(
        originalHeight * 0.10
      );

    const cropWidth =
      Math.round(
        originalWidth * 0.90
      );

    const cropHeight =
      Math.round(
        originalHeight * 0.75
      );


    const canvas =
      drawImageToCanvas(
        img,
        {
          cropX:
            cropX,

          cropY:
            cropY,

          cropWidth:
            cropWidth,

          cropHeight:
            cropHeight,

          targetWidth:
            3600
        }
      );


    return canvas.toDataURL(
      "image/png"
    );

  }


  /* =====================================
     NORMAL / THRESHOLD / SHARP
========================================= */

  const canvas =
    drawImageToCanvas(
      img,
      {
        cropX:
          0,

        cropY:
          0,

        cropWidth:
          originalWidth,

        cropHeight:
          originalHeight,

        targetWidth:
          3200
      }
    );


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );


  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );


  const pixels =
    imageData.data;


  /* =====================================
     NORMAL
  ===================================== */

  if (
    mode === "normal"
  ) {

    const contrast =
      1.18;

    const factor =
      (259 *
        (contrast + 255)) /
      (255 *
        (259 - contrast));


    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {

      const r =
        pixels[i];

      const g =
        pixels[i + 1];

      const b =
        pixels[i + 2];


      let gray =
        (0.299 * r) +
        (0.587 * g) +
        (0.114 * b);


      gray =
        factor *
        (gray - 128) +
        128;


      gray =
        Math.max(
          0,
          Math.min(
            255,
            gray
          )
        );


      pixels[i] =
        gray;

      pixels[i + 1] =
        gray;

      pixels[i + 2] =
        gray;

    }

  }


  /* =====================================
     THRESHOLD
  ===================================== */

  if (
    mode === "threshold"
  ) {

    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {

      const r =
        pixels[i];

      const g =
        pixels[i + 1];

      const b =
        pixels[i + 2];


      const gray =
        (0.299 * r) +
        (0.587 * g) +
        (0.114 * b);


      const value =
        gray < 175
          ? 0
          : 255;


      pixels[i] =
        value;

      pixels[i + 1] =
        value;

      pixels[i + 2] =
        value;

    }

  }


  /* =====================================
     SHARP
  ===================================== */

  if (
    mode === "sharp"
  ) {

    const contrast =
      1.32;

    const factor =
      (259 *
        (contrast + 255)) /
      (255 *
        (259 - contrast));


    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {

      const r =
        pixels[i];

      const g =
        pixels[i + 1];

      const b =
        pixels[i + 2];


      let gray =
        (0.299 * r) +
        (0.587 * g) +
        (0.114 * b);


      gray =
        factor *
        (gray - 128) +
        128;


      gray =
        Math.max(
          0,
          Math.min(
            255,
            gray
          )
        );


      pixels[i] =
        gray;

      pixels[i + 1] =
        gray;

      pixels[i + 2] =
        gray;

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


/* =========================================
   OCR ONE PASS
========================================= */

async function recognizeOCR(
  worker,
  imageData,
  modeName,
  pageMode
) {

  console.log(
    "เริ่ม OCR:",
    modeName,
    "PSM:",
    pageMode
  );


  await worker.setParameters({

    tessedit_pageseg_mode:
      String(pageMode),

    preserve_interword_spaces:
      "1",

    user_defined_dpi:
      "300"

  });


  const result =
    await worker.recognize(
      imageData
    );


  const text =
    String(
      result &&
      result.data &&
      result.data.text
        ? result.data.text
        : ""
    ).trim();


  const confidence =
    Number(
      result &&
      result.data &&
      result.data.confidence
        ? result.data.confidence
        : 0
    );


  console.log(
    "OCR RESULT:",
    modeName,
    {
      confidence:
        confidence,

      text:
        text
    }
  );


  return {

    text:
      text,

    confidence:
      confidence,

    mode:
      modeName

  };

}


/* =========================================
   SCORE OCR
   ปรับใหม่:
   ให้จำนวนบรรทัดและจำนวนตัวอักษร
   สำคัญกว่า confidence
========================================= */

function scoreOCRResult(
  result
) {

  if (
    !result ||
    !result.text
  ) {

    return -999;

  }


  const text =
    String(
      result.text
    ).trim();


  if (!text) {

    return -999;

  }


  /* =====================================
     นับตัวอักษรที่ใช้ได้
  ===================================== */

  const useful =
    text.match(
      /[ก-๙a-zA-Z0-9]/g
    );


  const usefulCount =
    useful
      ? useful.length
      : 0;


  if (
    usefulCount === 0
  ) {

    return -999;

  }


  /* =====================================
     นับบรรทัด
  ===================================== */

  const lines =
    text
      .split(/\n+/)
      .map(
        function(line) {

          return line.trim();

        }
      )
      .filter(
        function(line) {

          return /[ก-๙a-zA-Z0-9]/.test(
            line
          );

        }
      );


  const lineCount =
    lines.length;


  /* =====================================
     ภาษาไทย
  ===================================== */

  const thai =
    text.match(
      /[ก-๙]/g
    );


  const thaiCount =
    thai
      ? thai.length
      : 0;


  /* =====================================
     ภาษาอังกฤษ
  ===================================== */

  const english =
    text.match(
      /[a-zA-Z]/g
    );


  const englishCount =
    english
      ? english.length
      : 0;


  /* =====================================
     CONFIDENCE
  ===================================== */

  const confidence =
    Number(
      result.confidence
    ) || 0;


  /* =====================================
     SCORE

     สำคัญ:
     จำนวนบรรทัด > จำนวนตัวอักษร
     > confidence

     เพื่อป้องกันกรณี
     OCR อ่านได้ 3 บรรทัด
     แต่ confidence สูงกว่า
     ผลที่อ่านได้ครบ 4 บรรทัด
  ===================================== */

  let score = 0;


  /* จำนวนบรรทัด */

  score +=
    lineCount * 18;


  /* จำนวนตัวอักษร */

  score +=
    Math.min(
      usefulCount,
      100
    ) * 0.8;


  /* confidence เป็นคะแนนเสริม */

  score +=
    confidence * 0.15;


  /* =====================================
     ภาษาไทย
  ===================================== */

  if (
    thaiCount >= 5
  ) {

    score += 5;

  }


  if (
    thaiCount >= 15
  ) {

    score += 8;

  }


  /* =====================================
     ภาษาอังกฤษ
  ===================================== */

  if (
    englishCount >= 5
  ) {

    score += 4;

  }


  /* =====================================
     GARBAGE LINES
  ===================================== */

  let garbageLines =
    0;


  lines.forEach(
    function(line) {

      const usefulLine =
        line.match(
          /[ก-๙a-zA-Z0-9]/g
        );


      const count =
        usefulLine
          ? usefulLine.length
          : 0;


      if (
        count <= 1
      ) {

        garbageLines++;

      }

    }
  );


  score -=
    garbageLines * 5;


  /* =====================================
     LONG ENGLISH
  ===================================== */

  const longEnglish =
    text.match(
      /\b[a-zA-Z]{13,}\b/g
    );


  if (
    longEnglish
  ) {

    score -=
      longEnglish.length * 4;

  }


  /* =====================================
     STRANGE CHARACTERS
  ===================================== */

  const strange =
    text.match(
      /[^ก-๙a-zA-Z0-9\s.,!?()\-:/'%&+]/g
    );


  if (
    strange
  ) {

    score -=
      Math.min(
        15,
        strange.length * 0.5
      );

  }


  console.log(
    "OCR DETAIL SCORE:",
    result.mode,
    {
      lines:
        lineCount,

      useful:
        usefulCount,

      thai:
        thaiCount,

      english:
        englishCount,

      confidence:
        confidence,

      score:
        score
    }
  );


  return score;

}


/* =========================================
   CLEAN OCR
   GENERAL PURPOSE
========================================= */

function cleanOCRText(text) {

  if (!text) {
    return "";
  }


  let cleaned =
    String(text);


  /* =====================================
     NORMALIZE
  ===================================== */

  cleaned =
    cleaned.replace(
      /\r\n/g,
      "\n"
    );


  cleaned =
    cleaned.replace(
      /\r/g,
      "\n"
    );


  cleaned =
    cleaned.replace(
      /[ \t]+/g,
      " "
    );


  /* =====================================
     REMOVE SYMBOL-ONLY LINES
  ===================================== */

  cleaned =
    cleaned.replace(
      /^[*|_~`.,;:!?+\-=\/\\]+$/gm,
      ""
    );


  /* =====================================
     COMMON THAI OCR CORRECTIONS
  ===================================== */

  const corrections = [

    {
      pattern:
        /ช่วขลด/g,
      replacement:
        "ช่วยลด"
    },

    {
      pattern:
        /ชว่ยลด/g,
      replacement:
        "ช่วยลด"
    },

    {
      pattern:
        /ชว่ขลด/g,
      replacement:
        "ช่วยลด"
    },

    {
      pattern:
        /ช่วลด/g,
      replacement:
        "ช่วยลด"
    },

    {
      pattern:
        /ธีไซเคิลไล้/g,
      replacement:
        "รีไซเคิลได้"
    },

    {
      pattern:
        /ธีไซเคิลได้/g,
      replacement:
        "รีไซเคิลได้"
    },

    {
      pattern:
        /รีไซเคิลไล้/g,
      replacement:
        "รีไซเคิลได้"
    },

    {
      pattern:
        /รีไซเคิลไล/g,
      replacement:
        "รีไซเคิลได้"
    },

    {
      pattern:
        /รีไซเคิลไต้/g,
      replacement:
        "รีไซเคิลได้"
    },

    {
      pattern:
        /ผลาสติก/g,
      replacement:
        "พลาสติก"
    },

    {
      pattern:
        /พลาสตก/g,
      replacement:
        "พลาสติก"
    },

    {
      pattern:
        /พลาสตค/g,
      replacement:
        "พลาสติก"
    },

    {
      pattern:
        /โปรดริบประทาน/g,
      replacement:
        "โปรดรับประทาน"
    },

    {
      pattern:
        /โปรดรบประทาน/g,
      replacement:
        "โปรดรับประทาน"
    },

    /* แก้ OCR: ทัง → ทั้ง */

    {
      pattern:
        /ทัง/g,
      replacement:
        "ทั้ง"
    }

  ];


  corrections.forEach(
    function(item) {

      cleaned =
        cleaned.replace(
          item.pattern,
          item.replacement
        );

    }
  );


  /* =====================================
     REMOVE COMMON OCR GARBAGE
  ===================================== */

  cleaned =
    cleaned.replace(
      /^\s*Ww\s*$/gim,
      ""
    );


  cleaned =
    cleaned.replace(
      /^\s*W\s*$/gim,
      ""
    );


  cleaned =
    cleaned.replace(
      /^\s*ww\s*$/gim,
      ""
    );


  cleaned =
    cleaned.replace(
      /^\s*ศศ\s*$/gim,
      ""
    );


  cleaned =
    cleaned.replace(
      /^\s*ศ\s*$/gim,
      ""
    );


  /* =====================================
     ENGLISH OCR REPAIR
  ===================================== */

  cleaned =
    cleaned.replace(
      /Recommend\s*\n\s*ed/gi,
      "Recommended"
    );


  cleaned =
    cleaned.replace(
      /Recommend\s+ed/gi,
      "Recommended"
    );


  cleaned =
    cleaned.replace(
      /Recommended\s*\n\s*for/gi,
      "Recommended for"
    );


  cleaned =
    cleaned.replace(
      /Recommend\s*\n\s*for/gi,
      "Recommended for"
    );


  cleaned =
    cleaned.replace(
      /ed\s+for\s+immediate\s+consumption/gi,
      "Recommended for immediate consumption"
    );


  cleaned =
    cleaned.replace(
      /ed\s*\n\s*for\s+immediate\s+consumption/gi,
      "Recommended for immediate consumption"
    );


  /* =====================================
     SPLIT LINES
  ===================================== */

  let lines =
    cleaned
      .split("\n")
      .map(
        function(line) {

          return line.trim();

        }
      )
      .filter(
        function(line) {

          return line.length > 0;

        }
      );


  /* =====================================
     REMOVE GARBAGE LINES
  ===================================== */

  lines =
    lines.filter(
      function(line) {

        if (!line) {
          return false;
        }


        if (
          /^Ww$/i.test(line) ||
          /^W$/i.test(line) ||
          /^ww$/i.test(line) ||
          /^ศศ$/.test(line) ||
          /^ศ$/.test(line)
        ) {

          return false;

        }


        const useful =
          line.match(
            /[ก-๙a-zA-Z0-9]/g
          );


        const count =
          useful
            ? useful.length
            : 0;


        if (
          count === 0
        ) {

          return false;

        }


        return true;

      }
    );


  /* =====================================
     CORRECT EACH LINE AGAIN
  ===================================== */

  lines =
    lines.map(
      function(line) {

        line =
          line.replace(
            /ช่วขลด/g,
            "ช่วยลด"
          );


        line =
          line.replace(
            /ชว่ยลด/g,
            "ช่วยลด"
          );


        line =
          line.replace(
            /ชว่ขลด/g,
            "ช่วยลด"
          );


        line =
          line.replace(
            /ธีไซเคิลไล้/g,
            "รีไซเคิลได้"
          );


        line =
          line.replace(
            /ธีไซเคิลได้/g,
            "รีไซเคิลได้"
          );


        line =
          line.replace(
            /รีไซเคิลไล้/g,
            "รีไซเคิลได้"
          );


        line =
          line.replace(
            /ผลาสติก/g,
            "พลาสติก"
          );


        line =
          line.replace(
            /โปรดริบประทาน/g,
            "โปรดรับประทาน"
          );


        line =
          line.replace(
            /โปรดรบประทาน/g,
            "โปรดรับประทาน"
          );


        /* แก้ OCR: ทัง → ทั้ง */

        line =
          line.replace(
            /ทัง/g,
            "ทั้ง"
          );


        return line.trim();

      }
    );


  /* =====================================
     MERGE BROKEN ENGLISH
  ===================================== */

  const mergedLines = [];


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const current =
      lines[i];

    const next =
      lines[i + 1] || "";


    if (
      /^Recommend$/i.test(current) &&
      /^ed\b/i.test(next)
    ) {

      mergedLines.push(
        "Recommended" +
        next.substring(2)
      );

      i++;

      continue;

    }


    if (
      /^ed$/i.test(current) &&
      /^for\s+/i.test(next)
    ) {

      mergedLines.push(
        "Recommended " +
        next
      );

      i++;

      continue;

    }


    if (
      /^Recommended$/i.test(current) &&
      /^for\s+/i.test(next)
    ) {

      mergedLines.push(
        current +
        " " +
        next
      );

      i++;

      continue;

    }


    mergedLines.push(
      current
    );

  }


  lines =
    mergedLines;


  /* =====================================
     FINAL CLEANUP
  ===================================== */

  cleaned =
    lines.join(
      "\n"
    );


  cleaned =
    cleaned.replace(
      /\s+([.,!?;:)])/g,
      "$1"
    );


  cleaned =
    cleaned.replace(
      /([(])\s+/g,
      "$1"
    );


  cleaned =
    cleaned.replace(
      /[ \t]+/g,
      " "
    );


  cleaned =
    cleaned.replace(
      /\n{3,}/g,
      "\n\n"
    );


  return cleaned.trim();

}


/* =========================================
   SELECT BEST OCR
========================================= */

function selectBestOCRResult(
  results
) {

  let best =
    null;

  let bestScore =
    -999;


  results.forEach(
    function(result) {

      if (
        !result ||
        !result.text
      ) {

        return;

      }


      const score =
        scoreOCRResult(
          result
        );


      console.log(
        "OCR SCORE:",
        result.mode,
        score
      );


      if (
        score >
        bestScore
      ) {

        best =
          result;

        bestScore =
          score;

      }

    }
  );


  console.log(
    "OCR BEST:",
    best
      ? best.mode
      : "none",

    bestScore
  );


  return (
    best || {

      text:
        "",

      confidence:
        0,

      mode:
        ""

    }
  );

}


/* =========================================
   TESSERACT OCR
========================================= */

async function runOCR(
  file
) {

  ocrCard.hidden =
    false;


  ocrText.value =
    "กำลังเตรียมระบบ OCR...";


  try {

    const worker =
      await getTesseractWorker();


    const results = [];


    /* =====================================
       PASS 1
       WIDE FOCUS + PSM 6
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความจากภาพ...";


    showStatus(
      "กำลังอ่านข้อความ...",
      "success"
    );


    const focusImage =
      await prepareOCRImage(
        file,
        "focus"
      );


    const focusResult =
      await recognizeOCR(
        worker,
        focusImage,
        "wide-focus",
        6
      );


    results.push(
      focusResult
    );


    /* =====================================
       PASS 2
       WIDE FOCUS + PSM 11
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความแบบละเอียด...";


    const focusSparseResult =
      await recognizeOCR(
        worker,
        focusImage,
        "wide-focus-sparse",
        11
      );


    results.push(
      focusSparseResult
    );


    /* =====================================
       PASS 3
       LOWER + PSM 6
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความส่วนล่าง...";


    const lowerImage =
      await prepareOCRImage(
        file,
        "lower"
      );


    const lowerResult =
      await recognizeOCR(
        worker,
        lowerImage,
        "lower",
        6
      );


    results.push(
      lowerResult
    );


    /* =====================================
       PASS 4
       LOWER + PSM 11
    ===================================== */

    const lowerSparseResult =
      await recognizeOCR(
        worker,
        lowerImage,
        "lower-sparse",
        11
      );


    results.push(
      lowerSparseResult
    );


    /* =====================================
       PASS 5
       CENTER + PSM 6
    ===================================== */

    ocrText.value =
      "กำลังตรวจสอบข้อความอีกครั้ง...";


    const centerImage =
      await prepareOCRImage(
        file,
        "center"
      );


    const centerResult =
      await recognizeOCR(
        worker,
        centerImage,
        "center",
        6
      );


    results.push(
      centerResult
    );


    /* =====================================
       PASS 6
       FULL IMAGE + PSM 6
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความจากภาพทั้งหมด...";


    const originalImage =
      await prepareOCRImage(
        file,
        "original"
      );


    const originalDenseResult =
      await recognizeOCR(
        worker,
        originalImage,
        "original-dense",
        6
      );


    results.push(
      originalDenseResult
    );


    /* =====================================
       PASS 7
       FULL IMAGE + PSM 11
    ===================================== */

    ocrText.value =
      "กำลังตรวจสอบภาพทั้งหมด...";


    const originalSparseResult =
      await recognizeOCR(
        worker,
        originalImage,
        "original-sparse",
        11
      );


    results.push(
      originalSparseResult
    );


    /* =====================================
       SELECT BEST
    ===================================== */

    const bestResult =
      selectBestOCRResult(
        results
      );


    if (
      !bestResult.text
    ) {

      ocrText.value =
        "ไม่พบข้อความในรูปภาพ";


      showStatus(
        "ไม่พบข้อความในรูปภาพ",
        "error"
      );


      return;

    }


    /* =====================================
       CLEAN + CORRECT OCR
    ===================================== */

    const cleanedText =
      cleanOCRText(
        bestResult.text
      );


    ocrText.value =
      cleanedText;


    console.log(
      "================================="
    );

    console.log(
      "OCR FINAL:"
    );

    console.log(
      "MODE:",
      bestResult.mode
    );

    console.log(
      "CONFIDENCE:",
      bestResult.confidence
    );

    console.log(
      cleanedText
    );

    console.log(
      "================================="
    );


    showStatus(
      "สแกนข้อความเรียบร้อย ✓",
      "success"
    );


  } catch (error) {

    console.error(
      "Tesseract OCR Error:",
      error
    );


    ocrText.value =
      "ไม่สามารถสแกนข้อความจากรูปได้";


    showStatus(
      "เกิดข้อผิดพลาดในการสแกนข้อความ: " +
      error.message,
      "error"
    );

  }

}


/* =========================================
   USE OCR
========================================= */

useOcrButton.addEventListener(
  "click",
  function() {

    const text =
      ocrText.value.trim();


    if (
      !text ||
      text.includes(
        "ไม่สามารถสแกน"
      ) ||
      text.includes(
        "ไม่พบข้อความ"
      ) ||
      text.includes(
        "กำลัง"
      )
    ) {

      showStatus(
        "ยังไม่มีข้อความที่พร้อมใช้งาน",
        "error"
      );


      return;

    }


    inputText.value =
      text;


    ocrCard.hidden =
      true;


    showStatus(
      "นำข้อความมาใส่ในช่องแปลแล้ว ✓",
      "success"
    );


    inputText.focus();

  }
);


/* =========================================
   CLEAR INPUT
========================================= */

clearInputButton.addEventListener(
  "click",
  function() {

    inputText.value =
      "";


    resultText.textContent =
      "คำแปลจะแสดงที่นี่";


    resultText.classList.add(
      "empty"
    );


    showStatus(
      "ล้างข้อความแล้ว",
      "success"
    );


    inputText.focus();

  }
);


/* =========================================
   TRANSLATE
========================================= */

translateButton.addEventListener(
  "click",
  function() {

    translateText();

  }
);


/* =========================================
   TRANSLATE FUNCTION
========================================= */

async function translateText() {

  const text =
    inputText.value.trim();


  if (!text) {

    showStatus(
      "กรุณาพิมพ์ข้อความที่ต้องการแปล",
      "error"
    );


    inputText.focus();


    return;

  }


  if (!API_URL) {

    resultText.textContent =
      "ระบบแปลภาษากำลังเตรียมเชื่อมต่อ...";


    resultText.classList.remove(
      "empty"
    );


    showStatus(
      "ยังไม่ได้เชื่อมต่อระบบแปลภาษา",
      "error"
    );


    return;

  }


  setLoading(
    true,
    "กำลังแปลภาษา..."
  );


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
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "ไม่สามารถแปลภาษาได้"
      );

    }


    resultText.textContent =
      data.translation || "";


    resultText.classList.remove(
      "empty"
    );


    showStatus(
      "แปลภาษาเรียบร้อย ✓",
      "success"
    );


  } catch (error) {

    console.error(
      "Translation Error:",
      error
    );


    resultText.textContent =
      "ไม่สามารถแปลภาษาได้ในขณะนี้";


    resultText.classList.remove(
      "empty"
    );


    showStatus(
      "เกิดข้อผิดพลาดในการแปลภาษา",
      "error"
    );


  } finally {

    setLoading(false);

  }

}


/* =========================================
   SPEAK RESULT
========================================= */

speakResultButton.addEventListener(
  "click",
  function() {

    const text =
      resultText.classList.contains("empty")
        ? ""
        : resultText.textContent.trim();


    if (!text) {

      showStatus(
        "ยังไม่มีข้อความให้ฟัง",
        "error"
      );


      return;

    }


    speakText(
      text,
      targetLanguage
    );

  }
);


/* =========================================
   SPEAK OCR
========================================= */

speakOcrButton.addEventListener(
  "click",
  function() {

    const text =
      ocrText.value.trim();


    if (!text) {

      showStatus(
        "ยังไม่มีข้อความให้ฟัง",
        "error"
      );


      return;

    }


    speakText(
      text,
      sourceLanguage
    );

  }
);


/* =========================================
   TEXT TO SPEECH
========================================= */

function speakText(
  text,
  language
) {

  if (
    !("speechSynthesis" in window)
  ) {

    showStatus(
      "เบราว์เซอร์นี้ไม่รองรับการออกเสียง",
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


  utterance.volume =
    1;


  utterance.onstart =
    function() {

      showStatus(
        "กำลังออกเสียง...",
        "success"
      );

    };


  utterance.onend =
    function() {

      hideStatus();

    };


  utterance.onerror =
    function() {

      showStatus(
        "ไม่สามารถเล่นเสียงได้",
        "error"
      );

    };


  window.speechSynthesis.speak(
    utterance
  );

}


/* =========================================
   COPY RESULT
========================================= */

copyResultButton.addEventListener(
  "click",
  async function() {

    const text =
      resultText.classList.contains("empty")
        ? ""
        : resultText.textContent.trim();


    if (!text) {

      showStatus(
        "ยังไม่มีคำแปลให้คัดลอก",
        "error"
      );


      return;

    }


    try {

      await navigator.clipboard.writeText(
        text
      );


      showStatus(
        "คัดลอกคำแปลแล้ว ✓",
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
        "คัดลอกคำแปลแล้ว ✓",
        "success"
      );

    }

  }
);


/* =========================================
   LOADING
========================================= */

function setLoading(
  loading,
  message = "กำลังดำเนินการ..."
) {

  loadingBox.hidden =
    !loading;


  translateButton.disabled =
    loading;


  if (loading) {

    loadingText.textContent =
      message;

  }

}


/* =========================================
   STATUS
========================================= */

function showStatus(
  message,
  type = ""
) {

  statusMessage.textContent =
    message;


  statusMessage.className =
    "status-message";


  if (type) {

    statusMessage.classList.add(
      type
    );

  }


  statusMessage.hidden =
    false;


  clearTimeout(
    window.statusTimer
  );


  window.statusTimer =
    setTimeout(
      function() {

        hideStatus();

      },
      5000
    );

}


function hideStatus() {

  statusMessage.hidden =
    true;

}


/* =========================================
   KEYBOARD SHORTCUT
========================================= */

inputText.addEventListener(
  "keydown",
  function(event) {

    if (
      (event.ctrlKey ||
       event.metaKey) &&
      event.key === "Enter"
    ) {

      event.preventDefault();

      translateText();

    }

  }
);


/* =========================================
   INITIALIZE
========================================= */

updateLanguageUI();


resultText.classList.add(
  "empty"
);


console.log(
  "🌐 ผู้ช่วยแปลภาษา + Wide General OCR พร้อมใช้งาน"
);
