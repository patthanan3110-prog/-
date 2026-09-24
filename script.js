/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js
   OCR: Tesseract.js
   OCR 4-PASS + WORD POSITION VERSION
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
        "1"

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
   PREPARE IMAGE
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


                /* ขยายรูปเล็ก */

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


                /* ลดรูปใหญ่ */

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


                /* ORIGINAL */

                if (
                  mode === "original"
                ) {

                  resolve(
                    canvas.toDataURL(
                      "image/png"
                    )
                  );

                  return;

                }


                const imageData =
                  ctx.getImageData(
                    0,
                    0,
                    width,
                    height
                  );

                const pixels =
                  imageData.data;


                /* NORMAL */

                if (
                  mode === "normal"
                ) {

                  const contrast =
                    1.30;

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


                /* THRESHOLD */

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


                /* SHARP */

                if (
                  mode === "sharp"
                ) {

                  const contrast =
                    1.50;

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


                resolve(
                  canvas.toDataURL(
                    "image/png"
                  )
                );


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
   REBUILD TEXT FROM WORD POSITIONS
========================================= */

function rebuildTextFromWords(
  words
) {

  if (
    !Array.isArray(words) ||
    words.length === 0
  ) {

    return "";

  }


  const validWords =
    words
      .filter(
        function (word) {

          return (
            word &&
            word.text &&
            word.text.trim() &&
            word.bbox
          );

        }
      )
      .map(
        function (word) {

          return {

            text:
              word.text.trim(),

            x0:
              Number(word.bbox.x0) || 0,

            y0:
              Number(word.bbox.y0) || 0,

            x1:
              Number(word.bbox.x1) || 0,

            y1:
              Number(word.bbox.y1) || 0

          };

        }
      );


  if (
    validWords.length === 0
  ) {

    return "";

  }


  /*
   * เรียงจากบนลงล่าง
   */

  validWords.sort(
    function (a, b) {

      return a.y0 - b.y0;

    }
  );


  const lines = [];


  /*
   * รวมคำที่อยู่ในระดับเดียวกัน
   */

  validWords.forEach(
    function (word) {

      const centerY =
        (word.y0 + word.y1) / 2;

      const height =
        Math.max(
          1,
          word.y1 - word.y0
        );


      let targetLine =
        null;


      for (
        let i = 0;
        i < lines.length;
        i++
      ) {

        const line =
          lines[i];


        const difference =
          Math.abs(
            centerY -
            line.centerY
          );


        const tolerance =
          Math.max(
            height,
            line.averageHeight
          ) * 0.65;


        if (
          difference <=
          tolerance
        ) {

          targetLine =
            line;

          break;

        }

      }


      if (!targetLine) {

        targetLine = {

          words: [],

          centerY:
            centerY,

          averageHeight:
            height

        };

        lines.push(
          targetLine
        );

      }


      targetLine.words.push(
        word
      );


      targetLine.centerY =
        (
          targetLine.centerY +
          centerY
        ) / 2;


      targetLine.averageHeight =
        (
          targetLine.averageHeight +
          height
        ) / 2;

    }
  );


  /*
   * เรียงบรรทัดบน → ล่าง
   */

  lines.sort(
    function (a, b) {

      return a.centerY -
        b.centerY;

    }
  );


  /*
   * เรียงคำซ้าย → ขวา
   */

  const output =
    lines.map(
      function (line) {

        line.words.sort(
          function (a, b) {

            return a.x0 -
              b.x0;

          }
        );


        return line.words
          .map(
            function (word) {

              return word.text;

            }
          )
          .join(" ");

      }
    );


  return output
    .filter(
      function (line) {

        return line.trim();

      }
    )
    .join("\n");

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
      "1"

  });


  const result =
    await worker.recognize(
      imageData
    );


  const rawText =
    String(
      result &&
      result.data &&
      result.data.text
        ? result.data.text
        : ""
    ).trim();


  const words =
    result &&
    result.data &&
    Array.isArray(
      result.data.words
    )
      ? result.data.words
      : [];


  /*
   * PSM 11 ใช้ตำแหน่งคำ
   * เพื่อจัดลำดับใหม่
   */

  let text =
    rawText;


  if (
    pageMode === 11 &&
    words.length > 0
  ) {

    const rebuilt =
      rebuildTextFromWords(
        words
      );


    if (
      rebuilt &&
      rebuilt.length >=
      Math.min(
        5,
        rawText.length
      )
    ) {

      text =
        rebuilt;

    }

  }


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

      raw:
        rawText,

      rebuilt:
        text
    }
  );


  return {

    text:
      text,

    rawText:
      rawText,

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


  const usefulMatches =
    text.match(
      /[ก-๙a-zA-Z0-9]/g
    );


  const usefulCount =
    usefulMatches
      ? usefulMatches.length
      : 0;


  const totalCount =
    text.replace(
      /\s/g,
      ""
    ).length;


  const usefulRatio =
    totalCount > 0
      ? usefulCount / totalCount
      : 0;


  const thaiMatches =
    text.match(
      /[ก-๙]/g
    );


  const thaiCount =
    thaiMatches
      ? thaiMatches.length
      : 0;


  const englishMatches =
    text.match(
      /[a-zA-Z]/g
    );


  const englishCount =
    englishMatches
      ? englishMatches.length
      : 0;


  const confidence =
    Number(
      result.confidence
    ) || 0;


  let score =
    confidence * 0.65;


  score +=
    usefulRatio * 30;


  /*
   * ภาษาไทย
   */

  if (
    sourceLanguage === "th" &&
    thaiCount >= 3
  ) {

    score += 8;

  }


  if (
    sourceLanguage === "th" &&
    thaiCount >= 10
  ) {

    score += 8;

  }


  /*
   * อังกฤษ
   */

  if (
    englishCount >= 5
  ) {

    score += 3;

  }


  /*
   * มีข้อความจำนวนพอดี
   */

  if (
    usefulCount >= 5
  ) {

    score += 5;

  }


  if (
    usefulCount >= 15
  ) {

    score += 5;

  }


  /*
   * ลงโทษข้อความที่มี
   * เครื่องหมายมั่วเยอะ
   */

  const strangeMatches =
    text.match(
      /[^ก-๙a-zA-Z0-9\s.,!?()\-:/'%]/g
    );


  const strangeCount =
    strangeMatches
      ? strangeMatches.length
      : 0;


  score -=
    Math.min(
      15,
      strangeCount * 0.5
    );


  if (
    usefulCount < 3
  ) {

    score -= 30;

  }


  return score;

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
    function (result) {

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

async function runOCR(file) {

  ocrCard.hidden =
    false;


  ocrText.value =
    "กำลังเตรียมระบบ OCR...";


  try {

    const worker =
      await getTesseractWorker();


    /* =====================================
       PASS 1
       ORIGINAL + PSM 11
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความรอบที่ 1...";


    showStatus(
      "กำลังวิเคราะห์ภาพรอบที่ 1...",
      "success"
    );


    const originalImage =
      await prepareOCRImage(
        file,
        "original"
      );


    const resultOriginal =
      await recognizeOCR(
        worker,
        originalImage,
        "original",
        11
      );


    /* =====================================
       PASS 2
       NORMAL + PSM 6
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความรอบที่ 2...";


    showStatus(
      "กำลังวิเคราะห์ภาพรอบที่ 2...",
      "success"
    );


    const normalImage =
      await prepareOCRImage(
        file,
        "normal"
      );


    const resultNormal =
      await recognizeOCR(
        worker,
        normalImage,
        "normal",
        6
      );


    /* =====================================
       PASS 3
       THRESHOLD + PSM 11
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความรอบที่ 3...";


    showStatus(
      "กำลังวิเคราะห์ภาพรอบที่ 3...",
      "success"
    );


    const thresholdImage =
      await prepareOCRImage(
        file,
        "threshold"
      );


    const resultThreshold =
      await recognizeOCR(
        worker,
        thresholdImage,
        "threshold",
        11
      );


    /* =====================================
       PASS 4
       SHARP + PSM 6
    ===================================== */

    ocrText.value =
      "กำลังอ่านข้อความรอบสุดท้าย...";


    showStatus(
      "กำลังวิเคราะห์ภาพรอบสุดท้าย...",
      "success"
    );


    const sharpImage =
      await prepareOCRImage(
        file,
        "sharp"
      );


    const resultSharp =
      await recognizeOCR(
        worker,
        sharpImage,
        "sharp",
        6
      );


    /* =====================================
       SELECT
    ===================================== */

    const bestResult =
      selectBestOCRResult([
        resultOriginal,
        resultNormal,
        resultThreshold,
        resultSharp
      ]);


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
       CLEAN
    ===================================== */

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


  cleaned =
    cleaned.replace(
      /\r\n/g,
      "\n"
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


  /*
   * ลบบรรทัดที่มีแต่
   * เครื่องหมาย
   */

  cleaned =
    cleaned.replace(
      /^[*|_~`.,;:!?+\-=\/\\]+$/gm,
      ""
    );


  /*
   * ลบช่องว่างต้นท้าย
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
  "🌐 ผู้ช่วยแปลภาษา + Tesseract.js OCR 4-PASS พร้อมใช้งาน"
);
