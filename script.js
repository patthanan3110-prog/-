/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js
   OCR: Tesseract.js
   OCR 2-PASS VERSION
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

      tessedit_pageseg_mode: "6",

      preserve_interword_spaces: "1"

    });

  } catch (error) {

    console.warn(
      "ไม่สามารถตั้งค่า OCR เพิ่มเติม:",
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

  if (sourceLanguage === "th") {

    sourceLanguageText.textContent =
      "ภาษาไทย";

  } else {

    sourceLanguageText.textContent =
      "English";

  }

  if (targetLanguage === "th") {

    targetLanguageText.textContent =
      "ภาษาไทย";

  } else {

    targetLanguageText.textContent =
      "English";

  }

  updatePlaceholder();

}


/* =========================================
   PLACEHOLDER
========================================= */

function updatePlaceholder() {

  if (sourceLanguage === "th") {

    inputText.placeholder =
      "พิมพ์ข้อความภาษาไทยที่ต้องการแปล...";

  } else {

    inputText.placeholder =
      "Type English text to translate...";

  }

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
   PREPARE IMAGE FOR OCR
   mode:
   "normal" = grayscale + contrast
   "threshold" = ขาว/ดำชัดขึ้น
========================================= */

function prepareOCRImage(
  file,
  mode = "normal"
) {

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

              try {

                let width =
                  img.naturalWidth;

                let height =
                  img.naturalHeight;

                const minSize =
                  2400;

                const maxSize =
                  3600;

                /*
                 * ขยายรูปเล็ก
                 */

                if (
                  width < minSize &&
                  height < minSize
                ) {

                  const scale =
                    Math.max(
                      minSize / width,
                      minSize / height
                    );

                  width =
                    Math.round(
                      width * scale
                    );

                  height =
                    Math.round(
                      height * scale
                    );

                }

                /*
                 * ลดรูปที่ใหญ่เกินไป
                 */

                if (
                  width > maxSize ||
                  height > maxSize
                ) {

                  const scale =
                    Math.min(
                      maxSize / width,
                      maxSize / height
                    );

                  width =
                    Math.round(
                      width * scale
                    );

                  height =
                    Math.round(
                      height * scale
                    );

                }

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
                      willReadFrequently: true
                    }
                  );

                ctx.imageSmoothingEnabled =
                  true;

                ctx.imageSmoothingQuality =
                  "high";

                ctx.drawImage(
                  img,
                  0,
                  0,
                  width,
                  height
                );

                const imageData =
                  ctx.getImageData(
                    0,
                    0,
                    width,
                    height
                  );

                const pixels =
                  imageData.data;

                /*
                 * NORMAL
                 * Grayscale + contrast
                 */

                if (
                  mode === "normal"
                ) {

                  const contrast =
                    1.35;

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

                /*
                 * THRESHOLD
                 * แปลงเป็นขาว/ดำ
                 *
                 * ช่วยกรณีตัวหนังสือ
                 * มีความต่างจากพื้นหลังชัด
                 */

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
                      gray < 165
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

                ctx.putImageData(
                  imageData,
                  0,
                  0
                );

                const dataURL =
                  canvas.toDataURL(
                    "image/png"
                  );

                resolve(dataURL);

              } catch (error) {

                reject(error);

              }

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
   OCR ONE PASS
========================================= */

async function recognizeOCR(
  worker,
  imageData,
  modeName
) {

  console.log(
    "เริ่ม OCR:",
    modeName
  );

  /*
   * ใช้ PSM 6
   * เหมาะกับข้อความหลายบรรทัด
   */

  await worker.setParameters({

    tessedit_pageseg_mode: "6",

    preserve_interword_spaces: "1"

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
   SCORE OCR RESULT
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
    result.text.trim();

  if (!text) {
    return -999;
  }

  /*
   * จำนวนตัวอักษรที่เป็น
   * ไทย / อังกฤษ / ตัวเลข
   */

  const usefulMatches =
    text.match(
      /[ก-๙a-zA-Z0-9]/g
    );

  const usefulCount =
    usefulMatches
      ? usefulMatches.length
      : 0;

  /*
   * จำนวนตัวอักษรทั้งหมด
   */

  const totalCount =
    text.replace(
      /\s/g,
      ""
    ).length;

  /*
   * ถ้ามีข้อความที่อ่านได้จริง
   * ให้คะแนนเพิ่ม
   */

  const usefulRatio =
    totalCount > 0
      ? usefulCount / totalCount
      : 0;

  /*
   * ความยาวพอดี
   * ป้องกันผลสั้นเกินไป
   */

  let lengthBonus =
    0;

  if (usefulCount >= 5) {
    lengthBonus += 10;
  }

  if (usefulCount >= 15) {
    lengthBonus += 10;
  }

  /*
   * ค่าความมั่นใจของ Tesseract
   */

  const confidence =
    Number(result.confidence) || 0;

  /*
   * คะแนนรวม
   */

  const score =
    (confidence * 0.75) +
    (usefulRatio * 20) +
    lengthBonus;

  return score;

}


/* =========================================
   SELECT BEST OCR RESULT
========================================= */

function selectBestOCRResult(
  results
) {

  if (
    !results ||
    results.length === 0
  ) {

    return {
      text: "",
      confidence: 0,
      mode: ""
    };

  }

  let best =
    results[0];

  let bestScore =
    scoreOCRResult(
      best
    );

  for (
    let i = 1;
    i < results.length;
    i++
  ) {

    const current =
      results[i];

    const currentScore =
      scoreOCRResult(
        current
      );

    console.log(
      "OCR SCORE:",
      current.mode,
      currentScore
    );

    if (
      currentScore >
      bestScore
    ) {

      best =
        current;

      bestScore =
        currentScore;

    }

  }

  console.log(
    "เลือก OCR:",
    best.mode,
    "score:",
    bestScore,
    "confidence:",
    best.confidence
  );

  return best;

}


/* =========================================
   TESSERACT OCR
========================================= */

async function runOCR(file) {

  ocrCard.hidden =
    false;

  ocrText.value =
    "กำลังเตรียมระบบ OCR...";

  try {

    /* ---------------------------------------
       STEP 1
       เตรียม Tesseract
    --------------------------------------- */

    const worker =
      await getTesseractWorker();


    /* ---------------------------------------
       STEP 2
       เตรียมรูปแบบที่ 1
       Grayscale + Contrast
    --------------------------------------- */

    ocrText.value =
      "กำลังปรับภาพเพื่ออ่านข้อความ...";

    showStatus(
      "กำลังวิเคราะห์ภาพรอบที่ 1...",
      "success"
    );

    const normalImage =
      await prepareOCRImage(
        file,
        "normal"
      );


    /* ---------------------------------------
       STEP 3
       OCR รอบที่ 1
    --------------------------------------- */

    const resultNormal =
      await recognizeOCR(
        worker,
        normalImage,
        "normal"
      );


    /* ---------------------------------------
       STEP 4
       เตรียมภาพแบบที่ 2
       ขาว / ดำ
    --------------------------------------- */

    ocrText.value =
      "กำลังวิเคราะห์ภาพรอบที่ 2...";

    showStatus(
      "กำลังวิเคราะห์ภาพอีกรอบ...",
      "success"
    );

    const thresholdImage =
      await prepareOCRImage(
        file,
        "threshold"
      );


    /* ---------------------------------------
       STEP 5
       OCR รอบที่ 2
    --------------------------------------- */

    const resultThreshold =
      await recognizeOCR(
        worker,
        thresholdImage,
        "threshold"
      );


    /* ---------------------------------------
       STEP 6
       เลือกผลที่ดีที่สุด
    --------------------------------------- */

    const bestResult =
      selectBestOCRResult([
        resultNormal,
        resultThreshold
      ]);


    /* ---------------------------------------
       ไม่มีข้อความ
    --------------------------------------- */

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


    /* ---------------------------------------
       STEP 7
       ทำความสะอาด
    --------------------------------------- */

    const cleanedText =
      cleanOCRText(
        bestResult.text
      );


    ocrText.value =
      cleanedText;


    console.log(
      "OCR FINAL:",
      {
        mode:
          bestResult.mode,

        confidence:
          bestResult.confidence,

        text:
          cleanedText
      }
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
   CLEAN OCR
========================================= */

function cleanOCRText(text) {

  if (!text) {
    return "";
  }

  let cleaned =
    String(text);

  /*
   * CRLF → LF
   */

  cleaned =
    cleaned.replace(
      /\r\n/g,
      "\n"
    );

  /*
   * ลดช่องว่างติดกัน
   */

  cleaned =
    cleaned.replace(
      /[ \t]+/g,
      " "
    );

  /*
   * ลดบรรทัดว่าง
   */

  cleaned =
    cleaned.replace(
      /\n{3,}/g,
      "\n\n"
    );

  /*
   * ลบอักขระแปลก ๆ
   * ที่ Tesseract ชอบสร้าง
   */

  cleaned =
    cleaned.replace(
      /^[*|_~`]+$/gm,
      ""
    );

  /*
   * ตัดช่องว่างหัวท้ายแต่ละบรรทัด
   */

  cleaned =
    cleaned
      .split("\n")
      .map(
        function (line) {

          return line.trim();

        }
      )
      .filter(
        function (line) {

          return line.length > 0;

        }
      )
      .join("\n");

  return cleaned.trim();

}


/* =========================================
   USE OCR
========================================= */

useOcrButton.addEventListener(
  "click",
  function () {

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
  function () {

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
  function () {

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
  function () {

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
  function () {

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
    function () {

      showStatus(
        "กำลังออกเสียง...",
        "success"
      );

    };

  utterance.onend =
    function () {

      hideStatus();

    };

  utterance.onerror =
    function () {

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
  async function () {

    const text =
      resultText.classList.contains("empty")
        ? ""
        : resultText.textContent.trim();

    if (!text) {

      showStatus(
        "ยังไม่มีข้อความให้คัดลอก",
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
      function () {

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
  function (event) {

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
  "🌐 ผู้ช่วยแปลภาษา + Tesseract.js OCR 2-PASS พร้อมใช้งาน"
);
