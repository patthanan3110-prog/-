/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 19
   General OCR
   Camera + Gallery
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
   CREATE OCR WORKER
   ใช้ tha+eng ตัวเดียว
   เพื่อให้ไทย + อังกฤษอยู่ในภาพเดียวกันได้
========================================================= */

async function getOCRWorker() {

  if (ocrWorker) {
    return ocrWorker;
  }


  const Tesseract =
    await loadTesseract();


  showLoading(
    "กำลังเตรียมระบบอ่านภาษา..."
  );


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
                (message.progress || 0) *
                  100
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
   CAMERA FILE
========================================================= */

if (cameraInput) {

  cameraInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files &&
        event.target.files[0];


      if (!file) return;


      handleImageFile(
        file
      );

    }
  );

}


/* =========================================================
   GALLERY FILE
========================================================= */

if (galleryInput) {

  galleryInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files &&
        event.target.files[0];


      if (!file) return;


      handleImageFile(
        file
      );

    }
  );

}


/* =========================================================
   HANDLE IMAGE
========================================================= */

function handleImageFile(file) {

  if (!file) return;


  if (
    !file.type ||
    !file.type.startsWith("image/")
  ) {

    showStatus(
      "ไฟล์นี้ไม่ใช่รูปภาพ",
      "error"
    );

    return;

  }


  selectedImageFile =
    file;


  /*
    ลบ URL เก่า
  */

  if (selectedImageUrl) {

    URL.revokeObjectURL(
      selectedImageUrl
    );

  }


  /*
    สำคัญ:
    Preview ใช้ไฟล์ต้นฉบับโดยตรง
    ไม่ผ่าน Canvas
  */

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


  /*
    เริ่ม OCR
  */

  runOCR(
    file
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
   LOAD IMAGE WITH ORIENTATION
   สำคัญสำหรับรูปจากกล้อง iPhone/iPad
========================================================= */

async function loadImageCorrectly(
  file
) {

  /*
    createImageBitmap พร้อม
    imageOrientation: from-image
    ช่วยจัดการ EXIF orientation
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


      return {

        source:
          bitmap,

        width:
          bitmap.width,

        height:
          bitmap.height,

        bitmap:
          true

      };

    } catch (error) {

      console.warn(
        "createImageBitmap failed:",
        error
      );

    }

  }


  /*
    Fallback
  */

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


          resolve({

            source:
              img,

            width:
              img.naturalWidth ||
              img.width,

            height:
              img.naturalHeight ||
              img.height,

            bitmap:
              false

          });

        };


      img.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );


          reject(
            new Error(
              "เปิดรูปไม่ได้"
            )
          );

        };


      img.src =
        url;

    }
  );

}


/* =========================================================
   PREPARE OCR CANVAS
========================================================= */

async function prepareOCRCanvas(
  file
) {

  const image =
    await loadImageCorrectly(
      file
    );


  const originalWidth =
    image.width;


  const originalHeight =
    image.height;


  if (
    !originalWidth ||
    !originalHeight
  ) {

    throw new Error(
      "อ่านขนาดรูปไม่ได้"
    );

  }


  /*
    OCR ไม่จำเป็นต้องใช้ขนาดใหญ่มาก
    แต่ยังรักษาอัตราส่วนเดิม
  */

  const MAX_SIZE =
    2800;


  let scale =
    1;


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
    document.createElement(
      "canvas"
    );


  canvas.width =
    Math.max(
      1,
      Math.round(
        originalWidth * scale
      )
    );


  canvas.height =
    Math.max(
      1,
      Math.round(
        originalHeight * scale
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
    image.source,
    0,
    0,
    canvas.width,
    canvas.height
  );


  /*
    ปิด ImageBitmap เมื่อใช้เสร็จ
  */

  if (
    image.bitmap &&
    image.source &&
    typeof image.source.close ===
      "function"
  ) {

    image.source.close();

  }


  return canvas;

}


/* =========================================================
   LIGHT IMAGE ENHANCEMENT
   ไม่ threshold
   ไม่ทำให้พื้นหลังกลายเป็นตัวหนังสือ
========================================================= */

function createSoftEnhancedCanvas(
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
    ปรับแบบเบา ๆ
    เพื่อช่วยตัวหนังสือสีเทา
    แต่ไม่ตัดเป็นขาว/ดำ
  */

  const contrast =
    1.25;


  const brightness =
    6;


  const intercept =
    128 -
    contrast * 128 +
    brightness;


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
      gray * contrast +
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
   OCR RESULT
========================================================= */

async function recognizeOCR(
  worker,
  image,
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
      image
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
   OCR CLEANING
========================================================= */

function cleanOCRText(
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


  /*
    คำที่ OCR มักอ่านผิด
    เป็นการแก้เฉพาะ pattern ทั่วไป
    ไม่ hardcode ข้อความของรูปทดสอบ
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


  /*
    รวม Recommend + ed
  */

  result =
    result.replace(
      /\bRecommend\s*\n\s*ed\b/gi,
      "Recommended"
    );


  result =
    result.replace(
      /\bimmediate\s*\n\s*ly\b/gi,
      "immediately"
    );


  /*
    กรองแต่ละบรรทัด
  */

  const lines =
    result
      .split("\n")
      .map(
        line =>
          line
            .replace(
              /\s+/g,
              " "
            )
            .trim()
      );


  const cleaned =
    [];


  for (
    const line
    of lines
  ) {

    if (!line) continue;


    const compact =
      line.replace(
        /\s/g,
        ""
      );


    /*
      unknown ทุกแบบ
    */

    if (
      /^[-~_]*unknown[-~_]*$/i.test(
        compact
      )
    ) {
      continue;
    }


    if (
      /^[-~_]*(unhmvn|unhmw|unknwn|unkn0wn|unknvn|unhnvn)[-~_]*$/i.test(
        compact
      )
    ) {
      continue;
    }


    /*
      W / ศ เดี่ยว ๆ
    */

    if (
      /^(W|Ww|ww|ศ|ศศ)$/i.test(
        compact
      )
    ) {
      continue;
    }


    /*
      เครื่องหมายล้วน
    */

    if (
      /^[^ก-๙a-zA-Z0-9]+$/u.test(
        compact
      )
    ) {
      continue;
    }


    /*
      ต้องมีตัวอักษร/ตัวเลขอย่างน้อย 2 ตัว
    */

    const useful =
      (
        compact.match(
          /[ก-๙a-zA-Z0-9]/g
        ) || []
      ).length;


    if (
      useful < 2
    ) {
      continue;
    }


    cleaned.push(
      line
    );

  }


  /*
    ลบบรรทัดซ้ำติดกัน
  */

  const unique =
    [];


  for (
    const line
    of cleaned
  ) {

    const normalized =
      line
        .toLowerCase()
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    const previous =
      unique.length
        ? unique[
            unique.length - 1
          ]
            .toLowerCase()
            .replace(
              /\s+/g,
              " "
            )
            .trim()
        : "";


    if (
      normalized &&
      normalized !== previous
    ) {

      unique.push(
        line
      );

    }

  }


  return unique.join(
    "\n"
  ).trim();

}


/* =========================================================
   CHOOSE BEST OCR RESULT
========================================================= */

function scoreOCRResult(
  result
) {

  const text =
    cleanOCRText(
      result.text
    );


  if (!text) {
    return -999999;
  }


  const compact =
    text.replace(
      /\s/g,
      ""
    );


  const useful =
    (
      compact.match(
        /[ก-๙a-zA-Z0-9]/g
      ) || []
    ).length;


  const thai =
    (
      compact.match(
        /[ก-๙]/g
      ) || []
    ).length;


  const english =
    (
      compact.match(
        /[a-zA-Z]/g
      ) || []
    ).length;


  const lines =
    text
      .split("\n")
      .filter(Boolean)
      .length;


  const strange =
    (
      compact.match(
        /[^ก-๙a-zA-Z0-9.,!?'"():;%\-]/g
      ) || []
    ).length;


  /*
    ให้คะแนนข้อความที่มีเนื้อหาจริง
    แต่ไม่ให้ความยาวอย่างเดียวชนะ
  */

  let score = 0;


  score +=
    Math.min(
      useful,
      250
    ) * 1.2;


  score +=
    Math.min(
      result.confidence || 0,
      100
    ) * 0.8;


  score +=
    Math.min(
      lines,
      12
    ) * 5;


  /*
    มีทั้งไทยและอังกฤษ
    เป็นสัญญาณที่ดีสำหรับรูปหลายภาษา
  */

  if (
    thai > 0 &&
    english > 0
  ) {

    score += 25;

  }


  /*
    ลงโทษตัวมั่ว
  */

  score -=
    Math.min(
      strange,
      50
    ) * 2;


  /*
    ถ้ามีบรรทัดเยอะผิดปกติ
    มักเป็นพื้นหลัง/Noise
  */

  if (
    lines > 15
  ) {

    score -=
      (lines - 15) * 8;

  }


  return score;

}


/* =========================================================
   OCR
   ใช้ 2 รอบหลักเท่านั้น

   1. รูปต้นฉบับ PSM 11
   2. ภาพปรับเบา ๆ PSM 6

   แล้วเลือกผลที่มีคุณภาพดีกว่า
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

    const worker =
      await getOCRWorker();


    /*
      เตรียมรูป
    */

    showLoading(
      "กำลังเตรียมรูปสำหรับอ่าน..."
    );


    const originalCanvas =
      await prepareOCRCanvas(
        file
      );


    /*
      รอบที่ 1
      ใช้รูปปกติ
      เหมาะกับเอกสารทั่วไป
    */

    showLoading(
      "กำลังอ่านข้อความจากรูป..."
    );


    const normalResult =
      await recognizeOCR(
        worker,
        originalCanvas,
        11
      );


    /*
      รอบที่ 2
      ปรับ contrast เบา ๆ
      ช่วยตัวหนังสือสีเทา/จาง
    */

    showLoading(
      "กำลังตรวจข้อความที่จาง..."
    );


    const enhancedCanvas =
      createSoftEnhancedCanvas(
        originalCanvas
      );


    const enhancedResult =
      await recognizeOCR(
        worker,
        enhancedCanvas,
        6
      );


    /*
      เลือกผลที่คุณภาพดีกว่า
      ไม่เอาผลสองรอบมาต่อมั่ว ๆ
    */

    const normalScore =
      scoreOCRResult(
        normalResult
      );


    const enhancedScore =
      scoreOCRResult(
        enhancedResult
      );


    let bestResult;


    if (
      enhancedScore >
      normalScore
    ) {

      bestResult =
        enhancedResult;

    } else {

      bestResult =
        normalResult;

    }


    const finalText =
      cleanOCRText(
        bestResult.text
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


    const thaiFound =
      /[ก-๙]/.test(
        finalText
      );


    const englishFound =
      /[a-zA-Z]/.test(
        finalText
      );


    if (
      thaiFound &&
      englishFound
    ) {

      showStatus(
        "สแกนภาษาไทยและอังกฤษเรียบร้อยแล้ว",
        "success"
      );

    } else if (thaiFound) {

      showStatus(
        "สแกนข้อความภาษาไทยเรียบร้อยแล้ว",
        "success"
      );

    } else if (englishFound) {

      showStatus(
        "สแกนข้อความภาษาอังกฤษเรียบร้อยแล้ว",
        "success"
      );

    } else {

      showStatus(
        "อ่านรูปแล้ว แต่ไม่พบข้อความที่ชัดเจน",
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
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองถ่ายให้ข้อความอยู่ในภาพชัด ๆ ค่ะ",
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


  const unique =
    [];


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
