/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js

   OCR:
   Tesseract.js

   UPDATE:
   - OCR สำหรับภาพถ่ายจริง
   - OCR ไทย + อังกฤษ
   - ครอปข้อความตรงกลาง
   - ขยายภาพก่อน OCR
   - ปรับภาพหลายแบบ
   - เลือกผล OCR ที่มีคุณภาพที่สุด
   - แก้คำ OCR ภาษาไทยที่พบบ่อย
   - ลบเครดิต OCR
   - ลบข้อความแปลซ้ำ
   - ลบข้อความแปลที่คล้ายกันมาก
========================================= */


/* =========================================
   CONFIG
========================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyv4x3GhyXGKGQvWfmh-lKForJ_OV7BVtoglDGsGjtNYID8cf1Lwkog3rk3ROLJJsng/exec";


let sourceLanguage = "th";
let targetLanguage = "en";

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

      script.onload =
        function() {

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
        function() {

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
        logger:
          function(message) {

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
                  (message.progress || 0) *
                  100
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

  return tesseractWorker;
}


/* =========================================
   DOM
========================================= */

const inputText =
  document.getElementById(
    "inputText"
  );

const resultText =
  document.getElementById(
    "resultText"
  );

const ocrText =
  document.getElementById(
    "ocrText"
  );

const ocrCard =
  document.getElementById(
    "ocrCard"
  );

const loadingBox =
  document.getElementById(
    "loadingBox"
  );

const loadingText =
  document.getElementById(
    "loadingText"
  );

const statusMessage =
  document.getElementById(
    "statusMessage"
  );

const cameraInput =
  document.getElementById(
    "cameraInput"
  );

const galleryInput =
  document.getElementById(
    "galleryInput"
  );

const imagePreviewContainer =
  document.getElementById(
    "imagePreviewContainer"
  );

const imagePreview =
  document.getElementById(
    "imagePreview"
  );

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
      resultText.classList.contains(
        "empty"
      )
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

    if (!file) {
      return;
    }

    handleSelectedImage(file);

  }
);


galleryInput.addEventListener(
  "change",
  function(event) {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    handleSelectedImage(file);

  }
);


function handleSelectedImage(file) {

  if (
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
    options.cropX !== undefined
      ? options.cropX
      : 0;

  const cropY =
    options.cropY !== undefined
      ? options.cropY
      : 0;

  const cropWidth =
    options.cropWidth !== undefined
      ? options.cropWidth
      : img.naturalWidth;

  const cropHeight =
    options.cropHeight !== undefined
      ? options.cropHeight
      : img.naturalHeight;

  const targetWidth =
    options.targetWidth ||
    3000;


  const scale =
    targetWidth /
    cropWidth;


  const targetHeight =
    Math.max(
      1,
      Math.round(
        cropHeight * scale
      )
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
        willReadFrequently:
          true
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
    canvas.width,
    canvas.height
  );


  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );


  return canvas;

}


/* =========================================
   IMAGE PROCESSING
========================================= */

function processOCRCanvas(
  canvas,
  mode
) {

  if (
    mode === "raw"
  ) {

    return canvas;

  }


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
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


  let contrast =
    1.22;


  if (
    mode === "strong"
  ) {

    contrast =
      1.38;

  }


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


    if (
      mode === "threshold"
    ) {

      gray =
        gray < 165
          ? 0
          : 255;

    } else {

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

    }


    pixels[i] =
      gray;

    pixels[i + 1] =
      gray;

    pixels[i + 2] =
      gray;

  }


  ctx.putImageData(
    imageData,
    0,
    0
  );


  return canvas;

}


/* =========================================
   PREPARE OCR IMAGE
========================================= */

async function prepareOCRImage(
  file,
  variant
) {

  const img =
    await loadImageFromFile(file);


  const width =
    img.naturalWidth;

  const height =
    img.naturalHeight;


  let cropX =
    0;

  let cropY =
    0;

  let cropWidth =
    width;

  let cropHeight =
    height;

  let targetWidth =
    3200;

  let processing =
    "raw";


  /*
    บริเวณข้อความตรงกลาง
    เหมาะกับรูปตัวอย่างของเพื่อน
    และรูปข้อความทั่วไป
  */

  if (
    variant === "center-raw" ||
    variant === "center-gray" ||
    variant === "center-threshold" ||
    variant === "center-strong"
  ) {

    cropX =
      Math.round(
        width * 0.07
      );

    cropY =
      Math.round(
        height * 0.12
      );

    cropWidth =
      Math.round(
        width * 0.86
      );

    cropHeight =
      Math.round(
        height * 0.76
      );

    targetWidth =
      3600;


    processing =
      variant.replace(
        "center-",
        ""
      );

  }


  /*
    ครอปกว้างขึ้น
    เผื่อข้อความอยู่ค่อนไปทางขอบ
  */

  else if (
    variant === "center-wide"
  ) {

    cropX =
      Math.round(
        width * 0.03
      );

    cropY =
      Math.round(
        height * 0.07
      );

    cropWidth =
      Math.round(
        width * 0.94
      );

    cropHeight =
      Math.round(
        height * 0.84
      );

    targetWidth =
      3600;

    processing =
      "raw";

  }


  /*
    ส่วนกลางด้านบน
  */

  else if (
    variant === "upper-center"
  ) {

    cropX =
      Math.round(
        width * 0.08
      );

    cropY =
      Math.round(
        height * 0.08
      );

    cropWidth =
      Math.round(
        width * 0.84
      );

    cropHeight =
      Math.round(
        height * 0.72
      );

    targetWidth =
      3600;

    processing =
      "gray";

  }


  /*
    ภาพเต็ม + grayscale
  */

  else if (
    variant === "full-gray"
  ) {

    targetWidth =
      Math.min(
        3600,
        Math.max(
          2800,
          width
        )
      );

    processing =
      "gray";

  }


  /*
    ภาพเต็ม + threshold
  */

  else if (
    variant === "full-threshold"
  ) {

    targetWidth =
      Math.min(
        3600,
        Math.max(
          2800,
          width
        )
      );

    processing =
      "threshold";

  }


  /*
    ภาพเต็ม + contrast สูง
  */

  else if (
    variant === "full-strong"
  ) {

    targetWidth =
      Math.min(
        3600,
        Math.max(
          2800,
          width
        )
      );

    processing =
      "strong";

  }


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
          targetWidth
      }
    );


  processOCRCanvas(
    canvas,
    processing
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
   CLEAN OCR
========================================= */

function cleanOCRText(text) {

  if (!text) {
    return "";
  }


  let cleaned =
    String(text)
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      )
      .replace(
        /[ \t]+/g,
        " "
      );


  const corrections = [

    [
      /ช่วขลด/g,
      "ช่วยลด"
    ],

    [
      /ชว่ยลด/g,
      "ช่วยลด"
    ],

    [
      /ชว่ขลด/g,
      "ช่วยลด"
    ],

    [
      /ช่วลด/g,
      "ช่วยลด"
    ],

    [
      /ธีไซเคิลไล้/g,
      "รีไซเคิลได้"
    ],

    [
      /ธีไซเคิลได้/g,
      "รีไซเคิลได้"
    ],

    [
      /รีไซเคิลไล้/g,
      "รีไซเคิลได้"
    ],

    [
      /รีไซเคิลไล/g,
      "รีไซเคิลได้"
    ],

    [
      /รีไซเคิลไต้/g,
      "รีไซเคิลได้"
    ],

    [
      /ผลาสติก/g,
      "พลาสติก"
    ],

    [
      /พลาสตก/g,
      "พลาสติก"
    ],

    [
      /พลาสตค/g,
      "พลาสติก"
    ],

    [
      /โปรดริบประทาน/g,
      "โปรดรับประทาน"
    ],

    [
      /โปรดรบประทาน/g,
      "โปรดรับประทาน"
    ],

    [
      /สําหรับ/g,
      "สำหรับ"
    ],

    [
      /ทัง/g,
      "ทั้ง"
    ]

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


  lines =
    lines.filter(
      function(line) {

        if (
          /^unknown\s*[-–—]?\s*$/i.test(
            line
          )
        ) {
          return false;
        }


        if (
          /^[-–—]\s*unknown\s*[-–—]?\s*$/i.test(
            line
          )
        ) {
          return false;
        }


        return true;

      }
    );


  lines =
    lines.map(
      function(line) {

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

      }
    );


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
      /^Recommend$/i.test(
        current
      ) &&
      /^ed\b/i.test(
        next
      )
    ) {

      mergedLines.push(
        "Recommended" +
        next.substring(2)
      );

      i++;

      continue;

    }


    if (
      /^ed$/i.test(
        current
      ) &&
      /^for\s+/i.test(
        next
      )
    ) {

      mergedLines.push(
        "Recommended " +
        next
      );

      i++;

      continue;

    }


    if (
      /^Recommended$/i.test(
        current
      ) &&
      /^for\s+/i.test(
        next
      )
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
    mergedLines.join(
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
   OCR QUALITY SCORE
========================================= */

function scoreOCRText(
  text,
  confidence
) {

  if (!text) {
    return -9999;
  }


  const clean =
    text.trim();


  const useful =
    clean.match(
      /[ก-๙a-zA-Z0-9]/g
    ) || [];


  const usefulCount =
    useful.length;


  if (
    usefulCount === 0
  ) {
    return -9999;
  }


  const lines =
    clean
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


  const thai =
    clean.match(
      /[ก-๙]/g
    ) || [];


  const english =
    clean.match(
      /[a-zA-Z]/g
    ) || [];


  const strange =
    clean.match(
      /[^ก-๙a-zA-Z0-9\s.,!?()\-:/'%&+’‘“”]/g
    ) || [];


  const spaces =
    clean.match(
      /\s/g
    ) || [];


  let score = 0;


  /*
    จำนวนตัวอักษรมีประโยชน์
  */

  score +=
    Math.min(
      usefulCount,
      160
    ) * 0.45;


  /*
    จำนวนบรรทัด
  */

  score +=
    Math.min(
      lineCount,
      12
    ) * 12;


  /*
    ความมั่นใจ OCR
  */

  score +=
    (Number(confidence) || 0) *
    0.20;


  /*
    ไทย
  */

  if (
    thai.length >= 5
  ) {
    score += 10;
  }


  if (
    thai.length >= 15
  ) {
    score += 8;
  }


  /*
    อังกฤษ
  */

  if (
    english.length >= 5
  ) {
    score += 10;
  }


  /*
    ถ้ามีทั้งไทยและอังกฤษ
    ให้คะแนนเพิ่ม
  */

  if (
    thai.length >= 5 &&
    english.length >= 5
  ) {
    score += 12;
  }


  /*
    ลงโทษอักขระประหลาด
  */

  score -=
    strange.length * 3;


  /*
    ตรวจบรรทัดที่สั้นผิดปกติ
  */

  let garbageLines =
    0;


  lines.forEach(
    function(line) {

      const chars =
        line.match(
          /[ก-๙a-zA-Z0-9]/g
        ) || [];


      if (
        chars.length <= 1
      ) {

        garbageLines++;

      }

    }
  );


  score -=
    garbageLines * 14;


  /*
    ถ้ามีแต่ตัวเลขหรือ
    ตัวอักษรเดี่ยวเยอะ ๆ
  */

  const isolated =
    clean.match(
      /(^|\n)\s*[0-9A-Za-zก-๙]{1,2}\s*(?=\n|$)/g
    ) || [];


  score -=
    isolated.length * 12;


  /*
    อัตรา space
  */

  if (
    usefulCount > 15
  ) {

    const spaceRatio =
      spaces.length /
      usefulCount;


    if (
      spaceRatio > 0.8
    ) {

      score -= 20;

    }

  }


  /*
    ถ้าข้อความมีจำนวนบรรทัด
    เยอะมากแต่แต่ละบรรทัดสั้น
    มักเป็น OCR แตก
  */

  if (
    lineCount >= 15 &&
    usefulCount / lineCount < 5
  ) {

    score -= 50;

  }


  /*
    ตรวจคำอังกฤษที่พบได้บ่อย
    โดยไม่ล็อกเฉพาะประโยคตัวอย่าง
  */

  const commonEnglish =
    /\b(the|you|your|only|who|can|save|is|are|was|were|this|that|to|me|my|for|and|with|from|not|just|have|has)\b/gi;


  const commonMatches =
    clean.match(
      commonEnglish
    ) || [];


  score +=
    Math.min(
      commonMatches.length * 3,
      18
    );


  return score;

}


/* =========================================
   SELECT BEST OCR RESULT
========================================= */

function selectBestOCRResult(
  results
) {

  let best =
    null;

  let bestScore =
    -9999;


  results.forEach(
    function(result) {

      if (
        !result ||
        !result.text
      ) {
        return;
      }


      const cleaned =
        cleanOCRText(
          result.text
        );


      const score =
        scoreOCRText(
          cleaned,
          result.confidence
        );


      console.log(
        "OCR SCORE:",
        result.mode,
        score,
        cleaned
      );


      if (
        score >
        bestScore
      ) {

        best =
          {
            text:
              cleaned,

            confidence:
              result.confidence,

            mode:
              result.mode
          };

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
      text: "",
      confidence: 0,
      mode: ""
    }
  );

}


/* =========================================
   RUN OCR
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


    const results =
      [];


    /*
      OCR หลายรูปแบบ
      โดยเน้นบริเวณข้อความ
    */

    const passes = [

      [
        "center-raw",
        6
      ],

      [
        "center-gray",
        6
      ],

      [
        "center-threshold",
        6
      ],

      [
        "center-strong",
        6
      ],

      [
        "center-raw",
        11
      ],

      [
        "center-gray",
        11
      ],

      [
        "center-threshold",
        11
      ],

      [
        "center-wide",
        6
      ],

      [
        "upper-center",
        6
      ],

      [
        "full-gray",
        6
      ],

      [
        "full-threshold",
        6
      ],

      [
        "full-strong",
        11
      ]

    ];


    for (
      let i = 0;
      i < passes.length;
      i++
    ) {

      const variant =
        passes[i][0];

      const pageMode =
        passes[i][1];


      ocrText.value =
        "กำลังอ่านข้อความ " +
        (i + 1) +
        "/" +
        passes.length +
        "...";


      showStatus(
        "กำลังอ่านข้อความ...",
        "success"
      );


      const imageData =
        await prepareOCRImage(
          file,
          variant
        );


      const result =
        await recognizeOCR(
          worker,
          imageData,
          variant,
          pageMode
        );


      results.push(
        result
      );

    }


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


    ocrText.value =
      bestResult.text;


    console.log(
      "================================="
    );


    console.log(
      "OCR FINAL"
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
      bestResult.text
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
   TRANSLATE BUTTON
========================================= */

translateButton.addEventListener(
  "click",
  function() {

    translateText();

  }
);


/* =========================================
   TRANSLATION NORMALIZATION
========================================= */

function normalizeTranslationLine(
  text
) {

  return String(
    text || ""
  )
    .toLowerCase()
    .replace(
      /[“”‘’"']/g,
      ""
    )
    .replace(
      /[.,!?;:()[\]{}]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* =========================================
   TRANSLATION SIMILARITY
========================================= */

function translationLineSimilarity(
  first,
  second
) {

  const a =
    normalizeTranslationLine(
      first
    )
      .split(" ")
      .filter(Boolean);


  const b =
    normalizeTranslationLine(
      second
    )
      .split(" ")
      .filter(Boolean);


  if (
    !a.length ||
    !b.length
  ) {

    return 0;

  }


  const matrix =
    Array.from(
      {
        length:
          a.length + 1
      },
      function() {

        return new Array(
          b.length + 1
        ).fill(0);

      }
    );


  for (
    let i = 1;
    i <= a.length;
    i++
  ) {

    for (
      let j = 1;
      j <= b.length;
      j++
    ) {

      if (
        a[i - 1] ===
        b[j - 1]
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1] +
          1;

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


  return (
    commonWords /
    Math.max(
      a.length,
      b.length
    )
  );

}


/* =========================================
   NEAR DUPLICATE TRANSLATION
========================================= */

function isNearDuplicateTranslation(
  first,
  second
) {

  const a =
    normalizeTranslationLine(
      first
    );

  const b =
    normalizeTranslationLine(
      second
    );


  if (
    !a ||
    !b
  ) {

    return false;

  }


  if (
    a === b
  ) {

    return true;

  }


  const wordsA =
    a.split(" ")
      .filter(Boolean);


  const wordsB =
    b.split(" ")
      .filter(Boolean);


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


  const similarity =
    translationLineSimilarity(
      first,
      second
    );


  return (
    similarity >=
    0.82
  );

}


/* =========================================
   REMOVE DUPLICATE TRANSLATION
========================================= */

function removeDuplicateTranslationBlocks(
  text
) {

  if (!text) {
    return "";
  }


  let lines =
    String(text)
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      )
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


  /*
    EXACT DUPLICATE
  */

  const seen =
    new Set();

  const exactFiltered =
    [];


  lines.forEach(
    function(line) {

      const key =
        normalizeTranslationLine(
          line
        );


      if (
        key.length >= 12 &&
        seen.has(key)
      ) {

        return;

      }


      if (
        key.length >= 12
      ) {

        seen.add(
          key
        );

      }


      exactFiltered.push(
        line
      );

    }
  );


  lines =
    exactFiltered;


  /*
    NEAR DUPLICATE
  */

  const nearFiltered =
    [];


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

          const oldWords =
            previous
              .split(/\s+/)
              .filter(Boolean);


          const newWords =
            line
              .split(/\s+/)
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


      if (
        !duplicate
      ) {

        nearFiltered.push(
          line
        );

      }

    }
  );


  lines =
    nearFiltered;


  /*
    DUPLICATE BLOCK
  */

  for (
    let blockSize = 3;
    blockSize >= 2;
    blockSize--
  ) {

    let changed =
      true;


    while (
      changed
    ) {

      changed =
        false;


      outerLoop:


      for (
        let i = 0;
        i <=
        lines.length -
        blockSize;
        i++
      ) {

        for (
          let j = i + 1;
          j <=
          lines.length -
          blockSize;
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
                lines[i + k],
                lines[j + k]
              )
            ) {

              same =
                false;

              break;

            }

          }


          if (
            same
          ) {

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


  return lines.join(
    "\n"
  );

}


/* =========================================
   CLEAN TRANSLATION
========================================= */

function cleanTranslationResult(
  text
) {

  if (!text) {
    return "";
  }


  let cleaned =
    String(text)
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      );


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


  cleaned =
    removeDuplicateTranslationBlocks(
      cleaned
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
          method:
            "POST",

          headers:
            {
              "Content-Type":
                "text/plain;charset=utf-8"
            },

          body:
            JSON.stringify(
              {
                action:
                  "translate",

                text:
                  text,

                source:
                  sourceLanguage,

                target:
                  targetLanguage
              }
            )
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (
      !data.success
    ) {

      throw new Error(
        data.message ||
        "ไม่สามารถแปลภาษาได้"
      );

    }


    const translation =
      cleanTranslationResult(
        data.translation ||
        ""
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

    setLoading(
      false
    );

  }

}


/* =========================================
   SPEAK RESULT
========================================= */

speakResultButton.addEventListener(
  "click",
  function() {

    const text =
      resultText.classList.contains(
        "empty"
      )
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
   SPEAK TEXT
========================================= */

function speakText(
  text,
  language
) {

  if (
    !(
      "speechSynthesis" in
      window
    )
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
      resultText.classList.contains(
        "empty"
      )
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
  message =
    "กำลังดำเนินการ..."
) {

  loadingBox.hidden =
    !loading;


  translateButton.disabled =
    loading;


  if (
    loading
  ) {

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


  if (
    type
  ) {

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
  "🌐 ผู้ช่วยแปลภาษา + Advanced General OCR + Smart Duplicate Protection พร้อมใช้งาน"
);
