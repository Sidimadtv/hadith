import * as util from "./Utility/dataset.js";

const langBtn = document.getElementById("lang");
const langText = document.getElementById("langText");
const title = document.getElementsByTagName("title");
const questionStyle = document.getElementById("questionStyle");
const verseElement = document.getElementById("verse");
const answersBox = document.getElementById("choiceBoxes");
const overlay = document.getElementById("overlay");
const overlayBtn = overlay.querySelector("button");
const heartsEL = document.getElementById("hearts");
const correctAnsEL = document.getElementById("correctAnsCount");
const consequtiveEL = document.getElementById("fire");
const continueAnsEL = document.getElementById("answer-btn");
const overlayTextEL = document.getElementById("respText");
const information = document.getElementById("info");
const resp = information.querySelector("#resp");
const image = information.querySelector("img");

null === localStorage.getItem("Arabic")
  ? localStorage.setItem("Arabic", "true")
  : 0;

let audio = ``;
let Arabic = JSON.parse(localStorage.getItem("Arabic"));
let VerseAR = "Ar";
let VerseEN = "En";
let number = 0;
let correctAns;
let hearts = 3;
let correctAnswers = 0;
let consequtive = 0;
let highest = 0;
let randomVerse;

const initializeGame = () => {
  questionStyle.innerText = Arabic
    ? "هذه الأية من اي سورة ؟"
    : "What Surah Is This Verse From?";

  langText.innerText = Arabic ? "English" : "عربي";
  title[0].innerText = Arabic ? "مسابقة القرآن" : "Quran Quiz";
  if (!Arabic) overlay.classList.toggle("direction");

  resp.innerHTML = Arabic
    ? `<Strong>إجابة صحيحة!</Strong>`
    : `<Strong>Correct Answer!</Strong>`;

  continueAnsEL.innerText = Arabic ? "إستمرار" : "Continue";

  overlay.addEventListener("click", (event) => {
    if (event.target.id === "overlay") {
      off();
    }
  });
};

initializeGame();

const updateScoreUI = () => {
  heartsEL.innerText = hearts;
  correctAnsEL.innerText = correctAnswers;
  consequtiveEL.innerText = consequtive;
};

const gameOver = () => {
  const resultDivEL = document.querySelectorAll("nav div");

  resp.innerHTML = Arabic
    ? `<Strong>إنتهت اللعبه!</Strong>`
    : `<Strong>Game Over!</Strong>`;

  getVerseInformation();

  img.src = "assets/images/bheart.png";
  hearts = 0;
  consequtive = highest;
  updateScoreUI();
  //fix
  overlay.addEventListener("click", (event) => {
    if (event.target.id === "overlay") {
      location.reload();
    }
  });

  continueAnsEL.innerText = Arabic ? "إعادة" : "Restart";
  continueAnsEL.removeEventListener("click", off);
  continueAnsEL.addEventListener("click", () => location.reload());

  const clonedNode = resultDivEL[1].cloneNode(true);
  clonedNode.classList.add("directionLtr");
  resp.parentElement.parentElement.prepend(clonedNode);
  overlay.classList.remove("invisible");
};

langBtn.addEventListener("click", () => {
  Arabic = !Arabic;
  localStorage.setItem("Arabic", `${Arabic}`);
  langText.innerText = Arabic ? "English" : "عربي";
  title[0].innerText = Arabic ? "مسابقة القرآن" : "Quran Quiz";
  questionStyle.innerText = Arabic
    ? "هذه الأية من اي سورة ؟"
    : "What Surah Is This Verse From?";
  verseElement.innerHTML = Arabic ? VerseAR : VerseEN;

  resp.innerHTML = Arabic
    ? `<Strong>إجابة صحيحة!</Strong>`
    : `<Strong>Correct Answer!</Strong>`;

  continueAnsEL.innerText = Arabic ? "إستمرار" : "Continue";

  answersBox.innerHTML = "";
  getVerseInformation();
  overlay.classList.toggle("direction");
  renderAnswers();
});

const set = new Set();

async function getNextQuestion() {
  overlayTextEL.innerText = Arabic
    ? `.هذة سورة ${util.surahListAr[correctAns]} وهي سورة رقم ${correctAns} في القرآن الكريم`
    : (respText.innerText = `This is Surat ${util.surahListEn[correctAns]} which is listed as number ${correctAns} in the holy Quran.`);
  set.clear();
  correctAns = util.randomInteger(2, 114);
  set.add(correctAns);
  try {
    randomVerse = util.randomInteger(2, util.NumberOfVerses[correctAns]);
    const verseInfo = await fetch(
      `https://api.alquran.cloud/v1/ayah/${correctAns}:${randomVerse}/editions/quran-uthmani,en.pickthall`
    );

    const parsedVerseInfo = await verseInfo.json();
    // console.log(parsedVerseInfo);
    VerseAR = parsedVerseInfo.data[0].text;
    VerseEN = parsedVerseInfo.data[1].text;
    verseElement.innerText = Arabic ? VerseAR : VerseEN;
  } catch (err) {
    verseElement.innerHTML = "Connection failed try again later";
    throw err;
  }

  renderAnswers();
}

getNextQuestion();

async function getSound(verse) {
  try {
    const soundDivEl = document.getElementById("soundDiv");
    const sound = await fetch(
      `https://api.alquran.cloud/v1/surah/${correctAns}/ar.shaatree`
    );
    const parsedSoundInfo = await sound.json();
    const audioSrc = parsedSoundInfo.data.ayahs[verse - 1].audio;
    const audioEl = document.createElement("audio");
    const nextAyah = document.createElement("button");
    audioEl.controls = true;

    const sourceEl = document.createElement("source");
    sourceEl.src = audioSrc;
    sourceEl.type = "audio/mpeg";

    const soundSection = soundDivEl.querySelector("div");
    const KariNameEl = document.createElement('div');
    KariNameEl.innerHTML= Arabic? `<div style="font-weight:100;">القارئ: ابوبكر الشاطري</div>`:`Reciter: Abu Bakr Al Shatri`;

    soundSection.innerHTML = "";
    soundSection.append(audioEl, KariNameEl);
    audioEl.append(sourceEl);
    // console.log(soundDivEl);
  } catch (error) {
    answersBox.innerHTML = "failed try again later";
  }
}

const invalidAnswer = () => {
  highest = highest <= consequtive ? consequtive : highest;
  consequtive = 0;
  if (hearts === 1) {
    gameOver();
    hearts = 1;
  } else {
    event.target.classList.add("dashed");
    event.target.disabled = true;
    hearts--;
  }
};

const validAnswer = () => {
  overlay.classList.remove("invisible");
  getNextQuestion();
  correctAnswers++;
  consequtive++;
};

const generateAnswer = () => {
  const randomAnswer = util.randomInteger(2, 114);
  let answer = set.has(randomAnswer) ? generateAnswer() : randomAnswer;
  return answer;
};

const createAnswerEL = (isCorrect = false) => {
  const choice = document.createElement("input");
  const choiceText = document.createElement("label");
  let randomAnswer = generateAnswer();
  set.add(randomAnswer);

  choice.classList.add("choice");
  choice.type = "radio";
  choice.name = "option";
  choiceText.innerText = Arabic
    ? util.surahListAr[isCorrect ? correctAns : randomAnswer]
    : util.surahListEn[isCorrect ? correctAns : randomAnswer];
  return [choice, choiceText];
};

const renderAnswers = () => {
  answersBox.innerHTML = "";
  let correctChoice = util.randomInteger(0, 3);
  for (let i = 0; i < 4; i++) {
    const answer = createAnswerEL(i === correctChoice ? true : false);
    answersBox.append(...answer);
  }
  // console.log(set);
};

answersBox.addEventListener("click", (event) => {
  if (event.target.closest("label")) {
    let clicked = event.target.closest("label").classList.contains("dashed");
    let answer = event.target.closest("label").innerText;
    const correctAnswer =
      answer === util.surahListAr[correctAns] ||
      answer === util.surahListEn[correctAns];
    correctAnswer ? validAnswer() : clicked ? null : invalidAnswer();
    updateScoreUI();
  }
});

getSound(randomVerse);

const off = () => {
  overlay.classList.add("invisible");
  getSound(randomVerse);
  getVerseInformation();
};
continueAnsEL.addEventListener("click", off);

function getVerseInformation() {
  overlayTextEL.innerText = Arabic
    ? `هذة سورة ${util.surahListAr[correctAns]} وهي سورة رقم ${correctAns} في القرآن الكريم`
    : (respText.innerText = `This is Surat ${util.surahListEn[correctAns]} which is listed as number ${correctAns} in the holy Quran`);
}
