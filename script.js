/* =========================================
   ผู้ช่วยแปลภาษา
   Thai ↔ English
   script.js
========================================= */


/* =========================================
   CONFIG
========================================= */

const API_URL = "";

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
   HANDLE SELECTED IMAGE
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
        "กำลังเตรียมรูปภาพเพื่อสแกน...";


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
   PREPROCESS IMAGE
   ========================================= */

function preprocessImage(
  file,
  mode = "normal"
) {

  return new Promise(
    function (resolve, reject) {

      const img =
        new Image();


      const reader =
        new FileReader();


      reader.onload =
        function (event) {

          img.onload =
            function () {

              try {

                /*
                 * จำกัดขนาดเพื่อไม่ให้มือถือ
                 * ทำงานหนักเกินไป
                 */

                const maxWidth =
                  2200;

                const maxHeight =
                  2200;


                let width =
                  img.naturalWidth;

                let height =
                  img.naturalHeight;


                const scale =
                  Math.min(
                    maxWidth / width,
                    maxHeight / height,
                    1
                  );


                width =
                  Math.round(
                    width * scale
                  );

                height =
                  Math.round(
                    height * scale
                  );


                /*
                 * ขยายภาพ 2 เท่า
                 * เพื่อช่วยอ่านข้อความเล็ก
                 */

                const upscale =
                  2;


                width *=
                  upscale;

                height *=
                  upscale;


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


                /*
                 * อ่าน pixel
                 */

                const imageData =
                  ctx.getImageData(
                    0,
                    0,
                    width,
                    height
                  );


                const data =
                  imageData.data;


                /*
                 * ปรับภาพ
                 *
                 * normal:
                 * ขาวดำ + เพิ่ม contrast
                 *
                 * threshold:
                 * ขาว/ดำชัดเจน
                 */

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


                  /*
                   * สูตร grayscale
                   * ให้ความสำคัญกับสีเขียว
                   * ซึ่งเหมาะกับข้อความทั่วไป
                   */

                  let gray =
                    (
                      0.299 * r +
                      0.587 * g +
                      0.114 * b
                    );


                  /*
                   * เพิ่ม contrast
                   */

                  gray =
                    ((gray - 128) * 1.45) +
                    128;


                  gray =
                    Math.max(
                      0,
                      Math.min(
                        255,
                        gray
                      )
                    );


                  if (
                    mode === "threshold"
                  ) {

                    /*
                     * Threshold
                     * สำหรับกระดาษ/ป้าย
                     */

                    gray =
                      gray > 165
                        ? 255
                        : 0;

                  }


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
              "ไม่สามารถอ่านไฟล์รูปภาพได้"
            )
          );

        };


      reader.readAsDataURL(file);

    }
  );

}


/* =========================================
   OCR
========================================= */

async function runOCR(file) {

  ocrCard.hidden =
    false;


  ocrText.value =
    "กำลังโหลดระบบอ่านข้อความ...";


  try {

    await loadTesseract();


    /*
     * เตรียมภาพแบบ grayscale
     */

    ocrText.value =
      "กำลังปรับภาพให้คมชัด...";


    const normalCanvas =
      await preprocessImage(
        file,
        "normal"
      );


    /*
     * OCR รอบแรก
     *
     * PSM 6:
     * เหมาะกับข้อความหลายบรรทัด
     */

    ocrText.value =
      "กำลังอ่านข้อความภาษาไทยและอังกฤษ...";


    const firstResult =
      await Tesseract.recognize(
        normalCanvas,
        "tha+eng",
        {

          logger:
            function (message) {

              updateOCRProgress(
                message
              );

            },

          config: {

            tessedit_pageseg_mode:
              "6",

            preserve_interword_spaces:
              "1"

          }

        }
      );


    const firstText =
      cleanOCRText(
        firstResult.data.text
      );


    const firstConfidence =
      Number(
        firstResult.data.confidence || 0
      );


    /*
     * ถ้าผลแรกสั้นหรือ confidence ต่ำ
     * ทำ OCR รอบที่สองด้วย threshold
     */

    let finalText =
      firstText;


    let finalConfidence =
      firstConfidence;


    if (
      firstText.length < 8 ||
      firstConfidence < 55
    ) {

      ocrText.value =
        "กำลังปรับภาพอีกครั้งเพื่ออ่านข้อความ..." ;


      const thresholdCanvas =
        await preprocessImage(
          file,
          "threshold"
        );


      const secondResult =
        await Tesseract.recognize(
          thresholdCanvas,
          "tha+eng",
          {

            logger:
              function (message) {

                updateOCRProgress(
                  message
                );

              },

            config: {

              tessedit_pageseg_mode:
                "6",

              preserve_interword_spaces:
                "1"

            }

          }
        );


      const secondText =
        cleanOCRText(
          secondResult.data.text
        );


      const secondConfidence =
        Number(
          secondResult.data.confidence || 0
        );


      /*
       * เลือกผลที่มี confidence สูงกว่า
       * แต่ต้องมีข้อความจริงด้วย
       */

      if (
        secondText &&
        (
          secondConfidence >
          finalConfidence
        )
      ) {

        finalText =
          secondText;

        finalConfidence =
          secondConfidence;

      }

    }


    if (!finalText) {

      ocrText.value =
        "ไม่พบข้อความในรูปภาพ";


      showStatus(
        "ไม่พบข้อความในรูปภาพ",
        "error"
      );

      return;

    }


    ocrText.value =
      finalText;


    showStatus(
      "สแกนข้อความเรียบร้อย ✓",
      "success"
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
   CLEAN OCR TEXT
========================================= */

function cleanOCRText(text) {

  if (!text) {
    return "";
  }


  let cleaned =
    String(text);


  /*
   * ลบช่องว่างซ้ำ
   */

  cleaned =
    cleaned.replace(
      /[ \t]+/g,
      " "
    );


  /*
   * ลบบรรทัดว่างซ้ำ
   */

  cleaned =
    cleaned.replace(
      /\n{3,}/g,
      "\n\n"
    );


  /*
   * ตัดช่องว่างต้นท้ายแต่ละบรรทัด
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
   USE OCR TEXT
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


  /*
   * ยังไม่ได้เชื่อม Apps Script
   */

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


  if (language === "th") {

    utterance.lang =
      "th-TH";

  } else {

    utterance.lang =
      "en-US";

  }


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
