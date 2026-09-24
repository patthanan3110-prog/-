/* =========================================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   OCR + Translation

   VERSION 26

   จุดแก้หลัก:
   - ใช้ภาพต้นฉบับเป็นหลัก
   - ไม่ใช้ sharpen
   - ไม่ใช้ contrast
   - PSM 11 สำหรับข้อความหลายตำแหน่ง
   - PSM 6 เป็น fallback
   - กรอง noise ระดับ word
   - กรองบรรทัด OCR ที่ผิดธรรมชาติ
   - กรองคำอังกฤษยาวติดกันแบบ noise
   - กรองตัวอักษรอังกฤษสลับพิมพ์ใหญ่/เล็กผิดธรรมชาติ
   - กรองบรรทัดไทยที่มีตัวเลข/สัญลักษณ์ผิดปกติ
   - แก้ภาษาไทยที่ OCR แยกตัวอักษรออกจากกัน
   - รวมชิ้นภาษาไทยกลับเป็นคำ/ประโยค
   - ลดช่องว่างที่เกิดจาก OCR ภาษาไทย
   - รองรับ Camera + Gallery
   - ไม่ hardcode รูปตัวอย่าง
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


  const commonParameters = {

    preserve_interword_spaces:
      "1",

    user_defined_dpi:
      "300"

  };


  await thaiWorker.setParameters(
    commonParameters
  );


  await englishWorker.setParameters(
    commonParameters
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
   HANDLE IMAGE
========================================================= */

function handleImageFile(
  file
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
  file
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
    3000;


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


  ctx.imageSmoothingEnabled =
    true;


  ctx.imageSmoothingQuality =
    "high";


  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
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


  const data =
    result &&
    result.data
      ? result.data
      : {};


  return data;

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
   WORD QUALITY
========================================================= */

function getWordQuality(
  word
) {

  if (!word)
    return {
      confidence: 0,
      useful: 0
    };


  const text =
    cleanText(
      word.text || ""
    );


  const confidence =
    Number(
      word.confidence || 0
    );


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
    english;


  return {

    confidence,
    thai,
    english,
    digits,
    useful

  };

}


/* =========================================================
   ENGLISH WORD QUALITY
========================================================= */

function englishWordLooksReal(
  word,
  confidence
) {

  if (!word)
    return false;


  let text =
    String(word)
      .trim();


  text =
    text.replace(
      /^[^a-zA-Z]+|[^a-zA-Z]+$/g,
      ""
    );


  if (!text)
    return false;


  const lower =
    text.toLowerCase();


  const letters =
    lower.length;


  const vowels =
    (
      lower.match(
        /[aeiouy]/g
      ) || []
    ).length;


  const consonants =
    (
      lower.match(
        /[bcdfghjklmnpqrstvwxz]/g
      ) || []
    ).length;


  const unique =
    new Set(
      lower.split("")
    ).size;


  if (
    letters <= 4
  ) {

    return (
      confidence >= 30 &&
      vowels >= 1
    );

  }


  if (
    letters >= 7 &&
    vowels === 0 &&
    confidence < 85
  ) {

    return false;

  }


  if (
    /(.)\1\1\1/i.test(
      lower
    ) &&
    confidence < 80
  ) {

    return false;

  }


  if (
    letters >= 9 &&
    unique <= 3 &&
    confidence < 80
  ) {

    return false;

  }


  if (
    letters >= 18 &&
    confidence < 82
  ) {

    return false;

  }


  if (
    letters >= 9 &&
    vowels <= 1 &&
    consonants >= 6 &&
    confidence < 78
  ) {

    return false;

  }


  if (
    confidence < 35 &&
    letters >= 6
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   THAI WORD QUALITY
========================================================= */

function thaiWordLooksReal(
  word,
  confidence
) {

  if (!word)
    return false;


  const text =
    String(word)
      .trim();


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


  if (
    thai === 0
  ) {

    return false;

  }


  if (
    confidence < 55 &&
    (
      english +
      digits
    ) > thai
  ) {

    return false;

  }


  if (
    thai <= 2 &&
    confidence < 35
  ) {

    return false;

  }


  const symbols =
    (
      text.match(
        /[^ก-๙a-zA-Z0-9๐-๙\s]/g
      ) || []
    ).length;


  if (
    confidence < 50 &&
    symbols >= 4 &&
    symbols >= thai
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   GET LINE WORDS
========================================================= */

function getLineWords(
  data,
  line
) {

  if (
    !Array.isArray(
      data.words
    )
  ) {

    return [];

  }


  const lineBox =
    line.bbox || {};


  const x0 =
    Number(
      lineBox.x0 || 0
    );


  const y0 =
    Number(
      lineBox.y0 || 0
    );


  const x1 =
    Number(
      lineBox.x1 || 0
    );


  const y1 =
    Number(
      lineBox.y1 || 0
    );


  const words = [];


  for (
    const word
    of data.words
  ) {

    const box =
      word.bbox || {};


    const wx0 =
      Number(
        box.x0 || 0
      );


    const wy0 =
      Number(
        box.y0 || 0
      );


    const wx1 =
      Number(
        box.x1 || 0
      );


    const wy1 =
      Number(
        box.y1 || 0
      );


    const centerX =
      (wx0 + wx1) / 2;


    const centerY =
      (wy0 + wy1) / 2;


    const inside =
      centerX >= x0 - 10 &&
      centerX <= x1 + 10 &&
      centerY >= y0 - 10 &&
      centerY <= y1 + 10;


    if (inside) {

      words.push(
        word
      );

    }

  }


  words.sort(
    (a, b) => {

      const ax =
        Number(
          a &&
          a.bbox &&
          a.bbox.x0
            ? a.bbox.x0
            : 0
        );


      const bx =
        Number(
          b &&
          b.bbox &&
          b.bbox.x0
            ? b.bbox.x0
            : 0
        );


      return ax - bx;

    }
  );


  return words;

}


/* =========================================================
   CLEAN THAI OCR SEGMENTS
========================================================= */

function cleanThaiSegments(
  segments
) {

  if (
    !Array.isArray(
      segments
    ) ||
    segments.length === 0
  ) {

    return "";

  }


  let result =
    "";


  for (
    const segment
    of segments
  ) {

    let text =
      String(
        segment || ""
      ).trim();


    if (!text)
      continue;


    /*
      ลบช่องว่างที่ OCR แทรก
      ระหว่างพยัญชนะ/สระ/วรรณยุกต์
    */

    text =
      text.replace(
        /\s+/g,
        ""
      );


    /*
      ถ้าเป็นภาษาไทย ให้ต่อกัน
      ถ้าเป็นอังกฤษหรือตัวเลข
      เว้นช่องว่างไว้
    */

    if (
      /[ก-๙]/.test(
        text
      )
    ) {

      result +=
        text;

    } else {

      if (
        result &&
        !result.endsWith(" ")
      ) {

        result +=
          " ";

      }


      result +=
        text;


      result +=
        " ";

    }

  }


  result =
    result
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\s+([ๆฯะาเแโใไ่้๊๋็์])/g,
        "$1"
      )
      .replace(
        /([เแโใไ])\s+/g,
        "$1"
      )
      .trim();


  /*
    แก้กรณีที่ OCR แยกสระ/วรรณยุกต์
    ออกมาเป็นช่องว่าง
  */

  result =
    result.replace(
      /([ก-๙])\s+([ก-๙])/g,
      "$1$2"
    );


  return result.trim();

}


/* =========================================================
   FILTER ENGLISH WORDS
========================================================= */

function filterEnglishLineWords(
  line,
  data
) {

  const words =
    getLineWords(
      data,
      line
    );


  if (
    words.length === 0
  ) {

    return cleanText(
      line.text
    );

  }


  const accepted = [];


  for (
    const word
    of words
  ) {

    const text =
      cleanText(
        word.text || ""
      );


    if (!text)
      continue;


    const confidence =
      Number(
        word.confidence || 0
      );


    const english =
      countEnglish(
        text
      );


    const thai =
      countThai(
        text
      );


    if (
      thai > english
    ) {

      continue;

    }


    if (
      english === 0
    ) {

      continue;

    }


    if (
      englishWordLooksReal(
        text,
        confidence
      )
    ) {

      accepted.push(
        text
      );

    }

  }


  if (
    accepted.length === 0
  ) {

    const lineConfidence =
      Number(
        line.confidence || 0
      );


    if (
      lineConfidence >= 82 &&
      countEnglish(
        line.text
      ) >= 2
    ) {

      return cleanText(
        line.text
      );

    }


    return "";

  }


  return accepted.join(
    " "
  );

}


/* =========================================================
   FILTER THAI WORDS
========================================================= */

function filterThaiLineWords(
  line,
  data
) {

  const words =
    getLineWords(
      data,
      line
    );


  if (
    words.length === 0
  ) {

    return cleanThaiSegments(
      String(
        line.text || ""
      ).split(/\s+/)
    );

  }


  const accepted = [];


  for (
    const word
    of words
  ) {

    const text =
      cleanText(
        word.text || ""
      );


    if (!text)
      continue;


    const confidence =
      Number(
        word.confidence || 0
      );


    if (
      thaiWordLooksReal(
        text,
        confidence
      )
    ) {

      accepted.push(
        text
      );

    }

  }


  if (
    accepted.length === 0
  ) {

    const lineConfidence =
      Number(
        line.confidence || 0
      );


    if (
      lineConfidence >= 82 &&
      countThai(
        line.text
      ) >= 4
    ) {

      return cleanThaiSegments(
        String(
          line.text || ""
        ).split(/\s+/)
      );

    }


    return "";

  }


  /*
    สำคัญ:
    ภาษาไทยไม่ควรเอาแต่ละ OCR word
    มาต่อด้วยช่องว่างเหมือนภาษาอังกฤษ

    จึงใช้การรวมชิ้นไทยกลับเข้าด้วยกัน
  */

  return cleanThaiSegments(
    accepted
  );

}


/* =========================================================
   THAI LINE QUALITY
========================================================= */

function isGoodThaiLine(
  line,
  data
) {

  const text =
    cleanText(
      line.text
    );


  if (!text)
    return false;


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


  const confidence =
    Number(
      line.confidence ||
      data.confidence ||
      0
    );


  if (
    thai < 3
  ) {

    return false;

  }


  const words =
    getLineWords(
      data,
      line
    );


  if (
    words.length >= 2
  ) {

    let goodWords =
      0;


    let totalConfidence =
      0;


    let thaiWords =
      0;


    for (
      const word
      of words
    ) {

      const quality =
        getWordQuality(
          word
        );


      if (
        quality.thai > 0
      ) {

        thaiWords++;

        totalConfidence +=
          quality.confidence;


        if (
          thaiWordLooksReal(
            word.text,
            quality.confidence
          )
        ) {

          goodWords++;

        }

      }

    }


    const averageConfidence =
      totalConfidence /
      Math.max(
        thaiWords,
        1
      );


    if (
      thaiWords >= 2 &&
      goodWords === 0 &&
      confidence < 70
    ) {

      return false;

    }


    if (
      averageConfidence < 22 &&
      confidence < 65
    ) {

      return false;

    }

  }


  if (
    confidence < 55 &&
    (
      english +
      digits
    ) >
      thai * 0.7
  ) {

    return false;

  }


  const symbols =
    (
      text.match(
        /[^ก-๙a-zA-Z0-9๐-๙\s]/g
      ) || []
    ).length;


  if (
    confidence < 50 &&
    symbols >
      Math.max(
        4,
        thai * 0.4
      )
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   ENGLISH LINE QUALITY
========================================================= */

function isGoodEnglishLine(
  line,
  data
) {

  const text =
    cleanText(
      line.text
    );


  if (!text)
    return false;


  const english =
    countEnglish(
      text
    );


  const thai =
    countThai(
      text
    );


  const digits =
    countDigits(
      text
    );


  const confidence =
    Number(
      line.confidence ||
      data.confidence ||
      0
    );


  if (
    english < 2
  ) {

    return false;

  }


  if (
    thai >
    english
  ) {

    return false;

  }


  const words =
    getLineWords(
      data,
      line
    );


  if (
    words.length >= 2
  ) {

    let goodWords =
      0;


    let englishWords =
      0;


    let totalConfidence =
      0;


    for (
      const word
      of words
    ) {

      const wordText =
        cleanText(
          word.text || ""
        );


      const wordEnglish =
        countEnglish(
          wordText
        );


      const wordThai =
        countThai(
          wordText
        );


      if (
        wordEnglish > 0 &&
        wordEnglish >= wordThai
      ) {

        englishWords++;


        const quality =
          getWordQuality(
            word
          );


        totalConfidence +=
          quality.confidence;


        if (
          englishWordLooksReal(
            wordText,
            quality.confidence
          )
        ) {

          goodWords++;

        }

      }

    }


    const averageConfidence =
      totalConfidence /
      Math.max(
        englishWords,
        1
      );


    if (
      englishWords >= 2 &&
      goodWords === 0 &&
      confidence < 82
    ) {

      return false;

    }


    if (
      averageConfidence < 22 &&
      confidence < 65
    ) {

      return false;

    }

  }


  if (
    confidence < 55 &&
    digits >
      english * 0.5
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   EXTRACT LINES
========================================================= */

function extractLines(
  data,
  language
) {

  const result = [];


  if (
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

    const rawText =
      cleanText(
        line.text || ""
      );


    if (!rawText)
      continue;


    const bbox =
      line.bbox || {};


    let filteredText =
      "";


    if (
      language === "th"
    ) {

      if (
        !isGoodThaiLine(
          line,
          data
        )
      ) {

        continue;

      }


      filteredText =
        filterThaiLineWords(
          line,
          data
        );

    } else {

      if (
        !isGoodEnglishLine(
          line,
          data
        )
      ) {

        continue;

      }


      filteredText =
        filterEnglishLineWords(
          line,
          data
        );

    }


    filteredText =
      cleanText(
        filteredText
      );


    if (!filteredText)
      continue;


    result.push({

      text:
        filteredText,

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


  return result;

}


/* =========================================================
   NORMALIZE LINE
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

      if (
        lineSimilarity(
          line.text,
          old.text
        ) >= 0.80
      ) {

        if (
          Number(
            line.confidence || 0
          ) >
          Number(
            old.confidence || 0
          )
        ) {

          Object.assign(
            old,
            line
          );

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
   FINAL ENGLISH NOISE DETECTOR
========================================================= */

function isEnglishNoiseLine(
  text
) {

  const value =
    cleanText(
      text
    );


  if (!value)
    return true;


  const english =
    countEnglish(
      value
    );


  const thai =
    countThai(
      value
    );


  if (
    english === 0
  ) {

    return false;

  }


  if (
    thai > english
  ) {

    return false;

  }


  const words =
    value
      .split(/\s+/)
      .filter(Boolean);


  /*
    คำเดียวที่ยาวมาก
    และไม่มีลักษณะเป็นประโยค
  */

  if (
    words.length === 1 &&
    english >= 15
  ) {

    const word =
      words[0]
        .replace(
          /[^a-zA-Z]/g,
          ""
        );


    const lower =
      word.toLowerCase();


    const vowels =
      (
        lower.match(
          /[aeiouy]/g
        ) || []
      ).length;


    const consonants =
      (
        lower.match(
          /[bcdfghjklmnpqrstvwxz]/g
        ) || []
      ).length;


    const unique =
      new Set(
        lower.split("")
      ).size;


    if (
      vowels <= 3 ||
      consonants >= 10 ||
      unique <= 6
    ) {

      return true;

    }

  }


  if (
    english >= 20 &&
    words.length <= 2
  ) {

    const joined =
      value.replace(
        /\s/g,
        ""
      );


    const vowels =
      (
        joined
          .toLowerCase()
          .match(
            /[aeiouy]/g
          ) || []
      ).length;


    if (
      vowels <= 5
    ) {

      return true;

    }

  }


  if (
    english >= 10
  ) {

    const mixedPattern =
      (
        value.match(
          /[a-z][A-Z][a-z][A-Z]/g
        ) || []
      ).length;


    const upperPattern =
      (
        value.match(
          /[A-Z][a-z][A-Z][a-z]/g
        ) || []
      ).length;


    if (
      mixedPattern >= 2 ||
      upperPattern >= 2
    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   FINAL THAI NOISE DETECTOR
========================================================= */

function isThaiNoiseLine(
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


  if (
    thai === 0
  ) {

    return false;

  }


  if (
    digits >= 3 &&
    digits >= thai
  ) {

    return true;

  }


  if (
    english > thai * 0.8
  ) {

    return true;

  }


  const symbols =
    (
      value.match(
        /[^ก-๙a-zA-Z0-9๐-๙\s]/g
      ) || []
    ).length;


  if (
    symbols >= 5 &&
    symbols >= thai * 0.7
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   FINAL OCR NOISE
========================================================= */

function isFinalOCRNoise(
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


  if (
    letters === 0
  ) {

    return true;

  }


  if (
    english > 0 &&
    thai === 0
  ) {

    if (
      isEnglishNoiseLine(
        text
      )
    ) {

      return true;

    }

  }


  if (
    thai > 0
  ) {

    if (
      isThaiNoiseLine(
        text
      )
    ) {

      return true;

    }

  }


  if (
    digits > letters &&
    letters < 8
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   MERGE THAI TEXT
========================================================= */

function normalizeThaiText(
  text
) {

  if (!text)
    return "";


  let value =
    String(text)
      .replace(
        /\r/g,
        ""
      );


  /*
    ลบช่องว่างระหว่างตัวอักษรไทย
    ที่เกิดจาก OCR

    เช่น
    เธ อ ไม ่ ได ้
    ↓
    เธอไม่ได ้
  */

  value =
    value.replace(
      /([ก-๙])\s+(?=[ก-๙])/g,
      "$1"
    );


  /*
    ลบช่องว่างก่อนสระ/วรรณยุกต์
  */

  value =
    value.replace(
      /\s+([ะาิีึืุูัเแโใไำ่้๊๋็์ๆฯ])/g,
      "$1"
    );


  /*
    ลบช่องว่างหลังสระนำ
  */

  value =
    value.replace(
      /([เแโใไ])\s+(?=[ก-๙])/g,
      "$1"
    );


  /*
    ลบช่องว่างที่เหลือระหว่างภาษาไทย
    แต่ไม่ลบช่องว่างก่อนภาษาอังกฤษ
  */

  value =
    value.replace(
      /([ก-๙])\s+([ก-๙])/g,
      "$1$2"
    );


  value =
    value.replace(
      /[ \t]+/g,
      " "
    );


  return value.trim();

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


  unique.sort(
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


      const height =
        Math.max(
          12,
          Math.min(
            a.height || 20,
            b.height || 20
          )
        );


      if (
        Math.abs(
          ay - by
        ) <=
        height * 0.65
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


  const output = [];


  for (
    const item
    of unique
  ) {

    let text =
      item.text;


    if (
      item.language === "th"
    ) {

      text =
        normalizeThaiText(
          text
        );

    }


    if (text) {

      output.push(
        text
      );

    }

  }


  return output
    .join("\n")
    .trim();

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
    String(text)
      .split("\n")
      .map(
        line =>
          cleanText(
            line
          )
      )
      .filter(Boolean);


  const result = [];


  for (
    const rawLine
    of lines
  ) {

    let line =
      rawLine;


    /*
      ถ้ามีภาษาไทย
      จัดช่องว่างใหม่
    */

    if (
      /[ก-๙]/.test(
        line
      )
    ) {

      line =
        normalizeThaiText(
          line
        );

    }


    if (!line)
      continue;


    if (
      isFinalOCRNoise(
        line
      )
    ) {

      continue;

    }


    const normalized =
      normalizeLine(
        line
      );


    const duplicate =
      result.some(
        old =>
          normalizeLine(old) ===
          normalized
      );


    if (
      duplicate
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


    const canvas =
      await prepareOCRImage(
        file
      );


    /*
      PASS 1
    */

    showLoading(
      "กำลังอ่านข้อความภาษาไทย..."
    );


    const thaiResult =
      await recognizeOCR(
        workers.thai,
        canvas,
        11
      );


    showLoading(
      "กำลังอ่านข้อความภาษาอังกฤษ..."
    );


    const englishResult =
      await recognizeOCR(
        workers.english,
        canvas,
        11
      );


    let thaiLines =
      extractLines(
        thaiResult,
        "th"
      );


    let englishLines =
      extractLines(
        englishResult,
        "en"
      );


    /*
      PASS 2
    */

    if (
      thaiLines.length === 0
    ) {

      showLoading(
        "กำลังตรวจภาษาไทยเพิ่มเติม..."
      );


      const thaiFallback =
        await recognizeOCR(
          workers.thai,
          canvas,
          6
        );


      thaiLines =
        extractLines(
          thaiFallback,
          "th"
        );

    }


    if (
      englishLines.length === 0
    ) {

      showLoading(
        "กำลังตรวจภาษาอังกฤษเพิ่มเติม..."
      );


      const englishFallback =
        await recognizeOCR(
          workers.english,
          canvas,
          6
        );


      englishLines =
        extractLines(
          englishFallback,
          "en"
        );

    }


    thaiLines =
      deduplicateLines(
        thaiLines
      );


    englishLines =
      deduplicateLines(
        englishLines
      );


    let finalText =
      mergeLines(
        thaiLines,
        englishLines
      );


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
