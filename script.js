/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js

   OCR:
   Tesseract.js

   UPDATE:
   - General OCR
   - แก้คำ OCR ภาษาไทย
   - ลบเครดิต OCR
   - ลบข้อความแปลซ้ำ
   - ลบข้อความแปลที่คล้ายกันมาก
   - ป้องกันประโยคแปลหลุดซ้ำ
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
   LOAD TESSERACT
========================================= */

function loadTesseract() {

  if (window.Tesseract) {
    return Promise.resolve();
  }

  if (tesseractLoadingPromise) {
    return tesseractLoadingPromise;
  }

  tesseractLoadingPromise =
    new Promise(function(resolve, reject) {

      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

      script.onload = function() {

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

      script.onerror = function() {

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
   TESSERACT WORKER
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
        logger: function(message) {

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

            if (ocrText) {
              ocrText.value =
                "กำลังอ่านข้อความ... " +
                progress +
                "%";
            }

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
   DOM
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
  document.getElementById(
    "imagePreviewContainer"
  );

const imagePreview =
  document.getElementById("imagePreview");

const sourceLanguageText =
  document.getElementById(
    "sourceLanguageText"
  );

const targetLanguageText =
  document.getElementById(
    "targetLanguageText"
  );

const translateButton =
  document.getElementById(
    "translateButton"
  );

const swapLanguageButton =
  document.getElementById(
    "swapLanguageButton"
  );

const cameraButton =
  document.getElementById(
    "cameraButton"
  );

const galleryButton =
  document.getElementById(
    "galleryButton"
  );

const clearInputButton =
  document.getElementById(
    "clearInputButton"
  );

const removeImageButton =
  document.getElementById(
    "removeImageButton"
  );

const copyResultButton =
  document.getElementById(
    "copyResultButton"
  );

const speakResultButton =
  document.getElementById(
    "speakResultButton"
  );

const speakOcrButton =
  document.getElementById(
    "speakOcrButton"
  );

const useOcrButton =
  document.getElementById(
    "useOcrButton"
  );


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


function updatePlaceholder() {

  inputText.placeholder =
    sourceLanguage === "th"
      ? "พิมพ์ข้อความภาษาไทยที่ต้องการแปล..."
      : "Type English text to translate...";

}


swapLanguageButton.addEventListener(
  "click",
  function() {

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
   CAMERA / GALLERY
========================================= */

cameraButton.addEventListener(
  "click",
  function() {
    cameraInput.click();
  }
);


galleryButton.addEventListener(
  "click",
  function() {
    galleryInput.click();
  }
);


cameraInput.addEventListener(
  "change",
  function(event) {

    const file =
      event.target.files[0];

    if (!file) return;

    handleSelectedImage(file);

  }
);


galleryInput.addEventListener(
  "change",
  function(event) {

    const file =
      event.target.files[0];

    if (!file) return;

    handleSelectedImage(file);

  }
);


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
    function(event) {

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
    function() {

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
  function() {

    imagePreview.src = "";

    imagePreviewContainer.hidden =
      true;

    cameraInput.value = "";

    galleryInput.value = "";

    ocrCard.hidden =
      true;

    ocrText.value = "";

  }
);


/* =========================================
   LOAD IMAGE
========================================= */

function loadImageFromFile(file) {

  return new Promise(
    function(resolve, reject) {

      const reader =
        new FileReader();

      reader.onload =
        function(event) {

          const img =
            new Image();

          img.onload =
            function() {
              resolve(img);
            };

          img.onerror =
            function() {

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
        function() {

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
   DRAW IMAGE
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
    options.targetWidth || 3000;

  const scale =
    targetWidth / cropWidth;

  const targetHeight =
    Math.round(
      cropHeight * scale
    );

  const canvas =
    document.createElement("canvas");

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
    await loadImageFromFile(file);

  const originalWidth =
    img.naturalWidth;

  const originalHeight =
    img.naturalHeight;


  if (mode === "original") {

    const canvas =
      drawImageToCanvas(
        img,
        {
          cropX: 0,
          cropY: 0,
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


  if (mode === "focus") {

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
      Math.max(0, cropX);

    cropY =
      Math.max(0, cropY);

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
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          targetWidth: 3600
        }
      );

    return canvas.toDataURL(
      "image/png"
    );
  }


  if (mode === "lower") {

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
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          targetWidth: 3600
        }
      );

    return canvas.toDataURL(
      "image/png"
    );
  }


  if (mode === "center") {

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
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          targetWidth: 3600
        }
      );

    return canvas.toDataURL(
      "image/png"
    );
  }


  const canvas =
    drawImageToCanvas(
      img,
      {
        cropX: 0,
        cropY: 0,
        cropWidth:
          originalWidth,
        cropHeight:
          originalHeight,
        targetWidth: 3200
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


  if (mode === "normal") {

    const contrast = 1.18;

    const factor =
      (259 * (contrast + 255)) /
      (255 * (259 - contrast));

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
          Math.min(255, gray)
        );

      pixels[i] =
        gray;

      pixels[i + 1] =
        gray;

      pixels[i + 2] =
        gray;

    }

  }


  if (mode === "threshold") {

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


  if (mode === "sharp") {

    const contrast = 1.32;

    const factor =
      (259 * (contrast + 255)) /
      (255 * (259 - contrast));

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
          Math.min(255, gray)
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
   OCR RECOGNIZE
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
      confidence,
      text
    }
  );

  return {
    text,
    confidence,
    mode: modeName
  };
}


/* =========================================
   OCR SCORE
========================================= */

function scoreOCRResult(result) {

  if (
    !result ||
    !result.text
  ) {
    return -999;
  }

  const text =
    String(result.text).trim();

  if (!text) {
    return -999;
  }

  const useful =
    text.match(
      /[ก-๙a-zA-Z0-9]/g
    );

  const usefulCount =
    useful
      ? useful.length
      : 0;

  if (!usefulCount) {
    return -999;
  }

  const lines =
    text
      .split(/\n+/)
      .map(function(line) {
        return line.trim();
      })
      .filter(function(line) {
        return /[ก-๙a-zA-Z0-9]/.test(
          line
        );
      });

  const lineCount =
    lines.length;

  const thai =
    text.match(/[ก-๙]/g);

  const thaiCount =
    thai ? thai.length : 0;

  const english =
    text.match(/[a-zA-Z]/g);

  const englishCount =
    english ? english.length : 0;

  const confidence =
    Number(result.confidence) || 0;

  let score = 0;

  score +=
    lineCount * 18;

  score +=
    Math.min(
      usefulCount,
      100
    ) * 0.8;

  score +=
    confidence * 0.15;

  if (thaiCount >= 5) {
    score += 5;
  }

  if (thaiCount >= 15) {
    score += 8;
  }

  if (englishCount >= 5) {
    score += 4;
  }

  let garbageLines = 0;

  lines.forEach(function(line) {

    const usefulLine =
      line.match(
        /[ก-๙a-zA-Z0-9]/g
      );

    const count =
      usefulLine
        ? usefulLine.length
        : 0;

    if (count <= 1) {
      garbageLines++;
    }

  });

  score -=
    garbageLines * 5;

  const longEnglish =
    text.match(
      /\b[a-zA-Z]{13,}\b/g
    );

  if (longEnglish) {
    score -=
      longEnglish.length * 4;
  }

  const strange =
    text.match(
      /[^ก-๙a-zA-Z0-9\s.,!?()\-:/'%&+]/g
    );

  if (strange) {
    score -=
      Math.min(
        15,
        strange.length * 0.5
      );
  }

  return score;
}


/* =========================================
   REMOVE OCR CREDIT
========================================= */

function removeOCRCreditLines(lines) {

  return lines.filter(
    function(line) {

      const normalized =
        line
          .trim()
          .replace(/\s+/g, " ");

      if (
        /^unknown\s*[-–—]?\s*$/i.test(
          normalized
        )
      ) {
        return false;
      }

      if (
        /^[-–—]\s*unknown\s*[-–—]?\s*$/i.test(
          normalized
        )
      ) {
        return false;
      }

      return true;

    }
  );

}


/* =========================================
   CLEAN OCR
========================================= */

function cleanOCRText(text) {

  if (!text) {
    return "";
  }

  let cleaned =
    String(text)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ");


  const corrections = [

    [/ช่วขลด/g, "ช่วยลด"],
    [/ชว่ยลด/g, "ช่วยลด"],
    [/ชว่ขลด/g, "ช่วยลด"],
    [/ช่วลด/g, "ช่วยลด"],

    [/ธีไซเคิลไล้/g, "รีไซเคิลได้"],
    [/ธีไซเคิลได้/g, "รีไซเคิลได้"],
    [/รีไซเคิลไล้/g, "รีไซเคิลได้"],
    [/รีไซเคิลไล/g, "รีไซเคิลได้"],
    [/รีไซเคิลไต้/g, "รีไซเคิลได้"],

    [/ผลาสติก/g, "พลาสติก"],
    [/พลาสตก/g, "พลาสติก"],
    [/พลาสตค/g, "พลาสติก"],

    [/โปรดริบประทาน/g, "โปรดรับประทาน"],
    [/โปรดรบประทาน/g, "โปรดรับประทาน"],

    /* แก้คำที่ต้องการ */
    [/สําหรับ/g, "สำหรับ"],
    [/ทัง/g, "ทั้ง"]

  ];


  corrections.forEach(
    function(item) {

      cleaned =
        cleaned.replace(
          item[0],
          item[1]
        );

    }
  );


  cleaned =
    cleaned.replace(
      /ส[\u0E4D]าหรับ/g,
      "สำหรับ"
    );


  cleaned =
    cleaned.replace(
      /^\s*(Ww|W|ww|ศศ|ศ)\s*$/gim,
      ""
    );


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


  let lines =
    cleaned
      .split("\n")
      .map(function(line) {
        return line.trim();
      })
      .filter(function(line) {
        return /[ก-๙a-zA-Z0-9]/.test(
          line
        );
      });


  lines =
    removeOCRCreditLines(lines);


  lines =
    lines.map(function(line) {

      line =
        line.replace(
          /สําหรับ/g,
          "สำหรับ"
        );

      line =
        line.replace(
          /ทัง/g,
          "ทั้ง"
        );

      line =
        line.replace(
          /ช่วขลด/g,
          "ช่วยลด"
        );

      line =
        line.replace(
          /ธีไซเคิลไล้/g,
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

      return line.trim();

    });


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
        "Recommended " +
        next
      );

      i++;
      continue;
    }


    mergedLines.push(
      current
    );

  }


  cleaned =
    mergedLines.join("\n");


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


  /* FINAL */

  cleaned =
    cleaned.replace(
      /ส[\u0E4D]าหรับ/g,
      "สำหรับ"
    );

  cleaned =
    cleaned.replace(
      /สําหรับ/g,
      "สำหรับ"
    );

  cleaned =
    cleaned.replace(
      /ทัง/g,
      "ทั้ง"
    );


  return cleaned.trim();
}


/* =========================================
   SELECT BEST OCR
========================================= */

function selectBestOCRResult(results) {

  let best = null;

  let bestScore = -999;

  results.forEach(function(result) {

    if (
      !result ||
      !result.text
    ) {
      return;
    }

    const score =
      scoreOCRResult(result);

    console.log(
      "OCR SCORE:",
      result.mode,
      score
    );

    if (
      score > bestScore
    ) {

      best =
        result;

      bestScore =
        score;

    }

  });

  console.log(
    "OCR BEST:",
    best
      ? best.mode
      : "none",
    bestScore
  );

  return (
    best || {
      text: "",
      confidence: 0,
      mode: ""
    }
  );
}


/* =========================================
   RUN OCR
========================================= */

async function runOCR(file) {

  ocrCard.hidden =
    false;

  ocrText.value =
    "กำลังเตรียมระบบ OCR...";


  try {

    const worker =
      await getTesseractWorker();

    const results = [];


    /* FOCUS */

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


    results.push(
      await recognizeOCR(
        worker,
        focusImage,
        "wide-focus",
        6
      )
    );


    results.push(
      await recognizeOCR(
        worker,
        focusImage,
        "wide-focus-sparse",
        11
      )
    );


    /* LOWER */

    ocrText.value =
      "กำลังอ่านข้อความส่วนล่าง...";


    const lowerImage =
      await prepareOCRImage(
        file,
        "lower"
      );


    results.push(
      await recognizeOCR(
        worker,
        lowerImage,
        "lower",
        6
      )
    );


    results.push(
      await recognizeOCR(
        worker,
        lowerImage,
        "lower-sparse",
        11
      )
    );


    /* CENTER */

    ocrText.value =
      "กำลังตรวจสอบข้อความอีกครั้ง...";


    const centerImage =
      await prepareOCRImage(
        file,
        "center"
      );


    results.push(
      await recognizeOCR(
        worker,
        centerImage,
        "center",
        6
      )
    );


    /* ORIGINAL */

    ocrText.value =
      "กำลังอ่านข้อความจากภาพทั้งหมด...";


    const originalImage =
      await prepareOCRImage(
        file,
        "original"
      );


    results.push(
      await recognizeOCR(
        worker,
        originalImage,
        "original-dense",
        6
      )
    );


    results.push(
      await recognizeOCR(
        worker,
        originalImage,
        "original-sparse",
        11
      )
    );


    const bestResult =
      selectBestOCRResult(
        results
      );


    if (!bestResult.text) {

      ocrText.value =
        "ไม่พบข้อความในรูปภาพ";

      showStatus(
        "ไม่พบข้อความในรูปภาพ",
        "error"
      );

      return;
    }


    const cleanedText =
      cleanOCRText(
        bestResult.text
      );


    ocrText.value =
      cleanedText;


    console.log(
      "OCR FINAL:",
      cleanedText
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
      text.includes("ไม่สามารถสแกน") ||
      text.includes("ไม่พบข้อความ") ||
      text.includes("กำลัง")
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
   CLEAR
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
   TEXT NORMALIZATION
   ใช้สำหรับตรวจข้อความซ้ำ/คล้ายกัน
========================================= */

function normalizeTranslationLine(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[“”‘’"']/g, "")
    .replace(/[.,!?;:()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================================
   WORD SIMILARITY
========================================= */

function translationLineSimilarity(
  first,
  second
) {

  const a =
    normalizeTranslationLine(first)
      .split(" ")
      .filter(Boolean);

  const b =
    normalizeTranslationLine(second)
      .split(" ")
      .filter(Boolean);


  if (
    !a.length ||
    !b.length
  ) {
    return 0;
  }


  /*
    หาคำที่เหมือนกันตามลำดับ
    เช่น

    but you were my whole damn sky
    but you were my whole sky

    จะได้คะแนนสูงมาก
  */

  const rows =
    a.length + 1;

  const cols =
    b.length + 1;

  const matrix =
    Array.from(
      {
        length: rows
      },
      function() {
        return new Array(cols).fill(0);
      }
    );


  for (
    let i = 1;
    i < rows;
    i++
  ) {

    for (
      let j = 1;
      j < cols;
      j++
    ) {

      if (
        a[i - 1] ===
        b[j - 1]
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1] + 1;

      } else {

        matrix[i][j] =
          Math.max(
            matrix[i - 1][j],
            matrix[i][j - 1]
          );

      }

    }

  }


  const commonWords =
    matrix[a.length][b.length];

  const maxLength =
    Math.max(
      a.length,
      b.length
    );


  return (
    commonWords /
    maxLength
  );
}


/* =========================================
   CHECK NEAR DUPLICATE
========================================= */

function isNearDuplicateTranslation(
  first,
  second
) {

  const a =
    normalizeTranslationLine(first);

  const b =
    normalizeTranslationLine(second);


  if (!a || !b) {
    return false;
  }


  if (a === b) {
    return true;
  }


  const wordsA =
    a.split(" ").filter(Boolean);

  const wordsB =
    b.split(" ").filter(Boolean);


  /*
    ต้องเป็นประโยคที่มีความยาวใกล้กัน
    เพื่อไม่ให้ลบประโยคปกติที่บังเอิญ
    มีคำบางคำเหมือนกัน
  */

  const lengthDifference =
    Math.abs(
      wordsA.length -
      wordsB.length
    );


  if (
    lengthDifference > 3
  ) {
    return false;
  }


  /*
    กรณีข้อความหนึ่งเป็นข้อความที่ถูกตัด
    หรือขาดคำเพียง 1-3 คำ
  */

  const similarity =
    translationLineSimilarity(
      first,
      second
    );


  if (
    similarity >= 0.82
  ) {
    return true;
  }


  /*
    ตรวจกรณีประโยคหนึ่งเป็นส่วนย่อย
    ของอีกประโยค
  */

  if (
    wordsA.length >= 5 &&
    wordsB.length >= 5
  ) {

    const shorter =
      wordsA.length <= wordsB.length
        ? wordsA
        : wordsB;

    const longer =
      wordsA.length <= wordsB.length
        ? wordsB
        : wordsA;


    let matched = 0;

    shorter.forEach(
      function(word) {

        if (
          longer.includes(word)
        ) {
          matched++;
        }

      }
    );


    const ratio =
      matched /
      shorter.length;


    if (
      ratio >= 0.90 &&
      lengthDifference <= 2
    ) {
      return true;
    }

  }


  return false;
}


/* =========================================
   REMOVE DUPLICATE / NEAR DUPLICATE
========================================= */

function removeDuplicateTranslationBlocks(
  text
) {

  if (!text) {
    return "";
  }


  let lines =
    String(text)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(function(line) {
        return line.trim();
      })
      .filter(function(line) {
        return line.length > 0;
      });


  /*
    1. ลบข้อความที่เหมือนกันเป๊ะ
  */

  const exactSeen =
    new Set();

  const exactFiltered = [];


  lines.forEach(
    function(line) {

      const key =
        normalizeTranslationLine(
          line
        );


      if (
        key.length >= 12 &&
        exactSeen.has(key)
      ) {
        return;
      }


      if (
        key.length >= 12
      ) {
        exactSeen.add(key);
      }


      exactFiltered.push(
        line
      );

    }
  );


  lines =
    exactFiltered;


  /*
    2. ลบข้อความที่คล้ายกันมาก
  */

  const nearFiltered = [];


  lines.forEach(
    function(line) {

      let duplicate =
        false;


      for (
        let i = 0;
        i < nearFiltered.length;
        i++
      ) {

        const previous =
          nearFiltered[i];


        if (
          isNearDuplicateTranslation(
            previous,
            line
          )
        ) {

          /*
            ถ้าบรรทัดใหม่ยาวกว่า
            และมีรายละเอียดมากกว่า
            ให้ใช้บรรทัดใหม่แทน
          */

          const oldWords =
            normalizeTranslationLine(
              previous
            )
              .split(" ")
              .filter(Boolean);


          const newWords =
            normalizeTranslationLine(
              line
            )
              .split(" ")
              .filter(Boolean);


          if (
            newWords.length >
            oldWords.length
          ) {

            nearFiltered[i] =
              line;

          }


          duplicate =
            true;

          break;
        }

      }


      if (!duplicate) {

        nearFiltered.push(
          line
        );

      }

    }
  );


  lines =
    nearFiltered;


  /*
    3. ลบ block ที่ซ้ำกัน
  */

  for (
    let blockSize = 3;
    blockSize >= 2;
    blockSize--
  ) {

    let changed =
      true;


    while (changed) {

      changed =
        false;


      outerLoop:


      for (
        let i = 0;
        i < lines.length;
        i++
      ) {

        const block =
          lines.slice(
            i,
            i + blockSize
          );


        if (
          block.length !==
          blockSize
        ) {
          continue;
        }


        for (
          let j = i + 1;
          j <=
          lines.length - blockSize;
          j++
        ) {

          let same =
            true;


          for (
            let k = 0;
            k < blockSize;
            k++
          ) {

            if (
              !isNearDuplicateTranslation(
                block[k],
                lines[j + k]
              )
            ) {

              same =
                false;

              break;

            }

          }


          if (same) {

            lines.splice(
              j,
              blockSize
            );

            changed =
              true;

            break outerLoop;

          }

        }

      }

    }

  }


  return lines.join("\n");
}


/* =========================================
   CLEAN TRANSLATION RESULT
========================================= */

function cleanTranslationResult(
  text
) {

  if (!text) {
    return "";
  }


  let cleaned =
    String(text)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");


  /*
    ลบเครดิต
  */

  cleaned =
    cleaned.replace(
      /^\s*unknown\s*[-–—]?\s*$/gim,
      ""
    );

  cleaned =
    cleaned.replace(
      /^\s*[-–—]\s*unknown\s*[-–—]?\s*$/gim,
      ""
    );


  /*
    ลบข้อความซ้ำ + ข้อความคล้ายกัน
  */

  cleaned =
    removeDuplicateTranslationBlocks(
      cleaned
    );


  /*
    ลบช่องว่างเกิน
  */

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
   TRANSLATE TEXT
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
          method: "POST",

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


    const translation =
      cleanTranslationResult(
        data.translation || ""
      );


    resultText.textContent =
      translation;

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
   SPEAK
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
   COPY
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
   KEYBOARD
========================================= */

inputText.addEventListener(
  "keydown",
  function(event) {

    if (
      (
        event.ctrlKey ||
        event.metaKey
      ) &&
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
  "🌐 ผู้ช่วยแปลภาษา + General OCR + Smart Duplicate Protection พร้อมใช้งาน"
);
