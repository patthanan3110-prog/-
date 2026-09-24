/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation
   VERSION 16
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

let tesseractWorker = null;
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
      sourceLanguageText.textContent = "ภาษาไทย";
    }

    if (targetLanguageText) {
      targetLanguageText.textContent = "English";
    }

  } else {

    if (sourceLanguageText) {
      sourceLanguageText.textContent = "English";
    }

    if (targetLanguageText) {
      targetLanguageText.textContent = "ภาษาไทย";
    }

  }

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(message, type = "info") {

  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className =
    "status-message " + type;
  statusMessage.hidden = false;

}


function hideStatus() {

  if (!statusMessage) return;

  statusMessage.hidden = true;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(message) {

  if (loadingText) {
    loadingText.textContent = message;
  }

  if (loadingBox) {
    loadingBox.hidden = false;
  }

}


function hideLoading() {

  if (loadingBox) {
    loadingBox.hidden = true;
  }

}


/* =========================================================
   LOAD TESSERACT
========================================================= */

function loadTesseract() {

  if (window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }

  if (tesseractLoading) {
    return tesseractLoading;
  }

  tesseractLoading = new Promise(
    (resolve, reject) => {

      const script =
        document.createElement("script");

      script.src = TESSERACT_URL;
      script.async = true;

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
          new Error("โหลดระบบ OCR ไม่สำเร็จ")
        );

      };

      document.head.appendChild(script);

    }
  );

  return tesseractLoading;

}


/* =========================================================
   OCR WORKER
========================================================= */

async function getOCRWorker() {

  if (tesseractWorker) {
    return tesseractWorker;
  }

  const Tesseract =
    await loadTesseract();

  showLoading(
    "กำลังเตรียมระบบอ่านตัวอักษร..."
  );

  tesseractWorker =
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
                (message.progress || 0) * 100
              );

            showLoading(
              `กำลังอ่านตัวอักษร ${percent}%`
            );

          }

        }
      }
    );

  await tesseractWorker.setParameters({

    preserve_interword_spaces: "1",
    user_defined_dpi: "300"

  });

  return tesseractWorker;

}


/* =========================================================
   IMAGE FILE
   ใช้รูปต้นฉบับแสดงผล
   ไม่ crop / ไม่หมุน / ไม่ยืด
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

  selectedImageFile = file;

  if (selectedImageUrl) {

    URL.revokeObjectURL(
      selectedImageUrl
    );

  }

  selectedImageUrl =
    URL.createObjectURL(file);

  /*
    Preview ใช้ไฟล์จริงโดยตรง
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

      selectedImageUrl = null;
      selectedImageFile = null;

      if (imagePreview) {
        imagePreview.removeAttribute("src");
      }

      if (imagePreviewContainer) {
        imagePreviewContainer.hidden = true;
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
          new Error(
            "ไม่สามารถเปิดรูปภาพได้"
          )
        );

      };

      img.src = url;

    }
  );

}


/* =========================================================
   PREPARE OCR IMAGE
   สำเนาสำหรับ OCR เท่านั้น
========================================================= */

async function prepareOCRImage(file) {

  const img =
    await loadImage(file);

  const originalWidth =
    img.naturalWidth || img.width;

  const originalHeight =
    img.naturalHeight || img.height;

  if (
    !originalWidth ||
    !originalHeight
  ) {

    throw new Error(
      "ไม่สามารถอ่านขนาดรูปภาพได้"
    );

  }

  /*
    ไม่ crop
    ไม่หมุน
    ไม่เปลี่ยนอัตราส่วน

    ลดขนาดเฉพาะกรณีที่รูปใหญ่มาก
    เพื่อไม่ให้ OCR ช้าเกินไป
  */

  const MAX_SIZE = 2600;

  let scale = 1;

  if (
    originalWidth > MAX_SIZE ||
    originalHeight > MAX_SIZE
  ) {

    scale =
      Math.min(
        MAX_SIZE / originalWidth,
        MAX_SIZE / originalHeight
      );

  }

  const canvas =
    document.createElement("canvas");

  canvas.width =
    Math.max(
      1,
      Math.round(originalWidth * scale)
    );

  canvas.height =
    Math.max(
      1,
      Math.round(originalHeight * scale)
    );

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true
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
   GRAYSCALE
========================================================= */

function createGrayCanvas(sourceCanvas) {

  const canvas =
    document.createElement("canvas");

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
      Math.round(
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114
      );

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;

  }

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvas;

}


/* =========================================================
   OCR CLEAN
========================================================= */

function cleanOCRText(text) {

  if (!text) return "";

  let result =
    String(text)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();


  /* -----------------------------------------
     คำไทยที่มักอ่านเพี้ยน
  ----------------------------------------- */

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
      result.split(wrong).join(right);

  }


  /* -----------------------------------------
     คำอังกฤษที่ OCR ตัดบรรทัด
  ----------------------------------------- */

  result =
    result.replace(
      /\b(Recommend|recommend)\s*\n\s*(ed)\b/g,
      "Recommended"
    );

  result =
    result.replace(
      /\b(immediate)\s*\n\s*(ly)\b/gi,
      "immediately"
    );

  result =
    result.replace(
      /\b(consume)\s*\n\s*(d)\b/gi,
      "consumed"
    );


  const lines =
    result
      .split("\n")
      .map(line =>
        line
          .trim()
          .replace(/\s{2,}/g, " ")
      )
      .filter(Boolean);


  const cleaned = [];


  for (const line of lines) {

    const compact =
      line.replace(/\s/g, "");

    if (!compact) continue;


    /*
      Noise ที่ไม่ต้องการ
    */

    if (
      /^(Ww|W|ww|ศศ|ศ)$/i.test(
        compact
      )
    ) {
      continue;
    }


    /*
      unknown จากรูปตัวอย่าง
      รวมถึงรูปแบบที่ OCR เพี้ยน
    */

    if (
      /^(unknown|unhmvn|unhmw|unknwn|unkn0wn|unknvn|unhnvn)$/i.test(
        compact
      )
    ) {
      continue;
    }


    /*
      บรรทัดที่เป็นเครื่องหมายอย่างเดียว
    */

    if (
      /^[\W_]+$/u.test(compact)
    ) {
      continue;
    }


    /*
      ตัวเดียวที่ไม่ใช่ตัวอักษร
    */

    if (
      compact.length === 1 &&
      !/[ก-๙a-zA-Z0-9]/.test(compact)
    ) {
      continue;
    }


    cleaned.push(line);

  }


  return cleaned.join("\n").trim();

}


/* =========================================================
   NORMALIZE LINE
========================================================= */

function normalizeLine(line) {

  return String(line || "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[.,!?;:()[\]{}"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   LINE SIMILARITY
========================================================= */

function lineSimilarity(a, b) {

  const x =
    normalizeLine(a);

  const y =
    normalizeLine(b);

  if (!x || !y) return 0;

  if (x === y) return 1;


  const xWords =
    x.split(" ").filter(Boolean);

  const yWords =
    y.split(" ").filter(Boolean);


  const maxLength =
    Math.max(
      xWords.length,
      yWords.length
    );


  if (maxLength === 0) {
    return 0;
  }


  let same = 0;

  for (const word of xWords) {

    if (yWords.includes(word)) {
      same++;
    }

  }


  return same / maxLength;

}


/* =========================================================
   IS REAL TEXT LINE
========================================================= */

function isUsefulOCRLine(line) {

  const text =
    String(line || "").trim();

  if (!text) return false;


  const compact =
    text.replace(/\s/g, "");


  if (compact.length < 2) {
    return false;
  }


  if (
    /^(Ww|W|ww|ศศ|ศ|unknown|unhmvn|unhmw|unknwn|unkn0wn|unknvn|unhnvn)$/i.test(
      compact
    )
  ) {
    return false;
  }


  const useful =
    (
      compact.match(
        /[ก-๙a-zA-Z0-9]/g
      ) || []
    ).length;


  if (useful < 2) {
    return false;
  }


  return true;

}


/* =========================================================
   GET CLEAN LINES
========================================================= */

function getOCRLines(text) {

  const cleaned =
    cleanOCRText(text);

  if (!cleaned) {
    return [];
  }


  return cleaned
    .split("\n")
    .map(line => line.trim())
    .filter(isUsefulOCRLine);

}


/* =========================================================
   MERGE OCR RESULTS
   จุดสำคัญของ VERSION 16

   ไม่เลือกผลรอบเดียว

   ตัวอย่าง:
   รอบ 1:
   You weren't just a star to me

   รอบ 2:
   เธอไม่ได้เป็นแค่เพียงดวงดาวสำหรับฉัน

   รอบ 3:
   but you were my whole damn sky

   ผลสุดท้ายจะรวมทั้ง 3 ส่วน
========================================================= */

function mergeOCRResults(results) {

  const allLines = [];


  /*
    เรียงรอบที่ต้องการก่อน:
    1. PSM 11 ปกติ
    2. PSM 6 ปกติ
    3. PSM 11 grayscale

    เพราะ PSM 11 เหมาะกับข้อความ
    ที่อยู่หลายตำแหน่งในรูป
  */

  const ordered =
    [...results].sort(
      (a, b) =>
        (b.confidence || 0) -
        (a.confidence || 0)
    );


  /*
    เพิ่มข้อความจากทุก OCR
  */

  for (const result of ordered) {

    const lines =
      getOCRLines(
        result.text
      );


    for (const line of lines) {

      let alreadyExists =
        false;


      for (const existing of allLines) {

        const similarity =
          lineSimilarity(
            line,
            existing.text
          );


        /*
          ถ้าเป็นบรรทัดเดียวกัน
          แต่ OCR อ่านต่างกันเล็กน้อย
        */

        if (
          similarity >= 0.72
        ) {

          alreadyExists =
            true;


          /*
            ถ้าผลใหม่ยาวกว่า
            และมีตัวอักษรจริงมากกว่า
            ให้ใช้ผลใหม่
          */

          const oldUseful =
            (
              existing.text.match(
                /[ก-๙a-zA-Z0-9]/g
              ) || []
            ).length;


          const newUseful =
            (
              line.match(
                /[ก-๙a-zA-Z0-9]/g
              ) || []
            ).length;


          if (
            newUseful > oldUseful
          ) {

            existing.text =
              line;

          }


          break;

        }

      }


      if (!alreadyExists) {

        allLines.push({
          text: line,
          source:
            result.name,
          confidence:
            result.confidence || 0
        });

      }

    }

  }


  /*
    ลบ noise อีกครั้ง
  */

  const finalLines =
    allLines
      .map(item => item.text)
      .filter(isUsefulOCRLine);


  /*
    ลบบรรทัดซ้ำ
  */

  const unique = [];


  for (const line of finalLines) {

    let duplicate =
      false;


    for (const oldLine of unique) {

      if (
        lineSimilarity(
          line,
          oldLine
        ) >= 0.80
      ) {

        duplicate = true;
        break;

      }

    }


    if (!duplicate) {

      unique.push(line);

    }

  }


  return unique.join("\n").trim();

}


/* =========================================================
   RECOGNIZE
========================================================= */

async function recognizeImage(
  worker,
  image,
  psm,
  name
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
    await worker.recognize(image);


  return {

    name,

    text:
      result &&
      result.data
        ? result.data.text || ""
        : "",

    confidence:
      result &&
      result.data &&
      typeof result.data.confidence === "number"
        ? result.data.confidence
        : 0

  };

}


/* =========================================================
   OCR
   3 PASSES
========================================================= */

async function runOCR(file) {

  if (isOCRRunning) {

    showStatus(
      "กำลังอ่านรูปอยู่ รอสักครู่นะคะ",
      "info"
    );

    return;

  }


  isOCRRunning = true;


  if (ocrCard) {
    ocrCard.hidden = false;
  }


  if (ocrText) {
    ocrText.value = "";
  }


  hideStatus();


  try {

    const worker =
      await getOCRWorker();


    const canvas =
      await prepareOCRImage(file);


    /*
      รอบที่ 1
      PSM 11
      เหมาะกับข้อความหลายตำแหน่ง
    */

    showLoading(
      "กำลังอ่านข้อความจากรูป..."
    );


    const pass1 =
      await recognizeImage(
        worker,
        canvas,
        11,
        "full-sparse"
      );


    /*
      รอบที่ 2
      PSM 6
      เหมาะกับข้อความที่เป็นบล็อก
    */

    showLoading(
      "กำลังอ่านข้อความอีกส่วน..."
    );


    const pass2 =
      await recognizeImage(
        worker,
        canvas,
        6,
        "full-block"
      );


    /*
      รอบที่ 3
      grayscale + PSM 11
    */

    showLoading(
      "กำลังตรวจข้อความให้ครบ..."
    );


    const grayCanvas =
      createGrayCanvas(canvas);


    const pass3 =
      await recognizeImage(
        worker,
        grayCanvas,
        11,
        "gray-sparse"
      );


    /*
      รวมผลทั้ง 3 รอบ
      ไม่เลือกแค่รอบเดียว
    */

    const merged =
      mergeOCRResults([
        pass1,
        pass2,
        pass3
      ]);


    if (!merged) {

      throw new Error(
        "ไม่พบข้อความในรูปภาพ"
      );

    }


    /*
      ทำความสะอาดรอบสุดท้าย
    */

    const finalText =
      cleanOCRText(merged);


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


    showStatus(
      "สแกนข้อความเรียบร้อยแล้ว",
      "success"
    );


  } catch (error) {

    console.error(
      "OCR ERROR:",
      error
    );


    hideLoading();


    if (ocrText) {
      ocrText.value = "";
    }


    showStatus(
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองใช้รูปที่เห็นข้อความชัดและครบค่ะ",
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

      }


      showStatus(
        "นำข้อความไปไว้ในช่องแปลแล้ว",
        "success"
      );


      if (inputText) {
        inputText.focus();
      }

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
   TRANSLATE BUTTON
========================================================= */

if (translateButton) {

  translateButton.addEventListener(
    "click",
    translateText
  );

}


/* =========================================================
   TRANSLATE
========================================================= */

async function translateText() {

  if (isTranslating) {
    return;
  }


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


  isTranslating = true;


  if (translateButton) {
    translateButton.disabled = true;
  }


  hideStatus();


  showLoading(
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

              action: "translate",
              text: text,
              source: sourceLanguage,
              target: targetLanguage

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
        data && data.message
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
      translateButton.disabled = false;
    }


    isTranslating = false;

  }

}


/* =========================================================
   CLEAN TRANSLATION
========================================================= */

function cleanTranslation(text) {

  if (!text) return "";


  const result =
    String(text)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();


  const lines =
    result
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);


  const unique = [];


  for (const line of lines) {

    const normalized =
      normalizeLine(line);


    let duplicate = false;


    for (const oldLine of unique) {

      const oldNormalized =
        normalizeLine(oldLine);


      if (
        normalized === oldNormalized
      ) {

        duplicate = true;
        break;

      }


      const similarity =
        lineSimilarity(
          line,
          oldLine
        );


      if (
        similarity >= 0.82
      ) {

        duplicate = true;
        break;

      }

    }


    if (!duplicate) {
      unique.push(line);
    }

  }


  return unique.join("\n");

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


  utterance.rate = 0.9;
  utterance.pitch = 1;


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
   COPY RESULT
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


        textarea.value = text;


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


    if (tesseractWorker) {

      tesseractWorker
        .terminate()
        .catch(() => {});

    }

  }
);
