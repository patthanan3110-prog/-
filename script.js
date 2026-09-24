/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation
   VERSION 15
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

let isTranslating = false;
let isOCRRunning = false;


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

  if (!statusMessage) return;

  statusMessage.hidden =
    true;

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
            `script[src="${TESSERACT_URL}"]`
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
                  "โหลดระบบ OCR ไม่สำเร็จ"
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
   CREATE OCR WORKER
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

            const progress =
              Math.round(
                (message.progress || 0) *
                  100
              );

            if (loadingText) {

              loadingText.textContent =
                `กำลังอ่านตัวอักษร ${progress}%`;

            }

          }

        }

      }
    );


  await tesseractWorker.setParameters({

    preserve_interword_spaces:
      "1",

    user_defined_dpi:
      "300"

  });


  return tesseractWorker;

}


/* =========================================================
   IMAGE FILE
   รูปที่ผู้ใช้เลือก:
   - ใช้ไฟล์ต้นฉบับ
   - ไม่หมุน
   - ไม่ crop
   - ไม่ยืด
   - ไม่บีบเพื่อแสดงผล
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
    Preview ใช้ไฟล์จริงโดยตรง
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


  /*
    OCR
  */

  runOCR(file);

}


/* =========================================================
   CAMERA BUTTON
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
   GALLERY BUTTON
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

      const files =
        event.target.files;

      if (!files || !files.length) {
        return;
      }

      handleImageFile(
        files[0]
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

      const files =
        event.target.files;

      if (!files || !files.length) {
        return;
      }

      handleImageFile(
        files[0]
      );

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
  );

}


/* =========================================================
   LOAD IMAGE FOR OCR
   สำเนานี้ใช้เฉพาะ OCR
   รูปต้นฉบับของผู้ใช้ไม่ถูกแก้
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
   - รักษาสัดส่วน
   - ไม่ crop
   - ไม่ rotate
   - ลดขนาดเฉพาะสำเนา OCR
========================================================= */

async function prepareOCRImage(
  file
) {

  const img =
    await loadImage(file);


  const originalWidth =
    img.naturalWidth ||
    img.width;

  const originalHeight =
    img.naturalHeight ||
    img.height;


  if (
    !originalWidth ||
    !originalHeight
  ) {

    throw new Error(
      "ไม่สามารถอ่านขนาดรูปภาพได้"
    );

  }


  /*
    ขนาด OCR สูงสุด
    ลดจาก 3600 เพื่อให้เร็วขึ้น
  */

  const MAX_SIZE =
    2600;


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


  /*
    สำคัญ:
    วาดทั้งรูป
    ไม่ crop
    ไม่เปลี่ยนอัตราส่วน
  */

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
   GRAYSCALE COPY
========================================================= */

function createGrayCanvas(
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
      Math.round(
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114
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
   OCR TEXT CLEAN
========================================================= */

function cleanOCRText(
  text
) {

  if (!text) {
    return "";
  }


  let result =
    String(text)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();


  /* -----------------------------------------
     คำไทยที่ Tesseract อ่านเพี้ยนบ่อย
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
    const pair
    of replacements
  ) {

    result =
      result.split(
        pair[0]
      ).join(
        pair[1]
      );

  }


  /* -----------------------------------------
     English คำที่ถูกตัดบรรทัด
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


  /* -----------------------------------------
     แยกบรรทัด
  ----------------------------------------- */

  const lines =
    result
      .split("\n")
      .map(
        line =>
          line
            .trim()
            .replace(/\s{2,}/g, " ")
      )
      .filter(Boolean);


  const cleanedLines = [];


  for (
    const line
    of lines
  ) {

    const compact =
      line.replace(
        /\s/g,
        ""
      );


    if (!compact) {
      continue;
    }


    /* ---------------------------------------
       noise ที่แน่นอน
    --------------------------------------- */

    if (
      /^(Ww|W|ww|ศศ|ศ)$/i.test(
        compact
      )
    ) {
      continue;
    }


    if (
      /^(unknown|unknown[-_]?|[-_]?unknown)$/i.test(
        compact
      )
    ) {
      continue;
    }


    /*
      OCR อาจอ่าน unknown เป็น
      unhmvn / unkn0wn / unk... 
      ถ้าเป็นบรรทัดสั้น ๆ ที่ดูเป็น
      noise ให้ตัดออก
    */

    if (
      /^[a-z]{5,8}$/i.test(
        compact
      ) &&
      !/[aeiou]{2,}/i.test(
        compact
      )
    ) {

      const suspicious =
        /^(unhmvn|unhmw|unknwn|unkn0wn|unknvn|unhnvn)$/i;

      if (
        suspicious.test(
          compact
        )
      ) {
        continue;
      }

    }


    /* ---------------------------------------
       บรรทัดที่มีแต่เครื่องหมาย
    --------------------------------------- */

    if (
      /^[\W_]+$/u.test(
        compact
      )
    ) {
      continue;
    }


    /* ---------------------------------------
       ตัวอักษรเดี่ยวที่ไม่ใช่ข้อความ
    --------------------------------------- */

    if (
      compact.length === 1 &&
      !/[ก-๙a-zA-Z0-9]/.test(
        compact
      )
    ) {
      continue;
    }


    cleanedLines.push(
      line
    );

  }


  /* -----------------------------------------
     รวมบรรทัดที่เป็นคำเดียวกัน
  ----------------------------------------- */

  const mergedLines = [];


  for (
    let i = 0;
    i < cleanedLines.length;
    i++
  ) {

    const current =
      cleanedLines[i];


    const next =
      cleanedLines[i + 1] || "";


    /*
      English ที่ถูกแบ่งเป็นคำ
    */

    if (
      /^[A-Za-z]+$/.test(
        current
      ) &&
      /^[A-Za-z]+$/.test(
        next
      ) &&
      current.length <= 15 &&
      next.length <= 8
    ) {

      const combined =
        current +
        next;


      /*
        เฉพาะกรณีที่ดูเหมือน
        คำเดียวที่ถูกตัด
      */

      if (
        /^(Recommend|immediate|consume|available|plastic|English|because|something)/i.test(
          combined
        )
      ) {

        mergedLines.push(
          combined
        );

        i++;

        continue;

      }

    }


    mergedLines.push(
      current
    );

  }


  /* -----------------------------------------
     ลบ duplicate line ที่ติดกัน
  ----------------------------------------- */

  const uniqueLines = [];


  for (
    const line
    of mergedLines
  ) {

    const normalized =
      line
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();


    const previous =
      uniqueLines.length
        ? uniqueLines[
            uniqueLines.length - 1
          ]
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim()
        : "";


    if (
      normalized &&
      normalized !== previous
    ) {

      uniqueLines.push(
        line
      );

    }

  }


  return uniqueLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

}


/* =========================================================
   OCR QUALITY SCORE
========================================================= */

function calculateOCRScore(
  rawText,
  cleanText,
  confidence
) {

  if (!cleanText) {
    return -999999;
  }


  const raw =
    String(rawText || "")
      .trim();


  const clean =
    String(cleanText || "")
      .trim();


  const compact =
    clean.replace(
      /\s/g,
      ""
    );


  const usefulChars =
    (
      compact.match(
        /[ก-๙a-zA-Z0-9]/g
      ) || []
    ).length;


  const thaiChars =
    (
      compact.match(
        /[ก-๙]/g
      ) || []
    ).length;


  const englishChars =
    (
      compact.match(
        /[a-zA-Z]/g
      ) || []
    ).length;


  const strangeChars =
    (
      compact.match(
        /[^\u0E00-\u0E7Fa-zA-Z0-9.,!?'"“”‘’():;%\-–—/]/g
      ) || []
    ).length;


  const lines =
    clean
      .split("\n")
      .map(
        x => x.trim()
      )
      .filter(Boolean);


  let score = 0;


  /*
    ความมั่นใจ
  */

  score +=
    Number(
      confidence || 0
    ) * 0.50;


  /*
    ตัวอักษรจริง
  */

  score +=
    Math.min(
      usefulChars,
      220
    ) * 0.45;


  /*
    ให้คะแนนข้อความหลายบรรทัด
    แต่ไม่ให้ผลที่มี noise เยอะได้เปรียบ
  */

  score +=
    Math.min(
      lines.length,
      8
    ) * 7;


  /*
    ภาษาไทย / อังกฤษจริง
  */

  if (thaiChars > 0) {

    score +=
      Math.min(
        thaiChars,
        80
      ) * 0.12;

  }


  if (englishChars > 0) {

    score +=
      Math.min(
        englishChars,
        100
      ) * 0.08;

  }


  /*
    ลงโทษ noise
  */

  score -=
    strangeChars * 5;


  let veryShortLines =
    0;


  let garbageLines =
    0;


  let suspiciousEnglishLines =
    0;


  for (
    const line
    of lines
  ) {

    const c =
      line.replace(
        /\s/g,
        ""
      );


    if (
      c.length <= 2
    ) {

      veryShortLines++;

    }


    const useful =
      (
        c.match(
          /[ก-๙a-zA-Z0-9]/g
        ) || []
      ).length;


    if (
      c.length >= 4 &&
      useful / c.length < 0.45
    ) {

      garbageLines++;

    }


    /*
      คำอังกฤษแปลก ๆ ที่เป็น noise
    */

    if (
      /^[A-Za-z]{5,12}$/.test(
        c
      ) &&
      !/[aeiou]{2,}/i.test(
        c
      )
    ) {

      suspiciousEnglishLines++;

    }

  }


  score -=
    veryShortLines * 10;


  score -=
    garbageLines * 18;


  score -=
    suspiciousEnglishLines * 12;


  /*
    ถ้ามีบรรทัดเยอะผิดปกติ
    มีโอกาสเป็น OCR ขยะ
  */

  if (
    lines.length > 10
  ) {

    score -=
      (lines.length - 10) *
      10;

  }


  /*
    ถ้าข้อความยาวมากแบบไม่มีช่องว่าง
    มักเป็น OCR noise
  */

  if (
    compact.length > 300 &&
    lines.length <= 2
  ) {

    score -= 50;

  }


  /*
    ถ้า raw มีคำ unknown
    ลงคะแนนผลนั้น
  */

  if (
    /unknown/i.test(
      raw
    )
  ) {

    score -= 35;

  }


  return score;

}


/* =========================================================
   RECOGNIZE
========================================================= */

async function recognizeImage(
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


  const text =
    result &&
    result.data
      ? result.data.text || ""
      : "";


  const confidence =
    result &&
    result.data &&
    typeof result.data.confidence ===
      "number"
      ? result.data.confidence
      : 0;


  return {
    text,
    confidence
  };

}


/* =========================================================
   RUN OCR
   3 PASSES ONLY
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


    const canvas =
      await prepareOCRImage(
        file
      );


    /*
      PASS 1
      รูปเต็ม
      PSM 6
    */

    showLoading(
      "กำลังอ่านข้อความจากรูป..."
    );


    const pass1 =
      await recognizeImage(
        worker,
        canvas,
        6
      );


    /*
      PASS 2
      grayscale
      PSM 6
    */

    showLoading(
      "กำลังตรวจข้อความ..."
    );


    const grayCanvas =
      createGrayCanvas(
        canvas
      );


    const pass2 =
      await recognizeImage(
        worker,
        grayCanvas,
        6
      );


    /*
      PASS 3
      รูปเต็ม
      PSM 11
      เหมาะกับข้อความที่แยกหลายตำแหน่ง
    */

    showLoading(
      "กำลังตรวจข้อความอีกครั้ง..."
    );


    const pass3 =
      await recognizeImage(
        worker,
        canvas,
        11
      );


    /* -----------------------------------------
       CLEAN
    ----------------------------------------- */

    const candidates = [

      {
        name:
          "full-normal",

        raw:
          pass1.text,

        text:
          cleanOCRText(
            pass1.text
          ),

        confidence:
          pass1.confidence

      },


      {
        name:
          "full-gray",

        raw:
          pass2.text,

        text:
          cleanOCRText(
            pass2.text
          ),

        confidence:
          pass2.confidence

      },


      {
        name:
          "full-sparse",

        raw:
          pass3.text,

        text:
          cleanOCRText(
            pass3.text
          ),

        confidence:
          pass3.confidence

      }

    ];


    /* -----------------------------------------
       SCORE
    ----------------------------------------- */

    for (
      const candidate
      of candidates
    ) {

      candidate.score =
        calculateOCRScore(
          candidate.raw,
          candidate.text,
          candidate.confidence
        );

    }


    /*
      เรียงผล
    */

    candidates.sort(
      (a, b) =>
        b.score -
        a.score
    );


    const best =
      candidates[0];


    if (
      !best ||
      !best.text
    ) {

      throw new Error(
        "ไม่พบข้อความในรูปภาพ"
      );

    }


    /*
      ป้องกันกรณี OCR เลือก
      ผลที่เป็นคำ noise อย่างเดียว
    */

    if (
      /^[-_\s]*(unknown|unhmvn|unhmw|unknwn)[-_\s]*$/i.test(
        best.text
      )
    ) {

      const alternative =
        candidates.find(
          candidate =>
            candidate.text &&
            !/^[-_\s]*(unknown|unhmvn|unhmw|unknwn)[-_\s]*$/i.test(
              candidate.text
            )
        );


      if (alternative) {

        best.text =
          alternative.text;

      }

    }


    /* -----------------------------------------
       แสดงผล
    ----------------------------------------- */

    if (ocrText) {

      ocrText.value =
        best.text;

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

      ocrText.value =
        "";

    }


    showStatus(
      "อ่านตัวอักษรจากรูปไม่สำเร็จ ลองใช้รูปที่คมชัดและเห็นข้อความครบค่ะ",
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


  isTranslating =
    true;


  if (translateButton) {

    translateButton.disabled =
      true;

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

  if (!text) {
    return "";
  }


  const result =
    String(text)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();


  const lines =
    result
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);


  const unique = [];


  for (
    const line
    of lines
  ) {

    const normalized =
      line
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();


    let duplicate =
      false;


    for (
      const oldLine
      of unique
    ) {

      const oldNormalized =
        oldLine
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();


      if (
        normalized ===
        oldNormalized
      ) {

        duplicate =
          true;

        break;

      }


      const a =
        normalized
          .split(/\s+/)
          .filter(Boolean);


      const b =
        oldNormalized
          .split(/\s+/)
          .filter(Boolean);


      if (
        a.length >= 4 &&
        b.length >= 4
      ) {

        const setB =
          new Set(b);


        let same =
          0;


        for (
          const word
          of a
        ) {

          if (
            setB.has(word)
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
          overlap >= 0.82
        ) {

          duplicate =
            true;

          break;

        }

      }

    }


    if (!duplicate) {

      unique.push(
        line
      );

    }

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

  if (!text) {
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


    if (tesseractWorker) {

      tesseractWorker
        .terminate()
        .catch(
          () => {}
        );

    }

  }
);
