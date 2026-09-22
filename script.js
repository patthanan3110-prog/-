/* =========================================
   ผู้ช่วยแปลภาษา
   script.js
   Thai ↔ English
========================================= */


/* =========================================
   CONFIG
========================================= */

// เดี๋ยวจะใส่ URL Google Apps Script ตรงนี้
// หลังจากสร้าง Code.gs เสร็จ
const API_URL = "";


/* =========================================
   LANGUAGE
========================================= */

let sourceLanguage = "th";
let targetLanguage = "en";


/* =========================================
   ELEMENTS
========================================= */

const inputText = document.getElementById("inputText");

const resultText = document.getElementById("resultText");

const ocrText = document.getElementById("ocrText");

const ocrCard = document.getElementById("ocrCard");

const loadingBox = document.getElementById("loadingBox");

const loadingText = document.getElementById("loadingText");

const statusMessage = document.getElementById("statusMessage");

const cameraInput = document.getElementById("cameraInput");

const galleryInput = document.getElementById("galleryInput");

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
   LANGUAGE TEXT
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

swapLanguageButton.addEventListener("click", function () {

  const oldSource = sourceLanguage;

  sourceLanguage = targetLanguage;

  targetLanguage = oldSource;

  updateLanguageUI();


  /*
    ถ้ามีคำแปลอยู่แล้ว
    สลับข้อความต้นฉบับกับคำแปล
  */

  const currentInput =
    inputText.value.trim();

  const currentResult =
    resultText.classList.contains("empty")
      ? ""
      : resultText.textContent.trim();


  if (currentInput && currentResult) {

    inputText.value = currentResult;

    resultText.textContent = currentInput;

    resultText.classList.remove("empty");

  }


  showStatus(
    "สลับภาษาเรียบร้อย",
    "success"
  );

});


/* =========================================
   CAMERA
========================================= */

cameraButton.addEventListener("click", function () {

  cameraInput.click();

});


/* =========================================
   GALLERY
========================================= */

galleryButton.addEventListener("click", function () {

  galleryInput.click();

});


/* =========================================
   CAMERA IMAGE
========================================= */

cameraInput.addEventListener("change", function (event) {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  handleSelectedImage(file);

});


/* =========================================
   GALLERY IMAGE
========================================= */

galleryInput.addEventListener("change", function (event) {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  handleSelectedImage(file);

});


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


  const reader = new FileReader();


  reader.onload = function (event) {

    imagePreview.src = event.target.result;

    imagePreviewContainer.hidden = false;

    showStatus(
      "เลือกรูปเรียบร้อย กำลังเตรียมสแกนข้อความ",
      "success"
    );


    /*
      ส่งรูปไป OCR
      จะเชื่อมกับ Google Apps Script
      ในขั้นต่อไป
    */

    runOCR(file);

  };


  reader.onerror = function () {

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

    imagePreview.src = "";

    imagePreviewContainer.hidden = true;

    cameraInput.value = "";

    galleryInput.value = "";

  }
);


/* =========================================
   CLEAR INPUT
========================================= */

clearInputButton.addEventListener(
  "click",
  function () {

    inputText.value = "";

    resultText.textContent =
      "คำแปลจะแสดงที่นี่";

    resultText.classList.add("empty");

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
    ถ้ายังไม่มี API
    จะแจ้งให้รู้ก่อน
  */

  if (!API_URL) {

    resultText.textContent =
      "ระบบแปลภาษาจะเชื่อมต่อในขั้นตอนถัดไป";

    resultText.classList.remove("empty");

    showStatus(
      "ข้อความพร้อมแล้ว ขั้นต่อไปจะเชื่อมระบบแปลภาษา",
      "success"
    );

    return;
  }


  setLoading(
    true,
    "กำลังแปลภาษา..."
  );


  try {

    const response = await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        action: "translate",

        text: text,

        source: sourceLanguage,

        target: targetLanguage

      })

    });


    if (!response.ok) {

      throw new Error(
        "HTTP " + response.status
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

    resultText.classList.remove("empty");


    showStatus(
      "แปลภาษาเรียบร้อย",
      "success"
    );


  } catch (error) {

    console.error(
      "Translation Error:",
      error
    );


    resultText.textContent =
      "ไม่สามารถแปลภาษาได้ในขณะนี้";

    resultText.classList.remove("empty");


    showStatus(
      "เกิดข้อผิดพลาดในการแปลภาษา",
      "error"
    );


  } finally {

    setLoading(false);

  }

}


/* =========================================
   OCR
========================================= */

async function runOCR(file) {

  ocrCard.hidden = false;

  ocrText.value =
    "กำลังอ่านข้อความจากรูปภาพ...";


  /*
    ตอนนี้เตรียมระบบไว้ก่อน
    เดี๋ยวจะเชื่อม OCR จริงกับ Apps Script
  */

  if (!API_URL) {

    ocrText.value =
      "ระบบสแกนข้อความจากรูปจะเชื่อมต่อในขั้นตอนถัดไป";

    return;
  }


  try {

    const base64 =
      await fileToBase64(file);


    const response =
      await fetch(API_URL, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          action: "ocr",

          image: base64

        })

      });


    if (!response.ok) {

      throw new Error(
        "HTTP " + response.status
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "OCR ไม่สำเร็จ"
      );

    }


    ocrText.value =
      data.text || "";


    showStatus(
      "สแกนข้อความเรียบร้อย",
      "success"
    );


  } catch (error) {

    console.error(
      "OCR Error:",
      error
    );


    ocrText.value =
      "ไม่สามารถอ่านข้อความจากรูปได้";


    showStatus(
      "ไม่สามารถสแกนข้อความได้",
      "error"
    );

  }

}


/* =========================================
   FILE TO BASE64
========================================= */

function fileToBase64(file) {

  return new Promise(
    function (resolve, reject) {

      const reader =
        new FileReader();


      reader.onload = function () {

        resolve(
          reader.result
        );

      };


      reader.onerror = function () {

        reject(
          new Error(
            "ไม่สามารถอ่านไฟล์ได้"
          )
        );

      };


      reader.readAsDataURL(file);

    }
  );

}


/* =========================================
   USE OCR TEXT
========================================= */

useOcrButton.addEventListener(
  "click",
  function () {

    const text =
      ocrText.value.trim();


    if (!text) {

      showStatus(
        "ไม่พบข้อความที่สแกนได้",
        "error"
      );

      return;
    }


    inputText.value = text;


    ocrCard.hidden = true;


    showStatus(
      "นำข้อความมาใส่ในช่องแปลแล้ว",
      "success"
    );


    inputText.focus();

  }
);


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

function speakText(text, language) {

  if (!("speechSynthesis" in window)) {

    showStatus(
      "เบราว์เซอร์นี้ไม่รองรับการออกเสียง",
      "error"
    );

    return;
  }


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(text);


  if (language === "th") {

    utterance.lang = "th-TH";

  } else {

    utterance.lang = "en-US";

  }


  utterance.rate = 0.9;

  utterance.pitch = 1;

  utterance.volume = 1;


  utterance.onstart = function () {

    showStatus(
      "กำลังออกเสียง...",
      "success"
    );

  };


  utterance.onend = function () {

    hideStatus();

  };


  utterance.onerror = function () {

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

      /*
        สำรองกรณี Clipboard API ใช้ไม่ได้
      */

      const textarea =
        document.createElement("textarea");


      textarea.value = text;

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand("copy");

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

  loadingBox.hidden = !loading;

  translateButton.disabled = loading;

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


  statusMessage.hidden = false;


  clearTimeout(
    window.statusTimer
  );


  window.statusTimer =
    setTimeout(
      function () {

        hideStatus();

      },
      3500
    );

}


function hideStatus() {

  statusMessage.hidden = true;

}


/* =========================================
   ENTER SHORTCUT
========================================= */

inputText.addEventListener(
  "keydown",
  function (event) {

    /*
      Ctrl + Enter หรือ
      Command + Enter = แปล
    */

    if (
      (event.ctrlKey || event.metaKey) &&
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

resultText.classList.add("empty");

console.log(
  "🌐 ผู้ช่วยแปลภาษาเริ่มทำงานแล้ว"
);
