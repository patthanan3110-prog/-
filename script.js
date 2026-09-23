/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js
========================================= */


/* =========================================
   CONFIG
========================================= */

const API_URL = "https://script.google.com/macros/s/AKfycbyv4x3GhyXGKGQvWfmh-lKForJ_OV7BVtoglDGsGjtNYID8cf1Lwkog3rk3ROLJJsng/exec";

let sourceLanguage = "th";
let targetLanguage = "en";

let tesseractLoaded = false;


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
    sourceLanguageText.textContent = "ภาษาไทย";
  } else {
    sourceLanguageText.textContent = "English";
  }

  if (targetLanguage === "th") {
    targetLanguageText.textContent = "ภาษาไทย";
  } else {
    targetLanguageText.textContent = "English";
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

  if (!file.type.startsWith("image/")) {

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
   LOAD TESSERACT
========================================= */

function loadTesseract() {

  return new Promise(
    function (resolve, reject) {

      if (window.Tesseract) {

        tesseractLoaded =
          true;

        resolve();

        return;
      }

      const oldScript =
        document.querySelector(
          'script[data-tesseract="true"]'
        );

      if (oldScript) {

        oldScript.addEventListener(
          "load",
          function () {

            if (window.Tesseract) {

              tesseractLoaded =
                true;

              resolve();

            } else {

              reject(
                new Error(
                  "ไม่พบ Tesseract OCR"
                )
              );

            }
          }
        );

        oldScript.addEventListener(
          "error",
          function () {

            reject(
              new Error(
                "โหลด Tesseract OCR ไม่สำเร็จ"
              )
            );

          }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

      script.async =
        true;

      script.dataset.tesseract =
        "true";

      script.onload =
        function () {

          if (window.Tesseract) {

            tesseractLoaded =
              true;

            resolve();

          } else {

            reject(
              new Error(
                "ไม่พบ Tesseract OCR"
              )
            );

          }
        };

      script.onerror =
        function () {

          reject(
            new Error(
              "ไม่สามารถโหลด OCR ได้"
            )
          );

        };

      document.head.appendChild(
        script
      );

    }
  );
}


/* =========================================
   IMAGE TO CANVAS
========================================= */

function createOCRCanvas(
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


                /*
                 * ไม่ลดรูปเล็กเกินไป
                 */

                const maxSize =
                  2600;

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


                /*
                 * ขยาย 2 เท่า
                 */

                width *= 2;
                height *= 2;


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
                      willReadFrequently:
                        true
                    }
                  );


                ctx.imageSmoothingEnabled =
                  true;

                ctx.imageSmoothingQuality =
                  "high";


                /*
                 * วาดรูปต้นฉบับ
                 */

                ctx.drawImage(
                  img,
                  0,
                  0,
                  width,
                  height
                );


                /*
                 * ถ้าเป็น normal
                 * ปรับเฉพาะ contrast
                 */

                if (
                  mode === "normal"
                ) {

                  const imageData =
                    ctx.getImageData(
                      0,
                      0,
                      width,
                      height
                    );

                  const data =
                    imageData.data;


                  for (
                    let i = 0;
                    i < data.length;
                    i += 4
                  ) {

                    const r =
                      data[i];

                    const g =
                      data[i + 1];

                    const b =
                      data[i + 2];


                    let gray =
                      (
                        0.299 * r +
                        0.587 * g +
                        0.114 * b
                      );


                    /*
                     * contrast กลาง ๆ
                     */

                    gray =
                      (
                        (gray - 128) *
                        1.25
                      ) + 128;


                    gray =
                      Math.max(
                        0,
                        Math.min(
                          255,
                          gray
                        )
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

                }


                /*
                 * mode = soft
                 *
                 * ปรับภาพนุ่ม ๆ
                 * เหมาะกับกระดาษสี
                 */

                if (
                  mode === "soft"
                ) {

                  const imageData =
                    ctx.getImageData(
                      0,
                      0,
                      width,
                      height
                    );

                  const data =
                    imageData.data;


                  for (
                    let i = 0;
                    i < data.length;
                    i += 4
                  ) {

                    const r =
                      data[i];

                    const g =
                      data[i + 1];

                    const b =
                      data[i + 2];


                    let gray =
                      (
                        0.299 * r +
                        0.587 * g +
                        0.114 * b
                      );


                    gray =
                      (
                        (gray - 128) *
                        1.12
                      ) + 128;


                    gray =
                      Math.max(
                        0,
                        Math.min(
                          255,
                          gray
                        )
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

                }


                /*
                 * threshold
                 *
                 * ใช้เฉพาะกรณีตัวหนังสือดำ
                 */

                if (
                  mode === "threshold"
                ) {

                  const imageData =
                    ctx.getImageData(
                      0,
                      0,
                      width,
                      height
                    );

                  const data =
                    imageData.data;


                  for (
                    let i = 0;
                    i < data.length;
                    i += 4
                  ) {

                    const r =
                      data[i];

                    const g =
                      data[i + 1];

                    const b =
                      data[i + 2];


                    let gray =
                      (
                        0.299 * r +
                        0.587 * g +
                        0.114 * b
                      );


                    gray =
                      gray > 175
                        ? 255
                        : 0;


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

                }


                resolve(canvas);

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
  image,
  language,
  pageMode
) {

  const result =
    await Tesseract.recognize(
      image,
      language,
      {

        logger:
          function (message) {

            updateOCRProgress(
              message
            );

          },

        config: {

          tessedit_pageseg_mode:
            String(pageMode),

          preserve_interword_spaces:
            "1"

        }

      }
    );


  return {

    text:
      cleanOCRText(
        result.data.text
      ),

    confidence:
      Number(
        result.data.confidence || 0
      )

  };

}


/* =========================================
   OCR SCORE
========================================= */

function calculateOCRScore(
  text,
  confidence,
  language
) {

  if (!text) {
    return -999;
  }


  let score =
    confidence;


  /*
   * ความยาวข้อความ
   */

  score +=
    Math.min(
      text.length,
      150
    ) * 0.08;


  /*
   * ภาษาไทย
   */

  const thaiCount =
    (
      text.match(
        /[\u0E00-\u0E7F]/g
      ) || []
    ).length;


  /*
   * อังกฤษ
   */

  const englishCount =
    (
      text.match(
        /[A-Za-z]/g
      ) || []
    ).length;


  if (
    language === "tha"
  ) {

    score +=
      thaiCount * 1.2;

    score -=
      englishCount * 0.15;

  }


  if (
    language === "eng"
  ) {

    score +=
      englishCount * 0.7;

  }


  /*
   * ลงโทษข้อความที่มีสัญลักษณ์
   * มั่วเยอะเกินไป
   */

  const strangeCount =
    (
      text.match(
        /[^ก-๙A-Za-z0-9\s.,!?'"():;/%\-–—]/g
      ) || []
    ).length;


  score -=
    strangeCount * 0.15;


  return score;

}


/* =========================================
   OCR MAIN
========================================= */

async function runOCR(file) {

  ocrCard.hidden =
    false;


  ocrText.value =
    "กำลังโหลดระบบอ่านข้อความ...";


  try {

    await loadTesseract();


    /*
     * เลือกภาษา OCR ตามภาษาต้นฉบับ
     */

    const language =
      sourceLanguage === "th"
        ? "tha"
        : "eng";


    /*
     * สร้างภาพหลายแบบ
     */

    ocrText.value =
      "กำลังเตรียมภาพ..." ;


    const normalCanvas =
      await createOCRCanvas(
        file,
        "normal"
      );


    const softCanvas =
      await createOCRCanvas(
        file,
        "soft"
      );


    const thresholdCanvas =
      await createOCRCanvas(
        file,
        "threshold"
      );


    const attempts = [];


    /*
     * รอบที่ 1
     * normal + block
     */

    ocrText.value =
      "กำลังอ่านข้อความรอบที่ 1...";


    try {

      const result =
        await recognizeOCR(
          normalCanvas,
          language,
          6
        );


      attempts.push({
        ...result,
        score:
          calculateOCRScore(
            result.text,
            result.confidence,
            language
          )
      });

    } catch (error) {

      console.warn(
        "OCR รอบที่ 1:",
        error
      );

    }


    /*
     * รอบที่ 2
     * normal + sparse
     *
     * เหมาะกับข้อความ
     * ที่ไม่ได้เรียงเต็มหน้า
     */

    ocrText.value =
      "กำลังอ่านข้อความรอบที่ 2...";


    try {

      const result =
        await recognizeOCR(
          normalCanvas,
          language,
          11
        );


      attempts.push({
        ...result,
        score:
          calculateOCRScore(
            result.text,
            result.confidence,
            language
          )
      });

    } catch (error) {

      console.warn(
        "OCR รอบที่ 2:",
        error
      );

    }


    /*
     * รอบที่ 3
     * soft
     */

    ocrText.value =
      "กำลังอ่านข้อความรอบที่ 3...";


    try {

      const result =
        await recognizeOCR(
          softCanvas,
          language,
          6
        );


      attempts.push({
        ...result,
        score:
          calculateOCRScore(
            result.text,
            result.confidence,
            language
          )
      });

    } catch (error) {

      console.warn(
        "OCR รอบที่ 3:",
        error
      );

    }


    /*
     * รอบที่ 4
     * threshold
     */

    ocrText.value =
      "กำลังตรวจสอบข้อความอีกครั้ง...";


    try {

      const result =
        await recognizeOCR(
          thresholdCanvas,
          language,
          6
        );


      attempts.push({
        ...result,
        score:
          calculateOCRScore(
            result.text,
            result.confidence,
            language
          )
      });

    } catch (error) {

      console.warn(
        "OCR รอบที่ 4:",
        error
      );

    }


    /*
     * หาผลที่ดีที่สุด
     */

    if (
      attempts.length === 0
    ) {

      throw new Error(
        "OCR ไม่สามารถประมวลผลได้"
      );

    }


    attempts.sort(
      function (a, b) {

        return b.score - a.score;

      }
    );


    const best =
      attempts[0];


    if (!best.text) {

      ocrText.value =
        "ไม่พบข้อความในรูปภาพ";


      showStatus(
        "ไม่พบข้อความในรูปภาพ",
        "error"
      );

      return;

    }


    ocrText.value =
      best.text;


    showStatus(
      "สแกนข้อความเรียบร้อย ✓",
      "success"
    );


    console.log(
      "OCR results:",
      attempts
    );


  } catch (error) {

    console.error(
      "OCR Error:",
      error
    );


    ocrText.value =
      "ไม่สามารถสแกนข้อความจากรูปได้";


    showStatus(
      "เกิดข้อผิดพลาดในการสแกนข้อความ",
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
   * แปลง CRLF
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
   * ตัดช่องว่างหัวท้ายบรรทัด
   */

  cleaned =
    cleaned
      .split("\n")
      .map(
        function (line) {

          return line.trim();

        }
      )
      .join("\n");


  return cleaned.trim();

}


/* =========================================
   OCR PROGRESS
========================================= */

function updateOCRProgress(
  message
) {

  if (!message) {
    return;
  }


  if (
    message.status ===
    "loading tesseract core"
  ) {

    ocrText.value =
      "กำลังโหลดระบบ OCR...";

  }


  else if (
    message.status ===
    "loading language traineddata"
  ) {

    ocrText.value =
      "กำลังเตรียมภาษาไทยและอังกฤษ...";

  }


  else if (
    message.status ===
    "initializing api"
  ) {

    ocrText.value =
      "กำลังเตรียมระบบอ่านข้อความ...";

  }


  else if (
    message.status ===
    "recognizing text"
  ) {

    const progress =
      Math.round(
        (message.progress || 0) *
        100
      );


    ocrText.value =
      "กำลังอ่านข้อความ... " +
      progress +
      "%";

  }

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
      "สแกนข้อความได้แล้ว ขั้นต่อไปเชื่อมระบบแปลภาษา",
      "success"
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
              "application/json"
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
      4000
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
  "🌐 ผู้ช่วยแปลภาษา พร้อมใช้งาน"
);
