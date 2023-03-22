const fs = require("fs");
const readline = require("readline");
const { Parser } = require("json2csv");
const util = require("util");

const partsOfSpeech = [
  "adn",
  "adv",
  "aux",
  "conj",
  "cp",
  "i-adj",
  "interj",
  "n",
  "na-adj",
  "num",
  "p",
  "v",
  "prefix",
  "pron",
  "suffix",
  "p case",
  "p conj",
  "p disc",
];
const particles = ["case", "conj", "disc"];

const inputFilePath = "input2.txt";

function isJapanese(str) {
  // Regular expression to match Japanese characters
  const regex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

  // Check if any Japanese character is present in the string
  return regex.test(str);
}
function isEnglish(str) {
  // Regular expression to match English letters
  const regex = /[A-Za-z]/;

  // Check if any English letter is present in the string
  return regex.test(str);
}

function isNumber(str) {
  // Regular expression to match numbers
  const regex = /\d/;

  // Check if any number is present in the string
  return regex.test(str);
}

const readInterface = readline.createInterface({
  input: fs.createReadStream(inputFilePath),
  console: false,
});

let fullText = "";
readInterface.on("line", (line) => {
  fullText += " " + line;
});

readInterface.on("close", () => {
  const values = fullText.split(/[\s。.]+/);
  const filteredArray = values.filter(
    (item) => item !== "|" /*&& !isNumber(item)*/
  );

  let count = 0;

  //break up the array into a 2d array
  let newArray = [];
  let tempArray = [];
  for (let i = 0; i < filteredArray.length; i++) {
    if (isNumber(filteredArray[i])) {
      // check if the string contains a Japanese character
      if (tempArray.length > 0) {
        // add the current temp array to the new array
        newArray.push(tempArray);
      }

      tempArray = [filteredArray[i]]; // start a new temp array with the current string
    } else {
      tempArray.push(filteredArray[i]); // add the current string to the temp array
    }
  }

  if (tempArray.length > 0) {
    // add the last temp array to the new array
    newArray.push(tempArray);
  }

  let newest = newArray.filter((item) => item.length !== 1);

  for (let i = 0; i < newest.length; i++) {
    //iterate on all elements within arrays
    for (let j = 0; j < newest[i].length; j++) {
      //remove all values until the first index value is japanese
      if (!isJapanese(newest[i][0])) {
        newest[i].splice(0, 1);
      }

      if (isNumber(newest[i][j])) {
        newest[i].splice(j, 1);
        j--;
      }
    }
    //if there never was any japanese then delete the row
    if (!isJapanese(newest[i][0])) {
      newest.splice(i, 1);
      i--;
    }
    //if the second value is not english then also delete it, it's a bug
    if (!isEnglish([i][1])) {
      newest.splice(i, 1);
      i--;
    }

    //if the first value has an english transliteration, cut the transliteration out
    //and push it into the array at index [1] (without overwriting)
    if (isEnglish(newest[i][0])) {
      //iterate through this word
      let firstEnglishIndex = 0;
      for (let j = 0; j < newest[i][0].length; j++) {
        if (isEnglish(newest[i][0][j])) {
          firstEnglishIndex = j;
          break;
        }
      }
      const secondHalf = newest[i][0].substring(firstEnglishIndex);
      const firstHalf = newest[i][0].substring(0, firstEnglishIndex);

      newest[i][0] = firstHalf; // replace original string with first half
      newest[i].splice(0, 1, firstHalf, secondHalf);
    }
    if (isJapanese(newest[i][1])) {
      //if there's any japanese in the second part, then delete the row!

      newest.splice(i, 1);
      i--;
    }
  }

  //combine all values with a space starting at index 1 until you reach a partsOfSpeech

  for (let i = 0; i < newest.length; i++) {
    if (!partsOfSpeech.includes(newest[i][2])) {
      newest.splice(i, 1);
      i--;
    } else if (particles.includes(newest[i][3])) {
      //REMOVE ALL COMPLICATED PARTICLES
      newest.splice(i, 1);
      i--;
    }
  }

  //combine newest[i][3] with all preceeding entries into a new value until
  //it's japanese, in which case, splice the new value into the old and
  //continue to the next value.
  for (let i = 0; i < newest.length; i++) {
    if (isJapanese(newest[i][4])) {
      //index 4 is already japanese, then there's nothing to fix.
      continue;
    }
    let temp = newest[i][3];
    let deletedCount = 1;
    for (let j = 4; j < newest[i].length; j++) {
      if (!isJapanese(newest[i][j])) {
        deletedCount++;
        temp = temp + " " + newest[i][j];
      } else {
        console.log(temp);
        newest[i].splice(3, deletedCount, temp);
        break;
      }
    }
  }

  //remove any values that don't have japanese text in the correct place (53 total)
  for (let i = 0; i < newest.length; i++) {
    if (!isJapanese(newest[i][4])) {
      newest.splice(i, 1);
      i--;
    }
  }

  //combine japanese sentences that got split up
  //if newest[i][6] is japanese, then delete the row (removes 6 total)
  //otherwise combine newest[i][4] and newest[i][5] if they're both japanese
  for (let i = 0; i < newest.length; i++) {
    if (isJapanese(newest[i][6])) {
      newest.splice(i, 1);
      i--;
    }
    if (isJapanese(newest[i][5])) {
      let temp = newest[i][4] + "" + newest[i][5];
      newest[i].splice(4, 2, temp);
    }
  }

  //if the 5th index is '—' then remove that value
  for (let i = 0; i < newest.length; i++) {
    if (newest[i][5] === "—") {
      newest[i].splice(5, 1);
    }
  }

  //combine all of the values from index 5 to the end into one

  for (let i = 0; i < newest.length; i++) {
    let temp = newest[i][5];
    let deletedCount = 1;
    for (let j = 6; j < newest[i].length; j++) {
        temp = temp + " " + newest[i][j];
        deletedCount++;
    }
    newest[i].splice(5, deletedCount, temp);

  }

  //
  //

  const csvData = newest
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  // Write the CSV data to a file
  fs.writeFile("newest.csv", csvData, (err) => {
    if (err) throw err;
    console.log("CSV file saved successfully " + count);
  });
});
